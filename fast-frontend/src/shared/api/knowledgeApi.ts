import axiosClient from './axiosClient';
import type { KnowledgeArticle, PagedResponse } from '../types';

export const knowledgeApi = {
  getAll: async (page = 0, size = 20): Promise<PagedResponse<KnowledgeArticle>> => {
    const response = await axiosClient.get('/knowledge', { params: { page, size } });
    return response.data;
  },

  getById: async (id: number): Promise<KnowledgeArticle> => {
    const response = await axiosClient.get(`/knowledge/${id}`);
    return response.data;
  },

  getRoleRules: async (): Promise<{ content: string }> => {
    const response = await axiosClient.get('/knowledge/role-rules');
    return response.data;
  },
};
