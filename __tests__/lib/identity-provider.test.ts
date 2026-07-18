function createUnsignedJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.`;
}

function createJsonResponse(body: Record<string, unknown>, status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('Mystira Identity OIDC callback handling', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    Object.defineProperty(globalThis.AbortSignal, 'timeout', {
      configurable: true,
      value: jest.fn(() => undefined),
    });
    process.env = {
      ...originalEnv,
      MYSTIRA_IDENTITY_ENABLED: 'true',
      MYSTIRA_IDENTITY_ISSUER_URL: 'https://identity.example.test',
      MYSTIRA_IDENTITY_CLIENT_ID: 'omnipost-client',
      MYSTIRA_IDENTITY_CLIENT_SECRET: 'secret',
      MYSTIRA_IDENTITY_PROVIDER_ID: 'mystira',
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  it('falls back to id_token claims when userinfo rejects the access token', async () => {
    const idToken = createUnsignedJwt({
      sub: 'mystira-user-1',
      email: 'user@mystira.app',
      name: 'Mystira User',
    });
    const fetchMock = jest.fn(async input => {
      const url = String(input);

      if (url.endsWith('/.well-known/openid-configuration')) {
        return createJsonResponse(
          {
            authorization_endpoint: 'https://identity.example.test/connect/authorize',
            token_endpoint: 'https://identity.example.test/connect/token',
            userinfo_endpoint: 'https://identity.example.test/connect/userinfo',
          },
          200
        );
      }

      if (url.endsWith('/connect/token')) {
        return createJsonResponse(
          {
            access_token: 'access-token-without-userinfo-sub',
            id_token: idToken,
          },
          200
        );
      }

      if (url.endsWith('/connect/userinfo')) {
        return createJsonResponse({ error: 'invalid_token' }, 401);
      }

      return createJsonResponse({}, 404);
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const { clearProvidersCache, handleAuthCallback } =
      await import('@/lib/auth/identity-provider');
    clearProvidersCache();

    const result = await handleAuthCallback(
      'mystira',
      'authorization-code',
      'https://omnipost.neuralliquid.ai/api/auth/callback/mystira',
      'pkce-verifier'
    );

    expect(result).toMatchObject({
      success: true,
      user: {
        externalId: 'mystira-user-1',
        email: 'user@mystira.app',
        name: 'Mystira User',
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://identity.example.test/connect/userinfo',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer access-token-without-userinfo-sub',
        },
      })
    );
  });
});
