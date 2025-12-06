import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/feature-flags/route';
import '../setup';

// Mock isAdmin function
jest.mock('../../app/api/_utils/auth', () => ({
  isAdmin: jest.fn(() => Promise.resolve(true)),
  // Add any other functions from the module that might be used
  verifyToken: jest.fn(),
  getTokenFromRequest: jest.fn(),
}));

// Mock logToAuditTrail function
jest.mock('../../app/api/_utils/audit', () => ({
  createLogEntry: jest.fn(() => ({})),
  logToAuditTrail: jest.fn(),
}));

// Helper function to create a mock request
function createMockRequest(method: string, body: Record<string, any>): NextRequest {
  const mockRequest: Partial<NextRequest> = {
    method,
    // Explicitly type the json method to return a Promise
    json: jest.fn<() => Promise<Record<string, any>>>().mockResolvedValue(body),
    headers: {
      get: jest.fn((name: string) => 'mock-value'),
      append: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(() => false),
      set: jest.fn(),
      entries: jest.fn(() => [][Symbol.iterator]()),
      forEach: jest.fn(),
      keys: jest.fn(() => [][Symbol.iterator]()),
      values: jest.fn(() => [][Symbol.iterator]()),
      getSetCookie: jest.fn(() => []),
      [Symbol.iterator]: jest.fn(() => [][Symbol.iterator]()),
    },
  };
  return mockRequest as NextRequest;
}
describe('Feature Flags API', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/feature-flags', () => {
    test('should return all feature flags', async () => {
      // Create a mock request for GET
      const request = createMockRequest('GET', {});

      // Execute the handler
      const response = await GET(request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('textParser');
      expect(data.textParser).toHaveProperty('enabled', true);
      expect(data.textParser).toHaveProperty('implementation', 'openai');
      expect(data).toHaveProperty('imageGeneration');
      expect(data.imageGeneration).toHaveProperty('enabled', true);
      expect(data.imageGeneration).toHaveProperty('implementation', 'huggingface');
      expect(data).toHaveProperty('summarization');
      expect(data.summarization).toHaveProperty('enabled', true);
      expect(data.summarization).toHaveProperty('implementation', 'huggingface');
    });
  });

  describe('POST /api/feature-flags', () => {
    test('should update a feature flag', async () => {
      // Create mock request
      const request = createMockRequest('POST', {
        feature: 'imageGeneration',
        enabled: false,
      });

      // Execute the handler
      const response = await POST(request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message', 'Feature flag updated successfully');
      expect(data).toHaveProperty('feature', 'imageGeneration');
      expect(data).toHaveProperty('enabled', false);
    });

    test('should validate feature name', async () => {
      // Create mock request with invalid feature name
      const request = createMockRequest('POST', {
        feature: '',
        enabled: false,
      });

      // Execute the handler
      const response = await POST(request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message');
      // Zod returns detailed error messages, just check it's about the feature
      expect(data.message).toMatch(/feature|invalid/i);
    });

    test('should validate enabled flag', async () => {
      // Create mock request with invalid enabled value
      const request = createMockRequest('POST', {
        feature: 'imageGeneration',
        enabled: 'not-a-boolean',
      });

      // Execute the handler
      const response = await POST(request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message');
      // Zod returns detailed error - check it mentions boolean or enabled
      expect(data.message).toMatch(/boolean|enabled/i);
    });

    test('should validate implementation for textParser', async () => {
      // Create mock request with invalid implementation
      const request = createMockRequest('POST', {
        feature: 'textParser',
        enabled: true,
        implementation: 'invalid-implementation',
      });

      // Execute the handler
      const response = await POST(request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message');
      // Zod returns detailed error - check it mentions implementation or enum
      expect(data.message).toMatch(/implementation|enum|invalid/i);
    });

    test('should require admin privileges', async () => {
      // Mock headers to return non-admin role
      const { headers } = require('next/headers');
      const mockHeaderGet = (name: string) => {
        if (name === 'x-user-id') return '1'; // Authenticated
        if (name === 'x-user-role') return 'user'; // But not admin
        if (name === 'x-user-name') return 'testuser';
        return null;
      };
      headers.mockImplementationOnce(() => ({
        get: jest.fn(mockHeaderGet),
      }));

      // Create mock request
      const request = createMockRequest('POST', {
        feature: 'imageGeneration',
        enabled: false,
      });

      // Execute the handler
      const response = await POST(request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(data).toHaveProperty('message', 'Admin privileges required to update feature flags');
    });
  });
});
