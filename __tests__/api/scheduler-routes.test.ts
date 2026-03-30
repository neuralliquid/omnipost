/**
 * Scheduler API Route Tests
 *
 * Tests for GET /api/scheduler (list jobs) and
 * POST /api/scheduler (create job).
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '../setup';

// Mock audit trail
jest.mock('../../app/api/_utils/audit', () => ({
  createLogEntry: jest.fn(() => ({})),
  logToAuditTrail: jest.fn(),
}));

// Mock scheduler module
const mockSchedule = jest.fn();
const mockGetAllJobs = jest.fn();
const mockGetJobsByStatus = jest.fn();
const mockGetJobsByCampaign = jest.fn();

// Mock the scheduler - need to mock the barrel export that the route imports from
jest.mock('../../lib/scheduler', () => {
  const original = jest.requireActual('../../lib/scheduler') as Record<string, unknown>;
  return {
    ...original,
    getScheduler: jest.fn(() => ({
      schedule: mockSchedule,
      getAllJobs: mockGetAllJobs,
      getJobsByStatus: mockGetJobsByStatus,
      getJobsByCampaign: mockGetJobsByCampaign,
    })),
  };
});

jest.mock('@/app/api/_utils/sanitize', () => ({
  sanitizeText: jest.fn((val: string) => val),
  validateAndSanitize: jest.fn((schema: { safeParse: Function }, data: unknown) => {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      errors: result.error.issues.map((i: { message: string }) => i.message),
    };
  }),
}));

import { GET, POST } from '../../app/api/scheduler/route';

function createRequest(
  method: string,
  body?: Record<string, unknown>,
  url: string = 'http://localhost:3000/api/scheduler'
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

const sampleJob = {
  id: 'job-1',
  type: 'standalone',
  contentId: 'content-1',
  platformId: 'twitter',
  content: { text: 'Hello world' },
  scheduledTime: '2026-04-01T12:00:00Z',
  timezone: 'UTC',
  status: 'pending',
  createdBy: '1', // Matches the mock x-user-id from setup.ts
};

describe('Scheduler API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllJobs.mockResolvedValue([sampleJob]);
    mockGetJobsByStatus.mockResolvedValue([sampleJob]);
    mockGetJobsByCampaign.mockResolvedValue([sampleJob]);
    mockSchedule.mockResolvedValue(sampleJob);
  });

  describe('GET /api/scheduler', () => {
    test('requires authentication', async () => {
      // Override headers mock to simulate unauthenticated request
      const { headers } = require('next/headers');
      (headers as jest.Mock).mockReturnValueOnce({
        get: (name: string) => null, // No x-user-id
      });

      const request = createRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toContain('Authentication required');
    });

    test('returns paginated jobs', async () => {
      const request = createRequest('GET', undefined, 'http://localhost:3000/api/scheduler');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobs).toBeDefined();
      expect(Array.isArray(data.jobs)).toBe(true);
      expect(data.count).toBeDefined();
      expect(data.total).toBeDefined();
    });
  });

  describe('POST /api/scheduler', () => {
    test('creates job with valid input', async () => {
      const validJob = {
        type: 'standalone',
        contentId: 'content-1',
        platformId: 'twitter',
        content: { text: 'Hello world from scheduler test' },
        scheduledTime: '2026-04-01T12:00:00Z',
      };

      const request = createRequest('POST', validJob);
      const response = await POST(request);
      const data = await response.json();

      console.log('POST response status:', response.status, 'data:', JSON.stringify(data));
      expect(response.status).toBe(201);
      expect(data.job).toBeDefined();
      expect(mockSchedule).toHaveBeenCalledTimes(1);
      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'standalone',
          contentId: 'content-1',
          platformId: 'twitter',
          createdBy: '1',
        })
      );
    });

    test('rejects invalid input', async () => {
      // Missing required fields
      const invalidJob = {
        type: 'standalone',
        // missing contentId, platformId, content, scheduledTime
      };

      const request = createRequest('POST', invalidJob);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Invalid input');
      expect(mockSchedule).not.toHaveBeenCalled();
    });

    test('requires authentication for POST', async () => {
      const { headers } = require('next/headers');
      (headers as jest.Mock).mockReturnValueOnce({
        get: (name: string) => null, // No x-user-id
      });

      const validJob = {
        type: 'standalone',
        contentId: 'content-1',
        platformId: 'twitter',
        content: { text: 'Hello world' },
        scheduledTime: '2026-04-01T12:00:00Z',
      };

      const request = createRequest('POST', validJob);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(mockSchedule).not.toHaveBeenCalled();
    });
  });
});
