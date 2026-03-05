import { beforeEach, describe, expect, it, vi } from 'vitest';
import axiosClient from './axiosClient';
import { interviewSchedulesApi } from './interviewSchedulesApi';

vi.mock('./axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('interviewSchedulesApi', () => {
  const mockGet = vi.mocked(axiosClient.get);
  const mockPost = vi.mocked(axiosClient.post);
  const mockPut = vi.mocked(axiosClient.put);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list calls GET /interview-schedules', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await interviewSchedulesApi.list();

    expect(mockGet).toHaveBeenCalledWith('/interview-schedules');
  });

  it('getById calls GET /interview-schedules/:id', async () => {
    mockGet.mockResolvedValue({ data: { id: 5 } });

    const result = await interviewSchedulesApi.getById(5);

    expect(mockGet).toHaveBeenCalledWith('/interview-schedules/5');
    expect(result).toEqual({ id: 5 });
  });

  it('create calls POST /interview-schedules', async () => {
    const payload = { interviewDate: '2026-03-04', entries: [{ timeSlot: '08:00', businessFunction: 'Checks' }] };
    mockPost.mockResolvedValue({ data: { id: 1, ...payload } });

    const result = await interviewSchedulesApi.create(payload);

    expect(mockPost).toHaveBeenCalledWith('/interview-schedules', payload);
    expect(result.id).toBe(1);
  });

  it('update calls PUT /interview-schedules/:id', async () => {
    const payload = { interviewDate: '2026-03-04', entries: [{ timeSlot: '08:00', businessFunction: 'Checks' }] };
    mockPut.mockResolvedValue({ data: { id: 8, ...payload } });

    await interviewSchedulesApi.update(8, payload);

    expect(mockPut).toHaveBeenCalledWith('/interview-schedules/8', payload);
  });
});
