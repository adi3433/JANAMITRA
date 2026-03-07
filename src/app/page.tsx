/**
 * Landing Page — Janamitra
 * ──────────────────────
 * Government-branded hero with official trust indicators,
 * quick action entry points, stats counters, and animated feature cards.
 * Inspired by sveepkottayam.dev design language.
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  IdentificationIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { Header } from '@/components/layout/Header';
import { ParallaxBackground } from '@/components/layout/ParallaxBackground';
import { useLocale } from '@/hooks/useLocale';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  },
};

const features = [
  {
    icon: ChatBubbleLeftRightIcon,
    href: '/chat',
    labelEn: 'AI Chat Assistant',
    labelMl: 'AI ചാറ്റ് സഹായി',
    descEn: 'Ask questions about voter registration, elections, and more.',
    descMl: 'വോട്ടർ രജിസ്ട്രേഷൻ, തിരഞ്ഞെടുപ്പ് എന്നിവയെക്കുറിച്ച് ചോദ്യങ്ങൾ ചോദിക്കുക.',
    gradient: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: MapPinIcon,
    href: '/booth',
    labelEn: 'Polling Booth Locator',
    labelMl: 'പോളിംഗ് ബൂത്ത് ലൊക്കേറ്റർ',
    descEn: 'Find your polling booth on an interactive map with directions.',
    descMl: 'മാപ്പിൽ നിങ്ങളുടെ പോളിംഗ് ബൂത്ത് കണ്ടെത്തുക.',
    gradient: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: IdentificationIcon,
    href: '/registration',
    labelEn: 'Check Registration',
    labelMl: 'രജിസ്ട്രേഷൻ പരിശോധിക്കുക',
    descEn: 'Verify your voter registration status instantly.',
    descMl: 'നിങ്ങളുടെ വോട്ടർ രജിസ്ട്രേഷൻ സ്ഥിതി ഉടൻ പരിശോധിക്കുക.',
    gradient: 'from-violet-500 to-violet-600',
    bgLight: 'bg-violet-50 dark:bg-violet-900/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: ExclamationTriangleIcon,
    href: '/report',
    labelEn: 'Report Violation',
    labelMl: 'ലംഘനം റിപ്പോർട്ട് ചെയ്യുക',
    descEn: 'Report election violations with photo/video evidence.',
    descMl: 'ഫോട്ടോ/വീഡിയോ തെളിവുകൾ ഉപയോഗിച്ച് ലംഘനങ്ങൾ റിപ്പോർട്ട് ചെയ്യുക.',
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    icon: QuestionMarkCircleIcon,
    href: '/faq',
    labelEn: 'FAQ Hub',
    labelMl: 'പൊതു ചോദ്യങ്ങൾ',
    descEn: 'Browse frequently asked questions about elections.',
    descMl: 'തിരഞ്ഞെടുപ്പിനെക്കുറിച്ചുള്ള പൊതു ചോദ്യങ്ങൾ ബ്രൗസ് ചെയ്യുക.',
    gradient: 'from-cyan-500 to-cyan-600',
    bgLight: 'bg-cyan-50 dark:bg-cyan-900/20',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    icon: ShieldCheckIcon,
    href: '/settings',
    labelEn: 'Privacy & Settings',
    labelMl: 'സ്വകാര്യതയും ക്രമീകരണങ്ങളും',
    descEn: 'Manage language, accessibility, and data preferences.',
    descMl: 'ഭാഷ, പ്രവേശനക്ഷമത, ഡാറ്റ മുൻഗണനകൾ നിയന്ത്രിക്കുക.',
    gradient: 'from-slate-500 to-slate-600',
    bgLight: 'bg-slate-50 dark:bg-slate-800/30',
    iconColor: 'text-slate-600 dark:text-slate-400',
  },
];

const stats = [
  { valueEn: '9', valueMl: '9', labelEn: 'Constituencies', labelMl: 'നിയോജകമണ്ഡലങ്ങൾ' },
  { valueEn: '1,500+', valueMl: '1,500+', labelEn: 'Polling Booths', labelMl: 'പോളിംഗ് ബൂത്തുകൾ' },
  { valueEn: '24/7', valueMl: '24/7', labelEn: 'AI Assistance', labelMl: 'AI സഹായം' },
  { valueEn: '2', valueMl: '2', labelEn: 'Languages', labelMl: 'ഭാഷകൾ' },
];

export default function Home() {
  const { locale, t } = useLocale();
  const isMl = locale === 'ml';

  return (
    <>
      <ParallaxBackground />
      <Header />
      <main className="relative min-h-screen">
        {/* Government Banner */}
        <div className="bg-[var(--color-primary-600)] text-white">
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 py-1.5 text-[11px] font-medium">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            <span>{isMl ? 'SVEEP ഇനിഷ്യേറ്റീവ് — ഇന്ത്യൻ തിരഞ്ഞെടുപ്പ് കമ്മീഷൻ' : 'SVEEP Initiative — Election Commission of India'}</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="mx-auto max-w-5xl px-4 pt-16 pb-12 text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-500)]/10 px-4 py-1.5 text-xs font-semibold text-[var(--badge-text)] border border-[var(--color-primary-500)]/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isMl ? 'കോട്ടയം ജില്ല' : 'Kottayam District'}
              </span>
            </motion.div>

            <motion.div variants={fadeUp} className="mb-2">
              <p className={`text-sm font-semibold uppercase tracking-widest text-[var(--color-primary-500)] ${isMl ? 'font-ml' : ''}`}>
                {isMl ? 'SVEEP കോട്ടയം' : 'SVEEP Kottayam'}
              </p>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className={`text-4xl font-extrabold tracking-tight text-[var(--color-neutral-900)] sm:text-5xl lg:text-6xl ${isMl ? 'font-ml' : ''}`}
            >
              {t.appName}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className={`mx-auto mt-4 max-w-2xl text-lg text-[var(--color-neutral-500)] leading-relaxed ${isMl ? 'font-ml' : ''}`}
            >
              {t.tagline}
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                href="/chat"
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-primary-500)]/25 transition-all hover:shadow-xl hover:shadow-[var(--color-primary-500)]/30 hover:-translate-y-0.5"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                {isMl ? 'ചാറ്റ് ആരംഭിക്കുക' : 'Start Chat'}
              </Link>
              <Link
                href="/booth"
                className="inline-flex items-center gap-2.5 rounded-xl border border-[var(--color-neutral-200)] bg-[var(--surface-primary)] px-7 py-3.5 text-sm font-semibold text-[var(--color-neutral-700)] shadow-sm transition-all hover:bg-[var(--color-neutral-50)] hover:shadow-md hover:-translate-y-0.5"
              >
                <MapPinIcon className="h-5 w-5" />
                {isMl ? 'ബൂത്ത് കണ്ടെത്തുക' : 'Find Booth'}
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[var(--color-neutral-400)]"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                {isMl ? 'സുരക്ഷിത വെബ്‌സൈറ്റ്' : 'Secure & Private'}
              </span>
              <span className="h-3 w-px bg-[var(--color-neutral-200)]" />
              <span className="flex items-center gap-1.5">
                <BuildingOffice2Icon className="h-3.5 w-3.5 text-[var(--color-primary-400)]" />
                {isMl ? 'സർക്കാർ പരിശോധിച്ചത്' : 'Government Verified'}
              </span>
              <span className="h-3 w-px bg-[var(--color-neutral-200)]" />
              <span>{isMl ? 'ഡാറ്റ സംരക്ഷണം ഉറപ്പ്' : 'Data Protection Compliant'}</span>
            </motion.div>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-[var(--color-neutral-100)] bg-[var(--surface-primary)]/60 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4 py-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={staggerContainer}
              className="grid grid-cols-2 gap-6 sm:grid-cols-4"
            >
              {stats.map((stat, i) => (
                <motion.div key={i} variants={fadeUp} className="text-center">
                  <p className="text-2xl font-extrabold text-[var(--color-primary-500)] sm:text-3xl">
                    {isMl ? stat.valueMl : stat.valueEn}
                  </p>
                  <p className={`mt-1 text-xs font-medium text-[var(--color-neutral-500)] ${isMl ? 'font-ml' : ''}`}>
                    {isMl ? stat.labelMl : stat.labelEn}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className={`text-2xl font-bold text-[var(--color-neutral-900)] ${isMl ? 'font-ml' : ''}`}>
              {isMl ? 'എന്തൊക്കെ ചെയ്യാം' : 'What You Can Do'}
            </h2>
            <p className={`mt-2 text-sm text-[var(--color-neutral-500)] ${isMl ? 'font-ml' : ''}`}>
              {isMl ? 'നിങ്ങളുടെ വോട്ടർ അവകാശങ്ങൾ എളുപ്പത്തിൽ ആക്‌സസ് ചെയ്യുക' : 'Access your voter rights and services easily'}
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.href} variants={fadeUp}>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Link
                      href={feature.href}
                      className="group block rounded-2xl border border-[var(--color-neutral-100)] bg-[var(--surface-primary)] p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-[var(--color-primary-500)]/10 hover:border-[var(--color-primary-300)]"
                    >
                      <div
                        className={`inline-flex rounded-xl p-3 transition-transform duration-300 group-hover:scale-110 ${feature.bgLight}`}
                      >
                        <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                      </div>
                      <h3 className={`mt-4 text-base font-semibold text-[var(--color-neutral-800)] ${isMl ? 'font-ml' : ''}`}>
                        {isMl ? feature.labelMl : feature.labelEn}
                      </h3>
                      <p className={`mt-1.5 text-sm text-[var(--color-neutral-500)] leading-relaxed ${isMl ? 'font-ml' : ''}`}>
                        {isMl ? feature.descMl : feature.descEn}
                      </p>
                    </Link>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Helpline Section */}
        <section className="border-t border-[var(--color-neutral-100)] bg-[var(--color-primary-50)]/50">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className={`text-xl font-bold text-[var(--color-neutral-900)] ${isMl ? 'font-ml' : ''}`}>
                {isMl ? 'സഹായം ആവശ്യമുണ്ടോ?' : 'Need Help?'}
              </h2>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
                <a
                  href="tel:1950"
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-neutral-200)] bg-[var(--surface-primary)] px-5 py-3 font-medium text-[var(--color-neutral-700)] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <PhoneIcon className="h-4 w-4 text-emerald-500" />
                  <span>1950</span>
                  <span className="text-xs text-[var(--color-neutral-400)]">({isMl ? 'വോട്ടർ ഹെൽപ്ലൈൻ' : 'Voter Helpline'})</span>
                </a>
                <a
                  href="mailto:ceo@kerala.gov.in"
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-neutral-200)] bg-[var(--surface-primary)] px-5 py-3 font-medium text-[var(--color-neutral-700)] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <EnvelopeIcon className="h-4 w-4 text-[var(--color-primary-500)]" />
                  <span>ceo@kerala.gov.in</span>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--color-neutral-100)] bg-[var(--surface-primary)]">
          <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="grid gap-8 sm:grid-cols-3">
              {/* Branding */}
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-primary-500)]">
                    <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{t.appName}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">SVEEP Kottayam</p>
                  </div>
                </div>
                <p className={`mt-3 text-xs text-[var(--color-neutral-400)] leading-relaxed ${isMl ? 'font-ml' : ''}`}>
                  {isMl
                    ? 'ഇന്ത്യൻ തിരഞ്ഞെടുപ്പ് കമ്മീഷന്റെ SVEEP ഇനിഷ്യേറ്റീവ്. ജനാധിപത്യ ശാക്തീകരണം, ഓരോ വോട്ടിലും.'
                    : 'Election Commission of India — SVEEP Initiative. Empowering Democracy, One Vote at a Time.'}
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {isMl ? 'ക്വിക്ക് ലിങ്കുകൾ' : 'Quick Links'}
                </p>
                <ul className="mt-3 space-y-2">
                  {[
                    { href: '/chat', label: isMl ? 'AI ചാറ്റ്' : 'AI Chat' },
                    { href: '/booth', label: isMl ? 'ബൂത്ത് ലൊക്കേറ്റർ' : 'Booth Locator' },
                    { href: '/registration', label: isMl ? 'രജിസ്ട്രേഷൻ' : 'Registration' },
                    { href: '/faq', label: isMl ? 'FAQ' : 'FAQ' },
                  ].map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={`text-xs text-[var(--color-neutral-500)] hover:text-[var(--color-primary-500)] transition-colors ${isMl ? 'font-ml' : ''}`}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {isMl ? 'ബന്ധപ്പെടുക' : 'Contact'}
                </p>
                <ul className="mt-3 space-y-2 text-xs text-[var(--color-neutral-500)]">
                  <li className="flex items-center gap-2">
                    <BuildingOffice2Icon className="h-3.5 w-3.5 text-[var(--color-neutral-400)]" />
                    <span>{isMl ? 'ജില്ലാ കളക്ട്രേറ്റ്, കോട്ടയം' : 'District Collectorate, Kottayam'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <PhoneIcon className="h-3.5 w-3.5 text-[var(--color-neutral-400)]" />
                    <a href="tel:1950" className="hover:text-[var(--color-primary-500)] transition-colors">1950 ({isMl ? 'വോട്ടർ ഹെൽപ്ലൈൻ' : 'Voter Helpline'})</a>
                  </li>
                  <li className="flex items-center gap-2">
                    <EnvelopeIcon className="h-3.5 w-3.5 text-[var(--color-neutral-400)]" />
                    <a href="mailto:ceo@kerala.gov.in" className="hover:text-[var(--color-primary-500)] transition-colors">ceo@kerala.gov.in</a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-8 border-t border-[var(--color-neutral-100)] pt-6">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <p className="text-[11px] text-[var(--color-neutral-400)]">
                  &copy; {new Date().getFullYear()} SVEEP Kottayam District | Election Commission of India
                </p>
                <div className="flex items-center gap-4 text-[11px] text-[var(--color-neutral-400)]">
                  <a href="https://eci.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-primary-500)] transition-colors">
                    {isMl ? 'ECI' : 'Election Commission'}
                  </a>
                  <a href="https://nvsp.in" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-primary-500)] transition-colors">
                    NVSP
                  </a>
                  <Link href="/settings" className="hover:text-[var(--color-primary-500)] transition-colors">
                    {isMl ? 'സ്വകാര്യത' : 'Privacy'}
                  </Link>
                </div>
              </div>
              <p className="mt-3 text-center text-[10px] text-[var(--color-neutral-300)]">
                Powered by IIIT Kottayam
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}