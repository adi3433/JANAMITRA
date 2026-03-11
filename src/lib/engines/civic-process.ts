/**
 * V5 Civic Process Engine
 * ───────────────────────
 * Data Source: voter_services.json
 *
 * Capabilities:
 *   - Intent-based form recommendation
 *   - Document checklist generation
 *   - Deadline-aware reasoning
 *   - Process guidance with official links
 */

import voterServicesData from '@/data/voter_services.json';

// ── Types ────────────────────────────────────────────────────────

export interface FormRecommendation {
  formNumber: string;
  title: string;
  purpose: string;
  whoShouldUse: string[];
  reason: string;
  legalReference?: string;
  onlinePortal?: string;
  estimatedProcessingTime?: string;
}

export interface DocumentChecklist {
  formNumber: string;
  required: Record<string, string | string[]>;
  notes?: string;
}

export interface FormGuidanceResult {
  recommendation: FormRecommendation;
  checklist: DocumentChecklist;
  formattedResponse: string;
  confidence: number;
}

// ── Intent → Form mapping (from dataset) ─────────────────────────

const INTENT_MAP: Record<string, string> = voterServicesData.intent_routing_map;
const FORMS: Record<string, typeof voterServicesData.forms[keyof typeof voterServicesData.forms]> =
  voterServicesData.forms as Record<string, typeof voterServicesData.forms[keyof typeof voterServicesData.forms]>;

/**
 * Map a user intent or sub-intent to the correct ECI form
 */
export function recommendForm(subIntent?: string, query?: string): FormRecommendation | null {
  let formKey: string | null = null;

  // Direct sub-intent mapping
  if (subIntent) {
    const subMap: Record<string, string> = {
      form_6: 'Form-6',
      form_6a: 'Form-6A',
      form_7: 'Form-7',
      form_8: 'Form-8',
      form_12c: 'Form-12C',
      form_m: 'Form-M',
    };
    formKey = subMap[subIntent] || null;
  }

  // If not resolved by sub-intent, use query-based intent detection
  if (!formKey && query) {
    const lq = query.toLowerCase();
    for (const [intent, form] of Object.entries(INTENT_MAP)) {
      const keywords = intent.replace(/_/g, ' ').split(' ');
      const matchCount = keywords.filter(kw => lq.includes(kw)).length;
      if (matchCount >= 2 || (keywords.length === 1 && matchCount === 1)) {
        formKey = form;
        break;
      }
    }
  }

  // Keyword-based fallback
  if (!formKey && query) {
    const lq = query.toLowerCase();
    if (/\b(new\s+voter|first\s+time|register|turn(ing)?\s+18)\b/i.test(lq) || /പുതിയ\s*വോട്ടർ|രജിസ്റ്റർ\s*ചെയ്യ/i.test(lq)) formKey = 'Form-6';
    else if (/\b(overseas|nri|abroad)\b/i.test(lq) || /വിദേശ\s*വോട്ടർ|എൻആർഐ|പ്രവാസി/i.test(lq)) formKey = 'Form-6A';
    else if (/\b(delete|remove|deceased|dead|objection)\b/i.test(lq) || /നീക്കം\s*ചെയ്യ|മരണപ്പെട്ട/i.test(lq)) formKey = 'Form-7';
    else if (/\b(correct|shift|replace|lost|damaged|pwd|address\s+(change|update))\b/i.test(lq) || /തിരുത്തൽ|വിലാസം\s*മാറ്റം|നഷ്ടപ്പെട്ട/i.test(lq)) formKey = 'Form-8';
    else if (/\b(migrant|form[\s-]*m)\b/i.test(lq) || /കുടിയേറ്റ\s*വോട്ടർ/i.test(lq)) formKey = 'Form-M';
    else if (/\b(notified|government\s+employee|form[\s-]*12c)\b/i.test(lq) || /സർക്കാർ\s*ജീവനക്കാർ/i.test(lq)) formKey = 'Form-12C';
    else if (/ഫോം\s*(\d+[a-zA-Z]?)/i.test(lq)) {
      const m = lq.match(/ഫോം\s*(\d+[a-zA-Z]?)/i);
      if (m) {
        const num = m[1].toLowerCase();
        if (num === '6a') formKey = 'Form-6A';
        else if (num === '6') formKey = 'Form-6';
        else if (num === '7') formKey = 'Form-7';
        else if (num === '8') formKey = 'Form-8';
        else if (num === '12c') formKey = 'Form-12C';
      }
    }
  }

  if (!formKey || !FORMS[formKey]) return null;

  const form = FORMS[formKey] as Record<string, unknown>;
  const whoShouldUse = (form.who_should_use ?? []) as string[];

  // Build reason for recommendation
  let reason = `This form is applicable because `;
  if (formKey === 'Form-6') reason += 'you need to register as a new voter.';
  else if (formKey === 'Form-6A') reason += 'you are an overseas (NRI) voter.';
  else if (formKey === 'Form-7') reason += 'you want to object to or delete an entry from the electoral roll.';
  else if (formKey === 'Form-8') reason += 'you need to update, correct, or replace voter details/EPIC.';
  else if (formKey === 'Form-12C') reason += 'you are a notified migrant (government employee/pensioner) voting from your current location.';
  else if (formKey === 'Form-M') reason += 'you are a migrant voter wanting to vote at a special polling station.';

  return {
    formNumber: form.form_number as string,
    title: form.title as string,
    purpose: form.purpose as string,
    whoShouldUse,
    reason,
    legalReference: form.legal_reference as string | undefined,
    onlinePortal: (form as Record<string, unknown>).online_portal as string | undefined,
    estimatedProcessingTime: (form as Record<string, unknown>).estimated_processing_time as string | undefined,
  };
}

