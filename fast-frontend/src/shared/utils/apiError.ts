import type { ApiErrorResponse } from '../types';

/** Extract the standard error body from an API error (for 401, 403, 404, 500, validation). Use status/code/path for issue identification. */
export function getApiError(error: unknown): ApiErrorResponse | null {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as { response?: { data?: Record<string, unknown>; status?: number } };
    const data = err.response?.data;
    const status =
      err.response?.status ??
      (data && typeof (data as { status?: number }).status === 'number' ? (data as { status: number }).status : undefined);
    if (data && typeof data === 'object') {
      const details = data.details as Record<string, string> | undefined;
      const firstDetail = details && typeof details === 'object' ? Object.values(details)[0] : undefined;
      const msg =
        (data.message as string) ??
        (data.error as string) ??
        (typeof firstDetail === 'string' ? firstDetail : undefined);
      const err = (data.error as string) ?? 'Error';
      return {
        timestamp: (data.timestamp as string) ?? '',
        status: status ?? 0,
        error: err,
        message: msg ?? 'An error occurred',
        code: data.code as string | undefined,
        path: data.path as string | undefined,
        details,
      };
    }
  }
  return null;
}

export function getApiErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  const apiError = getApiError(error);
  if (apiError) {
    if (typeof apiError.message === 'string' && apiError.message) return apiError.message;
    if (typeof apiError.error === 'string' && apiError.error) return apiError.error;
    if (apiError.details && typeof apiError.details === 'object') {
      const first = Object.values(apiError.details)[0];
      if (typeof first === 'string') return first;
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
