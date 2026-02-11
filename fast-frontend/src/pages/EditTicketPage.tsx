import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { problemApi } from '../shared/api/problemApi';
import type { UpdateFastProblemRequest } from '../shared/types';
import TicketForm from '../components/TicketForm';
import LoadingSpinner from '../components/LoadingSpinner';

export default function EditTicketPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  if (isLoading || !ticket) return <LoadingSpinner message="Loading ticket..." />;
  if (error) return <div className="text-center py-8 text-red-500">Failed to load ticket</div>;

  const initialData = {
    title: ticket.title,
    description: ticket.description || '',
    servicenowIncidentNumber: ticket.servicenowIncidentNumber || '',
    servicenowProblemNumber: ticket.servicenowProblemNumber || '',
    userImpactCount: ticket.userImpactCount || 0,
    affectedApplication: ticket.affectedApplication || '',
    anticipatedBenefits: ticket.anticipatedBenefits || '',
    regionalCode: ticket.regionalCode,
    targetResolutionHours: ticket.targetResolutionHours || 48,
    priority: ticket.priority ?? 3,
    assignedTo: ticket.assignedTo || '',
    assignmentGroup: ticket.assignmentGroup || '',
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
        onSubmit={(data) => updateMutation.mutate(data as UpdateFastProblemRequest)}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
