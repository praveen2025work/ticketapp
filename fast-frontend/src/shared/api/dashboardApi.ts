import axiosClient from './axiosClient';
import type { DashboardMetrics } from '../types';

export const dashboardApi = {
  getMetrics: async (params?: { region?: string; application?: string }): Promise<DashboardMetrics> => {
    const response = await axiosClient.get('/dashboard/metrics', {
      params: params?.region || params?.application
        ? { region: params.region || undefined, application: params.application || undefined }
        : undefined,
    });
    return response.data;
  },

  getResolutionByRegion: async (): Promise<Record<string, number>> => {
    const response = await axiosClient.get('/dashboard/metrics/region');
    return response.data;
  },

  getByClassification: async (): Promise<Record<string, number>> => {
    const response = await axiosClient.get('/dashboard/metrics/classification');
    return response.data;
  },

  getSlaCompliance: async (): Promise<{ slaCompliancePercentage: number }> => {
    const response = await axiosClient.get('/dashboard/metrics/sla-compliance');
    return response.data;
  },
};
