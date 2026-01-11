'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from '@/styles/Header.module.css';
import { siteConfig } from '../../data/siteConfig';
import { useAuth } from '../providers/AuthProvider';

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

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

  // Get navigation items (already validated by siteConfig)
  const navigationItems = siteConfig.navigation;

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoText}>{siteConfig.siteName || 'Site'}</span>
          </Link>
        </div>

        <button
          ref={menuButtonRef}
          className={styles.mobileMenuButton}
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
        >
          <span className={styles.menuIcon}></span>
          <span className={styles.menuIcon}></span>
          <span className={styles.menuIcon}></span>
        </button>

        <nav
          ref={menuRef}
          id="main-navigation"
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
                </Link>
              </li>
            ))}
            <li className={styles.navItem}>
              {isAuthenticated ? (
                <button onClick={handleLogout} className={styles.authButton}>
                  Logout ({user?.username})
                </button>
              ) : (
                <Link
                  href="/login"
                  className={`${styles.navLink} ${styles.loginLink}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
