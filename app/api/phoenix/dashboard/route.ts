/**
 * Phoenix Rooivalk Dashboard API
 * GET /api/phoenix/dashboard
 *
 * Returns aggregated metrics and lead data for the Phoenix dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/app/api/_utils/auth';
import { leadsClient } from '@/lib/data/leads';
import featureFlags from '@/lib/featureFlags';
import type { Lead } from '@/types/lead';
import type { PhoenixBrand, SkySnareLeadData, AeroNetLeadData } from '@/types/phoenix-rooivalk';

interface SegmentBreakdown {
  segment: string;
  count: number;
  qualified: number;
  avgScore: number;
}

interface DashboardMetrics {
  totalLeads: number;
  skysnareLeads: number;
  aeronetLeads: number;
  newThisWeek: number;
  qualifiedLeads: number;
  demosScheduled: number;
  pilotsRequested: number;
  highValuePipeline: number;
  averageScore: number;
  conversionRate: number;
}

// Extended lead type with Phoenix data from customFields
interface PhoenixLeadWithData extends Lead {
  phoenixData: SkySnareLeadData | AeroNetLeadData;
}

export async function GET(request: NextRequest) {
  try {
    // Check if CRM dashboard feature is enabled
    if (!featureFlags.crmDashboard?.enabled) {
      return NextResponse.json(
        { error: 'CRM dashboard feature is disabled' },
        { status: 403 }
      );
    }

    // Require authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const brandFilter = searchParams.get('phoenixBrand') as PhoenixBrand | null;

    // Fetch all leads
    const { leads } = await leadsClient.queryLeads({});

    // Filter to Phoenix leads only (check customFields.phoenixData)
    const phoenixLeads: PhoenixLeadWithData[] = leads
      .filter(lead => lead.customFields?.phoenixData !== undefined)
      .map(lead => ({
        ...lead,
        phoenixData: lead.customFields!.phoenixData as SkySnareLeadData | AeroNetLeadData,
      }));

    // Apply brand filter if specified
    const filteredLeads = brandFilter
      ? phoenixLeads.filter(lead => lead.phoenixData?.brand === brandFilter)
      : phoenixLeads;

    // Calculate date ranges
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Split by brand
    const skysnareLeads = phoenixLeads.filter(l => l.phoenixData?.brand === 'skysnare');
    const aeronetLeads = phoenixLeads.filter(l => l.phoenixData?.brand === 'aeronet');

    // Calculate metrics
    const newThisWeek = filteredLeads.filter(
      l => new Date(l.createdAt) >= oneWeekAgo
    ).length;

    const qualifiedLeads = filteredLeads.filter(
      l => l.status === 'qualified' || l.status === 'proposal' || l.status === 'negotiation'
    ).length;

    // Calculate demos scheduled (SkySnare leads with demo requested)
    const demosScheduled = skysnareLeads.filter(l => {
      const data = l.phoenixData as { demoRequested?: boolean };
      return data?.demoRequested;
    }).length;

    // Calculate pilots requested (AeroNet leads with pilot requested)
    const pilotsRequested = aeronetLeads.filter(l => {
      const data = l.phoenixData as { pilotRequested?: boolean };
      return data?.pilotRequested;
    }).length;

    // High value pipeline (AeroNet with large budgets)
    const highValuePipeline = aeronetLeads.filter(l => {
      const data = l.phoenixData as { procurement?: { budgetRange?: string } };
      const budget = data?.procurement?.budgetRange;
      return budget === 'over_5m' || budget === '1m_5m' || budget === '500k_1m';
    }).length;

    // Average score
    const totalScore = filteredLeads.reduce((sum, l) => sum + l.score.total, 0);
    const averageScore = filteredLeads.length > 0 ? Math.round(totalScore / filteredLeads.length) : 0;

    // Conversion rate (qualified / total)
    const conversionRate =
      filteredLeads.length > 0
        ? Math.round((qualifiedLeads / filteredLeads.length) * 100)
        : 0;

    const metrics: DashboardMetrics = {
      totalLeads: filteredLeads.length,
      skysnareLeads: skysnareLeads.length,
      aeronetLeads: aeronetLeads.length,
      newThisWeek,
      qualifiedLeads,
      demosScheduled,
      pilotsRequested,
      highValuePipeline,
      averageScore,
      conversionRate,
    };

    // Calculate segment breakdowns
    const calculateBreakdown = (leads: PhoenixLeadWithData[]): SegmentBreakdown[] => {
      const segmentMap = new Map<string, { count: number; qualified: number; totalScore: number }>();

      leads.forEach(lead => {
        const segment = lead.phoenixData?.segment || 'unknown';
        const existing = segmentMap.get(segment) || { count: 0, qualified: 0, totalScore: 0 };

        existing.count++;
        if (['qualified', 'proposal', 'negotiation', 'won'].includes(lead.status)) {
          existing.qualified++;
        }
        existing.totalScore += lead.score.total;

        segmentMap.set(segment, existing);
      });

      return Array.from(segmentMap.entries())
        .map(([segment, data]) => ({
          segment,
          count: data.count,
          qualified: data.qualified,
          avgScore: Math.round(data.totalScore / data.count),
        }))
        .sort((a, b) => b.count - a.count);
    };

    const skysnareBreakdown = calculateBreakdown(skysnareLeads);
    const aeronetBreakdown = calculateBreakdown(aeronetLeads);

    // Get recent leads (last 20, sorted by date)
    const recentLeads = [...filteredLeads]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    return NextResponse.json({
      metrics,
      skysnareBreakdown,
      aeronetBreakdown,
      recentLeads,
    });
  } catch (error) {
    console.error('Error fetching Phoenix dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
