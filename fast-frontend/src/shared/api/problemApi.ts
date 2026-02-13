import axiosClient from './axiosClient';
import type { FastProblem, CreateFastProblemRequest, PagedResponse } from '../types';

export const problemApi = {
  getAll: async (page = 0, size = 20, sortBy = 'createdDate', direction = 'desc'): Promise<PagedResponse<FastProblem>> => {
    const response = await axiosClient.get('/problems', { params: { page, size, sortBy, direction } });
    return response.data;
  },

  getWithFilters: async (
    filters: {
      q?: string;
      region?: string;
      classification?: string;
      application?: string;
      fromDate?: string;
      toDate?: string;
      status?: string;
    },
    page = 0,
    size = 20,
    sortBy = 'createdDate',
    direction = 'desc'
  ): Promise<PagedResponse<FastProblem>> => {
    const params: Record<string, string | number> = { page, size, sortBy, direction };
    if (filters.q != null && filters.q.trim() !== '') params.q = filters.q.trim();
    if (filters.region != null && filters.region.trim() !== '') params.region = filters.region.trim();
    if (filters.classification != null && filters.classification.trim() !== '') params.classification = filters.classification.trim();
    if (filters.application != null && filters.application.trim() !== '') params.application = filters.application.trim();
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    if (filters.status) params.status = filters.status;
    const response = await axiosClient.get('/problems', { params });
    return response.data;
  },

  getById: async (id: number): Promise<FastProblem> => {
    const response = await axiosClient.get(`/problems/${id}`);
    return response.data;
  },

  create: async (data: CreateFastProblemRequest): Promise<FastProblem> => {
    const response = await axiosClient.post('/problems', data);
    return response.data;
  },

  update: async (id: number, data: Partial<FastProblem>): Promise<FastProblem> => {
    const response = await axiosClient.put(`/problems/${id}`, data);
    return response.data;
  },

  /** Update only BTB Tech Lead (avoids full PUT and 500 on partial payload). */
  updateBtbTechLead: async (id: number, btbTechLeadUsername: string): Promise<FastProblem> => {
    const response = await axiosClient.patch(`/problems/${id}/btb-tech-lead`, {
      btbTechLeadUsername: btbTechLeadUsername || '',
    });
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<FastProblem> => {
    const response = await axiosClient.patch(`/problems/${id}/status`, { status });
    return response.data;
  },

  getByRegion: async (code: string, page = 0, size = 20): Promise<PagedResponse<FastProblem>> => {
    const response = await axiosClient.get(`/problems/region/${code}`, { params: { page, size } });
    return response.data;
  },

  getByClassification: async (cls: string, page = 0, size = 20): Promise<PagedResponse<FastProblem>> => {
    const response = await axiosClient.get(`/problems/classification/${cls}`, { params: { page, size } });
    return response.data;
  },

  /** Use dedicated status endpoint for reliable filtering (RESOLVED, CLOSED, etc.) */
  getByStatus: async (status: string, page = 0, size = 50): Promise<PagedResponse<FastProblem>> => {
    const response = await axiosClient.get(`/problems/status/${encodeURIComponent(status)}`, { params: { page, size } });
    return response.data;
  },

  search: async (q: string, page = 0, size = 20): Promise<PagedResponse<FastProblem>> => {
    const response = await axiosClient.get('/problems/search', { params: { q, page, size } });
    return response.data;
  },

  addProperty: async (id: number, key: string, value: string): Promise<FastProblem> => {
    const response = await axiosClient.post(`/problems/${id}/properties`, { key, value });
    return response.data;
  },

  updateProperty: async (id: number, key: string, value: string): Promise<FastProblem> => {
    const response = await axiosClient.put(`/problems/${id}/properties/${encodeURIComponent(key)}`, { value });
    return response.data;
  },

  deleteProperty: async (id: number, key: string): Promise<void> => {
    await axiosClient.delete(`/problems/${id}/properties/${encodeURIComponent(key)}`);
  },

  addLink: async (id: number, label: string, url: string, linkType?: string): Promise<FastProblem> => {
    const response = await axiosClient.post(`/problems/${id}/links`, { label, url, ...(linkType ? { linkType } : {}) });
    return response.data;
  },

  deleteLink: async (id: number, linkId: number): Promise<void> => {
    await axiosClient.delete(`/problems/${id}/links/${linkId}`);
  },

  addComment: async (id: number, text: string): Promise<FastProblem> => {
    const response = await axiosClient.post(`/problems/${id}/comments`, { text });
    return response.data;
  },

  sendEmailToAssignee: async (id: number, message?: string): Promise<void> => {
    await axiosClient.post(`/problems/${id}/send-email`, { message: message ?? '' });
  },
};
