/**
 * Generator template fallback regressions
 */
import { describe, it, expect } from 'vitest';
import { generateAnswer } from '@/lib/rag/generator';

describe('Generator template fallback', () => {
  it('returns eligibility guidance for who-is-eligible query', async () => {
    const prev = process.env.FIREWORKS_API_KEY;
    process.env.FIREWORKS_API_KEY = '';

    try {
      const result = await generateAnswer('system', 'user', 'en', 'who is eligible to vote');
      const out = result.text.toLowerCase();

      expect(out).toContain('eligibility to vote');
      expect(out).toContain('indian citizen');
      expect(out).toContain('18 years');
      expect(out).not.toContain("more information needed");
    } finally {
      process.env.FIREWORKS_API_KEY = prev;
    }
  });

  it('does not misroute president-term query to ID-documents fallback', async () => {
    const prev = process.env.FIREWORKS_API_KEY;
    process.env.FIREWORKS_API_KEY = '';

    try {
      const result = await generateAnswer('system', 'user', 'en', 'What is the term of office of President?');
      const out = result.text.toLowerCase();

      expect(out).toContain('more information needed');
      expect(out).not.toContain('accepted id documents for voting');
      expect(out).not.toContain('voter id card');
    } finally {
      process.env.FIREWORKS_API_KEY = prev;
    }
  });

  it('answers What is SVEEP using deterministic fallback content', async () => {
    const prev = process.env.FIREWORKS_API_KEY;
    process.env.FIREWORKS_API_KEY = '';

    try {
      const result = await generateAnswer('system', 'user', 'en', 'What is SVEEP?');
      const out = result.text.toLowerCase();

      expect(out).toContain('what is sveep');
      expect(out).toContain('systematic voters');
      expect(out).toContain('electoral participation');
      expect(out).not.toContain('more information needed');
    } finally {
      process.env.FIREWORKS_API_KEY = prev;
    }
  });
});
