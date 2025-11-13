import Airtable, { FieldSet } from 'airtable';

let table: Airtable.Table<FieldSet> | undefined;

function initializeAirtable() {
  if (
    !process.env.AIRTABLE_API_KEY ||
    !process.env.AIRTABLE_BASE_ID ||
    !process.env.AIRTABLE_TABLE_NAME
  ) {
    throw new Error('Missing required Airtable environment variables');
  }

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID
  );
  table = base(process.env.AIRTABLE_TABLE_NAME);
}

export function getAirtableTable(): Airtable.Table<FieldSet> {
  if (!table) {
    initializeAirtable();
  }
  return table!;
}
