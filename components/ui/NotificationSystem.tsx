'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import styles from '@/styles/NotificationSystem.module.css';

interface Notification {
  id: string;
  type: string;
  message: string;
}

export const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        const data = await response.json();
        setNotifications(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

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
      const data = await response.json();
      // Use functional updater to ensure we have the latest state
      setNotifications(prev => [...prev, data]);
      setError(null);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const type = formData.get('type') as string;
    const recipient = formData.get('recipient') as string;
    const message = formData.get('message') as string;

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
