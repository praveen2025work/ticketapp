import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../shared/api/dashboardApi';
import { problemApi } from '../shared/api/problemApi';
import { applicationsApi } from '../shared/api/applicationsApi';
import type { DashboardMetrics } from '../shared/types';
import type { FastProblem, PagedResponse, RegionalCode } from '../shared/types';
import { useAuth } from '../shared/context/AuthContext';
import MetricsCards from '../components/MetricsCards';
import type { StatusFilter } from '../components/MetricsCards';
import LoadingSpinner from '../components/LoadingSpinner';
import DashboardCharts from '../components/DashboardCharts';
import TicketTable from '../components/TicketTable';

const REGIONS: RegionalCode[] = ['APAC', 'EMEA', 'AMER'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>(null);
  const [applicationFilter, setApplicationFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const isReadOnly = user?.role === 'READ_ONLY';

  const metricsFilter = {
    ...(applicationFilter && { application: applicationFilter }),
    ...(regionFilter && { region: regionFilter }),
  };
  const { data: metrics, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard', 'metrics', applicationFilter, regionFilter],
    queryFn: () => dashboardApi.getMetrics(
      Object.keys(metricsFilter).length > 0 ? metricsFilter : undefined
    ),
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list(),
  });

  const hasTicketFilters = !!applicationFilter || !!regionFilter;
  const ticketFilters = {
    ...(selectedFilter === 'OPEN' && { status: 'OPEN' as const }),
    ...(selectedFilter === 'RESOLVED' && { status: 'RESOLVED' as const }),
    ...(selectedFilter === 'CLOSED' && { status: 'CLOSED' as const }),
    ...(applicationFilter && { application: applicationFilter }),
    ...(regionFilter && { region: regionFilter }),
  };

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery<PagedResponse<FastProblem>>({
    queryKey: ['dashboard', 'tickets', selectedFilter, applicationFilter, regionFilter],
    queryFn: async () => {
      const hasFilters = Object.keys(ticketFilters).length > 0;
      if (!hasFilters) return problemApi.getAll(0, 50, 'createdDate', 'desc');
      return problemApi.getWithFilters(ticketFilters, 0, 50, 'createdDate', 'desc');
    },
    enabled: !!selectedFilter,
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
          : '';
  const filterHint = hasTicketFilters
    ? [applicationFilter, regionFilter].filter(Boolean).join(' · ')
    : null;
  const showTicketsSection = !!selectedFilter;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Executive Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">Tickets</span>
          <select
            value={applicationFilter}
            onChange={(e) => setApplicationFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all min-w-[140px]"
            aria-label="Filter by application"
          >
            <option value="">All applications</option>
            {applications.map((a) => (
              <option key={a.id} value={a.name}>{a.name}{a.code ? ` (${a.code})` : ''}</option>
            ))}
          </select>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all min-w-[100px]"
            aria-label="Filter by region"
          >
            <option value="">All regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {hasTicketFilters && (
            <button
              type="button"
              onClick={() => { setApplicationFilter(''); setRegionFilter(''); }}
              className="h-9 px-2.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Clear filters"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="animate-slide-up">
        <MetricsCards
          metrics={metrics}
          selectedFilter={selectedFilter}
          onFilterChange={isReadOnly ? undefined : setSelectedFilter}
        />
      </div>

      <DashboardCharts metrics={metrics} />

      {showTicketsSection && (
        <div className="animate-slide-up">
          <div className="flex flex-wrap items-baseline gap-2 mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{sectionTitle}</h2>
            {filterHint && (
              <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">— {filterHint}</span>
            )}
          </div>
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600 overflow-hidden">
            <TicketTable
              tickets={ticketsData?.content ?? []}
              isLoading={ticketsLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
