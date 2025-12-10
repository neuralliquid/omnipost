/**
 * Phoenix Rooivalk Lead Scorer
 * Brand-specific scoring logic for SkySnare and AeroNet leads
 */

import type { LeadScore, LeadScoreBreakdown } from '@/types/lead';
import type {
  PhoenixLead,
  PhoenixBrand,
  PhoenixScoringRules,
  SkySnareLeadData,
  AeroNetLeadData,
} from '@/types/phoenix-rooivalk';
import {
  getScoringRules,
} from '@/types/phoenix-rooivalk';
import { calculateScoreGrade } from '@/types/lead';

/**
 * Phoenix Lead Scorer class
 * Calculates lead scores based on brand-specific rules
 */
export class PhoenixLeadScorer {
  private rules: PhoenixScoringRules;

  constructor(brand: PhoenixBrand) {
    this.rules = getScoringRules(brand);
  }

  /**
   * Calculate the complete lead score
   */
  calculateScore(lead: PhoenixLead): LeadScore {
    const breakdown: LeadScoreBreakdown = {
      demographic: this.calculateDemographicScore(lead),
      behavioral: this.calculateBehavioralScore(lead),
      engagement: this.calculateEngagementScore(lead),
      recency: this.calculateRecencyScore(lead),
      custom: this.calculateCustomScore(lead),
    };

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
   * Calculate demographic score based on segment, title, company size
   */
  private calculateDemographicScore(lead: PhoenixLead): number {
    let score = 0;
    const maxScore = 25;

    // Segment score
    if (lead.phoenixData) {
      const segmentScore = this.rules.demographic.segmentScores[lead.phoenixData.segment];
      if (segmentScore) {
        score += segmentScore * 0.4; // 40% weight
      }
    }

    // Title score
    if (lead.title) {
      const titleLower = lead.title.toLowerCase();
      let titleScore = this.rules.demographic.titleScores.other || 5;

      for (const [key, value] of Object.entries(this.rules.demographic.titleScores)) {
        if (titleLower.includes(key.replace('_', ' '))) {
          titleScore = Math.max(titleScore, value);
        }
      }
      score += titleScore * 0.35; // 35% weight
    }

    // Company size score
    if (lead.company?.size) {
      const sizeScore = this.rules.demographic.companySizeScores[lead.company.size];
      if (sizeScore) {
        score += sizeScore * 0.25; // 25% weight
      }
    }

    return Math.min(maxScore, Math.round(score));
  }

  /**
   * Calculate behavioral score based on actions taken
   */
  private calculateBehavioralScore(lead: PhoenixLead): number {
    let score = 0;
    const maxScore = 30;

    if (!lead.phoenixData) return 0;

    if (lead.phoenixData.brand === 'skysnare') {
      const data = lead.phoenixData as SkySnareLeadData;

      if (data.demoRequested) {
        score += this.rules.behavioral.demoRequested;
      }
      if (data.trialRequested) {
        score += 15; // Trial request for consumer
      }
      if (data.eventsAttended?.length) {
        score += Math.min(
          this.rules.behavioral.eventAttendance,
          data.eventsAttended.length * 5
        );
      }
    } else {
      const data = lead.phoenixData as AeroNetLeadData;

      if (data.pilotRequested) {
        score += this.rules.behavioral.pilotRequested;
      }
      if (data.technicalBriefingRequested) {
        score += this.rules.behavioral.technicalBriefing;
      }
      if (data.siteAssessmentRequested) {
        score += 20; // Site assessment is high intent
      }
      if (data.partnersAccessed) {
        score += this.rules.behavioral.partnerPortalAccess;
      }
    }

    return Math.min(maxScore, Math.round(score));
  }

  /**
   * Calculate engagement score based on interactions
   */
  private calculateEngagementScore(lead: PhoenixLead): number {
    let score = 0;
    const maxScore = 25;

    // Score based on interactions
    const interactions = lead.interactions || [];

    // Email engagement
    const emailOpens = interactions.filter(i => i.type === 'email_opened').length;
    const emailClicks = interactions.filter(i => i.type === 'email_clicked').length;
    const emailReplies = interactions.filter(i => i.type === 'email_replied').length;

    score += Math.min(5, emailOpens * 1);
    score += Math.min(8, emailClicks * 2);
    score += Math.min(10, emailReplies * 5);

    // Content engagement
    const contentViews = interactions.filter(i => i.type === 'content_view').length;
    const formSubmissions = interactions.filter(i => i.type === 'form_submission').length;

    score += Math.min(5, contentViews * 1);
    score += Math.min(10, formSubmissions * 3);

    // LinkedIn engagement
    const linkedinReplies = interactions.filter(i => i.type === 'linkedin_message').length;
    score += Math.min(5, linkedinReplies * 2);

    // Meetings and calls
    const meetings = interactions.filter(i => i.type === 'meeting').length;
    const calls = interactions.filter(i => i.type === 'call').length;

    score += Math.min(10, meetings * 5);
    score += Math.min(5, calls * 2);

    return Math.min(maxScore, Math.round(score));
  }

  /**
   * Calculate recency score based on last interaction
   */
  private calculateRecencyScore(lead: PhoenixLead): number {
    const maxScore = 20;

    if (!lead.lastInteractionAt) {
      return 0;
    }

    const lastInteraction = new Date(lead.lastInteractionAt);
    const now = new Date();
    const daysSince = Math.floor(
      (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Score based on recency
    if (daysSince <= 1) return maxScore;
    if (daysSince <= 3) return 18;
    if (daysSince <= 7) return 15;
    if (daysSince <= 14) return 12;
    if (daysSince <= 30) return 8;
    if (daysSince <= 60) return 5;
    if (daysSince <= 90) return 2;
    return 0;
  }

  /**
   * Calculate custom/brand-specific score
   */
  private calculateCustomScore(lead: PhoenixLead): number {
    let score = 0;
    const maxScore = 20; // Additional points for brand-specific factors

    if (!lead.phoenixData) return 0;

    if (lead.phoenixData.brand === 'skysnare') {
      const data = lead.phoenixData as SkySnareLeadData;

      // Purchase intent
      if (data.purchaseIntent) {
        if (data.purchaseIntent.timeline === 'immediate') {
          score += this.rules.intent.immediateTimeline * 0.5;
        } else if (data.purchaseIntent.timeline === '1_3_months') {
          score += this.rules.intent.immediateTimeline * 0.3;
        }

        if (data.purchaseIntent.decisionMaker) {
          score += this.rules.intent.decisionMaker * 0.5;
        }

        if (data.purchaseIntent.budget) {
          score += this.rules.intent.budgetConfirmed * 0.3;
        }
      }

      // Product interest level
      if (data.productInterest === 'ready_to_buy') {
        score += 10;
      } else if (data.productInterest === 'evaluating') {
        score += 6;
      } else if (data.productInterest === 'considering') {
        score += 3;
      }
    } else {
      const data = lead.phoenixData as AeroNetLeadData;

      // Procurement readiness
      if (data.procurement) {
        if (data.procurement.timeline === 'immediate') {
          score += this.rules.intent.immediateTimeline * 0.5;
        } else if (data.procurement.timeline === 'q1' || data.procurement.timeline === 'q2') {
          score += this.rules.intent.immediateTimeline * 0.3;
        }

        if (data.procurement.fundingApproved) {
          score += this.rules.intent.budgetConfirmed * 0.5;
        }

        // Budget range scoring
        const budgetScores: Record<string, number> = {
          'over_5m': 10,
          '1m_5m': 8,
          '500k_1m': 6,
          '100k_500k': 4,
          'under_100k': 2,
        };
        if (data.procurement.budgetRange) {
          score += budgetScores[data.procurement.budgetRange] || 0;
        }
      }

      // Compliance scoring (AeroNet only)
      if (this.rules.compliance && data.compliance) {
        if (data.compliance.required.length > 0) {
          score += this.rules.compliance.requiredCertifications * 0.3;
        }
      }

      if (this.rules.compliance && data.organization?.securityClearance) {
        score += this.rules.compliance.securityClearance * 0.3;
      }

      // Incident history (urgency indicator)
      if (this.rules.compliance && data.organization?.incidentHistory) {
        score += this.rules.compliance.incidentHistory * 0.5;
      }

      // Product interest level
      if (data.productInterest === 'ready_to_buy') {
        score += 8;
      } else if (data.productInterest === 'evaluating') {
        score += 5;
      } else if (data.productInterest === 'considering') {
        score += 2;
      }
    }

    return Math.min(maxScore, Math.round(score));
  }
}

/**
 * Create scorer for a specific brand
 */
export function createPhoenixScorer(brand: PhoenixBrand): PhoenixLeadScorer {
  return new PhoenixLeadScorer(brand);
}

/**
 * Calculate score for a Phoenix lead
 */
export function calculatePhoenixLeadScore(lead: PhoenixLead): LeadScore {
  if (!lead.phoenixData) {
    // Fall back to basic scoring if no Phoenix data
    return {
      total: 0,
      breakdown: {
        demographic: 0,
        behavioral: 0,
        engagement: 0,
        recency: 0,
        custom: 0,
      },
      grade: 'F',
      lastCalculated: new Date().toISOString(),
    };
  }

  const scorer = createPhoenixScorer(lead.phoenixData.brand);
  return scorer.calculateScore(lead);
}

/**
 * Determine if a lead should be fast-tracked to sales
 */
export function shouldFastTrack(lead: PhoenixLead): boolean {
  if (!lead.phoenixData) return false;

  // Fast track conditions
  if (lead.score.grade === 'A') return true;

  if (lead.phoenixData.brand === 'aeronet') {
    const data = lead.phoenixData as AeroNetLeadData;

    // High-value enterprise segments
    const fastTrackSegments = ['airport', 'military', 'critical_infrastructure'];
    if (fastTrackSegments.includes(data.segment)) {
      // With pilot request or site assessment
      if (data.pilotRequested || data.siteAssessmentRequested) {
        return true;
      }
    }

    // Large budget with immediate timeline
    if (
      data.procurement?.timeline === 'immediate' &&
      (data.procurement?.budgetRange === 'over_5m' ||
        data.procurement?.budgetRange === '1m_5m')
    ) {
      return true;
    }
  } else {
    const data = lead.phoenixData as SkySnareLeadData;

    // Training facilities with demo request and immediate timeline
    if (
      data.segment === 'training_facility' &&
      data.demoRequested &&
      data.purchaseIntent?.timeline === 'immediate'
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Get recommended next action for a Phoenix lead
 */
export function getRecommendedAction(lead: PhoenixLead): string {
  if (!lead.phoenixData) {
    return 'Enrich lead with Phoenix brand data';
  }

  const { score } = lead;

  if (score.grade === 'A') {
    return lead.phoenixData.brand === 'aeronet'
      ? 'Schedule executive briefing'
      : 'Send pricing and close';
  }

  if (score.grade === 'B') {
    if (lead.phoenixData.brand === 'aeronet') {
      const data = lead.phoenixData as AeroNetLeadData;
      if (!data.technicalBriefingRequested) {
        return 'Offer technical briefing';
      }
      if (!data.pilotRequested) {
        return 'Propose pilot program';
      }
      return 'Follow up on requirements';
    } else {
      const data = lead.phoenixData as SkySnareLeadData;
      if (!data.demoRequested) {
        return 'Offer product demo';
      }
      return 'Send case studies and pricing';
    }
  }

  if (score.grade === 'C') {
    return 'Continue nurturing with educational content';
  }

  if (score.grade === 'D') {
    return 'Add to long-term nurture sequence';
  }

  return 'Re-engage with value proposition';
}
