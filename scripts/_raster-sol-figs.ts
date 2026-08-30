// Rasterise the solution figures to PNGs so they can actually be LOOKED at.
// The numeric assertions prove the coordinates; they say nothing about two
// labels landing on top of each other.
import sharp from 'sharp';
import { SPECS, SOLUTION_PLACEMENT } from './_rq-figure-specs';
import { render } from './_gen-rq-figures';

const OUT = process.argv[2] ?? '.';
const SCALE = 2;

const run = async () => {
  const tiles: { input: Buffer; left: number; top: number }[] = [];
  const COLS = 4;
  const CW = 300 * SCALE;
  const CH = 260 * SCALE;

  for (const [i, p] of SOLUTION_PLACEMENT.entries()) {
    const spec = SPECS.find((s) => s.id === p.id)!;
    const w = spec.fig.w ?? 300;
    const h = spec.fig.h ?? 260;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${CW}" height="${CH}"><rect width="100%" height="100%" fill="#FFFFFF"/><text x="6" y="14" font-size="11" fill="#DB2777">${p.id}</text>${render(spec.fig)}</svg>`;
    tiles.push({
      input: await sharp(Buffer.from(svg)).png().toBuffer(),
      left: (i % COLS) * CW,
      top: Math.floor(i / COLS) * CH,
    });
  }

  const rows = Math.ceil(SOLUTION_PLACEMENT.length / COLS);
  await sharp({
    create: { width: COLS * CW, height: rows * CH, channels: 3, background: '#F1F5F9' },
  })
    .composite(tiles)
    .png()
    .toFile(`${OUT}/sol-figs.png`);
  console.log(`wrote ${OUT}/sol-figs.png — ${tiles.length} figures`);
};

run();
