import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../shared/context/AuthContext';
import { usersApi, type RegisterPayload, type UserResponse } from '../shared/api/usersApi';
import { applicationsApi } from '../shared/api/applicationsApi';
import { getApiErrorMessage } from '../shared/utils/apiError';
import LoadingSpinner from '../components/LoadingSpinner';

const ROLES = ['ADMIN', 'REVIEWER', 'APPROVER', 'RTB_OWNER', 'TECH_LEAD', 'READ_ONLY'];
const REGIONS = ['APAC', 'EMEA', 'AMER'];

export default function UsersPage({ embedded }: { embedded?: boolean } = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [assignUser, setAssignUser] = useState<UserResponse | null>(null);
  const [form, setForm] = useState<RegisterPayload>({
    username: '',
    email: '',
    fullName: '',
    role: 'READ_ONLY',
    region: 'AMER',
  });

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['users', page],
    queryFn: () => usersApi.list(page, 20),
    enabled: user?.role === 'ADMIN',
    retry: 2,
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list(),
    enabled: user?.role === 'ADMIN' && !!assignUser,
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => usersApi.register(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowAdd(false);
      setForm({ username: '', email: '', fullName: '', role: 'READ_ONLY', region: 'AMER' });
    },
  });

  const updateAppsMutation = useMutation({
    mutationFn: ({ userId, applicationIds }: { userId: number; applicationIds: number[] }) =>
      usersApi.updateApplications(userId, applicationIds),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (assignUser?.id === updatedUser.id) setAssignUser(updatedUser);
    },
  });

  if (!embedded && user?.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-slate-600">You need Admin role to manage users.</p>
      </div>
    );
  }

  if (isLoading && !isRefetching) return <LoadingSpinner message="Loading users..." />;
  if (error) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-red-500 mb-2">Failed to load users</p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">{getApiErrorMessage(error, 'Check backend is running and database is initialized.')}</p>
        <button type="button" onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover">
          Retry
        </button>
      </div>
    );
  }

  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {!embedded && <h1 className="text-2xl font-bold text-gray-900">Users</h1>}
        {embedded && <div />}
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover"
        >
          Add user
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add user</h2>
          <form
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              registerMutation.mutate(form);
            }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <select
                value={form.region ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50"
              >
                {registerMutation.isPending ? 'Creating...' : 'Create user'}
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
              >
                Cancel
              </button>
            </div>
            {registerMutation.isError && (
              <p className="sm:col-span-2 text-sm text-rose-600">{String(registerMutation.error)}</p>
            )}
          </form>
        </div>
      )}

      {assignUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Assign applications: {assignUser.fullName}</h2>
            <p className="text-sm text-gray-500 mb-4">Select applications this user handles.</p>
            <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
              {allApplications.map((app) => {
                const currentIds = (assignUser.applications ?? []).map((a) => a.id);
                const selected = currentIds.includes(app.id);
                return (
                  <label key={app.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={updateAppsMutation.isPending}
                      onChange={(e) => {
                        const nextIds = e.target.checked
                          ? [...currentIds, app.id]
                          : currentIds.filter((id) => id !== app.id);
                        updateAppsMutation.mutate({ userId: assignUser.id, applicationIds: nextIds });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{app.name}{app.code ? ` (${app.code})` : ''}</span>
                  </label>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setAssignUser(null)}
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Full name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-900">{u.username}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{u.fullName}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{u.email}</td>
                <td className="px-4 py-2 text-sm"><span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{u.role}</span></td>
                <td className="px-4 py-2 text-sm text-gray-600">{u.region ?? '—'}</td>
                <td className="px-4 py-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setAssignUser(u)}
                    className="text-primary hover:underline text-xs"
                  >
                    {(u.applications?.length ?? 0) > 0 ? `${u.applications!.length} app(s)` : 'Assign'}
                  </button>
                </td>
                <td className="px-4 py-2 text-sm">{u.active ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="px-4 py-2 border-t flex justify-between items-center">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
