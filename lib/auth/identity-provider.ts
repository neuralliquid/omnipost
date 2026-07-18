/**
 * External Identity Provider Abstraction
 *
 * Provides an abstraction layer for integrating with external identity
 * providers (OAuth, SAML, OIDC). Calls an external identity API server
 * to discover available providers, initiate auth flows, and handle
 * callbacks.
 *
 * Falls back gracefully to email/password-only auth when the external
 * API is unavailable or the feature flag is disabled.
 */

import featureFlags from '../featureFlags';
import { createHash } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IdentityProviderConfig {
  /** Base URL of the external identity API */
  apiUrl: string;
  /** API key for authenticating with the identity service */
  apiKey: string;
}

interface OidcConfig {
  enabled: boolean;
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  providerId: string;
  providerName: string;
  scope: string;
}

interface OidcDiscoveryDocument {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
}

export interface AuthProvider {
  /** Provider identifier, e.g. 'google', 'github', 'microsoft', 'saml' */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Whether this provider is currently enabled */
  enabled: boolean;
  /** Icon identifier for UI rendering */
  icon?: string;
  /** Authentication protocol */
  type: 'oauth' | 'saml' | 'oidc';
}

export interface ExternalAuthResult {
  success: boolean;
  user?: {
    externalId: string;
    email: string;
    name: string;
    avatar?: string;
    provider: string;
  };
  token?: string;
  error?: string;
}

export interface ExternalAuthRedirect {
  /** The URL the client should redirect to for authentication */
  redirectUrl: string;
}

export interface LinkAccountResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let providersCache: CacheEntry<AuthProvider[]> | null = null;
let oidcDiscoveryCache: CacheEntry<OidcDiscoveryDocument> | null = null;

// ---------------------------------------------------------------------------
// Configuration helpers
// ---------------------------------------------------------------------------

function getConfig(): IdentityProviderConfig | null {
  const flag = featureFlags.externalIdentityProvider as
    | { enabled: boolean; apiUrl?: string }
    | undefined;
  const apiUrl = flag?.apiUrl || process.env.IDENTITY_API_URL;
  const apiKey = process.env.IDENTITY_API_KEY;
  const envEnabled = process.env.EXTERNAL_IDENTITY_PROVIDER_ENABLED === 'true';

  if (!flag?.enabled && !envEnabled) {
    return null;
  }

  if (!apiUrl || !apiKey) {
    return null;
  }

  return { apiUrl, apiKey };
}

function getOidcConfig(): OidcConfig | null {
  const issuerUrl = process.env.MYSTIRA_IDENTITY_ISSUER_URL;
  const clientId = process.env.MYSTIRA_IDENTITY_CLIENT_ID;
  const clientSecret = process.env.MYSTIRA_IDENTITY_CLIENT_SECRET;
  const enabled = process.env.MYSTIRA_IDENTITY_ENABLED === 'true';

  if (!enabled || !issuerUrl || !clientId || !clientSecret) {
    return null;
  }

  return {
    enabled,
    issuerUrl: issuerUrl.replace(/\/+$/, ''),
    clientId,
    clientSecret,
    providerId: process.env.MYSTIRA_IDENTITY_PROVIDER_ID || 'mystira',
    providerName: process.env.MYSTIRA_IDENTITY_PROVIDER_NAME || 'Mystira Identity',
    scope: process.env.MYSTIRA_IDENTITY_SCOPE || 'openid profile email',
  };
}

async function getOidcDiscovery(config: OidcConfig): Promise<OidcDiscoveryDocument | null> {
  if (oidcDiscoveryCache && Date.now() < oidcDiscoveryCache.expiresAt) {
    return oidcDiscoveryCache.data;
  }

  try {
    const response = await fetch(`${config.issuerUrl}/.well-known/openid-configuration`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`[IdentityProvider] OIDC discovery returned ${response.status}`);
      return null;
    }

    const data = (await response.json()) as Partial<OidcDiscoveryDocument>;
    if (!data.authorization_endpoint || !data.token_endpoint) {
      console.warn('[IdentityProvider] OIDC discovery document is missing required endpoints');
      return null;
    }

    const discovery = {
      authorization_endpoint: data.authorization_endpoint,
      token_endpoint: data.token_endpoint,
      userinfo_endpoint: data.userinfo_endpoint,
    };

    oidcDiscoveryCache = {
      data: discovery,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return discovery;
  } catch (error) {
    console.warn('[IdentityProvider] Failed to discover OIDC metadata', error);
    return null;
  }
}

/**
 * Default provider list returned when external identity API is unavailable.
 * This ensures email/password auth always works.
 */
