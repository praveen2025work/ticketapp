import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getStoredToken, setStoredToken, setApiBaseUrl } from './axiosClient';
import axiosClient from './axiosClient';

describe('axiosClient token helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('getStoredToken returns null when empty', () => {
    expect(getStoredToken()).toBeNull();
  });

  it('setStoredToken and getStoredToken roundtrip', () => {
    setStoredToken('jwt-abc');
    expect(getStoredToken()).toBe('jwt-abc');
  });

  it('setStoredToken null removes token', () => {
    setStoredToken('jwt-abc');
    setStoredToken(null);
    expect(getStoredToken()).toBeNull();
  });
});

describe('setApiBaseUrl', () => {
  it('sets base URL and strips trailing slash', () => {
    setApiBaseUrl('https://api.example.com/');
    expect(axiosClient.defaults.baseURL).toBe('https://api.example.com');
  });
});
