import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalApi } from '../shared/api/approvalApi';
import type { ApprovalRecord } from '../shared/types';
import ApprovalCard from '../components/ApprovalCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ApprovalQueuePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<Record<number, string>>({});

  const { data: approvals = [], isLoading } = useQuery<ApprovalRecord[]>({
    queryKey: ['approvals', 'pending'],
    queryFn: () => approvalApi.getPending(),
  });

  const approveMutation = useMutation({
    mutationFn: ({ approvalId, comment }: { approvalId: number; comment?: string }) =>
      approvalApi.approve(approvalId, comment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvals', 'pending'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ approvalId, comment }: { approvalId: number; comment?: string }) =>
      approvalApi.reject(approvalId, comment),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['approvals', 'pending'] }),
  });

  const getActionLoading = (approvalId: number) =>
    (approveMutation.isPending && approveMutation.variables?.approvalId === approvalId) ||
    (rejectMutation.isPending && rejectMutation.variables?.approvalId === approvalId);

  if (isLoading) {
    return <LoadingSpinner message="Loading approvals..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Approval queue
          </h1>
          <p className="mt-1 text-slate-600">
            {approvals.length === 0
              ? 'No tickets waiting for your decision.'
              : approvals.length === 1
                ? '1 ticket is waiting for your decision.'
                : `${approvals.length} tickets are waiting for your decision.`}
          </p>
        </div>
        {approvals.length > 0 && (
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl bg-amber-100 px-3 text-sm font-semibold text-amber-800"
              aria-hidden
            >
              {approvals.length}
            </span>
            <span className="text-sm text-slate-500">pending</span>
          </div>
        )}
      </div>

      {/* Content */}
      {approvals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">All caught up</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            When tickets are submitted for approval, they’ll show up here. You can also browse tickets from the main list.
          </p>
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            View tickets
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
          {approvals.map((approval, index) => (
            <div
              key={approval.id}
              className="animate-card-enter opacity-0"
              style={{
                animationFillMode: 'forwards',
                animationDelay: `${index * 0.06}s`,
              }}
            >
              <ApprovalCard
                approval={approval}
                isReviewer
                onApprove={(id, comment) => approveMutation.mutate({ approvalId: id, comment })}
                onReject={(id, comment) => rejectMutation.mutate({ approvalId: id, comment })}
                onNavigateToTicket={(ticketId) => navigate(`/tickets/${ticketId}`)}
                comments={comments[approval.id] ?? ''}
                onCommentsChange={(value) => setComments((prev) => ({ ...prev, [approval.id]: value }))}
                actionLoading={getActionLoading(approval.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
