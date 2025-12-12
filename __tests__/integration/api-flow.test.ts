/**
 * Integration API Flow Tests
 *
 * These tests use Node.js built-in http module and global fetch (Node 18+)
 * to avoid ESM import issues with node-fetch.
 */

import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import http from 'node:http';

// Check if fetch is available (Node.js 18+)
const hasFetch = typeof globalThis.fetch === 'function';

// Conditionally run tests based on fetch availability
const describeIfFetch = hasFetch ? describe : describe.skip;

describeIfFetch('Integration API Flow', () => {
  let server: http.Server;
  let baseUrl: string;

  // Helper to collect request body
  const collectBody = (req: http.IncomingMessage): Promise<string> => {
    return new Promise(resolve => {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => resolve(body));
    });
  };

  // Handler functions for different API endpoints
  const handleAuthEndpoint = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const method = req.method || 'GET';

    if (method === 'POST') {
      const body = await collectBody(req);

      // Check for empty body
      if (!body) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request body is required' }));
        return;
      }

      // Check for invalid JSON
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      // Validate credentials
      if (!parsed.username || !parsed.password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Username and password are required' }));
        return;
      }

      // Check for wrong credentials
      if (parsed.username !== 'admin' || parsed.password !== 'admin123') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid credentials' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          token: 'mock-token',
          user: { id: '1', username: 'admin', role: 'admin' },
        })
      );
    } else if (method === 'DELETE') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Logged out successfully' }));
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  };

  const handleFeatureFlagsEndpoint = async (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) => {
    const method = req.method || 'GET';

    if (method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          textParser: { enabled: true, implementation: 'openai' },
          imageGeneration: true,
          summarization: true,
        })
      );
    } else if (method === 'POST') {
      const body = await collectBody(req);

      // Check for empty body
      if (!body) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request body is required' }));
        return;
      }

      // Check for invalid JSON
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      // Validate required fields
      if (parsed.feature === undefined || parsed.enabled === undefined) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Feature and enabled fields are required' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          message: 'Feature flag updated successfully',
          feature: parsed.feature,
          enabled: parsed.enabled,
        })
      );
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  };

  const handleProtectedEndpoint = (req: http.IncomingMessage, res: http.ServerResponse) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Authentication required' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: 'protected content' }));
  };

  const handlePlatformsEndpoint = (_req: http.IncomingMessage, res: http.ServerResponse) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify([
        { id: 1, name: 'Facebook', icon: 'facebook-icon' },
        { id: 2, name: 'Twitter', icon: 'twitter-icon' },
      ])
    );
  };

  const handleNotFound = (res: http.ServerResponse) => {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Not Found' }));
  };

  beforeAll(async () => {
    server = http.createServer(async (req, res) => {
      const url = req.url || '';

      if (url.startsWith('/api/auth')) {
        await handleAuthEndpoint(req, res);
      } else if (url.startsWith('/api/feature-flags')) {
        await handleFeatureFlagsEndpoint(req, res);
      } else if (url.startsWith('/api/platforms')) {
        handlePlatformsEndpoint(req, res);
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

  // ============================================
  // Happy Path Tests
  // ============================================

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
  });

  test('Platforms endpoint returns list of platforms', async () => {
    const response = await fetch(`${baseUrl}/api/platforms`);

    expect(response.status).toBe(200);
    const data = (await response.json()) as Array<{ id: number; name: string }>;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data[0].name).toBe('Facebook');
  });

  test('Feature flags endpoint returns flags', async () => {
    const response = await fetch(`${baseUrl}/api/feature-flags`);

    expect(response.status).toBe(200);
    const data = (await response.json()) as { imageGeneration: boolean };
    expect(data.imageGeneration).toBe(true);
  });

  test('Logout endpoint returns success message', async () => {
    const response = await fetch(`${baseUrl}/api/auth`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(200);
    const data = (await response.json()) as { message: string };
    expect(data.message).toBe('Logged out successfully');
  });

  test('Unknown endpoint returns 404', async () => {
    const response = await fetch(`${baseUrl}/api/unknown`);

    expect(response.status).toBe(404);
  });

  // ============================================
  // Error Case Tests
  // ============================================

  describe('Error Cases', () => {
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
      expect(data.error).toBe('Invalid JSON');
    });

    test('Auth endpoint with missing fields returns 400', async () => {
      const response = await fetch(`${baseUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin' }),
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Username and password are required');
    });

    test('Auth endpoint with wrong credentials returns 401', async () => {
      const response = await fetch(`${baseUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
      });

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Invalid credentials');
    });

    test('Auth endpoint with unsupported method (PUT) returns 405', async () => {
      const response = await fetch(`${baseUrl}/api/auth`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin' }),
      });

      expect(response.status).toBe(405);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Method not allowed');
    });

    test('Feature flags endpoint with unsupported method returns 405', async () => {
      const response = await fetch(`${baseUrl}/api/feature-flags`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(405);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Method not allowed');
    });

    test('Protected endpoint without auth header returns 401', async () => {
      const response = await fetch(`${baseUrl}/api/protected`);

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Authentication required');
    });

    test('Protected endpoint with invalid auth header returns 401', async () => {
      const response = await fetch(`${baseUrl}/api/protected`, {
        headers: { Authorization: 'InvalidToken' },
      });

      expect(response.status).toBe(401);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Authentication required');
    });

    test('Feature flags POST with empty body returns 400', async () => {
      const response = await fetch(`${baseUrl}/api/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '',
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Request body is required');
    });

    test('Feature flags POST with invalid JSON returns 400', async () => {
      const response = await fetch(`${baseUrl}/api/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Invalid JSON');
    });

    test('Feature flags POST with missing fields returns 400', async () => {
      const response = await fetch(`${baseUrl}/api/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: 'imageGeneration' }),
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Feature and enabled fields are required');
    });
  });

  // ============================================
  // Feature Flags Update Tests
  // ============================================

  describe('Feature Flags Update', () => {
    test('Feature flags POST updates a flag successfully', async () => {
      const response = await fetch(`${baseUrl}/api/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    });

    test('Feature flags POST can enable a flag', async () => {
      const response = await fetch(`${baseUrl}/api/feature-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
});
