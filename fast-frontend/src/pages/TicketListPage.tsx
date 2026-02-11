import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosClient from '../shared/api/axiosClient';
import { problemApi } from '../shared/api/problemApi';
import { getApiErrorMessage } from '../shared/utils/apiError';
import type { FastProblem, PagedResponse, Classification, RegionalCode } from '../shared/types';
import { useDebounce } from '../hooks/useDebounce';
import TicketTable from '../components/TicketTable';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function TicketListPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [groupBy, setGroupBy] = useState<'none' | 'application'>('none');

  const debouncedSearch = useDebounce(search, 400);
  const debouncedApplication = useDebounce(applicationFilter, 400);

  const filterParams = {
    q: debouncedSearch.trim() || undefined,
    region: regionFilter.trim() || undefined,
    classification: classFilter.trim() || undefined,
    application: debouncedApplication.trim() || undefined,
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
      hasFilters ? problemApi.getWithFilters(filterParams, page) : problemApi.getAll(page),
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
      if (debouncedApplication.trim()) params.set('application', debouncedApplication.trim());
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Problem Tickets</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="border border-emerald-600 text-emerald-700 px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-all duration-200 text-sm font-medium shadow-sm"
          >
            Export CSV
          </button>
          <Link
            to="/tickets/create"
            className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
          >
            + Create Ticket
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4 animate-slide-up">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
            <input
              type="text"
              placeholder="INC, PRB, PBT, or title..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Application</label>
            <input
              type="text"
              placeholder="e.g. Finance Portal"
              value={applicationFilter}
              onChange={(e) => { setApplicationFilter(e.target.value); setPage(0); }}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Region</label>
            <select
              value={regionFilter}
              onChange={(e) => { setRegionFilter(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">All Regions</option>
              {(['USDS', 'UM', 'JPL', 'CHN'] as RegionalCode[]).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Classification</label>
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">All</option>
              {(['A', 'R', 'P'] as Classification[]).map((c) => (
                <option key={c} value={c}>{c} - {c === 'A' ? 'Approve' : c === 'R' ? 'Review' : 'Priority'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(0); }}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Group by</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'none' | 'application')}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="none">None</option>
              <option value="application">Application</option>
            </select>
          </div>
          <button
            onClick={clearFilters}
            className="text-sm text-slate-500 hover:text-slate-700 hover:underline py-2"
            title="Clear all filters and grouping"
          >
            Clear all
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Search: INC, PRB, PBT, title. Application: case-insensitive. Dates: filter by created date. Clear all resets filters and grouping.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up stagger-2">
        {isLoading ? (
          <LoadingSpinner message="Loading tickets..." />
        ) : error ? (
          <div className="text-center py-12 text-rose-500">Failed to load tickets</div>
        ) : !data || data.content.length === 0 ? (
          <EmptyState message="No tickets found" />
        ) : (
          <>
            <TicketTable tickets={data.content} groupBy={groupBy} />
            <div className="flex justify-between items-center px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-sm text-slate-500">
                Showing {data.page * data.size + 1}-{Math.min((data.page + 1) * data.size, data.totalElements)} of {data.totalElements}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-slate-200/80 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={data.last}
                  className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-slate-200/80 transition-colors"
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
