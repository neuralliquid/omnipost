/**
 * Phoenix Rooivalk Leads API
 * POST /api/phoenix/leads - Create a lead from Phoenix form submission
 * GET /api/phoenix/leads - List Phoenix leads with brand filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, getCurrentUserId } from '@/app/api/_utils/auth';
import { leadsClient } from '@/lib/data/leads';
import { calculatePhoenixLeadScore } from '@/lib/scoring/phoenix-scorer';
import featureFlags from '@/lib/featureFlags';
import type { CreateLeadInput, LeadStatus } from '@/types/lead';
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Check if lead management feature is enabled
    if (!featureFlags.leadManagement?.enabled) {
      return NextResponse.json(
        { error: 'Lead management feature is disabled' },
        { status: 403 }
      );
    }

    // Require authentication for listing leads
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const brand = searchParams.get('brand') as PhoenixBrand | null;
    const segment = searchParams.get('segment');
    const status = searchParams.get('status') as LeadStatus | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    // Fetch leads
    const result = await leadsClient.queryLeads(
      status ? { status } : {},
      { page, pageSize: limit }
    );

    // Filter to Phoenix leads only (those with phoenixData in customFields)
    let phoenixLeads = result.leads.filter(
      (lead) => lead.customFields?.phoenixData !== undefined
    );

    // Apply brand filter
    if (brand) {
      phoenixLeads = phoenixLeads.filter(
        (lead) => (lead.customFields?.phoenixData as any)?.brand === brand
      );
    }

    // Apply segment filter
    if (segment) {
      phoenixLeads = phoenixLeads.filter(
        (lead) => (lead.customFields?.phoenixData as any)?.segment === segment
      );
    }

    // Sort by creation date (newest first)
    phoenixLeads.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Transform leads to include phoenixData at top level for convenience
    const transformedLeads = phoenixLeads.map((lead) => ({
      ...lead,
      phoenixData: lead.customFields?.phoenixData,
    }));

    return NextResponse.json({
      data: transformedLeads,
      pagination: {
        page,
        limit,
        total: phoenixLeads.length,
        totalPages: Math.ceil(phoenixLeads.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching Phoenix leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
