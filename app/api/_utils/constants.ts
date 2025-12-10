/**
 * Shared API Constants
 * Centralized validation constants to reduce duplication
 */

import type { LeadSource, LeadStatus, LeadTemperature } from '@/types/lead';
import type { SequenceStatus } from '@/types/sequence';
import type { FormStatus, Form } from '@/types/survey';

// ============ Lead Constants ============

export const VALID_LEAD_STATUSES: readonly LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'nurturing',
] as const;

export const VALID_LEAD_SOURCES: readonly LeadSource[] = [
  'linkedin',
  'linkedin_sales_navigator',
  'website',
  'referral',
  'cold_outreach',
  'content_engagement',
  'survey',
  'form',
  'event',
  'import',
  'manual',
  'other',
] as const;

export const VALID_LEAD_TEMPERATURES: readonly LeadTemperature[] = [
  'cold',
  'warm',
  'hot',
] as const;

// ============ Sequence Constants ============

export const VALID_SEQUENCE_STATUSES: readonly SequenceStatus[] = [
  'draft',
  'active',
  'paused',
  'completed',
  'archived',
] as const;

export const VALID_SEQUENCE_STEP_TYPES = [
  'email',
  'linkedin_message',
  'linkedin_connection',
  'linkedin_view_profile',
  'linkedin_endorse',
  'sms',
  'call',
  'task',
  'wait',
  'condition',
] as const;

// ============ Form Constants ============

export const VALID_FORM_STATUSES: readonly FormStatus[] = [
  'draft',
  'published',
  'closed',
  'archived',
] as const;

export const VALID_FORM_TYPES: readonly Form['type'][] = [
  'form',
  'survey',
  'quiz',
  'poll',
] as const;

export const VALID_FORM_FIELD_TYPES = [
  'text',
  'email',
  'phone',
  'number',
  'textarea',
  'select',
  'multiselect',
  'radio',
  'checkbox',
  'date',
  'time',
  'datetime',
  'file',
  'rating',
  'nps',
  'scale',
  'matrix',
  'hidden',
  'section',
  'page_break',
] as const;
