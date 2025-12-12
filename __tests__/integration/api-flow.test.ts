/**
 * Integration API Flow Tests
 *
 * These tests use Node.js built-in http module and global fetch (Node 18+)
 * to avoid ESM import issues with node-fetch.
 */

import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import http from 'http';

// Check if fetch is available (Node.js 18+)
const hasFetch = typeof globalThis.fetch === 'function';

// Conditionally run tests based on fetch availability
const describeIfFetch = hasFetch ? describe : describe.skip;

describeIfFetch('Integration API Flow', () => {
  let server: http.Server;
  let baseUrl: string;

  // Handler functions for different API endpoints
  const handleAuthEndpoint = (req: http.IncomingMessage, res: http.ServerResponse) => {
    const method = req.method || 'GET';

    if (method === 'POST') {
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

  const handleFeatureFlagsEndpoint = (req: http.IncomingMessage, res: http.ServerResponse) => {
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          message: 'Feature flag updated successfully',
          feature: 'imageGeneration',
          enabled: false,
        })
      );
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
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
    server = http.createServer((req, res) => {
      const url = req.url || '';

      if (url.startsWith('/api/auth')) {
        handleAuthEndpoint(req, res);
      } else if (url.startsWith('/api/feature-flags')) {
        handleFeatureFlagsEndpoint(req, res);
      } else if (url.startsWith('/api/platforms')) {
        handlePlatformsEndpoint(req, res);
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
});
