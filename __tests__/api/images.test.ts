import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the modules before importing the route handlers
jest.mock('../../app/api/images/route', () => {
  // Get the actual implementation
  const actual = jest.requireActual('../../app/api/images/route');
  return {
    ...(typeof actual === 'object' && actual !== null ? actual : {}),
  };
});

// Create simple mock functions with explicit any types
const mockGenerateImage = jest.fn(async (params: any) => ({
  data: { url: 'https://example.com/generated-image.jpg' },
}));

const mockApproveImage = jest.fn(async (params: any) => ({
  success: true,
  message: 'Image approved successfully',
}));

const mockRejectImage = jest.fn(async (params: any) => ({
  success: true,
  message: 'Image rejected successfully',
}));

const mockRegenerateImage = jest.fn(async (params: any) => ({
  data: { url: 'https://example.com/regenerated-image.jpg' },
}));

// Mock the HuggingFaceClient
jest.mock('../../lib/clients/huggingface', () => ({
  HuggingFaceClient: jest.fn().mockImplementation(() => ({
    generateImage: mockGenerateImage,
    approveImage: mockApproveImage,
    rejectImage: mockRejectImage,
    regenerateImage: mockRegenerateImage,
  })),
}));

// Mock authentication functions
jest.mock('../../app/api/_utils/auth', () => ({
  isAuthenticated: jest.fn(() => Promise.resolve(true)), // Changed to return Promise
}));

// Mock audit logging functions
jest.mock('../../app/api/_utils/audit', () => ({
  createLogEntry: jest.fn(() => ({})),
  logToAuditTrail: jest.fn(),
}));

// Mock sanitization utilities
jest.mock('../../app/api/_utils/sanitize', () => ({
  validateAndSanitize: jest.fn((schema, data) => ({
    success: true,
    data: data,
    errors: [],
  })),
  imageContextSchema: {},
}));

// Mock feature flags
jest.mock('../../utils/featureFlags', () => ({
  __esModule: true,
  default: {
    imageGeneration: true,
  },
}));

// Now import the route handlers
import { POST, PUT } from '../../app/api/images/route';

// Helper function to create a mock request
function createMockRequest(body: any): NextRequest {
  return {
    json: () => Promise.resolve(body),
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe('Images API', () => {
  describe('POST /api/images (generate image)', () => {
    test('should generate an image with valid context', async () => {
      // Create mock request
      const request = createMockRequest({
        context: 'A beautiful sunset over mountains',
      });

      // Execute the handler
      const response = await POST(request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('url', 'https://example.com/generated-image.jpg');

      // Verify that generateImage was called with the correct context
      expect(mockGenerateImage).toHaveBeenCalledWith({
        context: 'A beautiful sunset over mountains',
      });
    });

    test('should validate context', async () => {
      // Create mock request with empty context
      const request = createMockRequest({
        context: '',
      });

      // Execute the handler
      const response = await POST(request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('Context');

      // Verify that generateImage was not called
      expect(mockGenerateImage).not.toHaveBeenCalled();
    });

    test('should require authentication', async () => {
      // Mock headers to return no user ID (unauthenticated)
      const { headers } = require('next/headers');
      headers.mockImplementationOnce(() => ({
        get: jest.fn((name: string) => {
          if (name === 'x-user-id') return null; // No user ID = not authenticated
          return null;
        }),
      }));

      // Create mock request
      const request = createMockRequest({
        context: 'A beautiful sunset over mountains',
      });

      // Execute the handler
      const response = await POST(request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(data).toHaveProperty('message', 'Authentication required to generate images');

      // Verify that generateImage was not called
      expect(mockGenerateImage).not.toHaveBeenCalled();
    });

    test('should check if image generation is enabled', async () => {
      // Mock feature flags to disable image generation
      jest.resetModules();
      jest.mock('../../utils/featureFlags', () => ({
        __esModule: true,
        default: {
          imageGeneration: false,
        },
      }));

      // Re-import the POST handler to use the updated mock
      const { POST } = require('../../app/api/images/route');

      // Create mock request
      const request = createMockRequest({
        context: 'A beautiful sunset over mountains',
      });

      // Execute the handler
      const response = await POST(request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(data).toHaveProperty('message', 'Image generation feature is disabled');

      // Verify that generateImage was not called
      expect(mockGenerateImage).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/images (review image)', () => {
    test('should approve an image', async () => {
      // Create mock request for approval
      const request = createMockRequest({
        image: { id: '123', url: 'https://example.com/image.jpg' },
        action: 'approve',
      });

      // Execute the handler
      const response = await PUT(request as unknown as Request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message', 'Image approved successfully');

      // Verify that approveImage was called with the correct image
      expect(mockApproveImage).toHaveBeenCalledWith({
        image: { id: '123', url: 'https://example.com/image.jpg' },
      });
    });

    test('should reject an image', async () => {
      // Create mock request for rejection
      const request = createMockRequest({
        image: { id: '123', url: 'https://example.com/image.jpg' },
        action: 'reject',
      }) as Request;

      // Execute the handler
      const response = await PUT(request as unknown as Request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message', 'Image rejected successfully');

      // Verify that rejectImage was called with the correct image
      expect(mockRejectImage).toHaveBeenCalledWith({
        image: { id: '123', url: 'https://example.com/image.jpg' },
      });
    });

    test('should regenerate an image', async () => {
      // Create mock request for regeneration
      const request = createMockRequest({
        image: {
          id: '123',
          url: 'https://example.com/image.jpg',
          context: 'A beautiful sunset over mountains',
        },
        action: 'regenerate',
      });

      // Execute the handler
      const response = await PUT(request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('url', 'https://example.com/regenerated-image.jpg');

      // Verify that regenerateImage was called with the correct context
      expect(mockRegenerateImage).toHaveBeenCalledWith({
        context: 'A beautiful sunset over mountains',
      });
    });

    test('should validate action', async () => {
      // Create mock request with invalid action
      const request = createMockRequest({
        image: { id: '123', url: 'https://example.com/image.jpg' },
        action: 'invalid-action',
      });

      // Execute the handler
      const response = await PUT(request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('Invalid action');

      // Verify that no image methods were called
      expect(mockApproveImage).not.toHaveBeenCalled();
      expect(mockRejectImage).not.toHaveBeenCalled();
      expect(mockRegenerateImage).not.toHaveBeenCalled();
    });

    test('should require context for regeneration', async () => {
      // Create mock request missing context for regeneration
      const request = createMockRequest({
        image: { id: '123', url: 'https://example.com/image.jpg' },
        action: 'regenerate',
      });

      // Execute the handler
      const response = await PUT(request);

      // Parse the JSON response
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message', 'Context is required for regeneration');

      // Verify that regenerateImage was not called
      expect(mockRegenerateImage).not.toHaveBeenCalled();
    });
  });
});
