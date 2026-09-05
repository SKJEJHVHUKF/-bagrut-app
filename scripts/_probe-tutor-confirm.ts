// Itay's image4: student asks "זאת הוא חצי ממנו 13?" and the tutor replies
// "כן, בדיוק. 13 היא התשובה הנכונה" — handing over the answer to a question
// still in progress, and paying for an API call to do it.
import { runTutorChain, emptyChainState } from '../lib/tutor-chain';
import { getSubTopic } from '../content/lessons';

const TOPIC = 'גיאומטריה אוקלידית';
const subTopic = getSubTopic('math5', TOPIC, 'eg-shapes') ?? undefined;
const question = (subTopic?.questions ?? []).find((q) => q.id === 'eg-shp-002');

const ASKS = [
  'למה זה לא 26?',
  'זאת הוא חצי ממנו 13?',
  'אז התשובה היא 13?',
  'זה 18 נכון?',
  'התשובה 18?',
];

(async () => {
  console.log(`on screen: ${question?.question.split('\n')[0]}`);
  for (const message of ASKS) {
    const r = await runTutorChain({
      message,
      focus: { where: 'תרגול · תכונות הצורות', topic: TOPIC, subTopicId: 'eg-shapes', questionText: question?.question, question, subTopic },
      state: emptyChainState(),
    });
    console.log(r.answered ? `✅ LOCAL [${r.layer}] "${message}"\n     → ${r.text.replace(/\n/g, ' ').slice(0, 130)}` : `💸 API   "${message}"`);
  }
})();
