// ============================================================
// share-card.ts — renders a branded achievement card (canvas → PNG) for
// sharing on WhatsApp/Instagram. Story ratio 1080×1350. Zero dependencies.
//
// Hebrew-on-canvas notes:
//  - Pure-Hebrew strings render fine with textAlign center; mixed
//    Hebrew+digits are the trap, so numbers and Hebrew labels are drawn as
//    SEPARATE fillText calls.
//  - The Heebo family from next/font has a hashed name — resolved at
//    runtime from the CSS variable, after document.fonts.ready.
// ============================================================

export type ShareCardInput = {
  /** e.g. "רצף למידה" */
  headline: string;
  /** The big number, e.g. "7" or "85". Drawn separately (digits-safe). */
  bigStat: string;
  /** Label under the stat, e.g. "ימים ברצף" */
  statLabel: string;
  /** Optional secondary line, e.g. the topic. */
  sub?: string;
};

function heeboFamily(): string {
  if (typeof document === 'undefined') return 'sans-serif';
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-heebo')
    .trim();
  return v ? `${v}, Heebo, sans-serif` : 'Heebo, sans-serif';
}

export async function renderShareCard(input: ShareCardInput): Promise<Blob> {
  if (typeof document === 'undefined') throw new Error('browser only');
  await document.fonts.ready;

  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unsupported');
  const family = heeboFamily();

  // ---- Background: brand indigo gradient (top 72%) + ivory band ----
  const grad = ctx.createLinearGradient(0, 0, 0, H * 0.72);
  grad.addColorStop(0, '#4F46E5');
  grad.addColorStop(1, '#312E81');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H * 0.72);
  ctx.fillStyle = '#FDFDFB';
  ctx.fillRect(0, H * 0.72, W, H * 0.28);

  // Soft decorative circles
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.arc(W * 0.15, H * 0.12, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W * 0.9, H * 0.55, 240, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // ---- Logo: star + name (pure Hebrew → safe as one string) ----
  ctx.fillStyle = '#FDE68A';
  ctx.font = `90px ${family}`;
  ctx.fillText('✦', W / 2, 140);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = `700 56px ${family}`;
  ctx.fillText('בגרות בכיס', W / 2, 235);

  // ---- Headline (pure Hebrew) ----
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `500 52px ${family}`;
  ctx.fillText(input.headline, W / 2, 380);

  // ---- Gold ring + the big stat (digits drawn alone → bidi-safe) ----
  const cx = W / 2;
  const cy = 640;
  const r = 190;
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(253,230,138,0.5)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 16, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${input.bigStat.length > 3 ? 130 : 170}px ${family}`;
  ctx.fillText(input.bigStat, cx, cy - 10);

  // ---- Stat label (pure Hebrew, separate call) ----
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `700 46px ${family}`;
  ctx.fillText(input.statLabel, cx, cy + r + 80);

  if (input.sub) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `400 36px ${family}`;
    ctx.fillText(input.sub, cx, cy + r + 145);
  }

  // ---- Ivory band: call to action ----
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 40px ${family}`;
  ctx.fillText('גם אתה לומד לבגרות?', W / 2, H * 0.72 + 110);
  ctx.fillStyle = '#4F46E5';
  ctx.font = `900 44px ${family}`;
  ctx.fillText('בגרות בכיס — תרגול חכם, בחינם', W / 2, H * 0.72 + 190);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('toBlob failed'));
    }, 'image/png');
  });
}

/**
 * Share the card via Web Share (files) when supported; otherwise download.
 * Returns 'shared' | 'downloaded'.
 */
export async function shareOrDownload(blob: Blob, filename = 'bagrut-achievement.png'): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'בגרות בכיס' });
      return 'shared';
    } catch {
      // user cancelled or share failed — fall through to download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'downloaded';
}
