import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import eciFaqFull from '@/data/eci_faq_full.json';
import { POST as chatPost } from '@/app/api/chat/route';

interface FaqRow {
  question: string;
  answer: string;
  url?: string;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

describe('Full FAQ corpus API audit', () => {
  it('returns canonical answers for all FAQ questions via /api/chat', { timeout: 180000 }, async () => {
    const faqRows = (Array.isArray(eciFaqFull) ? eciFaqFull : [])
      .filter((item): item is FaqRow => Boolean(item && typeof item.question === 'string' && typeof item.answer === 'string'));

    expect(faqRows.length).toBeGreaterThanOrEqual(550);

    const answerBuckets = new Map<string, string[]>();
    for (const row of faqRows) {
      const key = normalizeText(row.question);
      if (!key) continue;
      if (!answerBuckets.has(key)) answerBuckets.set(key, []);

      const normalizedAnswer = normalizeText(row.answer);
      if (!answerBuckets.get(key)!.includes(normalizedAnswer)) {
        answerBuckets.get(key)!.push(normalizedAnswer);
      }
    }

    const failures: Array<{ index: number; question: string; expectedAnyOf: string[]; got: string }> = [];

    for (let i = 0; i < faqRows.length; i += 1) {
      const row = faqRows[i];

      const req = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: row.question,
          locale: 'en',
          sessionId: `faq-audit-${i + 1}`,
          conversationHistory: [],
          userId: 'faq-audit-suite',
        }),
      });

      const res = await chatPost(req);
      expect(res.status).toBe(200);

      const data = await res.json() as { text?: string };
      const outputText = normalizeText(data.text || '');
      const expectedAnswerSet = answerBuckets.get(normalizeText(row.question)) ?? [normalizeText(row.answer)];

      const hasMatch = expectedAnswerSet.some((answer) => outputText.includes(answer));

      if (!hasMatch) {
        failures.push({
          index: i + 1,
          question: row.question,
          expectedAnyOf: expectedAnswerSet.slice(0, 3).map((a) => a.slice(0, 220)),
          got: (data.text || '').slice(0, 220),
        });
      }
    }

    if (failures.length > 0) {
      // eslint-disable-next-line no-console
      console.log('[faq-full-corpus-audit] failures:', JSON.stringify(failures.slice(0, 25), null, 2));
    }

    expect(failures.length).toBe(0);
  });
});
