// ============================================================
// Ghost Replay — the five בעיות קיצון stages
// ============================================================
//
// One replay per stage, so the 🧠 חשיבה rung exists on every ladder in the
// track. Each replays a HARD question the student has already fought with —
// placed after the 🔥 אתגר rung on purpose, because handed over earlier it
// would just be a worked solution, which is the thing it exists to replace.
//
// The five targets were chosen for their traps, one per stage:
//   ext-base       ext-sub-bs-011  V = x(20-2x)^2 — product AND composite at
//                                  once, where the inner derivative goes missing
//   ext-target     ext-sub-tg-011  the window — a semicircle contributes pi*r to
//                                  the frame, not 2*pi*r, and the rectangle's
//                                  top side is a diameter, not a side to frame
//   ext-extremum   ext-sub-ex-010  a CLOSED interval, where the maximum sits at
//                                  an endpoint and not at the critical point
//   ext-substitute ext-sub-sb-010  the question asks for a length of fence, so
//                                  answering x is answering the wrong quantity
//   ext-bagrut     ext-sub-bg-013  the canal crossing — the whole difficulty is
//                                  choosing WHICH variable to name
//
// Split one-per-file only so they could be written and adversarially checked in
// parallel. Spread into derivatives.ts, which is what content/ghost-replay/index.ts
// registers for math5:חשבון דיפרנציאלי.

import type { GhostReplay } from '../../types';
import { EXT_REPLAY_BASE } from './base';
import { EXT_REPLAY_TARGET } from './target';
import { EXT_REPLAY_EXTREMUM } from './extremum';
import { EXT_REPLAY_SUBSTITUTE } from './substitute';
import { EXT_REPLAY_BAGRUT } from './bagrut';

export const EXTREMUM_REPLAYS: GhostReplay[] = [
  EXT_REPLAY_BASE,
  EXT_REPLAY_TARGET,
  EXT_REPLAY_EXTREMUM,
  EXT_REPLAY_SUBSTITUTE,
  EXT_REPLAY_BAGRUT,
];
