import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';
import { MATH5_CURRICULUM } from '../content/bagrut-curriculum';
const keys = new Set(Object.keys(MATH5_CURRICULUM as any));
const hist: Record<string, number> = {};
const paper: Record<string, number> = {};
for (const q of ALL_PAST_BAGRUYOT as any[]) {
  hist[q.topic] = (hist[q.topic] ?? 0) + 1;
  paper[q.paper] = (paper[q.paper] ?? 0) + 1;
}
for (const [t, n] of Object.entries(hist).sort((a,b)=>b[1]-a[1])) console.log(`${keys.has(t)?'OK  ':'MISS'} ${t} = ${n}`);
console.log('papers', paper);
console.log('571 items:', (ALL_PAST_BAGRUYOT as any[]).filter(q=>q.paper==='571').map(q=>`${q.id}/${q.topic}`).join(' , '));
console.log('572 items:', (ALL_PAST_BAGRUYOT as any[]).filter(q=>q.paper==='572').map(q=>`${q.id}/${q.topic}`).join(' , '));
console.log('curriculum keys:', [...keys].join(' | '));