/**
 * Generate document checklist for a given form  
 */
export function getDocumentChecklist(formNumber: string): DocumentChecklist | null {
  const form = FORMS[formNumber] as Record<string, unknown> | undefined;
  if (!form) return null;

  const requiredDocs = (form.required_documents ?? {}) as Record<string, string | string[]>;

  return {
    formNumber,
    required: requiredDocs,
    notes: typeof requiredDocs.notes === 'string' ? requiredDocs.notes : undefined,
  };
}

/**
 * Build a generic document requirements overview when no specific form is identified
 */
function buildGenericDocumentResponse(locale: string): string {
  const isMl = locale === 'ml';

  let response = isMl
    ? '**വോട്ടർ സേവനങ്ങൾക്ക് ആവശ്യമായ രേഖകൾ**\n\n'
    : '**Documents Required for Voter Services**\n\n';

  // General documents for registration (Form 6)
  response += isMl
    ? '**1. പുതിയ വോട്ടർ രജിസ്ട്രേഷൻ (ഫോം 6):**\n'
    : '**1. New Voter Registration (Form 6):**\n';
  response += isMl
    ? '- **പ്രായ തെളിവ്:** (ഏതെങ്കിലും ഒന്ന്)\n  - ജനന സർട്ടിഫിക്കറ്റ്\n  - സ്‌കൂൾ വിടുതൽ സർട്ടിഫിക്കറ്റ്\n  - പാസ്‌പോർട്ട്\n  - PAN കാർഡ്\n  - ആധാർ കാർഡ്\n'
    : '- **Proof of Age:** (any one)\n  - Birth certificate\n  - School leaving certificate\n  - Passport\n  - PAN card\n  - Aadhaar card\n';
  response += isMl
    ? '- **വിലാസ തെളിവ്:** (ഏതെങ്കിലും ഒന്ന്)\n  - ആധാർ കാർഡ്\n  - യൂട്ടിലിറ്റി ബിൽ\n  - ബാങ്ക് പാസ്‌ബുക്ക്\n  - വാടക കരാർ\n'
    : '- **Proof of Address:** (any one)\n  - Aadhaar card\n  - Utility bill\n  - Bank passbook\n  - Rent agreement\n';
  response += isMl
    ? '- **പാസ്‌പോർട്ട് സൈസ് ഫോട്ടോ:** 1 എണ്ണം\n\n'
    : '- **Passport-size Photograph:** 1 copy\n\n';

  // ID documents at polling booth
  response += isMl
    ? '**2. വോട്ടിങ് ദിവസം അംഗീകൃത ഫോട്ടോ ഐഡി (12 രേഖകൾ):**\n'
    : '**2. Accepted Photo ID at the Polling Booth (12 documents):**\n';
  const ids = [
    isMl ? 'EPIC / വോട്ടർ ഐഡി കാർഡ്' : 'EPIC / Voter ID Card',
    isMl ? 'ആധാർ കാർഡ്' : 'Aadhaar Card',
    isMl ? 'പാസ്‌പോർട്ട്' : 'Passport',
    isMl ? 'ഡ്രൈവിങ് ലൈസൻസ്' : 'Driving License',
    isMl ? 'PAN കാർഡ്' : 'PAN Card',
    isMl ? 'NPR സ്‌മാർട്ട് കാർഡ്' : 'NPR Smart Card',
    isMl ? 'MNREGA ജോബ് കാർഡ്' : 'MNREGA Job Card',
    isMl ? 'RSBY ഹെൽത്ത് ഇൻഷുറൻസ് കാർഡ്' : 'RSBY Health Insurance Smart Card',
    isMl ? 'ബാങ്ക്/പോസ്‌റ്റ് ഓഫീസ് പാസ്‌ബുക്ക് (ഫോട്ടോ ഉള്ളത്)' : 'Bank/Post Office Passbook with Photo',
    isMl ? 'PSU/സർക്കാർ സർവീസ് ഐഡി' : 'PSU/Government Service ID',
    isMl ? 'പെൻഷൻ ഡോക്യുമെന്റ് (ഫോട്ടോ ഉള്ളത്)' : 'Pension Document with Photo',
    isMl ? 'MP/MLA/MLC ഐഡന്റിറ്റി കാർഡ്' : 'MP/MLA/MLC Identity Card',
  ];
  for (const id of ids) {
    response += `- ${id}\n`;
  }

  response += '\n';

  // Other forms summary
  response += isMl
    ? '**3. മറ്റ് ഫോമുകൾ:**\n'
    : '**3. Other Forms:**\n';
  response += isMl
    ? '- **ഫോം 6A** (NRI വോട്ടർ): സാധുവായ ഇന്ത്യൻ പാസ്‌പോർട്ട് + വിദേശ വിലാസ തെളിവ്\n'
    : '- **Form 6A** (NRI Voter): Valid Indian passport + overseas address proof\n';
  response += isMl
    ? '- **ഫോം 7** (നീക്കം/ആക്ഷേപം): ആക്ഷേപിക്കേണ്ട EPIC നമ്പർ + തെളിവ്\n'
    : '- **Form 7** (Deletion/Objection): EPIC of entry to be objected + supporting evidence\n';
  response += isMl
    ? '- **ഫോം 8** (തിരുത്തൽ/മാറ്റം): നിലവിലെ EPIC + ശരിയായ വിവരങ്ങളുടെ തെളിവ്\n'
    : '- **Form 8** (Correction/Update): Current EPIC + proof of correct details\n';
  response += isMl
    ? '- **ഫോം 12C** (സർക്കാർ ജീവനക്കാർ): സർവീസ് ഐഡി + പോസ്‌റ്റിങ് ഓർഡർ\n\n'
    : '- **Form 12C** (Government Employees): Service ID + posting order\n\n';

  response += isMl
    ? 'ഒരു പ്രത്യേക ഫോമിനെക്കുറിച്ച് കൂടുതൽ വിവരങ്ങൾ ആവശ്യമെങ്കിൽ, "Form 6 രേഖകൾ" അല്ലെങ്കിൽ "Form 8 documents" എന്ന് ചോദിക്കുക.\n\n'
    : 'For detailed requirements for a specific form, ask "Form 6 documents" or "Form 8 requirements".\n\n';

  response += `${isMl ? 'ഹെൽപ്പ്‌ലൈൻ' : 'Helpline'}: **1950** | [voters.eci.gov.in](https://voters.eci.gov.in) | [CEO Kerala](https://www.ceo.kerala.gov.in)`;

  return response;
}

