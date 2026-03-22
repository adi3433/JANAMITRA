'use client';

import React, { useDeferredValue, useMemo } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { ApprovedQuestion } from '@/lib/question-bank';
import { motion } from 'framer-motion';

export interface QuestionSection {
  sectionEn: string;
  sectionMl: string;
  questions: ApprovedQuestion[];
}

interface Props {
  locale: 'en' | 'ml';
  sections: QuestionSection[];
  query: string;
  setQuery: (value: string) => void;
  selectedSection: string;
  setSelectedSection: (value: string) => void;
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function QuestionBrowser({
  locale,
  sections,
  query,
  setQuery,
  selectedSection,
  setSelectedSection,
  onSelectQuestion,
  disabled,
  searchInputRef,
}: Props) {
  const deferredQuery = useDeferredValue(query);

  const allSectionsFiltered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();

    return sections
      .map((section) => {
        const questions = q
          ? section.questions.filter((item) => {
            const target = locale === 'ml' ? (item.ml || item.en) : item.en;
            return target.toLowerCase().includes(q);
          })
          : section.questions;
        return { ...section, questions };
      })
      .filter((section) => section.questions.length > 0);
  }, [sections, deferredQuery, locale]);

  const filteredSections = useMemo(() => {
    if (selectedSection === 'all') {
      return allSectionsFiltered;
    }
    return allSectionsFiltered.filter((section) => section.sectionEn === selectedSection);
  }, [selectedSection, allSectionsFiltered]);

  const totalCount = useMemo(
    () => filteredSections.reduce((sum, section) => sum + section.questions.length, 0),
    [filteredSections]
  );

  const hasMatchesOutsideSelectedSection = useMemo(() => {
    if (selectedSection === 'all' || !deferredQuery.trim()) return false;
    return allSectionsFiltered.length > 0 && filteredSections.length === 0;
  }, [selectedSection, deferredQuery, allSectionsFiltered, filteredSections]);

  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] p-3 shadow-sm">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs font-semibold text-[var(--text-tertiary)] ${locale === 'ml' ? 'font-ml' : ''}`}>
          {locale === 'ml'
            ? `ലഭ്യമായ ചോദ്യങ്ങൾ: ${totalCount}`
            : `Available approved questions: ${totalCount}`}
        </p>
        <div className="relative w-full sm:max-w-xs">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={locale === 'ml' ? 'ചോദ്യം തിരയുക...' : 'Search questions...'}
            aria-label={locale === 'ml' ? 'ചോദ്യങ്ങൾ തിരയുക' : 'Search approved questions'}
            className={`w-full rounded-lg border border-[var(--border-primary)] bg-[var(--surface-secondary)] py-2 pl-8 pr-3 text-sm text-[var(--text-primary)] outline-none ring-0 transition focus:border-[var(--color-primary-400)] ${locale === 'ml' ? 'font-ml' : ''}`}
          />
        </div>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        <button
          onClick={() => setSelectedSection('all')}
          className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${selectedSection === 'all'
            ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)] text-white'
            : 'border-[var(--border-primary)] bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
            } ${locale === 'ml' ? 'font-ml' : ''}`}
        >
          {locale === 'ml' ? 'എല്ലാം' : 'All'}
        </button>
        {sections.map((section) => (
          <button
            key={section.sectionEn}
            onClick={() => setSelectedSection(section.sectionEn)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${selectedSection === section.sectionEn
              ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)] text-white'
              : 'border-[var(--border-primary)] bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
              } ${locale === 'ml' ? 'font-ml' : ''}`}
          >
            {locale === 'ml' ? section.sectionMl : section.sectionEn}
          </button>
        ))}
      </div>

      <div className="max-h-[52vh] overflow-y-auto pr-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        {filteredSections.length === 0 ? (
          <div className="py-8 text-center">
            <p className={`text-sm text-[var(--text-tertiary)] ${locale === 'ml' ? 'font-ml' : ''}`}>
              {locale === 'ml' ? 'ചോദ്യങ്ങൾ കണ്ടെത്താനായില്ല.' : 'No questions found.'}
            </p>
            {hasMatchesOutsideSelectedSection && (
              <button
                onClick={() => setSelectedSection('all')}
                className={`mt-2 rounded-md border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-1 text-xs text-[var(--text-secondary)] transition hover:border-[var(--color-primary-300)] ${locale === 'ml' ? 'font-ml' : ''}`}
              >
                {locale === 'ml' ? 'എല്ലാ വിഭാഗങ്ങളിലും തിരയുക' : 'Search in all sections'}
              </button>
            )}
          </div>
        ) : (
          filteredSections.map((section, index) => (
            <motion.details
              key={section.sectionEn}
              open
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.18) }}
              className="mb-2 rounded-lg border border-[var(--border-primary)] bg-[var(--surface-secondary)]"
            >
              <summary className={`cursor-pointer list-none px-3 py-2 text-sm font-semibold text-[var(--text-primary)] ${locale === 'ml' ? 'font-ml' : ''}`}>
                {locale === 'ml' ? section.sectionMl : section.sectionEn}
                <span className="ml-2 text-xs font-normal text-[var(--text-tertiary)]">({section.questions.length})</span>
              </summary>
              <div className="grid gap-1 px-2 pb-2 sm:grid-cols-2">
                {section.questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => onSelectQuestion(locale === 'ml' ? (q.ml || q.en) : q.en)}
                    disabled={disabled}
                    className={`rounded-md border border-[var(--border-primary)] bg-[var(--surface-primary)] px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition hover:border-[var(--color-primary-300)] hover:text-[var(--color-primary-600)] disabled:opacity-50 ${locale === 'ml' ? 'font-ml' : ''}`}
                    title={q.subSectionEn}
                  >
                    {locale === 'ml' ? (q.ml || q.en) : q.en}
                  </button>
                ))}
              </div>
            </motion.details>
          ))
        )}
      </div>
    </div>
  );
}