const EMAIL_ONLY_PROVIDERS: AuthProvider[] = [];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches available authentication providers from the external identity API.
 *
 * Results are cached for 5 minutes to reduce load on the external service.
 * Falls back to an empty list (email/password only) when:
 *   - The feature flag is disabled
 *   - Environment variables are not configured
 *   - The external API is unreachable
 */
export async function getAvailableProviders(): Promise<AuthProvider[]> {
  // Check cache first
  if (providersCache && Date.now() < providersCache.expiresAt) {
    return providersCache.data;
  }

  const oidcConfig = getOidcConfig();
  if (oidcConfig) {
    const discovery = await getOidcDiscovery(oidcConfig);
    if (discovery) {
      const providers = [
        {
          id: oidcConfig.providerId,
          name: oidcConfig.providerName,
          enabled: true,
          type: 'oidc' as const,
        },
      ];

      providersCache = {
        data: providers,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };

      return providers;
    }
  }

  const config = getConfig();
  if (!config) {
    return EMAIL_ONLY_PROVIDERS;
  }

  try {
    const response = await fetch(`${config.apiUrl}/providers`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(
        `[IdentityProvider] External API returned ${response.status} — falling back to email/password`
      );
      return EMAIL_ONLY_PROVIDERS;
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      console.warn('[IdentityProvider] Unexpected response shape — falling back to email/password');
      return EMAIL_ONLY_PROVIDERS;
    }

    const providers = (data as Array<Record<string, unknown>>).map(item => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
      enabled: Boolean(item.enabled),
      icon: item.icon ? String(item.icon) : undefined,
      type: validateProviderType(item.type),
    }));

    // Cache the result
    providersCache = {
      data: providers,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return providers;
  } catch (error) {
    console.warn(
      '[IdentityProvider] Failed to reach external API — falling back to email/password',
      error
    );
    return EMAIL_ONLY_PROVIDERS;
  }
}

/**
 * Initiates an external authentication flow by requesting a redirect URL
 * from the identity API.
 *
 * @param providerId - The provider to authenticate with (e.g. 'google')
 * @param redirectUrl - The URL to redirect back to after authentication
 * @returns The redirect URL or null if the service is unavailable
 */