/**
 * Full form guidance response — combines recommendation + checklist
 */
export function getFormGuidance(subIntent?: string, query?: string, locale: string = 'en'): FormGuidanceResult | null {
  // Handle generic "documents required" / "checklist" queries that don't
  // reference a specific form — return a combined overview of all forms
  // and their document requirements instead of falling through to RAG.
  if (subIntent === 'checklist') {
    const rec = recommendForm(subIntent, query);
    if (!rec) {
      // No specific form matched — provide a general document summary
      return {
        recommendation: {
          formNumber: 'General',
          title: locale === 'ml' ? 'വോട്ടർ സേവനങ്ങൾക്ക് ആവശ്യമായ രേഖകൾ' : 'Documents Required for Voter Services',
          purpose: locale === 'ml' ? 'വോട്ടർ രജിസ്ട്രേഷൻ, തിരുത്തൽ, മാറ്റം എന്നിവയ്ക്ക് ആവശ്യമായ പൊതു രേഖകൾ' : 'Common documents needed for voter registration and related services',
          whoShouldUse: [],
          reason: '',
        },
        checklist: { formNumber: 'General', required: {} },
        formattedResponse: buildGenericDocumentResponse(locale),
        confidence: 0.93,
      };
    }
  }

  const rec = recommendForm(subIntent, query);
  if (!rec) return null;

  const checklist = getDocumentChecklist(rec.formNumber);
  if (!checklist) return null;

  const isMl = locale === 'ml';

  // Build formatted response
  let response = '';
  if (isMl) {
    response = `**${rec.formNumber} — ${rec.title}**\n\n`;
    response += `**ഉദ്ദേശ്യം:** ${rec.purpose}\n\n`;
    response += `**കാരണം:** ${rec.reason}\n\n`;
  } else {
    response = `**${rec.formNumber} — ${rec.title}**\n\n`;
    response += `**Purpose:** ${rec.purpose}\n\n`;
    response += `**Why this form:** ${rec.reason}\n\n`;
  }

  // Who should use
  if (rec.whoShouldUse.length > 0) {
    response += isMl ? '**ആർക്ക് ബാധകം:**\n' : '**Who should use:**\n';
    for (const who of rec.whoShouldUse) {
      response += `- ${who}\n`;
    }
    response += '\n';
  }

  // Required documents
  const docs = checklist.required;
  if (Object.keys(docs).length > 0) {
    response += isMl ? '**ആവശ്യമായ രേഖകൾ:**\n' : '**Required Documents:**\n';
    for (const [key, val] of Object.entries(docs)) {
      if (key === 'notes') continue;
      if (Array.isArray(val)) {
        response += `- **${key.replace(/_/g, ' ')}:** (any one)\n`;
        for (const item of val) {
          response += `  - ${item}\n`;
        }
      } else {
        response += `- **${key.replace(/_/g, ' ')}:** ${val}\n`;
      }
    }
    response += '\n';
  }

  // Processing time & portal
  if (rec.estimatedProcessingTime) {
    response += isMl
      ? `**പ്രോസസ്സിങ് സമയം:** ${rec.estimatedProcessingTime}\n`
      : `**Est. Processing Time:** ${rec.estimatedProcessingTime}\n`;
  }

  if (rec.onlinePortal) {
    response += isMl
      ? `**ഓൺലൈനായി സമർപ്പിക്കുക:** [${rec.onlinePortal}](${rec.onlinePortal})\n`
      : `**Submit Online:** [${rec.onlinePortal}](${rec.onlinePortal})\n`;
  }

  // Legal reference
  if (rec.legalReference) {
    response += `\n*${rec.legalReference}*\n`;
  }

  // Common resources
  response += `\n${isMl ? 'ഹെൽപ്പ്‌ലൈൻ' : 'Helpline'}: **1950** | [voters.eci.gov.in](https://voters.eci.gov.in) | [CEO Kerala](https://www.ceo.kerala.gov.in)`;

  return {
    recommendation: rec,
    checklist,
    formattedResponse: response,
    confidence: 0.95,
  };
}

/**
 * Get all available forms as a summary
 */
export function getAllFormsSummary(): string {
  const formList = Object.entries(FORMS).map(([_key, form]) => {
    const f = form as Record<string, unknown>;
    return `- **${f.form_number}**: ${f.title} — ${f.purpose}`;
  });
  return `**Available ECI Voter Service Forms:**\n\n${formList.join('\n')}\n\nAll forms can be submitted online at [voters.eci.gov.in](https://voters.eci.gov.in) or [nvsp.in](https://www.nvsp.in).\n\nHelpline: **1950**`;
}
