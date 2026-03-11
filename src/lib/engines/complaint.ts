/**
 * V5 Complaint Intelligence Engine
 * ──────────────────────────────────
 * Data Source: complaints.json
 *
 * Capabilities:
 *   - Explain cVIGIL steps
 *   - List violation types/categories
 *   - Provide helpline 1950
 *   - Offer offline complaint alternatives
 *   - Response time expectation (100-min SLA)
 *
 * NEVER simulates filing a complaint.
 * Only guides users to official channels.
 */

import complaintsData from '@/data/complaints.json';

// ── Types ────────────────────────────────────────────────────────

export interface ComplaintResult {
  subIntent: string;
  formattedResponse: string;
  confidence: number;
}

// ── Engine functions ─────────────────────────────────────────────

/**
 * Explain cVIGIL complaint filing steps
 */
function getCvigilSteps(locale: string): string {
  const isMl = locale === 'ml';
  const overview = complaintsData.cvigil_overview;
  const process = complaintsData.complaint_process;

  let response = isMl
    ? `**cVIGIL — ${overview.full_name}**\n\n`
    : `**cVIGIL — ${overview.full_name}**\n\n`;

  response += `${overview.purpose}\n\n`;

  response += isMl
    ? `**ഘട്ടം ഘട്ടമായുള്ള പ്രക്രിയ:**\n\n`
    : `**Step-by-Step Process:**\n\n`;

  for (const step of process.steps) {
    response += isMl
      ? `**ഘട്ടം ${step.step}** (${step.actor}): ${step.action}\n`
      : `**Step ${step.step}** (${step.actor}): ${step.action}\n`;
    response += `  _${step.details}_\n\n`;
  }

  response += `**${isMl ? 'ടാർഗെറ്റ് SLA' : 'Target SLA'}:** ${process.total_sla}\n`;
  response += `_${process.note}_\n\n`;

  // App links
  response += isMl ? '**ആപ്പ് ഡൗൺലോഡ്:**\n' : '**Download cVIGIL App:**\n';
  response += `- Android: [Google Play](${overview.app_platforms.android})\n`;
  response += `- iOS: ${overview.app_platforms.ios}\n`;
  response += `- Portal: [${overview.portal}](${overview.portal})\n`;
  response += `\n${isMl ? 'അജ്ഞാത പരാതി' : 'Anonymous complaints'}: ${overview.anonymous_complaint.supported ? 'Supported' : 'Not supported'} — _${overview.anonymous_complaint.limitations}_`;

  return response;
}

/**
 * List all violation types/categories
 */
function getViolationTypes(locale: string): string {
  const isMl = locale === 'ml';
  const data = complaintsData.violation_types;

  let response = isMl
    ? `**MCC ലംഘന വിഭാഗങ്ങൾ (cVIGIL)**\n\n`
    : `**MCC Violation Categories (cVIGIL)**\n\n`;

  for (const cat of data.categories) {
    response += `- **${cat.id}: ${cat.name}**\n  _${cat.description}_\n`;
  }

  return response;
}

/**
 * Provide offline complaint alternatives
 */
function getOfflineOptions(locale: string): string {
  const isMl = locale === 'ml';
  const data = complaintsData.offline_complaint_options;

  let response = isMl
    ? `**ഓഫ്‌ലൈൻ പരാതി മാർഗങ്ങൾ**\n\n`
    : `**Alternative Complaint Methods (Without App)**\n\n`;

  for (const option of data.options) {
    response += `**${option.method}**\n`;
    if ('contact' in option && option.contact) response += `  ${isMl ? 'ബന്ധപ്പെടുക' : 'Contact'}: ${option.contact}\n`;
    if ('description' in option && option.description) response += `  ${option.description}\n`;
    if ('note' in option && option.note) response += `  _${option.note}_\n`;
    if ('portal' in option && option.portal) response += `  [${option.portal}](${option.portal})\n`;
    response += '\n';
  }

  return response;
}

/**
 * Response time / SLA expectation
 */
function getResponseTime(locale: string): string {
  const isMl = locale === 'ml';
  const sla = complaintsData.cvigil_overview.resolution_sla_minutes;

  let response = isMl
    ? `**cVIGIL പ്രതികരണ സമയം**\n\n`
    : `**cVIGIL Response Time**\n\n`;

  response += isMl
    ? `ടാർഗെറ്റ് SLA: സമർപ്പണം മുതൽ പരിഹാരം വരെ **${sla} മിനിറ്റ്**\n\n`
    : `Target SLA: **${sla} minutes** from submission to resolution\n\n`;

  response += complaintsData.complaint_process.note + '\n\n';
  response += isMl
    ? '**പ്രക്രിയ:**\n'
    : '**Process flow:**\n';
  response += isMl
    ? `1. പൗരൻ സമർപ്പിക്കുന്നു → 2. DCR ഫ്ലൈയിംഗ് സ്ക്വാഡിനെ നിയോഗിക്കുന്നു → 3. ഫീൽഡ് ടീം അന്വേഷിക്കുന്നു → 4. RO തീരുമാനിക്കുന്നു → 5. സ്ഥിതി അപ്‌ഡേറ്റ് ചെയ്യുന്നു\n\n`
    : `1. Citizen submits → 2. DCR assigns Flying Squad → 3. Field team investigates → 4. RO decides → 5. Status updated\n\n`;
  response += `${isMl ? 'ഹെൽപ്‌ലൈൻ' : 'Helpline'}: **1950**`;

  return response;
}

