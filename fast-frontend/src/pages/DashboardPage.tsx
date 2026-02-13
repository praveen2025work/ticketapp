import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../shared/api/dashboardApi';
import { problemApi } from '../shared/api/problemApi';
import { applicationsApi } from '../shared/api/applicationsApi';
import type { DashboardMetrics } from '../shared/types';
import type { FastProblem, PagedResponse, RegionalCode } from '../shared/types';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import MetricsCards from '../components/MetricsCards';
import type { StatusFilter } from '../components/MetricsCards';
import LoadingSpinner from '../components/LoadingSpinner';
import DashboardCharts from '../components/DashboardCharts';
import TicketTable, { type BackFilters } from '../components/TicketTable';
import ApiErrorState from '../components/ApiErrorState';

const REGIONS: RegionalCode[] = ['APAC', 'EMEA', 'AMER'];
const BACKLOG_PAGE_SIZE = 100;

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>(null);
  const [applicationFilter, setApplicationFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'overall' | 'weekly' | 'monthly'>('overall');
  const [backlogPage, setBacklogPage] = useState(0);
  const isReadOnly = user?.role === 'READ_ONLY';

  const metricsFilter = {
    ...(applicationFilter && { application: applicationFilter }),
    ...(regionFilter && { region: regionFilter }),
    ...(periodFilter !== 'overall' && { period: periodFilter }),
  };
  const { data: metrics, isLoading, error, refetch } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard', 'metrics', applicationFilter, regionFilter, periodFilter],
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
    ...(selectedFilter === 'ARCHIVED' && { status: 'ARCHIVED' as const }),
    ...(applicationFilter && { application: applicationFilter }),
    ...(regionFilter && { region: regionFilter }),
  };

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery<PagedResponse<FastProblem>>({
    queryKey: ['dashboard', 'tickets', selectedFilter, applicationFilter, regionFilter],
    queryFn: async () => {
      const hasFilters = Object.keys(ticketFilters).length > 0;
      if (!hasFilters) return problemApi.getAll(0, 100, 'createdDate', 'desc');
      return problemApi.getWithFilters(ticketFilters, 0, 100, 'createdDate', 'desc');
    },
    enabled: !!selectedFilter,
  });

  const { data: inProgressWithoutComment = [] } = useQuery<FastProblem[]>({
    queryKey: ['dashboard', 'in-progress-without-comment'],
    queryFn: () => dashboardApi.getInProgressWithoutRecentComment(),
  });

  const { data: top10 = [] } = useQuery<FastProblem[]>({
    queryKey: ['dashboard', 'top10', regionFilter],
    queryFn: () => dashboardApi.getTop10(regionFilter || undefined),
  });

  const { data: backlog, isFetching: backlogLoading } = useQuery<PagedResponse<FastProblem>>({
    queryKey: ['dashboard', 'backlog', regionFilter, backlogPage],
    queryFn: () => dashboardApi.getBacklog({ region: regionFilter || undefined, page: backlogPage, size: BACKLOG_PAGE_SIZE }),
  });

  useEffect(() => {
    queueMicrotask(() => setBacklogPage(0));
  }, [regionFilter]);

  if (isLoading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error || !metrics) {
    return (
      <ApiErrorState
        title="Failed to load dashboard"
        error={error}
        onRetry={() => refetch()}
        fallbackMessage="Failed to load metrics. Check that the backend is running."
        className="text-center py-12 px-4"
      />
    );
  }

  const sectionTitle =
    selectedFilter === 'OPEN'
      ? 'Open Tickets'
      : selectedFilter === 'RESOLVED'
        ? 'Resolved Tickets'
        : selectedFilter === 'CLOSED'
          ? 'Closed Tickets'
          : selectedFilter === 'ARCHIVED'
            ? 'Archived Tickets'
            : '';
  const filterHint = hasTicketFilters
    ? [applicationFilter, regionFilter].filter(Boolean).join(' · ')
    : null;
  const showTicketsSection = !!selectedFilter;
  const backlogItems = backlog?.content ?? [];
  const backlogTotalPages = backlog?.totalPages ?? 0;
  const backlogHasPrev = backlogPage > 0;
  const backlogHasNext = backlogTotalPages > 0 && backlogPage + 1 < backlogTotalPages;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Executive Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">View</span>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as 'overall' | 'weekly' | 'monthly')}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all min-w-[120px]"
            aria-label="Period"
          >
            <option value="overall">Overall</option>
            <option value="weekly">Weekly (7d)</option>
            <option value="monthly">Monthly (30d)</option>
          </select>
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

      {periodFilter !== 'overall' && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing metrics for the last {periodFilter === 'weekly' ? '7' : '30'} days.
        </p>
      )}

      <div className="animate-slide-up">
        <MetricsCards
          metrics={metrics}
          selectedFilter={selectedFilter}
          onFilterChange={isReadOnly ? undefined : setSelectedFilter}
          onNavigateToTickets={
            isReadOnly
              ? undefined
              : (status) => {
                  const params = new URLSearchParams();
                  params.set('status', status);
                  if (regionFilter) params.set('region', regionFilter);
                  if (applicationFilter) params.set('application', applicationFilter);
                  navigate(`/tickets?${params.toString()}`);
                }
          }
        />
      </div>

      <DashboardCharts
        metrics={metrics}
        onNavigateToTickets={(filters) => {
          const params = new URLSearchParams();
          if (filters.status) params.set('status', filters.status);
          if (filters.region) params.set('region', filters.region);
          if (filters.classification) params.set('classification', filters.classification);
          if (filters.ragStatus) params.set('ragStatus', filters.ragStatus);
          navigate(`/tickets?${params.toString()}`);
        }}
      />

      {top10.length > 0 && (
        <div className="animate-slide-up">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Top 10 Finance Daily Production</h2>
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600 overflow-hidden">
            <TicketTable
              tickets={top10}
              backFilters={(() => {
                const f: BackFilters = {};
                if (regionFilter) f.region = regionFilter;
                if (applicationFilter) f.application = applicationFilter;
                if (selectedFilter) f.status = selectedFilter;
                return Object.keys(f).length > 0 ? f : undefined;
              })()}
            />
          </div>
        </div>
      )}

      {backlogItems.length > 0 && (
        <div className="animate-slide-up">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Backlog (bi-weekly review)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Tickets not yet In Progress (NEW, ASSIGNED).</p>
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600 overflow-hidden">
            {backlogTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Page {backlogPage + 1} of {backlogTotalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBacklogPage((p) => Math.max(0, p - 1))}
                    disabled={!backlogHasPrev || backlogLoading}
                    className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setBacklogPage((p) => p + 1)}
                    disabled={!backlogHasNext || backlogLoading}
                    className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            <TicketTable
              tickets={backlogItems}
              backFilters={(() => {
                const f: BackFilters = {};
                if (regionFilter) f.region = regionFilter;
                if (applicationFilter) f.application = applicationFilter;
                return Object.keys(f).length > 0 ? f : undefined;
              })()}
            />
          </div>
        </div>
      )}

      {inProgressWithoutComment.length > 0 && (
        <div className="animate-slide-up bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-700 p-6">
          <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
            In Progress without daily commentary ({inProgressWithoutComment.length})
          </h2>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
            Daily commentary required. Add a comment to each ticket below.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200 dark:border-amber-700">
                  <th className="text-left py-2 font-medium">FAST ID</th>
                  <th className="text-left py-2 font-medium">Title</th>
                  <th className="text-left py-2 font-medium">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {inProgressWithoutComment.map((t) => (
                  <tr key={t.id} className="border-b border-amber-100 dark:border-amber-800/50">
                    <td className="py-2">
                      <Link
                        to={`/tickets/${t.id}`}
                        state={(() => {
                          const f: BackFilters = {};
                          if (regionFilter) f.region = regionFilter;
                          if (applicationFilter) f.application = applicationFilter;
                          return Object.keys(f).length > 0 ? { filters: f } : undefined;
                        })()}
                        className="text-primary hover:underline font-medium"
                      >
                        FAST-{t.id}
                      </Link>
                    </td>
                    <td className="py-2 text-slate-700 dark:text-slate-300 truncate max-w-xs">{t.title}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-400">{t.assignedTo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              backFilters={(() => {
                const f: BackFilters = {};
                if (regionFilter) f.region = regionFilter;
                if (applicationFilter) f.application = applicationFilter;
                if (selectedFilter) f.status = selectedFilter;
                return Object.keys(f).length > 0 ? f : undefined;
              })()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
