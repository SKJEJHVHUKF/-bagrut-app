/**
 * _probe-conversation.ts — one multi-turn conversation through the LIVE
 * provider, exactly as /api/chat builds it (system, context, 4-message
 * history), so a rule about turn-to-turn behaviour (repetition, confirming
 * a step) can be seen before it ships. A few tenths of a cent per run.
 *
 *   npx tsx scripts/_probe-conversation.ts <questionId> "msg1" "msg2" ...
 */
import { config } from 'dotenv';
import { buildTutorSystem } from '../lib/agents/prompts';
import { renderFocusContext, type TutorFocus } from '../lib/tutor-presence';
import { faqCandidates } from '../lib/tutor-faq';
import { selectTutorProvider } from '../lib/llm/tutor-provider';
import { allScreens } from './_screens';

config({ path: '.env.local' });

async function main() {
  const [qid, ...messages] = process.argv.slice(2);
  const s = allScreens().get(qid);
  if (!s) throw new Error(`no screen publishes ${qid}`);
  const provider = selectTutorProvider('claude-haiku-4-5');
  if (!provider) throw new Error('no provider (set TUTOR_PROVIDER / keys)');
  const focus = {
    where: s.topic, topic: s.topic, subTopicId: s.subTopic?.id ?? '', questionText: s.question.question,
    question: s.question, ...(s.subTopic ? { subTopic: s.subTopic } : {}),
  } as unknown as TutorFocus;
  const system = buildTutorSystem({ unitLevel: 5, formNumber: '571', topic: s.topic, memory: '', hasQuestion: true });
  const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  console.log(`[${provider.id}:${provider.model}] ${s.question.question.slice(0, 120)}\n`);
  for (const m of messages) {
    const candidates = await faqCandidates(m, focus);
    const context = renderFocusContext(focus, { candidates });
    const user = `[הקשר — התלמיד עובד על:]\n${context}\n\n${m}`;
    const r = await provider.stream(
      { system, messages: [...history.slice(-4), { role: 'user', content: user }], maxTokens: 280, temperature: 0.3 },
      () => {},
    );
    console.log(`👤 ${m}\n🤖 ${r.text.trim()}\n`);
    history.push({ role: 'user', content: m }, { role: 'assistant', content: r.text.slice(0, 500) });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
