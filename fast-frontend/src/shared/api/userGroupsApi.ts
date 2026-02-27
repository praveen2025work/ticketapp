import axiosClient from './axiosClient';

export interface UserGroupResponse {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  active: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface UserGroupRequest {
  name: string;
  code?: string;
  description?: string;
}

export const userGroupsApi = {
  list: async (activeOnly = true): Promise<UserGroupResponse[]> => {
    const response = await axiosClient.get<UserGroupResponse[]>('/user-groups', { params: { activeOnly } });
    return response.data;
  },

  getById: async (id: number): Promise<UserGroupResponse> => {
    const response = await axiosClient.get<UserGroupResponse>(`/user-groups/${id}`);
    return response.data;
  },

  create: async (payload: UserGroupRequest): Promise<UserGroupResponse> => {
    const response = await axiosClient.post<UserGroupResponse>('/user-groups', payload);
    return response.data;
  },

  update: async (id: number, payload: UserGroupRequest): Promise<UserGroupResponse> => {
    const response = await axiosClient.put<UserGroupResponse>(`/user-groups/${id}`, payload);
    return response.data;
  },

  deactivate: async (id: number): Promise<UserGroupResponse> => {
    const response = await axiosClient.patch<UserGroupResponse>(`/user-groups/${id}/deactivate`);
    return response.data;
  },
};
