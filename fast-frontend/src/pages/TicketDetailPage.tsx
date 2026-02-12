import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DocumentCheckIcon,
  XCircleIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  EnvelopeIcon,
  DocumentDuplicateIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { problemApi } from '../shared/api/problemApi';
import { approvalApi } from '../shared/api/approvalApi';
import { usersApi } from '../shared/api/usersApi';
import type { FastProblem } from '../shared/types';
import { useAuth } from '../shared/context/AuthContext';
import ClassificationBadge from '../components/ClassificationBadge';
import StatusTimeline from '../components/StatusTimeline';
import LoadingSpinner from '../components/LoadingSpinner';

const btnIcon = 'inline-block w-5 h-5 shrink-0';
const btnBase = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50';
const btnIconOnly = 'inline-flex items-center justify-center p-2 rounded-xl text-sm transition-colors disabled:opacity-50';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const { data: ticket, isLoading, error } = useQuery<FastProblem>({
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
    mutationFn: ({ label, url }: { label: string; url: string }) => problemApi.addLink(Number(id!), label, url),
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
    ticket && ['ASSIGNED', 'IN_PROGRESS', 'ROOT_CAUSE_IDENTIFIED', 'FIX_IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(ticket.status);

  const { data: techLeads = [] } = useQuery({
    queryKey: ['users', 'tech-leads'],
    queryFn: () => usersApi.listTechLeads(),
    enabled: canAssignBtbTechLead || user?.role === 'ADMIN',
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
  };

  if (isLoading) return <LoadingSpinner message="Loading ticket..." />;
  if (error || !ticket) return <div className="text-center py-8 text-rose-500">Ticket not found</div>;

  const isAging = !['RESOLVED', 'CLOSED'].includes(ticket.status) && (ticket.ticketAgeDays ?? 0) >= 20;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {isAging && (
        <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-500/50 rounded-2xl p-4 animate-subtle-glow flex items-center gap-3">
          <span className="inline-block w-3 h-3 rounded-full bg-rose-500 animate-pulse" aria-hidden />
          <div>
            <p className="font-semibold text-rose-800 dark:text-rose-200">Aging Ticket</p>
            <p className="text-sm text-rose-700 dark:text-rose-300">This ticket has been unresolved for {ticket.ticketAgeDays} days. Please prioritize resolution.</p>
          </div>
        </div>
      )}

      {/* Ticket header: left = name (wraps), right = actions. Scrolls with page so top nav stays visible. */}
      <header className="grid grid-cols-[1fr_auto] gap-6 items-start max-w-full py-1">
          {/* Left: ticket name — can wrap to multiple rows without moving the actions */}
          <section className="min-w-0">
            <button onClick={() => navigate('/tickets')} className="text-sm text-primary hover:underline mb-1 block">
              &larr; Back to Tickets
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 break-words">
              #{ticket.id} - {ticket.title}
            </h1>
          </section>
          {/* Right: actions — fixed column, always in the same spot regardless of title length */}
          <section className="flex flex-wrap gap-2 justify-end items-center min-h-[2.75rem] w-max flex-shrink-0">
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
      </header>

      {/* Status Timeline */}
      <div className="bg-white dark:bg-slate-800/80 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-600">
        <StatusTimeline currentStatus={ticket.status} />
      </div>

      {/* Main Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-slate-800/80 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-600">
            <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Problem Details</h2>
            <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{ticket.description || 'No description provided'}</p>
            {ticket.anticipatedBenefits && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-emerald-900/30 rounded-lg border border-green-200 dark:border-emerald-700/50">
                <p className="text-sm font-medium text-green-800 dark:text-emerald-200">Anticipated Benefits</p>
                <p className="text-sm text-green-700 dark:text-emerald-300 mt-1">{ticket.anticipatedBenefits}</p>
              </div>
            )}
          </div>

          {/* Root Cause / Fix */}
          {(ticket.rootCause || ticket.workaround || ticket.permanentFix) && (
            <div className="bg-white dark:bg-slate-800/80 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-600">
              <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Resolution Details</h2>
              {ticket.rootCause && <div className="mb-3"><p className="text-sm font-medium text-gray-500 dark:text-slate-400">Root Cause</p><p className="text-gray-700 dark:text-slate-300 mt-1">{ticket.rootCause}</p></div>}
              {ticket.workaround && <div className="mb-3"><p className="text-sm font-medium text-gray-500 dark:text-slate-400">Workaround</p><p className="text-gray-700 dark:text-slate-300 mt-1">{ticket.workaround}</p></div>}
              {ticket.permanentFix && <div><p className="text-sm font-medium text-gray-500 dark:text-slate-400">Permanent Fix</p><p className="text-gray-700 dark:text-slate-300 mt-1">{ticket.permanentFix}</p></div>}
            </div>
          )}

          {/* Approval History */}
          {ticket.approvalRecords && ticket.approvalRecords.length > 0 && (
            <div className="bg-white dark:bg-slate-800/80 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-600">
              <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Approval History</h2>
              <div className="space-y-2">
                {ticket.approvalRecords.map((a) => (
                  <div key={a.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded">
                    <div>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {a.approvalRole ? a.approvalRole.replace(/_/g, ' ') : 'Approval'}
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
            <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Links</h2>
            {ticket.links && ticket.links.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {ticket.links.map((link) => (
                  <li key={link.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded text-sm">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                      {link.label}
                    </a>
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
                    if (newLinkLabel.trim() && newLinkUrl.trim()) addLinkMutation.mutate({ label: newLinkLabel.trim(), url: newLinkUrl.trim() });
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
            <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Comments</h2>
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

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800/80 rounded-lg shadow p-4 space-y-3 border border-slate-200 dark:border-slate-600">
            <h3 className="font-semibold text-gray-800 dark:text-slate-100">Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">INC Number</span><span className="font-mono text-slate-900 dark:text-slate-100">{ticket.servicenowIncidentNumber || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">PRB Number</span><span className="font-mono text-slate-900 dark:text-slate-100">{ticket.servicenowProblemNumber || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">PBT ID</span><span className="font-mono text-slate-900 dark:text-slate-100">{ticket.pbtId || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Classification</span><ClassificationBadge classification={ticket.classification} /></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Regions</span><span className="text-slate-900 dark:text-slate-100">{ticket.regionalCodes?.length ? ticket.regionalCodes.join(', ') : '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">User Impact</span><span className="font-bold text-slate-900 dark:text-slate-100">{ticket.userImpactCount?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Priority</span><span className="text-slate-900 dark:text-slate-100">{ticket.priority != null && ticket.priority >= 1 && ticket.priority <= 5 ? `${ticket.priority} / 5` : '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Age</span><span className="text-slate-900 dark:text-slate-100">{ticket.ticketAgeDays} days</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Target SLA</span><span className="text-slate-900 dark:text-slate-100">{ticket.targetResolutionHours}h</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Application</span><span className="text-slate-900 dark:text-slate-100">{ticket.affectedApplication || '-'}</span></div>
              {ticket.requestNumber && (
                <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Request number</span><span className="font-mono text-slate-900 dark:text-slate-100">{ticket.requestNumber}</span></div>
              )}
              {ticket.applications && ticket.applications.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 dark:text-slate-400">Impacted applications</span>
                  <div className="flex flex-wrap gap-1">
                    {ticket.applications.map((a) => (
                      <span key={a.id} className="inline-flex px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm">
                        {a.name}{a.code ? ` (${a.code})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <hr className="border-slate-200 dark:border-slate-600" />
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Created By</span><span className="text-slate-900 dark:text-slate-100">{ticket.createdBy}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Assigned To</span><span className="text-slate-900 dark:text-slate-100">{ticket.assignedTo || 'Unassigned'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Group</span><span className="text-slate-900 dark:text-slate-100">{ticket.assignmentGroup || '-'}</span></div>
              {(() => {
                const btbDisplay = ticket.btbTechLeadUsername
                  ? (techLeads.find((u) => u.username === ticket.btbTechLeadUsername)?.fullName ?? ticket.btbTechLeadUsername)
                  : null;
                const sameAsAssigned = btbDisplay && ticket.assignedTo && btbDisplay === ticket.assignedTo;
                if (!canAssignBtbTechLead && sameAsAssigned) return null;
                return (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-500 dark:text-slate-400">BTB Tech Lead</span>
                    {canAssignBtbTechLead ? (
                      <select
                        value={ticket.btbTechLeadUsername ?? ''}
                        onChange={(e) => updateBtbTechLeadMutation.mutate(e.target.value)}
                        disabled={updateBtbTechLeadMutation.isPending}
                        className="px-2 py-1 border border-slate-200 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">— None —</option>
                        {techLeads.map((u) => (
                          <option key={u.id} value={u.username}>{u.fullName} ({u.username})</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-slate-900 dark:text-slate-100">
                        {btbDisplay ?? '—'}
                      </span>
                    )}
                  </div>
                );
              })()}
              {ticket.confluenceLink && (
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 dark:text-slate-400">Confluence</span>
                  <a href={ticket.confluenceLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm truncate" title={ticket.confluenceLink}>
                    View further details
                  </a>
                </div>
              )}
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Created</span><span className="text-slate-900 dark:text-slate-100">{new Date(ticket.createdDate).toLocaleDateString()}</span></div>
              {ticket.resolvedDate && (
                <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Resolved</span><span className="text-slate-900 dark:text-slate-100">{new Date(ticket.resolvedDate).toLocaleDateString()}</span></div>
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
