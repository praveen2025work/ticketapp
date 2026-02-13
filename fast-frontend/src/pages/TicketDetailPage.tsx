import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DocumentCheckIcon,
  XCircleIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  EnvelopeIcon,
  DocumentDuplicateIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  PaperAirplaneIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { problemApi } from '../shared/api/problemApi';
import { approvalApi } from '../shared/api/approvalApi';
import { usersApi } from '../shared/api/usersApi';
import type { FastProblem } from '../shared/types';
import { useAuth } from '../shared/context/AuthContext';
import { getApiError } from '../shared/utils/apiError';
import ClassificationBadge from '../components/ClassificationBadge';
import RagBadge from '../components/RagBadge';
import StatusTimeline from '../components/StatusTimeline';
import LoadingSpinner from '../components/LoadingSpinner';
import ApiErrorState from '../components/ApiErrorState';
import SearchableSelect from '../components/SearchableSelect';
import { getTicketEmailHtml, getTicketMailtoUrl } from '../shared/utils/ticketEmailHtml';

const btnIcon = 'inline-block w-5 h-5 shrink-0';
const btnBase = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50';
const btnIconOnly = 'inline-flex items-center justify-center p-2 rounded-xl text-sm transition-colors disabled:opacity-50';

export type TicketListFilters = { q?: string; region?: string; classification?: string; application?: string; status?: string; fromDate?: string; toDate?: string; ageMin?: number; ageMax?: number; minImpact?: number; priority?: number };

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const previousFilters = (location.state as { filters?: TicketListFilters } | null)?.filters;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState<string>('OTHER');
  const [newCommentText, setNewCommentText] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const { data: ticket, isLoading, error, refetch } = useQuery<FastProblem>({
    queryKey: ['problems', id],
    queryFn: () => problemApi.getById(Number(id!)),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () => approvalApi.submitForApproval(Number(id!)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['problems', id] }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => problemApi.updateStatus(Number(id!), status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['problems', id] }),
  });

  const addPropertyMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => problemApi.addProperty(Number(id!), key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems', id] });
      setNewPropKey('');
      setNewPropValue('');
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (key: string) => problemApi.deleteProperty(Number(id!), key),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['problems', id] }),
  });

  const addLinkMutation = useMutation({
    mutationFn: ({ label, url, linkType }: { label: string; url: string; linkType?: string }) =>
      problemApi.addLink(Number(id!), label, url, linkType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems', id] });
      setNewLinkLabel('');
      setNewLinkUrl('');
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (linkId: number) => problemApi.deleteLink(Number(id!), linkId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['problems', id] }),
  });

  const addCommentMutation = useMutation({
    mutationFn: (text: string) => problemApi.addComment(Number(id!), text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems', id] });
      setNewCommentText('');
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (message: string) => problemApi.sendEmailToAssignee(Number(id!), message),
    onSuccess: () => {
      setShowEmailModal(false);
      setEmailMessage('');
    },
  });

  const canAssignBtbTechLead = (user?.role === 'ADMIN' || user?.role === 'RTB_OWNER') &&
    ticket && ['ASSIGNED', 'IN_PROGRESS', 'ROOT_CAUSE_IDENTIFIED', 'FIX_IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ARCHIVED'].includes(ticket.status);

  const buildTicketsUrl = () => {
    const f = previousFilters;
    const params = new URLSearchParams();
    if (f?.q?.trim()) params.set('q', f.q.trim());
    if (f?.region) params.set('region', f.region);
    if (f?.classification) params.set('classification', f.classification);
    if (f?.application) params.set('application', f.application);
    if (f?.status) params.set('status', f.status);
    if (f?.fromDate) params.set('fromDate', f.fromDate);
    if (f?.toDate) params.set('toDate', f.toDate);
    if (f?.ageMin != null && f.ageMin >= 0) params.set('ageMin', String(f.ageMin));
    if (f?.ageMax != null && f.ageMax >= 0) params.set('ageMax', String(f.ageMax));
    if (f?.minImpact != null && f.minImpact >= 0) params.set('minImpact', String(f.minImpact));
    if (f?.priority != null && f.priority >= 1 && f.priority <= 5) params.set('priority', String(f.priority));
    const qs = params.toString();
    return `/tickets${qs ? `?${qs}` : ''}`;
  };

  const ticketApplicationIds = ticket?.applications?.map((a) => a.id) ?? [];
  const { data: techLeads = [] } = useQuery({
    queryKey: ['users', 'tech-leads', ticketApplicationIds],
    queryFn: () => usersApi.listTechLeads(ticketApplicationIds.length ? ticketApplicationIds : undefined),
    enabled: canAssignBtbTechLead || !!ticket?.btbTechLeadUsername || user?.role === 'ADMIN',
  });

  const updateBtbTechLeadMutation = useMutation({
    mutationFn: (btbTechLeadUsername: string) =>
      problemApi.updateBtbTechLead(Number(id!), btbTechLeadUsername),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['problems', id] }),
  });

  const actionLoading = submitMutation.isPending || statusMutation.isPending;

  const nextStatusMap: Record<string, string> = {
    ASSIGNED: 'IN_PROGRESS',
    IN_PROGRESS: 'ROOT_CAUSE_IDENTIFIED',
    ROOT_CAUSE_IDENTIFIED: 'FIX_IN_PROGRESS',
    FIX_IN_PROGRESS: 'RESOLVED',
    RESOLVED: 'CLOSED',
    CLOSED: 'ARCHIVED',
  };

  if (isLoading) return <LoadingSpinner message="Loading ticket..." />;
  if (error || !ticket) {
    const apiError = error ? getApiError(error) : null;
    const isNotFound = apiError?.code === 'NOT_FOUND' || apiError?.status === 404;
    return (
      <ApiErrorState
        title={isNotFound ? 'Ticket not found' : 'Failed to load ticket'}
        error={error ?? new Error('Ticket not found')}
        onRetry={() => refetch()}
        fallbackMessage={isNotFound ? 'This ticket may have been deleted or the ID is invalid.' : 'Check the backend and try again.'}
        className="text-center py-8 px-4"
      />
    );
  }

  const isAging = !['RESOLVED', 'CLOSED', 'ARCHIVED'].includes(ticket.status) && (ticket.ticketAgeDays ?? 0) >= 20;

  const hasCommentInLast24h = (): boolean => {
    const comments = ticket.comments ?? [];
    if (comments.length === 0) return false;
    const latest = comments.reduce((best, c) => {
      const t = c.createdDate ? new Date(c.createdDate).getTime() : 0;
      return t > best ? t : best;
    }, 0);
    // 24h cutoff for "daily comment" banner; using current time is intentional
    /* eslint-disable-next-line react-hooks/purity */
    return latest >= Date.now() - 24 * 60 * 60 * 1000;
  };
  const needsDailyComment = ticket.status === 'IN_PROGRESS' && !hasCommentInLast24h();

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {needsDailyComment && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-500/50 rounded-2xl p-4 flex items-center gap-3">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-500" aria-hidden />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200">Daily commentary required</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">In Progress items must have a comment in the last 24 hours. Please add a comment below.</p>
          </div>
        </div>
      )}
      {isAging && (
        <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-500/50 rounded-2xl p-4 animate-subtle-glow flex items-center gap-3">
          <span className="inline-block w-3 h-3 rounded-full bg-rose-500 animate-pulse" aria-hidden />
          <div>
            <p className="font-semibold text-rose-800 dark:text-rose-200">Aging Ticket</p>
            <p className="text-sm text-rose-700 dark:text-rose-300">This ticket has been unresolved for {ticket.ticketAgeDays} days. Please prioritize resolution.</p>
          </div>
        </div>
      )}

      {/* Ticket header */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <section className="min-w-0">
            <button onClick={() => navigate(buildTicketsUrl())} className="text-sm text-primary hover:underline mb-1 block">
              &larr; Back to Tickets
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 break-words">
              FAST-{ticket.id} – {ticket.title}
            </h1>
            {ticket.updatedDate && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Last updated {new Date(ticket.updatedDate).toLocaleString()}
              </p>
            )}
          </section>
          {/* Actions */}
          <section className="flex flex-wrap gap-2 justify-end items-center w-max flex-shrink-0">
            {ticket.status === 'NEW' && (!ticket.approvalRecords || ticket.approvalRecords.length === 0) && user?.role === 'ADMIN' && (
              <button onClick={() => submitMutation.mutate()} disabled={actionLoading}
                className={`${btnBase} bg-primary text-white hover:bg-primary-hover`}
                title="Submit for approval">
                <DocumentCheckIcon className={btnIcon} aria-hidden />
                Approval
              </button>
            )}
            {ticket.status === 'NEW' && ticket.approvalRecords && ticket.approvalRecords.length > 0 && user?.role === 'ADMIN' && (
              <span className="text-sm text-slate-500 italic">Submitted for approval</span>
            )}
            {nextStatusMap[ticket.status] && (user?.role === 'ADMIN' || user?.role === 'RTB_OWNER' || user?.role === 'TECH_LEAD') && (
              <button onClick={() => statusMutation.mutate(nextStatusMap[ticket.status])} disabled={actionLoading}
                className={`${btnBase} bg-primary text-white hover:bg-primary-hover`}
                title={`Move to ${nextStatusMap[ticket.status].replace(/_/g, ' ')}`}>
                <ArrowRightIcon className={btnIcon} aria-hidden />
                Move to {nextStatusMap[ticket.status].replace(/_/g, ' ')}
              </button>
            )}
            {(user?.role === 'ADMIN' || user?.role === 'RTB_OWNER' || user?.role === 'TECH_LEAD') && (
              <button onClick={() => navigate(`/tickets/${id}/edit`)}
                className={`${btnIconOnly} bg-slate-600 text-white hover:bg-slate-700`}
                title="Edit">
                <PencilSquareIcon className="w-5 h-5" aria-hidden />
              </button>
            )}
            {ticket.assignedTo && (user?.role === 'ADMIN' || user?.role === 'RTB_OWNER' || user?.role === 'TECH_LEAD') && (
              <button
                onClick={() => setShowEmailModal(true)}
                className={`${btnIconOnly} bg-primary text-white hover:bg-primary-hover`}
                title="Send email to assignee">
                <EnvelopeIcon className="w-5 h-5" aria-hidden />
              </button>
            )}
            {user?.role === 'ADMIN' && (ticket.status === 'CLOSED' || ticket.status === 'REJECTED') && (
              <button onClick={() => statusMutation.mutate('ARCHIVED')} disabled={actionLoading}
                className={`${btnBase} bg-slate-500 text-white hover:bg-slate-600`}
                title="Archive ticket">
                Archive
              </button>
            )}
            {user?.role === 'ADMIN' && (ticket.status === 'NEW' || ticket.status === 'ASSIGNED') && (
              <>
                <button onClick={() => statusMutation.mutate('CLOSED')} disabled={actionLoading}
                  className={`${btnBase} bg-slate-500 text-white hover:bg-slate-600`}
                  title="Close ticket">
                  <XCircleIcon className={btnIcon} aria-hidden />
                  Close
                </button>
                <button onClick={() => statusMutation.mutate('REJECTED')} disabled={actionLoading}
                  className={`${btnBase} bg-rose-600 text-white hover:bg-rose-700`}
                  title="Reject ticket">
                  <NoSymbolIcon className={btnIcon} aria-hidden />
                  Reject
                </button>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <button onClick={() => navigate('/tickets/create', { state: { cloneFrom: ticket } })}
                className={`${btnIconOnly} bg-primary text-white hover:bg-primary-hover`}
                title="Clone ticket">
                <DocumentDuplicateIcon className="w-5 h-5" aria-hidden />
              </button>
            )}
          </section>
        </div>

        {/* At a glance: status, age, RAG, priority, assignee, identifiers */}
        <div className="flex flex-wrap items-center gap-3 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600 text-sm">
          <span className="font-medium text-slate-600 dark:text-slate-400">Status</span>
          <span className="px-2.5 py-1 rounded-lg font-medium bg-primary/15 text-primary dark:bg-primary/25">
            {ticket.status.replace(/_/g, ' ')}
          </span>
          <span className="text-slate-400 dark:text-slate-500">·</span>
          <span className="text-slate-600 dark:text-slate-300">{ticket.ticketAgeDays} days old</span>
          <span className="text-slate-400 dark:text-slate-500">·</span>
          <RagBadge ragStatus={ticket.ragStatus ?? undefined} />
          <span className="text-slate-400 dark:text-slate-500">·</span>
          <span className="text-slate-600 dark:text-slate-300">
            Priority {ticket.priority != null && ticket.priority >= 1 && ticket.priority <= 5 ? `${ticket.priority}/5` : '—'}
          </span>
          <span className="text-slate-400 dark:text-slate-500">·</span>
          <span className="text-slate-600 dark:text-slate-300">
            Assigned to <strong>{ticket.assignedTo || 'Unassigned'}</strong>
          </span>
          <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">·</span>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            INC {ticket.servicenowIncidentNumber || '—'} · PRB {ticket.servicenowProblemNumber || '—'}
          </span>
          <ClassificationBadge classification={ticket.classification || 'A'} />
        </div>
      </header>

      {/* Status Timeline */}
      <div className="bg-white dark:bg-slate-800/80 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Workflow</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Current stage in the ticket lifecycle</p>
        <StatusTimeline currentStatus={ticket.status} />
      </div>

      {/* Main Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Details */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 overflow-hidden">
            <div className="border-b border-slate-100 dark:border-slate-700/80 px-6 py-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Problem Details</h2>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={getTicketMailtoUrl(ticket, { ticketUrl: typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined })}
                  className="inline-flex items-center justify-center p-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
                  title="Open email client"
                >
                  <PaperAirplaneIcon className="w-4 h-4" aria-hidden />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const ticketUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined;
                    const html = getTicketEmailHtml(ticket, ticketUrl);
                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank', 'noopener');
                    setTimeout(() => URL.revokeObjectURL(url), 60000);
                  }}
                  className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  title="View in new tab"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ticketUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined;
                    const html = getTicketEmailHtml(ticket, ticketUrl);
                    navigator.clipboard.writeText(html).then(
                      () => toast.success('HTML copied to clipboard.'),
                      () => toast.error('Copy failed')
                    );
                  }}
                  className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Copy HTML"
                >
                  <ClipboardDocumentIcon className="w-4 h-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ticketUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined;
                    const html = getTicketEmailHtml(ticket, ticketUrl);
                    const blob = new Blob([html], { type: 'text/html' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `ticket-${String(ticket.pbtId ?? ticket.id).replace(/\s+/g, '-')}.html`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }}
                  className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Download HTML"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" aria-hidden />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                    <DocumentTextIcon className="w-4 h-4" aria-hidden />
                  </span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed whitespace-pre-wrap pl-10">
                  {ticket.description || 'No description provided'}
                </p>
              </section>
              {ticket.anticipatedBenefits && (
                <section className="pl-10 border-l-2 border-emerald-200 dark:border-emerald-600/60 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-r-lg py-3 px-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-400">
                      <SparklesIcon className="w-3.5 h-3.5" aria-hidden />
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Expected outcome</span>
                  </div>
                  <p className="text-sm text-emerald-800/90 dark:text-emerald-200/90 leading-relaxed">
                    {ticket.anticipatedBenefits}
                  </p>
                </section>
              )}
            </div>
          </div>

          {/* Root Cause / Fix */}
          {(ticket.rootCause || ticket.workaround || ticket.permanentFix) && (
            <div className="bg-white dark:bg-slate-800/80 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-600">
              <h2 className="text-lg font-semibold mb-1 text-slate-900 dark:text-slate-100">Resolution Details</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Root cause and workaround</p>
              {ticket.rootCause && <div className="mb-3"><p className="text-sm font-medium text-gray-500 dark:text-slate-400">Root Cause</p><p className="text-gray-700 dark:text-slate-300 mt-1">{ticket.rootCause}</p></div>}
              {ticket.workaround && <div className="mb-3"><p className="text-sm font-medium text-gray-500 dark:text-slate-400">Workaround</p><p className="text-gray-700 dark:text-slate-300 mt-1">{ticket.workaround}</p></div>}
              {ticket.permanentFix && <div><p className="text-sm font-medium text-gray-500 dark:text-slate-400">Permanent Fix</p><p className="text-gray-700 dark:text-slate-300 mt-1">{ticket.permanentFix}</p></div>}
            </div>
          )}

          {/* Approval History */}
          {ticket.approvalRecords && ticket.approvalRecords.length > 0 && (
            <div className="bg-white dark:bg-slate-800/80 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-600">
              <h2 className="text-lg font-semibold mb-1 text-slate-900 dark:text-slate-100">
                Approval History {ticket.approvalRecords.length > 0 && (
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({ticket.approvalRecords.length})</span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Sign-offs and approvals</p>
              <div className="space-y-2">
                {ticket.approvalRecords.map((a) => (
                  <div key={a.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded">
                    <div>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {a.approvalRole === 'REVIEWER' ? 'Finance' : a.approvalRole === 'APPROVER' ? 'Tech' : a.approvalRole === 'RTB_OWNER' ? 'RTB' : (a.approvalRole ?? 'Approval').replace(/_/g, ' ')}
                      </span>
                      {a.reviewerName && (
                        <span className="text-gray-500 dark:text-slate-400 text-sm ml-1">— decided by {a.reviewerName}</span>
                      )}
                      {a.comments && <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{a.comments}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      a.decision === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-emerald-900/50 dark:text-emerald-200' :
                      a.decision === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-rose-900/50 dark:text-rose-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-amber-900/50 dark:text-amber-200'}`}>
                      {a.decision}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links (direct URLs) */}
          <div className="bg-white dark:bg-slate-800/80 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-600">
            <h2 className="text-lg font-semibold mb-1 text-slate-900 dark:text-slate-100">
              Links {ticket.links && ticket.links.length > 0 && (
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({ticket.links.length})</span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">JIRA, ServiceFirst, or other related URLs</p>
            {ticket.links && ticket.links.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {ticket.links.map((link) => (
                  <li key={link.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded text-sm">
                    <span className="flex items-center gap-2 min-w-0">
                      {(link.linkType === 'JIRA' || link.linkType === 'SERVICEFIRST') && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                          {link.linkType}
                        </span>
                      )}
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium truncate">
                        {link.label}
                      </a>
                    </span>
                    {(user?.role === 'ADMIN' || user?.role === 'RTB_OWNER' || user?.role === 'TECH_LEAD') && (
                      <button
                        type="button"
                        onClick={() => deleteLinkMutation.mutate(link.id)}
                        disabled={deleteLinkMutation.isPending}
                        className="text-rose-600 dark:text-rose-400 hover:underline text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">No links.</p>
            )}
            {(user?.role === 'ADMIN' || user?.role === 'RTB_OWNER' || user?.role === 'TECH_LEAD') && (
              <div className="flex flex-wrap gap-2 items-end">
                <select
                  value={newLinkType}
                  onChange={(e) => setNewLinkType(e.target.value)}
                  className="border border-gray-300 dark:border-slate-500 rounded-md p-2 text-sm w-28 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  aria-label="Link type"
                >
                  <option value="OTHER">Other</option>
                  <option value="JIRA">JIRA</option>
                  <option value="SERVICEFIRST">ServiceFirst</option>
                </select>
                <input
                  type="text"
                  placeholder="Label"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  className="border border-gray-300 dark:border-slate-500 rounded-md p-2 text-sm w-32 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                <input
                  type="url"
                  placeholder="https://..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="border border-gray-300 dark:border-slate-500 rounded-md p-2 text-sm flex-1 min-w-[180px] bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newLinkLabel.trim() && newLinkUrl.trim()) addLinkMutation.mutate({ label: newLinkLabel.trim(), url: newLinkUrl.trim(), linkType: newLinkType });
                  }}
                  disabled={addLinkMutation.isPending || !newLinkLabel.trim() || !newLinkUrl.trim()}
                  className="px-3 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50"
                >
                  Add link
                </button>
              </div>
            )}
          </div>

          {/* Incident Links */}
          {ticket.incidentLinks && ticket.incidentLinks.length > 0 && (
            <div className="bg-white dark:bg-slate-800/80 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-600">
              <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Linked Incidents</h2>
              <div className="space-y-2">
                {ticket.incidentLinks.map((link) => (
                  <div key={link.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded text-sm">
                    <div>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{link.incidentNumber}</span>
                      <span className="ml-2 text-gray-500 dark:text-slate-400">{link.description}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-slate-600 rounded text-xs text-slate-700 dark:text-slate-200">{link.linkType}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white dark:bg-slate-800/80 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-600">
            <h2 className="text-lg font-semibold mb-1 text-slate-900 dark:text-slate-100">
              Comments {ticket.comments && ticket.comments.length > 0 && (
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({ticket.comments.length})</span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Activity and updates on this ticket</p>
            {ticket.comments && ticket.comments.length > 0 ? (
              <ul className="space-y-3 mb-4">
                {ticket.comments.map((c) => (
                  <li key={c.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded text-sm border-l-2 border-gray-200 dark:border-slate-500">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mb-1">
                      <span className="font-medium text-gray-700 dark:text-slate-200">{c.authorUsername}</span>
                      <span>{new Date(c.createdDate).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-800 dark:text-slate-200 whitespace-pre-wrap">{c.commentText}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">No comments yet.</p>
            )}
            {(user?.role === 'ADMIN' || user?.role === 'RTB_OWNER' || user?.role === 'TECH_LEAD') && (
              <div className="flex gap-2">
                <textarea
                  placeholder="Add a comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  rows={2}
                  className="flex-1 border border-gray-300 dark:border-slate-500 rounded-md p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCommentText.trim()) addCommentMutation.mutate(newCommentText.trim());
                  }}
                  disabled={addCommentMutation.isPending || !newCommentText.trim()}
                  className="px-3 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50 self-end"
                >
                  Add comment
                </button>
              </div>
            )}
          </div>

          {/* Custom properties */}
          <div className="bg-white dark:bg-slate-800/80 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-600">
            <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Custom properties</h2>
            {ticket.properties && ticket.properties.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {ticket.properties.map((p) => (
                  <li key={p.key} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded text-sm">
                    <span className="font-medium text-gray-800 dark:text-slate-200">{p.key}</span>
                    <span className="text-gray-600 dark:text-slate-300 truncate max-w-[60%]">{p.value}</span>
                    {(user?.role === 'ADMIN' || user?.role === 'RTB_OWNER' || user?.role === 'TECH_LEAD') && (
                      <button
                        type="button"
                        onClick={() => deletePropertyMutation.mutate(p.key)}
                        disabled={deletePropertyMutation.isPending}
                        className="text-rose-600 dark:text-rose-400 hover:underline text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">No custom properties.</p>
            )}
            {(user?.role === 'ADMIN' || user?.role === 'RTB_OWNER' || user?.role === 'TECH_LEAD') && (
              <div className="flex flex-wrap gap-2 items-end">
                <input
                  type="text"
                  placeholder="Key"
                  value={newPropKey}
                  onChange={(e) => setNewPropKey(e.target.value)}
                  className="border border-gray-300 dark:border-slate-500 rounded-md p-2 text-sm w-32 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newPropValue}
                  onChange={(e) => setNewPropValue(e.target.value)}
                  className="border border-gray-300 dark:border-slate-500 rounded-md p-2 text-sm flex-1 min-w-[120px] bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newPropKey.trim()) addPropertyMutation.mutate({ key: newPropKey.trim(), value: newPropValue });
                  }}
                  disabled={addPropertyMutation.isPending || !newPropKey.trim()}
                  className="px-3 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50"
                >
                  Add property
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: grouped key details */}
        <div className="space-y-4">
          {/* Identifiers (BTB Tech Lead at top) */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow p-4 border border-slate-200 dark:border-slate-600">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Identifiers</h3>
            {(canAssignBtbTechLead || ticket.btbTechLeadUsername) && (
              <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-600">
                <span className="text-slate-500 dark:text-slate-400 text-sm block mb-1">BTB Tech Lead</span>
                {canAssignBtbTechLead ? (
                  <SearchableSelect
                    label=""
                    value={ticket.btbTechLeadUsername ?? ''}
                    onChange={(v) => updateBtbTechLeadMutation.mutate(v)}
                    options={techLeads.map((u) => ({
                      value: u.username,
                      label: u.fullName ?? u.username,
                      subLabel: u.username,
                    }))}
                    placeholder="Search by name or username..."
                    emptyMessage="No tech leads match"
                    disabled={updateBtbTechLeadMutation.isPending}
                    className="w-full"
                  />
                ) : (
                  <span className="text-sm text-slate-900 dark:text-slate-100">
                    {ticket.btbTechLeadUsername
                      ? (techLeads.find((u) => u.username === ticket.btbTechLeadUsername)?.fullName ?? ticket.btbTechLeadUsername)
                      : '—'}
                  </span>
                )}
              </div>
            )}
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-slate-500 dark:text-slate-400">INC</dt><dd className="font-mono text-slate-900 dark:text-slate-100 truncate">{ticket.servicenowIncidentNumber || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500 dark:text-slate-400">PRB</dt><dd className="font-mono text-slate-900 dark:text-slate-100 truncate">{ticket.servicenowProblemNumber || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500 dark:text-slate-400">PBT ID</dt><dd className="font-mono text-slate-900 dark:text-slate-100 truncate">{ticket.pbtId || '—'}</dd></div>
              {ticket.requestNumber && (
                <div className="flex justify-between gap-2"><dt className="text-slate-500 dark:text-slate-400">Request #</dt><dd className="font-mono text-slate-900 dark:text-slate-100">{ticket.requestNumber}</dd></div>
              )}
            </dl>
          </div>

          {/* Impact & SLA */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow p-4 border border-slate-200 dark:border-slate-600">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Impact & SLA</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-slate-500 dark:text-slate-400">User impact</dt><dd className="font-semibold text-slate-900 dark:text-slate-100">{ticket.userImpactCount?.toLocaleString() ?? '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500 dark:text-slate-400">Priority</dt><dd className="text-slate-900 dark:text-slate-100">{ticket.priority != null && ticket.priority >= 1 && ticket.priority <= 5 ? `${ticket.priority} / 5` : '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500 dark:text-slate-400">Age</dt><dd className="text-slate-900 dark:text-slate-100">{ticket.ticketAgeDays} days</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500 dark:text-slate-400">Target SLA</dt><dd className="text-slate-900 dark:text-slate-100">{ticket.targetResolutionHours}h</dd></div>
            </dl>
          </div>

          {/* Classification & scope */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow p-4 border border-slate-200 dark:border-slate-600">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Classification & scope</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center gap-2"><span className="text-slate-500 dark:text-slate-400">Classification</span><ClassificationBadge classification={ticket.classification} /></div>
              <div className="flex justify-between gap-2"><span className="text-slate-500 dark:text-slate-400">Regions</span><span className="text-slate-900 dark:text-slate-100 text-right">{ticket.regionalCodes?.length ? ticket.regionalCodes.join(', ') : '—'}</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-500 dark:text-slate-400">Application</span><span className="text-slate-900 dark:text-slate-100 truncate">{ticket.affectedApplication || '—'}</span></div>
              {ticket.applications && ticket.applications.length > 0 && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Impacted apps</span>
                  <div className="flex flex-wrap gap-1">
                    {ticket.applications.map((a) => (
                      <span key={a.id} className="inline-flex px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs">
                        {a.name}{a.code ? ` (${a.code})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* People & dates */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow p-4 border border-slate-200 dark:border-slate-600">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">People & dates</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-slate-500 dark:text-slate-400">Created by</dt><dd className="text-slate-900 dark:text-slate-100 truncate">{ticket.createdBy}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500 dark:text-slate-400">Assigned to</dt><dd className="font-medium text-slate-900 dark:text-slate-100 truncate">{ticket.assignedTo || 'Unassigned'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500 dark:text-slate-400">Group</dt><dd className="text-slate-900 dark:text-slate-100 truncate">{ticket.assignmentGroup || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500 dark:text-slate-400">Created</dt><dd className="text-slate-900 dark:text-slate-100">{new Date(ticket.createdDate).toLocaleDateString()}</dd></div>
              {ticket.resolvedDate && (
                <div className="flex justify-between gap-2"><dt className="text-slate-500 dark:text-slate-400">Resolved</dt><dd className="text-slate-900 dark:text-slate-100">{new Date(ticket.resolvedDate).toLocaleDateString()}</dd></div>
              )}
            </dl>
          </div>

          {/* References */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow p-4 border border-slate-200 dark:border-slate-600">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">References</h3>
            <div className="space-y-2 text-sm">
              {ticket.confluenceLink ? (
                <a href={ticket.confluenceLink} target="_blank" rel="noopener noreferrer" className="block text-primary hover:underline truncate" title={ticket.confluenceLink}>
                  Confluence →
                </a>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">No Confluence link</span>
              )}
              {ticket.links && ticket.links.length > 0 && (
                <p className="text-slate-500 dark:text-slate-400">{ticket.links.length} link{ticket.links.length !== 1 ? 's' : ''} in main section</p>
              )}
            </div>
          </div>

          {/* Knowledge Article */}
          {ticket.knowledgeArticle && (
            <div className="bg-white dark:bg-slate-800/80 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600">
              <h3 className="font-semibold text-gray-800 dark:text-slate-100 mb-2">Knowledge Article</h3>
              <p className="text-sm text-primary font-medium">{ticket.knowledgeArticle.title}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                ticket.knowledgeArticle.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 dark:bg-emerald-900/50 dark:text-emerald-200' : 'bg-yellow-100 text-yellow-800 dark:bg-amber-900/50 dark:text-amber-200'}`}>
                {ticket.knowledgeArticle.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Send email modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Send email to assignee</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">Optional message to include with the ticket summary:</p>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              placeholder="Add a message..."
              rows={3}
              className="w-full border border-gray-300 dark:border-slate-500 rounded-md p-2 text-sm mb-4 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowEmailModal(false); setEmailMessage(''); }}
                className="px-3 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => sendEmailMutation.mutate(emailMessage)}
                disabled={sendEmailMutation.isPending}
                className="px-3 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50"
              >
                {sendEmailMutation.isPending ? 'Sending...' : 'Send'}
              </button>
            </div>
            {sendEmailMutation.isError && (
              <p className="mt-2 text-sm text-rose-600">{String(sendEmailMutation.error)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
