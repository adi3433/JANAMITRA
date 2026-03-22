/**
 * RAG Orchestrator V2.1 — Hybrid Retrieval-Augmented Generation
 * ──────────────────────────────────────────────────────────────
 * 4-Stage Pipeline:
 *   1. Embed query (qwen3-embedding-8b)
 *   2. Vector + BM25 hybrid search → top 15 candidates
 *   3. Rerank with qwen3-reranker-8b → top 3 passages
 *   4. Generate with qwen3-vl-30b-a3b-thinking (text-only mode)
 *
 * V2.1 additions:
 *   - Per-chunk retrieval trace for audit
 *   - Prompt versioning via prompts.ts
 *   - Configurable confidence: 20% similarity + 40% reranker + 20% self-score + 20% validation
 *   - Memory context injection (opt-in)
 */

import type { ChatMessage, ChatSource, ActionItem, RetrievalTraceEntry } from '@/types';
import { retrievePassages, retrieveFaqPassages } from './retriever';
import { rerankPassages, type RerankResult } from './reranker';
import { generateAnswer } from './generator';
import { extractActions } from './actions';
import { getConfig, estimateTokens, trimToTokenBudget } from '@/lib/fireworks';
import {
  ragSystemPrompt,
  ragUserPrompt,
  generalCivicSystemPrompt,
  generalCivicUserPrompt,
  computePromptHash,
  getTemplateVersion,
} from '@/lib/prompts';
import { buildMemoryContext } from '@/lib/memory';

export interface RAGInput {
  query: string;
  locale: 'en' | 'ml';
  conversationHistory: ChatMessage[];
  userId?: string; // for memory context
}

export interface RAGOutput {
  text: string;
  confidence: number;
  sources: ChatSource[];
  actionable: ActionItem[];
  retrievalScore: number;
  rerankerScores: number[];
  retrievalTrace: RetrievalTraceEntry[];
  generatorModel: string;
  promptVersionHash: string;
  trace: RAGTrace;
  escalate: boolean;
}

export interface RAGTrace {
  retrievalLatencyMs: number;
  rerankLatencyMs: number;
  generationLatencyMs: number;
  totalLatencyMs: number;
  retrievedCount: number;
  rerankedCount: number;
  contextTokens: number;
  promptTokens: number;
  completionTokens: number;
  promptVersion: string;
}

const PROMPT_VERSION = getTemplateVersion('rag-system');

// Max token budgets
const MAX_CONTEXT_TOKENS = 3000;
const MAX_PROMPT_TOKENS = 4000;
const ESCALATION_THRESHOLD = 0.55;
const LOW_RETRIEVAL_SIMILARITY = 0.34;
const LOW_RERANK_SCORE = 0.4;

function isFaqLikeQuery(query: string): boolean {
  const q = query.toLowerCase();
  return (
    /\b(who|what|when|where|why|which|how|can|is|are|should|whether)\b/.test(q)
    || /\b(eligib|nomination|proposer|withdrawal|scrutiny|form\s*\d+|voter\s*id|epic|electoral\s*roll|polling|complaint|cvigil|mcc|timeline)\b/.test(q)
    || /[\u0D00-\u0D7F]/.test(query)
  );
}

function isGenericUncertainReply(text: string): boolean {
  return /more information needed|don't have a confident answer|connect you with a human operator|കൂടുതൽ വിവരങ്ങൾ ആവശ്യമാണ്|ഉറപ്പുള്ള ഉത്തരം/i.test(text);
}

function extractFaqAnswerFromPassage(content: string): string | null {
  const match = content.match(/Q:\s*[\s\S]*?\nA:\s*([\s\S]+)/i);
  if (!match || !match[1]) return null;
  return match[1].replace(/\s+/g, ' ').trim();
}

function extractFaqQuestionFromPassage(content: string): string | null {
  const match = content.match(/Q:\s*([\s\S]*?)\nA:\s*[\s\S]*/i);
  if (!match || !match[1]) return null;
  return match[1].replace(/\s+/g, ' ').trim();
}

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function faqQuestionMatchScore(query: string, faqQuestion: string): number {
  const q = normalizeForMatch(query);
  const f = normalizeForMatch(faqQuestion);
  if (!q || !f) return 0;
  if (q === f) return 1;
  if (q.includes(f) || f.includes(q)) return 0.9;

  const qTokens = new Set(q.split(' ').filter(Boolean));
  const fTokens = new Set(f.split(' ').filter(Boolean));
  if (qTokens.size === 0 || fTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of qTokens) {
    if (fTokens.has(token)) intersection += 1;
  }

  const union = new Set([...qTokens, ...fTokens]).size;
  return union > 0 ? intersection / union : 0;
}

