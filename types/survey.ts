/**
 * Survey/Form Types
 * Defines data structures for surveys, forms, and lead capture
 */

/**
 * Form/Survey status
 */
export type FormStatus = 'draft' | 'published' | 'closed' | 'archived';

/**
 * Field type in a form
 */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'rating'
  | 'nps'
  | 'scale'
  | 'matrix'
  | 'hidden'
  | 'section'
  | 'page_break';

/**
 * Field validation rules
 */
export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string; // Regex pattern
  customMessage?: string;
}

/**
 * Field option for select/radio/checkbox
 */
export interface FieldOption {
  id: string;
  label: string;
  value: string;
  order: number;
  isDefault?: boolean;
}

/**
 * Conditional display logic
 */
export interface ConditionalLogic {
  enabled: boolean;
  action: 'show' | 'hide';
  conditions: Array<{
    fieldId: string;
    operator:
      | 'equals'
      | 'not_equals'
      | 'contains'
      | 'not_contains'
      | 'greater_than'
      | 'less_than'
      | 'is_empty'
      | 'is_not_empty';
    value?: string | number | boolean;
  }>;
  logicType: 'all' | 'any'; // AND vs OR
}

/**
 * Form field definition
 */
export interface FormField {
  id: string;
  type: FormFieldType;
  name: string; // Internal name/key
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean | string[];
  order: number;

  // Type-specific settings
  options?: FieldOption[]; // For select, multiselect, radio, checkbox

  // Rating/Scale settings
  ratingConfig?: {
    min: number;
    max: number;
    minLabel?: string;
    maxLabel?: string;
    showNumbers?: boolean;
    icon?: 'star' | 'heart' | 'number';
  };

  // NPS settings
  npsConfig?: {
    lowLabel?: string; // e.g., "Not at all likely"
    highLabel?: string; // e.g., "Extremely likely"
  };

  // Matrix settings
  matrixConfig?: {
    rows: FieldOption[];
    columns: FieldOption[];
    allowMultiple?: boolean;
  };

  // File upload settings
  fileConfig?: {
    allowedTypes?: string[]; // e.g., ['image/*', 'application/pdf']
    maxSize?: number; // in bytes
    maxFiles?: number;
  };

  // Validation
  validation: FieldValidation;

  // Conditional display
  conditionalLogic?: ConditionalLogic;

  // Lead mapping
  leadField?: string; // Map to lead field: 'firstName', 'lastName', 'contact.email', etc.

  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Form page for multi-page forms
 */
export interface FormPage {
  id: string;
  title?: string;
  description?: string;
  order: number;
  fieldIds: string[];
}

/**
 * Form styling/theme
 */
export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: number;
  buttonStyle: 'filled' | 'outlined';
  logoUrl?: string;
  customCss?: string;
}

/**
 * Form completion settings
 */
export interface FormCompletionSettings {
  redirectUrl?: string;
  showMessage: boolean;
  message?: string;
  showConfetti?: boolean;
}

/**
 * Form notification settings
 */
export interface FormNotificationSettings {
  notifyOnSubmission: boolean;
  notificationEmails: string[];
  slackWebhook?: string;
  includeResponses: boolean;
}

/**
 * Form integration settings
 */
export interface FormIntegrations {
  // Lead creation
  createLead: boolean;
  leadSource?: import('./lead').LeadSource;
  leadTags?: string[];
  assignTo?: string;

  // Sequence enrollment
  enrollInSequence?: string; // Sequence ID

  // External integrations
  webhookUrl?: string;
  zapierWebhook?: string;
  hubspotFormId?: string;
}

/**
 * Main Form/Survey interface
 */
export interface Form {
  id: string;
  name: string;
  description?: string;
  type: 'form' | 'survey' | 'quiz' | 'poll';
  status: FormStatus;

  // Structure
  fields: FormField[];
  pages?: FormPage[];
  isMultiPage: boolean;

  // Appearance
  theme: FormTheme;
  showProgressBar?: boolean;
  showPageNumbers?: boolean;

  // Settings
  allowMultipleSubmissions: boolean;
  requireAuthentication: boolean;
  captchaEnabled: boolean;
  expiresAt?: string;
  submissionLimit?: number;

  // Completion
  completionSettings: FormCompletionSettings;

  // Notifications
  notificationSettings: FormNotificationSettings;

  // Integrations
  integrations: FormIntegrations;

  // Metrics
  metrics: FormMetrics;

  // Metadata
  publicUrl?: string;
  embedCode?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Form metrics/analytics
 */
export interface FormMetrics {
  views: number;
  starts: number;
  submissions: number;
  completionRate: number;
  averageTime: number; // in seconds
  dropoffByField: Record<string, number>;
  submissionsByDate: Record<string, number>;
}

/**
 * Form submission/response
 */
export interface FormSubmission {
  id: string;
  formId: string;

  // Response data
  responses: Record<string, unknown>; // fieldId -> value
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    country?: string;
    city?: string;
  };

