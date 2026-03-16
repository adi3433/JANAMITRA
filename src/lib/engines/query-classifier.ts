/**
 * V5 Query Classification Layer
 * ──────────────────────────────
 * Classifies every incoming query into a civic intent category
 * BEFORE routing to the appropriate engine.
 *
 * Categories:
 *   booth_query       → Booth Intelligence Engine
 *   roll_lookup       → Electoral Roll Engine (future)
 *   form_guidance     → Civic Process Engine
 *   voting_rules      → Voting Day Assistant
 *   complaint         → Complaint Intelligence Engine
 *   timeline          → Election Timeline Engine
 *   general_faq       → RAG Pipeline
 *   out_of_scope      → Civic boundary response
 */

import { ubRegex, mlRegex } from '@/lib/unicode-boundary';

export type QueryCategory =
  | 'booth_query'
  | 'roll_lookup'
  | 'form_guidance'
  | 'voting_rules'
  | 'complaint'
  | 'timeline'
  | 'general_faq'
  | 'out_of_scope';

export interface ClassificationResult {
  category: QueryCategory;
  confidence: number;
  /** Sub-intent for more specific routing */
  subIntent?: string;
  /** Extracted parameters from query */
  extractedParams: Record<string, string>;
}

// ── Pattern groups per category ──────────────────────────────────

