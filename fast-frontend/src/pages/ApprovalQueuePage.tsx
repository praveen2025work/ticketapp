import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { approvalApi } from '../shared/api/approvalApi';
import { problemApi } from '../shared/api/problemApi';
import type { ApprovalRecord } from '../shared/types';
import ApprovalCard from '../components/ApprovalCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../shared/context/AuthContext';

const ROLES_CAN_APPROVE = ['ADMIN', 'REVIEWER', 'APPROVER', 'RTB_OWNER'];

export default function ApprovalQueuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<Record<number, string>>({});
  const [viewingTicketId, setViewingTicketId] = useState<number | null>(null);
  const isAdmin = user?.role === 'ADMIN';

  const { data: approvals = [], isLoading } = useQuery<ApprovalRecord[]>({
    queryKey: ['approvals', 'pending'],
    queryFn: () => approvalApi.getPending(),
  });

  const { data: viewingTicket, isLoading: viewingTicketLoading } = useQuery({
    queryKey: ['problems', viewingTicketId],
    queryFn: () => problemApi.getById(viewingTicketId!),
    enabled: viewingTicketId != null,
  });

  const { data: assignedTicketsData, isLoading: assignedLoading } = useQuery({
    queryKey: ['problems', 'status', 'ASSIGNED'],
    queryFn: () => problemApi.getByStatus('ASSIGNED', 0, 50),
    enabled: isAdmin,
  });
  const assignedTickets = assignedTicketsData?.content ?? [];

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => problemApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      queryClient.invalidateQueries({ queryKey: ['problems', 'status', 'ASSIGNED'] });
    },
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

  if (user && !ROLES_CAN_APPROVE.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading approvals..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Approval queue
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
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
            <span className="text-sm text-slate-500 dark:text-slate-400">pending</span>
          </div>
        )}
      </div>

      {/* Same-page ticket detail panel (when View is clicked) */}
      {viewingTicketId != null && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/90 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-700/50">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ticket details</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/tickets/${viewingTicketId}`)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Open full ticket
              </button>
              <button
                type="button"
                onClick={() => setViewingTicketId(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-4">
            {viewingTicketLoading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : viewingTicket ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Title</p>
                  <p className="mt-0.5 text-slate-900 dark:text-slate-100 font-medium">{viewingTicket.title}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Description</p>
                  <p className="mt-0.5 text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-4">{viewingTicket.description || '—'}</p>
                </div>
                <div className="flex flex-wrap gap-4 pt-1">
                  <span><span className="text-slate-500 dark:text-slate-400">Status</span> <span className="font-medium text-slate-800 dark:text-slate-200">{viewingTicket.status?.replace(/_/g, ' ')}</span></span>
                  {viewingTicket.assignedTo && <span><span className="text-slate-500 dark:text-slate-400">Assigned to</span> <span className="font-medium text-slate-800 dark:text-slate-200">{viewingTicket.assignedTo}</span></span>}
                  <span><span className="text-slate-500 dark:text-slate-400">Created</span> <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(viewingTicket.createdDate).toLocaleDateString()}</span></span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-rose-600">Could not load ticket.</p>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {approvals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/80 p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">All caught up</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
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
                onViewTicket={(ticketId) => setViewingTicketId(ticketId)}
                comments={comments[approval.id] ?? ''}
                onCommentsChange={(value) => setComments((prev) => ({ ...prev, [approval.id]: value }))}
                actionLoading={getActionLoading(approval.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* For ADMIN: tickets with approvals complete (ASSIGNED) — action items */}
      {isAdmin && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Action items — approvals complete
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Tickets that have passed all approvals. Assign BTB Tech Lead and move to In Progress from the ticket.
          </p>
          {assignedLoading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : assignedTickets.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No tickets in ASSIGNED status.</p>
          ) : (
            <ul className="space-y-2">
              {assignedTickets.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <span className="font-mono text-sm text-slate-500 dark:text-slate-400">#{t.id}</span>
                  <span className="flex-1 min-w-0 truncate text-slate-900 dark:text-slate-100">{t.title}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/tickets/${t.id}`)}
                      className="text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                      Open ticket
                    </button>
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate({ id: t.id, status: 'IN_PROGRESS' })}
                      disabled={statusMutation.isPending && statusMutation.variables?.id === t.id}
                      className="text-sm px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
                    >
                      {statusMutation.isPending && statusMutation.variables?.id === t.id ? 'Updating...' : 'Move to In Progress'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
