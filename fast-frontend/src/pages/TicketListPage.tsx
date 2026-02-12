import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import axiosClient from '../shared/api/axiosClient';
import { problemApi } from '../shared/api/problemApi';
import { applicationsApi } from '../shared/api/applicationsApi';
import { getApiErrorMessage } from '../shared/utils/apiError';
import type { FastProblem, PagedResponse, Classification, RegionalCode } from '../shared/types';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../shared/context/AuthContext';
import TicketTable from '../components/TicketTable';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const SORT_BY = 'createdDate' as const;
const SORT_DIRECTION = 'desc' as const;

export default function TicketListPage() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'READ_ONLY';
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [applicationFilter, setApplicationFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [groupBy, setGroupBy] = useState<'none' | 'application'>('none');

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
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };

  const hasFilters = !!(
    filterParams.q ||
    filterParams.region ||
    filterParams.classification ||
    filterParams.application ||
    filterParams.fromDate ||
    filterParams.toDate
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['problems', page, filterParams.q, filterParams.region, filterParams.classification, filterParams.application, filterParams.fromDate, filterParams.toDate],
    queryFn: (): Promise<PagedResponse<FastProblem>> =>
      hasFilters
        ? problemApi.getWithFilters(filterParams, page, 20, SORT_BY, SORT_DIRECTION)
        : problemApi.getAll(page, 20, SORT_BY, SORT_DIRECTION),
    staleTime: 0,
  });

  const clearFilters = () => {
    setSearch('');
    setRegionFilter('');
    setClassFilter('');
    setApplicationFilter('');
    setFromDate('');
    setToDate('');
    setGroupBy('none');
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ limit: '1000' });
      if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
      if (regionFilter) params.set('region', regionFilter);
      if (classFilter) params.set('classification', classFilter);
      if (applicationFilter) params.set('application', applicationFilter);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
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

      <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-600 p-5 space-y-4 animate-slide-up">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Search</label>
            <input
              type="text"
              placeholder="INC, PRB, PBT, or title..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Application</label>
            <select
              value={applicationFilter}
              onChange={(e) => { setApplicationFilter(e.target.value); setPage(0); }}
              className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
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
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Region</label>
            <select
              value={regionFilter}
              onChange={(e) => { setRegionFilter(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">All Regions</option>
              {(['APAC', 'EMEA', 'AMER'] as RegionalCode[]).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Classification</label>
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">All</option>
              {(['A', 'R', 'P'] as Classification[]).map((c) => (
                <option key={c} value={c}>{c} - {c === 'A' ? 'Approve' : c === 'R' ? 'Review' : 'Priority'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Group by</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'none' | 'application')}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="none">None</option>
              <option value="application">Application</option>
            </select>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            title="Clear all filters and grouping"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-500 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-400 transition-all duration-200 shadow-sm"
          >
            <ArrowPathIcon className="w-4 h-4 shrink-0" aria-hidden />
            <span>Clear all</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Search: INC, PRB, PBT, title. Tickets ordered by created date (newest first). Dates: filter by created date. Clear all resets filters and grouping.
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
            <TicketTable tickets={data.content} groupBy={groupBy} />
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
