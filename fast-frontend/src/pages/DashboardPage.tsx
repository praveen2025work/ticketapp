import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../shared/api/dashboardApi';
import { problemApi } from '../shared/api/problemApi';
import type { DashboardMetrics } from '../shared/types';
import type { FastProblem, PagedResponse } from '../shared/types';
import MetricsCards from '../components/MetricsCards';
import type { StatusFilter } from '../components/MetricsCards';
import LoadingSpinner from '../components/LoadingSpinner';
import DashboardCharts from '../components/DashboardCharts';
import TicketTable from '../components/TicketTable';

export default function DashboardPage() {
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>(null);

  const { data: metrics, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => dashboardApi.getMetrics(),
  });

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery<PagedResponse<FastProblem>>({
    queryKey: ['dashboard', 'tickets', selectedFilter],
    queryFn: async () => {
      if (!selectedFilter) return problemApi.getAll(0, 50);
      if (selectedFilter === 'OPEN') {
        return problemApi.getWithFilters({ status: 'OPEN' }, 0, 50);
      }
      return problemApi.getByStatus(selectedFilter, 0, 50);
    },
    enabled: true,
  });

  if (isLoading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error || !metrics) return <div className="text-center py-12 text-rose-500">Failed to load metrics</div>;

  const sectionTitle =
    selectedFilter === 'OPEN'
      ? 'Open Tickets'
      : selectedFilter === 'RESOLVED'
        ? 'Resolved Tickets'
        : selectedFilter === 'CLOSED'
          ? 'Closed Tickets'
          : 'All Tickets';

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>

      <div className="animate-slide-up">
        <MetricsCards
          metrics={metrics}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />
      </div>

      <DashboardCharts metrics={metrics} />

      <div className="animate-slide-up">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">{sectionTitle}</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <TicketTable
            tickets={ticketsData?.content ?? []}
            isLoading={ticketsLoading}
          />
        </div>
      </div>
    </div>
  );
}
