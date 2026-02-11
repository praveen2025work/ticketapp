import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { problemApi } from '../shared/api/problemApi';
import type { CreateFastProblemRequest, FastProblem } from '../shared/types';
import TicketForm from '../components/TicketForm';

function buildInitialDataFromClone(ticket: FastProblem): Partial<CreateFastProblemRequest> {
  return {
    title: `Amendment of #${ticket.id}: ${ticket.title}`,
    description: ticket.description || '',
    servicenowIncidentNumber: ticket.servicenowIncidentNumber || '',
    servicenowProblemNumber: ticket.servicenowProblemNumber || '',
    pbtId: ticket.pbtId || '',
    userImpactCount: ticket.userImpactCount || 0,
    affectedApplication: ticket.affectedApplication || '',
    regionalCode: ticket.regionalCode,
    targetResolutionHours: ticket.targetResolutionHours || 48,
    priority: ticket.priority ?? 3,
    anticipatedBenefits: ticket.anticipatedBenefits || '',
    assignedTo: ticket.assignedTo || '',
    assignmentGroup: ticket.assignmentGroup || '',
    confluenceLink: ticket.confluenceLink || '',
  };
}

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const cloneFrom = (location.state as { cloneFrom?: FastProblem } | null)?.cloneFrom;
  const initialData = cloneFrom ? buildInitialDataFromClone(cloneFrom) : undefined;

  const createMutation = useMutation({
    mutationFn: (data: CreateFastProblemRequest) => problemApi.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
      navigate(`/tickets/${result.id}`);
    },
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {initialData ? `Create ticket (cloned from #${cloneFrom!.id})` : 'Create FAST Problem Ticket'}
      </h1>
      {initialData && (
        <p className="text-sm text-gray-500 mb-4">
          Form is pre-filled from the original ticket. Update as needed and submit to create a new ticket.
        </p>
      )}

      <TicketForm
        initialData={initialData}
        mode="create"
        onSubmit={(data) => createMutation.mutate(data as CreateFastProblemRequest)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
