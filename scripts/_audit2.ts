import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';
import { MATH5_CURRICULUM } from '../content/bagrut-curriculum';
// `as any` hid that MATH5_CURRICULUM is an ARRAY — Object.keys gave "0","1",…
// so every topic below reported MISS. Same key extraction as _audit3.ts.
const keys = new Set(MATH5_CURRICULUM.map((m) => m.key));
const hist: Record<string, number> = {};
const paper: Record<string, number> = {};
for (const q of ALL_PAST_BAGRUYOT) {
  hist[q.topic] = (hist[q.topic] ?? 0) + 1;
  paper[q.paper] = (paper[q.paper] ?? 0) + 1;
}
for (const [t, n] of Object.entries(hist).sort((a,b)=>b[1]-a[1])) console.log(`${keys.has(t)?'OK  ':'MISS'} ${t} = ${n}`);
console.log('papers', paper);
console.log('571 items:', (ALL_PAST_BAGRUYOT).filter(q=>q.paper==='571').map(q=>`${q.id}/${q.topic}`).join(' , '));
console.log('572 items:', (ALL_PAST_BAGRUYOT).filter(q=>q.paper==='572').map(q=>`${q.id}/${q.topic}`).join(' , '));
console.log('curriculum keys:', [...keys].join(' | '));
