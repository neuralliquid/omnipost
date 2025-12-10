/**
 * LinkedIn Prospecting Integration
 * Handles LinkedIn Sales Navigator integration for lead prospecting
 */

import type { Lead, CreateLeadInput } from '../../types/lead';

/**
 * LinkedIn API configuration
 */
export interface LinkedInConfig {
  accessToken: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * LinkedIn search parameters
 */
export interface LinkedInSearchParams {
  keywords?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  industry?: string;
  location?: string;
  connectionDegree?: 1 | 2 | 3;
  limit?: number;
  offset?: number;
}

/**
 * LinkedIn profile from API response
 */
export interface LinkedInAPIProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  summary?: string;
  profilePicture?: string;
  vanityName?: string;
  location?: {
    country?: string;
    city?: string;
  };
  positions?: Array<{
    title: string;
    companyName: string;
    startDate?: { month?: number; year?: number };
    endDate?: { month?: number; year?: number };
    isCurrent?: boolean;
  }>;
  education?: Array<{
    schoolName: string;
    degree?: string;
    fieldOfStudy?: string;
  }>;
  skills?: string[];
  connections?: number;
}

/**
 * LinkedIn search result
 */
export interface LinkedInSearchResult {
  profiles: LinkedInAPIProfile[];
  total: number;
  hasMore: boolean;
}

/**
 * OAuth token response
 */
export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

/**
 * LinkedIn Prospecting Client
 */
export class LinkedInProspectingClient {
  private config: LinkedInConfig | null = null;
  private apiBaseUrl = 'https://api.linkedin.com/v2';
  /**
   * Separate token storage to avoid mutating the config object passed to initialize()
   */
  private _accessToken: string | null = null;

  /**
   * Initialize with OAuth credentials.
   * Note: The config object is stored by reference but will not be mutated.
   * Use getAccessToken() to retrieve the current token.
   */
  public initialize(config: LinkedInConfig): void {
    this.config = config;
    this._accessToken = config.accessToken || null;
  }

  /**
   * Check if client is initialized
   */
  public isInitialized(): boolean {
    return this.config !== null && !!this._accessToken;
  }

  /**
   * Get the current access token
   */
  public getAccessToken(): string | null {
    return this._accessToken;
  }

