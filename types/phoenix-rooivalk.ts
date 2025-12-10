/**
 * Phoenix Rooivalk Integration Types
 * Defines brand-specific lead types, scoring, and configuration for
 * SkySnare™ (Consumer) and AeroNet™ (Enterprise) products
 */

import type { Lead, LeadScore, LeadScoreBreakdown, CompanyInfo } from './lead';

/**
 * Phoenix Rooivalk brand identifiers
 */
export type PhoenixBrand = 'skysnare' | 'aeronet';

/**
 * Product interest levels
 */
export type ProductInterest = 'browsing' | 'considering' | 'evaluating' | 'ready_to_buy';

/**
 * SkySnare Consumer market segments
 */
export type SkySnareSegment =
  | 'sports_enthusiast'
  | 'training_facility'
  | 'sports_club'
  | 'event_organizer'
  | 'educational'
  | 'recreational';

/**
 * AeroNet Enterprise market segments
 */
export type AeroNetSegment =
  | 'airport'
  | 'critical_infrastructure'
  | 'government'
  | 'military'
  | 'corporate_campus'
  | 'stadium_venue'
  | 'port_maritime'
  | 'energy_utility'
  | 'data_center';

/**
 * AeroNet compliance requirements
 */
export type ComplianceRequirement =
  | 'faa_regulations'
  | 'dhs_requirements'
  | 'military_standards'
  | 'iso_27001'
  | 'soc2'
  | 'gdpr'
  | 'hipaa'
  | 'pci_dss';

/**
 * SkySnare specific lead data
 */
export interface SkySnareLeadData {
  brand: 'skysnare';
  segment: SkySnareSegment;
  productInterest: ProductInterest;

  // Use case details
  useCase?: {
    primaryActivity: string; // e.g., 'drone racing', 'pilot training'
    frequency?: 'daily' | 'weekly' | 'monthly' | 'occasional';
    groupSize?: number;
    indoorOutdoor?: 'indoor' | 'outdoor' | 'both';
  };

  // Purchase intent
  purchaseIntent?: {
    timeline?: 'immediate' | '1_3_months' | '3_6_months' | '6_12_months' | 'researching';
    budget?: string;
    quantityNeeded?: number;
    decisionMaker?: boolean;
  };

  // Engagement
  demoRequested?: boolean;
  trialRequested?: boolean;
  newsletterSubscribed?: boolean;
  eventsAttended?: string[];
}

/**
 * AeroNet specific lead data
 */
export interface AeroNetLeadData {
  brand: 'aeronet';
  segment: AeroNetSegment;
  productInterest: ProductInterest;

  // Organization details
  organization?: {
    type: 'government' | 'private' | 'military' | 'quasi_government';
    securityClearance?: boolean;
    existingSecurity?: string[]; // Current security solutions
    incidentHistory?: boolean; // Have they had drone incidents?
  };

  // Technical requirements
  requirements?: {
    coverageArea?: string; // e.g., '5 square miles'
    responseTime?: string; // e.g., 'sub-200ms'
    integration?: string[]; // e.g., ['radar', 'camera', 'airspace_mgmt']
    edgeProcessing?: boolean;
    blockchainEvidence?: boolean;
  };

  // Compliance
  compliance?: {
    required: ComplianceRequirement[];
    certifications?: string[];
    auditFrequency?: 'annual' | 'quarterly' | 'continuous';
  };

  // Procurement
  procurement?: {
    timeline?: 'immediate' | 'q1' | 'q2' | 'q3' | 'q4' | 'next_fiscal_year';
    budgetRange?: 'under_100k' | '100k_500k' | '500k_1m' | '1m_5m' | 'over_5m';
    procurementType?: 'rfp' | 'sole_source' | 'competitive_bid' | 'framework_agreement';
    fundingApproved?: boolean;
    decisionCommittee?: string[];
  };

  // Engagement
  pilotRequested?: boolean;
  siteAssessmentRequested?: boolean;
  technicalBriefingRequested?: boolean;
  partnersAccessed?: boolean; // Accessed restricted partner portal
}

/**
 * Extended Lead with Phoenix Rooivalk data
 */
