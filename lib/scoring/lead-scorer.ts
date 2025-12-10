/**
 * Lead Scoring Engine
 * Calculates lead scores based on demographic, behavioral, and engagement data
 */

import type {
  Lead,
  LeadScore,
  LeadScoreBreakdown,
  LeadInteraction,
} from '../../types/lead';
import { calculateScoreGrade } from '../../types/lead';

/**
 * Scoring configuration
 */
export interface ScoringConfig {
  // Demographic scoring weights (total should be 25)
  demographic: {
    hasEmail: number;
    hasPhone: number;
    hasLinkedIn: number;
    hasCompany: number;
    hasTitle: number;
    preferredIndustries: string[];
    industryBonus: number;
    preferredCompanySizes: string[];
    companySizeBonus: number;
  };

  // Behavioral scoring weights (total should be 30)
  behavioral: {
    emailSent: number;
    emailOpened: number;
    emailClicked: number;
    emailReplied: number;
    linkedinConnection: number;
    linkedinMessage: number;
    linkedinReplied: number;
    call: number;
    meeting: number;
    formSubmission: number;
  };

  // Engagement scoring weights (total should be 25)
  engagement: {
    contentView: number;
    surveyResponse: number;
    maxContentViews: number;
    recentActivityBonus: number; // Bonus for activity in last 7 days
  };

  // Recency scoring weights (total should be 20)
  recency: {
    within24Hours: number;
    within7Days: number;
    within30Days: number;
    within90Days: number;
    older: number;
  };
}

/**
 * Default scoring configuration
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  demographic: {
    hasEmail: 5,
    hasPhone: 3,
    hasLinkedIn: 4,
    hasCompany: 5,
    hasTitle: 3,
    preferredIndustries: ['Technology', 'Software', 'SaaS', 'Finance', 'Healthcare'],
    industryBonus: 5,
    preferredCompanySizes: ['51-200', '201-500', '500+'],
    companySizeBonus: 5,
  },
  behavioral: {
    emailSent: 1,
    emailOpened: 3,
    emailClicked: 5,
    emailReplied: 10,
    linkedinConnection: 5,
    linkedinMessage: 3,
    linkedinReplied: 10,
    call: 5,
    meeting: 10,
    formSubmission: 8,
  },
  engagement: {
    contentView: 2,
    surveyResponse: 10,
    maxContentViews: 10, // Cap content view points
    recentActivityBonus: 5,
  },
  recency: {
    within24Hours: 20,
    within7Days: 15,
    within30Days: 10,
    within90Days: 5,
    older: 0,
  },
};

/**
 * Lead Scorer class
 */
export class LeadScorer {
  private config: ScoringConfig;

  constructor(config: Partial<ScoringConfig> = {}) {
    this.config = { ...DEFAULT_SCORING_CONFIG, ...config };
  }

  /**
   * Calculate the complete score for a lead
   */
  public calculateScore(lead: Lead, interactions: LeadInteraction[] = []): LeadScore {
    const breakdown: LeadScoreBreakdown = {
      demographic: this.calculateDemographicScore(lead),
      behavioral: this.calculateBehavioralScore(interactions),
      engagement: this.calculateEngagementScore(interactions),
      recency: this.calculateRecencyScore(lead, interactions),
      custom: 0, // Can be extended for custom rules
    };

    // Calculate total (cap at 100)
    const total = Math.min(
      100,
      breakdown.demographic +
        breakdown.behavioral +
        breakdown.engagement +
        breakdown.recency +
        breakdown.custom
    );

    return {
      total: Math.round(total),
      breakdown,
      grade: calculateScoreGrade(total),
      lastCalculated: new Date().toISOString(),
    };
  }

  /**
   * Calculate demographic score (max 25 points)
   */
  private calculateDemographicScore(lead: Lead): number {
    let score = 0;
    const config = this.config.demographic;

    // Contact info points
    if (lead.contact.email) score += config.hasEmail;
    if (lead.contact.phone) score += config.hasPhone;
    if (lead.contact.linkedinUrl) score += config.hasLinkedIn;

    // Company info points
    if (lead.company?.name) score += config.hasCompany;
    if (lead.title) score += config.hasTitle;

    // Industry bonus
    if (lead.company?.industry && config.preferredIndustries.includes(lead.company.industry)) {
      score += config.industryBonus;
    }

    // Company size bonus
    if (lead.company?.size && config.preferredCompanySizes.includes(lead.company.size)) {
      score += config.companySizeBonus;
    }

    return Math.min(25, score);
  }

  /**
   * Calculate behavioral score (max 30 points)
   */
  private calculateBehavioralScore(interactions: LeadInteraction[]): number {
    let score = 0;
    const config = this.config.behavioral;

    // Count interactions by type
    const counts: Record<string, number> = {};
    for (const interaction of interactions) {
      counts[interaction.type] = (counts[interaction.type] || 0) + 1;
    }

    // Email interactions (capped)
    score += Math.min(config.emailSent * 2, (counts['email_sent'] || 0) * config.emailSent);
    score += Math.min(config.emailOpened * 3, (counts['email_opened'] || 0) * config.emailOpened);
    score += Math.min(config.emailClicked * 2, (counts['email_clicked'] || 0) * config.emailClicked);
    score += Math.min(config.emailReplied * 2, (counts['email_replied'] || 0) * config.emailReplied);

    // LinkedIn interactions
    score += Math.min(config.linkedinConnection, (counts['linkedin_connection'] || 0) * config.linkedinConnection);
    score += Math.min(config.linkedinMessage * 2, (counts['linkedin_message'] || 0) * config.linkedinMessage);
    // LinkedIn reply is high value
    if (counts['linkedin_view'] && interactions.some(i => i.type === 'linkedin_message')) {
      score += config.linkedinReplied;
    }

    // Calls and meetings
    score += Math.min(config.call * 2, (counts['call'] || 0) * config.call);
    score += Math.min(config.meeting * 2, (counts['meeting'] || 0) * config.meeting);

    // Form submissions
    score += Math.min(config.formSubmission, (counts['form_submission'] || 0) * config.formSubmission);

    return Math.min(30, score);
  }

