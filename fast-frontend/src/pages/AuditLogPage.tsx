import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../shared/api/auditApi';
import { problemApi } from '../shared/api/problemApi';
import { applicationsApi } from '../shared/api/applicationsApi';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function AuditLogPage({ embedded }: { embedded?: boolean } = {}) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [applicationId, setApplicationId] = useState<string>('');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [auditFromDate, setAuditFromDate] = useState('');
  const [auditToDate, setAuditToDate] = useState('');

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list(),
  });

  const filterPayload = useMemo(() => {
    const payload: { fromDate?: string; toDate?: string; application?: string } = {};
    if (fromDate) payload.fromDate = fromDate;
    if (toDate) payload.toDate = toDate;
    const app = applications.find((a) => String(a.id) === applicationId);
    if (app?.name) payload.application = app.name;
    return payload;
  }, [fromDate, toDate, applicationId, applications]);

  const { data: ticketsResponse, isLoading: ticketsLoading } = useQuery({
    queryKey: ['problems', 'audit-filters', filterPayload],
    queryFn: () =>
      problemApi.getWithFilters(
        { ...filterPayload, fromDate: filterPayload.fromDate, toDate: filterPayload.toDate },
        0,
        500,
        'createdDate',
        'desc'
      ),
    placeholderData: (prev) => prev,
  });

  const tickets = useMemo(() => ticketsResponse?.content ?? [], [ticketsResponse]);

  const { data: logs = [], isLoading: auditLoading, error } = useQuery({
    queryKey: ['audit', 'problem', selectedTicketId],
    queryFn: () => auditApi.getByProblemId(selectedTicketId!),
    enabled: selectedTicketId != null && selectedTicketId > 0,
  });

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter && log.action.toLowerCase() !== actionFilter.toLowerCase()) return false;
      if (userFilter && !log.performedBy.toLowerCase().includes(userFilter.toLowerCase())) return false;
      const logDate = log.timestamp.slice(0, 10);
      if (auditFromDate && logDate < auditFromDate) return false;
      if (auditToDate && logDate > auditToDate) return false;
      return true;
    });
  }, [logs, actionFilter, userFilter, auditFromDate, auditToDate]);

  const actions = useMemo(() => [...new Set(logs.map((l) => l.action))].sort(), [logs]);

  const isLoading = auditLoading;
  const showEmptyPrompt = selectedTicketId == null;

  return (
    <div className="space-y-4">
      {!embedded && (
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Audit Log</h1>
      )}

      {/* Single combined filter section */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow border border-slate-200 dark:border-slate-600 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="audit-from-date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              From business date
            </label>
            <input
              id="audit-from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-500 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="audit-to-date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              To business date
            </label>
            <input
              id="audit-to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-500 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="audit-application" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Application
            </label>
            <select
              id="audit-application"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-500 rounded-lg text-sm outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">All applications</option>
              {applications.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.name}{a.code ? ` (${a.code})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="audit-ticket" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Ticket
            </label>
            <select
              id="audit-ticket"
              value={selectedTicketId ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedTicketId(v === '' ? null : Number(v));
              }}
              className="px-3 py-2 border border-slate-200 dark:border-slate-500 rounded-lg text-sm outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-w-[140px]"
            >
              <option value="">Select ticket</option>
              {ticketsLoading && <option disabled>Loading…</option>}
              {!ticketsLoading &&
                tickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.id} – {t.title.slice(0, 40)}{t.title.length > 40 ? '…' : ''}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="audit-action" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Action
            </label>
            <select
              id="audit-action"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-500 rounded-lg text-sm outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">All actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="audit-user" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              User
            </label>
            <input
              id="audit-user"
              type="text"
              placeholder="Filter by user"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-500 rounded-lg text-sm outline-none min-w-[120px] bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="audit-log-from" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Audit from date
            </label>
            <input
              id="audit-log-from"
              type="date"
              value={auditFromDate}
              onChange={(e) => setAuditFromDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-500 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="audit-log-to" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Audit to date
            </label>
            <input
              id="audit-log-to"
              type="date"
              value={auditToDate}
              onChange={(e) => setAuditToDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-500 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {showEmptyPrompt && (
        <EmptyState message="Select a ticket from the list (optionally narrow by from/to business date and application) and click “Load audit log” to view the audit trail." />
      )}

      {selectedTicketId != null && (
        <>
          {error && (
            <div className="text-center py-4 text-red-500 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              Failed to load audit log. Check that the ticket exists.
            </div>
          )}
          {isLoading && <LoadingSpinner message="Loading audit log..." />}
          {!isLoading && !error && (
            <>
              {filteredLogs.length === 0 ? (
                <EmptyState message="No audit entries found" />
              ) : (
                <div className="bg-white dark:bg-slate-800/80 rounded-xl shadow border border-slate-200 dark:border-slate-600 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
                      <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Time</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Action</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Problem</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{log.performedBy}</td>
                            <td className="px-4 py-2">
                              <Link to={`/tickets/${log.problemId}`} className="text-primary hover:underline text-sm">
                                #{log.problemId}
                              </Link>
                            </td>
                            <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
                              {log.fieldChanged && (
                                <span>
                                  {log.fieldChanged}: {log.oldValue} → {log.newValue}
                                </span>
                              )}
                              {!log.fieldChanged && log.action}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
