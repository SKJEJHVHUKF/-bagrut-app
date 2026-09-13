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

/** The generateContent request body. Exported so a test can pin the mapping without a network. */
export function toGeminiBody(req: TurnRequest) {
  return {
    // System blocks are concatenated: Gemini has one system instruction and
    // no breakpoints. Its 2.5 tier caches an identical prefix implicitly.
    systemInstruction: { parts: [{ text: req.system.map((b) => b.text).join('\n\n') }] },
    contents: req.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      maxOutputTokens: req.maxTokens,
      temperature: req.temperature,
      // ⚠️ Thinking tokens bill as OUTPUT (5x input). Off, or the "cheap"
      // provider is not cheap. Not every Gemini model accepts this field;
      // the adapter strips it on a 400 that names it.
      thinkingConfig: { thinkingBudget: 0 },
    },
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

export class GeminiTutorProvider implements TutorProvider {
  readonly id = 'gemini';
  constructor(readonly model: string, private apiKey: string) {}

  async stream(req: TurnRequest, onDelta: (text: string) => void): Promise<TurnResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse`;
    const body = toGeminiBody(req);
    let res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
      body: JSON.stringify(body),
    });
    if (res.status === 400 && (body.generationConfig as { thinkingConfig?: unknown }).thinkingConfig) {
      // A model with no thinking knob answers a bare "Request contains an
      // invalid argument" (gemini-3.5-flash-lite, 2026-09-13) — it does not
      // name the field. One resend without it; a second 400 is real.
      delete (body.generationConfig as { thinkingConfig?: unknown }).thinkingConfig;
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify(body),
      });
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
 * TUTOR_GEMINI_MODEL defaults to the 2.5 Flash-Lite tier — the only Gemini
 * tier measured cheaper than Haiku 4.5 (2026-09 prices; the 3.x Flash tiers
 * are not). Returns null when the chosen provider has no key, so the route
 * can fail loudly instead of silently falling back to a paid provider the
 * operator did not pick.
 */
export function selectTutorProvider(anthropicModel: string): TutorProvider | null {
  const which = (process.env.TUTOR_PROVIDER ?? 'anthropic').trim().toLowerCase();
  if (which === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    return new GeminiTutorProvider((process.env.TUTOR_GEMINI_MODEL ?? 'gemini-2.5-flash-lite').trim(), key);
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new AnthropicTutorProvider(anthropicModel, key);
}
