import type { TicketStatus } from '../shared/types';

const statusFlow: TicketStatus[] = [
  'NEW', 'ASSIGNED', 'IN_PROGRESS', 'ROOT_CAUSE_IDENTIFIED', 'FIX_IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ARCHIVED'
];

const statusLabels: Record<string, string> = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  ROOT_CAUSE_IDENTIFIED: 'RCA Done',
  FIX_IN_PROGRESS: 'Fix In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
  ARCHIVED: 'Archived',
};

export default function StatusTimeline({ currentStatus }: { currentStatus: TicketStatus }) {
  if (currentStatus === 'REJECTED') {
    return (
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Rejected
        </span>
      </div>
    );
  }
  if (currentStatus === 'ARCHIVED') {
    return (
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200">
          Archived
        </span>
      </div>
    );
  }

  const currentIndex = statusFlow.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {statusFlow.map((status, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={status} className="flex items-center">
            <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
              isCurrent
                ? 'bg-primary text-white'
                : isCompleted
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
            }`}>
              {statusLabels[status]}
            </div>
            {index < statusFlow.length - 1 && (
              <div className={`w-4 h-0.5 ${isCompleted ? 'bg-green-400 dark:bg-emerald-500' : 'bg-gray-200 dark:bg-slate-600'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
