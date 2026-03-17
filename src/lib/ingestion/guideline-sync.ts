import { load as loadHtml } from 'cheerio';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { promises as fs } from 'fs';
import path from 'path';
import type { RetrievedPassage } from '@/types';

type ContentKind = 'html' | 'pdf' | 'doc' | 'docx';

interface CrawlItem {
  url: string;
  depth: number;
}

interface GuidelineSyncOptions {
  maxPages?: number;
  maxDepth?: number;
  timeoutMs?: number;
}

interface SyncStats {
  discovered: number;
  crawled: number;
  accepted: number;
  extracted: number;
  skipped: number;
  errors: number;
}

export interface GuidelineSyncResult {
  recordsProcessed: number;
  outputPath: string;
  stats: SyncStats;
  errors: string[];
}

const ALLOWED_HOSTS = new Set([
  'eci.gov.in',
  'www.eci.gov.in',
  'prsindia.org',
  'www.prsindia.org',
  'indiacode.nic.in',
  'www.indiacode.nic.in',
]);

const START_URLS = [
  'https://www.eci.gov.in',
  'https://www.eci.gov.in/candidate-corner/',
  'https://www.eci.gov.in/mcc/',
  'https://www.eci.gov.in/files/category/1423-compendium-of-instructions-on-election-expenditure-monitoring/',
  'https://www.eci.gov.in/files/category/96-candidates-affidavits/',
  'https://www.eci.gov.in/faqs/elections/election-machinery/faqs-election-machinery-r1/',
  'https://www.eci.gov.in/files/file/9400-hand-book-for-returning-officer-february-2019/',
  'https://www.eci.gov.in/files/file/10197-mandatory-verification-of-vvpat-paper-slips-regarding/',
  'https://www.eci.gov.in/files/file/8756-status-paper-on-evm-edition-3/',
  'https://indiacode.nic.in',
  'https://indiacode.nic.in/handle/123456789/1362/simple-search?query=election+expenses',
  'https://indiacode.nic.in/handle/123456789/1362/simple-search?query=account+of+election+expenses',
  'https://indiacode.nic.in/handle/123456789/1362/simple-search?query=bank+account+candidate+election',
  'https://indiacode.nic.in/handle/123456789/1362/simple-search?query=conduct+of+elections+rules+1961',
  'https://indiacode.nic.in/handle/123456789/1362/simple-search?query=representation+of+the+people+act+1951',
  'https://indiacode.nic.in/handle/123456789/1362/simple-search?query=nomination+paper+candidate',
  'https://indiacode.nic.in/handle/123456789/1362/simple-search?query=form+26+affidavit',
  'https://indiacode.nic.in/handle/123456789/1362/simple-search?query=model+code+of+conduct',
  'https://indiacode.nic.in/handle/123456789/1362/simple-search?query=candidate+eligibility+election',
  'https://prsindia.org/theprsblog/how-votes-are-counted-in-indian-elections',
  'https://prsindia.org/parliamenttrack/vital-stats/profile-of-candidates-contesting-in-general-elections-2024',
];

const GUIDELINE_HINT = /\b(guideline|guidelines|handbook|manual|instruction|circular|notification|candidate|nomination|mcc|model\s+code|affidavit|election\s+expense|expenditure|conduct\s+of\s+elections|representation\s+of\s+the\s+people)\b/i;
const TOPICAL_URL_HINT = /(guideline|handbook|manual|candidate|nomination|affidavit|election|expense|expenditure|mcc|model-code|conduct|representation-of-the-people|rpa|forms?|notification)/i;

