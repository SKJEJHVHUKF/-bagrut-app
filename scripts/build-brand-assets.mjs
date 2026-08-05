// Turn Itay's itay5.webp (emblem on a white square) into the app's assets.
//
// The white has to go: the emblem gets composited onto a deep-indigo tile for
// the PWA icons, and a white square behind it there would look like a bug.
//
// Un-matting a glow off white is not a keying problem — there is no flat
// colour to key out, the glow FADES into the background. For a source known
// to be composited over white:  C = A*F + (1-A)*255
// Taking A = 1 - min(Cr,Cg,Cb)/255 and solving for F recovers a foreground
// that re-composites over white exactly, and degrades sanely over dark.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'C:\\Users\\1000m\\Downloads\\itay5.webp';
const APP = 'C:\\Users\\1000m\\bagrut-app';

// White, not the brand's deep indigo. Tried indigo first and it looked dead:
// the emblem's BODY is deep navy, so on a dark tile it has nothing to
// contrast against and the neon strokes go muddy. The art was drawn on white
// and only reads on white.
const TILE = { r: 0xff, g: 0xff, b: 0xff };

const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: W, height: H, channels: CH } = info;
console.log(`source ${W}x${H}, ${CH}ch`);

// ---- 1. bounding box of everything that is not (near) white ----
const NEAR_WHITE = 247;
let minX = W, minY = H, maxX = -1, maxY = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * CH;
    if (data[i] < NEAR_WHITE || data[i + 1] < NEAR_WHITE || data[i + 2] < NEAR_WHITE) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const bw = maxX - minX + 1;
const bh = maxY - minY + 1;
console.log(`content bbox ${bw}x${bh} at (${minX},${minY}) — trimming ${W - bw}px of white horizontally`);

// Square it off so the emblem never distorts, keeping it centred.
const side = Math.max(bw, bh);
const offX = minX - Math.floor((side - bw) / 2);
const offY = minY - Math.floor((side - bh) / 2);

// ---- 2. un-matte the white into an alpha channel ----
const out = Buffer.alloc(side * side * 4);
for (let y = 0; y < side; y++) {
  for (let x = 0; x < side; x++) {
    const sx = offX + x;
    const sy = offY + y;
    const o = (y * side + x) * 4;
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue; // stays transparent
    const i = (sy * W + sx) * CH;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const a = 1 - Math.min(r, g, b) / 255;
    if (a <= 0.004) continue; // pure white -> fully transparent
    const un = (c) => Math.max(0, Math.min(255, Math.round((c - 255 * (1 - a)) / a)));
    out[o] = un(r); out[o + 1] = un(g); out[o + 2] = un(b);
    out[o + 3] = Math.round(a * 255);
  }
}
const emblem = sharp(out, { raw: { width: side, height: side, channels: 4 } }).png();
mkdirSync(`${APP}\\public`, { recursive: true });

const emblemPng = await emblem.clone().toBuffer();

// The in-app mark renders at 32-40px. Shipping the full 669px master cost
// 658KB on every page load; 256px is still 6x the largest display size.
// Palette mode, because the glow is a wide smooth gradient and truecolour PNG
// stores every one of those shades: 135KB vs 30KB for the same 256px image.
// Any banding it introduces is well under a pixel at the sizes this renders.
const info256 = await sharp(emblemPng)
  .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ palette: true, quality: 90, compressionLevel: 9 })
  .toFile(`${APP}\\public\\logo.png`);
console.log(`wrote public/logo.png (transparent, 256px, ${Math.round(info256.size / 1024)}KB)`);

// ---- 3. icons: emblem on the deep-indigo tile ----
async function tile(size, inset, dest) {
  const inner = Math.round(size * inset);
  const pad = Math.round((size - inner) / 2);
  const scaled = await sharp(emblemPng).resize(inner, inner, { fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: { ...TILE, alpha: 1 } } })
    .composite([{ input: scaled, top: pad, left: pad }])
    .png()
    .toFile(dest);
  console.log(`wrote ${dest.replace(APP + '\\', '')} (${size}px, emblem at ${Math.round(inset * 100)}%)`);
}

await tile(512, 0.78, `${APP}\\public\\icon-512.png`);
await tile(192, 0.78, `${APP}\\public\\icon-192.png`);
// Android masks crop to roughly the inner 80%, so the emblem has to sit well
// inside that or the mask clips the book's corners.
await tile(512, 0.54, `${APP}\\public\\icon-maskable.png`);
await tile(512, 0.78, `${APP}\\app\\icon.png`);
await tile(180, 0.76, `${APP}\\app\\apple-icon.png`);
