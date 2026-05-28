/**
 * Confetti utilities — celebrate the small wins.
 * Wraps canvas-confetti with on-brand presets so callers don't repeat config.
 */

import confetti from 'canvas-confetti';

/** Quick burst from the center — for correct answers, finished sections. */
export function celebrateCorrect() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#a855f7', '#ec4899', '#10b981', '#f59e0b'],
    scalar: 0.9,
    ticks: 200,
  });
}

/** Bigger burst — for completing a full bagrut question (all parts solved). */
export function celebrateCompletion() {
  const end = Date.now() + 700;
  const colors = ['#a855f7', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** Subtle sparkle — for milestones (e.g., revealing hint, saving). */
export function sparkle() {
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.7 },
    colors: ['#fbbf24', '#f59e0b'],
    scalar: 0.7,
    ticks: 100,
  });
}
