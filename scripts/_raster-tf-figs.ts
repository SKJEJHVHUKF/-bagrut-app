// Rasterise the trig-functions figures to one PNG contact sheet so they can
// actually be LOOKED at. The numeric assertions prove the coordinates; they say
// nothing about two labels landing on top of each other, or a curve leaving the
// window and reading as a blank panel.
//
//   npx tsx scripts/_raster-tf-figs.ts <outdir>
import sharp from 'sharp';
import { render, type Fig } from './_gen-rq-figures';
import { TF_FIGURES } from './_tf-figure-specs';

const OUT = process.argv[2] ?? '.';
const SCALE = 2;
const COLS = 3;

const run = async () => {
  const entries = Object.entries(TF_FIGURES) as [string, Fig][];
  const CW = 300 * SCALE;
  const CH = 260 * SCALE;
  const tiles: { input: Buffer; left: number; top: number }[] = [];

  for (const [i, [id, fig]] of entries.entries()) {
    const w = fig.w ?? 300;
    const h = fig.h ?? 260;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${CW}" height="${CH}">` +
      `<rect width="100%" height="100%" fill="#FFFFFF"/>` +
      `<text x="6" y="14" font-size="11" fill="#DB2777">${id}</text>` +
      `${render(fig)}</svg>`;
    tiles.push({
      input: await sharp(Buffer.from(svg)).png().toBuffer(),
      left: (i % COLS) * CW,
      top: Math.floor(i / COLS) * CH,
    });
  }

  const rows = Math.ceil(entries.length / COLS);
  await sharp({
    create: {
      width: COLS * CW,
      height: rows * CH,
      channels: 3,
      background: { r: 245, g: 245, b: 250 },
    },
  })
    .composite(tiles)
    .png()
    .toFile(`${OUT}/tf-figures.png`);
  console.log(`wrote ${OUT}/tf-figures.png — ${entries.length} figure(s)`);
};

run();
