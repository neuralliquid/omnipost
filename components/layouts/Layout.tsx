import React from 'react';
import Head from 'next/head';
import Header from '../ui/Header';
import Footer from '../ui/Footer';
// Shared layout styles used by both components/layouts/Layout.tsx and components/ui/Layout.tsx
// Using MainLayout.module.css as the canonical name for shared layout styling across the app
import styles from '@/styles/MainLayout.module.css';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  ogImage?: string;
}

/**
 * Shared layout component for consistent page structure
 */
const Layout: React.FC<LayoutProps> = ({ children, title, description, ogImage }) => {
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

      <Header />

      <main className={styles.mainContent}>{children}</main>

      <Footer />
    </div>
  );
};

export default Layout;