  /**
   * Generate OAuth authorization URL
   */
  public getAuthorizationUrl(state: string): string {
    if (!this.config) {
      throw new Error('LinkedIn client not initialized');
    }

    const scopes = [
      'r_liteprofile',
      'r_emailaddress',
      'w_member_social',
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: scopes,
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  public async exchangeCodeForToken(code: string): Promise<LinkedInTokenResponse> {
    if (!this.config) {
      throw new Error('LinkedIn client not initialized');
    }

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`LinkedIn token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    // Store token in separate field to avoid mutating the original config
    this._accessToken = data.access_token;
    return data;
  }

  /**
   * Get current user's profile
   */
  public async getCurrentProfile(): Promise<LinkedInAPIProfile> {
    if (!this.isInitialized()) {
      throw new Error('LinkedIn client not initialized or not authenticated');
    }

    const response = await this.makeRequest('/me', {
      projection: '(id,firstName,lastName,profilePicture,headline,vanityName)',
    });

    return this.normalizeProfile(response);
  }

  /**
   * Search for profiles (requires Sales Navigator or Recruiter license)
   */
  public async searchProfiles(params: LinkedInSearchParams): Promise<LinkedInSearchResult> {
    if (!this.isInitialized()) {
      throw new Error('LinkedIn client not initialized or not authenticated');
    }

    // Note: This is a simplified implementation
    // Real LinkedIn People Search API requires Sales Navigator access
    const queryParams: Record<string, string> = {
      q: 'people',
      count: String(params.limit || 25),
      start: String(params.offset || 0),
    };

    if (params.keywords) {
      queryParams.keywords = params.keywords;
    }

    // Build filter expression
    const filters: string[] = [];
    if (params.title) filters.push(`currentPositions:(title:${params.title})`);
    if (params.company) filters.push(`currentPositions:(companyName:${params.company})`);
    if (params.location) filters.push(`locations:(name:${params.location})`);
    if (params.industry) filters.push(`industries:(name:${params.industry})`);

    if (filters.length > 0) {
      queryParams.facets = filters.join(',');
    }

    try {
      const response = await this.makeRequest('/people', queryParams);
      const paging = response.paging as { total?: number; start?: number; count?: number } | undefined;
      const elements = Array.isArray(response.elements) ? response.elements : [];

      return {
        profiles: elements.map((p: Record<string, unknown>) => this.normalizeProfile(p)),
        total: paging?.total || 0,
        hasMore: (paging?.start || 0) + (paging?.count || 0) < (paging?.total || 0),
      };
    } catch (error: unknown) {
      // Re-throw authentication errors - these should surface to callers
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('no access token') ||
            errorMessage.includes('401') ||
            errorMessage.includes('403') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('authentication')) {
          throw error;
        }
        // Log error details for debugging
        console.warn('LinkedIn search API error:', error.message);
      } else {
        console.warn('LinkedIn search API error:', error);
      }
      // Return empty results only for API unavailability (e.g., missing Sales Navigator license)
      return {
        profiles: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Get profile by ID or vanity name
   */
  public async getProfile(identifier: string): Promise<LinkedInAPIProfile | null> {
    if (!this.isInitialized()) {
      throw new Error('LinkedIn client not initialized or not authenticated');
    }

    try {
      const response = await this.makeRequest(`/people/${identifier}`, {
        projection: '(id,firstName,lastName,headline,summary,profilePicture,vanityName,positions,education,skills)',
      });

      return this.normalizeProfile(response);
    } catch {
      return null;
    }
  }

  /**
   * View a profile (for Sales Navigator sequences)
   *
   * Note: Profile viewing requires browser automation or Sales Navigator API access.
   * This method is not implemented via the standard LinkedIn API.
   *
   * @throws Error Always throws - method not implemented
   */
  public async viewProfile(_profileId: string): Promise<{ success: boolean; reason?: string }> {
    if (!this.isInitialized()) {
      throw new Error('LinkedIn client not initialized or not authenticated');
    }

    // Profile viewing is not available via the standard LinkedIn API
    // It requires browser automation or Sales Navigator access
    throw new Error(
      'viewProfile not implemented: LinkedIn API does not support profile viewing. ' +
      'Use browser automation or Sales Navigator integration instead.'
    );
  }

  /**
   * Send connection request
   */
  public async sendConnectionRequest(
    profileId: string,
    message?: string
  ): Promise<{ success: boolean }> {
    if (!this.isInitialized()) {
      throw new Error('LinkedIn client not initialized or not authenticated');
    }

    try {
      await this.makeRequest('/connections', {}, 'POST', {
        invitee: `urn:li:person:${profileId}`,
        message: message?.substring(0, 300), // LinkedIn limit
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending connection request:', error);
      return { success: false };
    }
  }

  /**
   * Send message to a connection
   */
  public async sendMessage(
    profileId: string,
    message: string
  ): Promise<{ success: boolean }> {
    if (!this.isInitialized()) {
      throw new Error('LinkedIn client not initialized or not authenticated');
    }

    try {
      await this.makeRequest('/messages', {}, 'POST', {
        recipients: [{ person: `urn:li:person:${profileId}` }],
        subject: '',
        body: message.substring(0, 8000), // LinkedIn message limit
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false };
    }
  }

  /**
   * Convert LinkedIn profile to Lead
   */
  public profileToLeadInput(profile: LinkedInAPIProfile): CreateLeadInput {
    const currentPosition = profile.positions?.find(p => p.isCurrent);

    return {
      firstName: profile.firstName,
      lastName: profile.lastName,
      title: currentPosition?.title || profile.headline,
      contact: {
        linkedinUrl: profile.vanityName
          ? `https://www.linkedin.com/in/${profile.vanityName}`
          : undefined,
      },
      company: currentPosition ? {
        name: currentPosition.companyName,
      } : undefined,
      source: 'linkedin',
      sourceDetails: 'LinkedIn Prospecting',
      linkedinData: {
        profileId: profile.id,
        headline: profile.headline,
        summary: profile.summary,
        location: profile.location
          ? `${profile.location.city || ''}, ${profile.location.country || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
          : undefined,
        connections: profile.connections,
        profilePictureUrl: profile.profilePicture,
        currentPosition: currentPosition ? {
          title: currentPosition.title,
          company: currentPosition.companyName,
          startDate: currentPosition.startDate
            ? `${currentPosition.startDate.year}-${String(currentPosition.startDate.month || 1).padStart(2, '0')}`
            : undefined,
        } : undefined,
        education: profile.education?.map(e => ({
          school: e.schoolName,
          degree: e.degree,
          field: e.fieldOfStudy,
        })),
        skills: profile.skills,
        lastScraped: new Date().toISOString(),
      },
    };
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(
    endpoint: string,
    params?: Record<string, string>,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (!this._accessToken) {
      throw new Error('No access token available');
    }

    const url = new URL(`${this.apiBaseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this._accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Normalize LinkedIn API response to standard profile format
   * Includes runtime validation to prevent type errors from unexpected API responses
   */
  private normalizeProfile(data: Record<string, unknown>): LinkedInAPIProfile {
    // Validate required field: id
    if (!data.id || typeof data.id !== 'string') {
      throw new Error('Invalid LinkedIn profile: missing or invalid id');
    }

    return {
      id: data.id,
      firstName: this.getLocalizedName(
        typeof data.firstName === 'object' && data.firstName !== null
          ? data.firstName as Record<string, unknown>
          : undefined
      ),
      lastName: this.getLocalizedName(
        typeof data.lastName === 'object' && data.lastName !== null
          ? data.lastName as Record<string, unknown>
          : undefined
      ),
      headline: typeof data.headline === 'string' ? data.headline : undefined,
      summary: typeof data.summary === 'string' ? data.summary : undefined,
      profilePicture: this.getProfilePicture(
        typeof data.profilePicture === 'object' && data.profilePicture !== null
          ? data.profilePicture as Record<string, unknown>
          : undefined
      ),
      vanityName: typeof data.vanityName === 'string' ? data.vanityName : undefined,
      location: typeof data.location === 'object' && data.location !== null
        ? data.location as LinkedInAPIProfile['location']
        : undefined,
      positions: Array.isArray(data.positions)
        ? data.positions as LinkedInAPIProfile['positions']
        : undefined,
      education: Array.isArray(data.education)
        ? data.education as LinkedInAPIProfile['education']
        : undefined,
      skills: Array.isArray(data.skills)
        ? data.skills as string[]
        : undefined,
      connections: typeof data.connections === 'number' ? data.connections : undefined,
    };
  }

  /**
   * Get localized name from LinkedIn's multi-locale format
   */
  private getLocalizedName(nameData: Record<string, unknown> | undefined): string {
    if (!nameData) return '';

    const localized = nameData.localized as Record<string, string>;
    if (localized) {
      const preferredLocale = nameData.preferredLocale as { language: string; country: string };
      const key = preferredLocale
        ? `${preferredLocale.language}_${preferredLocale.country}`
        : Object.keys(localized)[0];
      return localized[key] || '';
    }

    return '';
  }

  /**
   * Extract profile picture URL from LinkedIn's format
   */
  private getProfilePicture(pictureData: Record<string, unknown> | undefined): string | undefined {
    if (!pictureData) return undefined;

    const displayImage = pictureData['displayImage~'] as Record<string, unknown>;
    if (displayImage?.elements && Array.isArray(displayImage.elements)) {
      const element = displayImage.elements[0] as Record<string, unknown>;
      const identifiers = element?.identifiers as Array<{ identifier: string }>;
      return identifiers?.[0]?.identifier;
    }

    return undefined;
  }
}

/**
 * LinkedIn import configuration
 */
export interface LinkedInImportConfig {
  searchParams: LinkedInSearchParams;
  autoCreateLeads: boolean;
  defaultTags?: string[];
  enrollInSequence?: string;
  maxResults?: number;
}

/**
 * Helper to add delay between API calls
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Import leads from LinkedIn search
 */
export async function importFromLinkedIn(
  client: LinkedInProspectingClient,
  config: LinkedInImportConfig & {
    createdBy?: string;
    rateLimitMs?: number;
  },
  createLead: (input: CreateLeadInput, createdBy: string) => Promise<Lead>,
  findExistingLead?: (linkedinId: string, email?: string) => Promise<boolean>
): Promise<{
  imported: number;
  skipped: number;
  errors: Array<{ profile: string; error: string }>;
}> {
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as Array<{ profile: string; error: string }>,
  };

  const createdBy = config.createdBy || 'linkedin_import';
  const rateLimitMs = config.rateLimitMs || 200; // Default 200ms between calls

  try {
    const searchResult = await client.searchProfiles({
      ...config.searchParams,
      limit: Math.min(config.maxResults || 100, 100),
    });

    for (const profile of searchResult.profiles) {
      try {
        // Check for duplicates if lookup function is provided
        if (findExistingLead) {
          const exists = await findExistingLead(profile.id, undefined);
          if (exists) {
            results.skipped++;
            continue;
          }
        }

        const leadInput = client.profileToLeadInput(profile);

        if (config.defaultTags) {
          leadInput.tags = config.defaultTags;
        }

        await createLead(leadInput, createdBy);
        results.imported++;

        // Rate limiting between API calls
        if (rateLimitMs > 0) {
          await sleep(rateLimitMs);
        }
      } catch (error: unknown) {
        results.errors.push({
          profile: `${profile.firstName} ${profile.lastName}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  } catch (error: unknown) {
    console.error('LinkedIn import error:', error);
    throw error;
  }

  return results;
}

// Export singleton instance
export const linkedInClient = new LinkedInProspectingClient();