export interface PhoenixLead extends Lead {
  phoenixData?: SkySnareLeadData | AeroNetLeadData;
}

/**
 * Phoenix-specific scoring rules
 */
export interface PhoenixScoringRules {
  brand: PhoenixBrand;

  // Demographic scoring
  demographic: {
    segmentScores: Record<string, number>;
    titleScores: Record<string, number>;
    companySizeScores: Record<string, number>;
  };

  // Behavioral scoring
  behavioral: {
    demoRequested: number;
    pilotRequested: number;
    technicalBriefing: number;
    partnerPortalAccess: number;
    contentDownloads: number;
    eventAttendance: number;
  };

  // Intent scoring
  intent: {
    immediateTimeline: number;
    budgetConfirmed: number;
    decisionMaker: number;
    competitorMention: number;
  };

  // Compliance/fit scoring (AeroNet only)
  compliance?: {
    requiredCertifications: number;
    securityClearance: number;
    incidentHistory: number;
  };
}

/**
 * Default SkySnare scoring rules
 */
export const SKYSNARE_SCORING_RULES: PhoenixScoringRules = {
  brand: 'skysnare',
  demographic: {
    segmentScores: {
      training_facility: 20,
      sports_club: 18,
      event_organizer: 15,
      educational: 12,
      sports_enthusiast: 10,
      recreational: 8,
    },
    titleScores: {
      owner: 25,
      director: 22,
      manager: 18,
      instructor: 15,
      coach: 12,
      other: 5,
    },
    companySizeScores: {
      '500+': 10,
      '201-500': 15,
      '51-200': 20,
      '11-50': 18,
      '1-10': 12,
    },
  },
  behavioral: {
    demoRequested: 25,
    pilotRequested: 0, // N/A for consumer
    technicalBriefing: 15,
    partnerPortalAccess: 0,
    contentDownloads: 10,
    eventAttendance: 15,
  },
  intent: {
    immediateTimeline: 20,
    budgetConfirmed: 15,
    decisionMaker: 15,
    competitorMention: 10,
  },
};

/**
 * Default AeroNet scoring rules
 */
export const AERONET_SCORING_RULES: PhoenixScoringRules = {
  brand: 'aeronet',
  demographic: {
    segmentScores: {
      airport: 25,
      critical_infrastructure: 25,
      military: 25,
      government: 22,
      energy_utility: 20,
      data_center: 18,
      corporate_campus: 15,
      stadium_venue: 15,
      port_maritime: 18,
    },
    titleScores: {
      ciso: 25,
      cto: 25,
      director_security: 22,
      vp_operations: 20,
      security_manager: 18,
      procurement: 15,
      other: 5,
    },
    companySizeScores: {
      '500+': 25,
      '201-500': 20,
      '51-200': 15,
      '11-50': 10,
      '1-10': 5,
    },
  },
  behavioral: {
    demoRequested: 20,
    pilotRequested: 30,
    technicalBriefing: 25,
    partnerPortalAccess: 20,
    contentDownloads: 10,
    eventAttendance: 15,
  },
  intent: {
    immediateTimeline: 25,
    budgetConfirmed: 20,
    decisionMaker: 15,
    competitorMention: 10,
  },
  compliance: {
    requiredCertifications: 15,
    securityClearance: 20,
    incidentHistory: 15, // They've had drone incidents = higher urgency
  },
};

/**
 * Phoenix Rooivalk configuration
 */
export interface PhoenixConfig {
  brands: {
    skysnare: {
      name: string;
      tagline: string;
      color: string;
      defaultTags: string[];
      defaultSequenceId?: string;
    };
    aeronet: {
      name: string;
      tagline: string;
      color: string;
      defaultTags: string[];
      defaultSequenceId?: string;
      restrictedAccess: boolean;
    };
  };

  // Lead routing rules
  routing: {
    skysnare: {
      assignTo?: string;
      notifyEmail?: string;
    };
    aeronet: {
      assignTo?: string;
      notifyEmail?: string;
      requireApproval: boolean;
    };
  };

  // Integration endpoints
  webhooks?: {
    onLeadCreated?: string;
    onLeadQualified?: string;
    onDemoRequested?: string;
    onPilotRequested?: string;
  };
}

