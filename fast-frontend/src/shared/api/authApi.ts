import axios from 'axios';
import axiosClient from './axiosClient';
import type { AdUser, AuthResponse, BamAuthResponse, LoginRequest } from '../types';

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

export const authApi = {
  /** Legacy login (local only) */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/login', data);
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
