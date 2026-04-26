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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IdentityProviderConfig {
  /** Base URL of the external identity API */
  apiUrl: string;
  /** API key for authenticating with the identity service */
  apiKey: string;
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

// ---------------------------------------------------------------------------
// Configuration helpers
// ---------------------------------------------------------------------------

function getConfig(): IdentityProviderConfig | null {
  const flag = featureFlags.externalIdentityProvider as
    | { enabled: boolean; apiUrl?: string }
    | undefined;

  if (!flag?.enabled) {
    return null;
  }

  const apiUrl = flag.apiUrl || process.env.IDENTITY_API_URL;
  const apiKey = process.env.IDENTITY_API_KEY;

  if (!apiUrl || !apiKey) {
    return null;
  }

  return { apiUrl, apiKey };
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
  redirectUrl: string
): Promise<ExternalAuthRedirect | null> {
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
  code: string
): Promise<ExternalAuthResult> {
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

/**
 * Clears the providers cache. Useful for testing or when configuration changes.
 */
export function clearProvidersCache(): void {
  providersCache = null;
}
