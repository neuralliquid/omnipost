/**
 * Phoenix Rooivalk Lead Capture Form Configurations
 * Pre-built form templates for SkySnare and AeroNet lead capture
 */

import type { CreateFormInput, FormField, FieldOption } from '@/types/survey';
import type { PhoenixBrand } from '@/types/phoenix-rooivalk';

type FormFieldInput = Omit<FormField, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Helper to create options with proper structure
 */
function createOptions(options: { value: string; label: string }[]): FieldOption[] {
  return options.map((opt, index) => ({
    id: `opt-${opt.value}`,
    label: opt.label,
    value: opt.value,
    order: index,
  }));
}

/**
 * Common contact fields
 */
const CONTACT_FIELDS: FormFieldInput[] = [
  {
    type: 'text',
    name: 'firstName',
    label: 'First Name',
    placeholder: 'John',
    order: 0,
    validation: { required: true },
  },
  {
    type: 'text',
    name: 'lastName',
    label: 'Last Name',
    placeholder: 'Smith',
    order: 1,
    validation: { required: true },
  },
  {
    type: 'email',
    name: 'email',
    label: 'Work Email',
    placeholder: 'john@company.com',
    order: 2,
    validation: { required: true },
  },
  {
    type: 'phone',
    name: 'phone',
    label: 'Phone Number',
    placeholder: '+1 (555) 123-4567',
    order: 3,
    validation: { required: false },
  },
  {
    type: 'text',
    name: 'company',
    label: 'Company/Organization',
    placeholder: 'Acme Inc.',
    order: 4,
    validation: { required: true },
  },
  {
    type: 'text',
    name: 'title',
    label: 'Job Title',
    placeholder: 'Director of Operations',
    order: 5,
    validation: { required: false },
  },
];

/**
 * SkySnare segment options
 */
const SKYSNARE_SEGMENT_OPTIONS = createOptions([
  { value: 'sports_enthusiast', label: 'Sports Enthusiast / Hobbyist' },
  { value: 'training_facility', label: 'Training Facility' },
  { value: 'sports_club', label: 'Sports Club / League' },
  { value: 'event_organizer', label: 'Event Organizer' },
  { value: 'educational', label: 'Educational Institution' },
  { value: 'recreational', label: 'Recreational User' },
]);

/**
 * AeroNet segment options
 */
