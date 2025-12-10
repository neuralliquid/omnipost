/**
 * Form Submissions API Routes
 * GET - List submissions for a form
 * POST - Create new submission (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/app/api/_utils/auth';
import { checkRateLimit, RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { formsClient } from '@/lib/data/forms';
import { leadsClient } from '@/lib/data/leads';
import { sequencesClient } from '@/lib/data/sequences';
import type { CreateLeadInput } from '@/types/lead';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/forms/[id]/submissions
 * List submissions for a form (authenticated)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request, '/api/forms/[id]/submissions', RateLimitPresets.GENERAL);
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests', retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RateLimitPresets.GENERAL.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // Check if form exists
    const form = await formsClient.getForm(id);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const result = await formsClient.getSubmissions(id, {
      page,
      pageSize: Math.min(pageSize, 100),
    });

    return NextResponse.json({
      submissions: result.submissions,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

/**
 * POST /api/forms/[id]/submissions
 * Create a new submission (public endpoint for form submissions)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting - stricter limits for public endpoints to prevent flooding
    const rateLimitResult = checkRateLimit(request, '/api/forms/[id]/submissions/post', RateLimitPresets.PUBLIC_API);
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many submissions. Please try again in a minute.', retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RateLimitPresets.PUBLIC_API.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const { id } = await params;

    // Get form
    const form = await formsClient.getForm(id);
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check if form is published
    if (form.status !== 'published') {
      return NextResponse.json({ error: 'Form is not accepting submissions' }, { status: 400 });
    }

    // Check expiration
    if (form.expiresAt && new Date(form.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Form has expired' }, { status: 400 });
    }

    // Check submission limit
    if (form.submissionLimit && form.metrics.submissions >= form.submissionLimit) {
      return NextResponse.json({ error: 'Form submission limit reached' }, { status: 400 });
    }

    // Check authentication if required
    if (form.requireAuthentication && !(await isAuthenticated())) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const responses = body.responses || body;
    const errors: string[] = [];

    for (const field of form.fields) {
      if (field.validation?.required) {
        const value = responses[field.name];
        if (value === undefined || value === null || value === '') {
          errors.push(`${field.label} is required`);
        }
      }

      // Email validation
      if (field.type === 'email' && responses[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(responses[field.name])) {
          errors.push(`${field.label} must be a valid email address`);
        }
      }

      // Min/max length validation
      if (field.validation?.minLength && responses[field.name]) {
        if (responses[field.name].length < field.validation.minLength) {
          errors.push(`${field.label} must be at least ${field.validation.minLength} characters`);
        }
      }

      if (field.validation?.maxLength && responses[field.name]) {
        if (responses[field.name].length > field.validation.maxLength) {
          errors.push(`${field.label} must be at most ${field.validation.maxLength} characters`);
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 });
    }

    // Extract metadata from headers
    const metadata = {
      ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
      referrer: request.headers.get('referer') ?? undefined,
    };

    // Create submission
    const submission = await formsClient.createSubmission(
      id,
      responses,
      metadata,
      body.startedAt
    );

    // Create lead if integration is enabled
    let leadId: string | undefined;
    if (form.integrations.createLead) {
      try {
        const leadData = extractLeadData(form, responses);
        if (leadData) {
          const createdBy = (await isAuthenticated()) ? await getCurrentUserId() : 'form_submission';
          const lead = await leadsClient.createLead(leadData, createdBy || 'form_submission');
          leadId = lead.id;

          // Add form submission interaction
          await leadsClient.addInteraction(lead.id, {
            type: 'form_submission',
            description: `Submitted form: ${form.name}`,
            metadata: {
              formId: form.id,
              submissionId: submission.id,
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
        }
      } catch (leadError) {
        console.error('Error creating lead from form submission:', leadError);
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      leadId,
      message: form.completionSettings.message || 'Thank you for your submission!',
      redirectUrl: form.completionSettings.redirectUrl,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating submission:', error);
    const message = error instanceof Error ? error.message : 'Failed to create submission';
    return NextResponse.json({ error: message }, { status: 500 });
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
