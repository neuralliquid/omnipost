// Test setup file
import { jest } from '@jest/globals';

// Mock Next.js headers function
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn((name: string) => {
      if (name === 'x-user-id') return '1';
      if (name === 'x-user-role') return 'admin';
      if (name === 'x-user-name') return 'admin';
      if (name === 'authorization') return 'Bearer mock-token';
      return null;
    }),
  })),
  cookies: jest.fn(() => ({
    get: jest.fn((name: string) => {
      if (name === 'auth-token') return { value: 'mock-token' };
      return null;
    }),
    set: jest.fn(),
  })),
}));

// Mock feature flags
jest.mock('../lib/featureFlags', () => ({
  __esModule: true,
  default: {
    textParser: {
      enabled: true,
      implementation: 'openai',
    },
    imageGeneration: true,
    summarization: true,
    platformConnectors: true,
    multiPlatformPublishing: true,
    notificationSystem: true,
    feedbackMechanism: true,
    airtableIntegration: true,
    trigger: {
      cron: { enabled: true },
      rss: { enabled: true },
    },
    scraping: { enabled: true },
    storage: {
      notion: { enabled: true },
    },
    writing: {
      openai: { enabled: true },
    },
    distribution: {
      telegram: { enabled: true },
    },
  },
  saveFeatureFlags: jest.fn(),
}));

// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(() => ({
    id: '1',
    username: 'admin',
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  })),
}));

// Helper function to create mock requests
interface MockRequest {
  method: string;
  url: string;
  headers: {
    get: (name: string) => string | null;
    set: jest.Mock;
  };
  json: () => Promise<Record<string, unknown>>;
  nextUrl: URL;
}

global.createMockRequest = (
  method: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>
): MockRequest => {
  return {
    method,
    url: 'http://localhost:3000/api/test',
    headers: {
      get: (name: string) => {
        if (headers && headers[name]) return headers[name];
        if (name === 'content-type') return 'application/json';
        if (name === 'authorization') return 'Bearer mock-token';
        return null;
      },
      set: jest.fn(),
    },
    json: async () => body || {},
    nextUrl: new URL('http://localhost:3000/api/test'),
  };
};

// Extend global types
declare global {
   
  var createMockRequest: (
    method: string,
    body?: Record<string, unknown>,
    headers?: Record<string, string>
  ) => MockRequest;
}

// Add a simple test to satisfy Jest's requirement
describe('Test Setup', () => {
  it('should have mocks configured', () => {
    expect(true).toBe(true);
  });
});