function buildFaqExtractiveReply(
  locale: 'en' | 'ml',
  sourceTitle: string,
  sourceUrl: string,
  answer: string
): string {
  if (locale === 'ml') {
    return `**ECI FAQ അടിസ്ഥാനമാക്കിയുള്ള ഉത്തരം**\n\n${answer}\n\n[Source 1: ${sourceTitle}]\n${sourceUrl}`;
  }
  return `**Answer Based On ECI FAQ**\n\n${answer}\n\n[Source 1: ${sourceTitle}]\n${sourceUrl}`;
}

export async function ragOrchestrate(input: RAGInput): Promise<RAGOutput> {
  const { query, locale, conversationHistory, userId } = input;
  const cfg = getConfig();
  const totalStart = Date.now();

  // ── Stage 1 & 2: Retrieval lanes (general hybrid + FAQ-only lane) ──
  const faqLaneEnabled = isFaqLikeQuery(query);
  const [generalRetrieval, faqRetrieval] = await Promise.all([
    retrievePassages(query, locale, MAX_CONTEXT_TOKENS),
    faqLaneEnabled ? retrieveFaqPassages(query, locale, MAX_CONTEXT_TOKENS) : Promise.resolve(null),
  ]);

  const generalTop = generalRetrieval.passages[0]?.score ?? 0;
  const faqTop = faqRetrieval?.passages[0]?.score ?? 0;
  const faqTopLooksDirect = Boolean(
    faqRetrieval?.passages[0]
      && (/^Q:\s/i.test(faqRetrieval.passages[0].content) || /ECI FAQ/i.test(faqRetrieval.passages[0].metadata.source))
  );

  const faqBestLexical = faqRetrieval
    ? faqRetrieval.passages
      .slice(0, 5)
      .map((p) => {
        const faqQuestion = extractFaqQuestionFromPassage(p.content) || '';
        return {
          passage: p,
          score: faqQuestionMatchScore(query, faqQuestion),
        };
      })
      .sort((a, b) => b.score - a.score)[0]
    : null;
  const faqHasStrongQuestionMatch = Boolean(faqBestLexical && faqBestLexical.score >= 0.72);

  const useFaqLane = Boolean(
    faqRetrieval
      && faqRetrieval.passages.length > 0
      && (
        faqHasStrongQuestionMatch
        ||
        faqTop >= Math.max(0.38, generalTop + 0.06)
        || (faqLaneEnabled && faqTopLooksDirect && faqTop >= 0.3)
      )
  );

  // Deterministic fast path: when FAQ lexical question match is strong,
  // return the extracted FAQ answer directly to avoid generation drift.
  if (faqRetrieval && faqHasStrongQuestionMatch && faqBestLexical) {
    const bestPassage = faqBestLexical.passage;
    const extractedAnswer = extractFaqAnswerFromPassage(bestPassage.content);

    if (extractedAnswer) {
      const text = buildFaqExtractiveReply(
        locale,
        bestPassage.metadata.source,
        bestPassage.metadata.url,
        extractedAnswer
      );
      const source: ChatSource = {
        title: bestPassage.metadata.source,
        url: bestPassage.metadata.url,
        lastUpdated: bestPassage.metadata.lastUpdated,
        excerpt: bestPassage.content.substring(0, 150) + '...',
      };
      const trace: RAGTrace = {
        retrievalLatencyMs: Math.max(generalRetrieval.retrievalLatencyMs, faqRetrieval.retrievalLatencyMs),
        rerankLatencyMs: 0,
        generationLatencyMs: 0,
        totalLatencyMs: Date.now() - totalStart,
        retrievedCount: faqRetrieval.passages.length,
        rerankedCount: 1,
        contextTokens: estimateTokens(bestPassage.content),
        promptTokens: 0,
        completionTokens: estimateTokens(text),
        promptVersion: PROMPT_VERSION,
      };

      return {
        text,
        confidence: 0.93,
        sources: [source],
        actionable: extractActions(query, text, locale),
        retrievalScore: Math.round((bestPassage.score ?? 0) * 100) / 100,
        rerankerScores: [0.9],
        retrievalTrace: [{
          docId: bestPassage.id,
          chunkId: bestPassage.id,
          similarityScore: bestPassage.score,
          rerankerScore: 0.9,
        }],
        generatorModel: 'faq-extractive-direct',
        promptVersionHash: computePromptHash(`faq-direct:${bestPassage.id}:${query}`),
        trace,
        escalate: false,
      };
    }
  }

  const retrieval = useFaqLane ? faqRetrieval! : generalRetrieval;
  const retrievalLatencyMs = useFaqLane && faqRetrieval
    ? Math.max(generalRetrieval.retrievalLatencyMs, faqRetrieval.retrievalLatencyMs)
    : generalRetrieval.retrievalLatencyMs;

  // ── Stage 3: Rerank with qwen3-reranker-8b ─────────────────
  const rerankStart = Date.now();
  const reranked: RerankResult[] = await rerankPassages(query, retrieval.passages, 3);
  const rerankLatencyMs = Date.now() - rerankStart;

  // Use reranked passages for context (top 3)
  const topPassages = reranked.map((r) => r.passage);
  const rerankerScores = reranked.map((r) => r.rerankerScore);
  const avgRerankerScore =
    rerankerScores.length > 0
      ? rerankerScores.reduce((sum, s) => sum + s, 0) / rerankerScores.length
      : 0;

  // ── Build retrieval trace (per-chunk audit) ────────────────
  const retrievalTrace: RetrievalTraceEntry[] = reranked.map((r) => ({
    docId: r.passage.id,
    chunkId: r.passage.id,
    similarityScore: r.passage.score,
    rerankerScore: r.rerankerScore,
  }));

  // ── Stage 4: Build prompt & generate ────────────────────────
  const contextBlock = topPassages
    .map(
      (p, i) =>
        `[Source ${i + 1}: ${p.metadata.source}]\n${p.content}\n(URL: ${p.metadata.url}, Updated: ${p.metadata.lastUpdated})`
    )
    .join('\n\n');

  const conversationBlock = conversationHistory
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  // Memory context (empty if user hasn't opted in)
  const memoryBlock = userId ? await buildMemoryContext(userId) : '';

  const maxSimilarity = topPassages.length > 0
    ? Math.max(...topPassages.map((p) => p.score))
    : 0;
  const weakRetrieval = topPassages.length === 0
    || (maxSimilarity < LOW_RETRIEVAL_SIMILARITY && avgRerankerScore < LOW_RERANK_SCORE);

  const systemPrompt = weakRetrieval ? generalCivicSystemPrompt() : ragSystemPrompt();
  let userPrompt = weakRetrieval
    ? generalCivicUserPrompt({
      query,
      locale,
      conversationBlock,
      memoryBlock,
    })
    : ragUserPrompt({
      contextBlock,
      conversationBlock,
      memoryBlock,
      query,
      locale,
      retrievalTrace,
    });

  // Trim prompt to budget
  userPrompt = trimToTokenBudget(userPrompt, MAX_PROMPT_TOKENS);

  const genStart = Date.now();
  const generated = await generateAnswer(systemPrompt, userPrompt, locale, query);
  const generationLatencyMs = Date.now() - genStart;

  // ── Extract model self-score if present ──────────────────────
  let modelSelfScore = generated.confidence;
  const scoreMatch = generated.text.match(/CONFIDENCE_SCORE:\s*([\d.]+)/);
  if (scoreMatch) {
    modelSelfScore = Math.min(1, Math.max(0, parseFloat(scoreMatch[1])));
  }
  // Remove the CONFIDENCE_SCORE line and any trailing disclaimers from user-facing text
  let cleanText = generated.text
    .replace(/\n?CONFIDENCE_SCORE:\s*[\d.]+[^\n]*/g, '')
    .trim();

  // If model falls back to a generic uncertainty reply but retrieval already
  // found an FAQ passage with a direct Q/A answer, provide an extractive answer
  // from the retrieved source instead of hiding available information.
  const topFaqPassage = topPassages.find((p) => /ECI FAQ/i.test(p.metadata.source) || /^Q:\s/i.test(p.content));
  if (topFaqPassage && isGenericUncertainReply(cleanText)) {
    const extractedAnswer = extractFaqAnswerFromPassage(topFaqPassage.content);
    if (extractedAnswer) {
      cleanText = buildFaqExtractiveReply(
        locale,
        topFaqPassage.metadata.source,
        topFaqPassage.metadata.url,
        extractedAnswer
      );
      modelSelfScore = Math.max(modelSelfScore, 0.72);
    }
  }

  // Safety net: if generator returned empty (all reasoning, no answer) — use topic-contextual fallback
  if (!cleanText && topPassages.length > 0) {
    const fallbackLocale = locale === 'ml' ? 'ml' : 'en';
    const bestSource = topPassages[0];
    cleanText = fallbackLocale === 'ml'
      ? `ഈ വിഷയത്തിൽ ലഭ്യമായ വിവരങ്ങൾ:\n\n${bestSource.content.substring(0, 500)}\n\n[Source 1: ${bestSource.metadata.source}]\n\nകൂടുതൽ വിവരങ്ങൾക്ക് ${bestSource.metadata.url} സന്ദർശിക്കുക. ഹെൽപ്‌ലൈൻ: 1950`
      : `Here is the relevant information:\n\n${bestSource.content.substring(0, 500)}\n\n[Source 1: ${bestSource.metadata.source}]\n\nFor more details, visit ${bestSource.metadata.url}. Helpline: 1950`;
    modelSelfScore = 0.6; // Lower confidence for fallback
  }

  // ── Build sources with citation ──────────────────────────────
  const sources: ChatSource[] = weakRetrieval
    ? []
    : topPassages.map((p) => ({
      title: p.metadata.source,
      url: p.metadata.url,
      lastUpdated: p.metadata.lastUpdated,
      excerpt: p.content.substring(0, 150) + '...',
    }));

  // ── Confidence scoring (new formula) ─────────────────────────
  // confidence = clamp(0.2*max_similarity + 0.4*avg_reranker + 0.2*model_selfscore + 0.2*validation_score, 0, 1)
  let confidence: number;
  if (weakRetrieval) {
    const brevityBonus = cleanText.length >= 120 ? 0.15 : (cleanText.length >= 60 ? 0.1 : 0.05);
    confidence = Math.max(0.45, Math.min(0.74, Math.round((modelSelfScore * 0.75 + brevityBonus) * 100) / 100));
  } else {
    // validation_score: 1.0 if response has sources cited + is non-empty, lower if not
    let validationScore = 1.0;
    if (cleanText.length < 50) validationScore -= 0.3;
    if (!cleanText.includes('[Source')) validationScore -= 0.2;
    if (generated.completionTokens === 0) validationScore -= 0.2;
    validationScore = Math.max(0, validationScore);

    confidence = Math.min(
      1,
      Math.round(
        (maxSimilarity * 0.20 +
          avgRerankerScore * 0.40 +
          modelSelfScore * 0.20 +
          validationScore * 0.20) * 100
      ) / 100
    );
  }

  const escalate = confidence < ESCALATION_THRESHOLD;

  // ── Extract actions ──────────────────────────────────────────
  const actionable = extractActions(query, cleanText, locale);

  // ── Compute prompt hash for audit ────────────────────────────
  const fullPromptText = systemPrompt + userPrompt;
  const pHash = computePromptHash(fullPromptText);

  // ── Trace for audit ──────────────────────────────────────────
  const trace: RAGTrace = {
    retrievalLatencyMs,
    rerankLatencyMs,
    generationLatencyMs,
    totalLatencyMs: Date.now() - totalStart,
    retrievedCount: retrieval.passages.length,
    rerankedCount: reranked.length,
    contextTokens: estimateTokens(contextBlock),
    promptTokens: generated.promptTokens || estimateTokens(userPrompt),
    completionTokens: generated.completionTokens || estimateTokens(cleanText),
    promptVersion: PROMPT_VERSION,
  };

  return {
    text: cleanText,
    confidence,
    sources,
    actionable,
    retrievalScore: Math.round(maxSimilarity * 100) / 100,
    rerankerScores,
    retrievalTrace: weakRetrieval ? [] : retrievalTrace,
    generatorModel: generated.model || cfg.generatorModel,
    promptVersionHash: pHash,
    trace,
    escalate,
  };
}
