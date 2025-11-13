import { NextResponse } from 'next/server';
import { createLogEntry, logToAuditTrail } from '../../_utils/audit';
import { getCurrentUser } from '../../_utils/auth';
import { Errors, withErrorHandling } from '../../_utils/errors';
import { validateString } from '../../_utils/validation';
import { getAirtableTable } from '../../../../lib/airtable';
import featureFlags from '../../../../utils/featureFlags';
import Airtable, { FieldSet } from 'airtable';
import { withRole } from '../../_utils/rbac';

// Error type guard
function isError(error: unknown): error is Error {
  return error instanceof Error || (typeof error === 'object' &&
         error !== null && 'message' in error);
}

import { User } from '../../../../lib/auth/auth-service';

async function storeContent(request: Request, user: User, airtableTable: Airtable.Table<FieldSet>): Promise<NextResponse> {
    const body = await request.json();
    const { content } = body;

    // Validate input
    const contentError = validateString(content, 'Content');
    if (contentError) {
      return Errors.badRequest(contentError);
    }

    // Log the content storage request
    await logToAuditTrail(await createLogEntry('STORE_CONTENT', { contentLength: content.length }));
    // Store the content in Airtable
    const record = await airtableTable.create({ Content: content });

    // Log successful content storage
    await logToAuditTrail(await createLogEntry('STORE_CONTENT_SUCCESS', { recordId: record.id }));

    // Return success response with 201 Created status
    return NextResponse.json(
      { message: 'Content stored successfully', recordId: record.id },
      { status: 201 }
    );
}

function withAuthAndFeature(
  featureFlag: keyof typeof featureFlags,
  handler: (request: Request, user: any, airtableTable: Airtable.Table<FieldSet>) => Promise<NextResponse>
): (request: Request) => Promise<NextResponse> {
  return async (request: Request) => {
    const user = await getCurrentUser();
    // Check authentication
    if (!user) {
      return Errors.unauthorized('Authentication required');
    }

    // Check if feature is enabled
    if (!featureFlags[featureFlag]) {
      return Errors.forbidden(`${featureFlag} feature is disabled`);
    }

    try {
      const table = getAirtableTable();
      return handler(request, user, table);
    } catch (error) {
      return Errors.internalServerError('Airtable integration not available');
    }
  };
}

export const POST = withErrorHandling(withAuthAndFeature('airtableIntegration', withRole('admin', storeContent)));
