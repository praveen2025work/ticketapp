import type { ApprovalRecord } from '../shared/types';

interface ApprovalCardProps {
  approval: ApprovalRecord;
  onApprove?: (id: number, comments: string) => void;
  onReject?: (id: number, comments: string) => void;
  isReviewer?: boolean;
  onNavigateToTicket?: (ticketId: number) => void;
  comments?: string;
  onCommentsChange?: (value: string) => void;
  actionLoading?: boolean;
}

export default function ApprovalCard({
  approval,
  onApprove,
  onReject,
  isReviewer,
  onNavigateToTicket,
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

  return (
    <article
      className={`
        group relative overflow-hidden rounded-2xl border bg-white text-left shadow-sm
        transition-all duration-300 ease-out
        hover:shadow-md hover:border-slate-200
        ${isPending ? 'border-amber-200/60 ring-1 ring-amber-100/50' : 'border-slate-100'}
      `}
    >
      {isPending && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" aria-hidden />
      )}

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {onNavigateToTicket ? (
                <button
                  type="button"
                  onClick={() => onNavigateToTicket(approval.fastProblemId)}
                  className="
                    text-lg font-semibold text-slate-900 transition-colors hover:text-emerald-600
                    focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 rounded-lg
                  "
                >
                  Ticket #{approval.fastProblemId}
                </button>
              ) : (
                <span className="text-lg font-semibold text-slate-900">
                  Ticket #{approval.fastProblemId}
                </span>
              )}
              <span
                className={`
                  inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                  ${isPending ? 'bg-amber-100 text-amber-800' : approval.decision === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}
                `}
              >
                {approval.decision}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{approval.reviewerName}</span>
              {approval.reviewerEmail && (
                <span className="truncate">{approval.reviewerEmail}</span>
              )}
              <span>{formatDate(approval.createdDate)}</span>
            </div>
          </div>

          {onNavigateToTicket && (
            <button
              type="button"
              onClick={() => onNavigateToTicket(approval.fastProblemId)}
              className="
                shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80
                px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors
                hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900
                focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:ring-offset-2
              "
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View ticket
            </button>
          )}
        </div>

        {approval.comments && (
          <div className="mt-4 rounded-xl bg-slate-50/90 px-4 py-3 text-sm text-slate-600 border border-slate-100">
            <span className="font-medium text-slate-500 text-xs uppercase tracking-wide">Submission note</span>
            <p className="mt-1 italic">&ldquo;{approval.comments}&rdquo;</p>
          </div>
        )}

        {isReviewer && isPending && onApprove && onReject && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            {onCommentsChange !== undefined && (
              <div className="mb-4">
                <label htmlFor={`approval-comment-${approval.id}`} className="block text-sm font-medium text-slate-600 mb-1.5">
                  Add comment (optional)
                </label>
                <textarea
                  id={`approval-comment-${approval.id}`}
                  placeholder="e.g. Approved for assignment to regional team..."
                  value={comments ?? ''}
                  onChange={(e) => onCommentsChange(e.target.value)}
                  rows={2}
                  disabled={actionLoading}
                  className="
                    w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800
                    placeholder:text-slate-400
                    focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400
                    disabled:opacity-60 disabled:cursor-not-allowed resize-none
                  "
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleAction('approve')}
                disabled={actionLoading}
                className="
                  inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white
                  shadow-sm transition-all duration-200
                  hover:bg-emerald-700 hover:shadow
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                "
              >
                {actionLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Approve
              </button>
              <button
                type="button"
                onClick={() => handleAction('reject')}
                disabled={actionLoading}
                className="
                  inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-700
                  transition-all duration-200
                  hover:bg-rose-50 hover:border-rose-300
                  focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
