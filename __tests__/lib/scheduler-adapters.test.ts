import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { getAdapter } from '../../lib/scheduler/adapters';
import { platformConfigurations, platforms } from '../../lib/config/platforms';

const originalNodeEnv = process.env.NODE_ENV;
const originalTikTokApiKey = platformConfigurations.tiktok.apiKey;
const originalTikTokPrivacyLevel = process.env.TIKTOK_PRIVACY_LEVEL;
const originalFetch = global.fetch;

function setNodeEnv(value: typeof process.env.NODE_ENV): void {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value,
    configurable: true,
    writable: true,
  });
}

describe('Scheduler platform adapters', () => {
  afterEach(() => {
    setNodeEnv(originalNodeEnv);
    platformConfigurations.tiktok.apiKey = originalTikTokApiKey;
    if (originalTikTokPrivacyLevel === undefined) {
      delete process.env.TIKTOK_PRIVACY_LEVEL;
    } else {
      process.env.TIKTOK_PRIVACY_LEVEL = originalTikTokPrivacyLevel;
    }
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('registers TikTok with video-only publish constraints', () => {
    const adapter = getAdapter('tiktok');

    expect(adapter).toBeDefined();
    expect(adapter?.getMaxLength()).toBe(2200);
    expect(
      adapter?.validateContent({
        text: 'Short video caption',
      })
    ).toEqual(
      expect.objectContaining({
        valid: false,
        errors: expect.arrayContaining(['TikTok posts require a video URL']),
      })
    );
    expect(
      adapter?.validateContent({
        text: 'Short video caption',
        mediaUrls: ['https://cdn.example.com/video.mp4'],
      })
    ).toEqual(
      expect.objectContaining({
        valid: true,
      })
    );
  });

  test('production adapters fail closed when provider credentials are missing', async () => {
    setNodeEnv('production');
    delete process.env.FACEBOOK_API_KEY;

    await expect(
      getAdapter('facebook')?.publish({
        text: 'Production publish should not simulate without credentials',
      })
    ).rejects.toThrow('facebook API key is not configured');
  });

  test('TikTok is excluded from the default text-only content flow', () => {
    const tiktok = platforms.find(platform => platform.slug === 'tiktok');

    expect(tiktok).toEqual(
      expect.objectContaining({
        defaultContentFlow: false,
        requiresMedia: true,
      })
    );
  });

  test('TikTok direct post sends privacy level and returns nested publish ID', async () => {
    setNodeEnv('production');
    process.env.TIKTOK_PRIVACY_LEVEL = 'SELF_ONLY';
    platformConfigurations.tiktok.apiKey = 'tiktok-token';
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          publish_id: 'publish-123',
        },
        error: {
          code: 'ok',
          message: '',
        },
      }),
    } as Response);
    global.fetch = fetchMock;

    const result = await getAdapter('tiktok')?.publish({
      text: 'Video caption',
      mediaUrls: ['https://cdn.example.com/video.mp4'],
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 'publish-123',
        url: 'https://www.tiktok.com/upload?publish_id=publish-123',
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          post_info: {
            title: 'Video caption',
            privacy_level: 'SELF_ONLY',
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: 'https://cdn.example.com/video.mp4',
          },
        }),
      })
    );
  });
});
