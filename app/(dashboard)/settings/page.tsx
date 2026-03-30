/**
 * Settings Hub Page
 *
 * Central settings page with links to different settings sections.
 */

'use client';

import Link from 'next/link';
import styles from '@/styles/PlatformSettings.module.css';

interface SettingsSection {
  title: string;
  description: string;
  href: string;
  enabled: boolean;
}

const settingsSections: SettingsSection[] = [
  {
    title: 'Platform Connections',
    description: 'Connect and manage your social media platform accounts.',
    href: '/settings/platforms',
    enabled: true,
  },
  {
    title: 'Account Settings',
    description: 'Update your profile, email, and password.',
    href: '/settings/account',
    enabled: false,
  },
  {
    title: 'Notifications',
    description: 'Configure email and in-app notification preferences.',
    href: '/settings/notifications',
    enabled: false,
  },
];

export function SettingsPage() {
  return (
    <>
      <div className={styles.pageHeader}>
        <h1>Settings</h1>
        <p>Manage your account and platform configurations.</p>
      </div>

      <div className={styles.settingsGrid}>
        {settingsSections.map(section => {
          if (section.enabled) {
            return (
              <Link key={section.href} href={section.href} className={styles.settingsCard}>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </Link>
            );
          }

          return (
            <div
              key={section.href}
              className={`${styles.settingsCard} ${styles.settingsCardDisabled}`}
            >
              <h3>{section.title}</h3>
              <p>{section.description}</p>
              <span className={styles.comingSoon}>Coming Soon</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default SettingsPage;
