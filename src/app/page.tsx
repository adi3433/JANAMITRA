/**
 * Landing Page — Janamitra
 * ──────────────────────
 * Government-branded hero with official trust indicators,
 * quick action entry points, stats counters, and animated feature cards.
 * Inspired by sveepkottayam.dev design language.
 */
'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
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
  ClipboardDocumentCheckIcon,
  HandRaisedIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  MegaphoneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { Header } from '@/components/layout/Header';
import { ParallaxBackground } from '@/components/layout/ParallaxBackground';
import { FloatingChatButton } from '@/components/layout/FloatingChatButton';
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
        {/* Latest Updates Ticker */}
        <LatestUpdatesTicker isMl={isMl} />

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
                className="inline-flex items-center gap-2.5 rounded-md bg-[var(--color-primary-500)] px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[var(--color-primary-600)] hover:shadow-lg hover:-translate-y-0.5"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                {isMl ? 'ചാറ്റ് ആരംഭിക്കുക' : 'Start Chat'}
              </Link>
              <Link
                href="/booth"
                className="inline-flex items-center gap-2.5 rounded-md border border-[var(--color-primary-500)] bg-transparent px-7 py-3.5 text-sm font-semibold text-[var(--color-primary-500)] transition-all hover:bg-[var(--color-primary-500)]/5 hover:shadow-md hover:-translate-y-0.5"
              >
                <MapPinIcon className="h-5 w-5" />
                {isMl ? 'ബൂത്ത് കണ്ടെത്തുക' : 'Find Booth'}
              </Link>
            </motion.div>

            {/* Partnership Ribbon — Trust Logos */}
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8"
            >
              <div className="flex items-center gap-2.5 rounded-[10px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-3 shadow-sm">
                <Image src="/ec-logo.png" alt="Election Commission of India" width={32} height={32} className="h-8 w-8 object-contain" />
                <div className="text-left">
                  <p className="text-[10px] font-semibold text-[var(--text-primary)]">{isMl ? 'തിരഞ്ഞെടുപ്പ് കമ്മീഷൻ' : 'Election Commission'}</p>
                  <p className="text-[9px] text-[var(--text-tertiary)]">{isMl ? 'ഇന്ത്യ' : 'of India'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-[10px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-3 shadow-sm">
                <Image src="/sveep-logo.png" alt="SVEEP" width={32} height={32} className="h-8 w-8 object-contain" />
                <div className="text-left">
                  <p className="text-[10px] font-semibold text-[var(--text-primary)]">SVEEP</p>
                  <p className="text-[9px] text-[var(--text-tertiary)]">{isMl ? 'കോട്ടയം ജില്ല' : 'Kottayam District'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-[10px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-3 shadow-sm">
                <Image src="/iiit-kottayam-logo.png" alt="IIIT Kottayam" width={32} height={32} className="h-8 w-8 object-contain" />
                <div className="text-left">
                  <p className="text-[10px] font-semibold text-[var(--text-primary)]">IIIT Kottayam</p>
                  <p className="text-[9px] text-[var(--text-tertiary)]">{isMl ? 'സാങ്കേതിക പങ്കാളി' : 'Technology Partner'}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-[var(--border-primary)] bg-[var(--surface-tertiary)]">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={staggerContainer}
              className="grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
              {stats.map((stat, i) => (
                <motion.div key={i} variants={fadeUp} className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5 text-center shadow-sm">
                  <p className="text-3xl font-extrabold text-[var(--color-primary-500)] sm:text-4xl">
                    {isMl ? stat.valueMl : stat.valueEn}
                  </p>
                  <p className={`mt-2 text-xs font-medium text-[var(--text-secondary)] ${isMl ? 'font-ml' : ''}`}>
                    {isMl ? stat.labelMl : stat.labelEn}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Voter Journey — Process Path Animation */}
        <VoterJourney isMl={isMl} />

        {/* Voter Services Grid */}
        <VoterServicesGrid isMl={isMl} />

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
                      className="feature-card group block rounded-xl border border-[var(--border-primary)] border-l-4 border-l-[var(--color-primary-500)] bg-[var(--surface-primary)] p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[var(--color-primary-300)]"
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
        <section className="border-t border-[var(--border-primary)] bg-[var(--color-primary-50)]">
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
                  className="flex items-center gap-2 rounded-[10px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-5 py-3 font-medium text-[var(--text-primary)] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <PhoneIcon className="h-4 w-4 text-emerald-500" />
                  <span>1950</span>
                  <span className="text-xs text-[var(--color-neutral-400)]">({isMl ? 'വോട്ടർ ഹെൽപ്ലൈൻ' : 'Voter Helpline'})</span>
                </a>
                <a
                  href="mailto:ceo@kerala.gov.in"
                  className="flex items-center gap-2 rounded-[10px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-5 py-3 font-medium text-[var(--text-primary)] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <EnvelopeIcon className="h-4 w-4 text-[var(--color-primary-500)]" />
                  <span>ceo@kerala.gov.in</span>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[var(--color-neutral-800)] text-[var(--color-neutral-300)]">
          {/* Tricolor Top Border */}
          <div className="flex h-1">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>

          {/* Main Footer Content */}
          <div className="mx-auto max-w-6xl px-4 pt-10 pb-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

              {/* Column 1: About */}
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-neutral-700)]">
                    <Image src="/janamitra.jpg" alt="Janamitra" width={40} height={40} className="h-10 w-10 object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.appName}</p>
                    <p className="text-[10px] text-[var(--color-neutral-400)]">SVEEP Kottayam District</p>
                  </div>
                </div>
                <p className={`text-xs leading-relaxed text-[var(--color-neutral-400)] ${isMl ? 'font-ml' : ''}`}>
                  {isMl
                    ? 'കോട്ടയം ജില്ലയിലെ വോട്ടർമാർക്കായുള്ള AI അധിഷ്ഠിത ദ്വിഭാഷാ വിവര സഹായി. ഇന്ത്യൻ തിരഞ്ഞെടുപ്പ് കമ്മീഷന്റെ SVEEP പദ്ധതിയുടെ ഭാഗമായി IIIT കോട്ടയം വികസിപ്പിച്ചത്.'
                    : 'AI-powered bilingual voter information assistant for Kottayam district. Developed by IIIT Kottayam under the SVEEP initiative of the Election Commission of India.'}
                </p>
                {/* Partner Logos */}
                <div className="mt-4 flex items-center gap-3">
                  <Image src="/ec-logo.png" alt="Election Commission of India" width={28} height={28} className="h-7 w-7 object-contain opacity-70" />
                  <Image src="/sveep-logo.png" alt="SVEEP" width={28} height={28} className="h-7 w-7 object-contain opacity-70" />
                  <Image src="/iiit-kottayam-logo.png" alt="IIIT Kottayam" width={28} height={28} className="h-7 w-7 object-contain opacity-70" />
                </div>
              </div>

              {/* Column 2: Quick Links */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-neutral-500)] mb-4">
                  {isMl ? 'ക്വിക്ക് ലിങ്കുകൾ' : 'Quick Links'}
                </p>
                <ul className="space-y-2.5">
                  {[
                    { href: '/chat', label: isMl ? 'AI ചാറ്റ്' : 'AI Chat' },
                    { href: '/booth', label: isMl ? 'ബൂത്ത് ലൊക്കേറ്റർ' : 'Booth Locator' },
                    { href: '/registration', label: isMl ? 'രജിസ്ട്രേഷൻ പരിശോധന' : 'Registration Check' },
                    { href: '/report', label: isMl ? 'ലംഘനം റിപ്പോർട്ട്' : 'Report Violation' },
                    { href: '/faq', label: isMl ? 'പതിവ് ചോദ്യങ്ങൾ' : 'FAQ' },
                    { href: '/settings', label: isMl ? 'ക്രമീകരണങ്ങൾ' : 'Settings' },
                  ].map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={`text-xs text-[var(--color-neutral-400)] hover:text-white transition-colors ${isMl ? 'font-ml' : ''}`}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Official Resources */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-neutral-500)] mb-4">
                  {isMl ? 'ഔദ്യോഗിക ഉറവിടങ്ങൾ' : 'Official Resources'}
                </p>
                <ul className="space-y-2.5">
                  {[
                    { href: 'https://eci.gov.in', label: isMl ? 'ഇന്ത്യൻ തിരഞ്ഞെടുപ്പ് കമ്മീഷൻ' : 'Election Commission of India' },
                    { href: 'https://www.nvsp.in', label: isMl ? 'ദേശീയ വോട്ടർ സേവന പോർട്ടൽ' : 'National Voter Service Portal' },
                    { href: 'https://ceokerala.gov.in', label: isMl ? 'CEO കേരള' : 'CEO Kerala' },
                    { href: 'https://voters.eci.gov.in', label: isMl ? 'വോട്ടർ പോർട്ടൽ' : 'Voter Portal' },
                    { href: 'https://electoralsearch.eci.gov.in', label: isMl ? 'വോട്ടർ തിരയൽ' : 'Electoral Search' },
                  ].map((link) => (
                    <li key={link.href}>
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 text-xs text-[var(--color-neutral-400)] hover:text-white transition-colors ${isMl ? 'font-ml' : ''}`}>
                        <GlobeAltIcon className="h-3 w-3 shrink-0" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 4: Contact */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-neutral-500)] mb-4">
                  {isMl ? 'ബന്ധപ്പെടുക' : 'Contact'}
                </p>
                <ul className="space-y-3 text-xs">
                  <li className="flex items-start gap-2">
                    <BuildingOffice2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-neutral-500)]" />
                    <span className={isMl ? 'font-ml' : ''}>{isMl ? 'ജില്ലാ കളക്ട്രേറ്റ്, കോട്ടയം, കേരള 686001' : 'District Collectorate, Kottayam, Kerala 686001'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-[var(--color-neutral-500)]" />
                    <div>
                      <a href="tel:1950" className="hover:text-white transition-colors">1950</a>
                      <span className="text-[var(--color-neutral-500)]"> | </span>
                      <a href="tel:18004251950" className="hover:text-white transition-colors">1800-425-1950</a>
                      <span className="text-[var(--color-neutral-600)] text-[10px]"> ({isMl ? 'ടോൾ ഫ്രീ' : 'Toll Free'})</span>
                    </div>
                  </li>
                  <li className="flex items-center gap-2">
                    <EnvelopeIcon className="h-3.5 w-3.5 shrink-0 text-[var(--color-neutral-500)]" />
                    <a href="mailto:ceo@kerala.gov.in" className="hover:text-white transition-colors">ceo@kerala.gov.in</a>
                  </li>
                </ul>

                {/* Policy Links */}
                <div className="mt-5 pt-4 border-t border-[var(--color-neutral-800)]">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-neutral-500)] mb-3">
                    {isMl ? 'നയങ്ങൾ' : 'Policies'}
                  </p>
                  <ul className="space-y-2">
                    {[
                      { href: '/settings', label: isMl ? 'സ്വകാര്യതാ നയം' : 'Privacy Policy' },
                      { href: '/faq', label: isMl ? 'ഉപയോഗ നിബന്ധനകൾ' : 'Terms of Use' },
                      { href: '/settings', label: isMl ? 'പ്രവേശനക്ഷമത' : 'Accessibility' },
                    ].map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className={`flex items-center gap-1.5 text-[11px] text-[var(--color-neutral-500)] hover:text-white transition-colors ${isMl ? 'font-ml' : ''}`}>
                          <DocumentTextIcon className="h-3 w-3 shrink-0" />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[var(--color-neutral-800)]">
            <div className="mx-auto max-w-6xl px-4 py-4">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <div className="text-center sm:text-left">
                  <p className="text-[11px] text-[var(--color-neutral-500)]">
                    &copy; {new Date().getFullYear()} {isMl ? 'SVEEP കോട്ടയം ജില്ല' : 'SVEEP Kottayam District'} | {isMl ? 'ഇന്ത്യൻ തിരഞ്ഞെടുപ്പ് കമ്മീഷൻ' : 'Election Commission of India'}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-0.5 sm:items-end">
                  <p className="text-[11px] text-[var(--color-neutral-500)]">
                    {isMl ? 'സാങ്കേതിക സഹായം:' : 'Powered by'} <span className="font-medium text-[var(--color-neutral-400)]">IIIT Kottayam</span>
                  </p>
                  <p className="text-[10px] text-[var(--color-neutral-600)]">
                    {isMl ? 'SVEEP ഇനിഷ്യേറ്റീവിന് കീഴിൽ' : 'Under SVEEP Initiative'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tricolor Bottom Border */}
          <div className="flex h-1">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>
        </footer>

        <FloatingChatButton />
      </main>
    </>
  );
}

/* ── Voter Journey Component ─────────────────────────────────── */

const journeySteps = [
  {
    icon: ClipboardDocumentCheckIcon,
    labelEn: 'Register',
    labelMl: 'രജിസ്റ്റർ ചെയ്യുക',
    descEn: 'Verify your voter registration or register as a new voter on the NVSP portal.',
    descMl: 'NVSP പോർട്ടലിൽ നിങ്ങളുടെ വോട്ടർ രജിസ്ട്രേഷൻ പരിശോധിക്കുക.',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    ring: 'ring-blue-500/20',
  },
  {
    icon: MapPinIcon,
    labelEn: 'Find Your Booth',
    labelMl: 'ബൂത്ത് കണ്ടെത്തുക',
    descEn: 'Locate your polling booth on the interactive map and get directions.',
    descMl: 'ഇന്ററാക്ടീവ് മാപ്പിൽ നിങ്ങളുടെ പോളിംഗ് ബൂത്ത് കണ്ടെത്തുക.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    ring: 'ring-emerald-500/20',
  },
  {
    icon: HandRaisedIcon,
    labelEn: 'Cast Your Vote',
    labelMl: 'വോട്ട് ചെയ്യുക',
    descEn: 'Exercise your democratic right on election day. Every vote counts!',
    descMl: 'തിരഞ്ഞെടുപ്പ് ദിനത്തിൽ നിങ്ങളുടെ ജനാധിപത്യ അവകാശം വിനിയോഗിക്കുക!',
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    ring: 'ring-amber-500/20',
  },
];

function VoterJourney({ isMl }: { isMl: boolean }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.85', 'end 0.5'],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section ref={containerRef} className="mx-auto max-w-5xl px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className={`text-2xl font-bold text-[var(--color-neutral-900)] ${isMl ? 'font-ml' : ''}`}>
          {isMl ? 'നിങ്ങളുടെ വോട്ടിംഗ് യാത്ര' : 'Your Voting Journey'}
        </h2>
        <p className={`mt-2 text-sm text-[var(--color-neutral-500)] ${isMl ? 'font-ml' : ''}`}>
          {isMl ? 'മൂന്ന് ലളിത ഘട്ടങ്ങളിൽ' : 'Three simple steps to make your voice heard'}
        </p>
      </motion.div>

      <div className="relative mx-auto max-w-2xl">
        {/* Vertical progress line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[var(--color-neutral-100)] sm:left-1/2 sm:-translate-x-px" />
        <motion.div
          className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-blue-500 via-emerald-500 to-amber-500 sm:left-1/2 sm:-translate-x-px"
          style={{ height: lineHeight }}
        />

        {journeySteps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`relative flex items-start gap-4 pb-12 sm:pb-16 ${
                i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
              }`}
            >
              {/* Step number circle */}
              <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-[var(--surface-primary)] bg-[var(--surface-primary)] shadow-md ring-4 ${step.ring} sm:absolute sm:left-1/2 sm:-translate-x-1/2`}>
                <Icon className={`h-5 w-5 ${step.color}`} />
              </div>

              {/* Content card */}
              <div className={`flex-1 rounded-xl border border-[var(--color-neutral-100)] bg-[var(--surface-primary)] p-5 shadow-sm sm:w-[calc(50%-2.5rem)] ${
                i % 2 === 0 ? 'sm:mr-auto sm:pr-8' : 'sm:ml-auto sm:pl-8'
              }`}>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${step.bg} ${step.color}`}>
                  {isMl ? `ഘട്ടം ${i + 1}` : `Step ${i + 1}`}
                </span>
                <h3 className={`mt-2 text-base font-semibold text-[var(--color-neutral-800)] ${isMl ? 'font-ml' : ''}`}>
                  {isMl ? step.labelMl : step.labelEn}
                </h3>
                <p className={`mt-1 text-sm text-[var(--color-neutral-500)] leading-relaxed ${isMl ? 'font-ml' : ''}`}>
                  {isMl ? step.descMl : step.descEn}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Latest Updates Ticker ───────────────────────────────────── */

const UPDATES = [
  { en: 'National Voters Day — January 25', ml: 'ദേശീയ വോട്ടേഴ്‌സ് ദിനം — ജനുവരി 25' },
  { en: 'Voter registration deadline approaching — Apply on NVSP', ml: 'വോട്ടർ രജിസ്ട്രേഷൻ സമയപരിധി അടുക്കുന്നു — NVSP-ൽ അപേക്ഷിക്കുക' },
  { en: 'New voter ID cards available for download on Voter Portal', ml: 'പുതിയ വോട്ടർ ഐഡി കാർഡുകൾ വോട്ടർ പോർട്ടലിൽ ഡൗൺലോഡിനായി ലഭ്യമാണ്' },
  { en: 'cVIGIL app — Report violations in real-time', ml: 'cVIGIL ആപ്പ് — ലംഘനങ്ങൾ തത്സമയം റിപ്പോർട്ട് ചെയ്യുക' },
];

function LatestUpdatesTicker({ isMl }: { isMl: boolean }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % UPDATES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="border-b border-[var(--border-primary)] bg-[var(--color-accent-50)]">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
        <span className="flex shrink-0 items-center gap-1.5 rounded bg-[var(--color-accent-500)] px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
          <MegaphoneIcon className="h-3.5 w-3.5" />
          {isMl ? 'അപ്ഡേറ്റ്' : 'Updates'}
        </span>
        <div className="flex-1 overflow-hidden">
          <motion.p
            key={currentIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`text-sm text-[var(--text-secondary)] truncate ${isMl ? 'font-ml' : ''}`}
          >
            {isMl ? UPDATES[currentIndex].ml : UPDATES[currentIndex].en}
          </motion.p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + UPDATES.length) % UPDATES.length)}
            className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-primary)] transition-colors"
            aria-label="Previous update"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % UPDATES.length)}
            className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-primary)] transition-colors"
            aria-label="Next update"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Voter Services Grid ─────────────────────────────────────── */

const voterServices = [
  {
    icon: MapPinIcon,
    href: '/booth',
    titleEn: 'Find Polling Booth',
    titleMl: 'പോളിംഗ് ബൂത്ത് കണ്ടെത്തുക',
    descEn: 'Locate your assigned polling station on an interactive map.',
    descMl: 'ഇന്ററാക്ടീവ് മാപ്പിൽ നിങ്ങളുടെ പോളിംഗ് സ്റ്റേഷൻ കണ്ടെത്തുക.',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: IdentificationIcon,
    href: '/registration',
    titleEn: 'Check Voter Registration',
    titleMl: 'വോട്ടർ രജിസ്ട്രേഷൻ പരിശോധിക്കുക',
    descEn: 'Verify your voter registration status instantly.',
    descMl: 'നിങ്ങളുടെ വോട്ടർ രജിസ്ട്രേഷൻ സ്ഥിതി ഉടൻ പരിശോധിക്കുക.',
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
  },
  {
    icon: DocumentCheckIcon,
    href: 'https://www.nvsp.in',
    titleEn: 'Apply for Voter ID',
    titleMl: 'വോട്ടർ ഐഡിക്ക് അപേക്ഷിക്കുക',
    descEn: 'Apply for a new voter ID card on the NVSP portal.',
    descMl: 'NVSP പോർട്ടലിൽ പുതിയ വോട്ടർ ഐഡി കാർഡിന് അപേക്ഷിക്കുക.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  {
    icon: PencilSquareIcon,
    href: 'https://www.nvsp.in',
    titleEn: 'Update Details',
    titleMl: 'വിവരങ്ങൾ അപ്ഡേറ്റ് ചെയ്യുക',
    descEn: 'Update name, address, or photo on your voter record.',
    descMl: 'നിങ്ങളുടെ വോട്ടർ റെക്കോർഡിൽ പേര്, വിലാസം, ഫോട്ടോ അപ്ഡേറ്റ് ചെയ്യുക.',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    icon: ExclamationTriangleIcon,
    href: '/report',
    titleEn: 'Report Election Issue',
    titleMl: 'തിരഞ്ഞെടുപ്പ് പ്രശ്‌നം റിപ്പോർട്ട്',
    descEn: 'Report election violations with evidence confidentially.',
    descMl: 'തെളിവുകൾ ഉപയോഗിച്ച് ലംഘനങ്ങൾ രഹസ്യമായി റിപ്പോർട്ട് ചെയ്യുക.',
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
  {
    icon: QuestionMarkCircleIcon,
    href: '/faq',
    titleEn: 'Election FAQ',
    titleMl: 'തിരഞ്ഞെടുപ്പ് FAQ',
    descEn: 'Find answers to common questions about elections.',
    descMl: 'തിരഞ്ഞെടുപ്പിനെക്കുറിച്ചുള്ള പൊതു ചോദ്യങ്ങൾക്ക് ഉത്തരം കണ്ടെത്തുക.',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
  },
];

function VoterServicesGrid({ isMl }: { isMl: boolean }) {
  return (
    <section className="border-y border-[var(--border-primary)] bg-[var(--surface-primary)]">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className={`text-2xl font-bold text-[var(--color-neutral-900)] ${isMl ? 'font-ml' : ''}`}>
            {isMl ? 'വോട്ടർ സേവനങ്ങൾ' : 'Voter Services'}
          </h2>
          <p className={`mt-2 text-sm text-[var(--color-neutral-500)] ${isMl ? 'font-ml' : ''}`}>
            {isMl ? 'നിങ്ങൾക്ക് ആവശ്യമായ എല്ലാ സേവനങ്ങളും ഒരിടത്ത്' : 'All the services you need in one place'}
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {voterServices.map((service) => {
            const Icon = service.icon;
            const isExternal = service.href.startsWith('http');
            const cardClassName = "group block rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6 shadow-sm transition-all hover:shadow-md hover:border-[var(--color-primary-300)] hover:-translate-y-0.5";
            const cardContent = (
              <>
                <div className={`inline-flex rounded-xl p-3 ${service.bg}`}>
                  <Icon className={`h-6 w-6 ${service.color}`} />
                </div>
                <h3 className={`mt-4 text-sm font-semibold text-[var(--color-neutral-800)] ${isMl ? 'font-ml' : ''}`}>
                  {isMl ? service.titleMl : service.titleEn}
                </h3>
                <p className={`mt-1 text-xs text-[var(--color-neutral-500)] leading-relaxed ${isMl ? 'font-ml' : ''}`}>
                  {isMl ? service.descMl : service.descEn}
                </p>
                <span className="mt-3 inline-block text-xs font-medium text-[var(--color-primary-500)] group-hover:underline">
                  {isMl ? 'കൂടുതൽ അറിയുക →' : 'Learn More →'}
                </span>
              </>
            );

            return (
              <motion.div key={service.titleEn} variants={fadeUp}>
                {isExternal ? (
                  <a href={service.href} target="_blank" rel="noopener noreferrer" className={cardClassName}>
                    {cardContent}
                  </a>
                ) : (
                  <Link href={service.href} className={cardClassName}>
                    {cardContent}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}