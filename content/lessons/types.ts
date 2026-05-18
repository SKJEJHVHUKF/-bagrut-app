// Types for the static study-lesson content.
//
// Lessons are authored by hand in TypeScript modules under
// content/lessons/<subject>/<topic>.ts and served by the lesson page
// at /practice/[subject]/[topic]. They cover the same subject keys as
// /api/practice and /api/questions.

export type ConceptBlock = {
  title: string;
  body: string;
};

export type FormulaVariable = {
  sym: string;
  meaning: string;
};

export type Formula = {
  name: string;
  latex: string;
  variables: FormulaVariable[];
  note?: string;
};

export type WorkedExample = {
  difficulty: 'easy' | 'mid' | 'hard';
  problem: string;
  steps: string[];
  answer: string;
};

export type Lesson = {
  subject: string;
  topic: string;
  title: string;
  intro: string;
  concepts: ConceptBlock[];
  formulas: Formula[];
  examples: WorkedExample[];
  pitfalls: string[];
};
