/**
 * Guideline sync topic extraction tests
 */
import { describe, it, expect } from 'vitest';
import { extractTopicSnippets } from '@/lib/ingestion/guideline-sync';

describe('Guideline sync topic extraction', () => {
  it('extracts required election topics from mixed text', () => {
    const text = [
      'A person is eligible to contest an election candidate seat if they meet citizenship and age requirements under the Act.',
      'Nomination papers must be filed before the Returning Officer within the notified period.',
      'Candidates must open a separate bank account for election expenditure tracking.',
      'Election expenditure must be recorded against the ceiling limit notified by ECI.',
      'Every candidate files affidavit in Form 26 declaring assets and criminal antecedents.',
      'Model Code of Conduct applies from date of announcement till completion of election process.',
    ].join(' ');

    const snippets = extractTopicSnippets(text);
    const topics = snippets.map((s) => s.topic);

    expect(topics).toContain('candidate_eligibility');
    expect(topics).toContain('nomination_process');
    expect(topics).toContain('bank_account_rules');
    expect(topics).toContain('election_expenses');
    expect(topics).toContain('affidavits');
    expect(topics).toContain('model_code_of_conduct');
  });

  it('returns empty for unrelated text', () => {
    const snippets = extractTopicSnippets('This page is about weather and tourism updates only.');
    expect(snippets.length).toBe(0);
  });
});
