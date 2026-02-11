import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../shared/api/auditApi';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['audit', 'recent'],
    queryFn: () => auditApi.getRecent(100),
  });

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter && log.action.toLowerCase() !== actionFilter.toLowerCase()) return false;
      if (userFilter && !log.performedBy.toLowerCase().includes(userFilter.toLowerCase())) return false;
      return true;
    });
  }, [logs, actionFilter, userFilter]);

  const actions = useMemo(() => [...new Set(logs.map((l) => l.action))].sort(), [logs]);

  if (isLoading) return <LoadingSpinner message="Loading audit log..." />;
  if (error) return <div className="text-center py-8 text-red-500">Failed to load audit log</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-center">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
        >
          <option value="">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by user..."
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none min-w-[150px]"
        />
      </div>

      {filteredLogs.length === 0 ? (
        <EmptyState message="No audit entries found" />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Problem</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">{log.performedBy}</td>
                    <td className="px-4 py-2">
                      <Link to={`/tickets/${log.problemId}`} className="text-indigo-600 hover:underline text-sm">
                        #{log.problemId}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
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
    </div>
  );
}
