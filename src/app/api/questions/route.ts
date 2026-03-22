import { NextResponse } from 'next/server';
import { getApprovedQuestions } from '@/lib/question-bank';
import { chatCompletion } from '@/lib/fireworks';

const questionMlCache = new Map<string, string>();

const SECTION_ML_MAP: Record<string, string> = {
  Voting: 'വോട്ടിംഗ്',
  'Violations & Complaints': 'ലംഘനങ്ങൾ & പരാതികൾ',
  General: 'പൊതു വിവരങ്ങൾ',
};

const FAQ_CATEGORY_ML_MAP: Record<string, string> = {
  Elections: 'തിരഞ്ഞെടുപ്പുകൾ',
  EVM: 'ഇവിഎം',
  'Model Code of Conduct': 'മാതൃകാ പെരുമാറ്റ ചട്ടം',
  'Registration of Political Parties': 'രാഷ്ട്രീയ പാർട്ടികളുടെ രജിസ്ട്രേഷൻ',
  'Voter / Electors': 'വോട്ടർ / വോട്ടർമാർ',
};

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  return trimmed;
}

function toMalayalamSectionName(sectionEn: string, existingMl: string): string {
  if (SECTION_ML_MAP[sectionEn]) return SECTION_ML_MAP[sectionEn];

  const faqPrefix = 'ECI FAQ - ';
  if (sectionEn.startsWith(faqPrefix)) {
    const category = sectionEn.slice(faqPrefix.length).trim();
    const categoryMl = FAQ_CATEGORY_ML_MAP[category] || category;
    return `ECI ചോദ്യോത്തരങ്ങൾ - ${categoryMl}`;
  }

  return existingMl || sectionEn;
}

async function translateBatchToMalayalam(batch: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (batch.length === 0) return result;

  const payload = JSON.stringify(batch);
  const completion = await chatCompletion({
    temperature: 0,
    maxTokens: 2000,
    messages: [
      {
        role: 'system',
        content: 'Translate election FAQ questions from English to Malayalam. Return STRICT JSON only as an object mapping each original English string to its Malayalam translation. Do not add notes or markdown.',
      },
      {
        role: 'user',
        content: `Translate these questions to Malayalam:\n${payload}`,
      },
    ],
  });

  const parsed = JSON.parse(stripCodeFence(completion.text)) as Record<string, string>;
  for (const en of batch) {
    const ml = typeof parsed[en] === 'string' ? parsed[en].trim() : '';
    if (ml) {
      result.set(en, ml);
    }
  }

  return result;
}

async function ensureMalayalamQuestions(englishQuestions: string[]): Promise<void> {
  const uniqueMissing = Array.from(new Set(englishQuestions.filter((q) => q && !questionMlCache.has(q))));
  if (uniqueMissing.length === 0) return;

  const batchSize = 40;
  for (let i = 0; i < uniqueMissing.length; i += batchSize) {
    const batch = uniqueMissing.slice(i, i + batchSize);
    try {
      const translated = await translateBatchToMalayalam(batch);
      for (const en of batch) {
        questionMlCache.set(en, translated.get(en) || en);
      }
    } catch {
      for (const en of batch) {
        questionMlCache.set(en, en);
      }
    }
  }
}

export async function GET(request: Request) {
  const questions = getApprovedQuestions();
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') === 'ml' ? 'ml' : 'en';

  let localizedQuestions = questions;

  if (locale === 'ml') {
    const missingMl = questions
      .filter((q) => !q.ml?.trim())
      .map((q) => q.en);

    await ensureMalayalamQuestions(missingMl);

    localizedQuestions = questions.map((q) => ({
      ...q,
      ml: q.ml?.trim() || questionMlCache.get(q.en) || q.en,
      sectionMl: toMalayalamSectionName(q.sectionEn, q.sectionMl),
    }));
  }

  return NextResponse.json({
    total: localizedQuestions.length,
    sections: Array.from(
      localizedQuestions.reduce((acc, q) => {
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
