'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '@/styles/ScrollingHeader.module.css';
import { siteConfig, NavigationItem } from '../../data/siteConfig';

interface ScrollingHeaderProps {
  transparent?: boolean;
}

const ScrollingHeader: React.FC<ScrollingHeaderProps> = ({ transparent = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [progress, setProgress] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const lastScrollYRef = useRef(0);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

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
    setOpenDropdown(null);
    setExpandedMobile(null);
  }, [pathname]);

  // Handle dropdown hover with delay for better UX
  const handleDropdownEnter = (name: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setOpenDropdown(name);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  // Toggle mobile submenu
  const toggleMobileSubmenu = (name: string) => {
    setExpandedMobile(expandedMobile === name ? null : name);
  };

  // Check if a nav item or its children is active
  const isNavItemActive = (item: NavigationItem): boolean => {
    if (pathname === item.path) return true;
    if (item.children) {
      return item.children.some(child => pathname === child.path);
    }
    return false;
  };

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
                <li
                  key={`nav-${item.path}`}
                  className={`${styles.navItem} ${item.children ? styles.hasDropdown : ''}`}
                  onMouseEnter={() => item.children && handleDropdownEnter(item.name)}
                  onMouseLeave={handleDropdownLeave}
                >
                  {item.children ? (
                    <>
                      {/* Desktop dropdown trigger */}
                      <button
                        className={`${styles.navLink} ${styles.dropdownTrigger} ${isNavItemActive(item) ? styles.activeLink : ''}`}
                        aria-expanded={openDropdown === item.name}
                        aria-haspopup="true"
                        onClick={() => toggleMobileSubmenu(item.name)}
                      >
                        {item.name}
                        <svg
                          className={`${styles.dropdownIcon} ${openDropdown === item.name || expandedMobile === item.name ? styles.rotated : ''}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                        {isNavItemActive(item) && <span className={styles.activeIndicator}></span>}
                      </button>

                      {/* Desktop dropdown menu */}
                      <ul
                        className={`${styles.dropdownMenu} ${openDropdown === item.name ? styles.dropdownOpen : ''}`}
                      >
                        {item.children.map(child => (
                          <li key={`dropdown-${child.path}`}>
                            <Link
                              href={child.path}
                              className={`${styles.dropdownLink} ${pathname === child.path ? styles.activeDropdownLink : ''}`}
                              onClick={() => {
                                setMenuOpen(false);
                                setOpenDropdown(null);
                              }}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>

                      {/* Mobile expanded submenu */}
                      <ul
                        className={`${styles.mobileSubmenu} ${expandedMobile === item.name ? styles.mobileSubmenuOpen : ''}`}
                      >
                        {item.children.map(child => (
                          <li key={`mobile-${child.path}`}>
                            <Link
                              href={child.path}
                              className={`${styles.mobileSubmenuLink} ${pathname === child.path ? styles.activeDropdownLink : ''}`}
                              onClick={() => setMenuOpen(false)}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <Link
                      href={item.path}
                      className={`${styles.navLink} ${pathname === item.path ? styles.activeLink : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.name}
                      {pathname === item.path && <span className={styles.activeIndicator}></span>}
                    </Link>
                  )}
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
