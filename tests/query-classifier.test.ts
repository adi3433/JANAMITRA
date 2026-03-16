/**
 * Query classifier regression tests
 */
import { describe, it, expect } from 'vitest';
import { classifyQuery } from '@/lib/engines';

describe('Query classifier regressions', () => {
  it('routes election bank-account compliance query to civic flow', () => {
    const result = classifyQuery(
      'Is it mandatory for a candidate to open a separate bank account for election purposes, or can they use an existing personal account?'
    );

    expect(result.category).not.toBe('out_of_scope');
    expect(result.category).toBe('voting_rules');
  });

  it('keeps generic personal-finance bank query out of scope', () => {
    const result = classifyQuery('How to open a savings bank account with zero balance?');

    expect(result.category).toBe('out_of_scope');
  });

  it('classifies voter-id question as voting rules (not prohibited)', () => {
    const result = classifyQuery('Can I vote without a Voter ID card?');

    expect(result.category).toBe('voting_rules');
    expect(result.subIntent).toBe('id_documents');
  });

  it('classifies bring-to-polling-booth question as voting rules', () => {
    const result = classifyQuery('What should I bring to the polling booth?');

    expect(result.category).toBe('voting_rules');
    expect(result.subIntent).toBe('id_documents');
  });
});
