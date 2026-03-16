/**
 * V5 Voting Day Smart Assistant
 * ──────────────────────────────
 * Data Source: voting_rules.json
 *
 * Capabilities:
 *   - Allowed ID proof list
 *   - Poll timing information
 *   - Step-by-step voting process
 *   - EVM/VVPAT explanation
 *   - Prohibited items/activities
 *   - PwD & elderly facilities
 *   - Tender vote information
 *   - Silence period rules
 *   - Polling slip guidance
 */

import votingRulesData from '@/data/voting_rules.json';

// ── Types ────────────────────────────────────────────────────────

export interface VotingRulesResult {
  subIntent: string;
  formattedResponse: string;
  confidence: number;
}

// ── Engine functions ─────────────────────────────────────────────

/**
 * Get allowed photo ID documents list
 */
function getIdDocuments(locale: string): string {
  const isMl = locale === 'ml';
  const data = votingRulesData.allowed_photo_id_documents;
  
  let response = isMl
    ? `**വോട്ടിംഗ് സമയത്ത് അംഗീകൃത ഫോട്ടോ ഐഡി രേഖകൾ**\n\n`
    : `**Accepted Photo ID Documents at Polling Station**\n\n`;

  response += isMl
    ? `**പ്രാഥമിക ഐഡി:** ${data.primary_id.name}\n_${data.primary_id.note}_\n\n`
    : `**Primary ID:** ${data.primary_id.name}\n_${data.primary_id.note}_\n\n`;

  response += isMl ? '**ബദൽ ഐഡികൾ** (ഏതെങ്കിലും ഒന്ന്):\n' : '**Alternative IDs** (any ONE):\n';
  for (const alt of data.alternative_ids) {
    response += `${alt.id}. ${alt.document}\n`;
  }

  response += `\n_${data.important_note}_`;
  return response;
}

/**
 * Get poll timing information
 */
function getPollTiming(locale: string): string {
  const isMl = locale === 'ml';
  const data = votingRulesData.poll_timings;

  let response = isMl
    ? `**പോളിംഗ് സമയം**\n\n`
    : `**Poll Timings**\n\n`;

  response += isMl
    ? `- **ആരംഭം:** ${data.general.start}\n- **അവസാനം:** ${data.general.end}\n`
    : `- **Start:** ${data.general.start}\n- **End:** ${data.general.end}\n`;
  response += `- _${data.general.note}_\n\n`;

  response += isMl
    ? `**അവസാന വോട്ടർ നിയമം:** ${data.last_voter_rule}\n\n`
    : `**Last Voter Rule:** ${data.last_voter_rule}\n\n`;

  response += isMl
    ? `**മോക്ക് പോൾ:** ${data.mock_poll.time}\n_${data.mock_poll.purpose}_`
    : `**Mock Poll:** ${data.mock_poll.time}\n_${data.mock_poll.purpose}_`;

  return response;
}

/**
 * Get step-by-step voting process
 */
function getVotingProcess(locale: string): string {
  const isMl = locale === 'ml';
  const steps = votingRulesData.step_by_step_voting_process;

  let response = isMl
    ? `**വോട്ടിങ് പ്രക്രിയ — ഘട്ടം ഘട്ടമായി**\n\n`
    : `**Voting Process — Step by Step**\n\n`;

  for (const step of steps) {
    response += isMl
      ? `**ഘട്ടം ${step.step}:** ${step.action}\n`
      : `**Step ${step.step}:** ${step.action}\n`;
    response += `  _${step.detail}_\n\n`;
  }

  return response.trim();
}

/**
 * Get EVM/VVPAT explanation
 */
function getEvmVvpat(locale: string): string {
  const isMl = locale === 'ml';
  const evm = votingRulesData.evm_vvpat_explanation.evm;
  const vvpat = votingRulesData.evm_vvpat_explanation.vvpat;

  let response = isMl
    ? `**EVM & VVPAT വിശദീകരണം**\n\n`
    : `**EVM & VVPAT Explanation**\n\n`;

  response += `**EVM (${evm.full_form})**\n`;
  response += `- ${isMl ? 'ഘടകങ്ങൾ' : 'Components'}: ${evm.components.join(', ')}\n`;
  response += `- ${evm.how_it_works}\n`;
  response += `- ${evm.tamper_proof}\n\n`;

  response += `**VVPAT (${vvpat.full_form})**\n`;
  response += `- ${vvpat.purpose}\n`;
  response += `- ${isMl ? 'ദൃശ്യത' : 'Visibility'}: ${vvpat.visibility}\n`;
  response += `- ${vvpat.storage}\n`;
  response += `- ${vvpat.auditability}\n`;

  return response;
}

