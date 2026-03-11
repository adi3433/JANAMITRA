/**
 * AccessibilityBar — Font size controls, high contrast toggle, language switcher
 * Visible on all pages, placed below GovTopBar and above navbar
 */
'use client';

import React from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useJanamitraStore } from '@/lib/store';

export function AccessibilityBar() {
  const { locale, toggle } = useLocale();
  const isMl = locale === 'ml';
  const accessibilityMode = useJanamitraStore((s) => s.accessibilityMode);
  const setAccessibilityMode = useJanamitraStore((s) => s.setAccessibilityMode);

  const handleFontSize = (action: 'decrease' | 'default' | 'increase') => {
    const html = document.documentElement;
    const current = parseFloat(getComputedStyle(html).fontSize);
    if (action === 'decrease') html.style.fontSize = `${Math.max(12, current - 2)}px`;
    else if (action === 'increase') html.style.fontSize = `${Math.min(24, current + 2)}px`;
    else html.style.fontSize = '16px';
  };

  return (
    <div className="border-b border-[var(--border-primary)] bg-[var(--surface-tertiary)]">
      <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 px-4 py-1">
        {/* Font size controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => handleFontSize('decrease')}
            className="rounded px-1.5 py-0.5 text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-primary)] transition-colors"
            aria-label="Decrease font size"
            title="Decrease font size"
          >
            A-
          </button>
          <button
            onClick={() => handleFontSize('default')}
            className="rounded px-1.5 py-0.5 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-primary)] transition-colors"
            aria-label="Default font size"
            title="Default font size"
          >
            A
          </button>
          <button
            onClick={() => handleFontSize('increase')}
            className="rounded px-1.5 py-0.5 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-primary)] transition-colors"
            aria-label="Increase font size"
            title="Increase font size"
          >
            A+
          </button>
        </div>

        <span className="h-3 w-px bg-[var(--border-primary)]" />

        {/* High contrast toggle */}
        <button
          onClick={() => setAccessibilityMode(!accessibilityMode)}
          className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
            accessibilityMode
              ? 'bg-[var(--color-primary-500)] text-white'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-primary)]'
          }`}
          aria-label="Toggle high contrast"
          title="High Contrast"
        >
          {isMl ? 'ഉയർന്ന കോൺട്രാസ്റ്റ്' : 'High Contrast'}
        </button>

        <span className="h-3 w-px bg-[var(--border-primary)]" />

        {/* Language switcher */}
        <button
          onClick={toggle}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-primary)] transition-colors"
          aria-label={`Switch to ${locale === 'en' ? 'Malayalam' : 'English'}`}
        >
          <span className={locale === 'en' ? 'font-bold text-[var(--color-primary-500)]' : ''}>English</span>
          <span className="text-[var(--border-primary)]">|</span>
          <span className={`font-ml ${locale === 'ml' ? 'font-bold text-[var(--color-primary-500)]' : ''}`}>മലയാളം</span>
        </button>
      </div>
    </div>
  );
}
