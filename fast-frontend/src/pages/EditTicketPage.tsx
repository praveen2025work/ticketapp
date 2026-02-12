import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { problemApi } from '../shared/api/problemApi';
import type { UpdateFastProblemRequest, RegionalCode } from '../shared/types';
import TicketForm from '../components/TicketForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../shared/context/AuthContext';

const ROLES_CAN_EDIT = ['ADMIN', 'RTB_OWNER', 'TECH_LEAD'];

export default function EditTicketPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['problems', id],
    queryFn: () => problemApi.getById(Number(id!)),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateFastProblemRequest) => problemApi.update(Number(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      queryClient.invalidateQueries({ queryKey: ['problems', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
      navigate(`/tickets/${id}`);
    },
  });

  if (user && !ROLES_CAN_EDIT.includes(user.role)) {
    return <Navigate to={`/tickets/${id}`} replace />;
  }
  if (isLoading || !ticket) return <LoadingSpinner message="Loading ticket..." />;
  if (error) return <div className="text-center py-8 text-red-500">Failed to load ticket</div>;

  const initialData = {
    title: ticket.title,
    description: ticket.description || '',
    servicenowIncidentNumber: ticket.servicenowIncidentNumber || '',
    servicenowProblemNumber: ticket.servicenowProblemNumber || '',
    userImpactCount: ticket.userImpactCount || 0,
    affectedApplication: ticket.affectedApplication || '',
    requestNumber: ticket.requestNumber || '',
    applicationIds: ticket.applications?.map((a) => a.id) ?? [],
    anticipatedBenefits: ticket.anticipatedBenefits || '',
    regionalCodes: (ticket.regionalCodes?.length ? ticket.regionalCodes : ['AMER']) as RegionalCode[],
    targetResolutionHours: ticket.targetResolutionHours || 48,
    priority: ticket.priority ?? 3,
    assignedTo: ticket.assignedTo || '',
    assignmentGroup: ticket.assignmentGroup || '',
    btbTechLeadUsername: ticket.btbTechLeadUsername ?? '',
    rootCause: ticket.rootCause || '',
    workaround: ticket.workaround || '',
    permanentFix: ticket.permanentFix || '',
    confluenceLink: ticket.confluenceLink || '',
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Ticket #{id}</h1>
      <TicketForm
        initialData={initialData}
        mode="edit"
        ticketStatus={ticket.status}
        onSubmit={(data) => updateMutation.mutate(data as UpdateFastProblemRequest)}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
