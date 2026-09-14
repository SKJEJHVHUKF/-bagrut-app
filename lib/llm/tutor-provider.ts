/**
 * tutor-provider.ts — ONE seam between the tutor and whoever answers it.
 *
 * ============================================================
 * WHY THIS FILE EXISTS
 * ============================================================
 * /api/chat was written against the Anthropic SDK directly: cache
 * breakpoints, tool blocks, `usage.cache_read_input_tokens`, the stream
 * event names. That is fine until the day a cheaper provider is worth an
 * A/B — and on that day every one of those details is a rewrite. The seam is
 * cheap to add now (the shapes below are the ones the route already
 * produces and consumes) and expensive to add later.
 *
 * The route builds a `TurnRequest` once. A provider turns it into its own
 * wire format, streams text deltas back through `onDelta`, and returns a
 * `TurnResult` whose `usage` is ANTHROPIC-SHAPED on purpose: `logCost`,
 * `recordTutorTrace` and the cost reports all read that shape, and mapping
 * one provider's counters onto it is smaller than teaching three consumers a
 * second one.
 *
 * ============================================================
 * WHAT IS PROVIDER-SPECIFIC AND STAYS THAT WAY
 * ============================================================
 * - Prompt caching. Anthropic caches by breakpoint marker on a system
 *   block; Gemini 2.5 caches implicitly by prefix. The markers ride on
 *   `SystemBlock.cache` and the Gemini adapter simply ignores them.
 * - Tools. `suggest_action` / `remember_fact` are Anthropic tool blocks.
 *   The Gemini adapter does not send them — a provider A/B measures the
 *   ANSWER, and a missing suggestion button is not an answer defect. Wire
 *   function-calling there only if the A/B is won.
 * - Temperature 0.3 is a Hebrew-morphology setting (see route.ts) and is
 *   passed to both; whether Gemini needs it is one of the things the A/B
 *   measures.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { Tool, TextBlockParam } from '@anthropic-ai/sdk/resources/messages';

export type SystemBlock = TextBlockParam;

export type TurnMessage = { role: 'user' | 'assistant'; content: string };

export type TurnRequest = {
  system: SystemBlock[];
  messages: TurnMessage[];
  maxTokens: number;
  temperature: number;
  /** Anthropic-only; other providers ignore it. */
  tools?: Tool[];
  /** Anthropic-only; Sonnet's effort valve. */
  effortLow?: boolean;
};

/** Anthropic's usage shape — what logCost / recordTutorTrace already read. */
export type TurnUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
};

export type ToolUse = { name: string; input: unknown };

export type TurnResult = {
  text: string;
  usage: TurnUsage;
  stopReason: 'end_turn' | 'max_tokens' | 'other';
  toolUses: ToolUse[];
};

export interface TutorProvider {
  /** 'anthropic' | 'gemini' — what the trace's `model` column is prefixed with. */
  readonly id: string;
  /** The exact model id sent on the wire; recorded on every trace row. */
  readonly model: string;
  stream(req: TurnRequest, onDelta: (text: string) => void): Promise<TurnResult>;
}

// ------------------------------------------------------------
// Anthropic — the code that used to live inline in route.ts
// ------------------------------------------------------------

export class AnthropicTutorProvider implements TutorProvider {
  readonly id = 'anthropic';
  private client: Anthropic;
  constructor(readonly model: string, apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async stream(req: TurnRequest, onDelta: (text: string) => void): Promise<TurnResult> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: req.maxTokens,
      temperature: req.temperature,
      system: req.system,
      messages: req.messages,
      ...(req.tools ? { tools: req.tools } : {}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(req.effortLow ? ({ output_config: { effort: 'low' } } as any) : {}),
    });
    let text = '';
    stream.on('text', (delta: string) => {
      text += delta;
      onDelta(delta);
    });
    const final = await stream.finalMessage();
    // With tools in play the model can put a tool_use block first; join every
    // text block instead of trusting a position.
    const authoritative = final.content
      .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
      .map((b) => b.text)
      .join('');
    if (authoritative.trim()) text = authoritative;
    const u = final.usage as unknown as Record<string, number | null | undefined>;
    return {
      text,
      usage: {
        input_tokens: final.usage.input_tokens,
        output_tokens: final.usage.output_tokens,
        cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
        cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
      },
      stopReason: final.stop_reason === 'end_turn' ? 'end_turn' : final.stop_reason === 'max_tokens' ? 'max_tokens' : 'other',
      toolUses: final.content
        .filter((b): b is Extract<typeof b, { type: 'tool_use' }> => b.type === 'tool_use')
        .map((b) => ({ name: b.name, input: b.input })),
    };
  }
}