/**
 * Get prohibited items and activities
 */
function getProhibited(locale: string): string {
  const isMl = locale === 'ml';

  let response = isMl
    ? `**പോളിങ് സ്റ്റേഷനിൽ നിരോധിത ഇനങ്ങളും പ്രവർത്തനങ്ങളും**\n\n`
    : `**Prohibited Items & Activities at Polling Station**\n\n`;

  response += isMl ? '**നിരോധിത ഇനങ്ങൾ:**\n' : '**Prohibited Items:**\n';
  for (const item of votingRulesData.prohibited_items_at_polling_station) {
    response += `- ${item}\n`;
  }

  response += isMl ? '\n**നിരോധിത പ്രവർത്തനങ്ങൾ:**\n' : '\n**Prohibited Activities on Poll Day:**\n';
  for (const act of votingRulesData.prohibited_activities_on_poll_day) {
    response += `- ${act}\n`;
  }

  const sp = votingRulesData.silence_period;
  response += `\n**${isMl ? 'നിശ്ശബ്ദ കാലാവധി' : 'Silence Period'}:** ${sp.duration}\n`;
  response += `_${sp.description}_`;

  return response;
}

/**
 * Get PwD and elderly facilities
 */
function getPwdFacilities(locale: string): string {
  const isMl = locale === 'ml';
  const data = votingRulesData.pwd_and_elderly_facilities;

  let response = isMl
    ? `**${data.title}**\n\n`
    : `**${data.title}**\n\n`;

  for (const fac of data.facilities) {
    response += `- **${fac.facility}:** ${fac.detail}\n`;
  }

  response += `\n${isMl ? 'ഹെൽപ്‌ലൈൻ' : 'Helpline'}: **${data.helpline}**`;
  return response;
}

/**
 * Get tender vote information
 */
function getTenderVote(locale: string): string {
  const isMl = locale === 'ml';
  const data = votingRulesData.tender_vote;

  let response = isMl
    ? `**ടെൻഡർ വോട്ട്**\n\n`
    : `**Tender Vote**\n\n`;

  response += `${data.description}\n\n`;
  response += `**${isMl ? 'പ്രക്രിയ' : 'Process'}:** ${data.process}\n\n`;
  response += `_${data.note}_`;
  return response;
}

/**
 * Get polling slip info
 */
function getPollingSlip(locale: string): string {
  const isMl = locale === 'ml';
  const data = votingRulesData.polling_slip;

  let response = isMl
    ? `**പോളിങ് സ്ലിപ്പ്**\n\n`
    : `**Polling Slip**\n\n`;

  response += `${data.description}\n\n`;
  response += `**${isMl ? 'ഉദ്ദേശ്യം' : 'Purpose'}:** ${data.purpose}\n\n`;
  response += `_${data.note}_`;
  return response;
}

/**
 * Get silence period info
 */
function getSilencePeriod(locale: string): string {
  const isMl = locale === 'ml';
  const data = votingRulesData.silence_period;

  let response = isMl
    ? `**നിശ്ശബ്ദ കാലാവധി**\n\n`
    : `**Silence Period**\n\n`;

  response += `**${isMl ? 'കാലാവധി' : 'Duration'}:** ${data.duration}\n`;
  response += `**${isMl ? 'ബാധകം' : 'Applies to'}:** ${data.applies_to}\n\n`;
  response += `${data.description}`;
  return response;
}

/**
 * Get indelible ink rules
 */
function getIndelibleInk(_locale: string): string {
  const isMl = _locale === 'ml';
  const data = votingRulesData.indelible_ink_rules;
  return isMl
    ? `**അഴിച്ചുകളയാത്ത മഷി**\n\n- **പുരട്ടുന്ന സ്ഥലം:** ${data.applied_on}\n- **ഉദ്ദേശ്യം:** ${data.purpose}\n- **സ്ഥായിത്വം:** ${data.permanence}`
    : `**Indelible Ink**\n\n- **Applied on:** ${data.applied_on}\n- **Purpose:** ${data.purpose}\n- **Permanence:** ${data.permanence}`;
}

