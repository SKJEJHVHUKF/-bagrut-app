/**
 * POST /api/chat/tutor — the Socratic tutor agent.
 *
 * Cheap tier by design: Haiku 4.5, a 6-turn window, 800 output tokens, and a
 * system prompt laid out for prompt caching (lib/agents/prompts.ts).
 *
 * STATELESS. Unlike /api/chat (which owns conversations + chat_messages), this
 * route takes the transcript from the client and persists nothing. That keeps
 * it embeddable anywhere — next to a question, inside a drill, in the roadmap —
 * without creating a conversation row per widget.
 *
 * Streams SSE using the SAME event names as /api/chat (meta / delta / error /
 * done), so any existing client parser works against it unchanged.
 *
 * Body: {
 *   message:    string          (3..800 chars, required)
 *   unitLevel?: 3 | 4 | 5       (default 5)
 *   formNumber?: string         (default '572'; '581'/'582' auto-map to 571/572)
 *   topic?:     string          (unlocks verified-content grounding)
 *   context?:   string          (what the student is working on)
 *   history?:   { role, content }[]
 * }
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { guardAgentRequest, logAgentUsage, sanitizeText, BLACKLIST } from '@/lib/agents/guard';
import { buildTutorSystem } from '@/lib/agents/prompts';
import { TutorRequestSchema } from '@/lib/agents/schemas';
import { FREE_DAILY_CHAT, PRO_DAILY_CHAT } from '@/lib/access';
import {
  TUTOR_MODEL,
  TUTOR_MAX_TOKENS,
  TUTOR_HISTORY_TURNS,
  MIN_MESSAGE_LEN,
  MAX_MESSAGE_LEN,
  MAX_TOPIC_LEN,
  MAX_CONTEXT_LEN,
  normalizeUnitLevel,
  normalizeFormNumber,
} from '@/lib/agents/config';

// Vercel Hobby caps serverless functions at 60s and defaults to 10s.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // ===== 1. GATE (origin, bot, rate limit, auth, hourly + daily quota) =====
    // Tutor turns share the chat tier caps — it is the same product surface.
    const gate = await guardAgentRequest(request, {
      kind: 'tutor',
      freeDaily: FREE_DAILY_CHAT,
      proDaily: PRO_DAILY_CHAT,
    });
    if (!gate.ok) return gate.response;
    const { user, supabase, remaining } = gate;

    // ===== 2. BODY =====
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = TutorRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: 'בקשה לא תקינה' }, { status: 400 });
    }
    const body = parsed.data;

    // ===== 3. PRE-CALL VALIDATION — reject before spending a token =====
    const message = sanitizeText(body.message, MAX_MESSAGE_LEN);
    if (message.length < MIN_MESSAGE_LEN) {
      return Response.json(
        { error: `כתוב שאלה של לפחות ${MIN_MESSAGE_LEN} תווים.` },
        { status: 400 }
      );
    }
    if (BLACKLIST.test(message)) {
      return Response.json({ error: 'הודעה לא חוקית' }, { status: 400 });
    }

    const unitLevel = normalizeUnitLevel(body.unitLevel);
    const formNumber = normalizeFormNumber(body.formNumber);
    const topic = sanitizeText(body.topic, MAX_TOPIC_LEN);
    const attemptContext = sanitizeText(body.context, MAX_CONTEXT_LEN);

    // ===== 4. HISTORY =====
    // Keep the last N turns, drop empties, and guarantee the array the
    // Messages API sees begins with `user` — a window boundary that lands on
    // an assistant turn is a hard 400 ("first message must be user").
    const history = (body.history ?? [])
      .map((t) => ({ role: t.role, content: sanitizeText(t.content, MAX_MESSAGE_LEN * 2) }))
      .filter((t) => t.content.length > 0)
      .slice(-TUTOR_HISTORY_TURNS);
    while (history.length && history[0].role === 'assistant') history.shift();

    // The attempt snapshot rides on THIS turn only — it is context, not memory,
    // and re-sending it every turn would burn tokens for no benefit.
    const lastUserContent =
      attemptContext && !BLACKLIST.test(attemptContext)
        ? `[הקשר — התלמיד עובד על:]\n${attemptContext}\n\n${message}`
        : message;

    const messages: MessageParam[] = [
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: 'user' as const, content: lastUserContent },
    ];

    // ===== 5. MODEL =====
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const client = new Anthropic({ apiKey });
    const system = buildTutorSystem({ unitLevel, formNumber, topic: topic || undefined });

    // ===== 6. STREAM (SSE: meta → delta* → done | error) =====
    const encoder = new TextEncoder();
    const sseStream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        send('meta', { unitLevel, formNumber, remaining });

        let fullText = '';
        try {
          const stream = client.messages.stream({
            model: TUTOR_MODEL,
            max_tokens: TUTOR_MAX_TOKENS,
            system,
            messages,
            // ⚠️ NO `output_config.effort` here. Haiku 4.5 returns 400
            // ("This model does not support the effort parameter") — it is a
            // Sonnet/Opus 4.6+ knob. This exact mistake took down the generic
            // chat path once; don't reintroduce it.
          });

          stream.on('text', (delta: string) => {
            fullText += delta;
            send('delta', { text: delta });
          });

          const final = await stream.finalMessage();
          const block = final.content.find((b) => b.type === 'text');
          if (block && block.type === 'text' && block.text.trim()) {
            fullText = block.text; // authoritative over the accumulated deltas
          }
          // Cache telemetry — if this stays 0 the prefix is under the model
          // minimum (4096 tokens on Haiku) and caching is a no-op.
          console.log(
            `[tutor] u=${unitLevel} form=${formNumber} topic=${topic || '-'} ` +
              `in=${final.usage.input_tokens} out=${final.usage.output_tokens} ` +
              `cache_read=${final.usage.cache_read_input_tokens ?? 0}`
          );
        } catch (streamErr) {
          console.error('[tutor] stream error:', streamErr);
          send('error', { error: 'שגיאה זמנית. נסה שוב.' });
          controller.close();
          return;
        }

        // Awaited BEFORE close() — a serverless function may be frozen the
        // instant the response finishes, so post-close async work never lands.
        await logAgentUsage(supabase, user.id, 'tutor');

        send('done', { reply: fullText });
        controller.close();
      },
    });

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[tutor] error:', error);
    return Response.json({ error: 'שגיאה זמנית. נסה שוב.' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
