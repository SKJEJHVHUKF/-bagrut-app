// Does the "is AD shared between the two triangles?" ask reach the API?
//
// Itay's screenshot (2026-09-05) shows it answered by the model and billed
// against the daily 10. Measured THROUGH runTutorChain, not through the
// matcher: the router runs first and eats phrasings the bank would have caught.

import { runTutorChain, emptyChainState } from '../lib/tutor-chain';
import { getSubTopic } from '../content/lessons';

const TOPIC = 'גיאומטריה אוקלידית';
const subTopic = getSubTopic('math5', TOPIC, 'eg-congruence') ?? undefined;
const question = (subTopic?.questions ?? []).find((q) => q.id === 'eg-sub-cong-004');

const ASKS = [
  'AD משותף לשני המשולשים?',
  'הצלע AD משותפת לשני המשולשים?',
  'מה זאת אומרת צלע משותפת',
  'למה מותר לכתוב שהצלע המשותפת שווה לעצמה',
  'AD זה הקטע המשותף?',
];

(async () => {
  for (const message of ASKS) {
    const r = await runTutorChain({
      message,
      focus: {
        where: 'תרגול · חפיפת משולשים',
        topic: TOPIC,
        subTopicId: 'eg-congruence',
        questionText: question?.question,
        question,
        subTopic,
      },
      state: emptyChainState(),
    });
    if (r.answered) {
      console.log(`✅ LOCAL  [${r.layer}]  "${message}"`);
      console.log(`         → ${r.text.replace(/\n/g, ' ').slice(0, 110)}`);
    } else {
      console.log(`💸 API    "${message}"`);
    }
  }
})();
