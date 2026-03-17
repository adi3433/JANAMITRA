/**
 * Response Guard
 * Ensures open-text answers remain safe when evidence is weak.
 */

export interface GuardInput {
  query: string;
  responseText: string;
  locale: 'en' | 'ml';
  confidence: number;
  sourcesCount: number;
  routerType: string;
  safetyFlagged: boolean;
}

export interface GuardOutput {
  text: string;
  confidence: number;
  forceEscalate: boolean;
  reason?: string;
}

const HIGH_RISK_QUERY = /\b(mandatory|required|legal|illegal|allowed|prohibited|can\s+i|is\s+it\s+legal|without\s+(a\s+)?(voter\s*)?(id|card)|deadline|last\s+date|bank\s+account|election\s+expense|election\s+expenditure|penalty|punishment)\b/i;

const HAS_UNCERTAINTY = /\b(not\s+fully\s+confident|may\s+vary|please\s+verify|verify\s+using|official\s+source|check\s+official|tba|to\s+be\s+announced|i\s+cannot\s+confirm)\b/i;

function cautionBlock(locale: 'en' | 'ml'): string {
  if (locale === 'ml') {
    return '\n\n**പരിശോധന കുറിപ്പ്:** ഈ ഉത്തരത്തിൽ ചില വിവരങ്ങൾ സാഹചര്യാനുസരണം മാറാം. ദയവായി ഔദ്യോഗിക സ്രോതസുകൾ ഉപയോഗിച്ച് സ്ഥിരീകരിക്കുക: eci.gov.in, voters.eci.gov.in, ceokerala.gov.in. ഹെൽപ്‌ലൈൻ: 1950';
  }

  return '\n\n**Verification note:** Some details can vary by notification/state rules. Please verify using official sources: eci.gov.in, voters.eci.gov.in, ceokerala.gov.in. Helpline: 1950';
}

export function applyResponseGuard(input: GuardInput): GuardOutput {
  const { query, responseText, locale, sourcesCount, routerType, safetyFlagged } = input;
  let confidence = input.confidence;

  if (safetyFlagged) {
    return { text: responseText, confidence, forceEscalate: false };
  }

  const isOpenTextPath = routerType === 'rag' || routerType === 'voice_then_rag';
  const hasWeakEvidence = isOpenTextPath && sourcesCount === 0;

  if (!hasWeakEvidence) {
    return { text: responseText, confidence, forceEscalate: false };
  }

  if (confidence > 0.72) {
    confidence = 0.72;
  }

  const riskyQuery = HIGH_RISK_QUERY.test(query);
  const hasCaution = HAS_UNCERTAINTY.test(responseText);

  if (riskyQuery && !hasCaution) {
    confidence = Math.min(confidence, 0.62);
    return {
      text: responseText.trim() + cautionBlock(locale),
      confidence,
      forceEscalate: true,
      reason: 'weak_evidence_risky_query',
    };
  }

  return {
    text: responseText,
    confidence,
    forceEscalate: false,
    reason: 'weak_evidence_confidence_capped',
  };
}
