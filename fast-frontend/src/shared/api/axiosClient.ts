import axios from 'axios';

const TOKEN_KEY = 'fast_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

const defaultApiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '') || '/api/v1';
const axiosClient = axios.create({
  baseURL: defaultApiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Set API base URL at runtime (e.g. from config.json). Call before any API requests. */
export function setApiBaseUrl(url: string): void {
  const base = (url ?? '').replace(/\/$/, '') || defaultApiBase;
  axiosClient.defaults.baseURL = base;
}

axiosClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Local only: dev LDAP user header
    const devUser = typeof localStorage !== 'undefined' ? localStorage.getItem('dev_ldap_user') || 'admin' : 'admin';
    config.headers['X-Authenticated-User'] = devUser;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getStoredToken()) {
      setStoredToken(null);
      window.location.reload();
    } else if (error.response?.status === 403) {
      console.error('Authorization error:', error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