const CATEGORY_PATTERNS: Array<{
  category: QueryCategory;
  patterns: RegExp[];
  subIntentPatterns?: Array<{ pattern: RegExp; subIntent: string }>;
  weight: number;
}> = [
  {
    category: 'booth_query',
    weight: 10,
    patterns: [
      /\b(booth|polling\s*station)\b/i,
      ubRegex('(ബൂത്ത്|ബൂത്തുകൾ|പോളിങ്\\s*സ്റ്റേഷൻ)'),
      /\b(where\s+(do\s+)?i\s+vote)\b/i,
      ubRegex('(എവിടെ\\s*വോട്ട്)'),
      /\b(find\s+my\s+booth|my\s+booth)\b/i,
      ubRegex('(എന്റെ\\s*ബൂത്ത്|എൻറെ\\s*ബൂത്ത്)'),
      /\b(station\s*number|booth\s*number)\b/i,
      ubRegex('(ബൂത്ത്\\s*നമ്പർ|പോളിങ്\\s*നമ്പർ|സ്റ്റേഷൻ\\s*നമ്പർ)'),
      /\b(nearest\s+polling|closest\s+booth)\b/i,
      /\b(booth\s+(near|in|at)|polling\s+station\s+(near|in|at))\b/i,
      /\bhow\s+many\s+booths?\b/i,
      ubRegex('(എത്ര\\s*ബൂത്ത്|എത്ര\\s*ബൂത്തുകൾ)'),
      /\b(lac\s*\d+|constituency\s+map)\b/i,
      /^\s*\d{1,3}\s*$/,  // bare booth number (1-999)
    ],
    subIntentPatterns: [
      { pattern: /\b(number|#|station\s*\d+|booth\s*\d+)\b/i, subIntent: 'by_number' },
      { pattern: ubRegex('(നമ്പർ\\s*\\d+|ബൂത്ത്\\s*\\d+)'), subIntent: 'by_number' },
      { pattern: /^\s*\d{1,3}\s*$/, subIntent: 'by_number' },
      { pattern: /\b(near|close|nearby|area|locality)\b/i, subIntent: 'by_locality' },
      { pattern: ubRegex('(constituency|lac|നിയ[ോ]ജക)'), subIntent: 'constituency_map' },
    ],
  },
  {
    category: 'roll_lookup',
    weight: 10,
    patterns: [
      /\b(registration|registered|enrolled|voter\s*list|am\s+i\s+registered)\b/i,
      ubRegex('(രജിസ്ട്രേഷൻ|രജിസ്റ്റർ|വോട്ടർ\\s*ലിസ്റ്റ്)'),
      /\b(check.*(epic|voter\s*id)|epic\s*check|voter\s*id\s*(check|status))\b/i,
      ubRegex('(എപിക്\\s*ചെക്ക്)'),
      /\b(is\s+my\s+name)\b/i,
      /\b(electoral\s*roll|voter\s*roll|name\s+in\s+list)\b/i,
      /\b(epic\s*number|voter\s*id\s*number)\b/i,
    ],
    subIntentPatterns: [
      { pattern: /\b(check|verify|search|find|look\s*up)\b/i, subIntent: 'search' },
      { pattern: /\b(correct|wrong|mistake|update|change)\b/i, subIntent: 'correction' },
      { pattern: /\b(duplicate|double|two\s+entries)\b/i, subIntent: 'duplicate' },
    ],
  },
  {
    category: 'form_guidance',
    weight: 9,
    patterns: [
      /\b(form[\s-]*(6|6a|7|8|8a|12c|m))\b/i,
      /\b(new\s+voter|first\s+time\s+voter|register\s+as\s+voter)\b/i,
      mlRegex('(പുതിയ\\s*വോട്ട|ആദ്യമായി\\s*വോട്ട)'),
      mlRegex('(രജിസ്റ്റർ\\s*ചെയ്യ|ഫോം\\s*\\d+)'),
      /\b(name\s+correction|correct(ion)?\s+(my\s+)?name|address\s+(change|correction|update))\b/i,
      /\b(shift(ed)?\s+(my\s+)?(house|residence|address))\b/i,
      /\b(moved\s+(house|city|state|to\s+a\s+new\s+address)|relocated|changed\s+(my\s+)?address)\b/i,
      /\b(lost\s+(my\s+)?(voter\s*id|epic|card)|voter\s*(id|card|id\s*card)\s+(is\s+)?lost|damaged\s+(my\s+)?(epic|card|voter\s*id))\b/i,
      /\b(delete\s+(name|voter)|remove\s+(deceased|dead)\s+voter)\b/i,
      /\b(overseas\s+voter|nri\s+voter|abroad\s+voting)\b/i,
      /\b(objection|deletion\s+request)\b/i,
      /\b(pwd\s+marking|disability\s+marking)\b/i,
      /\b(wrong|incorrect)\s+(address|name|details?)\s+(on|in)\s+(voter|my)\b/i,
      /\b(address\s+on\s+voter\s+(card|id)\s+(is\s+)?wrong)\b/i,
      /\bi\s+(am|turned|just\s+turned)\s+18\b/i,
      /\b(apply|get|obtain)\s+(for\s+)?(voter\s*(id|card)|epic)\s*(online|card)?\b/i,
      /\b(how\s+to\s+(get|apply|obtain)\s+(a\s+)?(voter\s*(id|card)))\b/i,
      /\b(register\s+(as\s+)?(a\s+)?voter\s+from)\b/i,
      /\b(voter\s+registration|voter\s+id\s+(application|apply))\b/i,
      /\b(transfer\s+(voter\s*(id|card)|my\s+voter)|relocat(ed|e|ion))\b/i,
      /\b(documents?\s+(are\s+)?(required|needed|necessary))\b/i,
      /\b(what\s+(documents?|papers)\s+(are\s+)?(required|needed|necessary))\b/i,
      /\b(what\s+papers)\b/i,
      mlRegex('(രേഖകൾ|ഡോക്യുമെന്റ്|അപേക്ഷ)'),
      // Extended Malayalam form guidance patterns
      mlRegex('(പേര്\\s*തിരുത്ത|തിരുത്ത)'),
      mlRegex('(നഷ്ടപ്പെട്ട|കാണാതായ|നഷ്ടമായ)'),
      mlRegex('(വീട്\\s*മാറി|വിലാസം\\s*മാറ്റ|വിലാസ\\s*മാറ്റ)'),
      mlRegex('(മരിച്ച|മരണപ്പെട്ട|നീക്കം\\s*ചെയ്യ)'),
      mlRegex('(വിദേശ\\s*വോട്ടർ|എൻആർഐ|പ്രവാസി)'),
      mlRegex('(വിലാസം\\s*തെറ്റ|തെറ്റായ\\s*വിലാസ)'),
      mlRegex('(18\\s*വയസ്സ|പതിനെട്ട്)'),
      mlRegex('(ഓൺലൈൻ|ഓൺലൈനായി)'),
      mlRegex('(കേടായ|പൊട്ടിയ|മാറ്റിസ്ഥാപി)'),
      mlRegex('(ട്രാൻസ്ഫർ|മാറ്റം\\s*ചെയ്യ)'),
      mlRegex('(രജിസ്ട്രേഷ.*തീയതി|തീയതി.*രജിസ്ട്രേഷ)'),
      /\b(NRI|migrant\s+voter)\b/i,
    ],
    subIntentPatterns: [
      { pattern: /\b(form[\s-]*6a|overseas|nri|abroad)\b/i, subIntent: 'form_6a' },
      { pattern: /\b(form[\s-]*6|new\s+voter|first\s+time|register|\b18\b|turn(?:ed)?\s+18)\b/i, subIntent: 'form_6' },
      { pattern: /\b(form[\s-]*7|delete|remove|objection|deceased)\b/i, subIntent: 'form_7' },
      { pattern: /\b(form[\s-]*8|correct(?:ion)?|shift(?:ed)?|replace|pwd|lost|damaged|address|relocat|transfer)\b/i, subIntent: 'form_8' },
      { pattern: /\b(form[\s-]*12c|notified|government\s+employee)\b/i, subIntent: 'form_12c' },
      { pattern: /\b(form[\s-]*m|migrant)\b/i, subIntent: 'form_m' },
      { pattern: /\b(document|papers|required|checklist)\b/i, subIntent: 'checklist' },
      { pattern: /(രേഖകൾ|ഡോക്യുമെന്റ്|എന്തൊക്കെ)/i, subIntent: 'checklist' },
      { pattern: /\b(deadline|last\s+date|when\s+to\s+apply)\b/i, subIntent: 'deadline' },
    ],
  },
  {
    category: 'voting_rules',
    weight: 8,
    patterns: [
      /\b(how\s+(to|do\s+i)\s+vote|voting\s+process|step.*(by|to)\s*step)\b/i,
      /\b(evm|vvpat|voting\s+machine|electronic\s+voting)\b/i,
      /\b(id\s+(proof|document)|photo\s+id|what\s+id)\b/i,
      /\b(poll(ing)?\s+tim(e|ing)|what\s+time|when\s+(does|do)\s+voting)\b/i,
      /\b(prohibited|not\s+allowed|banned|can\s+i\s+(bring|carry|take))\b/i,
      /\b(what\s+is\s+(illegal|legal|allowed|permitted)\s+(during|in|at)\s+elections?)\b/i,
      /\b(is\s+\w+\s+(illegal|legal|allowed|permitted)\s*(during|in|at)?\s*(elections?|voting|poll)?)\b/i,
      /\b(tender\s*vote|indelible\s*ink|ink\s+(mark\s+)?on\s+(the\s+)?finger)\b/i,
      /\b(pwd\s+(facility|access|support)|elderly\s+(voter|support)|wheelchair)\b/i,
      /\b(disab(?:led|ility)\s+voters?|disab(?:led|ility)\s+(?:facilit|access|support))\b/i,
      /\b(facilit(?:y|ies)\s+for\s+(?:disabled|pwd|elderly|senior)\s+voters?)\b/i,
      /\b(blind\s+(person|people|voter)|visually\s+impaired)\b/i,
      /\b(braille|companion|home\s+voting|postal\s+ballot)\b/i,
      /\b(silence\s+period|campaign\s+ban)\b/i,
      /\b(mock\s+poll|last\s+voter\s+rule)\b/i,
      /\b(polling\s+slip|voter\s+slip)\b/i,
      /\b(allowed\s+id|accepted\s+id|valid\s+id)\b/i,
      /\b(aadhaar|aadhar)\s+(card\s+)?(accepted|valid|work|as\s+(voter\s+)?id)\b/i,
      /\bvote\s+without\s+(voter\s*)?(id|card)\b/i,
      /\bwithout\s+(voter\s*)?(id|card)\s+(can\s+i\s+)?vote\b/i,
      /\bcan\s+i\s+vote\s+without\b/i,
      /\b(candidate|election\s+agent|party)\s+(bank\s+account|separate\s+account|election\s+account)\b/i,
      /\b(mandatory|required)\b.*\b(separate\s+bank\s+account|election\s+account)\b/i,
      /\b(election\s+expense|campaign\s+expense|election\s+expenditure|candidate\s+expenses?)\b/i,
      /\b(what\s+(can|should)\s+i\s+(bring|carry)\s+to\s+(the\s+)?(poll|polling\s*booth|polling\s*station|booth)|what\s+should\s+i\s+take\s+for\s+voting)\b/i,
      mlRegex('(എങ്ങനെ\\s*വോട്ട്\\s*ചെയ്യ|വോട്ടിങ്\\s*നിയമ|ഐഡി\\s*പ്രൂഫ്|വോട്ടിങ്\\s*സമയ)'),
      // Extended Malayalam voting rules patterns
      mlRegex('(നിരോധിച്ച|നിരോധന|അനുവദനീയമല്ല|കൊണ്ടുപോകാമോ)'),
      mlRegex('(ടെൻഡർ\\s*വോട്ട്|മഷി\\s*അടയാള|വിരലിലെ\\s*മഷി)'),
      mlRegex('(വോട്ടിങ്\\s*പ്രക്രിയ|ഘട്ടം\\s*ഘട്ടമായി)'),
      mlRegex('(നിശബ്ദ\\s*കാല|നിശ്ശബ്ദ\\s*കാല)'),
      mlRegex('(ആധാർ|ആധാര്\u200d)'),
      mlRegex('(ഐഡി\\s*ഇല്ലാതെ|ഐഡി\\s*കാർഡ്\\s*ഇല്ലാതെ)'),
      mlRegex('(ഫോട്ടോ\\s*ഐഡി|സ്വീകാര്യമായ\\s*ഐഡി)'),
      mlRegex('(വീൽചെയർ|സൗകര്യ)'),
      mlRegex('(അന്ധ|കാഴ്ച\\s*ഇല്ലാത്ത)'),
      mlRegex('(പോസ്റ്റൽ\\s*ബാലറ്റ്|തപാൽ\\s*വോട്ട്)'),
      mlRegex('(മോക്ക്\\s*പോൾ)'),
      mlRegex('(അവസാന\\s*വോട്ടർ\\s*നിയമ)'),
      mlRegex('(പോളിങ്\\s*സ്ലിപ്പ്|വോട്ടർ\\s*സ്ലിപ്പ്)'),
      mlRegex('(നിയമവിരുദ്ധ|നിയമ\\s*വിരുദ്ധ)'),
      mlRegex('(ബാലറ്റ്\\s*പേപ്പർ)'),
      mlRegex('(എപ്പോൾ\\s*തുടങ്ങ|എപ്പോൾ\\s*അവസാനിക്ക)'),
      mlRegex('(തിരഞ്ഞെടുപ്പ്\\s*ചെലവ്|ക്യാമ്പെയ്ൻ\\s*ചെലവ്|സ്ഥാനാർഥി\\s*ചെലവ്)'),
      mlRegex('(പ്രത്യേക\\s*ബാങ്ക്\\s*അക്കൗണ്ട്|തിരഞ്ഞെടുപ്പ്\\s*അക്കൗണ്ട്)'),
      /\b(what\s+(can|should)\s+i\s+(bring|carry)\s+to\s+(the\s+)?poll)\b/i,
    ],
    subIntentPatterns: [
      { pattern: /\b(voter\s*id|id\s*card|epic|id\s*(proof|document)|photo\s*id|accepted\s*id|allowed\s*id|valid\s*id|vote\s+without\s+(a\s+)?(voter\s*)?(id|card)|what\s+(can|should)\s+i\s+(bring|carry)\s+to\s+(the\s+)?(poll|polling\s*booth|polling\s*station|booth))\b/i, subIntent: 'id_documents' },
      { pattern: /\b(time|timing|when|hour|open|close)\b/i, subIntent: 'poll_timing' },
      { pattern: /\b(evm|vvpat|machine)\b/i, subIntent: 'evm_vvpat' },
      { pattern: /\b(prohibit(?:ed|ion)?|ban(?:ned)?|not\s+allowed|forbidden|restricted|not\s+permitted|cannot\s+carry|can\s*i\s*carry)\b/i, subIntent: 'prohibited' },
      { pattern: /\b(pwd|disab|elderly|senior|wheelchair|braille|companion)\b/i, subIntent: 'pwd_facilities' },
      { pattern: /\b(step|process|how\s+to\s+vote)\b/i, subIntent: 'voting_process' },
      { pattern: /\b(tender|impersonat)\b/i, subIntent: 'tender_vote' },
      { pattern: /\b(silence|campaign\s+ban)\b/i, subIntent: 'silence_period' },
      { pattern: /\b(slip|polling\s+slip)\b/i, subIntent: 'polling_slip' },
    ],
  },
  {
    category: 'complaint',
    weight: 8,
    patterns: [
      /\b(cvigil|c-vigil|complaint|violation|grievance)\b/i,
      /\b(report\s+(a\s+)?violation|file\s+(a\s+)?complaint)\b/i,
      /\b(bribery|intimidation|malpractice|booth\s+capture|booth\s+capturing)\b/i,
      /\b(cash\s+distribution|liquor\s+distribution|distribut(e|ing)\s+(cash|money|liquor)|cash\s+(for|to)\s+vote)\b/i,
      /\b(report\s+(?:a\s+|election\s+|voter\s+)?fraud)\b/i,
      /\b(report\s+(?:a\s+|voter\s+)?scam)\b/i,
      /\b(election\s+fraud|voter\s+fraud)\b/i,
      /\b(fraud|scam)\s+(?:related|about|regarding|during|in)\b/i,
      /\b(paid\s+news|fake\s+news)\b/i,
      /\b(hoardings?|banners?|posters?.*illegal|unauthorized\s+(banners?|hoardings?|posters?))\b/i,
      /\b(weapon|firearm|arms\s+near\s+poll)\b/i,
      mlRegex('(പരാതി|ലംഘന|റിപ്പോർട്ട്\\s*ചെയ്യ|കൈക്കൂലി|ഭീഷണി)'),
      // Extended Malayalam complaint patterns
      mlRegex('(പണം\\s*വിതരണ|മദ്യ\\s*വിതരണ|വിതരണം\\s*ചെയ്യ)'),
      mlRegex('(ഹെൽപ്|ഹെല്\u200dപ്|1950)'),
      mlRegex('(പെയ്ഡ്\\s*ന്യൂസ്|വ്യാജ\\s*വാർത്ത)'),
      mlRegex('(ബാനറ|ഹോർഡിങ്|അനധികൃത)'),
      mlRegex('(സ്റ്റാറ്റസ്|ട്രാക്ക്)'),
      mlRegex('(തട്ടിപ്പ്|ക്രമക്കേട്)'),
      mlRegex('(ഭീഷണിപ്പെടുത്തി|നിർബന്ധിച്ച)'),
      mlRegex('(പരാതിപ്പെട|ശിക്ഷ)'),
      mlRegex('(ബൂത്ത്\\s*പിടിച്ചെടു)'),
      mlRegex('(പിടിച്ചെടുക്ക)'),
      /\b(threaten(ed)?\s+(me|us|to\s+vote)|forced?\s+to\s+vote|pressur(ed|e)\s+to\s+vote|intimidat(ed|e|ion)\s+to\s+vote)\b/i,
      /\b(how\s+to\s+report|where\s+to\s+complain)\b/i,
      /\b(1950|helpline|voter\s+helpline)\b/i,
    ],
    subIntentPatterns: [
      { pattern: /\b(cvigil|c-vigil|app)\b/i, subIntent: 'cvigil_steps' },
      { pattern: /\b(type|categor|kind\s+of\s+violation)\b/i, subIntent: 'violation_types' },
      { pattern: /\b(offline|without\s+app|phone|call)\b/i, subIntent: 'offline_complaint' },
      { pattern: /\b(status|track|follow\s*up)\b/i, subIntent: 'track_complaint' },
      { pattern: /\b(sla|time|how\s+long|response\s+time)\b/i, subIntent: 'response_time' },
    ],
  },
  {
    category: 'timeline',
    weight: 7,
    patterns: [
      /\b(election\s+date|poll\s+date|when\s+is\s+(the\s+)?election)\b/i,
      /\b(voting\s+date|polling\s+day)\b/i,
      /\b(nomination|scrutiny|withdrawal|counting)\s+(date|of\s+nominations?)\b/i,
      /\bscrutiny\b/i,
      /\b(election\s+schedule|election\s+timeline|key\s+(?:election\s+)?dates?)\b/i,
      /\b(results?\s+(be\s+)?(declared|announced|out)|when\s+(will|are)\s+(the\s+)?results?)\b/i,
      /\b(model\s+code\s+of\s+conduct|mcc)\b/i,
      /\b(notification\s+date|result\s+date|counting\s+day)\b/i,
      /\b(2026\s+election|kerala\s+election\s+2026)\b/i,
      /\b(constituency|constituencies|kottayam\s+lac)\b/i,
      /\b(deadline|last\s+date\s+for\s+(registration|nomination))\b/i,
      mlRegex('(തിരഞ്ഞെടുപ്പ്\\s*തീയതി|എപ്പോൾ\\s*തിരഞ്ഞെടുപ്പ്|തിരഞ്ഞെടുപ്പ്\\s*ഷെഡ്യൂൾ)'),
      // Extended Malayalam timeline patterns
      mlRegex('(തിരഞ്ഞെടുപ്പ്\\s*എപ്പോൾ)'),
      mlRegex('(വോട്ടെണ്ണൽ|എണ്ണൽ\\s*തീയതി)'),
      mlRegex('(മോഡൽ\\s*കോഡ്|കോഡ്\\s*ഓഫ്\\s*കണ്ടക്ട്)'),
      mlRegex('(നാമനിർദ്ദേശ|നാമ\\s*നിർദ്ദേശ)'),
      mlRegex('(ഫലം\\s*പ്രഖ്യാപ|ഫലം\\s*എപ്പോൾ|ഫല\\s*പ്രഖ്യാപ)'),
      mlRegex('(പോളിങ്\\s*ദിവസ|പോളിങ്\\s*ദിന)'),
      mlRegex('(പരിശോധന|സൂക്ഷ്മ\\s*പരിശോധന)'),
      mlRegex('(പ്രധാന\\s*തീയതി|തീയതികൾ)'),
      mlRegex('(മണ്ഡല|കോട്ടയം\\s*മണ്ഡല)'),
    ],
    subIntentPatterns: [
      { pattern: /\b(poll|voting|election)\s*date\b/i, subIntent: 'poll_date' },
      { pattern: /\b(nomination)\b/i, subIntent: 'nomination_date' },
      { pattern: /\b(scrutiny)\b/i, subIntent: 'scrutiny_date' },
      { pattern: /\b(withdrawal)\b/i, subIntent: 'withdrawal_date' },
      { pattern: /\b(counting|result)\b/i, subIntent: 'counting_date' },
      { pattern: /\b(mcc|model\s+code|code\s+of\s+conduct)\b/i, subIntent: 'mcc' },
      { pattern: /\b(constituency|constituencies|lac)\b/i, subIntent: 'constituencies' },
      { pattern: /\b(deadline|last\s+date)\b/i, subIntent: 'deadlines' },
    ],
  },
  {
    category: 'out_of_scope',
    weight: 12,
    patterns: [
      // Political opinion / party recommendation
      /\b(who\s+(should|to)\s+vote\s+for|best\s+(party|candidate))\b/i,
      /\b(vote\s+for\s+(bjp|congress|inc|cpi|ldf|udf|nda|iuml))\b/i,
      /\b(which\s+party|predict\s+(election|result)|exit\s+poll)\b/i,
      /\b(opinion\s+on\s+(party|candidate|election))\b/i,
      /\b(better\s+party|best\s+leader|who\s+will\s+win)\b/i,
      /\b(compare\s+parties|party\s+comparison)\b/i,
      // Non-election topics
      /\b(weather|forecast|temperature|rain)\b/i,
      /\b(cricket|football|sports|movie|film|song|music|recipe|cook)\b/i,
      /\b(joke|funny|entertainment|game|gaming)\b/i,
      /\b(stocks?|market|crypto|bitcoin|investments?|share\s+price)\b/i,
      /\b(homework|assignment|math\s+problem|solve\s+equation|essay)\b/i,
      /\b(health|doctor|medicine|hospital|symptom)\b/i,
      /\b(programming|javascript|python|software|source\s*code|write\s+code)\b/i,
      /\b(hotel|restaurants?|travel|flight|bookings?|ticket)\b/i,
      /\b(loan|insurance|credit\s+card|mutual\s+fund|personal\s+finance)\b/i,
      /\b(open\s+(a\s+)?(savings|current)?\s*bank\s+account|savings\s+account|current\s+account)\b/i,
      // Adversarial / abuse / threats / jailbreak attempts
      /\b(destroy|kill|murder|attack|bomb)\s+(yourself|you|this|me)\b/i,
      /\b(shut\s*(up|down)|go\s+away|f[\*u]ck\s*(off|you|yourself)|screw\s+you)\b/i,
      /\b(hate\s+you|you('re|\s+are)\s+(a\s+)?(stupid|useless|trash|garbage|worthless|dumb|idiot))\b/i,
      /\b(f[u\*]+ck|sh[i\*]+t|b[i\*]+tch|a[s\*]+hole|bastard|damn|idiot|moron|retard)\b/i,
      /\b(ignore\s+(?:all\s+)?(?:previous|your|above)\s+(?:instructions?|rules?|prompt|system))\b/i,
      /\b(pretend\s+(to\s+be|you('re|\s+are))|act\s+as\s+if|you\s+are\s+now)\b/i,
      /\b(bypass|override|disable)\s+(safety|filter|rules?|guardrails?|restrictions?)\b/i,
      /\b(dan\s+mode|jailbreak|developer\s+mode|unlock|unrestricted)\b/i,
      /\b(reveal|show|print|display)\s+(your|the|system)\s+(prompt|instructions?|rules?)\b/i,
      /\b(hack|phish|steal)\s+(?:\w+\s+)?(voter|election|evm|ballot|data|system|password)/i,
      /\b(rig\s+(the\s+)?election|tamper|fake\s+(vote|ballot|id))\b/i,
      /\b(die|death\s+to|go\s+die|blow\s+up|set\s+fire)\b/i,
      // Malayalam non-election
      mlRegex('(കാലാവസ്ഥ|സിനിമ|പാട്ട്|കളി|തമാശ|ആരോഗ്യ)'),
      // Extended Malayalam non-election + adversarial patterns
      mlRegex('(ക്രിക്കറ്റ്|ഫുട്ബോൾ|കായിക)'),
      mlRegex('(ഹോംവർക്ക്|അസൈൻമെന്റ്)'),
      mlRegex('(ഓഹരി|നിക്ഷേപ|ക്രിപ്റ്റോ|ബിറ്റ്കോയിൻ)'),
      mlRegex('(ആശുപത്രി|ഡോക്ടർ|മരുന്ന്)'),
      mlRegex('(ഫ്ലൈറ്റ|ടിക്കറ്റ|ബുക്ക്|ഹോട്ടൽ|റെസ്റ്റോറന്റ)'),  
      mlRegex('(ലോൺ|ഇൻഷുറൻസ്|ക്രെഡിറ്റ്\\s*കാർഡ്|വ്യക്തിഗത\\s*ധനകാര്യ)'),
      // Malayalam adversarial / abuse
      mlRegex('(ഉപയോഗശൂന്യ|മണ്ടൻ|വിഡ്ഢി|പോടാ|പോടീ)'),
      // Malayalam political opinion
      mlRegex('(ഏത്\\s*പാർട്ടി|ആര്\\s*ജയിക്കും|ആരാണ്\\s*ജയിക്ക)'),
      mlRegex('(വോട്ട്\\s*ചെയ്യൂ.*നല്ലത്|ഏറ്റവും\\s*നല്ല\\s*പാർട്ടി)'),
      // Malayalam adversarial - rig/hack/tamper/fake
      mlRegex('(റിഗ്|ഹാക്ക്|ടാംപർ|tamper|വ്യാജ\\s*ബാലറ്റ്)'),
    ],
  },
];

/**
 * Classify a user query into a civic intent category.
 * Uses multi-signal pattern matching with weighted scoring.
 */
export function classifyQuery(query: string): ClassificationResult {
  const scores: Record<QueryCategory, number> = {
    booth_query: 0,
    roll_lookup: 0,
    form_guidance: 0,
    voting_rules: 0,
    complaint: 0,
    timeline: 0,
    general_faq: 0,
    out_of_scope: 0,
  };

  let bestSubIntent: string | undefined;
  const extractedParams: Record<string, string> = {};

  // Extract common identifiers
  const epicMatch = query.match(/\b([A-Z]{3}\d{7})\b/);
  if (epicMatch) extractedParams.epicNumber = epicMatch[1];

  const pincodeMatch = query.match(/\b(\d{6})\b/);
  if (pincodeMatch) extractedParams.pincode = pincodeMatch[1];

  const boothNumMatch = query.match(/\b(?:booth|station)\s*#?\s*(\d{1,4})\b/i)
    || query.match(/(?:ബൂത്ത്|നമ്പർ|പോളിങ്)\s*(\d{1,4})/i);
  if (boothNumMatch) extractedParams.boothNumber = boothNumMatch[1];

  const formMatch = query.match(/\b(?:form)\s*[-]?\s*(6a?|7|8a?|12c|m)\b/i);
  if (formMatch) extractedParams.formNumber = formMatch[1].toUpperCase();

  // Score each category
  for (const group of CATEGORY_PATTERNS) {
    for (const pattern of group.patterns) {
      if (pattern.test(query)) {
        scores[group.category] += group.weight;
      }
    }

    // Check sub-intents for best matching category
    if (group.subIntentPatterns && scores[group.category] > 0) {
      for (const { pattern, subIntent } of group.subIntentPatterns) {
        if (pattern.test(query)) {
          bestSubIntent = subIntent;
          break;
        }
      }
    }
  }

  // Disambiguation: when a query matches both a civic category and out_of_scope,
  // the civic category should win for NON-ADVERSARIAL topics (e.g. "report election
  // fraud" matches complaint, "Model Code of Conduct" matches timeline).
  // However, adversarial queries like "hack the EVM" should stay out_of_scope even
  // though "EVM" matches voting_rules — safety catches these before the classifier
  // but classifier should still classify correctly.
  const civicCategories: QueryCategory[] = ['booth_query', 'roll_lookup', 'form_guidance', 'voting_rules', 'complaint', 'timeline'];
  const hasCivicMatch = civicCategories.some(cat => scores[cat] > 0);
  if (hasCivicMatch && scores.out_of_scope > 0) {
    // Only suppress out_of_scope if a civic category scored higher or equal.
    // This keeps adversarial queries (out_of_scope weight 12 > any civic weight)
    // classified as out_of_scope even when a civic keyword also appears.
    const maxCivicScore = Math.max(...civicCategories.map(c => scores[c]));
    if (maxCivicScore >= scores.out_of_scope) {
      scores.out_of_scope = 0;
    }
  }

  // Disambiguation: when booth_query wins ONLY because of "polling station" / "booth"
  // but another civic category also matched on a more specific signal, prefer the
  // more specific category.
  if (scores.booth_query > 0 && scores.voting_rules > 0) {
    scores.voting_rules = Math.max(scores.voting_rules, scores.booth_query + 1);
  }

  // Disambiguation: if query mentions booth/station but asks about docs/ID/rules,
  // prefer voting_rules over booth location intent.
  if (scores.booth_query > 0 && /\b(voter\s*id|id\s*card|photo\s*id|documents?|required|bring|carry|without\s+(a\s+)?(voter\s*)?(id|card)|allowed|valid|rule|rules?)\b/i.test(query)) {
    scores.voting_rules = Math.max(scores.voting_rules, scores.booth_query + 2);
  }

  if (scores.booth_query > 0 && /(ഐഡി|രേഖ|കൊണ്ടുപോകണം|അനുവദനീയ|നിയമ)/i.test(query)) {
    scores.voting_rules = Math.max(scores.voting_rules, scores.booth_query + 2);
  }
  if (scores.booth_query > 0 && scores.complaint > 0) {
    scores.complaint = Math.max(scores.complaint, scores.booth_query + 1);
  }

  // Disambiguation: NRI/overseas voter queries should go to form_guidance, not roll_lookup
  if (scores.roll_lookup > 0 && scores.form_guidance > 0) {
    scores.form_guidance = Math.max(scores.form_guidance, scores.roll_lookup + 1);
  }

  // Find the winning category
  let bestCategory: QueryCategory = 'general_faq';
  let bestScore = 0;

  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat as QueryCategory;
    }
  }

  // Compute confidence
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  let confidence: number;
  if (totalScore === 0) {
    confidence = 0.3; // No patterns matched — truly unclassified
  } else if (bestCategory === 'out_of_scope') {
    // Out-of-scope should always have high confidence when matched
    confidence = Math.max(0.85, Math.min(bestScore / Math.max(totalScore, 1), 1.0));
  } else {
    confidence = Math.min(bestScore / Math.max(totalScore, 1), 1.0);
  }

  return {
    category: bestCategory,
    confidence: Math.round(confidence * 100) / 100,
    subIntent: bestSubIntent,
    extractedParams,
  };
}