const TOPIC_KEYWORDS: Record<string, RegExp> = {
  candidate_eligibility: /\b(candidate\s+eligibility|eligible\s+candidate|qualification\s+of\s+candidate|disqualif(?:y|ication)|age\s+requirement|citizenship)\b/i,
  nomination_process: /\b(nomination|nomination\s+paper|returning\s+officer|scrutiny\s+of\s+nominations|withdrawal\s+of\s+candidature)\b/i,
  election_expenses: /\b(election\s+expense|election\s+expenses|election\s+expenditure|expenditure\s+monitoring|account\s+of\s+election\s+expenses|expense\s+register|register\s+of\s+day\s+to\s+day\s+accounts|lodging\s+of\s+account|ceiling\s+limit|shadow\s+observation\s+register|incurring\s+expenditure|section\s+77|section\s+78)\b/i,
  bank_account_rules: /\b(separate\s+bank\s+account|dedicated\s+bank\s+account|open(?:ing)?\s+(?:a\s+)?separate\s+bank\s+account|open(?:ing)?\s+(?:a\s+)?bank\s+account|bank\s+account\s+for\s+election|candidate\s+bank\s+account|account\s+of\s+election\s+expenses|maintain\s+an\s+account\s+of\s+election\s+expenses)\b/i,
  affidavits: /\b(affidavit|form\s*26|criminal\s+antecedents|assets\s+and\s+liabilities|declaration\s+by\s+candidate)\b/i,
  model_code_of_conduct: /\b(model\s+code\s+of\s+conduct|mcc|code\s+of\s+conduct|silence\s+period|campaign\s+restrictions)\b/i,
};

const ELECTION_CONTEXT = /\b(election|electoral|candidate|constituency|poll|polling|voter|eci|election\s+commission|returning\s+officer|representation\s+of\s+the\s+people|nomination|model\s+code\s+of\s+conduct|assembly|lok\s+sabha|rajya\s+sabha)\b/i;

function inferContentKind(url: string, contentType?: string): ContentKind | null {
  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf') || contentType?.includes('application/pdf')) return 'pdf';
  if (lower.endsWith('.docx') || contentType?.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) return 'docx';
  if (lower.endsWith('.doc') || contentType?.includes('application/msword')) return 'doc';
  if (contentType?.includes('text/html') || !contentType) return 'html';
  return null;
}

function isAllowedUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    return ALLOWED_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function normalizeUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    u.hash = '';
    if ((u.protocol !== 'https:' && u.protocol !== 'http:') || !isAllowedUrl(u.toString())) {
      return null;
    }
    return u.toString();
  } catch {
    return null;
  }
}

function looksLikeGuideline(url: string, anchorText?: string): boolean {
  return GUIDELINE_HINT.test(url) || (!!anchorText && GUIDELINE_HINT.test(anchorText));
}

function toTextFromHtml(html: string): { title: string; text: string; links: Array<{ href: string; text: string }> } {
  const $ = loadHtml(html);
  $('script,style,noscript,svg').remove();
  const title = $('title').first().text().trim() || 'Official Guideline Page';

  const links: Array<{ href: string; text: string }> = [];
  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    if (!href) return;
    links.push({ href, text: $(el).text().trim() });
  });

  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return { title, text, links };
}

export function extractTopicSnippets(text: string): Array<{ topic: string; snippet: string }> {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20 && s.length <= 600);

  const out: Array<{ topic: string; snippet: string }> = [];
  for (const [topic, rx] of Object.entries(TOPIC_KEYWORDS)) {
    const strict = sentences.find((s) => rx.test(s) && ELECTION_CONTEXT.test(s));
    if (strict) {
      out.push({ topic, snippet: strict });
      continue;
    }

    const relaxed = sentences.find((s) => rx.test(s));
    if (relaxed) {
      out.push({ topic, snippet: relaxed });
      continue;
    }

    // Fallback for scanned PDFs / compact legal text where sentence splitting is weak.
    const m = rx.exec(text);
    if (!m || m.index === undefined) continue;
    const start = Math.max(0, m.index - 160);
    const end = Math.min(text.length, m.index + m[0].length + 220);
    const window = text.slice(start, end).replace(/\s+/g, ' ').trim();
    if (window.length >= 30) {
      out.push({ topic, snippet: window });
    }
  }
  return out;
}

