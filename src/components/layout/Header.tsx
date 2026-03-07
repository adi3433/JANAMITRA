/**
 * Header — Top bar with logo, locale toggle, dark mode, nav, mobile menu
 */
'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LanguageIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useLocale } from '@/hooks/useLocale';
import { useJanamitraStore } from '@/lib/store';

const NAV_ITEMS = [
  { href: '/chat', labelEn: 'Chat', labelMl: 'ചാറ്റ്' },
  { href: '/booth', labelEn: 'Booth', labelMl: 'ബൂത്ത്' },
  { href: '/registration', labelEn: 'Registration', labelMl: 'രജിസ്ട്രേഷൻ' },
  { href: '/report', labelEn: 'Report', labelMl: 'റിപ്പോർട്ട്' },
  { href: '/faq', labelEn: 'FAQ', labelMl: 'FAQ' },
];

export function Header() {
  const { locale, toggle, t } = useLocale();
  const toggleDarkMode = useJanamitraStore((s) => s.toggleDarkMode);
  const setDarkMode = useJanamitraStore((s) => s.setDarkMode);
  const darkMode = useJanamitraStore((s) => s.darkMode);
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const stored = localStorage.getItem('janamitra_darkMode');
    if (stored !== null) {
      setDarkMode(stored === 'true');
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
      setDarkMode(true);
    }
  }, [setDarkMode]);

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
  }, [pathname]);

  const isDark = mounted && darkMode;
  const isMl = locale === 'ml';

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
        className="sticky top-0 z-30 border-b border-[var(--border-primary)] bg-[var(--surface-primary)]/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-14 items-center justify-between px-4">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-600)] shadow-sm transition-shadow duration-300 group-hover:shadow-md group-hover:shadow-[var(--color-primary-500)]/30">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-base font-bold text-[var(--text-primary)] leading-tight ${isMl ? 'font-ml' : ''}`}>
                {t.appName}
              </h1>
              <p className="text-[9px] font-medium text-[var(--text-tertiary)] leading-none">SVEEP Kottayam</p>
            </div>
          </Link>

          {/* Center: Nav (desktop) */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <motion.div key={item.href} whileHover="hover" className="relative">
                  <Link
                    href={item.href}
                    className={`relative block rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-[var(--color-primary-500)] bg-[var(--color-primary-500)]/8'
                        : 'text-[var(--text-secondary)] hover:text-[var(--color-primary-500)] hover:bg-[var(--color-primary-500)]/5'
                    } ${isMl ? 'font-ml' : ''}`}
                  >
                    {isMl ? item.labelMl : item.labelEn}
                  </Link>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-1/2 h-0.5 w-[60%] -translate-x-1/2 rounded-full bg-[var(--color-primary-500)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    />
                  )}
                  {!isActive && (
                    <motion.div
                      className="absolute bottom-0 left-1/2 h-0.5 rounded-full bg-[var(--color-primary-500)]"
                      initial={{ width: 0, x: '-50%' }}
                      variants={{
                        hover: { width: '60%', x: '-50%' },
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    />
                  )}
                </motion.div>
              );
            })}
          </nav>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle — pill switch */}
            <motion.button
              onClick={toggleDarkMode}
              className={`relative flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-300 ${isDark
                  ? 'bg-[var(--color-primary-500)] border border-[var(--color-primary-400)]'
                  : 'bg-[var(--color-primary-100)] border border-[var(--color-primary-200)]'
                }`}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[var(--color-primary-500)] shadow-sm"
                animate={{ x: isDark ? 22 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isDark ? 'moon' : 'sun'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDark ? (
                      <MoonIcon className="h-3.5 w-3.5" />
                    ) : (
                      <SunIcon className="h-3.5 w-3.5" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.button>

            {/* Locale toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={toggle}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-primary)] px-2.5 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--color-primary-500)]/5 hover:border-[var(--color-primary-500)]/30 hover:text-[var(--color-primary-600)]"
              aria-label={`Switch to ${locale === 'en' ? 'Malayalam' : 'English'}`}
            >
              <LanguageIcon className="h-3.5 w-3.5" />
              <motion.span
                key={locale}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="text-xs"
              >
                {locale === 'en' ? 'മല' : 'EN'}
              </motion.span>
            </motion.button>

            {/* Settings (desktop) */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden md:block">
              <Link
                href="/settings"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-all duration-200 hover:bg-[var(--color-primary-500)]/5 hover:text-[var(--color-primary-500)]"
                aria-label={t.settings}
              >
                <Cog6ToothIcon className="h-4.5 w-4.5" />
              </Link>
            </motion.div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-tertiary)] transition-colors md:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-20 bg-black md:hidden"
            />
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
              className="fixed left-0 right-0 top-14 z-20 border-b border-[var(--border-primary)] bg-[var(--surface-primary)] p-3 shadow-lg md:hidden"
            >
              <div className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[var(--color-primary-500)]/10 text-[var(--color-primary-500)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)]'
                      } ${isMl ? 'font-ml' : ''}`}
                    >
                      {isMl ? item.labelMl : item.labelEn}
                    </Link>
                  );
                })}
                <Link
                  href="/settings"
                  className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] transition-colors ${isMl ? 'font-ml' : ''}`}
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                  {t.settings}
                </Link>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
