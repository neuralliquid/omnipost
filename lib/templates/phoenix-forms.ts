/**
 * Phoenix Rooivalk Lead Capture Form Configurations
 * Pre-built form templates for SkySnare and AeroNet lead capture
 */

import type { CreateFormInput, FormField } from '@/types/survey';
import type { PhoenixBrand, SkySnareSegment, AeroNetSegment } from '@/types/phoenix-rooivalk';

/**
 * Common contact fields
 */
const CONTACT_FIELDS: FormField[] = [
  {
    id: 'firstName',
    type: 'text',
    label: 'First Name',
    required: true,
    placeholder: 'John',
    order: 0,
  },
  {
    id: 'lastName',
    type: 'text',
    label: 'Last Name',
    required: true,
    placeholder: 'Smith',
    order: 1,
  },
  {
    id: 'email',
    type: 'email',
    label: 'Work Email',
    required: true,
    placeholder: 'john@company.com',
    order: 2,
  },
  {
    id: 'phone',
    type: 'phone',
    label: 'Phone Number',
    required: false,
    placeholder: '+1 (555) 123-4567',
    order: 3,
  },
  {
    id: 'company',
    type: 'text',
    label: 'Company/Organization',
    required: true,
    placeholder: 'Acme Inc.',
    order: 4,
  },
  {
    id: 'title',
    type: 'text',
    label: 'Job Title',
    required: false,
    placeholder: 'Director of Operations',
    order: 5,
  },
];

/**
 * SkySnare segment options
 */
const SKYSNARE_SEGMENT_OPTIONS = [
  { value: 'sports_enthusiast', label: 'Sports Enthusiast / Hobbyist' },
  { value: 'training_facility', label: 'Training Facility' },
  { value: 'sports_club', label: 'Sports Club / League' },
  { value: 'event_organizer', label: 'Event Organizer' },
  { value: 'educational', label: 'Educational Institution' },
  { value: 'recreational', label: 'Recreational User' },
];

/**
 * AeroNet segment options
 */
const AERONET_SEGMENT_OPTIONS = [
  { value: 'airport', label: 'Airport' },
  { value: 'critical_infrastructure', label: 'Critical Infrastructure' },
  { value: 'government', label: 'Government Agency' },
  { value: 'military', label: 'Military / Defense' },
  { value: 'corporate_campus', label: 'Corporate Campus' },
  { value: 'stadium_venue', label: 'Stadium / Entertainment Venue' },
  { value: 'port_maritime', label: 'Port / Maritime' },
  { value: 'energy_utility', label: 'Energy / Utility' },
  { value: 'data_center', label: 'Data Center' },
];

/**
 * SkySnare Form Templates
 */
