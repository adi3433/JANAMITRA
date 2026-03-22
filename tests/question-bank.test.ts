import { describe, it, expect } from 'vitest';
import { getApprovedQuestions, getFaqExactAnswer, isApprovedQuestion } from '@/lib/question-bank';

describe('Approved question bank', () => {
  it('contains FAQ corpus questions and curated questions', () => {
    const list = getApprovedQuestions();

    expect(list.length).toBeGreaterThan(200);
    expect(list.some((q) => q.en === 'What is SVEEP?')).toBe(true);
    expect(list.some((q) => /term of office of president/i.test(q.en))).toBe(true);
  });

  it('allows known approved phrasings and rejects arbitrary free text', () => {
    expect(isApprovedQuestion('What is SVEEP?')).toBe(true);
    expect(isApprovedQuestion('SVEEP എന്താണ്?')).toBe(true);
    expect(isApprovedQuestion('What is the term of office of President?')).toBe(true);
    expect(isApprovedQuestion('Tell me some random political analysis')).toBe(false);
  });

  it('returns exact FAQ answer for president-term question', () => {
    const result = getFaqExactAnswer('What is the term of office of President?');

    expect(result).not.toBeNull();
    expect(result?.answer.toLowerCase()).toMatch(/five\s+years|term\s+of\s+five\s+years/);
  });
});
