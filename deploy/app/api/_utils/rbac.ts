import { User } from '../../../lib/auth/auth-service';
import { Errors } from './errors';
import { NextRequest, NextResponse } from 'next/server';

import Airtable, { FieldSet } from 'airtable';

export function withRole(
  role: string,
  handler: (
    req: NextRequest,
    user: User,
    airtableTable: Airtable.Table<FieldSet>
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, user: User, airtableTable: Airtable.Table<FieldSet>) => {
    if (user.role !== role) {
      return Errors.forbidden('You do not have permission to access this resource.');
    }
    return handler(req, user, airtableTable);
  };
}
