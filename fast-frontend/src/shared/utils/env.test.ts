import { describe, it, expect, beforeEach } from 'vitest';
import { isLocalEnv } from './env';

describe('isLocalEnv', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, hostname: 'localhost' },
      writable: true,
    });
  });

  it('returns true for localhost', () => {
    (window as unknown as { location: { hostname: string } }).location.hostname = 'localhost';
    expect(isLocalEnv()).toBe(true);
  });

  it('returns true for 127.0.0.1', () => {
    (window as unknown as { location: { hostname: string } }).location.hostname = '127.0.0.1';
    expect(isLocalEnv()).toBe(true);
  });

  it('returns true for trycloudflare.com subdomain', () => {
    (window as unknown as { location: { hostname: string } }).location.hostname = 'abc.trycloudflare.com';
    expect(isLocalEnv()).toBe(true);
  });

  it('returns false for other hostnames', () => {
    (window as unknown as { location: { hostname: string } }).location.hostname = 'app.example.com';
    expect(isLocalEnv()).toBe(false);
  });
});
