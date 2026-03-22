// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionBrowser, type QuestionSection } from '@/components/chat/QuestionBrowser';

const MOCK_SECTIONS: QuestionSection[] = [
  {
    sectionEn: 'Registration',
    sectionMl: 'രജിസ്ട്രേഷൻ',
    questions: [
      { id: 'q1', en: 'How to register as a voter?', sectionEn: 'Registration', sectionMl: 'രജിസ്ട്രേഷൻ', source: 'curated' },
      { id: 'q2', en: 'What documents are required for registration?', sectionEn: 'Registration', sectionMl: 'രജിസ്ട്രേഷൻ', source: 'curated' },
    ],
  },
  {
    sectionEn: 'General',
    sectionMl: 'പൊതു വിവരങ്ങൾ',
    questions: [
      { id: 'q3', en: 'What is SVEEP?', sectionEn: 'General', sectionMl: 'പൊതു വിവരങ്ങൾ', source: 'curated' },
    ],
  },
];

describe('QuestionBrowser UX combinations', () => {
  it('filters by search and triggers selection callback', () => {
    const onSelectQuestion = vi.fn();

    render(
      <QuestionBrowser
        locale="en"
        sections={MOCK_SECTIONS}
        query=""
        setQuery={() => {}}
        selectedSection="all"
        setSelectedSection={() => {}}
        onSelectQuestion={onSelectQuestion}
      />
    );

    const search = screen.getByLabelText('Search approved questions');
    fireEvent.change(search, { target: { value: 'sveep' } });

    expect(screen.getByText('What is SVEEP?')).toBeTruthy();

    fireEvent.click(screen.getByText('What is SVEEP?'));
    expect(onSelectQuestion).toHaveBeenCalledWith('What is SVEEP?');
  });

  it('shows recovery action when selected section has no matches but other sections do', () => {
    const setSelectedSection = vi.fn();

    render(
      <QuestionBrowser
        locale="en"
        sections={MOCK_SECTIONS}
        query="sveep"
        setQuery={() => {}}
        selectedSection="Registration"
        setSelectedSection={setSelectedSection}
        onSelectQuestion={() => {}}
      />
    );

    expect(screen.getByText('No questions found.')).toBeTruthy();
    const button = screen.getByText('Search in all sections');
    fireEvent.click(button);

    expect(setSelectedSection).toHaveBeenCalledWith('all');
  });
});