export const SKYSNARE_FORMS: Record<string, CreateFormInput> = {
  /**
   * Demo request form
   */
  demoRequest: {
    name: 'SkySnare Demo Request',
    description: 'Request a product demonstration',
    type: 'form',
    fields: [
      ...CONTACT_FIELDS,
      {
        id: 'segment',
        type: 'select',
        label: 'What best describes you?',
        required: true,
        options: SKYSNARE_SEGMENT_OPTIONS,
        order: 6,
      },
      {
        id: 'useCase',
        type: 'textarea',
        label: 'How do you plan to use SkySnare?',
        required: false,
        placeholder: 'Tell us about your training needs...',
        order: 7,
      },
      {
        id: 'timeline',
        type: 'select',
        label: 'When are you looking to get started?',
        required: true,
        options: [
          { value: 'immediate', label: 'As soon as possible' },
          { value: '1_3_months', label: 'Within 1-3 months' },
          { value: '3_6_months', label: 'Within 3-6 months' },
          { value: 'researching', label: 'Just researching' },
        ],
        order: 8,
      },
      {
        id: 'marketingConsent',
        type: 'checkbox',
        label: 'I agree to receive marketing communications from SkySnare',
        required: false,
        order: 9,
      },
    ],
    settings: {
      submitButtonText: 'Request Demo',
      successMessage: 'Thank you! Our team will contact you within 24 hours to schedule your demo.',
      notifyEmail: 'sales@skysnare.com',
    },
    leadCapture: {
      enabled: true,
      createLead: true,
      defaultSource: 'form',
      defaultTags: ['skysnare', 'demo-request'],
      sequenceId: 'skysnare-demo-followup',
    },
  },

  /**
   * Contact form
   */
  contact: {
    name: 'SkySnare Contact Form',
    description: 'General inquiries and questions',
    type: 'form',
    fields: [
      ...CONTACT_FIELDS,
      {
        id: 'segment',
        type: 'select',
        label: 'What best describes you?',
        required: true,
        options: SKYSNARE_SEGMENT_OPTIONS,
        order: 6,
      },
      {
        id: 'inquiryType',
        type: 'select',
        label: 'How can we help?',
        required: true,
        options: [
          { value: 'product_info', label: 'Product Information' },
          { value: 'pricing', label: 'Pricing' },
          { value: 'partnership', label: 'Partnership Opportunity' },
          { value: 'support', label: 'Customer Support' },
          { value: 'other', label: 'Other' },
        ],
        order: 7,
      },
      {
        id: 'message',
        type: 'textarea',
        label: 'Your Message',
        required: true,
        placeholder: 'Tell us how we can help...',
        order: 8,
      },
      {
        id: 'marketingConsent',
        type: 'checkbox',
        label: 'I agree to receive updates from SkySnare',
        required: false,
        order: 9,
      },
    ],
    settings: {
      submitButtonText: 'Send Message',
      successMessage: 'Thank you for reaching out! We\'ll get back to you within 1-2 business days.',
      notifyEmail: 'info@skysnare.com',
    },
    leadCapture: {
      enabled: true,
      createLead: true,
      defaultSource: 'form',
      defaultTags: ['skysnare', 'inquiry'],
    },
  },

  /**
   * Newsletter signup
   */
  newsletter: {
    name: 'SkySnare Newsletter',
    description: 'Subscribe to product updates and training tips',
    type: 'form',
    fields: [
      {
        id: 'email',
        type: 'email',
        label: 'Email Address',
        required: true,
        placeholder: 'you@example.com',
        order: 0,
      },
      {
        id: 'firstName',
        type: 'text',
        label: 'First Name',
        required: false,
        placeholder: 'John',
        order: 1,
      },
      {
        id: 'interests',
        type: 'multiselect',
        label: 'What interests you most?',
        required: false,
        options: [
          { value: 'product_updates', label: 'Product Updates' },
          { value: 'training_tips', label: 'Training Tips' },
          { value: 'events', label: 'Events & Competitions' },
          { value: 'industry_news', label: 'Industry News' },
        ],
        order: 2,
      },
    ],
    settings: {
      submitButtonText: 'Subscribe',
      successMessage: 'Welcome to the SkySnare community! Check your inbox for a confirmation email.',
    },
    leadCapture: {
      enabled: true,
      createLead: true,
      defaultSource: 'content_engagement',
      defaultTags: ['skysnare', 'newsletter'],
    },
  },

  /**
   * Trial request form
   */
  trialRequest: {
    name: 'SkySnare Free Trial',
    description: 'Request a free trial of SkySnare equipment',
    type: 'form',
    fields: [
      ...CONTACT_FIELDS,
      {
        id: 'segment',
        type: 'select',
        label: 'Organization Type',
        required: true,
        options: SKYSNARE_SEGMENT_OPTIONS,
        order: 6,
      },
      {
        id: 'facilitySize',
        type: 'select',
        label: 'Facility Size',
        required: true,
        options: [
          { value: 'small', label: 'Small (under 5,000 sq ft)' },
          { value: 'medium', label: 'Medium (5,000 - 20,000 sq ft)' },
          { value: 'large', label: 'Large (over 20,000 sq ft)' },
          { value: 'outdoor', label: 'Outdoor Facility' },
        ],
        order: 7,
      },
      {
        id: 'participantCount',
        type: 'number',
        label: 'Average Participants Per Session',
        required: false,
        placeholder: '10',
        order: 8,
      },
      {
        id: 'currentEquipment',
        type: 'textarea',
        label: 'What equipment do you currently use?',
        required: false,
        placeholder: 'Describe your current training setup...',
        order: 9,
      },
      {
        id: 'marketingConsent',
        type: 'checkbox',
        label: 'I agree to receive communications about my trial',
        required: true,
        order: 10,
      },
    ],
    settings: {
      submitButtonText: 'Request Free Trial',
      successMessage: 'Your trial request has been submitted! Our team will contact you within 24 hours.',
      notifyEmail: 'trials@skysnare.com',
    },
    leadCapture: {
      enabled: true,
      createLead: true,
      defaultSource: 'form',
      defaultTags: ['skysnare', 'trial-request', 'high-intent'],
      sequenceId: 'skysnare-demo-followup',
    },
  },
};

/**
 * AeroNet Form Templates
 */
