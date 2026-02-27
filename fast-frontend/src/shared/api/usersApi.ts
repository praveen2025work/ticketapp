import axiosClient from './axiosClient';
import type { PagedResponse } from '../types';
import type { ApplicationResponse } from './applicationsApi';

export interface UserResponse {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  region: string | null;
  active: boolean;
  createdDate: string;
  applications?: ApplicationResponse[];
}

export interface RegisterPayload {
  username: string;
  email: string;
  fullName: string;
  role: string;
  region?: string;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  fullName?: string;
  role?: string;
  region?: string | null;
  active?: boolean;
}

export const usersApi = {
  list: async (page = 0, size = 20): Promise<PagedResponse<UserResponse>> => {
    const response = await axiosClient.get<PagedResponse<UserResponse>>('/users', { params: { page, size } });
    return response.data;
  },

  /** List users with role TECH_LEAD (for BTB Tech Lead assignment). When applicationIds are provided, only returns tech leads linked to at least one of those applications (ticket impacted apps). */
  listTechLeads: async (applicationIds?: number[]): Promise<UserResponse[]> => {
    const params = applicationIds?.length ? { applicationIds } : {};
    const response = await axiosClient.get<UserResponse[]>('/users/tech-leads', { params });
    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<unknown> => {
    const normalized = {
      ...payload,
      username: (payload.username ?? '').trim().toLowerCase(),
    };
    const response = await axiosClient.post('/auth/register', normalized);
    return response.data;
  },

  updateApplications: async (userId: number, applicationIds: number[]): Promise<UserResponse> => {
    const response = await axiosClient.put<UserResponse>(`/users/${userId}/applications`, applicationIds);
    return response.data;
  },

  update: async (userId: number, payload: UpdateUserPayload): Promise<UserResponse> => {
    const response = await axiosClient.put<UserResponse>(`/users/${userId}`, payload);
    return response.data;
  },
};
