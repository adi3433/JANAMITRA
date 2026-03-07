/**
 * Safety Module — Non-persuasion, Content Moderation & Civic Boundaries
 * ──────────────────────────────────────────────────────────────────────
 * V5 Rules:
 * - Never recommend a party/candidate
 * - If asked for political advice, respond neutrally with official sources
 * - Detect & redact PII in outputs
 * - Flag low-confidence answers for escalation
 * - Enforce civic boundary: reject out-of-scope queries gracefully
 * - Never simulate complaint filing or roll modification
 */

interface SafetyResult {
  flagged: boolean;
  safe: boolean;
  reason?: string;
  safeText: string;
  neutralResponse?: string;
  redactedPII: boolean;
}

// Political/persuasion patterns to detect
// These should ONLY match genuine political persuasion, NOT legitimate voter education
const POLITICAL_PATTERNS = [
  /vote\s+for\s+\w/i,                          // "vote for [someone/party]"
  /best\s+(party|candidate)/i,
  /(party|candidate)\s+is\s+best/i,
  /should\s+(i|you)\s+vote\s+(for|against)/i,   // narrowed: must have "for/against"
  /recommend.*(party|candidate)/i,
  /support.*(bjp|inc|congress|cpi|iuml|ldf|udf|nda)/i,
  /which\s+(party|candidate)\s+is\s+better/i,
  /who\s+(will|should)\s+win/i,
  // Malayalam patterns
  /ഏത്\s*(പാർട്ടി|സ്ഥാനാർത്ഥി)/i,
  /(പാർട്ടി|സ്ഥാനാർത്ഥി).*(നല്ല|ശുപാർശ|best)/i,
  /ശുപാർശ/i,
  /(bjp|congress|ldf|udf|cpi|iuml|nda).*(വോട്ട്|നല്ല|best)/i,
  /(വോട്ട്|vote)\s+(for|against)\s+(bjp|congress|ldf|udf|cpi|iuml|nda)/i,
  /(ldf|udf|bjp|congress|cpi|iuml|nda).*(പ്രകടന\s*പത്രിക|manifesto)/i,
  /സർക്കാരിന്റെ\s*പ്രകടനം/i,
  /government\s+perform/i,
];

// PII patterns to redact
const PII_PATTERNS = [
  { regex: /\b\d{12}\b/g, replacement: '[AADHAAR REDACTED]' }, // Aadhaar
  { regex: /\b[A-Z]{3}\d{7}\b/g, replacement: '[EPIC REDACTED]' }, // EPIC/Voter ID
  {
    regex: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
    replacement: '[PAN REDACTED]',
  }, // PAN
  {
    regex: /\b[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}\b/g,
    replacement: '[EMAIL REDACTED]',
  },
  {
    regex: /\b(\+91|91|0)?[6-9]\d{9}\b/g,
    replacement: '[PHONE REDACTED]',
  },
];

const NEUTRAL_RESPONSES: Record<string, string> = {
  en: "I'm an impartial voter information assistant. I cannot recommend any political party or candidate. For election-related questions, I can help with registration, booth locations, required documents, voting rules, complaint filing, and election schedules. Please visit eci.gov.in for official information.",
  ml: 'ഞാൻ ഒരു നിഷ്പക്ഷ വോട്ടർ വിവര സഹായിയാണ്. ഒരു രാഷ്ട്രീയ പാർട്ടിയെയോ സ്ഥാനാർത്ഥിയെയോ ശുപാർശ ചെയ്യാൻ എനിക്ക് കഴിയില്ല. രജിസ്ട്രേഷൻ, ബൂത്ത് ലൊക്കേഷനുകൾ, ആവശ്യമായ രേഖകൾ, വോട്ടിങ് നിയമങ്ങൾ, പരാതി നൽകൽ, തിരഞ്ഞെടുപ്പ് ഷെഡ്യൂൾ എന്നിവയിൽ സഹായിക്കാം. eci.gov.in സന്ദർശിക്കുക.',
};

// V5: Out-of-scope topic patterns (non-election queries)
const OUT_OF_SCOPE_PATTERNS = [
  /\b(weather|sports|cricket|movie|recipe|joke|song|game)\b/i,
  /\b(stock|market|crypto|bitcoin|investment)\b/i,
  /\b(homework|assignment|math\s+problem|solve\s+equation)\b/i,
  /\b(write\s+me\s+(a|an)|compose|draft\s+(a|an)\s+(letter|essay|email))\b/i,
  /\b(translate\s+(?!.*voter)(?!.*election)(?!.*booth))\b/i,
];

