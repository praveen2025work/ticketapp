import axiosClient from './axiosClient';

export interface AppSettingsResponse {
  settings: Record<string, string>;
}

export const settingsApi = {
  get: async (): Promise<AppSettingsResponse> => {
    const { data } = await axiosClient.get<AppSettingsResponse>('/settings');
    return data;
  },
  update: async (updates: Record<string, string>): Promise<void> => {
    await axiosClient.put('/settings', updates);
  },
};