// ------------------------------------------------------------
// Gemini — REST, no SDK (one fetch; a dependency for one endpoint is not worth it)
// ------------------------------------------------------------

/**
 * Gemini-specific tuning. Everything here is what the A/B found Gemini needs
 * that Anthropic does not — kept out of TUTOR_CORE so the shared prompt (and
 * its cache entry) does not change for the provider that did not need it.
 */
export type GeminiOptions = {
  /**
   * 0.1, not the 0.3 the Anthropic path uses. Measured 2026-09-14 on
   * gemini-3.5-flash-lite at 0.3: 3 of 60 replies with broken Hebrew
   * ("פונקציה מורכב", "המקקדמים", "המאגד המאוחד"). Same failure class Haiku
   * had at 1.0; the fix there was the temperature, so it is tried here first.
   */
  temperature?: number;
  /** Explicit context caching of the shared system prefix (below). Default on. */
  cache?: boolean;
  /**
   * Cache TTL in seconds. Default 600, NOT the Anthropic-style hour.
   *
   * Gemini bills explicit caches for STORAGE: $1 per million tokens per hour.
   * The prefix is ~6,500 tokens per topic, so one hour of cache costs $0.0065
   * — the same as ~4 turns' worth of the saving. At today's traffic (a few
   * turns an hour across all topics) an hour-long cache costs MORE than
   * sending the prefix uncached. Ten minutes covers one conversation's turns
   * (where the saving is real: reads at 0.1x) and then expires; recreating it
   * costs exactly one uncached input, i.e. nothing extra.
   */
  cacheTtlSeconds?: number;
};

/**
 * Appended to the system instruction on Gemini only. The Hebrew rules in
 * TUTOR_CORE are about register and layout; this one is about morphology,
 * which is where a small model's sampling noise shows first.
 */
export const GEMINI_HEBREW_GUARD = `# Hebrew proofreading — mandatory, Gemini
Before sending, re-read every Hebrew word of the reply. Each must be a real, dictionary Hebrew word in a correctly inflected form: gender and number agree (פונקציה מורכבת, not פונקציה מורכב), no doubled or dropped letters (המקדמים, not המקקדמים), no invented compounds (say "האיחוד", never "המאגד המאוחד"). If unsure of a word, use a simpler one. Hebrew letters never appear inside $...$.`;

/**
 * Where the cacheable prefix ends: the last system block that carries a
 * cache_control marker. Blocks up to it are byte-identical across turns
 * (core + curriculum map, then the topic grounding); blocks after it vary
 * per student (level, memory) and are sent per turn.
 *
 * Exported for the mapping test.
 */
export function splitForCache(system: SystemBlock[]): { prefix: string; tail: string } {
  let last = -1;
  system.forEach((b, i) => {
    if ((b as { cache_control?: unknown }).cache_control) last = i;
  });
  const prefix = system.slice(0, last + 1).map((b) => b.text).join('\n\n');
  const tail = system.slice(last + 1).map((b) => b.text).join('\n\n');
  return { prefix, tail };
}

/**
 * The generateContent request body. Exported so a test can pin the mapping
 * without a network.
 *
 * With `cachedContent`: Gemini forbids `systemInstruction` alongside a cache
 * (the cache carries it), so the varying tail of the system prompt rides at
 * the top of the first user message instead. Same words, same order, billed
 * at 1x exactly as the uncached tail is on Anthropic.
 */
