import axiosClient from './axiosClient';
import type { DashboardMetrics, FastProblem } from '../types';

export const dashboardApi = {
  getMetrics: async (params?: { region?: string; application?: string; period?: string }): Promise<DashboardMetrics> => {
    const p: Record<string, string> = {};
    if (params?.region) p.region = params.region;
    if (params?.application) p.application = params.application;
    if (params?.period) p.period = params.period;
    const response = await axiosClient.get('/dashboard/metrics', { params: Object.keys(p).length ? p : undefined });
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

  getInProgressWithoutRecentComment: async (): Promise<FastProblem[]> => {
    const response = await axiosClient.get<FastProblem[]>('/dashboard/in-progress-without-daily-comment');
    return response.data;
  },

  getTop10: async (region?: string): Promise<FastProblem[]> => {
    const response = await axiosClient.get<FastProblem[]>('/dashboard/top10', { params: region ? { region } : undefined });
    return response.data;
  },

  getBacklog: async (region?: string): Promise<FastProblem[]> => {
    const response = await axiosClient.get<FastProblem[]>('/dashboard/backlog', { params: region ? { region } : undefined });
    return response.data;
  },

  getUpstream: async (linkType?: string): Promise<FastProblem[]> => {
    const response = await axiosClient.get<FastProblem[]>('/dashboard/upstream', { params: linkType ? { linkType } : undefined });
    return response.data;
  },
};
