import Airtable, { FieldSet, Records } from 'airtable';
import React, { useEffect, useState } from 'react';
import dashboardStyles from '@/styles/dashboard.module.css';

interface Record {
  id: string;
  fields: {
    Name?: string;
    [key: string]: unknown; // To accommodate any additional fields
  };
}

const AirtableIntegration: React.FC = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const apiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || '';
        const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || '';
        const tableName = process.env.NEXT_PUBLIC_AIRTABLE_TABLE_NAME || '';

        if (!apiKey || !baseId || !tableName) {
          setRecords([]);
          setError('Airtable browser configuration is incomplete.');
          return;
        }

        const base = new Airtable({
          apiKey,
        }).base(baseId);
        const table = base(tableName);

        const records: Records<FieldSet> = await table.select().all();
        setRecords([...records] as Record[]);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  return (
    <div className={dashboardStyles.integrationPanel}>
      <h2>Airtable Integration</h2>
      <p className={dashboardStyles.integrationIntro}>
        Review synced content records from the configured Airtable base.
      </p>
      {error && <p className={dashboardStyles.errorMessage}>Error: {error}</p>}
      {loading && <p className={dashboardStyles.loadingIndicator}>Loading records...</p>}
      {!loading && records.length === 0 && !error && (
        <p className={dashboardStyles.emptyMessage}>No records found</p>
      )}
      <ul className={dashboardStyles.recordList}>
        {records.map(record => (
          <li key={record.id}>{record.fields?.Name || record.id || 'Unnamed record'}</li>
        ))}
      </ul>
    </div>
  );
};

export default AirtableIntegration;