export function toGeminiBody(req: TurnRequest, opts: GeminiOptions = {}, cachedContent?: { name: string; tail: string }) {
  const temperature = opts.temperature ?? req.temperature;
  const generationConfig = {
    maxOutputTokens: req.maxTokens,
    temperature,
    // ⚠️ Thinking tokens bill as OUTPUT (5x input). Off, or the "cheap"
    // provider is not cheap. Not every Gemini model accepts this field;
    // the adapter strips it on a 400.
    thinkingConfig: { thinkingBudget: 0 },
  };
  const contents = req.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  if (cachedContent) {
    const first = contents.findIndex((c) => c.role === 'user');
    if (cachedContent.tail && first >= 0) {
      contents[first] = { ...contents[first], parts: [{ text: `${cachedContent.tail}\n\n${contents[first].parts[0].text}` }] };
    }
    return { cachedContent: cachedContent.name, contents, generationConfig };
  }
  return {
    // System blocks are concatenated: Gemini has one system instruction and
    // no breakpoints.
    systemInstruction: { parts: [{ text: [...req.system.map((b) => b.text), GEMINI_HEBREW_GUARD].join('\n\n') }] },
    contents,
    generationConfig,
  };
}

type GeminiChunk = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    cachedContentTokenCount?: number;
    thoughtsTokenCount?: number;
  };
  error?: { message?: string };
};

/** Fold one streamed chunk into the running result. Exported for the mapping test. */
export function foldGeminiChunk(
  acc: { text: string; usage: TurnUsage; stopReason: TurnResult['stopReason'] },
  chunk: GeminiChunk,
): void {
  for (const c of chunk.candidates ?? []) {
    for (const p of c.content?.parts ?? []) if (p.text) acc.text += p.text;
    if (c.finishReason === 'MAX_TOKENS') acc.stopReason = 'max_tokens';
    else if (c.finishReason === 'STOP') acc.stopReason = 'end_turn';
    else if (c.finishReason) acc.stopReason = 'other';
  }
  const u = chunk.usageMetadata;
  if (u) {
    // Cumulative in every chunk; the last one wins. Cached tokens are a
    // subset of promptTokenCount on Gemini — split them out so the
    // Anthropic-shaped `input_tokens` means "fresh" on both providers.
    const cached = u.cachedContentTokenCount ?? 0;
    acc.usage = {
      input_tokens: Math.max(0, (u.promptTokenCount ?? 0) - cached),
      output_tokens: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
      cache_read_input_tokens: cached,
      cache_creation_input_tokens: 0,
    };
  }
}

const GEMINI = 'https://generativelanguage.googleapis.com/v1beta';

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

/**
 * Per-process registry of the caches this instance created. A serverless
 * instance that has never seen a prefix creates it once (one full-price
 * input, ~$0.002) and reads it for the rest of its life; an expired or
 * deleted cache answers 4xx and is simply recreated. A prefix that Gemini
 * refuses to cache (under the model's minimum, or a model without caching)
 * is remembered as `null` so the request goes out uncached without a second
 * failed create on every turn.
 */
const CACHES = new Map<string, { name: string; expiresAt: number } | null>();

export class GeminiTutorProvider implements TutorProvider {
  readonly id = 'gemini';
  constructor(readonly model: string, private apiKey: string, private opts: GeminiOptions = {}) {}

  private headers() {
    return { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey };
  }

