/**
 * Phoenix Rooivalk Leads API
 * POST /api/phoenix/leads - Create a lead from Phoenix form submission
 * GET /api/phoenix/leads - List Phoenix leads with brand filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { leadsClient } from '@/lib/data/leads';
import { calculatePhoenixLeadScore } from '@/lib/scoring/phoenix-scorer';
import type { CreateLeadInput } from '@/types/lead';
import type {
  PhoenixFormSubmission,
  PhoenixBrand,
  SkySnareLeadData,
  AeroNetLeadData,
  getBrandFromSegment,
  DEFAULT_PHOENIX_CONFIG,
} from '@/types/phoenix-rooivalk';

/**
 * POST - Create a new lead from Phoenix form submission
 */
export async function POST(request: NextRequest) {
  try {
    const body: PhoenixFormSubmission = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email || !body.segment) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, segment' },
        { status: 400 }
      );
    }

    // Determine brand from segment
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
          ? { timeline: body.timeline as SkySnareLeadData['purchaseIntent']['timeline'] }
          : undefined,
        demoRequested: body.requestType === 'demo',
        trialRequested: body.requestType === 'pilot', // "pilot" for consumer is trial
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
          ? { timeline: body.timeline as AeroNetLeadData['procurement']['timeline'] }
          : undefined,
      };
    }

    // Create the lead
    const leadInput: CreateLeadInput = {
      firstName: body.firstName,
      lastName: body.lastName,
      title: body.title,
      contact: {
        email: body.email,
        phone: body.phone,
      },
      company: body.company ? { name: body.company } : undefined,
      source: 'form',
      sourceDetails: `Phoenix ${brand} - ${body.requestType}`,
      tags: config.defaultTags,
      notes: body.message,
      customFields: {
        phoenixData,
        utm: body.utm,
        marketingConsent: body.marketingConsent,
        privacyAccepted: body.privacyAccepted,
      },
    };

    const lead = await leadsClient.create(leadInput);

    // Calculate Phoenix-specific score
    const phoenixLead = { ...lead, phoenixData };
    const score = calculatePhoenixLeadScore(phoenixLead);

    // Update lead with Phoenix score
    await leadsClient.update(lead.id, {
      customFields: {
        ...lead.customFields,
        phoenixData,
        phoenixScore: score,
      },
    });

    // Handle routing based on brand config
    const routing = DEFAULT_PHOENIX_CONFIG.routing[brand];

    // If AeroNet requires approval, add a flag
    if (brand === 'aeronet' && routing.requireApproval) {
      await leadsClient.addTag(lead.id, 'pending-approval');
    }

    // Assign to team member if configured
    if (routing.assignTo) {
      await leadsClient.update(lead.id, { assignedTo: routing.assignTo });
    }

    // TODO: Trigger webhook if configured
    // TODO: Enroll in default sequence if configured

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
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const brand = searchParams.get('brand') as PhoenixBrand | null;
    const segment = searchParams.get('segment');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Fetch all leads
    const { leads } = await leadsClient.list({
      status: status ? (status as any) : undefined,
    });

    // Filter to Phoenix leads only
    let phoenixLeads = leads.filter(
      (lead: any) =>
        lead.customFields?.phoenixData !== undefined
    );

    // Apply brand filter
    if (brand) {
      phoenixLeads = phoenixLeads.filter(
        (lead: any) => lead.customFields?.phoenixData?.brand === brand
      );
    }

    // Apply segment filter
    if (segment) {
      phoenixLeads = phoenixLeads.filter(
        (lead: any) => lead.customFields?.phoenixData?.segment === segment
      );
    }

    // Sort by creation date (newest first)
    phoenixLeads.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedLeads = phoenixLeads.slice(startIndex, startIndex + limit);

    // Transform leads to include phoenixData at top level
    const transformedLeads = paginatedLeads.map((lead: any) => ({
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
