'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '@/styles/ScrollingHeader.module.css';
import { siteConfig } from '../../data/siteConfig';

interface ScrollingHeaderProps {
  transparent?: boolean;
}

const ScrollingHeader: React.FC<ScrollingHeaderProps> = ({ transparent = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [progress, setProgress] = useState(0);
  const lastScrollYRef = useRef(0);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  // Stable scroll handler using ref instead of state dependency
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollThreshold = 50;
    const lastScrollY = lastScrollYRef.current;

    // Determine if header should be visible based on scroll direction
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down and past threshold - hide header
      setHidden(true);
    } else {
      // Scrolling up - show header
      setHidden(false);
    }

    // Determine if header should have background
    setScrolled(currentScrollY > scrollThreshold);

    // Calculate progress safely
    const scrollHeight = document.documentElement?.scrollHeight ?? 0;
    const clientHeight = window.innerHeight ?? 0;
    const maxScroll = scrollHeight - clientHeight;
    const newProgress = maxScroll > 0 ? Math.min(currentScrollY / maxScroll, 1) : 0;
    setProgress(newProgress);

    lastScrollYRef.current = currentScrollY;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) {
        closeMenu();
      }
    };

    if (menuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the first link in the menu when opened
      const firstLink = menuRef.current?.querySelector('a');
      firstLink?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen, closeMenu]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const navigationItems = siteConfig.navigation;

  const headerClasses = [
    styles.header,
    scrolled ? styles.scrolled : '',
    hidden ? styles.hidden : '',
    transparent && !scrolled ? styles.transparent : '',
    menuOpen ? styles.menuActive : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <header className={headerClasses}>
        <div className={styles.headerContainer}>
          <div className={styles.logoContainer}>
            <Link href="/" className={styles.logoLink}>
              <span className={styles.logoIcon}>O</span>
              <span className={styles.logoText}>{siteConfig.siteName || 'OmniPost'}</span>
            </Link>
          </div>

          <button
            ref={menuButtonRef}
            className={`${styles.mobileMenuButton} ${menuOpen ? styles.active : ''}`}
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="scrolling-header-navigation"
          >
            <span className={styles.menuIcon}></span>
            <span className={styles.menuIcon}></span>
            <span className={styles.menuIcon}></span>
          </button>

          <nav
            ref={menuRef}
            id="scrolling-header-navigation"
            aria-label="Main navigation"
            className={`${styles.navigation} ${menuOpen ? styles.menuOpen : ''}`}
          >
            <ul className={styles.navList}>
              {navigationItems.map(item => (
                <li key={`nav-${item.path}`} className={styles.navItem}>
                  <Link
                    href={item.path}
                    className={`${styles.navLink} ${pathname === item.path ? styles.activeLink : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.name}
                    {pathname === item.path && <span className={styles.activeIndicator}></span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Progress bar on scroll */}
        <div
          className={styles.progressBar}
          style={{
            transform: `scaleX(${progress})`,
          }}
        />
      </header>

      {/* Spacer to prevent content jump */}
      <div className={styles.headerSpacer} />

      {/* Mobile menu overlay */}
      {menuOpen && (
        <button
          type="button"
          className={styles.overlay}
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />
      )}
    </>
  );
};

export default ScrollingHeader;
