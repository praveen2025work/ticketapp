import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

Object.defineProperty(window, 'location', {
  value: { hostname: 'localhost', href: 'http://localhost:5173/' },
  writable: true,
});

vi.resetModules();
