/**
 * FAQ-only retriever regressions
 */
import { describe, it, expect } from 'vitest';
import { retrieveFaqPassages } from '@/lib/rag/retriever';

describe('FAQ-only retrieval lane', () => {
  it('retrieves direct FAQ evidence for voter eligibility query', async () => {
    const result = await retrieveFaqPassages('who is eligible to vote', 'en', 1200);

    expect(result.passages.length).toBeGreaterThan(0);
    expect(result.passages[0].content).toMatch(/Q:\s|eligible|citizen|electoral\s+roll/i);
    expect(result.passages[0].metadata.source).toMatch(/ECI FAQ|ECI/i);
  });

  it('retrieves nomination-related FAQ answer for reworded nomination query', async () => {
    const result = await retrieveFaqPassages(
      'can nomination be sent via email or fax',
      'en',
      1200
    );

    expect(result.passages.length).toBeGreaterThan(0);
    const combined = result.passages.slice(0, 3).map((p) => p.content).join('\n\n').toLowerCase();
    expect(combined).toMatch(/nomination|fax|e-mail|email|post/);
  });

  it('retrieves president term FAQ evidence for direct constitutional query', async () => {
    const result = await retrieveFaqPassages(
      'What is the term of office of President?',
      'en',
      1200
    );

    expect(result.passages.length).toBeGreaterThan(0);
    const combined = result.passages.slice(0, 3).map((p) => p.content).join('\n\n').toLowerCase();
    expect(combined).toMatch(/term\s+of\s+office\s+of\s+president|president\s+shall\s+hold\s+office|five\s+years/);
  });
});
