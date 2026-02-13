import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../shared/api/dashboardApi';
import type { FastProblem } from '../shared/types';
import TicketTable from '../components/TicketTable';
import LoadingSpinner from '../components/LoadingSpinner';
import ApiErrorState from '../components/ApiErrorState';

export default function UpstreamPage() {
  const [linkTypeFilter, setLinkTypeFilter] = useState<string>('');
  const { data: upstream = [], isLoading, error, refetch } = useQuery<FastProblem[]>({
    queryKey: ['dashboard', 'upstream', linkTypeFilter],
    queryFn: () => dashboardApi.getUpstream(linkTypeFilter || undefined),
  });

  if (isLoading) return <LoadingSpinner message="Loading upstream items..." />;
  if (error) {
    return (
      <ApiErrorState
        title="Failed to load upstream items"
        error={error}
        onRetry={() => refetch()}
        className="text-center py-12 px-4"
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Upstream Items</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Tickets with JIRA or ServiceFirst links. Track dependencies on external systems.
          </p>
        </div>
        <select
          value={linkTypeFilter}
          onChange={(e) => setLinkTypeFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-primary/30 outline-none min-w-[140px]"
          aria-label="Filter by link type"
        >
          <option value="">All (JIRA + ServiceFirst)</option>
          <option value="JIRA">JIRA only</option>
          <option value="SERVICEFIRST">ServiceFirst only</option>
        </select>
      </div>

      {upstream.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600 p-12 text-center text-slate-500 dark:text-slate-400">
          No upstream items found. Add JIRA or ServiceFirst links to tickets from the ticket detail page.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600 overflow-hidden">
          <TicketTable tickets={upstream} showUpstreamLinks />
        </div>
      )}
    </div>
  );
}