export const AERONET_FORMS: Record<string, CreateFormInput> = {
  /**
   * Technical briefing request
   */
  technicalBriefing: {
    name: 'AeroNet Technical Briefing',
    description: 'Request a confidential technical capabilities briefing',
    type: 'form',
    fields: [
      ...CONTACT_FIELDS,
      {
        id: 'segment',
        type: 'select',
        label: 'Organization Type',
        required: true,
        options: AERONET_SEGMENT_OPTIONS,
        order: 6,
      },
      {
        id: 'orgType',
        type: 'select',
        label: 'Organization Classification',
        required: true,
        options: [
          { value: 'government', label: 'Government' },
          { value: 'private', label: 'Private Sector' },
          { value: 'military', label: 'Military/Defense' },
          { value: 'quasi_government', label: 'Quasi-Government' },
        ],
        order: 7,
      },
      {
        id: 'securityClearance',
        type: 'select',
        label: 'Do you have security clearance?',
        required: false,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'prefer_not_to_say', label: 'Prefer not to say' },
        ],
        order: 8,
      },
      {
        id: 'briefingTopics',
        type: 'multiselect',
        label: 'Topics of Interest',
        required: true,
        options: [
          { value: 'detection', label: 'Detection Capabilities' },
          { value: 'response', label: 'Response Mechanisms' },
          { value: 'integration', label: 'System Integration' },
          { value: 'compliance', label: 'Compliance & Regulatory' },
          { value: 'evidence', label: 'Evidence Management' },
          { value: 'pricing', label: 'Pricing & Deployment' },
        ],
        order: 9,
      },
      {
        id: 'timeline',
        type: 'select',
        label: 'Procurement Timeline',
        required: true,
        options: [
          { value: 'immediate', label: 'Immediate need' },
          { value: 'q1', label: 'This quarter' },
          { value: 'q2', label: 'Next quarter' },
          { value: 'next_fiscal_year', label: 'Next fiscal year' },
          { value: 'evaluating', label: 'Just evaluating' },
        ],
        order: 10,
      },
      {
        id: 'additionalInfo',
        type: 'textarea',
        label: 'Additional Information',
        required: false,
        placeholder: 'Any specific requirements or questions...',
        order: 11,
      },
      {
        id: 'privacyConsent',
        type: 'checkbox',
        label: 'I acknowledge that this briefing may contain confidential information',
        required: true,
        order: 12,
      },
    ],
    settings: {
      submitButtonText: 'Request Briefing',
      successMessage: 'Thank you. A member of our enterprise team will contact you within 24-48 hours to schedule your briefing.',
      notifyEmail: 'enterprise@aeronet.com',
    },
    leadCapture: {
      enabled: true,
      createLead: true,
      defaultSource: 'form',
      defaultTags: ['aeronet', 'technical-briefing', 'enterprise'],
      sequenceId: 'aeronet-enterprise-cold-outreach',
    },
  },

  /**
   * Pilot program application
   */
  pilotApplication: {
    name: 'AeroNet Pilot Program Application',
    description: 'Apply for the AeroNet enterprise pilot program',
    type: 'form',
    fields: [
      ...CONTACT_FIELDS,
      {
        id: 'segment',
        type: 'select',
        label: 'Facility Type',
        required: true,
        options: AERONET_SEGMENT_OPTIONS,
        order: 6,
      },
      {
        id: 'coverageArea',
        type: 'text',
        label: 'Coverage Area Required',
        required: true,
        placeholder: 'e.g., 5 square miles',
        order: 7,
      },
      {
        id: 'existingSystems',
        type: 'multiselect',
        label: 'Existing Security Systems',
        required: false,
        options: [
          { value: 'radar', label: 'Radar Systems' },
          { value: 'camera', label: 'Camera/CCTV' },
          { value: 'access_control', label: 'Access Control' },
          { value: 'perimeter', label: 'Perimeter Detection' },
          { value: 'siem', label: 'SIEM' },
          { value: 'other', label: 'Other' },
        ],
        order: 8,
      },
      {
        id: 'incidentHistory',
        type: 'select',
        label: 'Have you experienced drone-related incidents?',
        required: true,
        options: [
          { value: 'yes_recent', label: 'Yes, within the last year' },
          { value: 'yes_past', label: 'Yes, more than a year ago' },
          { value: 'no', label: 'No' },
          { value: 'concerned', label: 'No, but we\'re concerned about threats' },
        ],
        order: 9,
      },
      {
        id: 'budgetRange',
        type: 'select',
        label: 'Approximate Budget Range',
        required: true,
        options: [
          { value: 'under_100k', label: 'Under $100,000' },
          { value: '100k_500k', label: '$100,000 - $500,000' },
          { value: '500k_1m', label: '$500,000 - $1,000,000' },
          { value: '1m_5m', label: '$1,000,000 - $5,000,000' },
          { value: 'over_5m', label: 'Over $5,000,000' },
        ],
        order: 10,
      },
      {
        id: 'decisionMakers',
        type: 'textarea',
        label: 'Key Decision Makers',
        required: false,
        placeholder: 'Who else will be involved in the evaluation?',
        order: 11,
      },
      {
        id: 'complianceRequirements',
        type: 'multiselect',
        label: 'Compliance Requirements',
        required: false,
        options: [
          { value: 'faa_regulations', label: 'FAA Regulations' },
          { value: 'dhs_requirements', label: 'DHS Requirements' },
          { value: 'military_standards', label: 'Military Standards' },
          { value: 'iso_27001', label: 'ISO 27001' },
          { value: 'soc2', label: 'SOC 2' },
          { value: 'gdpr', label: 'GDPR' },
        ],
        order: 12,
      },
      {
        id: 'nda',
        type: 'checkbox',
        label: 'I am prepared to sign an NDA for detailed technical discussions',
        required: true,
        order: 13,
      },
    ],
    settings: {
      submitButtonText: 'Submit Application',
      successMessage: 'Your pilot program application has been received. An enterprise account manager will contact you within 48 hours.',
      notifyEmail: 'pilots@aeronet.com',
    },
    leadCapture: {
      enabled: true,
      createLead: true,
      defaultSource: 'form',
      defaultTags: ['aeronet', 'pilot-application', 'high-value'],
      sequenceId: 'aeronet-pilot-program',
    },
  },

  /**
   * Partner access request
   */
  partnerAccess: {
    name: 'AeroNet Partner Portal Access',
    description: 'Request access to restricted partner documentation',
    type: 'form',
    fields: [
      ...CONTACT_FIELDS,
      {
        id: 'segment',
        type: 'select',
        label: 'Organization Type',
        required: true,
        options: AERONET_SEGMENT_OPTIONS,
        order: 6,
      },
      {
        id: 'partnerType',
        type: 'select',
        label: 'Partnership Interest',
        required: true,
        options: [
          { value: 'integrator', label: 'Systems Integrator' },
          { value: 'reseller', label: 'Authorized Reseller' },
          { value: 'technology', label: 'Technology Partner' },
          { value: 'consulting', label: 'Security Consulting' },
          { value: 'government', label: 'Government Contractor' },
        ],
        order: 7,
      },
      {
        id: 'reason',
        type: 'textarea',
        label: 'Why are you requesting partner access?',
        required: true,
        placeholder: 'Describe your partnership interest...',
        order: 8,
      },
      {
        id: 'ndaSigned',
        type: 'checkbox',
        label: 'I understand that partner access requires NDA execution',
        required: true,
        order: 9,
      },
    ],
    settings: {
      submitButtonText: 'Request Access',
      successMessage: 'Your access request is being reviewed. You will receive a response within 3-5 business days.',
      notifyEmail: 'partners@aeronet.com',
    },
    leadCapture: {
      enabled: true,
      createLead: true,
      defaultSource: 'form',
      defaultTags: ['aeronet', 'partner-request'],
    },
  },

  /**
   * Site assessment request
   */
  siteAssessment: {
    name: 'AeroNet Site Assessment',
    description: 'Request a professional site security assessment',
    type: 'form',
    fields: [
      ...CONTACT_FIELDS,
      {
        id: 'segment',
        type: 'select',
        label: 'Facility Type',
        required: true,
        options: AERONET_SEGMENT_OPTIONS,
        order: 6,
      },
      {
        id: 'facilityLocation',
        type: 'text',
        label: 'Facility Location (City, State/Country)',
        required: true,
        placeholder: 'New York, NY',
        order: 7,
      },
      {
        id: 'facilitySize',
        type: 'text',
        label: 'Facility Size',
        required: true,
        placeholder: 'e.g., 500 acres, 2 square miles',
        order: 8,
      },
      {
        id: 'preferredDates',
        type: 'textarea',
        label: 'Preferred Assessment Dates',
        required: false,
        placeholder: 'List any preferred dates or date ranges...',
        order: 9,
      },
      {
        id: 'specialRequirements',
        type: 'textarea',
        label: 'Special Requirements or Restrictions',
        required: false,
        placeholder: 'Security clearance requirements, access restrictions, etc.',
        order: 10,
      },
      {
        id: 'consent',
        type: 'checkbox',
        label: 'I authorize AeroNet to conduct a site assessment at my facility',
        required: true,
        order: 11,
      },
    ],
    settings: {
      submitButtonText: 'Request Assessment',
      successMessage: 'Your site assessment request has been received. Our technical team will contact you to schedule the visit.',
      notifyEmail: 'assessments@aeronet.com',
    },
    leadCapture: {
      enabled: true,
      createLead: true,
      defaultSource: 'form',
      defaultTags: ['aeronet', 'site-assessment', 'high-value'],
      sequenceId: 'aeronet-pilot-program',
    },
  },
};

/**
 * Get all form templates for a brand
 */
export function getFormTemplates(brand: PhoenixBrand): Record<string, CreateFormInput> {
  return brand === 'skysnare' ? SKYSNARE_FORMS : AERONET_FORMS;
}

/**
 * Get a specific form template
 */
export function getFormTemplate(
  brand: PhoenixBrand,
  templateKey: string
): CreateFormInput | undefined {
  const templates = getFormTemplates(brand);
  return templates[templateKey];
}
