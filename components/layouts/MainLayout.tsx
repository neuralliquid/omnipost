import React from 'react';
import Head from 'next/head';
import styles from '@/styles/MainLayout.module.css';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title, description }) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description || title} />
      </Head>
      <div className={styles.container}>{children}</div>
    </>
  );
};

export default MainLayout;