/**
 * Main entry point — route sub-intent to the right handler
 */
export function getVotingRulesResponse(subIntent?: string, query?: string, locale: string = 'en'): VotingRulesResult {
  // Auto-detect sub-intent from query if not provided
  if (!subIntent && query) {
    const lq = query.toLowerCase();
    if (/\b(voter\s*id|id\s*card|epic|photo\s*id|accepted\s*id|valid\s*id|what\s+(id|document)|documents?\s+(required|needed)|vote\s+without\s+(a\s+)?(voter\s*)?(id|card))\b/i.test(lq) || /ഐഡി\s*പ്രൂഫ്|രേഖകൾ|ഐഡി\s*കാർഡ്\s*ഇല്ലാതെ/i.test(lq)) subIntent = 'id_documents';
    else if (/\b(time|timing|when|hour|open|close)\b/i.test(lq) || /സമയം|എപ്പോൾ/i.test(lq)) subIntent = 'poll_timing';
    else if (/\b(evm|vvpat|machine)\b/i.test(lq) || /മെഷീൻ|വോട്ടിങ്\s*മെഷീൻ/i.test(lq)) subIntent = 'evm_vvpat';
    else if (/\b(prohibit(?:ed|ion)?|ban(?:ned)?|not\s+allowed|forbidden|restricted|not\s+permitted|cannot\s+carry|can\s*i\s*carry)\b/i.test(lq) || /നിരോധിത|അനുവദനീയമല്ല|കൊണ്ടുവരാൻ\s*പാടില്ല/i.test(lq)) subIntent = 'prohibited';
    else if (/\b(what\s+(can|should)\s+i\s+(bring|carry)\s+to\s+(the\s+)?(poll|polling\s*booth|polling\s*station|booth)|what\s+should\s+i\s+take\s+for\s+voting)\b/i.test(lq) || /എന്ത്\s*കൊണ്ടുപോകണം|പോളിംഗ്\s*ബൂത്തിലേക്ക്\s*എന്ത്/i.test(lq)) subIntent = 'id_documents';
    else if (/\b(pwd|disab|elderly|senior|wheelchair|braille|companion|home\s+voting)\b/i.test(lq) || /വികലാങ്കർ|വയോധികർ/i.test(lq)) subIntent = 'pwd_facilities';
    else if (/\b(step|process|how\s+to\s+vote)\b/i.test(lq) || /എങ്ങനെ\s*വോട്ട്|പ്രക്രിയ/i.test(lq)) subIntent = 'voting_process';
    else if (/\b(tender|impersonat)\b/i.test(lq)) subIntent = 'tender_vote';
    else if (/\b(silence|campaign\s+ban)\b/i.test(lq)) subIntent = 'silence_period';
    else if (/\b(slip|polling\s+slip)\b/i.test(lq) || /സ്ലിപ്പ്/i.test(lq)) subIntent = 'polling_slip';
    else if (/\b(ink|indelible)\b/i.test(lq) || /മഷി/i.test(lq)) subIntent = 'indelible_ink';
  }

  const handlers: Record<string, (l: string) => string> = {
    id_documents: getIdDocuments,
    poll_timing: getPollTiming,
    voting_process: getVotingProcess,
    evm_vvpat: getEvmVvpat,
    prohibited: getProhibited,
    pwd_facilities: getPwdFacilities,
    tender_vote: getTenderVote,
    polling_slip: getPollingSlip,
    silence_period: getSilencePeriod,
    indelible_ink: getIndelibleInk,
  };

  if (subIntent && handlers[subIntent]) {
    return {
      subIntent,
      formattedResponse: handlers[subIntent](locale),
      confidence: 0.95,
    };
  }

  // Default: return a comprehensive voting day overview
  let response = locale === 'ml'
    ? `**വോട്ടിങ് ദിവസ വിവരങ്ങൾ**\n\n`
    : `**Voting Day Information**\n\n`;

  response += getPollTiming(locale) + '\n\n---\n\n';
  response += getIdDocuments(locale) + '\n\n---\n\n';
  response += getVotingProcess(locale);

  response += `\n\n${locale === 'ml' ? 'ഹെൽപ്‌ലൈൻ' : 'Helpline'}: **1950** | [CEO Kerala](https://www.ceo.kerala.gov.in)`;

  return {
    subIntent: 'overview',
    formattedResponse: response,
    confidence: 0.90,
  };
}
