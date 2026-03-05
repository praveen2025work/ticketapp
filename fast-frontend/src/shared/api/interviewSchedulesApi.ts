import axiosClient from './axiosClient';
import type { InterviewSchedule, InterviewScheduleRequest } from '../types';

export const interviewSchedulesApi = {
  list: async (): Promise<InterviewSchedule[]> => {
    const response = await axiosClient.get<InterviewSchedule[]>('/interview-schedules');
    return response.data;
  },

  getById: async (id: number): Promise<InterviewSchedule> => {
    const response = await axiosClient.get<InterviewSchedule>(`/interview-schedules/${id}`);
    return response.data;
  },

  create: async (payload: InterviewScheduleRequest): Promise<InterviewSchedule> => {
    const response = await axiosClient.post<InterviewSchedule>('/interview-schedules', payload);
    return response.data;
  },

  update: async (id: number, payload: InterviewScheduleRequest): Promise<InterviewSchedule> => {
    const response = await axiosClient.put<InterviewSchedule>(`/interview-schedules/${id}`, payload);
    return response.data;
  },
};