/**
 * Default Phoenix Rooivalk configuration
 */
export const DEFAULT_PHOENIX_CONFIG: PhoenixConfig = {
  brands: {
    skysnare: {
      name: 'SkySnare™',
      tagline: 'Safety-certified sports and training equipment',
      color: '#22C55E', // Green
      defaultTags: ['phoenix-rooivalk', 'skysnare', 'consumer'],
    },
    aeronet: {
      name: 'AeroNet™',
      tagline: 'AI-enabled infrastructure security',
      color: '#3B82F6', // Blue
      defaultTags: ['phoenix-rooivalk', 'aeronet', 'enterprise'],
      restrictedAccess: true,
    },
  },
  routing: {
    skysnare: {},
    aeronet: {
      requireApproval: true,
    },
  },
};

/**
 * Email template variables for Phoenix leads
 */
export interface PhoenixTemplateVariables {
  // Standard lead vars
  firstName: string;
  lastName: string;
  fullName: string;
  title?: string;
  company?: string;

  // Phoenix-specific
  brandName: string;
  productName: string;
  segment: string;

  // SkySnare specific
  useCase?: string;

  // AeroNet specific
  organizationType?: string;
  complianceNeeds?: string;

  // URLs
  demoUrl: string;
  docsUrl: string;
  calendarUrl: string;
}

/**
 * Form submission for Phoenix lead capture
 */
export interface PhoenixFormSubmission {
  brand: PhoenixBrand;

  // Contact info
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;

  // Company info
  company?: string;
  title?: string;

  // Brand-specific fields
  segment: SkySnareSegment | AeroNetSegment;
  useCase?: string;
  timeline?: string;

  // Engagement
  requestType: 'info' | 'demo' | 'pilot' | 'quote' | 'partner';
  message?: string;

  // Tracking
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };

  // Consent
  marketingConsent: boolean;
  privacyAccepted: boolean;
}

/**
 * Helper to determine brand from segment
 */
export function getBrandFromSegment(
  segment: SkySnareSegment | AeroNetSegment
): PhoenixBrand {
  const skySnareSegments: SkySnareSegment[] = [
    'sports_enthusiast',
    'training_facility',
    'sports_club',
    'event_organizer',
    'educational',
    'recreational',
  ];

  return skySnareSegments.includes(segment as SkySnareSegment)
    ? 'skysnare'
    : 'aeronet';
}

/**
 * Helper to get scoring rules for brand
 */
export function getScoringRules(brand: PhoenixBrand): PhoenixScoringRules {
  return brand === 'skysnare' ? SKYSNARE_SCORING_RULES : AERONET_SCORING_RULES;
}

/**
 * Helper to check if lead is high-value enterprise
 */
export function isHighValueEnterprise(lead: PhoenixLead): boolean {
  if (!lead.phoenixData || lead.phoenixData.brand !== 'aeronet') {
    return false;
  }

  const data = lead.phoenixData as AeroNetLeadData;
  const highValueSegments: AeroNetSegment[] = [
    'airport',
    'critical_infrastructure',
    'military',
    'government',
  ];

  return (
    highValueSegments.includes(data.segment) ||
    (data.procurement?.budgetRange === 'over_5m') ||
    (data.procurement?.budgetRange === '1m_5m')
  );
}

/**
 * Segment display names
 */
export const SEGMENT_LABELS: Record<SkySnareSegment | AeroNetSegment, string> = {
  // SkySnare
  sports_enthusiast: 'Sports Enthusiast',
  training_facility: 'Training Facility',
  sports_club: 'Sports Club',
  event_organizer: 'Event Organizer',
  educational: 'Educational Institution',
  recreational: 'Recreational User',
  // AeroNet
  airport: 'Airport',
  critical_infrastructure: 'Critical Infrastructure',
  government: 'Government',
  military: 'Military/Defense',
  corporate_campus: 'Corporate Campus',
  stadium_venue: 'Stadium/Venue',
  port_maritime: 'Port/Maritime',
  energy_utility: 'Energy/Utility',
  data_center: 'Data Center',
};
