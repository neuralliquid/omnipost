'use client';

import React from 'react';
import Link from 'next/link';
import styles from '@/styles/SharedFooter.module.css';
import siteConfig from '../../data/siteConfig.json';

const SharedFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const socialIcons: Record<string, JSX.Element> = {
    twitter: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={styles.socialIcon}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    linkedin: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={styles.socialIcon}>
        <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
      </svg>
    ),
    github: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={styles.socialIcon}>
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  };

  const getSocialUrl = (platform: string, handle: string): string => {
    const baseUrls: Record<string, string> = {
      twitter: 'https://x.com/',
      linkedin: 'https://linkedin.com/in/',
      github: 'https://github.com/',
    };
    return `${baseUrls[platform] || `https://${platform}.com/`}${handle}`;
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Main Footer Content */}
        <div className={styles.footerGrid}>
          {/* Brand Column */}
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.brandLink}>
              <span className={styles.brandIcon}>O</span>
              <span className={styles.brandName}>{siteConfig.siteName}</span>
            </Link>
            <p className={styles.brandDescription}>{siteConfig.siteDescription}</p>
          </div>

          {/* Navigation Column */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>Navigation</h3>
            <ul className={styles.footerLinks}>
              {siteConfig.navigation.slice(0, 4).map(item => (
                <li key={`footer-nav-${item.path}`}>
                  <Link href={item.path} className={styles.footerLink}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools Column */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>Tools</h3>
            <ul className={styles.footerLinks}>
              {siteConfig.navigation.slice(4).map(item => (
                <li key={`footer-tools-${item.path}`}>
                  <Link href={item.path} className={styles.footerLink}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect Column */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>Connect</h3>
            <div className={styles.socialLinks}>
              {Object.entries(siteConfig.social).map(([platform, handle]) => (
                <a
                  key={platform}
                  href={getSocialUrl(platform, handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label={`Follow us on ${platform}`}
                >
                  {socialIcons[platform] || (
                    <span className={styles.socialFallback}>
                      {platform.charAt(0).toUpperCase()}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            &copy; {currentYear} {siteConfig.siteName}. All rights reserved.
          </p>
          <div className={styles.footerMeta}>
            <Link href="/privacy" className={styles.metaLink}>
              Privacy
            </Link>
            <span className={styles.metaDivider}>|</span>
            <Link href="/terms" className={styles.metaLink}>
              Terms
            </Link>
          </div>
        </div>
      </div>

      {/* Back to top button */}
      <button
        className={styles.backToTop}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </footer>
  );
};

export default SharedFooter;
