/**
 * useLocale — Locale convenience hook
 */
'use client';

import { useJanamitraStore } from '@/lib/store';
import { strings } from '@/lib/i18n';
// Locale type inferred from store

export function useLocale() {
  const locale = useJanamitraStore((s) => s.locale);
  const setLocale = useJanamitraStore((s) => s.setLocale);
  const t = strings[locale];

  const toggle = () => setLocale(locale === 'en' ? 'ml' : 'en');

  return { locale, setLocale, t, toggle, isEnglish: locale === 'en', isMalayalam: locale === 'ml' };
}
