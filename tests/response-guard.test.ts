/**
 * Response guard unit tests
 */
import { describe, it, expect } from 'vitest';
import { applyResponseGuard } from '@/lib/response-guard';

describe('Response guard', () => {
  it('caps confidence for weak-evidence open-text answers', () => {
    const out = applyResponseGuard({
      query: 'How to update voter registration?',
      responseText: 'You can apply online through the voter portal.',
      locale: 'en',
      confidence: 0.89,
      sourcesCount: 0,
      routerType: 'rag',
      safetyFlagged: false,
    });

    expect(out.confidence).toBeLessThanOrEqual(0.72);
    expect(out.forceEscalate).toBe(false);
  });

  it('adds verification note for risky legal/compliance query with weak evidence', () => {
    const out = applyResponseGuard({
      query: 'Is it mandatory to use a separate bank account for election expenses?',
      responseText: 'Candidates usually need a dedicated account.',
      locale: 'en',
      confidence: 0.8,
      sourcesCount: 0,
      routerType: 'rag',
      safetyFlagged: false,
    });

    expect(out.text.toLowerCase()).toContain('verification note');
    expect(out.forceEscalate).toBe(true);
    expect(out.confidence).toBeLessThanOrEqual(0.62);
  });

  it('does not alter data-grounded engine responses with sources', () => {
    const out = applyResponseGuard({
      query: 'Where is my polling booth?',
      responseText: 'Polling station details...',
      locale: 'en',
      confidence: 0.95,
      sourcesCount: 2,
      routerType: 'engine_direct',
      safetyFlagged: false,
    });

    expect(out.text).toBe('Polling station details...');
    expect(out.confidence).toBe(0.95);
    expect(out.forceEscalate).toBe(false);
  });
});
