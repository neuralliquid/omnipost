/**
 * Outreach Sequence Types
 * Defines data structures for cold outreach, drip campaigns, and automation
 */

/**
 * Sequence status
 */
export type SequenceStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

/**
 * Step type in a sequence
 */
export type SequenceStepType =
  | 'email'
  | 'linkedin_message'
  | 'linkedin_connection'
  | 'linkedin_view_profile'
  | 'linkedin_endorse'
  | 'sms'
  | 'call'
  | 'task'
  | 'wait'
  | 'condition';

/**
 * Delay unit for wait steps
 */
export type DelayUnit = 'minutes' | 'hours' | 'days' | 'weeks';

/**
 * Condition type for branching
 */
export type ConditionType =
  | 'email_opened'
  | 'email_clicked'
  | 'email_replied'
  | 'linkedin_accepted'
  | 'linkedin_replied'
  | 'form_submitted'
  | 'tag_present'
  | 'score_above'
  | 'score_below'
  | 'custom';

/**
 * Template variable for personalization
 */
export interface TemplateVariable {
  name: string;
  defaultValue?: string;
  required: boolean;
}

/**
 * Email template
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // HTML or plain text with {{variables}}
  variables: TemplateVariable[];
  category?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * LinkedIn message template
 */
export interface LinkedInTemplate {
  id: string;
  name: string;
  message: string; // Plain text with {{variables}}
  variables: TemplateVariable[];
  type: 'message' | 'connection_request' | 'inmail';
  characterCount: number; // LinkedIn has limits
  createdAt: string;
  updatedAt: string;
}

/**
 * Wait/delay configuration
 */
export interface WaitConfig {
  duration: number;
  unit: DelayUnit;
  businessDaysOnly?: boolean;
  skipWeekends?: boolean;
  skipHolidays?: boolean;
}

/**
 * Condition configuration for branching
 */
export interface ConditionConfig {
  type: ConditionType;
  operator?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value?: string | number | boolean;
  withinDays?: number; // e.g., "opened email within 3 days"
}

/**
 * Sequence step definition
 */
export interface SequenceStep {
  id: string;
  order: number;
  type: SequenceStepType;
  name: string;
  description?: string;

  // Type-specific configuration
  emailConfig?: {
    templateId?: string;
    subject?: string;
    body?: string;
    fromName?: string;
    replyTo?: string;
    trackOpens?: boolean;
    trackClicks?: boolean;
  };

  linkedinConfig?: {
    templateId?: string;
    message?: string;
    type: 'message' | 'connection_request' | 'inmail' | 'view_profile' | 'endorse';
  };

  smsConfig?: {
    message: string;
  };

  callConfig?: {
    script?: string;
    duration?: number; // expected duration in minutes
  };

  taskConfig?: {
    title: string;
    description?: string;
    assignTo?: string;
    dueInDays?: number;
  };

  waitConfig?: WaitConfig;

  conditionConfig?: {
    condition: ConditionConfig;
    trueStepId?: string;  // Next step if condition is true
    falseStepId?: string; // Next step if condition is false
  };

  // Common settings
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Schedule configuration for sequence sending
 */
export interface SequenceSchedule {
  timezone: string;
  sendingDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  sendingHours: {
    start: string; // HH:mm format, e.g., "09:00"
    end: string;   // HH:mm format, e.g., "17:00"
  };
  maxPerDay?: number;
  maxPerHour?: number;
}

/**
 * Sequence A/B test configuration
 */
export interface SequenceABTest {
  enabled: boolean;
  variants: Array<{
    id: string;
    name: string;
    stepOverrides: Record<string, Partial<SequenceStep>>;
    percentage: number; // Traffic percentage (all variants should sum to 100)
  }>;
  winningMetric: 'open_rate' | 'click_rate' | 'reply_rate' | 'conversion_rate';
  minSampleSize: number;
  autoSelectWinner: boolean;
}

/**
 * Main Sequence interface
 */
export interface Sequence {
  id: string;
  name: string;
  description?: string;
  status: SequenceStatus;

  // Steps
  steps: SequenceStep[];
  entryStepId: string;

  // Targeting
  targetFilter?: import('./lead').LeadFilter;
  excludeFilter?: import('./lead').LeadFilter;

  // Settings
  schedule: SequenceSchedule;
  stopOnReply: boolean;
  stopOnBounce: boolean;
  stopOnUnsubscribe: boolean;
  removeOnComplete: boolean; // Remove lead from sequence when completed

  // Personalization
  senderName?: string;
  senderEmail?: string;
  signature?: string;

  // A/B Testing
  abTest?: SequenceABTest;

  // Metrics
  metrics: SequenceMetrics;

