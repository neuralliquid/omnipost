'use client';

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import styles from '@/styles/NotificationSystem.module.css';

interface Notification {
  id: string;
  type: string;
  message: string;
}

/**
 * Validates that the API response is a valid Notification array
 */
function isNotificationArray(data: unknown): data is Notification[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    item =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Notification).id === 'string' &&
      typeof (item as Notification).type === 'string' &&
      typeof (item as Notification).message === 'string'
  );
}

export const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Fetches notifications from the API
   */
  const fetchNotifications = useCallback(async (signal?: AbortSignal): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications', { signal });
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data: unknown = await response.json();

      // Validate response shape before setting state
      if (!isNotificationArray(data)) {
        throw new Error('Invalid response format from notifications API');
      }

      setNotifications(data);
      setError(null);
      return true;
    } catch (err) {
      // Don't set error state if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return false;
      }
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const loadNotifications = async () => {
      setIsLoading(true);
      await fetchNotifications(abortController.signal);
      // Only set loading false if not aborted
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    };

    loadNotifications();

    // Cleanup: abort fetch on unmount
    return () => {
      abortController.abort();
    };
  }, [fetchNotifications]);

  const sendNotification = async (
    type: string,
    recipient: string,
    message: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, recipient, message }),
      });
      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      // Re-fetch the notifications list to get canonical data with IDs
      // This ensures we have the complete Notification object from the server
      await fetchNotifications();

      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Extract and validate form values
    const typeValue = formData.get('type');
    const recipientValue = formData.get('recipient');
    const messageValue = formData.get('message');

    // Validate that values are strings (not null or File)
    if (typeof typeValue !== 'string' || !typeValue.trim()) {
      setValidationError('Type is required');
      return;
    }
    if (typeof recipientValue !== 'string' || !recipientValue.trim()) {
      setValidationError('Recipient is required');
      return;
    }
    if (typeof messageValue !== 'string' || !messageValue.trim()) {
      setValidationError('Message is required');
      return;
    }

    const type = typeValue.trim();
    const recipient = recipientValue.trim();
    const message = messageValue.trim();

    setIsSubmitting(true);
    try {
      const success = await sendNotification(type, recipient, message);
      if (success) {
        form.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeClass = (type: string): string => {
    const baseClass = styles.notificationType;
    const typeClass = styles[type as keyof typeof styles];
    return typeClass ? `${baseClass} ${typeClass}` : baseClass;
  };

  return (
    <div className={styles.notificationSystem}>
      <h2 className={styles.title}>Notification System</h2>
      {error && <p className={styles.error}>Error: {error}</p>}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Send Notification</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          {validationError && <p className={styles.error}>{validationError}</p>}
          <div className={styles.formGroup}>
            <label htmlFor="type" className={styles.label}>
              Type
            </label>
            <select id="type" name="type" required className={styles.select}>
              <option value="email">Email</option>
              <option value="slack">Slack</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="recipient" className={styles.label}>
              Recipient
            </label>
            <input
              type="text"
              id="recipient"
              name="recipient"
              required
              className={styles.input}
              placeholder="Email address or phone number..."
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="message" className={styles.label}>
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              className={styles.textarea}
              placeholder="Enter your notification message..."
            />
          </div>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Notifications</h3>
        {isLoading && <p className={styles.emptyState}>Loading...</p>}
        {!isLoading && notifications.length === 0 && (
          <p className={styles.emptyState}>No notifications yet</p>
        )}
        {!isLoading && notifications.length > 0 && (
          <ul className={styles.notificationList}>
            {notifications.map(notification => (
              <li key={notification.id} className={styles.notificationItem}>
                <span className={getTypeClass(notification.type)}>{notification.type}</span>
                <span className={styles.notificationMessage}>{notification.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationSystem;
