import { NextResponse } from 'next/server';
import { engagementMetrics } from '@/data/engagementMetrics';

export async function GET() {
  return NextResponse.json(engagementMetrics);
}
