import axios from 'axios';
import type { AdUser, BamAuthResponse } from '../types';

const defaultBaseURL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '') || '/api/v1';

/** Call with credentials for Windows Auth (BAM/AD). No Bearer. */
const axiosWithCredentials = axios.create({
  baseURL: defaultBaseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Set API base URL at runtime (e.g. from config.json). Call before any auth API requests. */
export function setAuthApiBaseUrl(url: string): void {
  const base = (url ?? '').replace(/\/$/, '') || defaultBaseURL;
  axiosWithCredentials.defaults.baseURL = base;
}

/** Login with username (prod/dev/prod-h2 AD flow). Backend validates user and returns JWT. */
export interface LoginResponse {
  token: string;
  username: string;
  fullName: string;
  role: string;
  region?: string | null;
}

export const authApi = {
  /** Login with username resolved from AD. Used when authMode is ad. */
  login: async (username: string): Promise<LoginResponse> => {
    const response = await axiosWithCredentials.post<LoginResponse>('/auth/login', { username });
    return response.data;
  },

  /** Get BAM token (Windows Auth). Call with credentials. */
  getBamToken: async (appName: string, redirectURL: string): Promise<BamAuthResponse> => {
    const response = await axiosWithCredentials.get<BamAuthResponse>('/bam/token', {
      params: { appName, redirectURL },
    });
    return response.data;
  },

  /** Get current AD user (Windows Auth). Call with credentials. */
  getAdUser: async (): Promise<AdUser> => {
    const response = await axiosWithCredentials.get<AdUser>('/bam/ad-user');
    return response.data;
  },
};
