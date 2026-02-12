import axiosClient from './axiosClient';

export interface AuditLogEntry {
  id: number;
  problemId: number;
  action: string;
  performedBy: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export const auditApi = {
  getByProblemId: async (problemId: number): Promise<AuditLogEntry[]> => {
    const response = await axiosClient.get(`/audit/problem/${problemId}`);
    return response.data;
  },
  getRecent: async (limit = 100): Promise<AuditLogEntry[]> => {
    const response = await axiosClient.get('/audit/recent', { params: { limit } });
    return response.data;
  },
};
