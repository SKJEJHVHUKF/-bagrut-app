// Builds the launch video from real screenshots of the live app.
//   1) compose each scene as a 1080x1920 HTML frame -> PNG (headless Chrome)
//   2) Ken Burns + fade each PNG into a clip, then concat (ffmpeg)
// Run: node scripts/build-promo-video.mjs
// Screenshots live in video-src/ (see capture-promo-shots.mjs to refresh them).

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);
const src = join(root, 'video-src');
const frames = join(root, 'video-frames');
const out = join(root, 'mathup-launch.mp4');
const tpl = pathToFileURL(join(here, 'promo-frame.html')).href;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FPS = 30;

// img = file in video-src/, top = px cropped off the screenshot's top,
// k = kicker, t = title (<em>/<br> allowed), s = subtitle, sec = duration
const scenes = [
  { card: 1, mark: 1, t: 'MathUp', s: 'מתרגלים חכם, מצליחים יותר', sec: 3 },
  { img: 'home.png', top: 0, k: 'המסלול', t: 'מסלול למידה <em>מלא</em>',
    s: 'מתמטיקה 4 ו־5 יחידות — מהיסודות ועד הבגרות', sec: 3.5 },
  { img: 'roadmap.png', top: 60, k: 'שלב 1', t: 'בוחרים שאלון',
    s: '571 או 572 — ומקבלים מסלול מסודר, שלב אחר שלב', sec: 3.5 },
  { img: 'practice.png', top: 330, k: 'הנושאים', t: '14 נושאים, <em>87 שאלות</em>',
    s: 'לכל נושא: סיכום לימודי + שאלות בגרות אמיתיות', sec: 3.5 },
  { img: 'bagruyot.png', top: 90, k: 'בגרויות', t: 'שאלוני בגרות <em>אמיתיים</em>',
    s: 'רמזים מדורגים כשנתקעים, פתרון מלא רק כשאתה מוכן', sec: 3.5 },
  { img: 'thinking.png', top: 60, k: 'סעיפי חשיבה', t: 'לא רק לפתור —<br><em>גם להסביר</em>',
    s: 'המערכת בודקת את שלמות ההיגיון שלך', sec: 3.5 },
  { img: 'library.png', top: 60, k: 'סריקת שאלה', t: 'מצלמים שאלה',
    s: 'וה־AI מזהה את הנושא ופותר איתך צעד אחר צעד', sec: 3.5 },
  { img: 'formulas.png', top: 60, k: 'עזרים', t: 'דף נוסחאות מלא',
    s: 'הכול במקום אחד, בעברית', sec: 3 },
  { card: 1, t: 'MathUp', s: '5 יחידות. בלי לחץ.', c: 'bagrut-app.vercel.app', sec: 3.5 },
];

rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });

const pad = (i) => String(i).padStart(2, '0');

// ---- 1. render frames ------------------------------------------------------
scenes.forEach((s, i) => {
  const q = new URLSearchParams();
  for (const k of ['k', 't', 's', 'c', 'top', 'card', 'mark']) if (s[k]) q.set(k, s[k]);
  if (s.img) q.set('img', pathToFileURL(join(src, s.img)).href);
  const png = join(frames, `${pad(i)}.png`);
  execFileSync(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars',
    '--window-size=1080,1920', '--default-background-color=0a0a1fff',
    '--virtual-time-budget=4000', `--screenshot=${png}`, `${tpl}?${q}`],
    { stdio: 'ignore' });
  if (!existsSync(png)) throw new Error(`frame ${i} failed`);
  console.log(`frame ${pad(i)} ok`);
});

// ---- 2. one clip per frame: slow zoom in, fade at both ends ----------------
const clips = scenes.map((s, i) => {
  const n = Math.round(s.sec * FPS);
  const png = join(frames, `${pad(i)}.png`);
  const clip = join(frames, `${pad(i)}.mp4`);
  // zoompan on an upscaled copy keeps the zoom sharp
  // d=1: the input is already a frame-per-output-frame loop, so zoompan must
  // emit exactly one frame per input frame (d=n would emit n each, 75x too long)
  const vf = `scale=2160:3840,zoompan=z='min(1.12,1+0.12*on/${n})':d=1` +
    `:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},` +
    `fade=t=in:st=0:d=0.4,fade=t=out:st=${(s.sec - 0.4).toFixed(2)}:d=0.4`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-loop', '1', '-t', String(s.sec),
    '-i', png, '-vf', vf, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(FPS), clip],
    { stdio: 'inherit' });
  console.log(`clip ${pad(i)} ok`);
  return clip;
});

// ---- 3. concat -------------------------------------------------------------
const list = join(frames, 'list.txt');
writeFileSync(list, clips.map((c) => `file '${c.replace(/\\/g, '/')}'`).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0',
  '-i', list, '-c', 'copy', out], { stdio: 'inherit' });

console.log(`OK -> ${out} (${(statSync(out).size / 1e6).toFixed(1)} MB, ` +
  `${scenes.reduce((a, s) => a + s.sec, 0)}s)`);
