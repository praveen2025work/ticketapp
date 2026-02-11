import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { problemApi } from '../shared/api/problemApi';
import { approvalApi } from '../shared/api/approvalApi';
import type { FastProblem } from '../shared/types';
import { useAuth } from '../shared/context/AuthContext';
import ClassificationBadge from '../components/ClassificationBadge';
import StatusTimeline from '../components/StatusTimeline';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
    <div className="space-y-6 animate-fade-in">
      {isAging && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 animate-subtle-glow flex items-center gap-3">
          <span className="inline-block w-3 h-3 rounded-full bg-rose-500 animate-pulse" aria-hidden />
          <div>
            <p className="font-semibold text-rose-800">Aging Ticket</p>
            <p className="text-sm text-rose-700">This ticket has been unresolved for {ticket.ticketAgeDays} days. Please prioritize resolution.</p>
          </div>
        </div>
      )}
      <div className="flex justify-between items-start">
        <div>
          <button onClick={() => navigate('/tickets')} className="text-sm text-emerald-600 hover:underline mb-2 block">
            &larr; Back to Tickets
          </button>
          <h1 className="text-2xl font-bold text-gray-900">#{ticket.id} - {ticket.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {ticket.status === 'NEW' && (!ticket.approvalRecords || ticket.approvalRecords.length === 0) && user?.role === 'ADMIN' && (
            <button onClick={() => submitMutation.mutate()} disabled={actionLoading}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              Submit for Approval
            </button>
          )}
          {ticket.status === 'NEW' && ticket.approvalRecords && ticket.approvalRecords.length > 0 && user?.role === 'ADMIN' && (
            <span className="text-sm text-slate-500 italic">Submitted for approval</span>
          )}
          {nextStatusMap[ticket.status] && (user?.role === 'ADMIN' || user?.role === 'RTB_OWNER' || user?.role === 'TECH_LEAD') && (
            <button onClick={() => statusMutation.mutate(nextStatusMap[ticket.status])} disabled={actionLoading}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              Move to {nextStatusMap[ticket.status].replace(/_/g, ' ')}
            </button>
          )}
          {(user?.role === 'ADMIN' || user?.role === 'RTB_OWNER' || user?.role === 'TECH_LEAD') && (
            <button onClick={() => navigate(`/tickets/${id}/edit`)}
              className="bg-slate-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-slate-700 disabled:opacity-50 transition-colors">
              Edit
            </button>
          )}
          {user && (
            <button onClick={() => navigate('/tickets/create', { state: { cloneFrom: ticket } })}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              Clone ticket
            </button>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-lg shadow p-4">
        <StatusTimeline currentStatus={ticket.status} />
      </div>

      {/* Main Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Problem Details</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description || 'No description provided'}</p>
            {ticket.anticipatedBenefits && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">Anticipated Benefits</p>
                <p className="text-sm text-green-700 mt-1">{ticket.anticipatedBenefits}</p>
              </div>
            )}
          </div>

          {/* Root Cause / Fix */}
          {(ticket.rootCause || ticket.workaround || ticket.permanentFix) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Resolution Details</h2>
              {ticket.rootCause && <div className="mb-3"><p className="text-sm font-medium text-gray-500">Root Cause</p><p className="text-gray-700 mt-1">{ticket.rootCause}</p></div>}
              {ticket.workaround && <div className="mb-3"><p className="text-sm font-medium text-gray-500">Workaround</p><p className="text-gray-700 mt-1">{ticket.workaround}</p></div>}
              {ticket.permanentFix && <div><p className="text-sm font-medium text-gray-500">Permanent Fix</p><p className="text-gray-700 mt-1">{ticket.permanentFix}</p></div>}
            </div>
          )}

          {/* Approval History */}
          {ticket.approvalRecords && ticket.approvalRecords.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Approval History</h2>
              <div className="space-y-2">
                {ticket.approvalRecords.map((a) => (
                  <div key={a.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{a.reviewerName}</span>
                      {a.comments && <p className="text-sm text-gray-500 mt-0.5">{a.comments}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      a.decision === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      a.decision === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'}`}>
                      {a.decision}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incident Links */}
          {ticket.incidentLinks && ticket.incidentLinks.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Linked Incidents</h2>
              <div className="space-y-2">
                {ticket.incidentLinks.map((link) => (
                  <div key={link.id} className="flex justify-between items-center p-3 bg-gray-50 rounded text-sm">
                    <div>
                      <span className="font-mono font-medium">{link.incidentNumber}</span>
                      <span className="ml-2 text-gray-500">{link.description}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">{link.linkType}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <h3 className="font-semibold text-gray-800">Ticket Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">INC Number</span><span className="font-mono">{ticket.servicenowIncidentNumber || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">PRB Number</span><span className="font-mono">{ticket.servicenowProblemNumber || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">PBT ID</span><span className="font-mono">{ticket.pbtId || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Classification</span><ClassificationBadge classification={ticket.classification} /></div>
              <div className="flex justify-between"><span className="text-gray-500">Region</span><span>{ticket.regionalCode}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">User Impact</span><span className="font-bold">{ticket.userImpactCount?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Priority</span><span>{ticket.priority != null && ticket.priority >= 1 && ticket.priority <= 5 ? `${ticket.priority} / 5` : '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Age</span><span>{ticket.ticketAgeDays} days</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Target SLA</span><span>{ticket.targetResolutionHours}h</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Application</span><span>{ticket.affectedApplication || '-'}</span></div>
              <hr />
              <div className="flex justify-between"><span className="text-gray-500">Created By</span><span>{ticket.createdBy}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Assigned To</span><span>{ticket.assignedTo || 'Unassigned'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Group</span><span>{ticket.assignmentGroup || '-'}</span></div>
              {ticket.confluenceLink && (
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500">Confluence</span>
                  <a href={ticket.confluenceLink} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline text-sm truncate" title={ticket.confluenceLink}>
                    View further details
                  </a>
                </div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Created</span><span>{new Date(ticket.createdDate).toLocaleDateString()}</span></div>
              {ticket.resolvedDate && (
                <div className="flex justify-between"><span className="text-gray-500">Resolved</span><span>{new Date(ticket.resolvedDate).toLocaleDateString()}</span></div>
              )}
            </div>
          </div>

          {/* Knowledge Article */}
          {ticket.knowledgeArticle && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Knowledge Article</h3>
              <p className="text-sm text-indigo-600 font-medium">{ticket.knowledgeArticle.title}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                ticket.knowledgeArticle.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {ticket.knowledgeArticle.status}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
