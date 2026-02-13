import { getApiErrorMessage } from '../shared/utils/apiError';

interface ApiErrorStateProps {
  /** Short title, e.g. "Failed to load users" */
  title: string;
  error: unknown;
  onRetry?: () => void;
  /** Fallback when backend message cannot be extracted */
  fallbackMessage?: string;
  className?: string;
}

/**
 * Consistent error UI for API failures: shows backend message and optional Retry.
 * Use for query errors so users see 404/403/500 messages from the API.
 */
export default function ApiErrorState({
  title,
  error,
  onRetry,
  fallbackMessage = 'Check that the backend is running and try again.',
  className = 'text-center py-8 px-4',
}: ApiErrorStateProps) {
  const message = getApiErrorMessage(error, fallbackMessage);
  return (
    <div className={className}>
      <p className="text-red-500 dark:text-rose-400 font-medium mb-2">{title}</p>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover"
        >
          Retry
        </button>
      )}
    </div>
  );
}
