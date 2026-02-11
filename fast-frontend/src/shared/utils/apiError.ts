export function getApiErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as { response?: { data?: { message?: string; error?: string; details?: Record<string, string> } } };
    const data = err.response?.data;
    if (!data) return fallback;
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
    if (data.details && typeof data.details === 'object') {
      const first = Object.values(data.details)[0];
      if (typeof first === 'string') return first;
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
