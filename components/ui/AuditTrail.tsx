'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/styles/AuditTrail.module.css';

interface Log {
  timestamp: string;
  action: string;
  user: string;
}

const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/audit');
        if (!response.ok) {
          throw new Error('Failed to fetch audit logs');
        }
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.auditTrail}>
        <h2 className={styles.title}>Audit Trail</h2>
        <p className={styles.emptyState}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.auditTrail}>
      <h2 className={styles.title}>Audit Trail</h2>
      {error && <p className={styles.error}>Error: {error}</p>}
      {logs.length === 0 && !error ? (
        <p className={styles.emptyState}>No audit logs available</p>
      ) : (
        <ul className={styles.logList}>
          {logs.map(log => (
            <li key={`log-${log.timestamp}-${log.action}-${log.user}`} className={styles.logItem}>
              <span className={styles.timestamp}>{log.timestamp}</span>
              <span className={styles.action}>{log.action}</span>
              <span className={styles.user}>by {log.user}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AuditTrail;
