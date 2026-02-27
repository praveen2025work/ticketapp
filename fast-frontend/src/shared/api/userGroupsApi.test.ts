import { beforeEach, describe, expect, it, vi } from 'vitest';
import axiosClient from './axiosClient';
import { userGroupsApi } from './userGroupsApi';

vi.mock('./axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('userGroupsApi', () => {
  const mockGet = vi.mocked(axiosClient.get);
  const mockPost = vi.mocked(axiosClient.post);
  const mockPut = vi.mocked(axiosClient.put);
  const mockPatch = vi.mocked(axiosClient.patch);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list calls GET /user-groups with activeOnly=true by default', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await userGroupsApi.list();

    expect(mockGet).toHaveBeenCalledWith('/user-groups', { params: { activeOnly: true } });
  });

  it('getById calls GET /user-groups/:id', async () => {
    mockGet.mockResolvedValue({ data: { id: 10, name: 'Finance', active: true } });

    const result = await userGroupsApi.getById(10);

    expect(mockGet).toHaveBeenCalledWith('/user-groups/10');
    expect(result).toEqual({ id: 10, name: 'Finance', active: true });
  });

  it('create calls POST /user-groups', async () => {
    mockPost.mockResolvedValue({ data: { id: 1, name: 'Finance Controllers' } });

    const result = await userGroupsApi.create({ name: 'Finance Controllers', code: 'FIN', description: 'Desc' });

    expect(mockPost).toHaveBeenCalledWith('/user-groups', {
      name: 'Finance Controllers',
      code: 'FIN',
      description: 'Desc',
    });
    expect(result).toEqual({ id: 1, name: 'Finance Controllers' });
  });

  it('update calls PUT /user-groups/:id', async () => {
    mockPut.mockResolvedValue({ data: { id: 1, name: 'Updated' } });

    await userGroupsApi.update(1, { name: 'Updated', code: 'UPD' });

    expect(mockPut).toHaveBeenCalledWith('/user-groups/1', { name: 'Updated', code: 'UPD' });
  });

  it('deactivate calls PATCH /user-groups/:id/deactivate', async () => {
    mockPatch.mockResolvedValue({ data: { id: 1, active: false } });

    const result = await userGroupsApi.deactivate(1);

    expect(mockPatch).toHaveBeenCalledWith('/user-groups/1/deactivate');
    expect(result).toEqual({ id: 1, active: false });
  });
});
