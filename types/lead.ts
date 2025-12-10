/**
 * Lead/CRM Types
 * Defines data structures for lead management, scoring, and prospecting
 */

/**
 * Lead status in the sales pipeline
 */
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'nurturing';

/**
 * Lead source tracking
 */
export type LeadSource =
  | 'linkedin'
  | 'linkedin_sales_navigator'
  | 'website'
  | 'referral'
  | 'cold_outreach'
  | 'content_engagement'
  | 'survey'
  | 'form'
  | 'event'
  | 'import'
  | 'manual'
  | 'other';

/**
 * Lead temperature/priority
 */
export type LeadTemperature = 'cold' | 'warm' | 'hot';

/**
 * Contact information
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  website?: string;
}

/**
 * Company/Organization information
 */
export interface CompanyInfo {
  name?: string;
  industry?: string;
  size?: string; // e.g., '1-10', '11-50', '51-200', '201-500', '500+'
  website?: string;
  linkedinUrl?: string;
  location?: string;
  description?: string;
}

/**
 * Lead interaction/activity record
 */
export interface LeadInteraction {
  id: string;
  type: 'email_sent' | 'email_opened' | 'email_clicked' | 'email_replied' |
        'linkedin_message' | 'linkedin_connection' | 'linkedin_view' |
        'call' | 'meeting' | 'note' | 'form_submission' | 'content_view' |
        'survey_response' | 'status_change' | 'tag_added' | 'tag_removed';
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
}

/**
 * Lead scoring breakdown
 */
export interface LeadScoreBreakdown {
  demographic: number;      // Based on job title, company size, industry
  behavioral: number;       // Based on interactions and engagement
  engagement: number;       // Based on content engagement, email opens, etc.
  recency: number;          // Based on last interaction date
  custom: number;           // Custom scoring rules
}

/**
 * Lead score with calculation details
 */
export interface LeadScore {
  total: number;            // Total score (0-100)
  breakdown: LeadScoreBreakdown;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  lastCalculated: string;
}

/**
 * Tag for organizing leads
 */
export interface LeadTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
}

/**
 * Custom field definition
 */
export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  options?: string[]; // For select/multiselect types
  required?: boolean;
}

/**
 * Main Lead interface
 */
export interface Lead {
  id: string;

  // Basic Info
  firstName: string;
  lastName: string;
  fullName: string; // Computed: firstName + lastName
  title?: string;   // Job title

  // Contact
  contact: ContactInfo;

  // Company
  company?: CompanyInfo;

  // Pipeline
  status: LeadStatus;
  temperature: LeadTemperature;
  assignedTo?: string;

  // Scoring
  score: LeadScore;

  // Source & Tracking
  source: LeadSource;
  sourceDetails?: string; // e.g., specific LinkedIn search, campaign name
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };

  // Organization
  tags: string[]; // Tag IDs
  lists?: string[]; // List/segment IDs

  // Interactions
  interactions: LeadInteraction[];
  lastInteractionAt?: string;
  nextFollowUpAt?: string;

  // Sequences
  activeSequences: string[]; // Sequence IDs the lead is currently in
  completedSequences: string[];

  // Custom Fields
  customFields?: Record<string, unknown>;

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;

  // LinkedIn Prospecting Data
  linkedinData?: LinkedInProfile;
}

/**
 * LinkedIn profile data from prospecting
 */
export interface LinkedInProfile {
  profileId?: string;
  headline?: string;
  summary?: string;
  location?: string;
  connections?: number;
  profilePictureUrl?: string;
  currentPosition?: {
    title: string;
    company: string;
    startDate?: string;
  };
  education?: Array<{
    school: string;
    degree?: string;
    field?: string;
  }>;
  skills?: string[];
  lastScraped?: string;
}

/**
 * Lead creation input
 */
export interface CreateLeadInput {
  firstName: string;
  lastName: string;
  title?: string;
  contact?: Partial<ContactInfo>;
  company?: Partial<CompanyInfo>;
  source: LeadSource;
  sourceDetails?: string;
  tags?: string[];
  notes?: string;
  customFields?: Record<string, unknown>;
  linkedinData?: LinkedInProfile;
}

/**
 * Lead update input
 */
export interface UpdateLeadInput {
  firstName?: string;
  lastName?: string;
  title?: string;
  contact?: Partial<ContactInfo>;
  company?: Partial<CompanyInfo>;
  status?: LeadStatus;
  temperature?: LeadTemperature;
  assignedTo?: string;
  tags?: string[];
  notes?: string;
  nextFollowUpAt?: string;
  customFields?: Record<string, unknown>;
}

/**
 * Lead filter options for queries
 */
export interface LeadFilter {
  status?: LeadStatus | LeadStatus[];
  temperature?: LeadTemperature | LeadTemperature[];
  source?: LeadSource | LeadSource[];
  tags?: string[];
  assignedTo?: string;
  scoreMin?: number;
  scoreMax?: number;
  createdAfter?: string;
  createdBefore?: string;
  lastInteractionAfter?: string;
  search?: string; // Search in name, email, company
  inSequence?: string; // Sequence ID
  notInSequence?: string;
}

/**
 * Lead list/segment for organizing leads
 */
export interface LeadList {
  id: string;
  name: string;
  description?: string;
  type: 'static' | 'dynamic';
  filter?: LeadFilter; // For dynamic lists
  leadIds?: string[]; // For static lists
  leadCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    leadId: string;
    error: string;
  }>;
}

/**
 * Lead import configuration
 */
export interface LeadImportConfig {
  source: 'csv' | 'linkedin' | 'apollo' | 'hubspot';
  mapping: Record<string, string>; // source field -> lead field
  defaultTags?: string[];
  defaultSource?: LeadSource;
  duplicateHandling: 'skip' | 'update' | 'create_new';
}

/**
 * Helper to create default score
 */
export function createDefaultScore(): LeadScore {
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

/**
 * Helper to calculate score grade
 */
export function calculateScoreGrade(score: number): LeadScore['grade'] {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

/**
 * Helper to compute full name
 */
export function computeFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Default tag colors
 */
export const TAG_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280', // gray
] as const;
