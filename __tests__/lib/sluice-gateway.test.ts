/**
 * Sluice AI Gateway Client Tests
 *
 * Tests for the gateway client including feature flag checks,
 * URL validation, authentication headers, and error handling.
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';

// Mock fetch globally
const mockFetch = jest.fn<() => Promise<Response>>();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock AbortController
const mockAbort = jest.fn();
global.AbortController = jest.fn(() => ({
  signal: { aborted: false },
  abort: mockAbort,
})) as unknown as typeof AbortController;

// Mock feature flags - start with gateway disabled
let mockFeatureFlags: Record<string, unknown> = {
  aiGateway: { enabled: false },
};

jest.mock('../../lib/featureFlags', () => ({
  __esModule: true,
  get default() {
    return mockFeatureFlags;
  },
}));

describe('Sluice Gateway Client', () => {
  let isGatewayEnabled: () => boolean;
  let gatewayPost: Function;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset env vars
    delete process.env.SLUICE_GATEWAY_URL;
    delete process.env.SLUICE_API_KEY;

    // Reset feature flags to disabled
    mockFeatureFlags = { aiGateway: { enabled: false } };

    // Re-import module to pick up new flag state
    jest.resetModules();
    const mod = require('../../lib/clients/sluice-gateway');
    isGatewayEnabled = mod.isGatewayEnabled;
    gatewayPost = mod.gatewayPost;
  });

  describe('isGatewayEnabled()', () => {
    test('returns false when feature flag is disabled', () => {
      mockFeatureFlags = { aiGateway: { enabled: false } };
      jest.resetModules();
      const mod = require('../../lib/clients/sluice-gateway');

      expect(mod.isGatewayEnabled()).toBe(false);
    });

    test('returns false when SLUICE_GATEWAY_URL is not set', () => {
      mockFeatureFlags = { aiGateway: { enabled: true } };
      delete process.env.SLUICE_GATEWAY_URL;
      jest.resetModules();
      const mod = require('../../lib/clients/sluice-gateway');

      expect(mod.isGatewayEnabled()).toBe(false);
    });

    test('returns true when flag is enabled and URL is set', () => {
      mockFeatureFlags = { aiGateway: { enabled: true } };
      process.env.SLUICE_GATEWAY_URL = 'https://gateway.example.com';
      jest.resetModules();
      const mod = require('../../lib/clients/sluice-gateway');

      expect(mod.isGatewayEnabled()).toBe(true);
    });
  });

  describe('gatewayPost()', () => {
    test('returns 503 when gateway is not configured', async () => {
      mockFeatureFlags = { aiGateway: { enabled: false } };
      jest.resetModules();
      const mod = require('../../lib/clients/sluice-gateway');

      const result = await mod.gatewayPost('/v1/responses', { model: 'gpt-4' });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(503);
      expect(result.error).toContain('not configured');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('validates URL format', async () => {
      mockFeatureFlags = { aiGateway: { enabled: true } };
      process.env.SLUICE_GATEWAY_URL = 'not-a-valid-url';
      process.env.SLUICE_API_KEY = 'test-key';
      jest.resetModules();
      const mod = require('../../lib/clients/sluice-gateway');

      const result = await mod.gatewayPost('/v1/responses', { model: 'gpt-4' });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(502);
      expect(result.error).toContain('Invalid gateway URL');
    });

    test('sends correct headers including Authorization', async () => {
      mockFeatureFlags = { aiGateway: { enabled: true } };
      process.env.SLUICE_GATEWAY_URL = 'https://gateway.example.com';
      process.env.SLUICE_API_KEY = 'test-api-key-123';
      jest.resetModules();
      const mod = require('../../lib/clients/sluice-gateway');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ choices: [] }),
        headers: new Headers(),
      } as unknown as Response);

      await mod.gatewayPost('/v1/responses', { model: 'gpt-4' }, { operation: 'test-op' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0] as unknown[];
      const init = callArgs[1] as RequestInit;
      const headers = init.headers as Record<string, string>;

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Authorization']).toBe('Bearer test-api-key-123');
      expect(headers['X-Sluice-Operation']).toBe('test-op');
    });

    test('handles timeout via AbortController', async () => {
      mockFeatureFlags = { aiGateway: { enabled: true } };
      process.env.SLUICE_GATEWAY_URL = 'https://gateway.example.com';
      process.env.SLUICE_API_KEY = 'key';
      jest.resetModules();
      const mod = require('../../lib/clients/sluice-gateway');

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await mod.gatewayPost('/v1/responses', { model: 'gpt-4' }, { timeoutMs: 5000 });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(408);
      expect(result.error).toContain('timed out');
    });

    test('handles network error', async () => {
      mockFeatureFlags = { aiGateway: { enabled: true } };
      process.env.SLUICE_GATEWAY_URL = 'https://gateway.example.com';
      process.env.SLUICE_API_KEY = 'key';
      jest.resetModules();
      const mod = require('../../lib/clients/sluice-gateway');

      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      const result = await mod.gatewayPost('/v1/responses', { model: 'gpt-4' });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(502);
      expect(result.error).toBe('Network request failed');
    });
  });
});
