import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../shared/context/AuthContext';
import { settingsApi } from '../shared/api/settingsApi';
import { getApiError, getApiErrorMessage } from '../shared/utils/apiError';
import LoadingSpinner from '../components/LoadingSpinner';
import ApiErrorState from '../components/ApiErrorState';
import toast from 'react-hot-toast';
import { EyeIcon, XMarkIcon, PaperAirplaneIcon, ArrowDownTrayIcon, ClipboardDocumentIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const ZONES = ['APAC', 'EMEA', 'AMER'] as const;

export default function SettingsPage({ embedded, readOnly }: { embedded?: boolean; readOnly?: boolean } = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<Record<string, string>>({});
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [previewZone, setPreviewZone] = useState<string>('APAC');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
    enabled: Boolean(user),
  });

  const { data: previewData, isLoading: previewLoading, error: previewError } = useQuery({
    queryKey: ['dailyReportPreview', previewZone],
    queryFn: () => settingsApi.getDailyReportPreview(previewZone),
    enabled: showReportPreview && Boolean(user),
  });

  const [previewIframeSrc, setPreviewIframeSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!showReportPreview || !previewData?.html || typeof previewData.html !== 'string' || previewData.html.trim() === '') {
      queueMicrotask(() =>
        setPreviewIframeSrc((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        })
      );
      return;
    }
    const blob = new Blob([previewData.html], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    queueMicrotask(() =>
      setPreviewIframeSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      })
    );
  }, [showReportPreview, previewData?.html]);

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
  if (error) {
    return (
      <ApiErrorState
        title="Failed to load settings"
        error={error}
        onRetry={() => refetch()}
        className="text-center py-8 px-4"
      />
    );
  }

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
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-600">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-1">Daily Reports</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Send digest per zone (APAC, EMEA, AMER). Enable globally and per zone.</p>
          </div>
          <button
            type="button"
            onClick={() => { setPreviewZone('APAC'); setShowReportPreview(true); }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shrink-0"
          >
            <EyeIcon className="w-4 h-4" aria-hidden />
            Preview template
          </button>
        </div>
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

      {/* Daily report preview modal – full screen */}
      {showReportPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-800" role="dialog" aria-modal="true" aria-labelledby="report-preview-title">
          <div className="flex items-center justify-between gap-4 p-3 border-b border-slate-200 dark:border-slate-600 shrink-0">
              <h3 id="report-preview-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">Daily Report – Template preview</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 shrink-0">
                  {previewData?.html ? (
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`Daily Report – ${previewZone} – ${new Date().toISOString().slice(0, 10)}`)}`}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
                      title="Open email client"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" aria-hidden />
                    </a>
                  ) : (
                    <span
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-400 cursor-not-allowed"
                      title="Load preview first"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" aria-hidden />
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={!previewData?.html}
                    onClick={() => {
                      if (!previewData?.html) return;
                      const blob = new Blob([previewData.html], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank', 'noopener');
                      setTimeout(() => URL.revokeObjectURL(url), 60000);
                    }}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="View in new tab"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={!previewData?.html}
                    onClick={() => {
                      if (!previewData?.html) return;
                      navigator.clipboard.writeText(previewData.html).then(
                        () => toast.success('HTML copied to clipboard.'),
                        () => toast.error('Copy failed')
                      );
                    }}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Copy HTML"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={!previewData?.html}
                    onClick={() => {
                      if (!previewData?.html) return;
                      const blob = new Blob([previewData.html], { type: 'text/html' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = `daily-report-${previewZone}-${new Date().toISOString().slice(0, 10)}.html`;
                      a.click();
                      URL.revokeObjectURL(a.href);
                    }}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download HTML"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" aria-hidden />
                  </button>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span>Zone</span>
                  <select
                    value={previewZone}
                    onChange={(e) => setPreviewZone(e.target.value)}
                    className="rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-2 py-1.5 text-sm"
                  >
                    {ZONES.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => setShowReportPreview(false)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  aria-label="Close preview"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden bg-slate-100 dark:bg-slate-900/50">
              {previewLoading ? (
                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">Loading preview…</div>
              ) : previewError ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-rose-600 dark:text-rose-400 text-sm px-4 text-center">
                  <span>Failed to load preview.</span>
                  <span className="text-slate-600 dark:text-slate-400 font-normal">
                    {getApiError(previewError)?.status === 401 && 'Not signed in. Please refresh and sign in.'}
                    {getApiError(previewError)?.status === 403 && 'You don’t have permission to view the preview.'}
                    {(!getApiError(previewError) || (getApiError(previewError)!.status !== 401 && getApiError(previewError)!.status !== 403)) && getApiErrorMessage(previewError, 'Try another zone or check the network tab.')}
                  </span>
                </div>
              ) : previewIframeSrc ? (
                <iframe
                  key={`${previewZone}-${previewIframeSrc}`}
                  title="Daily report template preview"
                  src={previewIframeSrc}
                  className="w-full h-full min-h-0 border-0 bg-white"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">No preview available.</div>
              )}
            </div>
        </div>
      )}

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
