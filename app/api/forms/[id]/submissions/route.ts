/**
 * Form Submissions API Routes
 * GET - List submissions for a form
 * POST - Create new submission (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/app/api/_utils/auth';
import { RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { checkRateLimitOrRespond, ErrorResponses, SuccessResponses } from '@/app/api/_utils/responses';
import { validateFormSubmission } from '@/app/api/_utils/validation';
import { formsClient } from '@/lib/data/forms';
import { leadsClient } from '@/lib/data/leads';
import { sequencesClient } from '@/lib/data/sequences';
import type { CreateLeadInput } from '@/types/lead';
import type { Form } from '@/types/survey';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/forms/[id]/submissions
 * List submissions for a form (authenticated)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = checkRateLimitOrRespond(request, '/api/forms/[id]/submissions', RateLimitPresets.GENERAL);
    if (rateLimitResponse) return rateLimitResponse;

    if (!(await isAuthenticated())) {
      return ErrorResponses.unauthorized();
    }

    const { id } = await params;
    const form = await formsClient.getForm(id);
    if (!form) {
      return ErrorResponses.notFound('Form');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const result = await formsClient.getSubmissions(id, {
      page,
      pageSize: Math.min(pageSize, 100),
    });

    return SuccessResponses.ok({
      submissions: result.submissions,
      pagination: result.pagination,
    });
  } catch (error) {
    return ErrorResponses.internalError('Error fetching submissions:', error);
  }
}

/**
 * Validate that a form can accept submissions
 */
function validateFormAcceptsSubmissions(form: Form): NextResponse | null {
  if (form.status !== 'published') {
    return ErrorResponses.badRequest('Form is not accepting submissions');
  }

  if (form.expiresAt && new Date(form.expiresAt) < new Date()) {
    return ErrorResponses.badRequest('Form has expired');
  }

  if (form.submissionLimit && form.metrics.submissions >= form.submissionLimit) {
    return ErrorResponses.badRequest('Form submission limit reached');
  }

  return null;
}

/**
 * Extract metadata from request headers
 */
function extractSubmissionMetadata(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
    referrer: request.headers.get('referer') ?? undefined,
  };
}

/**
 * Create lead from form submission and handle sequence enrollment
 */
async function createLeadFromSubmission(
  form: Form,
  responses: Record<string, unknown>,
  submissionId: string
): Promise<string | undefined> {
  const leadData = extractLeadData(form, responses);
  if (!leadData) return undefined;

  const createdBy = (await isAuthenticated()) ? await getCurrentUserId() : 'form_submission';
  const lead = await leadsClient.createLead(leadData, createdBy || 'form_submission');

  // Add form submission interaction
  await leadsClient.addInteraction(lead.id, {
    type: 'form_submission',
    description: `Submitted form: ${form.name}`,
    metadata: {
      formId: form.id,
      submissionId,
    },
  });

  // Enroll in sequence if configured
  if (form.integrations.enrollInSequence) {
    try {
      await sequencesClient.enrollLead(
        form.integrations.enrollInSequence,
        lead.id,
        createdBy || 'form_submission'
      );
    } catch (enrollError) {
      console.error('Error enrolling lead in sequence:', enrollError);
    }
  }

  return lead.id;
}

/**
 * POST /api/forms/[id]/submissions
 * Create a new submission (public endpoint for form submissions)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = checkRateLimitOrRespond(request, '/api/forms/[id]/submissions/post', RateLimitPresets.PUBLIC_API);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const form = await formsClient.getForm(id);
    if (!form) {
      return ErrorResponses.notFound('Form');
    }

    // Validate form can accept submissions
    const formError = validateFormAcceptsSubmissions(form);
    if (formError) return formError;

    // Check authentication if required
    if (form.requireAuthentication && !(await isAuthenticated())) {
      return ErrorResponses.unauthorized();
    }

    const body = await request.json();
    const responses = body.responses || body;

    // Validate form fields using shared utility
    const errors = validateFormSubmission(form.fields, responses);
    if (errors.length > 0) {
      return ErrorResponses.validationError(errors);
    }

    // Create submission
    const metadata = extractSubmissionMetadata(request);
    const submission = await formsClient.createSubmission(id, responses, metadata, body.startedAt);

    // Create lead if integration is enabled
    let leadId: string | undefined;
    if (form.integrations.createLead) {
      try {
        leadId = await createLeadFromSubmission(form, responses, submission.id);
      } catch (leadError) {
        console.error('Error creating lead from form submission:', leadError);
      }
    }

    return SuccessResponses.created({
      success: true,
      submissionId: submission.id,
      leadId,
      message: form.completionSettings.message || 'Thank you for your submission!',
      redirectUrl: form.completionSettings.redirectUrl,
    });
  } catch (error) {
    return ErrorResponses.internalError('Error creating submission:', error);
  }
}

/**
 * Extract lead data from form responses based on field mappings
 */
function extractLeadData(form: Awaited<ReturnType<typeof formsClient.getForm>>, responses: Record<string, unknown>): CreateLeadInput | null {
  if (!form) return null;

  const leadData: Partial<CreateLeadInput> = {
    source: (form.integrations.leadSource as CreateLeadInput['source']) || 'form',
    sourceDetails: `Form: ${form.name}`,
    tags: form.integrations.leadTags,
  };

  const contact: Record<string, string> = {};
  const company: Record<string, string> = {};

  for (const field of form.fields) {
    if (!field.leadField || responses[field.name] === undefined) continue;

    const value = String(responses[field.name]);

    if (field.leadField === 'firstName') {
      leadData.firstName = value;
    } else if (field.leadField === 'lastName') {
      leadData.lastName = value;
    } else if (field.leadField === 'title') {
      leadData.title = value;
    } else if (field.leadField.startsWith('contact.')) {
      const key = field.leadField.replace('contact.', '');
      contact[key] = value;
    } else if (field.leadField.startsWith('company.')) {
      const key = field.leadField.replace('company.', '');
      company[key] = value;
    }
  }

  // Require at least firstName for a valid lead
  if (!leadData.firstName) {
    return null;
  }

  // Set lastName to empty string if not provided
  if (!leadData.lastName) {
    leadData.lastName = '';
  }

  if (Object.keys(contact).length > 0) {
    leadData.contact = contact;
  }

  if (Object.keys(company).length > 0) {
    leadData.company = company;
  }

  return leadData as CreateLeadInput;
}
