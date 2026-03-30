/**
 * Settings Hub Page
 *
 * Central settings page with links to different settings sections.
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
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
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <LoadingSpinner size="lg" label="Loading..." />;
  if (!isAuthenticated) return null;

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
