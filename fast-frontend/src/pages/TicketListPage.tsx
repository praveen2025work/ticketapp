import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import axiosClient from '../shared/api/axiosClient';
import { problemApi } from '../shared/api/problemApi';
import { applicationsApi } from '../shared/api/applicationsApi';
import { getApiErrorMessage } from '../shared/utils/apiError';
import { getDefaultTicketDateRange } from '../shared/utils/dateUtils';
import type { FastProblem, PagedResponse, Classification, RegionalCode } from '../shared/types';
import { STATUS_FILTER_OPTIONS } from '../shared/types';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../shared/context/AuthContext';
import TicketTable from '../components/TicketTable';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ApiErrorState from '../components/ApiErrorState';

const SORT_BY = 'createdDate' as const;
const SORT_DIRECTION = 'desc' as const;
const PAGE_SIZE = 100;

export default function TicketListPage() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'READ_ONLY';
  const [searchParams] = useSearchParams();
  const defaultRange = getDefaultTicketDateRange();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [regionFilter, setRegionFilter] = useState(searchParams.get('region') ?? '');
  const [classFilter, setClassFilter] = useState(searchParams.get('classification') ?? '');
  const [applicationFilter, setApplicationFilter] = useState<string>(searchParams.get('application') ?? '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [ragFilter, setRagFilter] = useState(searchParams.get('ragStatus') ?? '');
  const [fromDate, setFromDate] = useState(searchParams.get('fromDate') ?? defaultRange.fromDate);
  const [toDate, setToDate] = useState(searchParams.get('toDate') ?? defaultRange.toDate);
  const [ageMin, setAgeMin] = useState<number | ''>(searchParams.get('ageMin') ? parseInt(searchParams.get('ageMin')!, 10) : '');
  const [ageMax, setAgeMax] = useState<number | ''>(searchParams.get('ageMax') ? parseInt(searchParams.get('ageMax')!, 10) : '');
  const [minImpact, setMinImpact] = useState<number | ''>(searchParams.get('minImpact') ? parseInt(searchParams.get('minImpact')!, 10) : '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') ?? '');
  const [groupBy, setGroupBy] = useState<'none' | 'application'>('none');

  useEffect(() => {
    const range = getDefaultTicketDateRange();
    const q = searchParams.get('q') ?? '';
    const region = searchParams.get('region') ?? '';
    const cls = searchParams.get('classification') ?? '';
    const app = searchParams.get('application') ?? '';
    const status = searchParams.get('status') ?? '';
    const rag = searchParams.get('ragStatus') ?? '';
    const from = searchParams.get('fromDate') ?? range.fromDate;
    const to = searchParams.get('toDate') ?? range.toDate;
    const ageMinVal = searchParams.get('ageMin');
    const ageMaxVal = searchParams.get('ageMax');
    const minImpactVal = searchParams.get('minImpact');
    const priority = searchParams.get('priority') ?? '';
    queueMicrotask(() => {
      setSearch(q);
      setRegionFilter(region);
      setClassFilter(cls);
      setApplicationFilter(app);
      setStatusFilter(status);
      setRagFilter(rag);
      setFromDate(from);
      setToDate(to);
      setAgeMin(ageMinVal ? parseInt(ageMinVal, 10) : '');
      setAgeMax(ageMaxVal ? parseInt(ageMaxVal, 10) : '');
      setMinImpact(minImpactVal ? parseInt(minImpactVal, 10) : '');
      setPriorityFilter(priority);
      setPage(0);
    });
  }, [searchParams]);

  const debouncedSearch = useDebounce(search, 400);

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list(),
  });

  const filterParams = {
    q: debouncedSearch.trim() || undefined,
    region: regionFilter.trim() || undefined,
    classification: classFilter.trim() || undefined,
    application: applicationFilter || undefined,
    status: statusFilter.trim() || undefined,
    ragStatus: ragFilter.trim() || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    ageMin: typeof ageMin === 'number' && ageMin >= 0 ? ageMin : undefined,
    ageMax: typeof ageMax === 'number' && ageMax >= 0 ? ageMax : undefined,
    minImpact: typeof minImpact === 'number' && minImpact >= 0 ? minImpact : undefined,
    priority: priorityFilter && /^[1-5]$/.test(priorityFilter) ? parseInt(priorityFilter, 10) : undefined,
  };

  const hasFilters = !!(
    filterParams.q ||
    filterParams.region ||
    filterParams.classification ||
    filterParams.application ||
    filterParams.status ||
    filterParams.ragStatus ||
    filterParams.fromDate ||
    filterParams.toDate ||
    filterParams.ageMin != null ||
    filterParams.ageMax != null ||
    filterParams.minImpact != null ||
    filterParams.priority != null
  );

  const hasActiveFilters = !!(
    search.trim() ||
    regionFilter ||
    applicationFilter ||
    classFilter ||
    statusFilter ||
    ragFilter ||
    ageMin !== '' ||
    ageMax !== '' ||
    minImpact !== '' ||
    priorityFilter ||
    groupBy === 'application' ||
    fromDate !== defaultRange.fromDate ||
    toDate !== defaultRange.toDate
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['problems', page, filterParams.q, filterParams.region, filterParams.classification, filterParams.application, filterParams.status, filterParams.ragStatus, filterParams.fromDate, filterParams.toDate, filterParams.ageMin, filterParams.ageMax, filterParams.minImpact, filterParams.priority],
    queryFn: (): Promise<PagedResponse<FastProblem>> =>
      hasFilters
        ? problemApi.getWithFilters(filterParams, page, PAGE_SIZE, SORT_BY, SORT_DIRECTION)
        : problemApi.getAll(page, PAGE_SIZE, SORT_BY, SORT_DIRECTION),
    staleTime: 0,
  });

  const clearFilters = () => {
    const range = getDefaultTicketDateRange();
    setSearch('');
    setRegionFilter('');
    setClassFilter('');
    setApplicationFilter('');
    setStatusFilter('');
    setRagFilter('');
    setFromDate(range.fromDate);
    setToDate(range.toDate);
    setAgeMin('');
    setAgeMax('');
    setMinImpact('');
    setPriorityFilter('');
    setGroupBy('none');
    setPage(0);
  };

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Problem Tickets</h1>
        <ApiErrorState
          title="Failed to load tickets"
          error={error}
          onRetry={() => refetch()}
          className="text-center py-8 px-4"
        />
      </div>
    );
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ limit: '1000' });
      if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
      if (regionFilter) params.set('region', regionFilter);
      if (classFilter) params.set('classification', classFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (ragFilter) params.set('ragStatus', ragFilter);
      if (applicationFilter) params.set('application', applicationFilter);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      if (typeof ageMin === 'number' && ageMin >= 0) params.set('ageMin', String(ageMin));
      if (typeof ageMax === 'number' && ageMax >= 0) params.set('ageMax', String(ageMax));
      if (typeof minImpact === 'number' && minImpact >= 0) params.set('minImpact', String(minImpact));
      if (priorityFilter && /^[1-5]$/.test(priorityFilter)) params.set('priority', priorityFilter);
      const res = await axiosClient.get(`/problems/export?${params}`, { responseType: 'blob' });
      if (res.status !== 200 || !(res.data instanceof Blob)) {
        toast.error('Export failed: invalid response');
        return;
      }
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tickets.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (err) {
      const message = err && typeof err === 'object' && 'response' in err && (err as { response?: { data?: unknown } }).response?.data instanceof Blob
        ? 'Export failed (check network or try again)'
        : getApiErrorMessage(err, 'Export failed');
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600 p-5 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Problem Tickets</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="border border-primary text-primary px-4 py-2.5 rounded-xl hover:bg-primary/10 transition-all duration-200 text-sm font-medium shadow-sm dark:border-primary dark:text-primary dark:hover:bg-primary/20"
            >
              Export CSV
            </button>
            {!isReadOnly && (
              <Link
                to="/tickets/create"
                className="bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary-hover transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
              >
                + Create Ticket
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[200px] flex-1">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Search</label>
            <input
              type="text"
              placeholder="INC, PRB, PBT, title, description..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Region</label>
            <select
              value={regionFilter}
              onChange={(e) => { setRegionFilter(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">All Regions</option>
              {(['APAC', 'EMEA', 'AMER'] as RegionalCode[]).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Application</label>
            <select
              value={applicationFilter}
              onChange={(e) => { setApplicationFilter(e.target.value); setPage(0); }}
              className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">All applications</option>
              {applications.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}{a.code ? ` (${a.code})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Classification</label>
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">All</option>
              {(['A', 'R', 'P'] as Classification[]).map((c) => (
                <option key={c} value={c}>{c} - {c === 'A' ? 'Approve' : c === 'R' ? 'Review' : 'Priority'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">RAG</label>
            <select
              value={ragFilter}
              onChange={(e) => { setRagFilter(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">All</option>
              <option value="G">G – Green (≤15d)</option>
              <option value="A">A – Amber (15–20d)</option>
              <option value="R">R – Red (&gt;20d)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Age (min days)</label>
            <input
              type="number"
              min={0}
              placeholder="—"
              value={ageMin === '' ? '' : ageMin}
              onChange={(e) => { const v = e.target.value; setAgeMin(v === '' ? '' : Math.max(0, parseInt(v, 10) || 0)); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm w-20 outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Age (max days)</label>
            <input
              type="number"
              min={0}
              placeholder="—"
              value={ageMax === '' ? '' : ageMax}
              onChange={(e) => { const v = e.target.value; setAgeMax(v === '' ? '' : Math.max(0, parseInt(v, 10) || 0)); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm w-20 outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Min Impact</label>
            <input
              type="number"
              min={0}
              placeholder="—"
              value={minImpact === '' ? '' : minImpact}
              onChange={(e) => { const v = e.target.value; setMinImpact(v === '' ? '' : Math.max(0, parseInt(v, 10) || 0)); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm w-20 outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">All</option>
              <option value="1">1 - Highest</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5 - Lowest</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Group by</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'none' | 'application')}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="none">None</option>
              <option value="application">Application</option>
            </select>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            title="Clear all filters and grouping"
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all duration-200 shadow-sm ${
              hasActiveFilters
                ? 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                : 'border-slate-200 dark:border-slate-500 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-400'
            }`}
          >
            <ArrowPathIcon className="w-4 h-4 shrink-0" aria-hidden />
            <span>Clear all</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
          Search: INC, PRB, PBT, title, description (case-insensitive). Scope: Region, Application, Classification. Status & RAG. Dates: created-date range. Metrics: Age (days), Min Impact, Priority (1–5).
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600 overflow-hidden animate-slide-up stagger-2">
        {isLoading ? (
          <LoadingSpinner message="Loading tickets..." />
        ) : error ? (
          <div className="text-center py-12 text-rose-500">Failed to load tickets</div>
        ) : !data || data.content.length === 0 ? (
          <EmptyState message="No tickets found" />
        ) : (
          <>
            <TicketTable
              tickets={data.content}
              groupBy={groupBy}
              backFilters={{
                q: debouncedSearch.trim() || undefined,
                region: regionFilter || undefined,
                classification: classFilter || undefined,
                application: applicationFilter || undefined,
                status: statusFilter || undefined,
                ragStatus: ragFilter || undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                ageMin: filterParams.ageMin,
                ageMax: filterParams.ageMax,
                minImpact: filterParams.minImpact,
                priority: filterParams.priority,
              }}
            />
            <div className="flex justify-between items-center px-5 py-4 border-t border-slate-100 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Showing {data.page * data.size + 1}-{Math.min((data.page + 1) * data.size, data.totalElements)} of {data.totalElements}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50 hover:bg-slate-200/80 dark:hover:bg-slate-600 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={data.last}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50 hover:bg-slate-200/80 dark:hover:bg-slate-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
