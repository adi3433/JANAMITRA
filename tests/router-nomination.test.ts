/**
 * Router guardrail regressions for nomination filing queries
 */
import { describe, it, expect } from 'vitest';
import { routeInput } from '@/lib/router';

describe('Router nomination filing guardrails', () => {
  it('returns deterministic nomination FAQ for persons-allowed query', async () => {
    const result = await routeInput({
      text: 'how many persons are allowed with candidate while filing nomination',
      locale: 'en',
      sessionId: 'test-session',
    });

    expect(result.type).toBe('engine_direct');
    expect(result.engineResult?.engineName).toBe('nomination-faq');
    expect(result.engineResult?.formattedResponse.toLowerCase()).toContain('only 4 persons');
  });
});
