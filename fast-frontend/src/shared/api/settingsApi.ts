import axiosClient from './axiosClient';

export interface AppSettingsResponse {
  settings: Record<string, string>;
}

export interface DailyReportPreviewResponse {
  html: string;
}

export const settingsApi = {
  get: async (): Promise<AppSettingsResponse> => {
    const { data } = await axiosClient.get<AppSettingsResponse>('/settings');
    return data;
  },
  update: async (updates: Record<string, string>): Promise<void> => {
    await axiosClient.put('/settings', updates);
  },
  getDailyReportPreview: async (zone: string): Promise<DailyReportPreviewResponse> => {
    const { data } = await axiosClient.get<DailyReportPreviewResponse>('/settings/daily-report-preview', {
      params: { zone: zone || 'APAC' },
    });
    return data;
  },
};
