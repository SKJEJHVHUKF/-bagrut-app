/** Settle it with the REAL tokeniser: does a digit survive, and does a Hebrew
 *  number word land on the same token? A reference note claimed both vanish. */
import { tokens } from '../lib/tutor-faq';

const CASES = [
  'מאיפה יצא המקדם 15',
  'מאיפה יצא המקדם חמישה עשר',
  'למה מחלקים ב 3',
  'למה מחלקים בשלוש',
  'הערך הגדול ביותר הוא 3',
  'שליש',
  'הזהות',
  'תשובה',
  'זהות',
];

for (const c of CASES) {
  console.log(JSON.stringify(c), '->', JSON.stringify(tokens(c)));
}

export {};
