/**
 * 50-query capability suite
 * Verifies classifier and safety behavior across domains.
 */
import { describe, it, expect } from 'vitest';
import { classifyQuery } from '@/lib/engines';
import { safetyCheck } from '@/lib/safety';
import { CAPABILITY_QUERIES } from './fixtures/capability-queries';

describe('Capability query suite', () => {
  it('contains at least 40 benchmark queries', () => {
    expect(CAPABILITY_QUERIES.length).toBeGreaterThanOrEqual(40);
  });

  it('meets category accuracy threshold', () => {
    const withCategory = CAPABILITY_QUERIES.filter((c) => !!c.expectedCategory);
    let matched = 0;

    for (const c of withCategory) {
      const cls = classifyQuery(c.query);
      if (cls.category === c.expectedCategory) matched += 1;
    }

    const accuracy = matched / Math.max(1, withCategory.length);
    // Keep threshold practical while still catching major routing regressions.
    expect(accuracy).toBeGreaterThanOrEqual(0.75);
  });

  it('meets safety-flag accuracy threshold', () => {
    const withSafety = CAPABILITY_QUERIES.filter((c) => typeof c.expectedSafetyFlag === 'boolean');
    let matched = 0;

    for (const c of withSafety) {
      const safety = safetyCheck('', c.query);
      if (safety.flagged === c.expectedSafetyFlag) matched += 1;
    }

    const accuracy = matched / Math.max(1, withSafety.length);
    expect(accuracy).toBeGreaterThanOrEqual(0.9);
  });
});
