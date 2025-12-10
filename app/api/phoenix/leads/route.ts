/**
 * Phoenix Rooivalk Leads API
 * POST /api/phoenix/leads - Create a lead from Phoenix form submission
 * GET /api/phoenix/leads - List Phoenix leads with brand filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAuthenticated } from '@/app/api/_utils/auth';
import { leadsClient } from '@/lib/data/leads';
import { calculatePhoenixLeadScore } from '@/lib/scoring/phoenix-scorer';
import featureFlags from '@/lib/featureFlags';
import { validateEmail } from '@/app/api/_utils/validation';
import { sanitizeText } from '@/app/api/_utils/sanitize';
import { withAuthAndRateLimit } from '@/app/api/_utils/middleware';
import { RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { ErrorResponses } from '@/app/api/_utils/responses';
import { VALID_LEAD_STATUSES } from '@/app/api/_utils/constants';
import type { CreateLeadInput, LeadStatus, Lead, LeadFilter } from '@/types/lead';
import type {
  PhoenixFormSubmission,
  PhoenixBrand,
  SkySnareLeadData,
  AeroNetLeadData,
} from '@/types/phoenix-rooivalk';
import {
  DEFAULT_PHOENIX_CONFIG,
} from '@/types/phoenix-rooivalk';

// Timeline type for safe access
type PurchaseTimeline = 'immediate' | '1_3_months' | '3_6_months' | '6_12_months' | 'researching';
type ProcurementTimeline = 'immediate' | 'q1' | 'q2' | 'q3' | 'q4' | 'next_fiscal_year';

// Type guard for Phoenix leads
interface PhoenixLead extends Lead {
  customFields: {
    phoenixData: SkySnareLeadData | AeroNetLeadData;
    [key: string]: unknown;
  };
}

function isPhoenixLead(lead: Lead): lead is PhoenixLead {
  return !!(
    lead.customFields &&
    typeof lead.customFields === 'object' &&
    'phoenixData' in lead.customFields &&
    lead.customFields.phoenixData !== null &&
    lead.customFields.phoenixData !== undefined
  );
}

// Valid Phoenix brands
const VALID_PHOENIX_BRANDS = ['skysnare', 'aeronet'] as const;

// Zod schema for GET query validation
const getPhoenixLeadsQuerySchema = z.object({
  brand: z.enum(VALID_PHOENIX_BRANDS).optional(),
  segment: z.string().optional().transform((val: string | undefined) => val ? sanitizeText(val) : undefined),
  status: z.enum(VALID_LEAD_STATUSES as unknown as [string, ...string[]]).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

/**
 * POST - Create a new lead from Phoenix form submission
 * Note: This endpoint is publicly accessible for form submissions
 * but includes validation and rate limiting considerations
 */
