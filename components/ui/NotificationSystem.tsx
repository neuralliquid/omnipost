'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import styles from '@/styles/NotificationSystem.module.css';

interface Notification {
  type: string;
  message: string;
}

const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const sendNotification = async (type: string, message: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, message }),
      });
      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
      const data = await response.json();
      setNotifications([...notifications, data]);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const type = formData.get('type') as string;
    const message = formData.get('message') as string;
    sendNotification(type, message);
    form.reset();
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
          <button type="submit" className={styles.submitButton}>
            Send
          </button>
        </form>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Notifications</h3>
        {isLoading ? (
          <p className={styles.emptyState}>Loading...</p>
        ) : notifications.length === 0 ? (
          <p className={styles.emptyState}>No notifications yet</p>
        ) : (
          <ul className={styles.notificationList}>
            {notifications.map((notification, index) => (
              <li
                key={`notif-${notification.type}-${index}`}
                className={styles.notificationItem}
              >
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
