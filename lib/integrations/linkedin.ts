/**
 * LinkedIn Prospecting Integration
 * Handles LinkedIn Sales Navigator integration for lead prospecting
 */

import type { Lead, LinkedInProfile, CreateLeadInput } from '../../types/lead';

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
   * Initialize with OAuth credentials
   */
  public initialize(config: LinkedInConfig): void {
    this.config = config;
  }

  /**
   * Check if client is initialized
   */
  public isInitialized(): boolean {
    return this.config !== null && !!this.config.accessToken;
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
    this.config.accessToken = data.access_token;
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

      return {
        profiles: (response.elements || []).map((p: Record<string, unknown>) => this.normalizeProfile(p)),
        total: response.paging?.total || 0,
        hasMore: (response.paging?.start || 0) + (response.paging?.count || 0) < (response.paging?.total || 0),
      };
    } catch {
      // Fallback for when search API is not available
      console.warn('LinkedIn search API not available, returning empty results');
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
   */
  public async viewProfile(profileId: string): Promise<{ success: boolean }> {
    if (!this.isInitialized()) {
      throw new Error('LinkedIn client not initialized or not authenticated');
    }

    // Note: Profile viewing is typically done via browser automation
    // This is a placeholder for the API-based approach
    console.log(`Viewing LinkedIn profile: ${profileId}`);
    return { success: true };
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
    if (!this.config?.accessToken) {
      throw new Error('No access token available');
    }

    const url = new URL(`${this.apiBaseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.accessToken}`,
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
   */
  private normalizeProfile(data: Record<string, unknown>): LinkedInAPIProfile {
    return {
      id: data.id as string,
      firstName: this.getLocalizedName(data.firstName as Record<string, unknown>),
      lastName: this.getLocalizedName(data.lastName as Record<string, unknown>),
      headline: data.headline as string,
      summary: data.summary as string,
      profilePicture: this.getProfilePicture(data.profilePicture as Record<string, unknown>),
      vanityName: data.vanityName as string,
      location: data.location as LinkedInAPIProfile['location'],
      positions: data.positions as LinkedInAPIProfile['positions'],
      education: data.education as LinkedInAPIProfile['education'],
      skills: data.skills as string[],
      connections: data.connections as number,
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
 * Import leads from LinkedIn search
 */
export async function importFromLinkedIn(
  client: LinkedInProspectingClient,
  config: LinkedInImportConfig,
  createLead: (input: CreateLeadInput, createdBy: string) => Promise<Lead>
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

  try {
    const searchResult = await client.searchProfiles({
      ...config.searchParams,
      limit: Math.min(config.maxResults || 100, 100),
    });

    for (const profile of searchResult.profiles) {
      try {
        const leadInput = client.profileToLeadInput(profile);

        if (config.defaultTags) {
          leadInput.tags = config.defaultTags;
        }

        await createLead(leadInput, 'linkedin_import');
        results.imported++;
      } catch (error) {
        results.errors.push({
          profile: `${profile.firstName} ${profile.lastName}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  } catch (error) {
    console.error('LinkedIn import error:', error);
    throw error;
  }

  return results;
}

// Export singleton instance
export const linkedInClient = new LinkedInProspectingClient();
