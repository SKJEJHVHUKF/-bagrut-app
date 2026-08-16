import { MATH5_CURRICULUM } from '../content/bagrut-curriculum';
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';
const keys = new Set((MATH5_CURRICULUM as any[]).map(m => m.key));
console.log('keys:', [...keys].join(' | '));
const bad = new Set<string>();
for (const q of ALL_PAST_BAGRUYOT as any[]) if (!keys.has(q.topic)) bad.add(`${q.topic} (${q.id}, ${q.paper})`);
console.log('non-key topics:', [...bad].join(' ; '));