function toPassages(url: string, title: string, text: string, kind: ContentKind): RetrievedPassage[] {
  const now = new Date().toISOString().split('T')[0];
  const topicSnippets = extractTopicSnippets(text);
  if (topicSnippets.length === 0) return [];

  return topicSnippets.map((t, idx) => ({
    id: `ext-${Buffer.from(`${url}:${t.topic}:${idx}`).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`,
    content: `${t.snippet}\n\n(Topic: ${t.topic.replace(/_/g, ' ')})`,
    metadata: {
      source: `${title} (${kind.toUpperCase()})`,
      url,
      lastUpdated: now,
      section: t.topic,
    },
    score: 0,
    method: 'vector',
  }));
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Janamitra-ContentSync/1.0 (+https://eci.gov.in)',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function resolveAbsolute(baseUrl: string, href: string): string | null {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const r = await mammoth.extractRawText({ buffer });
  return (r.value || '').replace(/\s+/g, ' ').trim();
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parsed = await pdfParse(buffer);
  return (parsed.text || '').replace(/\s+/g, ' ').trim();
}

export async function runGuidelineSync(options: GuidelineSyncOptions = {}): Promise<GuidelineSyncResult> {
  const maxPages = options.maxPages ?? 120;
  const maxDepth = options.maxDepth ?? 3;
  const timeoutMs = options.timeoutMs ?? 12000;

  const stats: SyncStats = {
    discovered: 0,
    crawled: 0,
    accepted: 0,
    extracted: 0,
    skipped: 0,
    errors: 0,
  };

  const errors: string[] = [];
  const queue: CrawlItem[] = START_URLS.map((url) => ({ url, depth: 0 }));
  const seen = new Set<string>();
  const passages: RetrievedPassage[] = [];

  while (queue.length > 0 && stats.crawled < maxPages) {
    const item = queue.shift()!;
    const normalized = normalizeUrl(item.url);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    stats.discovered += 1;

    try {
      const res = await fetchWithTimeout(normalized, timeoutMs);
      if (!res.ok) {
        stats.skipped += 1;
        continue;
      }

      const contentType = res.headers.get('content-type') || '';
      const kind = inferContentKind(normalized, contentType);
      if (!kind) {
        stats.skipped += 1;
        continue;
      }

      stats.crawled += 1;

      if (kind === 'html') {
        const html = await res.text();
        const parsed = toTextFromHtml(html);

        const p = toPassages(normalized, parsed.title, parsed.text, kind);
        if (p.length > 0) {
          passages.push(...p);
          stats.accepted += 1;
          stats.extracted += p.length;
        }

        if (item.depth < maxDepth) {
          for (const link of parsed.links) {
            const abs = resolveAbsolute(normalized, link.href);
            if (!abs) continue;
            const n = normalizeUrl(abs);
            if (!n || seen.has(n)) continue;

            const k = inferContentKind(n);
            if (!k) continue;

            if (k === 'html') {
              // First hop: broaden crawl to discover official structure.
              // Deeper hops: stay focused on election-legal topics.
              const shouldFollow = item.depth === 0
                || looksLikeGuideline(n, link.text)
                || TOPICAL_URL_HINT.test(n);
              if (!shouldFollow) continue;
            } else {
              const isTopicalDoc = looksLikeGuideline(n, link.text) || TOPICAL_URL_HINT.test(n);
              if (!isTopicalDoc) continue;
            }
            queue.push({ url: n, depth: item.depth + 1 });
          }
        }
        continue;
      }

      if (!looksLikeGuideline(normalized)) {
        stats.skipped += 1;
        continue;
      }

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      let text = '';
      if (kind === 'pdf') {
        text = await extractTextFromPdf(buffer);
      } else if (kind === 'docx') {
        text = await extractTextFromDocx(buffer);
      } else {
        // Legacy .doc extraction is intentionally conservative.
        // We keep the URL discoverable and rely on HTML/PDF mirrors for parsing.
        text = '';
      }

      if (text.length > 0) {
        const title = path.basename(new URL(normalized).pathname) || 'Official Guideline Document';
        const p = toPassages(normalized, title, text, kind);
        if (p.length > 0) {
          passages.push(...p);
          stats.accepted += 1;
          stats.extracted += p.length;
        }
      } else {
        stats.skipped += 1;
      }
    } catch (err) {
      stats.errors += 1;
      errors.push(`${normalized}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const unique = new Map<string, RetrievedPassage>();
  for (const p of passages) {
    const key = `${p.metadata.url}|${p.metadata.section}|${p.content}`;
    if (!unique.has(key)) unique.set(key, p);
  }

  const finalPassages = Array.from(unique.values());

  const outputPath = path.join(process.cwd(), 'src', 'data', 'generated_guideline_passages.json');
  await fs.writeFile(outputPath, JSON.stringify(finalPassages, null, 2), 'utf8');

  return {
    recordsProcessed: finalPassages.length,
    outputPath,
    stats,
    errors: errors.slice(0, 50),
  };
}
