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

export const usersApi = {
  list: async (page = 0, size = 20): Promise<PagedResponse<UserResponse>> => {
    const response = await axiosClient.get<PagedResponse<UserResponse>>('/users', { params: { page, size } });
    return response.data;
  },

  /** List users with role TECH_LEAD (for BTB Tech Lead assignment on tickets). */
  listTechLeads: async (): Promise<UserResponse[]> => {
    const response = await axiosClient.get<UserResponse[]>('/users/tech-leads');
    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<unknown> => {
    const response = await axiosClient.post('/auth/register', payload);
    return response.data;
  },

  updateApplications: async (userId: number, applicationIds: number[]): Promise<UserResponse> => {
    const response = await axiosClient.put<UserResponse>(`/users/${userId}/applications`, applicationIds);
    return response.data;
  },
};
