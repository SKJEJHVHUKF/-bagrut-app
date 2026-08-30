// Render the twelve generated figures into one standalone page, on the app's
// ivory canvas, so the owner can look at them instead of taking my word.
// Run: npx tsx scripts/_preview-rq-figures.ts <outfile.html>
import { writeFileSync } from 'node:fs';
import { render } from './_gen-rq-figures';
import { SPECS, PLACEMENT } from './_rq-figure-specs';

const STAGE_TITLE: Record<string, string> = {
  'rq-intersections': 'רמה 2 · נקודות חיתוך עם הצירים',
  'rq-asymptotes': 'רמה 3 · אסימפטוטות',
  'rq-transformations': 'רמה 6 · טרנספורמציות, זוגיות וסעיפי חשיבה',
  'rq-integral': 'רמה 7 · חשבון אינטגרלי וחישובי שטחים',
};

const cards = PLACEMENT.map((p) => {
  const spec = SPECS.find((s) => s.id === p.id)!;
  const w = spec.fig.w ?? 340;
  const h = spec.fig.h ?? 220;
  // The caption is authored for KaTeX; here it is only for orientation, so the
  // $…$ islands are shown as plain text rather than typeset.
  const caption = p.caption.replace(/\\dfrac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)').replace(/\$/g, '');
  return `<figure>
  <div class="where">${STAGE_TITLE[p.stage] ?? p.stage} · צעד ${p.step}</div>
  <div class="box"><svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${render(spec.fig)}</svg></div>
  <figcaption>${caption}</figcaption>
  <div class="checks">${spec.checks.length} טענות נבדקו מספרית</div>
</figure>`;
}).join('\n');

const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<title>סרטוטים — פונקציות מנה ושורש</title>
<style>
  :root { --bg:#FDFDFB; --card:#FFFFFF; --ink:#0F172A; --muted:#475569; --line:#E7E5E4; }
  body { background:var(--bg); color:var(--ink); margin:0; padding:28px 20px 60px;
         font-family:"Segoe UI",system-ui,sans-serif; }
  h1 { font-size:22px; margin:0 0 4px; }
  .sub { color:var(--muted); font-size:14px; margin-bottom:26px; }
  .grid { display:grid; gap:20px; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); }
  /* Exactly what FigureCard does in the app: a square card capped at 280px,
     so this page shows the real rendering and not a flattering one. */
  figure { margin:0; background:var(--card); border:1px solid var(--line); border-radius:16px;
           padding:12px; box-shadow:0 1px 3px rgba(15,23,42,.06);
           display:flex; flex-direction:column; align-items:center; }
  .box { width:100%; max-width:280px; aspect-ratio:1/1; }
  svg { width:100%; height:100%; display:block; }
  .where { font-size:11.5px; font-weight:700; color:#4F46E5; letter-spacing:.2px; }
  figcaption { font-size:12.5px; line-height:1.55; color:var(--ink); }
  .checks { margin-top:8px; font-size:11px; color:#059669; font-weight:600; }
</style></head><body>
<h1>שנים־עשר הסרטוטים החדשים</h1>
<div class="sub">כל אחד נוצר מהפונקציה עצמה, לא מקואורדינטות שנכתבו ביד. הכיתובים כאן בטקסט רגיל; באפליקציה הם עוברים דרך KaTeX.</div>
<div class="grid">
${cards}
</div>
</body></html>`;

const out = process.argv[2] ?? 'rq-figures.html';
writeFileSync(out, html, 'utf8');
console.log(`wrote ${out} — ${PLACEMENT.length} figures`);
