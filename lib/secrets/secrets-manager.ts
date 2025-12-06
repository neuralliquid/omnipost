/**
 * Secrets Manager
 * Provides a unified interface for accessing secrets from various sources
 * Supports: Environment variables, Azure Key Vault (when configured), local development
 */

/**
 * Secret source types
 */
export type SecretSource = 'env' | 'azure-keyvault' | 'local';

/**
 * Secret metadata
 */
export interface SecretMetadata {
  name: string;
  source: SecretSource;
  lastAccessed?: Date;
  expiresAt?: Date;
}

/**
 * Secret value with metadata
 */
export interface Secret {
  value: string;
  metadata: SecretMetadata;
}

/**
 * Secrets configuration
 */
export interface SecretsConfig {
  /**
   * Enable Azure Key Vault integration
   */
  useKeyVault: boolean;

  /**
   * Azure Key Vault URL (required if useKeyVault is true)
   */
  keyVaultUrl?: string;

  /**
   * Cache secrets in memory (default: true for performance)
   */
  cacheSecrets: boolean;

  /**
   * Cache TTL in milliseconds (default: 5 minutes)
   */
  cacheTtlMs: number;

  /**
   * Prefix for environment variable lookups
   */
  envPrefix?: string;
}

/**
 * Default configuration
 */
const defaultConfig: SecretsConfig = {
  useKeyVault: false,
  cacheSecrets: true,
  cacheTtlMs: 5 * 60 * 1000, // 5 minutes
  envPrefix: '',
};

/**
 * Secret cache entry
 */
interface CacheEntry {
  secret: Secret;
  cachedAt: number;
}

/**
 * Secrets Manager class
 */
class SecretsManager {
  private config: SecretsConfig;
  private readonly cache: Map<string, CacheEntry> = new Map();
  private readonly requiredSecrets: Set<string> = new Set();

