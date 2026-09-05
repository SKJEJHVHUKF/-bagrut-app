import { EUCLIDEAN_EXTRA_STAGES as S } from '../content/lessons/math5/euclidean-stages';
const st = S.find((x) => x.id === 'eg-shapes')!;
let miss = 0;
(st.lesson ?? []).forEach((l, n) => {
  const t = !!l.teach?.includes('```geo');
  const e = l.example ? (l.example.steps ?? []).some((s: string) => s.includes('```geo')) : null;
  const d = l.drill ? l.drill.question.includes('```geo') : null;
  if (!t || e === false || d === false) miss++;
  console.log(`step${n} teach:${t ? '✅' : '❌'} example:${e === null ? '—' : e ? '✅' : '❌'} drill:${d === null ? '—' : d ? '✅' : '❌'}  «${l.title}»`);
});
const q = (st.questions ?? []).filter((x) => !x.question.includes('```geo'));
console.log(`\nquestions without a figure: ${q.length}${q.length ? ' — ' + q.map((x) => x.id).join(', ') : ''}`);
console.log(miss ? `\n❌ ${miss} lesson slots still missing a figure` : '\n✅ every teach, example and drill in eg-shapes has a figure');