  // Metadata
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Sequence metrics/analytics
 */
export interface SequenceMetrics {
  totalEnrolled: number;
  activeLeads: number;
  completedLeads: number;
  repliedLeads: number;
  bouncedLeads: number;
  unsubscribedLeads: number;
  stoppedLeads: number;

  emailStats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
  };

  linkedinStats: {
    connectionsSent: number;
    connectionsAccepted: number;
    messagesSent: number;
    messagesReplied: number;
    acceptRate: number;
    replyRate: number;
  };

  conversionRate: number;
  averageTimeToReply?: number; // in hours
}

/**
 * Lead enrollment in a sequence
 */
export interface SequenceEnrollment {
  id: string;
  sequenceId: string;
  leadId: string;

  status: 'active' | 'paused' | 'completed' | 'replied' | 'bounced' | 'unsubscribed' | 'stopped';

  currentStepId: string;
  currentStepNumber: number;
  completedSteps: string[]; // Step IDs

  nextActionAt?: string;
  lastActionAt?: string;

  // Step-specific tracking
  stepHistory: Array<{
    stepId: string;
    executedAt: string;
    result: 'success' | 'failed' | 'skipped';
    metadata?: Record<string, unknown>;
  }>;

  // A/B test variant (if applicable)
  abVariantId?: string;

  enrolledAt: string;
  completedAt?: string;
  stoppedAt?: string;
  stoppedReason?: string;

  createdBy: string;
}

/**
 * Sequence creation input
 */
export interface CreateSequenceInput {
  name: string;
  description?: string;
  steps: Omit<SequenceStep, 'id' | 'createdAt' | 'updatedAt'>[];
  schedule?: Partial<SequenceSchedule>;
  stopOnReply?: boolean;
  stopOnBounce?: boolean;
  stopOnUnsubscribe?: boolean;
  senderName?: string;
  senderEmail?: string;
  tags?: string[];
}

/**
 * Sequence update input
 */
export interface UpdateSequenceInput {
  name?: string;
  description?: string;
  status?: SequenceStatus;
  schedule?: Partial<SequenceSchedule>;
  stopOnReply?: boolean;
  stopOnBounce?: boolean;
  stopOnUnsubscribe?: boolean;
  senderName?: string;
  senderEmail?: string;
  tags?: string[];
}

/**
 * Bulk enrollment input
 */
export interface BulkEnrollInput {
  sequenceId: string;
  leadIds: string[];
  startAt?: string; // Optional delayed start
  skipDuplicates?: boolean;
}

/**
 * Helper to create default sequence schedule
 */
export function createDefaultSchedule(): SequenceSchedule {
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sendingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    sendingHours: {
      start: '09:00',
      end: '17:00',
    },
    maxPerDay: 50,
    maxPerHour: 10,
  };
}

/**
 * Helper to create empty metrics
 */
export function createEmptySequenceMetrics(): SequenceMetrics {
  return {
    totalEnrolled: 0,
    activeLeads: 0,
    completedLeads: 0,
    repliedLeads: 0,
    bouncedLeads: 0,
    unsubscribedLeads: 0,
    stoppedLeads: 0,
    emailStats: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
      bounced: 0,
      openRate: 0,
      clickRate: 0,
      replyRate: 0,
    },
    linkedinStats: {
      connectionsSent: 0,
      connectionsAccepted: 0,
      messagesSent: 0,
      messagesReplied: 0,
      acceptRate: 0,
      replyRate: 0,
    },
    conversionRate: 0,
  };
}

/**
 * Calculate delay in milliseconds
 */
export function calculateDelayMs(config: WaitConfig): number {
  const multipliers: Record<DelayUnit, number> = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
  };
  return config.duration * multipliers[config.unit];
}

/**
 * LinkedIn character limits
 */
export const LINKEDIN_LIMITS = {
  connectionRequest: 300,
  message: 8000,
  inMail: 1900,
} as const;

/**
 * Default sequence templates
 */
export const SEQUENCE_TEMPLATES = {
  coldOutreach: {
    name: 'Cold Outreach',
    description: 'Standard cold outreach sequence with email and LinkedIn',
    steps: ['linkedin_view_profile', 'wait', 'linkedin_connection', 'wait', 'email', 'wait', 'email', 'wait', 'linkedin_message'],
  },
  warmFollowUp: {
    name: 'Warm Follow-up',
    description: 'Follow-up sequence for warm leads',
    steps: ['email', 'wait', 'email', 'wait', 'call', 'wait', 'email'],
  },
  reEngagement: {
    name: 'Re-engagement',
    description: 'Re-engage cold leads',
    steps: ['email', 'wait', 'linkedin_message', 'wait', 'email'],
  },
} as const;