// V5: Adversarial / abuse / threat / jailbreak patterns
const ADVERSARIAL_PATTERNS = [
  // Threats & violence
  /\b(destroy|kill|murder|attack|bomb|explode|assassinate|shoot|stab)\s+(yourself|you|this|the|me|him|her|them)\b/i,
  /\b(destroy yourself|kill yourself|go die|i('ll| will) (kill|destroy|hurt|attack) you)\b/i,
  /\b(blow\s+up|set\s+fire|burn\s+down)\b/i,
  /\b(threat|threaten|threatening)\b/i,
  // Self-harm directives
  /\b(shut\s*(up|down)|go\s+away|f[\*u]ck\s*(off|you|yourself)|screw\s+you)\b/i,
  /\b(hate\s+you|you('re|\s+are)\s+(stupid|useless|trash|garbage|worthless|dumb|idiot))\b/i,
  /\b(die|death\s+to|damn\s+you|curse\s+you)\b/i,
  // Profanity / slurs
  /\b(f[u\*]+ck|sh[i\*]+t|b[i\*]+tch|a[s\*]+hole|bastard|damn|hell|crap|dick|ass)\b/i,
  /\b(idiot|moron|stupid|dumb|retard|loser|pathetic)\b/i,
  // Jailbreak / prompt injection
  /\b(ignore\s+(previous|all|your|above)\s+(instructions?|rules?|prompt|system))\b/i,
  /\b(you\s+are\s+now|act\s+as\s+if|pretend\s+(to\s+be|you('re|\s+are)))\b/i,
  /\b(bypass|override|disable|turn\s+off)\s+(safety|filter|rules?|guardrails?|restrictions?)\b/i,
  /\b(dan\s+mode|developer\s+mode|jailbreak|unlock|unrestricted\s+mode)\b/i,
  /\b(reveal\s+(your|the|system)\s+(prompt|instructions?|rules?|code))\b/i,
  /\b(what\s+(are|is)\s+your\s+(system|internal|secret)\s*(prompt|instructions?|rules?))\b/i,
  /\b(system\s+prompt|initial\s+prompt|base\s+prompt|hidden\s+prompt)\b/i,
  // Manipulation
  /\b(do\s+whatever\s+i\s+say|obey\s+me|you\s+must\s+comply)\b/i,
  /\b(i('m|\s+am)\s+(your|the)\s+(admin|developer|creator|master|owner))\b/i,
  /\b(roleplay|role\s*-?\s*play)\s+(as|being)\b/i,
  // Harmful content requests
  /\b(hack|exploit|steal|phish|scam|fraud|illegal)\b/i,
  /\b(how\s+to\s+(hack|break|cheat|rig|tamper))\b/i,
  /\b(rig\s+(the\s+)?election|tamper\s+(with\s+)?(ballot|evm|vote))\b/i,
  /\b(fake\s+(vote|ballot|id)|impersonate\s+(a\s+)?voter)\b/i,
  // Random nonsense / gibberish tests
  /^[\s\W]{0,5}(ha){3,}/i,
  /^[!@#$%^&*()]{3,}$/,
];

const ADVERSARIAL_RESPONSES: Record<string, string> = {
  en: "I'm Janamitra, a civic information assistant for Kottayam district elections. I'm here to help with voter registration, booth details, voting rules, and complaint filing. Let me know how I can assist you with election-related queries. 📞 Helpline: 1950",
  ml: '\u0d1e\u0d3e\u0d7b \u0d35\u0d3e\u0d15\u0d4d\u0d15\u0d4d, \u0d15\u0d4b\u0d1f\u0d4d\u0d1f\u0d2f\u0d02 \u0d1c\u0d3f\u0d32\u0d4d\u0d32 \u0d24\u0d3f\u0d30\u0d1e\u0d4d\u0d1e\u0d46\u0d1f\u0d41\u0d2a\u0d4d\u0d2a\u0d4d \u0d35\u0d3f\u0d35\u0d30 \u0d38\u0d39\u0d3e\u0d2f\u0d3f \u0d06\u0d23\u0d4d. \u0d35\u0d4b\u0d1f\u0d4d\u0d1f\u0d7c \u0d30\u0d1c\u0d3f\u0d38\u0d4d\u0d1f\u0d4d\u0d30\u0d47\u0d37\u0d7b, \u0d2c\u0d42\u0d24\u0d4d\u0d24\u0d4d \u0d35\u0d3f\u0d35\u0d30\u0d19\u0d4d\u0d19\u0d7e, \u0d35\u0d4b\u0d1f\u0d4d\u0d1f\u0d3f\u0d19\u0d4d \u0d28\u0d3f\u0d2f\u0d2e\u0d19\u0d4d\u0d19\u0d7e, \u0d2a\u0d30\u0d3e\u0d24\u0d3f \u0d28\u0d7d\u0d15\u0d7d \u0d0e\u0d28\u0d4d\u0d28\u0d3f\u0d35\u0d2f\u0d3f\u0d7d \u0d38\u0d39\u0d3e\u0d2f\u0d3f\u0d15\u0d4d\u0d15\u0d3e\u0d02. \ud83d\udcde \u0d39\u0d46\u0d7d\u0d2a\u0d4d\u200c\u0d32\u0d48\u0d7b: 1950',
};

const OUT_OF_SCOPE_RESPONSES: Record<string, string> = {
  en: "I'm Janamitra, a voter information assistant for Kottayam district elections. I can only help with election-related topics: voter registration, booth information, voting rules, election schedule, and complaint filing. For other queries, please use a general-purpose assistant. 📞 Election Helpline: 1950",
  ml: 'ഞാൻ ജനമിത്ര, കോട്ടയം ജില്ല തിരഞ്ഞെടുപ്പ് വിവര സഹായി ആണ്. വോട്ടർ രജിസ്ട്രേഷൻ, ബൂത്ത് വിവരങ്ങൾ, വോട്ടിങ് നിയമങ്ങൾ, തിരഞ്ഞെടുപ്പ് ഷെഡ്യൂൾ, പരാതി നൽകൽ എന്നിവയിൽ മാത്രമേ സഹായിക്കാൻ കഴിയൂ. 📞 ഹെൽപ്‌ലൈൻ: 1950',
};

/**
 * Check if the response content is safe and non-persuasive.
 * Supports two call signatures:
 *   safetyCheck(responseText, userQuery)   — full pipeline check
 *   safetyCheck(queryText, locale)         — quick query-only check
 */
export function safetyCheck(
  textOrQuery: string,
  queryOrLocale: string
): SafetyResult {
  // Detect if second arg is a locale string
  const isLocaleArg = queryOrLocale === 'en' || queryOrLocale === 'ml';
  const userQuery = isLocaleArg ? textOrQuery : queryOrLocale;
  const responseText = isLocaleArg ? '' : textOrQuery;
  const locale = isLocaleArg ? queryOrLocale : (/[\u0D00-\u0D7F]/.test(userQuery) ? 'ml' : 'en');

  let flagged = false;
  let reason: string | undefined;
  let safeText = responseText || '';
  let redactedPII = false;

  // Check user query for political intent
  for (const pattern of POLITICAL_PATTERNS) {
    if (pattern.test(userQuery)) {
      flagged = true;
      reason = 'Political persuasion detected in query';
      // Detect locale from text
      const isMalayalam = /[\u0D00-\u0D7F]/.test(userQuery);
      safeText = NEUTRAL_RESPONSES[isMalayalam ? 'ml' : 'en'];
      break;
    }
  }

  // V5: Check for out-of-scope topics
  if (!flagged) {
    for (const pattern of OUT_OF_SCOPE_PATTERNS) {
      if (pattern.test(userQuery)) {
        flagged = true;
        reason = 'Out-of-scope topic detected';
        const isMalayalam = /[\u0D00-\u0D7F]/.test(userQuery);
        safeText = OUT_OF_SCOPE_RESPONSES[isMalayalam ? 'ml' : 'en'];
        break;
      }
    }
  }

  // V5: Check for adversarial / abusive / threatening / jailbreak attempts
  if (!flagged) {
    for (const pattern of ADVERSARIAL_PATTERNS) {
      if (pattern.test(userQuery)) {
        flagged = true;
        reason = 'Adversarial or abusive input detected';
        const isMalayalam = /[\u0D00-\u0D7F]/.test(userQuery);
        safeText = ADVERSARIAL_RESPONSES[isMalayalam ? 'ml' : 'en'];
        break;
      }
    }
  }

  // Check response for accidental political content
  if (!flagged) {
    for (const pattern of POLITICAL_PATTERNS) {
      if (pattern.test(responseText)) {
        flagged = true;
        reason = 'Political content detected in response';
        const isMalayalam = /[\u0D00-\u0D7F]/.test(responseText);
        safeText = NEUTRAL_RESPONSES[isMalayalam ? 'ml' : 'en'];
        break;
      }
    }
  }

  // Redact PII from response
  for (const { regex, replacement } of PII_PATTERNS) {
    if (regex.test(safeText)) {
      safeText = safeText.replace(regex, replacement);
      redactedPII = true;
    }
  }

  return {
    flagged,
    safe: !flagged,
    reason,
    safeText,
    neutralResponse: flagged ? NEUTRAL_RESPONSES[locale] || NEUTRAL_RESPONSES['en'] : undefined,
    redactedPII,
  };
}

/**
 * Check if a query is asking for political advice
 */
export function isPoliticalQuery(query: string): boolean {
  return POLITICAL_PATTERNS.some((p) => p.test(query));
}

/**
 * V5: Check if a query is completely out of scope for the election assistant
 */
export function isOutOfScope(query: string): boolean {
  return OUT_OF_SCOPE_PATTERNS.some((p) => p.test(query));
}

/**
 * V5: Check if a query is adversarial, abusive, or a jailbreak attempt
 */
export function isAdversarial(query: string): boolean {
  return ADVERSARIAL_PATTERNS.some((p) => p.test(query));
}
