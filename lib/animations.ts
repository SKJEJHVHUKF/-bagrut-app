/**
 * Shared Framer Motion variants — keeps motion consistent across the app.
 * Import these instead of redefining variants per component.
 */

import type { Variants, Transition } from 'framer-motion';

// ----- Easing -----
export const easeOut: Transition['ease'] = [0.22, 1, 0.36, 1]; // gentle ease-out

// ----- Fade + slide-up (for scroll reveals) -----
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
};

// ----- Fade only (for subtle reveals) -----
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: easeOut } },
};

// ----- Staggered children container -----
export const staggerContainer: Variants = {
  hidden: { opacity: 1 }, // container itself doesn't fade
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

// ----- Hero entrance: heavier stagger for impact -----
export const heroStagger: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

// ----- Scale-in (for badges / stats popping into view) -----
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: easeOut },
  },
};

// ----- Card hover lift -----
export const cardHover = {
  whileHover: { y: -4, transition: { duration: 0.2, ease: easeOut } },
  whileTap: { scale: 0.98 },
};

// ----- Button feedback -----
export const buttonTap = {
  whileTap: { scale: 0.96 },
  whileHover: { scale: 1.02 },
};

// ----- Helpers for scroll-triggered sections -----
export const inViewProps = {
  initial: 'hidden' as const,
  whileInView: 'visible' as const,
  viewport: { once: true, margin: '-80px' },
};
