/**
 * Voting rules engine regressions
 */
import { describe, it, expect } from 'vitest';
import { getVotingRulesResponse } from '@/lib/engines';

describe('Voting rules engine regressions', () => {
  it('routes voter-id query to id_documents response', () => {
    const result = getVotingRulesResponse(undefined, 'Can I vote without a Voter ID card?', 'en');

    expect(result.subIntent).toBe('id_documents');
    expect(result.formattedResponse.toLowerCase()).toContain('accepted photo id');
  });

  it('routes bring-to-polling-booth query to id_documents response', () => {
    const result = getVotingRulesResponse(undefined, 'What should I bring to the polling booth?', 'en');

    expect(result.subIntent).toBe('id_documents');
    expect(result.formattedResponse.toLowerCase()).toContain('accepted photo id');
  });

  it('keeps prohibited intent for explicit prohibited-items query', () => {
    const result = getVotingRulesResponse(undefined, 'What items are prohibited inside polling station?', 'en');

    expect(result.subIntent).toBe('prohibited');
    expect(result.formattedResponse.toLowerCase()).toContain('prohibited items');
  });
});