/**
 * Track complaint status info
 */
function getTrackComplaint(locale: string): string {
  const isMl = locale === 'ml';

  let response = isMl
    ? `**പരാതി ട്രാക്കിങ്**\n\n`
    : `**Complaint Tracking**\n\n`;

  response += isMl
    ? 'നിങ്ങളുടെ cVIGIL പരാതിയുടെ സ്ഥിതി ട്രാക്ക് ചെയ്യാൻ:\n\n'
    : 'To track your cVIGIL complaint status:\n\n';

  if (isMl) {
    response += '1. നിങ്ങളുടെ ഫോണിൽ **cVIGIL ആപ്പ്** തുറക്കുക\n';
    response += '2. നിങ്ങളുടെ **പരാതി ഐഡി** ഉപയോഗിക്കുക (സമർപ്പണ സമയത്ത് ലഭിച്ചത്)\n';
    response += `3. അല്ലെങ്കിൽ പോർട്ടൽ സന്ദർശിക്കുക: [cvigil.eci.gov.in](${complaintsData.cvigil_overview.portal})\n\n`;
    response += '_Janamitra പരാതി നേരിട്ട് ട്രാക്ക് ചെയ്യാൻ കഴിയില്ല. ഔദ്യോഗിക ആപ്പ്/പോർട്ടൽ ഉപയോഗിക്കുക._';
  } else {
    response += '1. Open the **cVIGIL app** on your phone\n';
    response += '2. Use your **Complaint ID** (received at submission)\n';
    response += `3. Or visit the portal: [cvigil.eci.gov.in](${complaintsData.cvigil_overview.portal})\n\n`;
    response += '_Janamitra cannot track complaints directly. Please use the official app or portal._';
  }

  return response;
}

/**
 * Important notes about cVIGIL
 */
function getImportantNotes(locale: string): string {
  const isMl = locale === 'ml';

  let response = isMl
    ? `**cVIGIL — പ്രധാന കുറിപ്പുകൾ**\n\n`
    : `**cVIGIL — Important Notes**\n\n`;

  for (const note of complaintsData.important_notes) {
    response += `- ${note}\n`;
  }

  return response;
}

/**
 * Main entry point — route sub-intent to correct handler
 */
export function getComplaintResponse(subIntent?: string, query?: string, locale: string = 'en'): ComplaintResult {
  // Auto-detect sub-intent from query
  if (!subIntent && query) {
    const lq = query.toLowerCase();
    if (/\b(cvigil|c-vigil|app|how\s+to\s+(file|report|submit))\b/i.test(lq) || /എങ്ങനെ\s*റിപ്പോർട്ട്|പരാതി\s*നൽക/i.test(lq)) subIntent = 'cvigil_steps';
    else if (/\b(type|categor|kind\s+of\s+violation|what\s+can\s+i\s+report)\b/i.test(lq) || /ലംഘന\s*വിഭാഗ/i.test(lq)) subIntent = 'violation_types';
    else if (/\b(offline|without\s+app|phone|call|alternative|other\s+way)\b/i.test(lq) || /ഓഫ്‌ലൈൻ/i.test(lq)) subIntent = 'offline_complaint';
    else if (/\b(track|status|follow\s*up|my\s+complaint)\b/i.test(lq) || /സ്റ്റാറ്റസ്|ട്രാക്ക്/i.test(lq)) subIntent = 'track_complaint';
    else if (/\b(sla|time|how\s+long|response\s+time|how\s+fast)\b/i.test(lq) || /എത്ര\s*സമയം/i.test(lq)) subIntent = 'response_time';
  }

  const handlers: Record<string, (l: string) => string> = {
    cvigil_steps: getCvigilSteps,
    violation_types: getViolationTypes,
    offline_complaint: getOfflineOptions,
    track_complaint: getTrackComplaint,
    response_time: getResponseTime,
    important_notes: getImportantNotes,
  };

  if (subIntent && handlers[subIntent]) {
    return {
      subIntent,
      formattedResponse: handlers[subIntent](locale),
      confidence: 0.95,
    };
  }

  // Default: full cVIGIL overview
  let response = getCvigilSteps(locale);
  response += '\n\n---\n\n';
  response += getViolationTypes(locale);
  response += '\n\n---\n\n';
  response += getOfflineOptions(locale);
  response += `\n${locale === 'ml' ? 'ഹെൽപ്‌ലൈൻ' : 'Helpline'}: **1950**`;

  return {
    subIntent: 'overview',
    formattedResponse: response,
    confidence: 0.90,
  };
}
