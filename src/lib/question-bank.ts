import eciFaqFull from '@/data/eci_faq_full.json';

export interface ApprovedQuestion {
  id: string;
  en: string;
  ml?: string;
  sectionEn: string;
  sectionMl: string;
  subSectionEn?: string;
  source: 'faq' | 'curated';
}

export interface FaqExactAnswer {
  question: string;
  questionMl?: string;
  answer: string;
  answerMl?: string;
  url: string;
  categoryName?: string;
  categoryNameMl?: string;
  subCategoryName?: string;
  subCategoryNameMl?: string;
}

const CURATED_SECTIONS: Array<{
  sectionEn: string;
  sectionMl: string;
  questions: Array<{ en: string; ml: string }>;
}> = [
  {
    sectionEn: 'Voting',
    sectionMl: 'വോട്ടിംഗ്',
    questions: [
      { en: 'Where is my polling booth?', ml: 'എന്റെ പോളിംഗ് ബൂത്ത് എവിടെയാണ്?' },
      { en: 'What time do polling booths open and close?', ml: 'പോളിംഗ് ബൂത്തുകൾ എത്ര മണിക്ക് തുറക്കുകയും അടയ്ക്കുകയും ചെയ്യും?' },
      { en: 'What should I bring to the polling booth?', ml: 'പോളിംഗ് ബൂത്തിലേക്ക് എന്ത് കൊണ്ടുപോകണം?' },
      { en: 'Can I vote without a Voter ID card?', ml: 'വോട്ടർ ഐഡി കാർഡ് ഇല്ലാതെ വോട്ട് ചെയ്യാൻ കഴിയുമോ?' },
      { en: 'What documents are required?', ml: 'ഏതൊക്കെ രേഖകൾ ആവശ്യം?' },
      { en: 'What time do booths open?', ml: 'ബൂത്ത് എത്ര മണിക്ക് തുറക്കും?' },
    ],
  },
  {
    sectionEn: 'Violations & Complaints',
    sectionMl: 'ലംഘനങ്ങൾ & പരാതികൾ',
    questions: [
      { en: 'How to report an election violation?', ml: 'ഒരു തിരഞ്ഞെടുപ്പ് ലംഘനം എങ്ങനെ റിപ്പോർട്ട് ചെയ്യാം?' },
      { en: 'How to report vote buying or bribery?', ml: 'വോട്ട് വാങ്ങൽ അല്ലെങ്കിൽ കൈക്കൂലി എങ്ങനെ റിപ്പോർട്ട് ചെയ്യാം?' },
      { en: 'What is the cVIGIL app and how to use it?', ml: 'cVIGIL ആപ്പ് എന്താണ്, അത് എങ്ങനെ ഉപയോഗിക്കാം?' },
      { en: 'How to report a violation?', ml: 'ലംഘനം എങ്ങനെ റിപ്പോർട്ട് ചെയ്യാം?' },
    ],
  },
  {
    sectionEn: 'General',
    sectionMl: 'പൊതു വിവരങ്ങൾ',
    questions: [
      { en: 'What is SVEEP?', ml: 'SVEEP എന്താണ്?' },
      { en: 'What is the Model Code of Conduct?', ml: 'മാതൃകാ പെരുമാറ്റ ചട്ടം എന്താണ്?' },
      { en: 'What is the election helpline number?', ml: 'തിരഞ്ഞെടുപ്പ് ഹെൽപ്‌ലൈൻ നമ്പർ എന്താണ്?' },
      { en: 'What is the election helpline?', ml: 'ഹെൽപ്‌ലൈൻ നമ്പർ എന്താണ്?' },
      { en: 'Show me frequently asked questions', ml: 'പൊതു ചോദ്യങ്ങൾ കാണിക്കുക' },
      { en: 'Help me find my polling booth', ml: 'എന്റെ പോളിംഗ് ബൂത്ത് കണ്ടെത്താൻ സഹായിക്കൂ' },
      { en: 'I want to check my voter registration status', ml: 'എന്റെ വോട്ടർ രജിസ്ട്രേഷൻ സ്ഥിതി പരിശോധിക്കണം' },
      { en: 'I want to report an election violation', ml: 'ഒരു തിരഞ്ഞെടുപ്പ് ലംഘനം റിപ്പോർട്ട് ചെയ്യണം' },
    ],
  },
];

