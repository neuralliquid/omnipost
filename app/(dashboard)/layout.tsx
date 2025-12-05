/**
 * Dashboard Layout
 * Layout for authenticated dashboard pages
 */

import styles from '@/styles/shared.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      {children}
    </div>
  );
}
