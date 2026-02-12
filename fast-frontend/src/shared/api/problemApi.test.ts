import { describe, it, expect, vi, beforeEach } from 'vitest';
import { problemApi } from './problemApi';
import axiosClient from './axiosClient';

vi.mock('./axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('problemApi', () => {
  const mockGet = vi.mocked(axiosClient.get);
  const mockPost = vi.mocked(axiosClient.post);
  const mockPut = vi.mocked(axiosClient.put);
  const mockPatch = vi.mocked(axiosClient.patch);
  const mockDelete = vi.mocked(axiosClient.delete);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAll calls GET /problems with params', async () => {
    mockGet.mockResolvedValue({
      data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, last: true },
    });
    await problemApi.getAll(1, 10, 'title', 'asc');
    expect(mockGet).toHaveBeenCalledWith('/problems', {
      params: { page: 1, size: 10, sortBy: 'title', direction: 'asc' },
    });
  });

  it('getById calls GET /problems/:id', async () => {
    mockGet.mockResolvedValue({ data: { id: 1, title: 'P1' } });
    const result = await problemApi.getById(1);
    expect(mockGet).toHaveBeenCalledWith('/problems/1');
    expect(result).toEqual({ id: 1, title: 'P1' });
  });

  it('create calls POST /problems', async () => {
    mockPost.mockResolvedValue({ data: { id: 1, title: 'New' } });
    const result = await problemApi.create({ title: 'New', regionalCodes: ['AMER'] });
    expect(mockPost).toHaveBeenCalledWith('/problems', { title: 'New', regionalCodes: ['AMER'] });
    expect(result).toEqual({ id: 1, title: 'New' });
  });

  it('update calls PUT /problems/:id', async () => {
    mockPut.mockResolvedValue({ data: { id: 1, title: 'Updated' } });
    await problemApi.update(1, { title: 'Updated' });
    expect(mockPut).toHaveBeenCalledWith('/problems/1', { title: 'Updated' });
  });

  it('updateStatus calls PATCH /problems/:id/status', async () => {
    mockPatch.mockResolvedValue({ data: { id: 1, status: 'RESOLVED' } });
    await problemApi.updateStatus(1, 'RESOLVED');
    expect(mockPatch).toHaveBeenCalledWith('/problems/1/status', { status: 'RESOLVED' });
  });

  it('getWithFilters builds params from filters', async () => {
    mockGet.mockResolvedValue({
      data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, last: true },
    });
    await problemApi.getWithFilters(
      { q: 'search', region: 'AMER', classification: 'A' },
      0,
      20
    );
    expect(mockGet).toHaveBeenCalledWith('/problems', {
      params: expect.objectContaining({
        q: 'search',
        region: 'AMER',
        classification: 'A',
        page: 0,
        size: 20,
      }),
    });
  });

  it('addProperty calls POST /problems/:id/properties', async () => {
    mockPost.mockResolvedValue({ data: { id: 1 } });
    await problemApi.addProperty(1, 'key', 'value');
    expect(mockPost).toHaveBeenCalledWith('/problems/1/properties', { key: 'key', value: 'value' });
  });

  it('deleteProperty calls DELETE', async () => {
    mockDelete.mockResolvedValue({});
    await problemApi.deleteProperty(1, 'myKey');
    expect(mockDelete).toHaveBeenCalledWith('/problems/1/properties/myKey');
  });

  it('addComment calls POST /problems/:id/comments', async () => {
    mockPost.mockResolvedValue({ data: { id: 1 } });
    await problemApi.addComment(1, 'Hello');
    expect(mockPost).toHaveBeenCalledWith('/problems/1/comments', { text: 'Hello' });
  });

  it('sendEmailToAssignee calls POST with message', async () => {
    mockPost.mockResolvedValue({});
    await problemApi.sendEmailToAssignee(1, 'Please check');
    expect(mockPost).toHaveBeenCalledWith('/problems/1/send-email', { message: 'Please check' });
  });
});