  // Scoring (for quizzes)
  score?: number;
  maxScore?: number;
  passed?: boolean;

  // Lead association
  leadId?: string;

  // Timing
  startedAt: string;
  completedAt: string;
  duration: number; // in seconds

  // Status
  isPartial: boolean;
  isSpam: boolean;
}

/**
 * Partial/abandoned submission
 */
export interface PartialSubmission {
  id: string;
  formId: string;
  responses: Record<string, unknown>;
  lastFieldId: string;
  lastActivityAt: string;
  leadId?: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
  };
}

/**
 * Form creation input
 */
export interface CreateFormInput {
  name: string;
  description?: string;
  type: Form['type'];
  fields: Omit<FormField, 'id' | 'createdAt' | 'updatedAt'>[];
  theme?: Partial<FormTheme>;
  integrations?: Partial<FormIntegrations>;
  tags?: string[];
}

/**
 * Form update input
 */
export interface UpdateFormInput {
  name?: string;
  description?: string;
  status?: FormStatus;
  fields?: FormField[];
  theme?: Partial<FormTheme>;
  completionSettings?: Partial<FormCompletionSettings>;
  notificationSettings?: Partial<FormNotificationSettings>;
  integrations?: Partial<FormIntegrations>;
  tags?: string[];
}

/**
 * Helper to create default theme
 */
export function createDefaultTheme(): FormTheme {
  return {
    primaryColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: 8,
    buttonStyle: 'filled',
  };
}

/**
 * Helper to create empty metrics
 */
export function createEmptyFormMetrics(): FormMetrics {
  return {
    views: 0,
    starts: 0,
    submissions: 0,
    completionRate: 0,
    averageTime: 0,
    dropoffByField: {},
    submissionsByDate: {},
  };
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(str: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, char => escapeMap[char] || char);
}

/**
 * Helper to generate embed code
 * Escapes user-provided values to prevent XSS attacks
 */
export function generateEmbedCode(formId: string, baseUrl: string): string {
  // Validate and sanitize inputs
  const safeFormId = escapeHtml(formId);
  const safeBaseUrl = escapeHtml(baseUrl);
  return `<iframe src="${safeBaseUrl}/forms/embed/${safeFormId}" width="100%" height="600" frameborder="0"></iframe>`;
}

/**
 * Common form field templates
 */
export const FIELD_TEMPLATES = {
  contactInfo: [
    {
      type: 'text',
      name: 'firstName',
      label: 'First Name',
      leadField: 'firstName',
      validation: { required: true },
    },
    {
      type: 'text',
      name: 'lastName',
      label: 'Last Name',
      leadField: 'lastName',
      validation: { required: true },
    },
    {
      type: 'email',
      name: 'email',
      label: 'Email',
      leadField: 'contact.email',
      validation: { required: true },
    },
    {
      type: 'phone',
      name: 'phone',
      label: 'Phone',
      leadField: 'contact.phone',
      validation: { required: false },
    },
  ],
  companyInfo: [
    {
      type: 'text',
      name: 'company',
      label: 'Company',
      leadField: 'company.name',
      validation: { required: false },
    },
    {
      type: 'text',
      name: 'jobTitle',
      label: 'Job Title',
      leadField: 'title',
      validation: { required: false },
    },
    {
      type: 'select',
      name: 'companySize',
      label: 'Company Size',
      leadField: 'company.size',
      options: [
        { id: '1', label: '1-10', value: '1-10', order: 1 },
        { id: '2', label: '11-50', value: '11-50', order: 2 },
        { id: '3', label: '51-200', value: '51-200', order: 3 },
        { id: '4', label: '201-500', value: '201-500', order: 4 },
        { id: '5', label: '500+', value: '500+', order: 5 },
      ],
    },
  ],
  npsQuestion: {
    type: 'nps',
    name: 'nps',
    label: 'How likely are you to recommend us to a friend or colleague?',
    npsConfig: {
      lowLabel: 'Not at all likely',
      highLabel: 'Extremely likely',
    },
  },
} as const;

/**
 * Pre-built form templates
 */
export const FORM_TEMPLATES = {
  contactForm: {
    name: 'Contact Form',
    type: 'form' as const,
    description: 'Simple contact form for lead capture',
    fields: ['firstName', 'lastName', 'email', 'phone', 'message'],
  },
  leadMagnet: {
    name: 'Lead Magnet Download',
    type: 'form' as const,
    description: 'Form for gated content downloads',
    fields: ['firstName', 'lastName', 'email', 'company', 'jobTitle'],
  },
  npsSurvey: {
    name: 'NPS Survey',
    type: 'survey' as const,
    description: 'Net Promoter Score survey',
    fields: ['nps', 'feedback'],
  },
  customerFeedback: {
    name: 'Customer Feedback',
    type: 'survey' as const,
    description: 'Collect customer feedback and testimonials',
    fields: ['rating', 'whatDidYouLike', 'whatCanWeImprove', 'testimonial'],
  },
} as const;
