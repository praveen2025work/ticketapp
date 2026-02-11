import axiosClient from './axiosClient';
import type { ApprovalRecord } from '../types';

export const approvalApi = {
  submitForApproval: async (problemId: number): Promise<ApprovalRecord[]> => {
    const response = await axiosClient.post(`/approvals/problems/${problemId}/submit`);
    return response.data;
  },

  getPending: async (): Promise<ApprovalRecord[]> => {
    const response = await axiosClient.get('/approvals/pending');
    return response.data;
  },

  approve: async (approvalId: number, comments?: string): Promise<ApprovalRecord> => {
    const response = await axiosClient.put(`/approvals/${approvalId}/approve`, { comments });
    return response.data;
  },

  reject: async (approvalId: number, comments?: string): Promise<ApprovalRecord> => {
    const response = await axiosClient.put(`/approvals/${approvalId}/reject`, { comments });
    return response.data;
  },

  getHistory: async (problemId: number): Promise<ApprovalRecord[]> => {
    const response = await axiosClient.get(`/approvals/problems/${problemId}/history`);
    return response.data;
  },
};
