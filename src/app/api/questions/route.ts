import { NextResponse } from 'next/server';
import { getApprovedQuestions } from '@/lib/question-bank';

export async function GET() {
  const questions = getApprovedQuestions();

  return NextResponse.json({
    total: questions.length,
    sections: Array.from(
      questions.reduce((acc, q) => {
        if (!acc.has(q.sectionEn)) {
          acc.set(q.sectionEn, {
            sectionEn: q.sectionEn,
            sectionMl: q.sectionMl,
            questions: [],
          });
        }
        acc.get(q.sectionEn)!.questions.push(q);
        return acc;
      }, new Map<string, { sectionEn: string; sectionMl: string; questions: typeof questions }>())
    ).map(([, value]) => ({
      sectionEn: value.sectionEn,
      sectionMl: value.sectionMl,
      questions: value.questions,
    })),
  });
}