  /**
   * Calculate engagement score (max 25 points)
   */
  private calculateEngagementScore(interactions: LeadInteraction[]): number {
    let score = 0;
    const config = this.config.engagement;

    // Count engagement interactions
    const contentViews = interactions.filter(i => i.type === 'content_view').length;
    const surveyResponses = interactions.filter(i => i.type === 'survey_response').length;

    // Content views (capped)
    score += Math.min(
      config.maxContentViews,
      contentViews * config.contentView
    );

    // Survey responses
    score += Math.min(config.surveyResponse, surveyResponses * config.surveyResponse);

    // Recent activity bonus
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const hasRecentActivity = interactions.some(
      i => new Date(i.createdAt).getTime() > sevenDaysAgo
    );
    if (hasRecentActivity) {
      score += config.recentActivityBonus;
    }

    return Math.min(25, score);
  }

  /**
   * Calculate recency score (max 20 points)
   */
  private calculateRecencyScore(lead: Lead, interactions: LeadInteraction[]): number {
    const config = this.config.recency;

    // Get the most recent activity date
    let lastActivityDate: Date | null = null;

    if (lead.lastInteractionAt) {
      lastActivityDate = new Date(lead.lastInteractionAt);
    }

    if (interactions.length > 0) {
      const latestInteraction = interactions.reduce((latest, current) => {
        const currentDate = new Date(current.createdAt);
        return currentDate > latest ? currentDate : latest;
      }, new Date(0));

      if (!lastActivityDate || latestInteraction > lastActivityDate) {
        lastActivityDate = latestInteraction;
      }
    }

    if (!lastActivityDate) {
      // No activity, use creation date
      lastActivityDate = new Date(lead.createdAt);
    }

    const now = Date.now();
    const diffMs = now - lastActivityDate.getTime();
    const diffDays = diffMs / (24 * 60 * 60 * 1000);

    if (diffDays <= 1) return config.within24Hours;
    if (diffDays <= 7) return config.within7Days;
    if (diffDays <= 30) return config.within30Days;
    if (diffDays <= 90) return config.within90Days;
    return config.older;
  }

  /**
   * Get scoring suggestions for a lead
   */
  public getSuggestions(lead: Lead, interactions: LeadInteraction[]): string[] {
    const suggestions: string[] = [];

    // Missing contact info
    if (!lead.contact.email) {
      suggestions.push('Add email address to improve lead quality');
    }
    if (!lead.contact.linkedinUrl) {
      suggestions.push('Add LinkedIn profile for better prospecting');
    }

    // Missing company info
    if (!lead.company?.name) {
      suggestions.push('Add company information');
    }
    if (!lead.title) {
      suggestions.push('Add job title');
    }

    // No recent activity
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const hasRecentInteraction = interactions.some(
      i => new Date(i.createdAt).getTime() > thirtyDaysAgo
    );
    if (!hasRecentInteraction) {
      suggestions.push('Consider reaching out - no activity in 30+ days');
    }

    // No email engagement
    const hasEmailEngagement = interactions.some(
      i => ['email_opened', 'email_clicked', 'email_replied'].includes(i.type)
    );
    if (!hasEmailEngagement && interactions.some(i => i.type === 'email_sent')) {
      suggestions.push('Email sent but no engagement - consider different approach');
    }

    // LinkedIn connected but no message
    const linkedinConnected = interactions.some(i => i.type === 'linkedin_connection');
    const linkedinMessaged = interactions.some(i => i.type === 'linkedin_message');
    if (linkedinConnected && !linkedinMessaged) {
      suggestions.push('Connected on LinkedIn - consider sending a message');
    }

    return suggestions;
  }

  /**
   * Determine if lead should be marked as hot
   */
  public isHotLead(lead: Lead, score: LeadScore): boolean {
    // Hot if:
    // - Score is A grade (80+)
    // - Recent activity (recency score > 15)
    // - Has responded (behavioral > 20)
    return (
      score.grade === 'A' ||
      (score.breakdown.recency >= 15 && score.breakdown.behavioral >= 20)
    );
  }

  /**
   * Determine if lead is warm
   */
  public isWarmLead(score: LeadScore): boolean {
    return score.grade === 'B' || score.grade === 'C' && score.breakdown.recency >= 10;
  }
}

// Export singleton instance with default config
export const leadScorer = new LeadScorer();

/**
 * Helper function to recalculate and update lead score
 */
export async function updateLeadScore(
  lead: Lead,
  interactions: LeadInteraction[],
  scorer: LeadScorer = leadScorer
): Promise<LeadScore> {
  return scorer.calculateScore(lead, interactions);
}
