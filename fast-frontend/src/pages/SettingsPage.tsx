import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../shared/context/AuthContext';
import { settingsApi } from '../shared/api/settingsApi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SettingsPage({ embedded, readOnly }: { embedded?: boolean; readOnly?: boolean } = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync local state from server when settings load
    if (data?.settings) setLocal(data.settings);
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (updates: Record<string, string>) => settingsApi.update(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const handleChange = (key: string, value: string) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(local);
  };

  if (isLoading) return <LoadingSpinner message="Loading settings..." />;
  if (error) return <div className="text-center py-8 text-red-500">Failed to load settings</div>;

  return (
    <div className={`space-y-8 ${embedded ? '' : 'max-w-2xl mx-auto'}`}>
      {!embedded && <h1 className="text-2xl font-bold text-gray-900">Settings</h1>}

      {/* Email (SMTP) */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Email (SMTP)</h2>
        <p className="text-sm text-gray-500 mb-4">Used for sending email to assignee and daily reports.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
            <input
              type="text"
              value={local['smtpHost'] ?? ''}
              onChange={(e) => handleChange('smtpHost', e.target.value)}
              readOnly={readOnly}
              className={`w-full border border-gray-300 rounded-md p-2 text-sm ${readOnly ? 'bg-gray-50 dark:bg-slate-700 cursor-not-allowed' : ''}`}
              placeholder="smtp.example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
            <input
              type="text"
              value={local['smtpPort'] ?? ''}
              onChange={(e) => handleChange('smtpPort', e.target.value)}
              readOnly={readOnly}
              className={`w-full border border-gray-300 rounded-md p-2 text-sm ${readOnly ? 'bg-gray-50 dark:bg-slate-700 cursor-not-allowed' : ''}`}
              placeholder="587"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={local['smtpUsername'] ?? ''}
              onChange={(e) => handleChange('smtpUsername', e.target.value)}
              readOnly={readOnly}
              className={`w-full border border-gray-300 rounded-md p-2 text-sm ${readOnly ? 'bg-gray-50 dark:bg-slate-700 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={local['smtpPassword'] ?? ''}
              onChange={(e) => handleChange('smtpPassword', e.target.value)}
              readOnly={readOnly}
              className={`w-full border border-gray-300 rounded-md p-2 text-sm ${readOnly ? 'bg-gray-50 dark:bg-slate-700 cursor-not-allowed' : ''}`}
              placeholder="Leave blank to keep current"
            />
            {!readOnly && <p className="text-xs text-gray-500 mt-0.5">Shown as masked when loaded. Enter new value to change.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From address</label>
            <input
              type="email"
              value={local['smtpFrom'] ?? ''}
              onChange={(e) => handleChange('smtpFrom', e.target.value)}
              readOnly={readOnly}
              className={`w-full border border-gray-300 rounded-md p-2 text-sm ${readOnly ? 'bg-gray-50 dark:bg-slate-700 cursor-not-allowed' : ''}`}
              placeholder="noreply@example.com"
            />
          </div>
        </div>
      </section>

      {/* Daily reports */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Reports</h2>
        <p className="text-sm text-gray-500 mb-4">Send digest per zone (APAC, EMEA, AMER). Enable globally and per zone.</p>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(local['dailyReportEnabled'] ?? '') === 'true'}
              onChange={(e) => handleChange('dailyReportEnabled', e.target.checked ? 'true' : 'false')}
              disabled={readOnly}
              className="rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-60"
            />
            <span className="text-sm font-medium text-gray-700">Enable daily reports globally</span>
          </label>
          {[
            { zone: 'APAC', key: 'Apac' },
            { zone: 'EMEA', key: 'Emea' },
            { zone: 'AMER', key: 'Amer' },
          ].map(({ zone, key }) => {
            const keyEnabled = `dailyReport${key}`;
            const keyTime = `dailyReport${key}Time`;
            const keyRecipients = `dailyReport${key}Recipients`;
            return (
              <div key={zone} className="pl-4 border-l-2 border-gray-200 space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(local[keyEnabled] ?? '') === 'true'}
                    onChange={(e) => handleChange(keyEnabled, e.target.checked ? 'true' : 'false')}
                    disabled={readOnly}
                    className="rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-60"
                  />
                  <span className="text-sm font-medium text-gray-700">{zone}</span>
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-0.5">Send time (HH:mm)</label>
                    <input
                      type="text"
                      value={local[keyTime] ?? ''}
                      onChange={(e) => handleChange(keyTime, e.target.value)}
                      readOnly={readOnly}
                      className={`w-full border border-gray-300 rounded-md p-2 text-sm ${readOnly ? 'bg-gray-50 dark:bg-slate-700 cursor-not-allowed' : ''}`}
                      placeholder="08:00"
                    />
                  </div>
                  <div className="flex-[2]">
                    <label className="block text-xs text-gray-500 mb-0.5">Recipients (comma-separated)</label>
                    <input
                      type="text"
                      value={local[keyRecipients] ?? ''}
                      onChange={(e) => handleChange(keyRecipients, e.target.value)}
                      readOnly={readOnly}
                      className={`w-full border border-gray-300 rounded-md p-2 text-sm ${readOnly ? 'bg-gray-50 dark:bg-slate-700 cursor-not-allowed' : ''}`}
                      placeholder="email1@example.com, email2@example.com"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ticket email */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Ticket Email</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={(local['ticketEmailEnabled'] ?? 'true') === 'true'}
            onChange={(e) => handleChange('ticketEmailEnabled', e.target.checked ? 'true' : 'false')}
            disabled={readOnly}
            className="rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-60"
          />
          <span className="text-sm font-medium text-gray-700">Allow sending email to assignee from ticket</span>
        </label>
      </section>

      {!readOnly && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50 text-sm font-medium"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      )}
    </div>
  );
}