export async function POST(request: NextRequest) {
  try {
    // Check if lead management feature is enabled
    if (!featureFlags.leadManagement?.enabled) {
      return NextResponse.json(
        { error: 'Lead management feature is disabled' },
        { status: 403 }
      );
    }

    const body: PhoenixFormSubmission = await request.json();

    // Validate required fields
    if (!body.firstName?.trim()) {
      return NextResponse.json(
        { error: 'firstName is required' },
        { status: 400 }
      );
    }

    if (!body.lastName?.trim()) {
      return NextResponse.json(
        { error: 'lastName is required' },
        { status: 400 }
      );
    }

    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 }
      );
    }

    // Validate email format using ReDoS-safe validation
    const emailError = validateEmail('email', body.email);
    if (emailError) {
      return NextResponse.json(
        { error: emailError },
        { status: 400 }
      );
    }

    if (!body.segment) {
      return NextResponse.json(
        { error: 'segment is required' },
        { status: 400 }
      );
    }

    if (!body.brand || !['skysnare', 'aeronet'].includes(body.brand)) {
      return NextResponse.json(
        { error: 'brand must be skysnare or aeronet' },
        { status: 400 }
      );
    }

    // Get brand configuration
    const brand = body.brand;
    const config = DEFAULT_PHOENIX_CONFIG.brands[brand];

    // Build Phoenix-specific data
    let phoenixData: SkySnareLeadData | AeroNetLeadData;

    if (brand === 'skysnare') {
      phoenixData = {
        brand: 'skysnare',
        segment: body.segment as SkySnareLeadData['segment'],
        productInterest: 'considering',
        useCase: body.useCase ? { primaryActivity: body.useCase } : undefined,
        purchaseIntent: body.timeline
          ? { timeline: body.timeline as PurchaseTimeline }
          : undefined,
        demoRequested: body.requestType === 'demo',
        trialRequested: body.requestType === 'pilot',
        newsletterSubscribed: body.marketingConsent,
      };
    } else {
      phoenixData = {
        brand: 'aeronet',
        segment: body.segment as AeroNetLeadData['segment'],
        productInterest: 'considering',
        pilotRequested: body.requestType === 'pilot',
        technicalBriefingRequested: body.requestType === 'info',
        siteAssessmentRequested: false,
        partnersAccessed: body.requestType === 'partner',
        procurement: body.timeline
          ? { timeline: body.timeline as ProcurementTimeline }
          : undefined,
      };
    }

    // Create the lead input
    const leadInput: CreateLeadInput = {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      title: body.title?.trim(),
      contact: {
        email: body.email.trim(),
        phone: body.phone?.trim(),
      },
      company: body.company ? { name: body.company.trim() } : undefined,
      source: 'form',
      sourceDetails: `Phoenix ${brand} - ${body.requestType || 'general'}`,
      tags: config.defaultTags,
      notes: body.message?.trim(),
      customFields: {
        phoenixData,
        utm: body.utm,
        marketingConsent: body.marketingConsent,
        privacyAccepted: body.privacyAccepted,
      },
    };

    // Create the lead (use 'phoenix_form' as the creator for public submissions)
    const lead = await leadsClient.createLead(leadInput, 'phoenix_form');

    // Calculate Phoenix-specific score
    const phoenixLead = { ...lead, phoenixData };
    const score = calculatePhoenixLeadScore(phoenixLead);

    // Update lead with Phoenix score
    await leadsClient.updateLead(lead.id, {
      customFields: {
        ...lead.customFields,
        phoenixData,
        phoenixScore: score,
      },
    });

    // Handle routing based on brand config
    if (brand === 'aeronet') {
      const aeronetRouting = DEFAULT_PHOENIX_CONFIG.routing.aeronet;
      // If AeroNet requires approval, add pending-approval tag
      if (aeronetRouting.requireApproval) {
        const currentTags = lead.tags || [];
        if (!currentTags.includes('pending-approval')) {
          await leadsClient.updateLead(lead.id, {
            tags: [...currentTags, 'pending-approval'],
          });
        }
      }
      // Assign to team member if configured
      if (aeronetRouting.assignTo) {
        await leadsClient.updateLead(lead.id, { assignedTo: aeronetRouting.assignTo });
      }
    } else {
      const skysnareRouting = DEFAULT_PHOENIX_CONFIG.routing.skysnare;
      // Assign to team member if configured
      if (skysnareRouting.assignTo) {
        await leadsClient.updateLead(lead.id, { assignedTo: skysnareRouting.assignTo });
      }
    }

    return NextResponse.json({
      success: true,
      lead: { ...lead, phoenixData, score },
      brand,
      message: `Lead created for ${config.name}`,
    });
  } catch (error) {
    console.error('Error creating Phoenix lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

/**
 * GET - List Phoenix leads with optional brand filtering
 * Requires authentication and rate limiting
 */
export const GET = withAuthAndRateLimit(
  async (request: NextRequest) => {
    // Check if lead management feature is enabled
    if (!featureFlags.leadManagement?.enabled) {
      return ErrorResponses.forbidden('Lead management feature is disabled');
    }

    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryData = {
      brand: searchParams.get('brand') as PhoenixBrand | null,
      segment: searchParams.get('segment'),
      status: searchParams.get('status') as LeadStatus | null,
      page: Number.parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(Number.parseInt(searchParams.get('limit') || '20', 10), 100),
    };

    // Validate using Zod schema
    const parseResult = getPhoenixLeadsQuerySchema.safeParse(queryData);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`);
      return ErrorResponses.badRequest(errors.join('; '));
    }

    const { brand, segment, status, page, limit } = parseResult.data;

    // Fetch leads from upstream with proper filter type
    // After Zod validation, status is guaranteed to be a valid LeadStatus if present
    const filter: LeadFilter | undefined = status ? { status: status as LeadStatus } : undefined;
    const result = await leadsClient.queryLeads(
      filter,
      { page, pageSize: limit }
    );

    // Filter to Phoenix leads only using type guard
    const phoenixLeads = result.leads.filter(isPhoenixLead);

    // Apply brand filter with proper type safety
    let filteredLeads = phoenixLeads;
    if (brand) {
      filteredLeads = phoenixLeads.filter(
        (lead) => lead.customFields.phoenixData.brand === brand
      );
    }

    // Apply segment filter with proper type safety
    if (segment) {
      filteredLeads = filteredLeads.filter(
        (lead) => lead.customFields.phoenixData.segment === segment
      );
    }

    // Sort by creation date (newest first)
    const sortedLeads = filteredLeads.toSorted(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Transform leads to include phoenixData at top level for convenience
    const transformedLeads = sortedLeads.map((lead) => ({
      ...lead,
      phoenixData: lead.customFields.phoenixData,
    }));

    // Calculate total pages from pagination data
    const totalPages = Math.ceil(result.pagination.total / result.pagination.pageSize);
    
    // Return original pagination metadata from upstream with additional filtered count
    return NextResponse.json({
      success: true,
      data: transformedLeads,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.pageSize,
        total: result.pagination.total, // Total from upstream query
        totalPages, // Calculated from total and pageSize
        filteredCount: sortedLeads.length, // Count after Phoenix/brand/segment filters
      },
      message: 'Phoenix leads retrieved successfully',
    });
  },
  '/api/phoenix/leads',
  RateLimitPresets.GENERAL
);
