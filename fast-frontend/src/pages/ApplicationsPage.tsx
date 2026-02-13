import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../shared/context/AuthContext';
import { applicationsApi, type ApplicationResponse, type ApplicationRequest } from '../shared/api/applicationsApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ApiErrorState from '../components/ApiErrorState';

export default function ApplicationsPage({ embedded, readOnly }: { embedded?: boolean; readOnly?: boolean } = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ApplicationResponse | null>(null);
  const [form, setForm] = useState<ApplicationRequest>({ name: '', code: '', description: '' });

  const { data: applications = [], isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list(),
    enabled: Boolean(user),
    retry: 2,
  });

  const createMutation = useMutation({
    mutationFn: (payload: ApplicationRequest) => applicationsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setShowForm(false);
      setForm({ name: '', code: '', description: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ApplicationRequest }) =>
      applicationsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setEditing(null);
      setForm({ name: '', code: '', description: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => applicationsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  });

  const openEdit = (app: ApplicationResponse) => {
    setEditing(app);
    setForm({
      name: app.name,
      code: app.code ?? '',
      description: app.description ?? '',
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

  if (isLoading && !isRefetching) return <LoadingSpinner message="Loading applications..." />;
  if (error) {
    return (
      <ApiErrorState
        title="Failed to load applications"
        error={error}
        onRetry={() => refetch()}
        fallbackMessage="Check backend is running and database is initialized."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {!embedded && <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Applications</h1>}
        {embedded && <div />}
        {!readOnly && (
          <button
            type="button"
            onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', code: '', description: '' }); }}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover ml-auto"
          >
            Add application
          </button>
        )}
      </div>

      {!readOnly && (showForm || editing) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editing ? 'Edit application' : 'Add application'}
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
                placeholder="e.g. CP, OM"
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
              {!readOnly && <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{app.name}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{app.code ?? '—'}</td>
                <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">{app.description ?? '—'}</td>
                {!readOnly && (
                  <td className="px-4 py-2 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => openEdit(app)}
                      className="text-primary hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => window.confirm('Delete this application?') && deleteMutation.mutate(app.id)}
                      disabled={deleteMutation.isPending}
                      className="text-rose-600 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {applications.length === 0 && !showForm && (
          <p className="px-4 py-8 text-center text-gray-500">No applications yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