const AERONET_SEGMENT_OPTIONS = createOptions([
  { value: 'airport', label: 'Airport' },
  { value: 'critical_infrastructure', label: 'Critical Infrastructure' },
  { value: 'government', label: 'Government Agency' },
  { value: 'military', label: 'Military / Defense' },
  { value: 'corporate_campus', label: 'Corporate Campus' },
  { value: 'stadium_venue', label: 'Stadium / Entertainment Venue' },
  { value: 'port_maritime', label: 'Port / Maritime' },
  { value: 'energy_utility', label: 'Energy / Utility' },
  { value: 'data_center', label: 'Data Center' },
]);

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
        type: 'select',
        name: 'segment',
        label: 'What best describes you?',
        options: SKYSNARE_SEGMENT_OPTIONS,
        order: 6,
        validation: { required: true },
      },
      {
        type: 'textarea',
        name: 'useCase',
        label: 'How do you plan to use SkySnare?',
        placeholder: 'Tell us about your training needs...',
        order: 7,
        validation: { required: false },
      },
      {
        type: 'select',
        name: 'timeline',
        label: 'When are you looking to get started?',
        options: createOptions([
          { value: 'immediate', label: 'As soon as possible' },
          { value: '1_3_months', label: 'Within 1-3 months' },
          { value: '3_6_months', label: 'Within 3-6 months' },
          { value: 'researching', label: 'Just researching' },
        ]),
        order: 8,
        validation: { required: true },
      },
      {
        type: 'checkbox',
        name: 'marketingConsent',
        label: 'I agree to receive marketing communications from SkySnare',
        order: 9,
        validation: { required: false },
      },
    ],
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
        type: 'select',
        name: 'segment',
        label: 'What best describes you?',
        options: SKYSNARE_SEGMENT_OPTIONS,
        order: 6,
        validation: { required: true },
      },
      {
        type: 'select',
        name: 'inquiryType',
        label: 'How can we help?',
        options: createOptions([
          { value: 'product_info', label: 'Product Information' },
          { value: 'pricing', label: 'Pricing' },
          { value: 'partnership', label: 'Partnership Opportunity' },
          { value: 'support', label: 'Customer Support' },
          { value: 'other', label: 'Other' },
        ]),
        order: 7,
        validation: { required: true },
      },
      {
        type: 'textarea',
        name: 'message',
        label: 'Your Message',
        placeholder: 'Tell us how we can help...',
        order: 8,
        validation: { required: true },
      },
      {
        type: 'checkbox',
        name: 'marketingConsent',
        label: 'I agree to receive updates from SkySnare',
        order: 9,
        validation: { required: false },
      },
    ],
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
        type: 'email',
        name: 'email',
        label: 'Email Address',
        placeholder: 'you@example.com',
        order: 0,
        validation: { required: true },
      },
      {
        type: 'text',
        name: 'firstName',
        label: 'First Name',
        placeholder: 'John',
        order: 1,
        validation: { required: false },
      },
      {
        type: 'multiselect',
        name: 'interests',
        label: 'What interests you most?',
        options: createOptions([
          { value: 'product_updates', label: 'Product Updates' },
          { value: 'training_tips', label: 'Training Tips' },
          { value: 'events', label: 'Events & Competitions' },
          { value: 'industry_news', label: 'Industry News' },
        ]),
        order: 2,
        validation: { required: false },
      },
    ],
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
        type: 'select',
        name: 'segment',
        label: 'Organization Type',
        options: SKYSNARE_SEGMENT_OPTIONS,
        order: 6,
        validation: { required: true },
      },
      {
        type: 'select',
        name: 'facilitySize',
        label: 'Facility Size',
        options: createOptions([
          { value: 'small', label: 'Small (under 5,000 sq ft)' },
          { value: 'medium', label: 'Medium (5,000 - 20,000 sq ft)' },
          { value: 'large', label: 'Large (over 20,000 sq ft)' },
          { value: 'outdoor', label: 'Outdoor Facility' },
        ]),
        order: 7,
        validation: { required: true },
      },
      {
        type: 'number',
        name: 'participantCount',
        label: 'Average Participants Per Session',
        placeholder: '10',
        order: 8,
        validation: { required: false },
      },
      {
        type: 'textarea',
        name: 'currentEquipment',
        label: 'What equipment do you currently use?',
        placeholder: 'Describe your current training setup...',
        order: 9,
        validation: { required: false },
      },
      {
        type: 'checkbox',
        name: 'marketingConsent',
        label: 'I agree to receive communications about my trial',
        order: 10,
        validation: { required: true },
      },
    ],
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
        type: 'select',
        name: 'segment',
        label: 'Organization Type',
        options: AERONET_SEGMENT_OPTIONS,
        order: 6,
        validation: { required: true },
      },
      {
        type: 'select',
        name: 'orgType',
        label: 'Organization Classification',
        options: createOptions([
          { value: 'government', label: 'Government' },
          { value: 'private', label: 'Private Sector' },
          { value: 'military', label: 'Military/Defense' },
          { value: 'quasi_government', label: 'Quasi-Government' },
        ]),
        order: 7,
        validation: { required: true },
      },
      {
        type: 'select',
        name: 'securityClearance',
        label: 'Do you have security clearance?',
        options: createOptions([
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'prefer_not_to_say', label: 'Prefer not to say' },
        ]),
        order: 8,
        validation: { required: false },
      },
      {
        type: 'multiselect',
        name: 'briefingTopics',
        label: 'Topics of Interest',
        options: createOptions([
          { value: 'detection', label: 'Detection Capabilities' },
          { value: 'response', label: 'Response Mechanisms' },
          { value: 'integration', label: 'System Integration' },
          { value: 'compliance', label: 'Compliance & Regulatory' },
          { value: 'evidence', label: 'Evidence Management' },
          { value: 'pricing', label: 'Pricing & Deployment' },
        ]),
        order: 9,
        validation: { required: true },
      },
      {
        type: 'select',
        name: 'timeline',
        label: 'Procurement Timeline',
        options: createOptions([
          { value: 'immediate', label: 'Immediate need' },
          { value: 'q1', label: 'This quarter' },
          { value: 'q2', label: 'Next quarter' },
          { value: 'next_fiscal_year', label: 'Next fiscal year' },
          { value: 'evaluating', label: 'Just evaluating' },
        ]),
        order: 10,
        validation: { required: true },
      },
      {
        type: 'textarea',
        name: 'additionalInfo',
        label: 'Additional Information',
        placeholder: 'Any specific requirements or questions...',
        order: 11,
        validation: { required: false },
      },
      {
        type: 'checkbox',
        name: 'privacyConsent',
        label: 'I acknowledge that this briefing may contain confidential information',
        order: 12,
        validation: { required: true },
      },
    ],
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
        type: 'select',
        name: 'segment',
        label: 'Facility Type',
        options: AERONET_SEGMENT_OPTIONS,
        order: 6,
        validation: { required: true },
      },
      {
        type: 'text',
        name: 'coverageArea',
        label: 'Coverage Area Required',
        placeholder: 'e.g., 5 square miles',
        order: 7,
        validation: { required: true },
      },
      {
        type: 'multiselect',
        name: 'existingSystems',
        label: 'Existing Security Systems',
        options: createOptions([
          { value: 'radar', label: 'Radar Systems' },
          { value: 'camera', label: 'Camera/CCTV' },
          { value: 'access_control', label: 'Access Control' },
          { value: 'perimeter', label: 'Perimeter Detection' },
          { value: 'siem', label: 'SIEM' },
          { value: 'other', label: 'Other' },
        ]),
        order: 8,
        validation: { required: false },
      },
      {
        type: 'select',
        name: 'incidentHistory',
        label: 'Have you experienced drone-related incidents?',
        options: createOptions([
          { value: 'yes_recent', label: 'Yes, within the last year' },
          { value: 'yes_past', label: 'Yes, more than a year ago' },
          { value: 'no', label: 'No' },
          { value: 'concerned', label: "No, but we're concerned about threats" },
        ]),
        order: 9,
        validation: { required: true },
      },
      {
        type: 'select',
        name: 'budgetRange',
        label: 'Approximate Budget Range',
        options: createOptions([
          { value: 'under_100k', label: 'Under $100,000' },
          { value: '100k_500k', label: '$100,000 - $500,000' },
          { value: '500k_1m', label: '$500,000 - $1,000,000' },
          { value: '1m_5m', label: '$1,000,000 - $5,000,000' },
          { value: 'over_5m', label: 'Over $5,000,000' },
        ]),
        order: 10,
        validation: { required: true },
      },
      {
        type: 'textarea',
        name: 'decisionMakers',
        label: 'Key Decision Makers',
        placeholder: 'Who else will be involved in the evaluation?',
        order: 11,
        validation: { required: false },
      },
      {
        type: 'multiselect',
        name: 'complianceRequirements',
        label: 'Compliance Requirements',
        options: createOptions([
          { value: 'faa_regulations', label: 'FAA Regulations' },
          { value: 'dhs_requirements', label: 'DHS Requirements' },
          { value: 'military_standards', label: 'Military Standards' },
          { value: 'iso_27001', label: 'ISO 27001' },
          { value: 'soc2', label: 'SOC 2' },
          { value: 'gdpr', label: 'GDPR' },
        ]),
        order: 12,
        validation: { required: false },
      },
      {
        type: 'checkbox',
        name: 'nda',
        label: 'I am prepared to sign an NDA for detailed technical discussions',
        order: 13,
        validation: { required: true },
      },
    ],
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
        type: 'select',
        name: 'segment',
        label: 'Organization Type',
        options: AERONET_SEGMENT_OPTIONS,
        order: 6,
        validation: { required: true },
      },
      {
        type: 'select',
        name: 'partnerType',
        label: 'Partnership Interest',
        options: createOptions([
          { value: 'integrator', label: 'Systems Integrator' },
          { value: 'reseller', label: 'Authorized Reseller' },
          { value: 'technology', label: 'Technology Partner' },
          { value: 'consulting', label: 'Security Consulting' },
          { value: 'government', label: 'Government Contractor' },
        ]),
        order: 7,
        validation: { required: true },
      },
      {
        type: 'textarea',
        name: 'reason',
        label: 'Why are you requesting partner access?',
        placeholder: 'Describe your partnership interest...',
        order: 8,
        validation: { required: true },
      },
      {
        type: 'checkbox',
        name: 'ndaSigned',
        label: 'I understand that partner access requires NDA execution',
        order: 9,
        validation: { required: true },
      },
    ],
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
        type: 'select',
        name: 'segment',
        label: 'Facility Type',
        options: AERONET_SEGMENT_OPTIONS,
        order: 6,
        validation: { required: true },
      },
      {
        type: 'text',
        name: 'facilityLocation',
        label: 'Facility Location (City, State/Country)',
        placeholder: 'New York, NY',
        order: 7,
        validation: { required: true },
      },
      {
        type: 'text',
        name: 'facilitySize',
        label: 'Facility Size',
        placeholder: 'e.g., 500 acres, 2 square miles',
        order: 8,
        validation: { required: true },
      },
      {
        type: 'textarea',
        name: 'preferredDates',
        label: 'Preferred Assessment Dates',
        placeholder: 'List any preferred dates or date ranges...',
        order: 9,
        validation: { required: false },
      },
      {
        type: 'textarea',
        name: 'specialRequirements',
        label: 'Special Requirements or Restrictions',
        placeholder: 'Security clearance requirements, access restrictions, etc.',
        order: 10,
        validation: { required: false },
      },
      {
        type: 'checkbox',
        name: 'consent',
        label: 'I authorize AeroNet to conduct a site assessment at my facility',
        order: 11,
        validation: { required: true },
      },
    ],
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
