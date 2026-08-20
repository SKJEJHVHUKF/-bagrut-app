#!/usr/bin/env python3
"""Crop the printed question text out of a bagrut exam PDF, one image per
question and one per סעיף, for the /bagruyot archive.

Only the MOE question text is ever cropped — never a publisher's handwriting,
logo, header or footer. Pick the y-ranges so those stay outside the box.

    pip install Pillow          # only dependency
    poppler (pdftoppm) on PATH

Workflow for a new paper
------------------------
1. Render the pages (200 dpi → A4 = 1654x2339 px):

     pdftoppm -png -r 200 -f 2 -l 33 paper.pdf pages/p

2. Find the text bands. Cheap — plain text output, no images to look at:

     python scan.py bands pages/p-07.png

3. Map bands to parts. Build a contact sheet of up to 4 pages with a y-ruler
   and read the boundaries off it:

     python scan.py ruler out.png 07 09 12 17

4. Write a manifest (see 2026-summer-571-a.json). Each entry is
   [page, y0, y1] or [page, y0, y1, x0, x1]; a LIST of those stacks them
   vertically, for a question that spills across two pages.

5. Crop, then re-check the result before wiring it into the content file:

     python scan.py crop 2026-summer-571-a.json ../../public/bagruyot/2026-summer-571-a
     python scan.py sheet check.png q2 q2-a q2-b     # after `crop --keep-png`

Traps
-----
* A figure on the left merges with the text in `bands`. Set x0 past the gap —
  `bands` prints the ink x-range so you can see where the figure ends.
* The narrow per-line crop of the FIRST sub-part loses the shared "נתון" lines
  above it. Rule: first sub-part gets the whole group crop, later sub-parts get
  their own line.
* scripts/verify-<paper>.ts should assert both directions: every imageSrc
  exists on disk, and every file on disk is referenced.
"""
import json
import os
import sys

from PIL import Image, ImageDraw

FULL_X = (40, 1625)
WEB_WIDTH = 1200
WEB_QUALITY = 88


# ------------------------------------------------------------------ bands
def bands(path, gap=8):
    """Rows of ink separated by >= `gap` blank rows. Returns (w, h, [(y0,y1,x0,x1)])."""
    im = Image.open(path).convert('L')
    w, h = im.size
    px = im.load()
    rows = []
    for y in range(h):
        ink, first, last = 0, -1, -1
        for x in range(0, w, 2):
            if px[x, y] < 200:
                ink += 1
                if first < 0:
                    first = x
                last = x
        rows.append((ink, first, last))
    out, run = [], None
    for y, (ink, f, l) in enumerate(rows):
        if ink > 1:
            run = [y, y, f, l] if run is None else [run[0], y, min(run[2], f), max(run[3], l)]
        elif run and y - run[1] > gap:
            out.append(tuple(run))
            run = None
    if run:
        out.append(tuple(run))
    return w, h, out


def cmd_bands(argv):
    gap = int(argv[1]) if len(argv) > 1 else 8
    w, h, bs = bands(argv[0], gap)
    print(f'{argv[0]}  size={w}x{h}  gap={gap}')
    for y0, y1, x0, x1 in bs:
        print(f'  y {y0:5d}-{y1:5d} (h={y1 - y0:4d})   x {x0:5d}-{x1:5d}')


# ------------------------------------------------------------------ ruler
def cmd_ruler(argv, scale=0.42, step=100, pages_dir='pages'):
    out, pages = argv[0], argv[1:]
    tiles = []
    for p in pages:
        im = Image.open(f'{pages_dir}/p-{p}.png').convert('RGB')
        w, h = im.size
        sm = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        d = ImageDraw.Draw(sm)
        for y in range(0, h, step):
            sy = int(y * scale)
            d.line([(0, sy), (60 if y % 500 == 0 else 26, sy)],
                   fill=(220, 0, 0) if y % 500 == 0 else (0, 160, 255))
            if y % 200 == 0:
                d.text((30, sy - 6), str(y), fill=(220, 0, 0))
        d.text((6, 4), f'p{p}', fill=(0, 130, 0))
        tiles.append(sm)
    sheet = Image.new('RGB',
                      (sum(t.width for t in tiles) + 8 * (len(tiles) - 1),
                       max(t.height for t in tiles)), 'white')
    x = 0
    for t in tiles:
        sheet.paste(t, (x, 0))
        x += t.width + 8
    sheet.save(out)
    print(out, sheet.size)


# ------------------------------------------------------------------ crop
def _piece(spec, pages_dir):
    page, y0, y1 = spec[0], spec[1], spec[2]
    x0, x1 = (spec[3], spec[4]) if len(spec) > 3 else FULL_X
    return Image.open(f'{pages_dir}/p-{page}.png').convert('RGB').crop((x0, y0, x1, y1))


def cmd_crop(argv, pages_dir='pages'):
    manifest, out_dir = argv[0], argv[1]
    keep_png = '--keep-png' in argv
    crops = json.load(open(manifest, encoding='utf-8'))
    os.makedirs(out_dir, exist_ok=True)
    if keep_png:
        os.makedirs('crops', exist_ok=True)
    total = 0
    for name, spec in crops.items():
        parts = spec if isinstance(spec[0], list) else [spec]
        ims = [_piece(p, pages_dir) for p in parts]
        if len(ims) == 1:
            im = ims[0]
        else:
            w = max(i.width for i in ims)
            im = Image.new('RGB', (w, sum(i.height for i in ims) + 12 * (len(ims) - 1)), 'white')
            y = 0
            for i in ims:
                im.paste(i, (w - i.width, y))   # RTL: keep the right edge aligned
                y += i.height + 12
        if keep_png:
            im.save(f'crops/{name}.png')
        gray = im.convert('L')
        if gray.width > WEB_WIDTH:
            gray = gray.resize((WEB_WIDTH, round(gray.height * WEB_WIDTH / gray.width)), Image.LANCZOS)
        path = f'{out_dir}/{name}.webp'
        gray.save(path, 'WEBP', quality=WEB_QUALITY, method=6)
        total += os.path.getsize(path)
    print(f'{len(crops)} crops -> {out_dir}/  ({total / 1024:.0f} KB)')


# ------------------------------------------------------------------ sheet
def cmd_sheet(argv, width=1000, crops_dir='crops'):
    """Stack named crops into one labelled image, to eyeball the boundaries."""
    out, names = argv[0], argv[1:]
    scaled = []
    for n in names:
        im = Image.open(f'{crops_dir}/{n}.png')
        s = im.resize((width, max(1, int(im.height * width / im.width))), Image.LANCZOS)
        d = ImageDraw.Draw(s)
        d.text((4, 2), n, fill=(200, 0, 0))
        d.rectangle([0, 0, width - 1, s.height - 1], outline=(0, 150, 0))
        scaled.append(s)
    sheet = Image.new('RGB', (width, sum(s.height + 6 for s in scaled)), 'white')
    y = 0
    for s in scaled:
        sheet.paste(s, (0, y))
        y += s.height + 6
    sheet.save(out)
    print(out, sheet.size)


COMMANDS = {'bands': cmd_bands, 'ruler': cmd_ruler, 'crop': cmd_crop, 'sheet': cmd_sheet}

if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print(__doc__)
        sys.exit(1)
    COMMANDS[sys.argv[1]](sys.argv[2:])
