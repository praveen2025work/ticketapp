/** True when running on localhost or Cloudflare tunnel (use local/dev auth; otherwise BAM). */
export function isLocalEnv(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.trycloudflare.com');
}

/** True when app should use local auth (no BAM): fetch /users/me with X-Authenticated-User. Set VITE_AUTH_MODE=local when deploying with backend app.auth.mode=local. */
export function useLocalAuth(): boolean {
  if (typeof import.meta?.env?.VITE_AUTH_MODE !== 'string') return false;
  return import.meta.env.VITE_AUTH_MODE.trim().toLowerCase() === 'local';
}
