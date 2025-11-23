import { NextResponse } from 'next/server';
import { createLogEntry, logToAuditTrail } from '../../_utils/audit';
import { isAuthenticated } from '../../_utils/auth';
import { Errors, withErrorHandling } from '../../_utils/errors';
import { getAirtableTable } from '../../../../lib/airtable';
import featureFlags from '../../../../utils/featureFlags';
import Airtable, { FieldSet, Records } from 'airtable';
import DOMPurify from 'dompurify';

// Interface definitions
interface Pagination {
  page: number;
  pageSize: number;
  hasMorePages: boolean;
  nextToken?: string;
}

interface TrackContentResponse {
  data: Records<FieldSet>;
  pagination: Pagination;
}

// Define our own query params interface to match what Airtable actually expects
interface AirtableQueryParams {
  maxRecords?: number;
  pageSize?: number;
  offset?: string; // Airtable API actually expects string for offset
  view?: string;
  filterByFormula?: string;
  sort?: any[];
  fields?: string[];
}

async function trackContent(
  request: Request,
  airtableTable: Airtable.Table<FieldSet>
): Promise<NextResponse> {
  const url = new URL(request.url);
  const page = url.searchParams.get('page') || '1';
  const pageSize = url.searchParams.get('pageSize') || '20';
  const filter = url.searchParams.get('filter') || '';
  const nextToken = url.searchParams.get('nextToken') || undefined;

  // Parse and validate pagination parameters
  const pageNum = Number.parseInt(page, 10);
  const pageSizeNum = Number.parseInt(pageSize, 10);

  if (Number.isNaN(pageNum) || pageNum < 1) {
    return Errors.badRequest('Invalid page number');
  }

  if (Number.isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
    return Errors.badRequest('Invalid page size (must be between 1-100)');
  }

  // Log the track content request
  await logToAuditTrail(
    await createLogEntry('TRACK_CONTENT', {
      page: pageNum,
      pageSize: pageSizeNum,
      filter: filter || undefined,
      nextToken: nextToken || undefined,
    })
  );

  // Set up query options
  const queryOptions: AirtableQueryParams = {
    maxRecords: pageSizeNum + 1,
    pageSize: pageSizeNum + 1,
  };

  if (nextToken) {
    queryOptions.offset = nextToken;
  }

  // Fetch records from Airtable
  // Use type assertion here since we know our params match what Airtable expects
  let records = await airtableTable.select(queryOptions as any).all();

  // Sanitize filter parameter before use
  const sanitizedFilter = DOMPurify.sanitize(filter);

  // Apply filter if provided
  if (sanitizedFilter && sanitizedFilter.trim() !== '') {
    const filterLower = sanitizedFilter.trim().toLowerCase();
    records = records.filter(record => {
      const content = ((record.fields.Content as string) || '').toLowerCase();
      return content.includes(filterLower);
    });
  }

  // Check if there are more pages
  const hasMore = records.length > pageSizeNum;
  const resultsToReturn = hasMore ? records.slice(0, pageSizeNum) : records;

  // Prepare response
  const response: TrackContentResponse = {
    data: resultsToReturn,
    pagination: {
      page: pageNum,
      pageSize: pageSizeNum,
      hasMorePages: hasMore,
      nextToken: hasMore ? records[pageSizeNum].getId() : undefined,
    },
  };

  // Log successful content tracking
  await logToAuditTrail(
    await createLogEntry('TRACK_CONTENT_SUCCESS', {
      recordCount: resultsToReturn.length,
      hasMore,
    })
  );

  // Return the content records
  return NextResponse.json(response);
}

function withAuthAndFeature(
  featureFlag: keyof typeof featureFlags,
  handler: (request: Request, airtableTable: Airtable.Table<FieldSet>) => Promise<NextResponse>
): (request: Request) => Promise<NextResponse> {
  return async (request: Request) => {
    // Check authentication
    if (!(await isAuthenticated())) {
      return Errors.unauthorized('Authentication required');
    }

    // Check if feature is enabled
    if (!featureFlags[featureFlag]) {
      return Errors.forbidden(`${featureFlag} feature is disabled`);
    }

    try {
      const table = getAirtableTable();
      return handler(request, table);
    } catch (error) {
      return Errors.internalServerError('Airtable integration not available');
    }
  };
}

export const GET = withErrorHandling(withAuthAndFeature('airtableIntegration', trackContent));
