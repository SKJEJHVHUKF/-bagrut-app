/**
 * test-tutor-provider.ts — the provider seam, without a network.
 *
 * Pins the two pure mappings the Gemini adapter rests on: the request body
 * (system blocks → one systemInstruction, assistant → model, thinking off)
 * and the chunk fold (text accumulates, usage is cumulative and split into
 * fresh/cached the way Anthropic's counters are). Also pins that
 * selectTutorProvider refuses to silently fall back when the chosen
 * provider has no key.
 */
import { toGeminiBody, foldGeminiChunk, selectTutorProvider, splitForCache, GEMINI_HEBREW_GUARD, type TurnRequest, type TurnResult } from '../lib/llm/tutor-provider';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

const req: TurnRequest = {
  system: [
    { type: 'text', text: 'CORE', cache_control: { type: 'ephemeral' } },
    { type: 'text', text: 'GROUNDING' },
  ],
  messages: [
    { role: 'user', content: 'שלום' },
    { role: 'assistant', content: 'מה הצעד הבא לדעתך?' },
    { role: 'user', content: 'צריך לגזור' },
  ],
  maxTokens: 200,
  temperature: 0.3,
};

console.log('— request mapping —');
const body = toGeminiBody(req);
const sys = body.systemInstruction?.parts[0].text ?? '';
ok(sys.startsWith('CORE\n\nGROUNDING'), 'system blocks joined into one instruction, cache markers dropped');
ok(sys.endsWith(GEMINI_HEBREW_GUARD), 'the Hebrew morphology guard is appended on Gemini only');
ok(toGeminiBody(req, { temperature: 0.1 }).generationConfig.temperature === 0.1, 'Gemini temperature override wins over the request value');

console.log('— explicit cache mapping —');
const split = splitForCache(req.system);
ok(split.prefix === 'CORE' && split.tail === 'GROUNDING', 'prefix = blocks up to the last cache marker, tail = the rest');
const cached = toGeminiBody(req, {}, { name: 'cachedContents/abc', tail: split.tail });
ok(!('systemInstruction' in cached) && cached.cachedContent === 'cachedContents/abc', 'with a cache: cachedContent set and NO systemInstruction (Gemini forbids both)');
ok(cached.contents[0].parts[0].text === 'GROUNDING\n\nשלום' && cached.contents[2].parts[0].text === 'צריך לגזור', 'the uncached tail rides at the top of the FIRST user message only');
ok(splitForCache([{ type: 'text', text: 'X' }]).prefix === '', 'no cache marker → nothing to cache');
ok(body.contents.length === 3 && body.contents[1].role === 'model' && body.contents[2].role === 'user', 'assistant → model, user stays user');
ok(body.contents[2].parts[0].text === 'צריך לגזור', 'Hebrew text passes through untouched');
ok(body.generationConfig.maxOutputTokens === 200 && body.generationConfig.temperature === 0.3, 'budget and temperature carried');
ok(body.generationConfig.thinkingConfig.thinkingBudget === 0, 'thinking OFF — thinking tokens bill as output');
ok(!('tools' in body), 'no tools on the Gemini wire');

console.log('— chunk fold —');
const acc = {
  text: '',
  usage: { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
  stopReason: 'other' as TurnResult['stopReason'],
};
foldGeminiChunk(acc, { candidates: [{ content: { parts: [{ text: 'נכון, ' }] } }], usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 3 } });
foldGeminiChunk(acc, {
  candidates: [{ content: { parts: [{ text: 'ומה הנגזרת?' }] }, finishReason: 'STOP' }],
  usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 9, cachedContentTokenCount: 800, thoughtsTokenCount: 0 },
});
ok(acc.text === 'נכון, ומה הנגזרת?', 'text accumulates across chunks');
ok((acc.stopReason as string) === 'end_turn', 'STOP → end_turn');
ok(acc.usage.input_tokens === 200 && acc.usage.cache_read_input_tokens === 800, 'cached tokens split OUT of input_tokens (Anthropic shape: input = fresh)');
ok(acc.usage.output_tokens === 9, 'usage is cumulative — the last chunk wins, not the sum');
const cut = { ...acc, text: '', stopReason: 'other' as const };
foldGeminiChunk(cut, { candidates: [{ content: { parts: [{ text: 'x' }] }, finishReason: 'MAX_TOKENS' }] });
ok((cut.stopReason as string) === 'max_tokens', 'MAX_TOKENS → max_tokens (the route logs a truncation warning on it)');

console.log('— selection —');
const env = { ...process.env };
process.env.TUTOR_PROVIDER = 'gemini';
delete process.env.GEMINI_API_KEY;
ok(selectTutorProvider('claude-haiku-4-5') === null, 'gemini chosen with no key → null, never a silent Anthropic fallback');
process.env.GEMINI_API_KEY = 'k';
process.env.TUTOR_GEMINI_MODEL = 'gemini-2.5-flash-lite';
const g = selectTutorProvider('claude-haiku-4-5');
ok(g?.id === 'gemini' && g.model === 'gemini-2.5-flash-lite', 'gemini chosen with a key → the configured model');
process.env.TUTOR_PROVIDER = 'anthropic';
process.env.ANTHROPIC_API_KEY = 'k';
const a = selectTutorProvider('claude-haiku-4-5');
ok(a?.id === 'anthropic' && a.model === 'claude-haiku-4-5', 'default → Anthropic with the tier the route picked');
process.env = env;

console.log(failed === 0 ? '\nOK tutor provider: one seam, both mappings pinned\n' : `\nFAILED: ${failed}\n`);
process.exitCode = failed === 0 ? 0 : 1;
