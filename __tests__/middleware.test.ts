/**
 * Middleware Tests
 *
 * Tests for the Next.js middleware that extracts JWT tokens
 * from cookies/headers and injects user identity headers.
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Unmock jsonwebtoken so we can use real JWT operations for middleware tests
jest.unmock('jsonwebtoken');

// Mock next/server with a more complete NextResponse.next()
jest.mock('next/server', () => {
  class MockHeaders {
    private store: Record<string, string> = {};

    constructor(init?: Headers | Record<string, string> | [string, string][]) {
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([k, v]) => {
            this.store[k.toLowerCase()] = v;
          });
        } else if (typeof init === 'object' && 'forEach' in init) {
          (init as Headers).forEach((v: string, k: string) => {
            this.store[k.toLowerCase()] = v;
          });
        } else {
          Object.entries(init).forEach(([k, v]) => {
            this.store[k.toLowerCase()] = v;
          });
        }
      }
    }

    get(name: string): string | null {
      return this.store[name.toLowerCase()] || null;
    }

    set(name: string, value: string): void {
      this.store[name.toLowerCase()] = value;
    }

    has(name: string): boolean {
      return name.toLowerCase() in this.store;
    }

    forEach(cb: (value: string, key: string) => void): void {
      Object.entries(this.store).forEach(([k, v]) => cb(v, k));
    }
  }

  return {
    NextResponse: {
      next: jest.fn((opts?: { request?: { headers?: unknown } }) => {
        const responseHeaders = new MockHeaders();
        const result: Record<string, unknown> = {
          status: 200,
          headers: responseHeaders,
        };
        if (opts?.request?.headers) {
          result._requestHeaders = opts.request.headers;
        }
        return result;
      }),
      json: jest.fn((data: unknown, init?: { status?: number }) => ({
        status: init?.status || 200,
        json: async () => data,
      })),
    },
    NextRequest: jest.fn(),
  };
});

const JWT_SECRET = 'test-secret-for-middleware';

function createMockNextRequest(options: {
  cookieToken?: string;
  authHeader?: string;
  url?: string;
}) {
  return {
    cookies: {
      get: (name: string) => {
        if (name === 'auth-token' && options.cookieToken) {
          return { value: options.cookieToken };
        }
        return undefined;
      },
    },
    headers: {
      get: (name: string) => {
        if (name === 'authorization' && options.authHeader) {
          return options.authHeader;
        }
        return null;
      },
      forEach: jest.fn(),
    },
    url: options.url || 'http://localhost:3000/api/test',
    nextUrl: { pathname: options.url || '/api/test' },
  };
}

describe('Middleware', () => {
  let middleware: Function;
  let config: { matcher: string[] };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;

    // Re-import middleware to pick up env changes
    jest.resetModules();
    const mod = require('../middleware');
    middleware = mod.middleware;
    config = mod.config;
  });

  test('passes through requests without token', () => {
    const request = createMockNextRequest({});
    const response = middleware(request);

    // Should return a next() response without user headers
    expect(response.status).toBe(200);
    // The response should NOT have user identity headers injected
    // (it's a plain NextResponse.next() without request header override)
    const { NextResponse } = require('next/server');
    // First call is from the no-token path
    expect(NextResponse.next).toHaveBeenCalled();
  });

  test('extracts and verifies JWT from cookie', () => {
    const token = jwt.sign({ id: 'user-1', username: 'testuser', role: 'admin' }, JWT_SECRET, {
      expiresIn: '1h',
    });

    const request = createMockNextRequest({ cookieToken: token });
    const response = middleware(request);

    // Should inject user headers into the request
    const reqHeaders = response._requestHeaders;
    expect(reqHeaders.get('x-user-id')).toBe('user-1');
    expect(reqHeaders.get('x-user-name')).toBe('testuser');
    expect(reqHeaders.get('x-user-role')).toBe('admin');
  });

  test('extracts and verifies JWT from Authorization header', () => {
    const token = jwt.sign({ id: 'user-2', username: 'bearer-user', role: 'editor' }, JWT_SECRET, {
      expiresIn: '1h',
    });

    const request = createMockNextRequest({ authHeader: `Bearer ${token}` });
    const response = middleware(request);

    const reqHeaders = response._requestHeaders;
    expect(reqHeaders.get('x-user-id')).toBe('user-2');
    expect(reqHeaders.get('x-user-name')).toBe('bearer-user');
    expect(reqHeaders.get('x-user-role')).toBe('editor');
  });

  test('sets x-user-id, x-user-name, x-user-role headers on valid token', () => {
    const token = jwt.sign({ id: '42', username: 'alice', role: 'admin' }, JWT_SECRET, {
      expiresIn: '1h',
    });

    const request = createMockNextRequest({ cookieToken: token });
    const response = middleware(request);

    const reqHeaders = response._requestHeaders;
    expect(reqHeaders.get('x-user-id')).toBe('42');
    expect(reqHeaders.get('x-user-name')).toBe('alice');
    expect(reqHeaders.get('x-user-role')).toBe('admin');
  });

  test('handles expired tokens gracefully', () => {
    // Create a token that is already expired
    const token = jwt.sign({ id: 'user-3', username: 'expired-user', role: 'admin' }, JWT_SECRET, {
      expiresIn: '-1s',
    });

    const request = createMockNextRequest({ cookieToken: token });
    const response = middleware(request);

    // Should pass through without user headers (jwt.verify will throw)
    expect(response.status).toBe(200);
    // No user identity headers should be set on a plain next() response
    expect(response._requestHeaders).toBeUndefined();
  });

  test('handles invalid tokens gracefully', () => {
    const request = createMockNextRequest({ cookieToken: 'not-a-valid-jwt-token' });
    const response = middleware(request);

    // Should pass through without crashing
    expect(response.status).toBe(200);
    expect(response._requestHeaders).toBeUndefined();
  });

  test('only matches configured routes', () => {
    expect(config.matcher).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher).toContain('/api/:path*');
    expect(config.matcher).toContain('/(dashboard)/:path*');
    expect(config.matcher).toContain('/onboarding/:path*');
  });
});
