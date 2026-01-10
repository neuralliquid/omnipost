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
 * Shared layout component for consistent page structure
 * Uses ScrollingHeader with hide-on-scroll behavior and SharedFooter
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

      <ScrollingHeader transparent={transparentHeader} />

      <main className={styles.mainContent}>{children}</main>

      <SharedFooter />
    </div>
  );
};

export default Layout;