  constructor(config: Partial<SecretsConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Configure the secrets manager
   */
  configure(config: Partial<SecretsConfig>): void {
    this.config = { ...this.config, ...config };
    // Clear cache when configuration changes
    this.cache.clear();
  }

  /**
   * Register a required secret for validation
   */
  registerRequired(name: string): void {
    this.requiredSecrets.add(name);
  }

  /**
   * Register multiple required secrets
   */
  registerRequiredSecrets(names: string[]): void {
    names.forEach(name => this.requiredSecrets.add(name));
  }

  /**
   * Get a secret value
   * @param name The secret name
   * @param required Whether to throw if secret is not found (default: false)
   */
  async get(name: string, required: boolean = false): Promise<string | undefined> {
    const secret = await this.getSecret(name);

    if (!secret && required) {
      throw new Error(`Required secret '${name}' not found`);
    }

    return secret?.value;
  }

  /**
   * Get a secret with metadata
   */
  async getSecret(name: string): Promise<Secret | undefined> {
    // Check cache first
    if (this.config.cacheSecrets) {
      const cached = this.getCachedSecret(name);
      if (cached) {
        return cached;
      }
    }

    // Try to fetch from configured sources
    let secret: Secret | undefined;

    // Try Azure Key Vault if configured
    if (this.config.useKeyVault && this.config.keyVaultUrl) {
      secret = await this.getFromKeyVault(name);
    }

    // Fall back to environment variable
    secret ??= this.getFromEnv(name);

    // Cache the secret
    if (secret && this.config.cacheSecrets) {
      this.cacheSecret(name, secret);
    }

    return secret;
  }

  /**
   * Get secret from environment variable
   */
  private getFromEnv(name: string): Secret | undefined {
    const envName = this.config.envPrefix ? `${this.config.envPrefix}${name}` : name;
    const value = process.env[envName];

    if (value === undefined) {
      return undefined;
    }

    return {
      value,
      metadata: {
        name,
        source: 'env',
        lastAccessed: new Date(),
      },
    };
  }

  /**
   * Get secret from Azure Key Vault
   * Note: Requires @azure/identity and @azure/keyvault-secrets packages to be installed
   * Install with: npm install @azure/identity @azure/keyvault-secrets
   */
  private async getFromKeyVault(name: string): Promise<Secret | undefined> {
    // Check if Azure SDK is available via dynamic import
    try {
      // Dynamic import to avoid requiring Azure SDK if not using Key Vault
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const identityModule = await import('@azure/identity' as any).catch(() => null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const secretsModule = await import('@azure/keyvault-secrets' as any).catch(() => null);

      if (!identityModule || !secretsModule) {
        console.warn(
          'Azure SDK packages not installed. Install with: npm install @azure/identity @azure/keyvault-secrets'
        );
        return undefined;
      }

      const { DefaultAzureCredential } = identityModule;
      const { SecretClient } = secretsModule;

      const credential = new DefaultAzureCredential();
      const client = new SecretClient(this.config.keyVaultUrl!, credential);

      // Key Vault uses dashes instead of underscores
      const keyVaultName = name.replaceAll('_', '-').toLowerCase();

      const secret = await client.getSecret(keyVaultName);

      return {
        value: secret.value || '',
        metadata: {
          name,
          source: 'azure-keyvault',
          lastAccessed: new Date(),
          expiresAt: secret.properties.expiresOn,
        },
      };
    } catch (error) {
      // Log in development mode only
      if (process.env.NODE_ENV === 'development') {
        console.debug(`Key Vault lookup failed for '${name}':`, error);
      }
      return undefined;
    }
  }

  /**
   * Cache a secret
   */
  private cacheSecret(name: string, secret: Secret): void {
    this.cache.set(name, {
      secret,
      cachedAt: Date.now(),
    });
  }

  /**
   * Get cached secret if valid
   */
  private getCachedSecret(name: string): Secret | undefined {
    const entry = this.cache.get(name);

    if (!entry) {
      return undefined;
    }

    // Check if cache is expired
    if (Date.now() - entry.cachedAt > this.config.cacheTtlMs) {
      this.cache.delete(name);
      return undefined;
    }

    // Update last accessed time
    entry.secret.metadata.lastAccessed = new Date();
    return entry.secret;
  }

  /**
   * Clear the secret cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Validate that all required secrets are available
   * @returns Array of missing secret names
   */
  async validateRequired(): Promise<string[]> {
    const missing: string[] = [];

    for (const name of this.requiredSecrets) {
      const secret = await this.getSecret(name);
      if (!secret) {
        missing.push(name);
      }
    }

    return missing;
  }

  /**
   * Check if a secret exists without retrieving its value
   */
  async exists(name: string): Promise<boolean> {
    const secret = await this.getSecret(name);
    return secret !== undefined;
  }

  /**
   * Get multiple secrets at once
   */
  async getMany(names: string[]): Promise<Map<string, string | undefined>> {
    const results = new Map<string, string | undefined>();

    // Fetch all in parallel
    const promises = names.map(async name => {
      const value = await this.get(name);
      results.set(name, value);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Redact a secret value for logging
   */
  redact(value: string | undefined, showLength: number = 4): string {
    if (!value) {
      return '[empty]';
    }

    if (value.length <= showLength * 2) {
      return '*'.repeat(value.length);
    }

    const start = value.substring(0, showLength);
    const end = value.substring(value.length - showLength);
    const middle = '*'.repeat(Math.min(value.length - showLength * 2, 8));

    return `${start}${middle}${end}`;
  }

  /**
   * Get configuration info (for debugging, without exposing secrets)
   */
  getInfo(): {
    useKeyVault: boolean;
    cacheEnabled: boolean;
    cacheTtlMs: number;
    cachedSecretCount: number;
    requiredSecretCount: number;
  } {
    return {
      useKeyVault: this.config.useKeyVault,
      cacheEnabled: this.config.cacheSecrets,
      cacheTtlMs: this.config.cacheTtlMs,
      cachedSecretCount: this.cache.size,
      requiredSecretCount: this.requiredSecrets.size,
    };
  }
}

// Singleton instance
export const secretsManager = new SecretsManager();

// Register commonly used secrets
secretsManager.registerRequiredSecrets(['JWT_SECRET', 'NEXT_PUBLIC_API_URL']);

// Convenience exports
export async function getSecret(name: string, required?: boolean): Promise<string | undefined> {
  return secretsManager.get(name, required);
}

export async function getRequiredSecret(name: string): Promise<string> {
  const value = await secretsManager.get(name, true);
  return value!;
}

export default secretsManager;