  /** The cachedContents name for this prefix, creating it if needed; null = send uncached. */
  private async ensureCache(prefix: string): Promise<string | null> {
    if (this.opts.cache === false || !prefix) return null;
    const key = `${this.model}:${hash(prefix)}`;
    const now = Date.now();
    const known = CACHES.get(key);
    if (known === null) return null;
    if (known && known.expiresAt > now + 60_000) return known.name;
    const ttl = this.opts.cacheTtlSeconds ?? 600;
    const res = await fetch(`${GEMINI}/cachedContents`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: `models/${this.model}`,
        displayName: `tutor:${key}`,
        systemInstruction: { parts: [{ text: `${prefix}\n\n${GEMINI_HEBREW_GUARD}` }] },
        ttl: `${ttl}s`,
      }),
    });
    if (!res.ok) {
      // Below the minimum, unsupported model, or a quota problem: uncached
      // for this process. Logged once, because it changes the bill.
      console.warn(`[gemini-cache] create failed ${res.status}: ${(await res.text()).slice(0, 200)} — sending uncached`);
      CACHES.set(key, null);
      return null;
    }
    const j = (await res.json()) as { name: string };
    CACHES.set(key, { name: j.name, expiresAt: now + ttl * 1000 });
    return j.name;
  }

  async stream(req: TurnRequest, onDelta: (text: string) => void): Promise<TurnResult> {
    const url = `${GEMINI}/models/${this.model}:streamGenerateContent?alt=sse`;
    const { prefix, tail } = splitForCache(req.system);
    const cacheName = await this.ensureCache(prefix);
    let body = toGeminiBody(req, this.opts, cacheName ? { name: cacheName, tail } : undefined);
    const post = () => fetch(url, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
    let res = await post();
    if (!res.ok && cacheName && (res.status === 403 || res.status === 404 || res.status === 400)) {
      // The cache expired or was deleted under us: forget it, recreate once.
      const err = await res.text();
      if (/cachedContent|CachedContent|not found|expired/i.test(err)) {
        CACHES.delete(`${this.model}:${hash(prefix)}`);
        const fresh = await this.ensureCache(prefix);
        body = toGeminiBody(req, this.opts, fresh ? { name: fresh, tail } : undefined);
        res = await post();
      } else if (res.status === 400 && body.generationConfig.thinkingConfig) {
        delete (body.generationConfig as { thinkingConfig?: unknown }).thinkingConfig;
        res = await post();
      } else {
        throw new Error(`gemini ${res.status}: ${err.slice(0, 300)}`);
      }
    } else if (res.status === 400 && body.generationConfig.thinkingConfig) {
      // A model with no thinking knob answers a bare "Request contains an
      // invalid argument" (gemini-3.5-flash-lite, 2026-09-13) — it does not
      // name the field. One resend without it; a second 400 is real.
      delete (body.generationConfig as { thinkingConfig?: unknown }).thinkingConfig;
      res = await post();
    }
    if (!res.ok || !res.body) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);

    const acc = {
      text: '',
      usage: { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
      stopReason: 'other' as TurnResult['stopReason'],
    };
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const before = acc.text.length;
        let chunk: GeminiChunk;
        try {
          chunk = JSON.parse(line.slice(5).trim());
        } catch {
          continue;
        }
        if (chunk.error) throw new Error(`gemini: ${chunk.error.message ?? 'error'}`);
        foldGeminiChunk(acc, chunk);
        if (acc.text.length > before) onDelta(acc.text.slice(before));
      }
    }
    return { ...acc, toolUses: [] };
  }
}

// ------------------------------------------------------------
// Selection — one env var, read per request so a flip needs no redeploy logic
// ------------------------------------------------------------

/**
 * TUTOR_PROVIDER=anthropic (default) | gemini.
 * TUTOR_GEMINI_MODEL defaults to 3.5 Flash-Lite (2.5 is 404 for new accounts;
 * A/B 2026-09-14: 3.5-lite matched Haiku on relevance, 3.1-lite did not).
 * Returns null when the chosen provider has no key, so the route can fail
 * loudly instead of silently falling back to a paid provider the operator
 * did not pick.
 */
export function selectTutorProvider(anthropicModel: string): TutorProvider | null {
  const which = (process.env.TUTOR_PROVIDER ?? 'anthropic').trim().toLowerCase();
  if (which === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    return new GeminiTutorProvider((process.env.TUTOR_GEMINI_MODEL ?? 'gemini-3.5-flash-lite').trim(), key, {
      temperature: Number(process.env.TUTOR_GEMINI_TEMPERATURE ?? 0.1),
      cache: process.env.TUTOR_GEMINI_CACHE !== 'off',
    });
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new AnthropicTutorProvider(anthropicModel, key);
}
