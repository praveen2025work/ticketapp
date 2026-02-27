import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../shared/context/AuthContext';
import { userGroupsApi, type UserGroupRequest, type UserGroupResponse } from '../shared/api/userGroupsApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ApiErrorState from '../components/ApiErrorState';

export default function UserGroupsPage({ embedded, readOnly }: { embedded?: boolean; readOnly?: boolean } = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserGroupResponse | null>(null);
  const [form, setForm] = useState<UserGroupRequest>({ name: '', code: '', description: '' });

  const { data: userGroups = [], isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['user-groups', false],
    queryFn: () => userGroupsApi.list(false),
    enabled: Boolean(user),
    retry: 2,
  });

  const createMutation = useMutation({
    mutationFn: (payload: UserGroupRequest) => userGroupsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      setShowForm(false);
      setForm({ name: '', code: '', description: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserGroupRequest }) => userGroupsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      setEditing(null);
      setForm({ name: '', code: '', description: '' });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => userGroupsApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-groups'] }),
  });

  const openEdit = (group: UserGroupResponse) => {
    setEditing(group);
    setForm({
      name: group.name,
      code: group.code ?? '',
      description: group.description ?? '',
    });
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, code: form.code || undefined, description: form.description || undefined };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading && !isRefetching) return <LoadingSpinner message="Loading user groups..." />;
  if (error) {
    return (
      <ApiErrorState
        title="Failed to load user groups"
        error={error}
        onRetry={() => refetch()}
        fallbackMessage="Check backend is running and database is initialized."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {!embedded && <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">User Groups</h1>}
        {embedded && <div />}
        {!readOnly && (
          <button
            type="button"
            onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', code: '', description: '' }); }}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover ml-auto"
          >
            Add user group
          </button>
        )}
      </div>

      {!readOnly && (showForm || editing) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editing ? 'Edit user group' : 'Add user group'}
          </h2>
          <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={submitForm}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                placeholder="e.g. FIN_CTRL"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50"
              >
                {editing ? (updateMutation.isPending ? 'Saving...' : 'Save') : (createMutation.isPending ? 'Creating...' : 'Create')}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
              >
                Cancel
              </button>
            </div>
            {(createMutation.isError || updateMutation.isError) && (
              <p className="sm:col-span-2 text-sm text-rose-600">
                {String(createMutation.error ?? updateMutation.error)}
              </p>
            )}
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
              {!readOnly && <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {userGroups.map((group) => (
              <tr key={group.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{group.name}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{group.code ?? '—'}</td>
                <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">{group.description ?? '—'}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{group.active ? 'Yes' : 'No'}</td>
                {!readOnly && (
                  <td className="px-4 py-2 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => openEdit(group)}
                      className="text-primary hover:underline mr-3"
                      disabled={!group.active}
                    >
                      Edit
                    </button>
                    {group.active && (
                      <button
                        type="button"
                        onClick={() => window.confirm('Deactivate this user group?') && deactivateMutation.mutate(group.id)}
                        disabled={deactivateMutation.isPending}
                        className="text-rose-600 hover:underline disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {userGroups.length === 0 && !showForm && (
          <p className="px-4 py-8 text-center text-gray-500">No user groups yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
