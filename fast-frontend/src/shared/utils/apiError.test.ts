import { describe, it, expect } from 'vitest';
import { getApiErrorMessage } from './apiError';

describe('getApiErrorMessage', () => {
  it('returns message from response.data.message', () => {
    const err = {
      response: { data: { message: 'Server error' } },
    };
    expect(getApiErrorMessage(err)).toBe('Server error');
  });

  it('returns error from response.data.error when message absent', () => {
    const err = {
      response: { data: { error: 'Bad Request' } },
    };
    expect(getApiErrorMessage(err)).toBe('Bad Request');
  });

  it('returns first detail value when details present', () => {
    const err = {
      response: {
        data: {
          details: { name: 'Name is required', email: 'Invalid email' },
        },
      },
    };
    expect(getApiErrorMessage(err)).toBe('Name is required');
  });

  it('returns fallback when response.data is empty', () => {
    const err = { response: {} };
    expect(getApiErrorMessage(err)).toBe('An error occurred');
    expect(getApiErrorMessage(err, 'Custom fallback')).toBe('Custom fallback');
  });

  it('returns Error message when error is Error instance', () => {
    expect(getApiErrorMessage(new Error('Network failed'))).toBe('Network failed');
  });

  it('returns fallback for unknown error shape', () => {
    expect(getApiErrorMessage(null)).toBe('An error occurred');
    expect(getApiErrorMessage(undefined)).toBe('An error occurred');
    expect(getApiErrorMessage('string')).toBe('An error occurred');
  });
});
