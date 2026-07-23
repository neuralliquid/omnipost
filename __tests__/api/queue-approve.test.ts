import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '../setup';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPublish = jest.fn<any>();

jest.mock('../../lib/scheduler', () => ({
  getPublisher: () => ({
    publish: mockPublish,
  }),
}));

jest.mock('../../lib/featureFlags', () => ({
  __esModule: true,
  default: {
    platformConnectors: true,
  },
}));

jest.mock('../../app/api/_utils/audit', () => ({
  createLogEntry: jest.fn(() => ({})),
  logToAuditTrail: jest.fn(),
}));

let POST: (req: Request) => Promise<Response>;

function createRequest(body: Record<string, unknown>): Request {
  return {
    method: 'POST',
    url: 'http://localhost:3000/api/queue/approve',
    headers: {
      get: (name: string) => {
        if (name === 'content-type') return 'application/json';
        return null;
      },
    },
    json: async () => body,
  } as unknown as Request;
}

describe('Queue approval API', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    jest.doMock('../../lib/scheduler', () => ({
      getPublisher: () => ({
        publish: mockPublish,
      }),
    }));

    const mod = await import('../../app/api/queue/approve/route');
    POST = mod.POST;
  });

  test('publishes queue items through the scheduler publisher', async () => {
    mockPublish.mockResolvedValueOnce({
      success: true,
      result: {
        id: 'fb-post-1',
        url: 'https://www.facebook.com/posts/fb-post-1',
      },
      duration: 42,
      rateLimited: false,
    });

    const response = await POST(
      createRequest({
        queue: [
          {
            platform: { id: 1, name: 'Facebook' },
            content: {
              id: 'content-1',
              title: 'Launch note',
              mediaUrls: ['https://cdn.example.com/post.png'],
              hashtags: ['launch'],
            },
          },
        ],
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Queue approved and published successfully');
    expect(data.results.success[0]).toEqual(
      expect.objectContaining({
        platformPostId: 'fb-post-1',
        publishedUrl: 'https://www.facebook.com/posts/fb-post-1',
      })
    );
    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'standalone',
        contentId: 'content-1',
        platformId: 'facebook',
        content: {
          text: 'Launch note',
          mediaUrls: ['https://cdn.example.com/post.png'],
          hashtags: ['launch'],
        },
      })
    );
  });

  test('returns failed results from scheduler publisher errors', async () => {
    mockPublish.mockResolvedValueOnce({
      success: false,
      error: { message: 'Content validation failed: Instagram posts require at least one image' },
      duration: 10,
      rateLimited: false,
    });

    const response = await POST(
      createRequest({
        queue: [
          {
            platform: { id: 2, name: 'Instagram' },
            content: { id: 'content-2', description: 'Caption without media' },
          },
        ],
      })
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('All publishing attempts failed');
    expect(data.results.failed[0].error).toBe(
      'Content validation failed: Instagram posts require at least one image'
    );
  });

  test('rejects items without publishable text', async () => {
    const response = await POST(
      createRequest({
        queue: [
          {
            platform: { id: 1, name: 'Facebook' },
            content: { id: 'content-3' },
          },
        ],
      })
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.results.failed[0].error).toBe('Content text is required');
    expect(mockPublish).not.toHaveBeenCalled();
  });
});