export async function initiateExternalAuth(
  providerId: string,
  redirectUrl: string,
  state?: string,
  codeChallenge?: string
): Promise<ExternalAuthRedirect | null> {
  const oidcConfig = getOidcConfig();
  if (oidcConfig && providerId === oidcConfig.providerId) {
    const discovery = await getOidcDiscovery(oidcConfig);
    if (!discovery) {
      return null;
    }

    const authUrl = new URL(discovery.authorization_endpoint);
    authUrl.searchParams.set('client_id', oidcConfig.clientId);
    authUrl.searchParams.set('redirect_uri', redirectUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', oidcConfig.scope);
    if (state) {
      authUrl.searchParams.set('state', state);
    }
    if (codeChallenge) {
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
    }

    return { redirectUrl: authUrl.toString() };
  }

  const config = getConfig();
  if (!config) {
    return null;
  }

  try {
    const response = await fetch(`${config.apiUrl}/auth/initiate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ providerId, redirectUrl }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(
        `[IdentityProvider] Failed to initiate auth for provider "${providerId}": ${response.status}`
      );
      return null;
    }

    const data: unknown = await response.json();
    const result = data as Record<string, unknown>;

    if (!result.redirectUrl || typeof result.redirectUrl !== 'string') {
      console.error('[IdentityProvider] Missing redirectUrl in initiate response');
      return null;
    }

    return { redirectUrl: result.redirectUrl };
  } catch (error) {
    console.error('[IdentityProvider] Error initiating external auth:', error);
    return null;
  }
}

/**
 * Exchanges an authorization code with the external identity API for user
 * information.
 *
 * @param providerId - The provider that issued the code
 * @param code - The authorization code from the OAuth callback
 * @returns The authentication result with user info, or a failure result
 */
export async function handleAuthCallback(
  providerId: string,
  code: string,
  redirectUrl?: string,
  codeVerifier?: string
): Promise<ExternalAuthResult> {
  const oidcConfig = getOidcConfig();
  if (oidcConfig && providerId === oidcConfig.providerId) {
    if (!redirectUrl) {
      return { success: false, error: 'Missing redirect URL for OIDC callback' };
    }
    if (!codeVerifier) {
      return { success: false, error: 'Missing PKCE verifier for OIDC callback' };
    }

    const discovery = await getOidcDiscovery(oidcConfig);
    if (!discovery) {
      return { success: false, error: 'Mystira Identity metadata is unavailable' };
    }

    try {
      const tokenBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUrl,
        client_id: oidcConfig.clientId,
        client_secret: oidcConfig.clientSecret,
        code_verifier: codeVerifier,
      });

      const tokenResponse = await fetch(discovery.token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenBody.toString(),
        signal: AbortSignal.timeout(10000),
      });

      if (!tokenResponse.ok) {
        return { success: false, error: 'Mystira Identity token exchange failed' };
      }

      const tokenData = (await tokenResponse.json()) as Record<string, unknown>;
      const accessToken =
        typeof tokenData.access_token === 'string' ? tokenData.access_token : null;
      const idToken = typeof tokenData.id_token === 'string' ? tokenData.id_token : null;

      const userInfoClaims =
        accessToken && discovery.userinfo_endpoint
          ? await fetchUserInfo(discovery.userinfo_endpoint, accessToken)
          : null;
      const claims = userInfoClaims ?? decodeJwtPayload(idToken);

      if (!claims) {
        return { success: false, error: 'Mystira Identity did not return user claims' };
      }

      const externalId = stringClaim(claims, 'sub');
      if (!externalId) {
        return { success: false, error: 'Mystira Identity response is missing subject' };
      }

      const email =
        stringClaim(claims, 'email') || `${stableSubjectAlias(externalId)}@identity.mystira.app`;
      const name =
        stringClaim(claims, 'name') ||
        stringClaim(claims, 'preferred_username') ||
        stringClaim(claims, 'given_name') ||
        email.split('@')[0] ||
        'Mystira User';

      return {
        success: true,
        user: {
          externalId,
          email,
          name,
          avatar: stringClaim(claims, 'picture') ?? undefined,
          provider: providerId,
        },
        token: idToken ?? undefined,
      };
    } catch (error) {
      console.error('[IdentityProvider] Error handling Mystira Identity callback:', error);
      return { success: false, error: 'Failed to communicate with Mystira Identity' };
    }
  }

  const config = getConfig();
  if (!config) {
    return { success: false, error: 'External identity provider is not configured' };
  }

  try {
    const response = await fetch(`${config.apiUrl}/auth/callback`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ providerId, code }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorBody: unknown = await response.json().catch(() => null);
      const errorMessage =
        (errorBody as Record<string, unknown> | null)?.error ?? 'Authentication failed';
      return { success: false, error: String(errorMessage) };
    }

    const data: unknown = await response.json();
    const result = data as Record<string, unknown>;

    if (!result.user || typeof result.user !== 'object') {
      return { success: false, error: 'Invalid response from identity provider' };
    }

    const user = result.user as Record<string, unknown>;

    return {
      success: true,
      user: {
        externalId: String(user.externalId ?? ''),
        email: String(user.email ?? ''),
        name: String(user.name ?? ''),
        avatar: user.avatar ? String(user.avatar) : undefined,
        provider: providerId,
      },
      token: result.token ? String(result.token) : undefined,
    };
  } catch (error) {
    console.error('[IdentityProvider] Error handling auth callback:', error);
    return { success: false, error: 'Failed to communicate with identity provider' };
  }
}

/**
 * Links an external identity to a local user account.
 *
 * @param userId - The local user ID
 * @param providerId - The external provider ID (e.g. 'google')
 * @param externalId - The user's ID in the external provider
 * @returns Success/failure result
 */
export async function linkExternalAccount(
  userId: string,
  providerId: string,
  externalId: string
): Promise<LinkAccountResult> {
  const config = getConfig();
  if (!config) {
    return { success: false, error: 'External identity provider is not configured' };
  }

  try {
    const response = await fetch(`${config.apiUrl}/accounts/link`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, providerId, externalId }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorBody: unknown = await response.json().catch(() => null);
      const errorMessage =
        (errorBody as Record<string, unknown> | null)?.error ?? 'Failed to link account';
      return { success: false, error: String(errorMessage) };
    }

    return { success: true };
  } catch (error) {
    console.error('[IdentityProvider] Error linking external account:', error);
    return { success: false, error: 'Failed to communicate with identity provider' };
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function validateProviderType(value: unknown): 'oauth' | 'saml' | 'oidc' {
  if (value === 'oauth' || value === 'saml' || value === 'oidc') {
    return value;
  }
  return 'oauth'; // default
}

async function fetchUserInfo(
  userInfoEndpoint: string,
  accessToken: string
): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(userInfoEndpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string | null): Record<string, unknown> | null {
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
    return JSON.parse(Buffer.from(paddedPayload, 'base64').toString('utf8')) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

function stringClaim(claims: Record<string, unknown>, key: string): string | null {
  const value = claims[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function stableSubjectAlias(subject: string): string {
  return createHash('sha256').update(subject).digest('hex').slice(0, 16);
}

/**
 * Clears the providers cache. Useful for testing or when configuration changes.
 */
export function clearProvidersCache(): void {
  providersCache = null;
  oidcDiscoveryCache = null;
}
