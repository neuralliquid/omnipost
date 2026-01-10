/**
 * Marketing Layout
 * Layout for public-facing marketing pages (landing, about, etc.)
 */

import ScrollingHeader from '@/components/ui/ScrollingHeader';
import SharedFooter from '@/components/ui/SharedFooter';
import styles from '@/styles/MarketingLayout.module.css';

export default function MarketingLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className={styles.layoutContainer}>
      <ScrollingHeader />
      <main className={styles.mainContent}>{children}</main>
      <SharedFooter />
    </div>
  );
}
