/**
 * FAQ paraphrase stress test for RAG retrieval robustness.
 *
 * Goal:
 * - Use slightly reworded FAQ questions across domains.
 * - Ensure retrieval still returns at least one relevant passage.
 */
import { describe, it, expect } from 'vitest';
import { retrievePassages } from '@/lib/rag/retriever';
import { FAQ_PARAPHRASE_QUERIES } from './fixtures/faq-paraphrase-queries';

function hasKeywordMatch(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

describe('FAQ paraphrase RAG capability', () => {
  it('retrieves relevant passages for paraphrased FAQ queries', { timeout: 30000 }, async () => {
    // Keep test deterministic and fast in CI/local runs.
    process.env.DISABLE_VECTOR_SEARCH = '1';

    const failures: Array<{ id: number; domain: string; query: string; topPassagePreview: string }> = [];
    let passed = 0;

    for (const q of FAQ_PARAPHRASE_QUERIES) {
      const result = await retrievePassages(q.query, 'en', 1200);
      const top = result.passages.slice(0, 5);
      const mergedTopText = top.map((p) => p.content).join('\n\n');

      const ok = top.length > 0 && hasKeywordMatch(mergedTopText, q.expectedAnyKeywords);
      if (ok) {
        passed += 1;
      } else {
        failures.push({
          id: q.id,
          domain: q.domain,
          query: q.query,
          topPassagePreview: (top[0]?.content || 'NO_PASSAGE').slice(0, 220),
        });
      }
    }

    const passRate = passed / FAQ_PARAPHRASE_QUERIES.length;
    if (failures.length > 0) {
      // Helpful diagnostics for improving KB and prompts.
      console.log('[faq-paraphrase-rag] failures:', JSON.stringify(failures, null, 2));
    }

    expect(passRate).toBeGreaterThanOrEqual(0.85);
  });
});
