/**
 * Analytics Tracker Tests
 *
 * Tests for the client-side analytics tracker including
 * event queuing, batching, flushing, and page view tracking.
 */

import { beforeEach, afterEach, describe, expect, jest, test } from '@jest/globals';

// Mock fetch globally
const mockFetch = jest.fn<() => Promise<Response>>();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock sessionStorage
const sessionStorageData: Record<string, string> = {};
const mockSessionStorage = {
  getItem: jest.fn((key: string) => sessionStorageData[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    sessionStorageData[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete sessionStorageData[key];
  }),
  clear: jest.fn(() => {
    Object.keys(sessionStorageData).forEach(key => delete sessionStorageData[key]);
  }),
  length: 0,
  key: jest.fn(() => null),
};

Object.defineProperty(global, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Mock window.location and document
Object.defineProperty(global, 'window', {
  value: {
    location: {
      pathname: '/dashboard',
      search: '',
      href: 'http://localhost:3000/dashboard',
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(global, 'document', {
  value: {
    referrer: 'https://google.com',
    title: 'OmniPost Dashboard',
  },
  writable: true,
});

describe('Analytics Tracker', () => {
  let tracker: { track: Function; flush: Function; pageView: Function; identify: Function; destroy: Function };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, received: 1 }),
    } as Response);

    // Clear session storage
    Object.keys(sessionStorageData).forEach(key => delete sessionStorageData[key]);

    // Re-import to get a fresh instance
    jest.resetModules();
    const mod = require('../../lib/analytics/tracker');
    tracker = mod.tracker;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('track() queues events with correct properties', () => {
    tracker.track('signup_completed', { method: 'email' });

    // Event is queued but not yet sent (queue size < BATCH_SIZE of 10)
    expect(mockFetch).not.toHaveBeenCalled();

    // Flush to verify the event structure
    tracker.flush();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0] as unknown[];
    const body = JSON.parse((callArgs[1] as RequestInit).body as string);

    expect(body.events).toHaveLength(1);
    expect(body.events[0].name).toBe('signup_completed');
    expect(body.events[0].properties.method).toBe('email');
  });

  test('track() includes sessionId and timestamp', () => {
    tracker.track('page_viewed', {});
    tracker.flush();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0] as unknown[];
    const body = JSON.parse((callArgs[1] as RequestInit).body as string);

    const props = body.events[0].properties;
    expect(props.sessionId).toBeDefined();
    expect(typeof props.sessionId).toBe('string');
    expect(props.timestamp).toBeDefined();
    expect(typeof props.timestamp).toBe('string');
    // Timestamp should be a valid ISO string
    expect(new Date(props.timestamp).toISOString()).toBe(props.timestamp);
  });

  test('flush() sends batched events to API', async () => {
    tracker.track('event_1', { key: 'a' });
    tracker.track('event_2', { key: 'b' });
    tracker.track('event_3', { key: 'c' });

    await tracker.flush();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0] as unknown[];

    expect(callArgs[0]).toBe('/api/analytics/events');

    const init = callArgs[1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.keepalive).toBe(true);

    const body = JSON.parse(init.body as string);
    expect(body.events).toHaveLength(3);
    expect(body.events[0].name).toBe('event_1');
    expect(body.events[1].name).toBe('event_2');
    expect(body.events[2].name).toBe('event_3');
  });

  test('flush() re-queues events on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    tracker.track('important_event', { data: 'test' });

    await tracker.flush();

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // The event should be re-queued. Flushing again should re-send it.
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    await tracker.flush();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const callArgs = mockFetch.mock.calls[1] as unknown[];
    const body = JSON.parse((callArgs[1] as RequestInit).body as string);
    expect(body.events).toHaveLength(1);
    expect(body.events[0].name).toBe('important_event');
  });

  test('pageView() captures URL and referrer', () => {
    tracker.pageView();
    tracker.flush();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0] as unknown[];
    const body = JSON.parse((callArgs[1] as RequestInit).body as string);

    const event = body.events[0];
    expect(event.name).toBe('page_viewed');
    expect(event.properties.url).toBe('/dashboard');
    expect(event.properties.referrer).toBe('https://google.com');
    expect(event.properties.title).toBe('OmniPost Dashboard');
  });
});
