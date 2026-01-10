'use client';

import React from 'react';
import Head from 'next/head';
import ScrollingHeader from '../ui/ScrollingHeader';
import SharedFooter from '../ui/SharedFooter';
import styles from '@/styles/MainLayout.module.css';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  ogImage?: string;
  transparentHeader?: boolean;
}

/**
 * Skip to content link for keyboard navigation
 * Hidden until focused, appears at top of page when tabbed to
 */
const SkipToContent: React.FC = () => (
  <a href="#main-content" className={styles.skipLink}>
    Skip to main content
  </a>
);

/**
 * Shared layout component for consistent page structure
 * Uses ScrollingHeader with hide-on-scroll behavior and SharedFooter
 * Includes skip-to-content link for accessibility
 */
const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  description,
  ogImage,
  transparentHeader = false,
}) => {
  return (
    <div className={styles.layoutContainer}>
      <Head>
        <title>{title} | OmniPost</title>
        <meta name="description" content={description || title} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description || title} />
      </Head>

      <SkipToContent />
      <ScrollingHeader transparent={transparentHeader} />

      <main id="main-content" className={styles.mainContent} tabIndex={-1}>
        {children}
      </main>

      <SharedFooter />
    </div>
  );
};

export default Layout;
