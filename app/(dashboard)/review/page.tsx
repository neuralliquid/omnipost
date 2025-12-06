/**
 * Human Review Page (App Router)
 * Content review and approval workflow
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ReviewWorkflow } from './ReviewWorkflow';
import styles from '@/styles/HumanReview.module.css';

export const metadata: Metadata = {
  title: 'Human Review Interface',
  description: 'Review and approve content before publication across platforms',
};

export default function HumanReviewPage() {
  return (
    <div className={styles.reviewContainer}>
      <h1 className={styles.pageTitle}>Human Review Interface</h1>
      <p className={styles.pageDescription}>
        Review and approve content before publication across platforms
      </p>

      {/* Review workflow component */}
      <ReviewWorkflow />

      {/* Navigation links */}
      <div className={styles.navigationLinks}>
        <Link href="/workflow" className={styles.navLink}>
          &larr; View Content Workflow
        </Link>
        <Link href="/dashboard" className={styles.navLink}>
          View Performance Dashboard &rarr;
        </Link>
      </div>
    </div>
  );
}
