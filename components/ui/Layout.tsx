'use client';

import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import styles from '@/styles/Layout.module.css';
import { siteConfig } from '../../data/siteConfig';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'Content Workflow Platform',
  description = 'A comprehensive platform for content production workflow and platform analysis',
}) => {
  // Construct full page title with site name
  const pageTitle = title ? `${title} | ${siteConfig.siteName}` : siteConfig.siteName;

  // Use provided description or fall back to site description
  const pageDescription = description || siteConfig.siteDescription;

  // Note: In Next.js App Router, metadata should be handled via generateMetadata or metadata export
  // This component provides a basic layout structure
  return (
    <div
      className={styles.layoutContainer}
      data-title={pageTitle}
      data-description={pageDescription}
    >
      <Header />
      <main className={styles.mainContent}>{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
