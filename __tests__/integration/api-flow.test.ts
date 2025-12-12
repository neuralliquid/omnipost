/**
 * Integration API Flow Tests
 *
 * These tests use Node.js built-in http module and global fetch (Node 18+)
 * to avoid ESM import issues with node-fetch.
 *
 * The mock server replicates production behavior including:
 * - Zod schema validation for inputs
 * - Error handling wrappers matching production error responses
 * - Authorization checks with Bearer token validation
 * - Rate limiting simulation (tracking request counts)
 * - Audit logging stubs
 *
 * @jest-environment node
 */

import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import http from 'node:http';
import { z } from 'zod';

// Check if fetch is available (Node.js 18+)
const hasFetch = typeof globalThis.fetch === 'function';

// Conditionally run tests based on fetch availability
const describeIfFetch = hasFetch ? describe : describe.skip;

describeIfFetch('Integration API Flow', () => {
  let server: http.Server;
  let baseUrl: string;

  // ============================================
  // Zod Schemas (matching production validation)
  // ============================================

  const AuthLoginSchema = z.object({
    username: z
      .string()
      .min(1, 'Username is required')
      .max(100, 'Username too long'),
    password: z
      .string()
      .min(1, 'Password is required')
      .max(200, 'Password too long'),
  });

  const FeatureFlagUpdateSchema = z.object({
    feature: z
      .string()
      .min(1, 'Feature name is required')
      .max(50, 'Feature name too long'),
    enabled: z.boolean({
      required_error: 'Enabled field is required',
      invalid_type_error: 'Enabled must be a boolean',
    }),
  });

  const PlatformInputSchema = z.object({
    name: z
      .string()
      .min(1, 'Platform name is required')
      .max(100, 'Platform name too long'),
    type: z.enum(['social', 'blog', 'newsletter', 'video', 'podcast', 'custom']),
    enabled: z.boolean().optional().default(true),
  });

  // ============================================
  // Rate Limiting Simulation
  // ============================================

  const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT_MAX = 10;
  const RATE_LIMIT_WINDOW_MS = 60000;

  const checkRateLimit = (endpoint: string, ip: string): { allowed: boolean; remaining: number } => {
    const key = `${endpoint}:${ip}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
      return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
    }

    if (entry.count >= RATE_LIMIT_MAX) {
      return { allowed: false, remaining: 0 };
    }

    entry.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
  };

  const resetRateLimits = () => {
    rateLimitStore.clear();
  };

  // ============================================
  // Audit Logging Stub
  // ============================================

  const auditLogs: Array<{ action: string; details: Record<string, unknown>; timestamp: Date }> = [];

  const logAudit = (action: string, details: Record<string, unknown> = {}) => {
    auditLogs.push({ action, details, timestamp: new Date() });
  };

  const clearAuditLogs = () => {
    auditLogs.length = 0;
  };

  // ============================================
  // Helper Functions
  // ============================================

  const collectBody = (req: http.IncomingMessage): Promise<string> => {
    return new Promise(resolve => {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => resolve(body));
    });
  };

  const parseJsonBody = (body: string): { success: true; data: unknown } | { success: false; error: string } => {
    if (!body) {
      return { success: false, error: 'Request body is required' };
    }
    try {
      return { success: true, data: JSON.parse(body) };
    } catch {
      return { success: false, error: 'Invalid JSON payload' };
    }
  };

  const validateWithZod = <T extends z.ZodType>(
    schema: T,
    data: unknown
  ): { success: true; data: z.infer<T> } | { success: false; errors: string[] } => {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    return { success: false, errors };
  };

  const sendError = (res: http.ServerResponse, status: number, error: string, details?: string[]) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    const body: { error: string; details?: string[] } = { error };
    if (details && details.length > 0) {
      body.details = details;
    }
    res.end(JSON.stringify(body));
  };

  const sendSuccess = (res: http.ServerResponse, data: unknown, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  const getClientIp = (req: http.IncomingMessage): string => {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           req.socket.remoteAddress ||
           '127.0.0.1';
  };

  const extractBearerToken = (req: http.IncomingMessage): string | null => {
    const authHeader = req.headers['authorization'];

    // Normalize header: handle string | string[] | undefined
    let auth: string | undefined;
    if (Array.isArray(authHeader)) {
      auth = authHeader[0];
    } else if (typeof authHeader === 'string') {
      auth = authHeader;
    }

    // Return null if missing or not a Bearer token
    if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      return null;
    }

    return auth.slice(7);
  };

  // Simple token validation (in production would verify JWT)
  const isValidToken = (token: string): boolean => {
    return token === 'mock-token' || token === 'valid-test-token';
  };

  // ============================================
  // Endpoint Handlers (matching production behavior)
  // ============================================

  const handleAuthEndpoint = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const method = req.method || 'GET';
    const clientIp = getClientIp(req);

    // Rate limiting check
    const rateLimit = checkRateLimit('/api/auth', clientIp);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
    if (!rateLimit.allowed) {
      logAudit('RATE_LIMIT_EXCEEDED', { endpoint: '/api/auth', ip: clientIp });
      return sendError(res, 429, 'Too many requests. Please try again later.');
    }

    if (method === 'POST') {
      const body = await collectBody(req);

      // Parse JSON
      const parseResult = parseJsonBody(body);
      if (!parseResult.success) {
        logAudit('LOGIN_FAILED', { reason: parseResult.error });
        return sendError(res, 400, parseResult.error);
      }

      // Validate with Zod schema
      const validation = validateWithZod(AuthLoginSchema, parseResult.data);
      if (!validation.success) {
        logAudit('LOGIN_FAILED', { reason: 'Validation failed', errors: validation.errors });
        return sendError(res, 400, 'Validation failed', validation.errors);
      }

      const { username, password } = validation.data;

      // Check credentials (in production would use bcrypt)
      if (username !== 'admin' || password !== 'admin123') {
        logAudit('LOGIN_FAILED', { username, reason: 'Invalid credentials' });
        return sendError(res, 401, 'Invalid credentials');
      }

      logAudit('LOGIN_SUCCESS', { username, userId: '1' });
      return sendSuccess(res, {
        token: 'mock-token',
        user: { id: '1', username: 'admin', role: 'admin' },
      });
    } else if (method === 'DELETE') {
      const token = extractBearerToken(req);
      logAudit('LOGOUT', { hadToken: !!token });
      return sendSuccess(res, { message: 'Logged out successfully' });
    } else {
      return sendError(res, 405, 'Method not allowed');
    }
  };

  const handleFeatureFlagsEndpoint = async (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) => {
    const method = req.method || 'GET';
    const clientIp = getClientIp(req);

    // Rate limiting check
    const rateLimit = checkRateLimit('/api/feature-flags', clientIp);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
    if (!rateLimit.allowed) {
      return sendError(res, 429, 'Too many requests. Please try again later.');
    }

    if (method === 'GET') {
      logAudit('GET_FEATURE_FLAGS', {});
      return sendSuccess(res, {
        textParser: { enabled: true, implementation: 'openai' },
        imageGeneration: true,
        summarization: true,
      });
    } else if (method === 'POST') {
      // Require admin authentication for POST
      const token = extractBearerToken(req);
      if (!token || !isValidToken(token)) {
        logAudit('UPDATE_FEATURE_FLAG_FAILED', { reason: 'Not authenticated' });
        return sendError(res, 401, 'Authentication required');
      }

      const body = await collectBody(req);

      // Parse JSON
      const parseResult = parseJsonBody(body);
      if (!parseResult.success) {
        return sendError(res, 400, parseResult.error);
      }

      // Validate with Zod schema
      const validation = validateWithZod(FeatureFlagUpdateSchema, parseResult.data);
      if (!validation.success) {
        return sendError(res, 400, 'Validation failed', validation.errors);
      }

      const { feature, enabled } = validation.data;
      logAudit('UPDATE_FEATURE_FLAG', { feature, enabled });

      return sendSuccess(res, {
        message: 'Feature flag updated successfully',
        feature,
        enabled,
      });
    } else {
      return sendError(res, 405, 'Method not allowed');
    }
  };

  const handlePlatformsEndpoint = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const method = req.method || 'GET';
    const clientIp = getClientIp(req);

    // Rate limiting check
    const rateLimit = checkRateLimit('/api/platforms', clientIp);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
    if (!rateLimit.allowed) {
      return sendError(res, 429, 'Too many requests. Please try again later.');
    }

    // Require authentication for all platform operations
    const token = extractBearerToken(req);
    if (!token || !isValidToken(token)) {
      return sendError(res, 401, 'Authentication required');
    }

    if (method === 'GET') {
      logAudit('GET_PLATFORMS', {});
      return sendSuccess(res, [
        { id: 1, name: 'Facebook', type: 'social', enabled: true },
        { id: 2, name: 'Twitter', type: 'social', enabled: true },
      ]);
    } else if (method === 'POST') {
      const body = await collectBody(req);

      // Parse JSON
      const parseResult = parseJsonBody(body);
      if (!parseResult.success) {
        return sendError(res, 400, parseResult.error);
      }

      // Validate with Zod schema
      const validation = validateWithZod(PlatformInputSchema, parseResult.data);
      if (!validation.success) {
        return sendError(res, 400, 'Validation failed', validation.errors);
      }

      const platform = validation.data;
      logAudit('CREATE_PLATFORM', { name: platform.name });

      return sendSuccess(res, {
        id: 3,
        ...platform,
      }, 201);
    } else {
      return sendError(res, 405, 'Method not allowed');
    }
  };

  const handleProtectedEndpoint = (req: http.IncomingMessage, res: http.ServerResponse) => {
    const token = extractBearerToken(req);

    if (!token) {
      return sendError(res, 401, 'Authentication required');
    }

    if (!isValidToken(token)) {
      return sendError(res, 403, 'Invalid or expired token');
    }

    logAudit('ACCESS_PROTECTED', { tokenValid: true });
    return sendSuccess(res, { data: 'protected content' });
  };

  const handleNotFound = (res: http.ServerResponse) => {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  };

  // ============================================
  // Server Setup
  // ============================================

  beforeAll(async () => {
    server = http.createServer(async (req, res) => {
      const url = req.url || '';

      if (url.startsWith('/api/auth')) {
        await handleAuthEndpoint(req, res);
      } else if (url.startsWith('/api/feature-flags')) {
        await handleFeatureFlagsEndpoint(req, res);
      } else if (url.startsWith('/api/platforms')) {
        await handlePlatformsEndpoint(req, res);
      } else if (url.startsWith('/api/protected')) {
        handleProtectedEndpoint(req, res);
      } else {
        handleNotFound(res);
      }
    });

    await new Promise<void>(resolve => {
      server.listen(0, () => {
        const address = server.address() as { port: number };
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    resetRateLimits();
    clearAuditLogs();
  });

  // ============================================
  // Happy Path Tests
  // ============================================

  describe('Happy Path', () => {
    test('Login endpoint returns token and user', async () => {
      const response = await fetch(`${baseUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as { token: string; user: { id: string } };
      expect(data.token).toBe('mock-token');
      expect(data.user.id).toBe('1');
      expect(auditLogs.some(log => log.action === 'LOGIN_SUCCESS')).toBe(true);
    });

    test('Platforms endpoint returns list of platforms with auth', async () => {
      const response = await fetch(`${baseUrl}/api/platforms`, {
        headers: { Authorization: 'Bearer mock-token' },
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as Array<{ id: number; name: string }>;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0].name).toBe('Facebook');
    });

    test('Feature flags GET endpoint returns flags', async () => {
      const response = await fetch(`${baseUrl}/api/feature-flags`);

      expect(response.status).toBe(200);
      const data = (await response.json()) as { imageGeneration: boolean };
      expect(data.imageGeneration).toBe(true);
    });

    test('Logout endpoint returns success message', async () => {
      const response = await fetch(`${baseUrl}/api/auth`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' },
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as { message: string };
      expect(data.message).toBe('Logged out successfully');
    });

    test('Unknown endpoint returns 404', async () => {
      const response = await fetch(`${baseUrl}/api/unknown`);
      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // Validation Error Tests (Zod)
  // ============================================

  describe('Zod Validation Errors', () => {
    test('Auth endpoint with empty body returns 400', async () => {
      const response = await fetch(`${baseUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '',
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Request body is required');
    });

    test('Auth endpoint with invalid JSON returns 400', async () => {
      const response = await fetch(`${baseUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid-json',
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Invalid JSON payload');
    });

    test('Auth endpoint with missing username returns 400 with Zod error', async () => {
      const response = await fetch(`${baseUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test123' }),
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string; details: string[] };
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
      expect(data.details.some(d => d.includes('username'))).toBe(true);
    });

    test('Auth endpoint with missing password returns 400 with Zod error', async () => {
      const response = await fetch(`${baseUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin' }),
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string; details: string[] };
      expect(data.error).toBe('Validation failed');
      expect(data.details.some(d => d.includes('password'))).toBe(true);
    });

    test('Feature flags POST with invalid enabled type returns 400', async () => {
      const response = await fetch(`${baseUrl}/api/feature-flags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify({ feature: 'test', enabled: 'not-a-boolean' }),
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string; details: string[] };
      expect(data.error).toBe('Validation failed');
      expect(data.details.some(d => d.includes('boolean'))).toBe(true);
    });

    test('Platform POST with invalid type enum returns 400', async () => {
      const response = await fetch(`${baseUrl}/api/platforms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify({ name: 'Test', type: 'invalid-type' }),
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string; details: string[] };
      expect(data.error).toBe('Validation failed');
    });
  });

  // ============================================
  // Authentication Error Tests
  // ============================================

  describe('Authentication Errors', () => {
    test('Auth endpoint with wrong credentials returns 401', async () => {
      const response = await fetch(`${baseUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
      });

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Invalid credentials');
      expect(auditLogs.some(log => log.action === 'LOGIN_FAILED')).toBe(true);
    });

    test('Protected endpoint without auth header returns 401', async () => {
      const response = await fetch(`${baseUrl}/api/protected`);

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Authentication required');
    });

    test('Protected endpoint with invalid token returns 403', async () => {
      const response = await fetch(`${baseUrl}/api/protected`, {
        headers: { Authorization: 'Bearer invalid-token-xyz' },
      });

      expect(response.status).toBe(403);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Invalid or expired token');
    });

    test('Protected endpoint with malformed auth header returns 401', async () => {
      const response = await fetch(`${baseUrl}/api/protected`, {
        headers: { Authorization: 'InvalidFormat' },
      });

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Authentication required');
    });

    test('Platforms endpoint without auth returns 401', async () => {
      const response = await fetch(`${baseUrl}/api/platforms`);

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Authentication required');
    });

    test('Feature flags POST without auth returns 401', async () => {
      const response = await fetch(`${baseUrl}/api/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: 'test', enabled: true }),
      });

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Authentication required');
    });
  });

  // ============================================
  // Method Not Allowed Tests (405)
  // ============================================

  describe('Method Not Allowed (405)', () => {
    test('Auth endpoint with PUT returns 405', async () => {
      const response = await fetch(`${baseUrl}/api/auth`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin' }),
      });

      expect(response.status).toBe(405);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Method not allowed');
    });

    test('Auth endpoint with PATCH returns 405', async () => {
      const response = await fetch(`${baseUrl}/api/auth`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(405);
    });

    test('Feature flags endpoint with DELETE returns 405', async () => {
      const response = await fetch(`${baseUrl}/api/feature-flags`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(405);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Method not allowed');
    });

    test('Platforms endpoint with PATCH returns 405', async () => {
      const response = await fetch(`${baseUrl}/api/platforms`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer mock-token' },
      });

      expect(response.status).toBe(405);
    });
  });

  // ============================================
  // Rate Limiting Tests
  // ============================================

  describe('Rate Limiting', () => {
    test('Rate limit header is present on responses', async () => {
      const response = await fetch(`${baseUrl}/api/feature-flags`);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });

    test('Rate limit decreases with each request', async () => {
      const response1 = await fetch(`${baseUrl}/api/feature-flags`);
      const remaining1 = parseInt(response1.headers.get('X-RateLimit-Remaining') || '0', 10);

      const response2 = await fetch(`${baseUrl}/api/feature-flags`);
      const remaining2 = parseInt(response2.headers.get('X-RateLimit-Remaining') || '0', 10);

      expect(remaining2).toBe(remaining1 - 1);
    });

    test('Exceeding rate limit returns 429', async () => {
      // Make requests up to the limit
      for (let i = 0; i < RATE_LIMIT_MAX; i++) {
        await fetch(`${baseUrl}/api/feature-flags`);
      }

      // Next request should be rate limited
      const response = await fetch(`${baseUrl}/api/feature-flags`);
      expect(response.status).toBe(429);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('Too many requests');
    });
  });

  // ============================================
  // Feature Flags Update Tests
  // ============================================

  describe('Feature Flags Update (with Auth)', () => {
    test('Feature flags POST updates a flag successfully', async () => {
      const response = await fetch(`${baseUrl}/api/feature-flags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify({ feature: 'imageGeneration', enabled: false }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as {
        message: string;
        feature: string;
        enabled: boolean;
      };
      expect(data.message).toBe('Feature flag updated successfully');
      expect(data.feature).toBe('imageGeneration');
      expect(data.enabled).toBe(false);
      expect(auditLogs.some(log => log.action === 'UPDATE_FEATURE_FLAG')).toBe(true);
    });

    test('Feature flags POST can enable a flag', async () => {
      const response = await fetch(`${baseUrl}/api/feature-flags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify({ feature: 'summarization', enabled: true }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as {
        message: string;
        feature: string;
        enabled: boolean;
      };
      expect(data.feature).toBe('summarization');
      expect(data.enabled).toBe(true);
    });
  });

  // ============================================
  // Platform CRUD Tests (with Auth)
  // ============================================

  describe('Platform Operations', () => {
    test('Create platform with valid data succeeds', async () => {
      const response = await fetch(`${baseUrl}/api/platforms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify({ name: 'LinkedIn', type: 'social' }),
      });

      expect(response.status).toBe(201);
      const data = (await response.json()) as { id: number; name: string; type: string };
      expect(data.name).toBe('LinkedIn');
      expect(data.type).toBe('social');
      expect(data.id).toBeDefined();
    });

    test('Create platform with optional enabled field', async () => {
      const response = await fetch(`${baseUrl}/api/platforms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify({ name: 'Medium', type: 'blog', enabled: false }),
      });

      expect(response.status).toBe(201);
      const data = (await response.json()) as { enabled: boolean };
      expect(data.enabled).toBe(false);
    });
  });

  // ============================================
  // Audit Logging Tests
  // ============================================

  describe('Audit Logging', () => {
    test('Successful login is logged', async () => {
      await fetch(`${baseUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      });

      const loginLog = auditLogs.find(log => log.action === 'LOGIN_SUCCESS');
      expect(loginLog).toBeDefined();
      expect(loginLog?.details.username).toBe('admin');
    });

    test('Failed login is logged', async () => {
      await fetch(`${baseUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrong' }),
      });

      const failedLog = auditLogs.find(log => log.action === 'LOGIN_FAILED');
      expect(failedLog).toBeDefined();
      expect(failedLog?.details.reason).toBe('Invalid credentials');
    });

    test('Rate limit exceeded is logged', async () => {
      for (let i = 0; i < RATE_LIMIT_MAX + 1; i++) {
        await fetch(`${baseUrl}/api/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin123' }),
        });
      }

      const rateLimitLog = auditLogs.find(log => log.action === 'RATE_LIMIT_EXCEEDED');
      expect(rateLimitLog).toBeDefined();
    });
  });
});
