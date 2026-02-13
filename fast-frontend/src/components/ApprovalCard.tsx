import { CheckIcon, NoSymbolIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import type { ApprovalRecord } from '../shared/types';

interface ApprovalCardProps {
  approval: ApprovalRecord;
  onApprove?: (id: number, comments: string) => void;
  onReject?: (id: number, comments: string) => void;
  isReviewer?: boolean;
  onViewTicket?: (ticketId: number) => void;
  comments?: string;
  onCommentsChange?: (value: string) => void;
  actionLoading?: boolean;
}

export default function ApprovalCard({
  approval,
  onApprove,
  onReject,
  isReviewer,
  onViewTicket,
  comments,
  onCommentsChange,
  actionLoading,
}: ApprovalCardProps) {
  const isPending = approval.decision === 'PENDING';

  const handleAction = (action: 'approve' | 'reject') => {
    const handler = action === 'approve' ? onApprove : onReject;
    if (!handler) return;
    if (onCommentsChange !== undefined) {
      handler(approval.id, comments ?? '');
    } else {
      const comment = prompt(
        action === 'approve' ? 'Enter approval comments (optional):' : 'Enter rejection reason:'
      );
      if (action === 'reject' && !comment) return;
      if (comment !== null) handler(approval.id, comment);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const approvalRoleLabel = (role: string | undefined) => {
    if (!role) return 'Approval';
    if (role === 'REVIEWER') return 'Finance';
    if (role === 'APPROVER') return 'Tech';
    if (role === 'RTB_OWNER') return 'RTB';
    return role.replace(/_/g, ' ');
  };

  const statusStyles = {
    PENDING: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    APPROVED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    REJECTED: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  };
  const statusStyle = statusStyles[approval.decision as keyof typeof statusStyles] ?? statusStyles.PENDING;

  return (
    <article
      className={`
        relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/95 text-left
        shadow-sm ring-1 ring-slate-200/60 dark:ring-slate-600/50
        transition-all duration-200 hover:shadow-md hover:ring-slate-300/60 dark:hover:ring-slate-500/50
        ${isPending ? 'ring-amber-400/30 dark:ring-amber-500/20' : ''}
      `}
    >
      {/* Top accent bar */}
      <div
        className={`h-1 ${isPending ? 'bg-amber-500' : approval.decision === 'APPROVED' ? 'bg-emerald-500' : 'bg-rose-500'}`}
        aria-hidden
      />

      <div className="p-5">
        {/* Header: ticket # + status pill */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {onViewTicket ? (
              <button
                type="button"
                onClick={() => onViewTicket(approval.fastProblemId)}
                className="font-mono text-sm font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 rounded"
              >
                #{approval.fastProblemId}
              </button>
            ) : (
              <span className="font-mono text-sm font-semibold text-slate-500 dark:text-slate-400">#{approval.fastProblemId}</span>
            )}
            {approval.approvalRole && (
              <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                {approvalRoleLabel(approval.approvalRole)}
              </span>
            )}
          </div>
          <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>
            {approval.decision}
          </span>
        </div>

        {/* Title — primary content */}
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 mb-2">
          {approval.fastProblemTitle ?? `Ticket #${approval.fastProblemId}`}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
          <span>{formatDate(approval.createdDate)}</span>
          {approval.reviewerName && <span>· {approval.reviewerName}</span>}
          {!approval.reviewerName && isPending && <span className="text-amber-600 dark:text-amber-400">· Awaiting decision</span>}
        </div>

        {/* Submission note */}
        {approval.comments && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600/50 px-3 py-2 mb-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">&ldquo;{approval.comments}&rdquo;</p>
          </div>
        )}

        {/* View details link */}
        {onViewTicket && (
          <button
            type="button"
            onClick={() => onViewTicket(approval.fastProblemId)}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 rounded"
            title="View ticket details"
          >
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" aria-hidden />
            View ticket details
          </button>
        )}

        {/* Actions — only when pending and reviewer */}
        {isReviewer && isPending && onApprove && onReject && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-600/60 space-y-3">
            {onCommentsChange !== undefined && (
              <textarea
                id={`approval-comment-${approval.id}`}
                aria-label="Comment (optional)"
                placeholder="Add a comment (optional)"
                value={comments ?? ''}
                onChange={(e) => onCommentsChange(e.target.value)}
                rows={2}
                disabled={actionLoading}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-500 bg-white dark:bg-slate-700/50 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 resize-none"
              />
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAction('approve')}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Approve"
              >
                {actionLoading ? (
                  <span className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
                ) : (
                  <CheckIcon className="w-5 h-5 shrink-0" aria-hidden />
                )}
                Approve
              </button>
              <button
                type="button"
                onClick={() => handleAction('reject')}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-700 px-4 py-2.5 text-sm font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-rose-200/50 dark:border-rose-500/30"
                title="Reject"
              >
                <NoSymbolIcon className="w-5 h-5 shrink-0" aria-hidden />
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