function normalizeQuestion(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildCuratedQuestions(): ApprovedQuestion[] {
  const output: ApprovedQuestion[] = [];
  for (const section of CURATED_SECTIONS) {
    for (const q of section.questions) {
      output.push({
        id: `curated:${normalizeQuestion(q.en)}`,
        en: q.en,
        ml: q.ml,
        sectionEn: section.sectionEn,
        sectionMl: section.sectionMl,
        source: 'curated',
      });
    }
  }
  return output;
}

function buildFaqQuestions(): ApprovedQuestion[] {
  const raw = Array.isArray(eciFaqFull) ? eciFaqFull : [];

  return raw
    .filter((item) => item && typeof item.question === 'string' && item.question.trim())
    .map((item, idx) => {
      const categoryName = typeof item.categoryName === 'string' && item.categoryName.trim()
        ? item.categoryName.trim()
        : 'ECI FAQ';
      const categoryNameMl = typeof item.categoryName_ml === 'string' && item.categoryName_ml.trim()
        ? item.categoryName_ml.trim()
        : categoryName;
      const subCategoryName = typeof item.subCategoryName === 'string' && item.subCategoryName.trim()
        ? item.subCategoryName.trim()
        : undefined;
      const questionMl = typeof item.question_ml === 'string' && item.question_ml.trim()
        ? item.question_ml.trim()
        : undefined;

      return {
        id: `faq:${idx + 1}`,
        en: item.question.trim(),
        ml: questionMl,
        sectionEn: `ECI FAQ - ${categoryName}`,
        sectionMl: `ECI FAQ - ${categoryNameMl}`,
        subSectionEn: subCategoryName,
        source: 'faq' as const,
      };
    });
}

let cachedQuestions: ApprovedQuestion[] | null = null;
let approvedNormalized: Set<string> | null = null;
let faqAnswerByNormalizedQuestion: Map<string, FaqExactAnswer> | null = null;
let faqAnswerByExactQuestion: Map<string, FaqExactAnswer> | null = null;

function exactQuestionKey(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function getApprovedQuestions(): ApprovedQuestion[] {
  if (cachedQuestions) return cachedQuestions;

  const merged = [...buildCuratedQuestions(), ...buildFaqQuestions()];
  const dedup = new Map<string, ApprovedQuestion>();

  for (const q of merged) {
    const enKey = normalizeQuestion(q.en);
    if (!dedup.has(enKey)) {
      dedup.set(enKey, q);
      continue;
    }

    const existing = dedup.get(enKey)!;
    if (!existing.ml && q.ml) {
      dedup.set(enKey, { ...existing, ml: q.ml });
    }
  }

  cachedQuestions = Array.from(dedup.values()).sort((a, b) => {
    if (a.sectionEn !== b.sectionEn) return a.sectionEn.localeCompare(b.sectionEn);
    return a.en.localeCompare(b.en);
  });

  approvedNormalized = new Set<string>();
  faqAnswerByNormalizedQuestion = new Map<string, FaqExactAnswer>();
  faqAnswerByExactQuestion = new Map<string, FaqExactAnswer>();
  for (const q of cachedQuestions) {
    approvedNormalized.add(normalizeQuestion(q.en));
    if (q.ml) approvedNormalized.add(normalizeQuestion(q.ml));
  }

  const raw = Array.isArray(eciFaqFull) ? eciFaqFull : [];
  for (const item of raw) {
    if (!item || typeof item.question !== 'string' || typeof item.answer !== 'string') continue;
    const norm = normalizeQuestion(item.question);
    if (!norm) continue;

    const faqAnswer: FaqExactAnswer = {
      question: item.question.trim(),
      questionMl: typeof item.question_ml === 'string' ? item.question_ml.trim() : undefined,
      answer: item.answer.trim(),
      answerMl: typeof item.answer_ml === 'string' ? item.answer_ml.trim() : undefined,
      url: typeof item.url === 'string' && item.url ? item.url : 'https://www.eci.gov.in/faq/',
      categoryName: typeof item.categoryName === 'string' ? item.categoryName : undefined,
      categoryNameMl: typeof item.categoryName_ml === 'string' ? item.categoryName_ml : undefined,
      subCategoryName: typeof item.subCategoryName === 'string' ? item.subCategoryName : undefined,
      subCategoryNameMl: typeof item.subCategoryName_ml === 'string' ? item.subCategoryName_ml : undefined,
    };

    const exactKey = exactQuestionKey(item.question);
    if (!faqAnswerByExactQuestion.has(exactKey)) {
      faqAnswerByExactQuestion.set(exactKey, faqAnswer);
    }

    if (!faqAnswerByNormalizedQuestion.has(norm)) {
      faqAnswerByNormalizedQuestion.set(norm, faqAnswer);
    }
  }

  return cachedQuestions;
}

export function isApprovedQuestion(input: string): boolean {
  const normalized = normalizeQuestion(input || '');
  if (!normalized) return false;
  if (!approvedNormalized) {
    getApprovedQuestions();
  }
  return approvedNormalized?.has(normalized) ?? false;
}

export function normalizeApprovedQuestion(input: string): string {
  return normalizeQuestion(input || '');
}

export function getFaqExactAnswer(input: string): FaqExactAnswer | null {
  const exact = exactQuestionKey(input || '');
  const normalized = normalizeQuestion(input || '');
  if (!exact && !normalized) return null;
  if (!faqAnswerByNormalizedQuestion || !faqAnswerByExactQuestion) {
    getApprovedQuestions();
  }

  return faqAnswerByExactQuestion?.get(exact)
    ?? faqAnswerByNormalizedQuestion?.get(normalized)
    ?? null;
}
