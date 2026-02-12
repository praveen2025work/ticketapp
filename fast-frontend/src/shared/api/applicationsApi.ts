import axiosClient from './axiosClient';

export interface ApplicationResponse {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  createdDate: string;
  updatedDate: string | null;
}

export interface ApplicationRequest {
  name: string;
  code?: string;
  description?: string;
}

export const applicationsApi = {
  list: async (): Promise<ApplicationResponse[]> => {
    const response = await axiosClient.get<ApplicationResponse[]>('/applications');
    return response.data;
  },

  getById: async (id: number): Promise<ApplicationResponse> => {
    const response = await axiosClient.get<ApplicationResponse>(`/applications/${id}`);
    return response.data;
  },

  create: async (payload: ApplicationRequest): Promise<ApplicationResponse> => {
    const response = await axiosClient.post<ApplicationResponse>('/applications', payload);
    return response.data;
  },

  update: async (id: number, payload: ApplicationRequest): Promise<ApplicationResponse> => {
    const response = await axiosClient.put<ApplicationResponse>(`/applications/${id}`, payload);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosClient.delete(`/applications/${id}`);
  },
};
