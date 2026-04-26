/**
 * Analytics Events API Tests
 *
 * Tests for POST /api/analytics/events (batch event ingestion)
 * and GET /api/analytics/events (funnel metrics retrieval).
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '../setup';

// Mock audit trail
jest.mock('../../app/api/_utils/audit', () => ({
  createLogEntry: jest.fn(() => ({})),
  logToAuditTrail: jest.fn(),
}));

// We need to reset module state between tests because the eventStore is module-level
let POST: (req: Request) => Promise<Response>;
let GET: (req: Request) => Promise<Response>;

function createRequest(
  method: string,
  body?: Record<string, unknown>,
  url: string = 'http://localhost:3000/api/analytics/events'
): Request {
  return {
    method,
    url,
    headers: {
      get: (name: string) => {
        if (name === 'content-type') return 'application/json';
        if (name === 'x-forwarded-for') return '127.0.0.1';
        return null;
      },
    },
    json: async () => body || {},
  } as unknown as Request;
}

describe('Analytics Events API', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Re-import to reset in-memory eventStore
    jest.resetModules();
    const mod = await import('../../app/api/analytics/events/route');
    POST = mod.POST;
    GET = mod.GET;
  });

  describe('POST /api/analytics/events', () => {
    test('should accept a valid event batch (200)', async () => {
      const request = createRequest('POST', {
        events: [
          { name: 'page_viewed', properties: { url: '/home' } },
          { name: 'signup_started', properties: { method: 'email' } },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.received).toBe(2);
    });

    test('should reject an empty events array (400)', async () => {
      const request = createRequest('POST', {
        events: [],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Invalid event batch');
    });

    test('should reject an oversized batch with more than 50 events (400)', async () => {
      const events = Array.from({ length: 51 }, (_, i) => ({
        name: `event_${i}`,
        properties: {},
      }));

      const request = createRequest('POST', { events });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Invalid event batch');
    });

    test('should reject an event with an empty name (400)', async () => {
      const request = createRequest('POST', {
        events: [{ name: '', properties: {} }],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Invalid event batch');
    });
  });

  describe('GET /api/analytics/events', () => {
    test('should require authentication (401 without user headers)', async () => {
      // Override headers mock to simulate unauthenticated request
      const { headers } = require('next/headers');
      (headers as jest.Mock).mockReturnValueOnce({
        get: (name: string) => {
          // No x-user-id header means unauthenticated
          return null;
        },
      });

      const request = createRequest('GET', undefined, 'http://localhost:3000/api/analytics/events');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toContain('Authentication required');
    });

    test('should return funnel metrics with auth headers', async () => {
      // First, ingest some events
      const postRequest = createRequest('POST', {
        events: [
          { name: 'page_viewed', properties: {} },
          { name: 'signup_started', properties: {} },
          { name: 'signup_completed', properties: {} },
          { name: 'platform_connected', properties: {} },
        ],
      });
      await POST(postRequest);

      // Then, query the events (uses default mock which includes x-user-id)
      const getRequest = createRequest(
        'GET',
        undefined,
        'http://localhost:3000/api/analytics/events'
      );

      const response = await GET(getRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalEvents).toBe(4);
      expect(data.funnel).toBeDefined();
      expect(data.funnel.acquisition.pageViews).toBe(1);
      expect(data.funnel.acquisition.signupStarted).toBe(1);
      expect(data.funnel.acquisition.signupCompleted).toBe(1);
      expect(data.funnel.activation.platformConnected).toBe(1);
    });

    test('should filter by event name', async () => {
      // Ingest events
      const postRequest = createRequest('POST', {
        events: [
          { name: 'page_viewed', properties: {} },
          { name: 'page_viewed', properties: {} },
          { name: 'signup_started', properties: {} },
        ],
      });
      await POST(postRequest);

      // Query filtered by event name
      const getRequest = createRequest(
        'GET',
        undefined,
        'http://localhost:3000/api/analytics/events?event=page_viewed'
      );

      const response = await GET(getRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalEvents).toBe(2);
      expect(data.counts['page_viewed']).toBe(2);
      expect(data.counts['signup_started']).toBeUndefined();
    });

    test('should filter by since date', async () => {
      // Ingest events
      const postRequest = createRequest('POST', {
        events: [{ name: 'page_viewed', properties: {} }],
      });
      await POST(postRequest);

      // Use a date far in the past so all events are included
      const pastDate = '2020-01-01T00:00:00Z';
      const getRequest = createRequest(
        'GET',
        undefined,
        `http://localhost:3000/api/analytics/events?since=${pastDate}`
      );

      const response = await GET(getRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalEvents).toBe(1);

      // Use a date far in the future so no events match
      const futureDate = '2099-01-01T00:00:00Z';
      const getRequest2 = createRequest(
        'GET',
        undefined,
        `http://localhost:3000/api/analytics/events?since=${futureDate}`
      );

      const response2 = await GET(getRequest2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.totalEvents).toBe(0);
    });
  });
});
