'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { publishTutorFocus, FOCUS_PRIORITY } from '@/lib/tutor-presence';
import { MathText } from '@/components/practice/MathText';
import { createClient } from '@/lib/supabase/client';
import { hasQuestionBank, getQuestions } from '@/content/lessons';
import { markStep, getPaper, getUnitLevel } from '@/lib/study-plan';
import { recordResult } from '@/lib/results';
import { recordMistake } from '@/lib/mistakes';
import {
  getConceptQuestions,
  hasConceptBank,
  conceptLevelCounts,
  LEVEL_DIFFICULTY,
  LEVEL_META,
  CONCEPT_LEVELS,
  type ConceptLevel,
} from '@/content/concept-quiz';
import { getConceptLevel, setConceptLevel, recommendedConceptLevel } from '@/lib/concept-level';
import { isTopicInActivePaper, type BagrutPaper } from '@/content/bagrut-curriculum';
import { seededOrder } from '@/lib/shuffle';
import { pickQuestions, pickShuffled, studentTier } from '@/lib/adaptive';
import { predictOverall } from '@/lib/prediction';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { toast } from 'sonner';
import { Flame, Sprout, Target, Zap } from 'lucide-react';
import { TopicIcon } from '@/components/roadmap/TopicIcon';
import type { LucideIcon } from 'lucide-react';

// The three concept levels, drawn with the ladder's icon language (🌱⚡🔥 in
// the content stays; only the rendering swaps to lucide).
const LEVEL_ICONS: Record<1 | 2 | 3, LucideIcon> = { 1: Sprout, 2: Zap, 3: Flame };



// Math rendering comes from the shared, hardened components/practice/MathText.
// This page used to carry its own 14-line copy, which shadowed the shared one
// and was frozen at the pre-2026-07-28 behaviour: no remarkGfm, and `inline`
// returned a BARE FRAGMENT with no wrapper element and no `dir`. The shared
// version returns exactly ONE element carrying dir="rtl" (so a display:flex
// caller like .answer-btn gets one flex item, not one per formula) and computes
// the .math-only class from the source string, which left-aligns a standalone
// equation — precisely what a final answer needs.

const SUBJECTS = {
  // ===== Math 5 units (highest level) — שאלון 571/572 =====
  // Topic list reflects the post-2020 reform curriculum.
  math5: {
    name: 'מתמטיקה 5 יח׳',
    emoji: '📐',
    tabCls: 'tab-math',
    gridCls: 's-math',
    badge: { color: '#6D28D9', bg: 'rgba(109,40,217,0.08)', border: 'rgba(109,40,217,0.25)' },
    // Topics ordered to match the official Ministry of Education
    // syllabus for math5 (שאלון 806/571 + 807/572), 2024-2025 curriculum.
    // Source of truth: content/bagrut-curriculum.ts.
    topics: [
      // ===== שאלון 571 (806) =====
      // אלגברה, גיאו׳ אוקלידית + טריגו, חדו"א של פונקציות אלגבריות
      { name: 'אלגברה', emoji: '🔣', sub: '571 • בכל בגרות • 15-25 נק׳' },
      { name: 'סדרות', emoji: '⋯', sub: '571 • ברוב הבגרויות • 15-25 נק׳' },
      { name: 'הסתברות', emoji: '🎲', sub: '571 • ברוב הבגרויות • 15-25 נק׳' },
      { name: 'גיאומטריה אוקלידית', emoji: '△', sub: '571 • בכל בגרות • 15-20 נק׳' },
      { name: 'פונקציות', emoji: '📈', sub: '571/572 • יסודות חקירה — מקדים חדו"א' },
      { name: 'טריגונומטריה', emoji: '🔺', sub: '571 (במישור) + 572 (במרחב) • 20-25 נק׳' },
      { name: 'חשבון דיפרנציאלי', emoji: '∂', sub: '571 + 572 • בכל בגרות • 20-25 נק׳' },
      { name: 'חשבון אינטגרלי', emoji: '∫', sub: '571 + 572 • בכל בגרות • 20-25 נק׳' },
      // ===== שאלון 572 (807) =====
      // מעריכית/ln, גיאו׳ אנליטית, וקטורים, מרוכבים
      { name: 'פונקציה מעריכית', emoji: '📊', sub: '572 • בכל בגרות • 20-25 נק׳' },
      { name: 'גדילה ודעיכה', emoji: '📈', sub: '⚠️ מחוץ לסילבוס העדכני — תוכן רזרבי' },
      { name: 'פונקציית ln', emoji: '🧮', sub: '572 • בכל בגרות • 20-25 נק׳' },
      { name: 'גאומטריה אנליטית', emoji: '📍', sub: '572 • ברוב הבגרויות • 20-25 נק׳' },
      { name: 'וקטורים במרחב', emoji: '➡️', sub: '572 • ברוב הבגרויות • 20-25 נק׳' },
      { name: 'מספרים מרוכבים', emoji: 'ℂ', sub: '572 • בכל בגרות • 15-25 נק׳' },
      { name: 'סטטיסטיקה', emoji: '📉', sub: '⚠️ מחוץ לסילבוס העדכני — תוכן רזרבי' },
    ],
  },
  // ===== Math 4 units (intermediate) — שאלון 481/482 =====
  math4: {
    name: 'מתמטיקה 4 יח׳',
    emoji: '🔢',
    tabCls: 'tab-math',
    gridCls: 's-math',
    badge: { color: '#6D28D9', bg: 'rgba(109,40,217,0.08)', border: 'rgba(109,40,217,0.25)' },
    topics: [
      { name: 'אלגברה', emoji: '🔣', sub: 'משוואות, אי-שוויונים, ערך מוחלט' },
      { name: 'פונקציות', emoji: '📈', sub: 'פולינומיות, רציונליות, חקירה' },
      { name: 'פונקציה מעריכית', emoji: '📊', sub: 'e^x, a^x, גדילה ודעיכה' },
      { name: 'פונקציית ln', emoji: '🧮', sub: 'לוגריתם טבעי, חוקים, חקירה' },
      { name: 'טריגונומטריה', emoji: '🔺', sub: 'פתרון משולשים, זהויות בסיסיות' },
      { name: 'חשבון דיפרנציאלי', emoji: '∂', sub: 'נגזרות, חקירת פונקציות' },
      { name: 'חשבון אינטגרלי', emoji: '∫', sub: 'אינטגרל בלתי-מסוים ומסוים' },
      { name: 'גאומטריה אוקלידית', emoji: '📐', sub: 'משולשים, מרובעים, מעגלים' },
      { name: 'גאומטריה אנליטית', emoji: '📍', sub: 'הישר והמעגל' },
      { name: 'סדרות', emoji: '⋯', sub: 'חשבוניות והנדסיות' },
      { name: 'הסתברות', emoji: '🎲', sub: 'הסתברות בסיסית, נוסחאות' },
      { name: 'סטטיסטיקה', emoji: '📉', sub: 'שכיחות, ממוצע, סטיית תקן' },
    ],
  },
  // פיזיקה, אנגלית, היסטוריה, תנ"ך וכימיה הוסרו: הם היו רשימות נושאים בלבד,
  // בלי מאגר שאלות מאומת ובלי תוכן — כלומר שבעה מקצועות שהובטחו ורק שניים
  // נמסרו. המוצר הוא מתמטיקה 4 ו-5 יחידות, וזה מה שהוא אומר עכשיו.
};

// Sentinel "topic" for the mixed quiz — questions drawn from EVERY topic of
// the subject that has a static question bank. Never sent to the AI fallback.
const MIXED_TOPIC = '__mixed__';

// Statistics is reserve content, outside the current syllabus — a mixed exam
// simulating the real bagrut shouldn't pull questions from it.
const MIXED_EXCLUDED_TOPICS = new Set(['סטטיסטיקה']);

// Adapt a static PracticeQuestion into the shape this quiz UI renders,
// keeping id/difficulty/topic so the answer can be recorded for the
// weakness-tracking insights page.
function adaptBankQuestion(
  q: { id: string; difficulty: 'easy' | 'mid' | 'hard'; question: string; answers?: string[]; correct?: number; distractorNotes?: (string | undefined)[]; hint?: string; solution: { steps: string[]; finalAnswer: string; explanation: string } },
  topic: string
) {
  return {
    id: q.id,
    difficulty: q.difficulty,
    topic,
    question: q.question,
    answers: q.answers,
    correct: q.correct,
    // Per-option "why this is a mistake" note — a FREE, static, targeted
    // explanation the end-of-quiz review shows for the chosen wrong answer.
    distractorNotes: q.distractorNotes,
    // The lesson banks already carry ~598 authored hints and this adapter was
    // dropping every one of them, so the quiz could never offer a hint on the
    // lesson-bank or mixed path. Passing the field through switches them all on
    // at zero authoring cost.
    hint: q.hint,
    explanation: {
      why_correct: `${q.solution.explanation}\n\n${q.solution.steps.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}`,
      why_wrong: '',
      concept: '',
      remember: `**תשובה סופית:** ${q.solution.finalAnswer}`,
    },
  };
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Next.js 16 requires useSearchParams() to be wrapped in a Suspense boundary
// so the rest of the tree can pre-render statically. The inner component
// holds the actual logic; the default export is the Suspense wrapper.
export default function QuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Quiz />
    </Suspense>
  );
}

function Quiz() {
  const searchParams = useSearchParams();
  const urlSubject = searchParams.get('subject');
  const urlTopic = searchParams.get('topic');

  const [screen, setScreen] = useState('home');
  const [currentSubject, setCurrentSubject] = useState(
    urlSubject && urlSubject in SUBJECTS ? urlSubject : 'math5'
  );
  const [selectedTopic, setSelectedTopic] = useState<string | null>(urlTopic);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  // Predicted-grade snapshot taken when the quiz starts, so the results screen
  // can show "your predicted grade moved +N" once these answers are recorded.
  const [startPrediction, setStartPrediction] = useState<number | null>(null);

  // The bagrut paper the student is focused on (571/572); null = show all.
  // Read once after mount (localStorage), used to filter the math5 topic list.
  const [activePaper, setActivePaper] = useState<BagrutPaper | null>(null);
  // The level the student picked. `null` until the mount effect reads
  // localStorage — rendering reads `effectiveLevel` below, never this directly,
  // so the first paint doesn't flash an unselected picker.
  const [conceptLevel, setConceptLevelState] = useState<ConceptLevel | null>(null);
  // Whether the student asked for the hint on the current question.
  const [hintShown, setHintShown] = useState(false);

  useEffect(() => {
    setActivePaper(getPaper());
    const urlLevel = Number(searchParams.get('level'));
    if (urlLevel === 1 || urlLevel === 2 || urlLevel === 3) {
      setConceptLevelState(urlLevel);
      setConceptLevel(urlSubject && urlSubject in SUBJECTS ? urlSubject : 'math5', urlLevel);
    } else {
      setConceptLevelState(getConceptLevel(urlSubject && urlSubject in SUBJECTS ? urlSubject : 'math5'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subject = SUBJECTS[currentSubject as keyof typeof SUBJECTS];
  const letters = ['א', 'ב', 'ג', 'ד'];

  // What we'd suggest, from unit level + self-rating + live accuracy. Decorates
  // one chip; never decides. Recomputed per topic because the live-accuracy
  // signal is per topic.
  const recommended = useMemo(
    () => recommendedConceptLevel(currentSubject, selectedTopic ?? undefined),
    [currentSubject, selectedTopic],
  );
  /** The level actually in force: explicit choice first, else the suggestion. */
  const effectiveLevel: ConceptLevel = conceptLevel ?? recommended;

  const chooseLevel = (level: ConceptLevel) => {
    setConceptLevelState(level);
    setConceptLevel(currentSubject, level);
  };

  // How many static concept questions exist per level for the selected topic —
  // so the picker can show real numbers and say when a level isn't written yet
  // instead of promising something the bank can't serve.
  const levelCounts = useMemo(
    () =>
      selectedTopic && selectedTopic !== MIXED_TOPIC
        ? conceptLevelCounts(currentSubject, selectedTopic)
        : null,
    [currentSubject, selectedTopic],
  );

  // Deterministic per-question option order (seeded by id) so the correct
  // answer isn't always in slot א. Stable across renders and SSR-safe.
  const activeQuestion = questions[currentQ];
  const answerOrder = useMemo(
    () =>
      Array.isArray(activeQuestion?.answers)
        ? seededOrder(activeQuestion.answers.length, activeQuestion.id ?? String(currentQ))
        : [],
    [activeQuestion, currentQ],
  );

  // ===== publish the question to the floating tutor =====
  // Same contract as QuestionRunnerCard: one effect, keyed on render state, so
  // no answer path can forget to update it, and cleared on unmount so the tutor
  // never discusses a question the student already left.
  //
  // `selectedAnswer` is safe to read here (unlike in the practice runner, which
  // clears it for a retry) because /quiz has no retry — one commit per question.
  // The correct answer is published only once the verdict banner is on screen,
  // so the tutor can never hand over an answer the student can't yet see.
  useEffect(() => {
    if (!activeQuestion) {
      publishTutorFocus('quiz', null);
      return;
    }
    const wrong =
      isCorrect === false && selectedAnswer !== null
        ? activeQuestion.answers?.[selectedAnswer]
        : undefined;
    publishTutorFocus(
      'quiz',
      {
        where: `בוחן · ${activeQuestion.topic ?? selectedTopic ?? ''}`.trim(),
        topic: activeQuestion.topic ?? selectedTopic ?? undefined,
        questionText: activeQuestion.question,
        // The question object itself, so lib/tutor-local can serve the authored
        // hint / first step / distractor note with no API call at all.
        question: activeQuestion,
        ...(wrong ? { wrongAnswer: wrong, chosenIndex: selectedAnswer ?? undefined } : {}),
        ...(isCorrect !== null && typeof activeQuestion.correct === 'number'
          ? { correctAnswer: activeQuestion.answers?.[activeQuestion.correct] }
          : {}),
      },
      FOCUS_PRIORITY.question,
    );
    return () => publishTutorFocus('quiz', null);
  }, [activeQuestion, isCorrect, selectedAnswer, selectedTopic]);

  // math5 topic list filtered to the student's active paper (571/572);
  // other subjects / no chosen paper → the full list.
  const visibleTopics =
    currentSubject === 'math5' && activePaper
      ? subject.topics.filter((t) => isTopicInActivePaper(t.name, activePaper))
      : subject.topics;

  // Deep-link auto-start: if /quiz?subject=...&topic=... has both params and
  // the topic has ANY static bank (concept OR lesson), jump straight into the
  // quiz. This is how the TopicJourney "step 2" button gets students into a
  // topic-specific quiz without making them pick again. Gate matches what
  // startQuiz can actually serve statically — previously it checked only the
  // lesson bank while startQuiz served from the concept bank, a mismatch.
  useEffect(() => {
    if (
      urlSubject &&
      urlTopic &&
      urlSubject in SUBJECTS &&
      (hasConceptBank(urlSubject, urlTopic) || hasQuestionBank(urlSubject, urlTopic)) &&
      screen === 'home'
    ) {
      // Defer one tick so state updates land before startQuiz runs.
      setTimeout(() => startQuiz(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startQuiz = async (levelOverride?: ConceptLevel) => {
    if (!selectedTopic) return;
    // Resolve the level HERE, not from render state. The deep-link auto-start
    // below fires through setTimeout(…, 0) and can beat the mount effect that
    // reads localStorage, so reading `conceptLevel` would race to null.
    const level: ConceptLevel =
      levelOverride ??
      conceptLevel ??
      getConceptLevel(currentSubject) ??
      recommendedConceptLevel(currentSubject, selectedTopic);
    const band = LEVEL_DIFFICULTY[level];
    const perSession = LEVEL_META[level].perSession;

    setLoading(true);
    setScreen('quiz');
    setCurrentQ(0);
    setScore(0);
    setQuestions([]);
    setAnswered([]);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setHintShown(false);
    // Snapshot the predicted grade now, so the results screen can show the
    // delta after these answers land in the stats.
    setStartPrediction(predictOverall(currentSubject)?.score ?? null);

    // ===== MIXED QUIZ =====
    // Draws MCQs from every topic of the subject that has a static bank,
    // round-robin so no single topic dominates. 8 questions, zero API cost.
    if (selectedTopic === MIXED_TOPIC) {
      const perTopic: any[][] = [];
      let bandAvailable = 0;
      for (const t of subject.topics) {
        if (MIXED_EXCLUDED_TOPICS.has(t.name)) continue;
        // Respect the student's active paper — a 571 student's mixed quiz
        // shouldn't pull vectors/complex, and vice versa.
        if (currentSubject === 'math5' && activePaper && !isTopicInActivePaper(t.name, activePaper)) continue;
        if (!hasQuestionBank(currentSubject, t.name)) continue;
        const all = getQuestions(currentSubject, t.name)
          .filter((q) => q.kind === 'mcq' && Array.isArray(q.answers) && typeof q.correct === 'number')
          .map((q) => adaptBankQuestion(q, t.name));
        // Honour the chosen level. Band-first, then the rest as reserve — the
        // lesson banks skew easy/mid, so a STRICT level-3 filter across topics
        // can yield two questions. Widening beats dead-ending, and the toast
        // below says when it happened rather than pretending it didn't.
        const inBand = all.filter((q) => q.difficulty === band);
        const rest = all.filter((q) => q.difficulty !== band);
        if (all.length > 0) perTopic.push([...shuffleInPlace(inBand), ...shuffleInPlace(rest)]);
        bandAvailable += inBand.length;
      }
      // Round-robin: one question from each topic (random topic order),
      // then a second pass, until we have 8.
      shuffleInPlace(perTopic);
      const picked: any[] = [];
      for (let round = 0; picked.length < 8; round++) {
        let took = false;
        for (const list of perTopic) {
          if (round < list.length && picked.length < 8) {
            picked.push(list[round]);
            took = true;
          }
        }
        if (!took) break; // every bank exhausted
      }
      shuffleInPlace(picked);
      if (picked.length === 0) {
        toast.error('אין עדיין בנק שאלות למקצוע הזה — בחר נושא ספציפי');
        setScreen('home');
        setLoading(false);
        return;
      }
      if (bandAvailable < picked.length) {
        toast.info(`אין מספיק שאלות ברמה ${level} בכל הנושאים — השלמתי מרמות אחרות`);
      }
      setQuestions(picked);
      setLoading(false);
      return;
    }

    // Difficulty mix adapted to the student's level (unit level + self-rating
    // + live accuracy). Zero API cost — just picks from the static bank.
    const tier = studentTier(currentSubject, selectedTopic);

    // ===== STATIC CONCEPT BANK FIRST (no API, no Supabase) =====
    // Pre-authored, hand-verified concept questions AT THE CHOSEN LEVEL.
    // "טמונות מראש" — zero API cost.
    if (hasConceptBank(currentSubject, selectedTopic, level)) {
      // ConceptQuestion carries `level` (1/2/3) instead of `difficulty`. Stamp
      // the derived difficulty on so `checkAnswer` and `recordResult` keep
      // speaking easy/mid/hard and need no change — the mapping is the identity
      // of the migration, so recorded history stays comparable with what
      // students already have in localStorage.
      const bank = getConceptQuestions(currentSubject, selectedTopic, level).map((q) => ({
        ...q,
        topic: selectedTopic,
        difficulty: LEVEL_DIFFICULTY[q.level],
      }));
      // pickShuffled, NOT pickQuestions: the student chose this level
      // explicitly, and TIER_MIX would dilute it back with adjacent bands.
      const picked = pickShuffled(bank, perSession);
      if (picked.length > 0) {
        setQuestions(picked);
        setLoading(false);
        return;
      }
    }

    // ===== LESSON MCQ BANK (no API) — topics without a concept bank =====
    // ~490 verified MCQs live in the sub-topic banks; serve them level-matched
    // before ever paying for a live generation. This is what keeps a 571
    // single-topic quiz at zero API cost even for topics we haven't authored a
    // dedicated concept bank for.
    if (hasQuestionBank(currentSubject, selectedTopic)) {
      const mcqs = getQuestions(currentSubject, selectedTopic)
        .filter((q) => q.kind === 'mcq' && Array.isArray(q.answers) && typeof q.correct === 'number')
        .map((q) => adaptBankQuestion(q, selectedTopic));
      if (mcqs.length > 0) {
        const inBand = mcqs.filter((q) => q.difficulty === band);
        let picked: typeof mcqs;
        if (inBand.length >= 3) {
          picked = pickShuffled(inBand, perSession);
        } else {
          // Too thin to honour the level here. Fall back to the tier mix rather
          // than serving two questions, and say so — silently substituting is
          // what makes a level picker feel fake.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          picked = pickQuestions(mcqs as any, perSession, tier) as unknown as typeof mcqs;
          toast.info(`בנושא הזה אין עדיין מאגר מלא ברמה ${level} — הבוחן מותאם לרמה הקרובה`);
        }
        setQuestions(picked);
        setLoading(false);
        return;
      }
    }

    // ===== CONCEPTS QUIZ (AI fallback — topics with no static bank at all) =====
    // Theory/rules questions served from the pre-generated pool when warm, else
    // generated live. Timeout-guarded so a hung request can't spin forever.
    try {
      const res = await fetchWithTimeout('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // `level` and `unitLevel` are new on the wire. Safe to send before the
        // route honours them — it reads named fields, so extras are ignored.
        body: JSON.stringify({
          subject: currentSubject,
          topic: selectedTopic,
          mode: 'concept',
          level,
          unitLevel: getUnitLevel(),
        })
      });

      if (!res.ok) {
        let serverMsg = '';
        try {
          const errData = await res.json();
          serverMsg = errData?.error ?? '';
        } catch {
          serverMsg = await res.text().catch(() => '');
        }
        throw new Error(serverMsg || `שגיאה ${res.status}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.questions) throw new Error('לא התקבלו שאלות. נסה שוב.');

      // AI questions arrive with no id and no difficulty, so recordResult was
      // logging `difficulty: undefined` and seededOrder fell back to the index.
      // The id MUST vary per generation: a stable synthetic id would make a
      // second round on the same topic register as a `repeat` in lib/results
      // readSeen() and drop out of the accuracy that feeds the prediction.
      const gen = Date.now().toString(36);
      setQuestions(
        (data.questions as any[]).map((q, i) => ({
          ...q,
          id: q.id ?? `ai-${gen}-${i}`,
          difficulty: q.difficulty ?? band,
          topic: q.topic ?? selectedTopic,
        })),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
      setScreen('home');
    }
    setLoading(false);
  };

  const checkAnswer = (idx: number) => {
    const q = questions[currentQ];
    const ok = idx === q.correct;
    setSelectedAnswer(idx);
    setIsCorrect(ok);
    // `topic` per answer feeds the per-topic breakdown on the results screen
    // (meaningful in the mixed quiz, where every question has its own topic).
    const answerTopic: string = q.topic ?? selectedTopic ?? '';
    // Keep enough to REVIEW wrong answers at the end: the chosen option, the
    // correct option, the explanation, and the per-option misconception note.
    const chosenText = Array.isArray(q.answers) ? q.answers[idx] : undefined;
    const correctText = Array.isArray(q.answers) ? q.answers[q.correct] : undefined;
    const distractorNote = Array.isArray(q.distractorNotes) ? q.distractorNotes[idx] : undefined;
    setAnswered([
      ...answered,
      {
        question: q.question,
        correct: ok,
        topic: answerTopic,
        chosenText,
        correctText,
        distractorNote,
        explanation: q.explanation,
        // Session-local only. Deliberately NOT added to lib/results.ts
        // ResultEvent — that type has stored data behind it and needs no
        // migration to surface a per-session note in the review.
        usedHint: hintShown,
      },
    ]);
    if (ok) setScore(score + 1);
    // Weakness tracking for the insights page ("התמונה שלי").
    if (answerTopic) {
      recordResult({
        subject: currentSubject,
        topic: answerTopic,
        questionId: q.id,
        source: 'quiz',
        difficulty: q.difficulty,
        correct: ok,
        // Diagnostic fields for lib/cognition. `idx` is the UNSHUFFLED index
        // (see the `ok` comparison right above), which is what the
        // misconception catalog is keyed on. Concept-quiz ids are absent from
        // the catalog and are simply ignored there; the lesson-bank questions
        // this route falls back to are mapped, so they carry real signal.
        // This is also the one surface with a hint BEFORE the answer, so
        // `hintUsed` is genuinely meaningful here.
        kind: 'mcq',
        chosenIndex: idx,
        ...(Array.isArray(q.answers) ? { optionCount: q.answers.length } : {}),
        ...(hintShown ? { hintUsed: true } : {}),
      });
      // Wrong answers also go to the error notebook (מחברת טעויות).
      if (!ok) {
        recordMistake({
          subject: currentSubject,
          topic: answerTopic,
          questionId: q.id,
          questionText: q.question,
          userAnswer: Array.isArray(q.answers) ? q.answers[idx] : undefined,
          correctAnswer: Array.isArray(q.answers) ? q.answers[q.correct] : undefined,
          category: 'אחר',
          source: 'quiz',
        });
      }
    }
  };

  // Persist the completed session to Supabase. Fire-and-forget so the UX
  // never blocks waiting for the network. Errors are logged for debugging
  // but never surfaced to the user — losing a history row is worse UX
  // than blocking the results screen on a flaky DB call.
  const saveSession = (finalScore: number, finalAnswered: Array<{ question: string; correct: boolean; topic?: string }>) => {
    if (!selectedTopic) return;
    const supabase = createClient();
    supabase
      .from('practice_sessions')
      .insert({
        // user_id auto-fills from auth.uid() via the column default in SQL
        subject_key: currentSubject,
        subject_name: subject.name,
        subject_emoji: subject.emoji,
        topic: selectedTopic === MIXED_TOPIC ? 'בדיקה מעורבת' : selectedTopic,
        score: finalScore,
        total: questions.length,
        answered: finalAnswered,
        questions: questions,
      })
      .then(({ error }) => {
        if (error) console.error('[practice_sessions] insert failed:', error);
      });
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setHintShown(false);
    if (currentQ >= questions.length - 1) {
      // This is the transition from the last question to the results
      // screen — the only moment we have the final score AND the full
      // per-question outcome list. Save now.
      saveSession(score, answered);
      setScreen('results');
      // Mark the 'quiz' step in the personalized study plan so the
      // TopicJourney can advance to stage 3 (practice).
      if (selectedTopic) {
        markStep(currentSubject, selectedTopic, 'quiz');
      }
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  const renderHome = () => (
    <div className="home-inner">
      <div className="hero">
        <div className="hero-badge">
          <Zap className="w-3.5 h-3.5" aria-hidden="true" />
          בוחן מושגים · 3 רמות
        </div>
        <h1>בוחן מושגים</h1>
        <p>
          {effectiveLevel === 3
            ? 'רמה 3 היא ברמת בגרות — שאלות בסגנון הבחינה, כמה צעדים כל אחת. קח דף ועט.'
            : 'בדיקה מהירה של הבנת מושגים — הגדרות, אסימפטוטות, כללי גזירה. חימום מהיר לראש, לא סימולציית בגרות.'}
        </p>
      </div>
      <div className="section-label">1 · בחר מקצוע</div>
      <div className="subject-tabs">
        {Object.entries(SUBJECTS).map(([key, s]) => (
          <button key={key} className={`subject-tab ${s.tabCls} ${currentSubject === key ? 'active' : ''}`} onClick={() => { setCurrentSubject(key); setSelectedTopic(null); }}>
            {s.name}
          </button>
        ))}
      </div>
      <div className="section-label">2 · בחר נושא</div>
      <div className="topics-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {visibleTopics.some((t) => hasQuestionBank(currentSubject, t.name)) && (
          <div
            className={`topic-card ${selectedTopic === MIXED_TOPIC ? 'selected' : ''}`}
            onClick={() => setSelectedTopic(MIXED_TOPIC)}
            style={{ gridColumn: '1 / -1' }}
          >
            <span className="topic-check">✓</span>
            <span className="topic-emoji">
              <Target aria-hidden="true" strokeWidth={1.75} />
            </span>
            <div className="topic-name">בדיקה מעורבת — כל הנושאים</div>
            <div className="topic-sub">שאלות מושג מכל נושאי השאלון · מגלה לך איפה אתה חזק ואיפה צריך חיזוק</div>
          </div>
        )}
        {visibleTopics.map((t, i) => (
          <div key={i} className={`topic-card ${selectedTopic === t.name ? 'selected' : ''}`} onClick={() => setSelectedTopic(t.name)}>
            <span className="topic-check">✓</span>
            <span className="topic-emoji">
              <TopicIcon id={t.name} />
            </span>
            <div className="topic-name">{t.name}</div>
            <div className="topic-sub">{t.sub}</div>
          </div>
        ))}
      </div>

      {/* ===== 3 · Level picker =====
          Always three open chips. No level ever locks another — a level with no
          static questions is a CONTENT gap, not a gate, and the note underneath
          says so explicitly rather than leaving the student to guess. */}
      <div className="section-label">3 · בחר רמה</div>
      <div className="zone-hint">
        אותם נושאים בשלוש רמות. אפשר להתחיל ברמה 1 ולעלות — הרמות פתוחות תמיד.
      </div>
      <div className="level-grid">
        {CONCEPT_LEVELS.map((lv) => {
          const meta = LEVEL_META[lv];
          const n = levelCounts?.[lv];
          const countLabel =
            selectedTopic === MIXED_TOPIC
              ? 'לפי נושאי השאלון'
              : levelCounts == null
                ? 'בחר נושא'
                : n && n > 0
                  ? `${n} שאלות מוכנות`
                  : 'נבנה מהמאגר';
          const LevelIcon = LEVEL_ICONS[lv];
          return (
            <button
              key={lv}
              className={`level-card ${effectiveLevel === lv ? 'selected' : ''}`}
              onClick={() => chooseLevel(lv)}
            >
              <span className="level-emoji">
                <LevelIcon aria-hidden="true" strokeWidth={1.75} />
              </span>
              <span className="level-title">{meta.title}</span>
              <span className="level-blurb">{meta.blurb}</span>
              <span className="level-count">{countLabel}</span>
              {recommended === lv && <span className="level-badge-rec">מומלץ לך</span>}
            </button>
          );
        })}
      </div>
      {levelCounts != null && (levelCounts[effectiveLevel] ?? 0) === 0 && (
        <div className="level-note">
          שאלות המושגים ברמה {effectiveLevel} בנושא הזה עדיין בכתיבה. הרמה פתוחה — הבוחן ייקח
          שאלות ברמה המקבילה ממאגר התרגול, ותקבל הסבר מלא ורמז בדיוק כמו בשאר הרמות.
        </div>
      )}

      <button className="start-btn" onClick={() => startQuiz()} disabled={!selectedTopic}>
        התחל בוחן — רמה {effectiveLevel} →
      </button>
      <a href="/chat" className="chat-link">
        שאל את המורה — צ&apos;אט עם AI
      </a>
      <a href="/history" className="chat-link" style={{ marginTop: '8px' }}>
        ההיסטוריה שלי
      </a>
      <a href="/insights" className="chat-link" style={{ marginTop: '8px' }}>
        התמונה שלי — חוזקות וחולשות
      </a>
    </div>
  );

  const renderQuiz = () => {
    if (loading || questions.length === 0) {
      return (
        <div className="quiz-inner">
          <div className="loading-state">
            <div className="loader-ring"></div>
            <div className="loading-tip">
              <strong>{subject.name} — {selectedTopic === MIXED_TOPIC ? 'בדיקה מעורבת' : selectedTopic}</strong>
              <span>מכין לך שאלות מושגים...</span>
              <span style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>בדרך כלל 5-15 שניות</span>
            </div>
          </div>
        </div>
      );
    }

    const q = questions[currentQ];
    const pct = Math.round((currentQ / questions.length) * 100);

    return (
      <div className="quiz-inner">
        <div className="quiz-topbar">
          <button className="back-icon-btn" onClick={() => setScreen('home')}>←</button>
          <div className="progress-track">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%` }}></div>
            </div>
            <div className="progress-labels">
              <span className="progress-step">שאלה {currentQ + 1} מ-{questions.length}</span>
              <span className="progress-score">{score} נכון</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '12px' }}>
          <div className="quiz-meta-strip">
            <span className="meta-subject-badge" style={{ color: subject.badge.color, background: subject.badge.bg, borderColor: subject.badge.border }}>
              {subject.name}
            </span>
            <span className="meta-level-badge">{LEVEL_META[effectiveLevel].short}</span>
            <span className="meta-topic-label">
              {selectedTopic === MIXED_TOPIC ? `בדיקה מעורבת · ${q.topic ?? ''}` : selectedTopic}
            </span>
          </div>
          <div className="question-card">
            <div className="q-number">שאלה {currentQ + 1}</div>
            <div className="q-text math-content">
              <MathText>{q.question}</MathText>
            </div>
          </div>

          {/* ===== Hint — asked for, not pushed =====
              One-shot reveal BEFORE answering, which is what "an option to ask
              for a hint" means. Deliberately not QuestionRunnerCard's
              auto-reveal-on-miss + free retry: this quiz has no retry, since
              checkAnswer records the result and opens the full explanation
              immediately, so a retry would change the scoring contract. Wording
              is the same single "רמז" used elsewhere in the app. */}
          {q.hint && selectedAnswer === null && !hintShown && (
            <button
              className="hint-btn"
              onClick={() => {
                setHintShown(true);
                toast.info('רמז', {
                  description: 'נסה לפתור עם הרמז לפני שתבחר תשובה',
                  duration: 2500,
                });
              }}
            >
              בקש רמז
            </button>
          )}
          {q.hint && hintShown && (
            <div className="hint-card">
              <div className="lesson-label">
                <span>רמז</span>
              </div>
              <div className="hint-text math-content">
                <MathText>{q.hint}</MathText>
              </div>
            </div>
          )}

          <div className="answers">
            {answerOrder.map((origIdx: number, i: number) => {
              const ans: string = q.answers[origIdx];
              // After answering: the picked option turns correct/wrong, and the
              // right answer is always revealed green so a wrong pick shows what
              // it should have been.
              const showAsCorrect = selectedAnswer !== null && origIdx === q.correct;
              const showAsWrong = selectedAnswer === origIdx && !isCorrect;
              return (
                <button
                  key={origIdx}
                  className={`answer-btn ${showAsCorrect ? 'correct' : showAsWrong ? 'wrong' : ''}`}
                  onClick={() => checkAnswer(origIdx)}
                  disabled={selectedAnswer !== null}
                >
                  <span className="answer-letter">{letters[i]}</span>
                  <span className="answer-text math-content">
                    <MathText inline>{ans}</MathText>
                  </span>
                </button>
              );
            })}
          </div>
          {selectedAnswer !== null && (
            <>
              <div className={`verdict-banner ${isCorrect ? 'verdict-correct' : 'verdict-wrong'}`}>
                {isCorrect ? 'נכון! כל הכבוד' : 'טעות — אבל בוא נלמד מזה'}
              </div>

              {/* Structured explanation (new rich format).
                  Falls back to plain text for legacy/cached entries.
                  Each text block now renders markdown + LaTeX math via
                  MathText so the AI can use $...$ / $$...$$ to typeset
                  fractions, exponents, ln, integrals, etc. — same as in
                  the /chat page. */}
              {typeof q.explanation === 'string' ? (
                <div className="explanation-box" style={{ display: 'block' }}>
                  <div className="ex-label">הסבר</div>
                  <div className="ex-text math-content">
                    <MathText>{q.explanation}</MathText>
                  </div>
                </div>
              ) : (
                <div className="lesson-stack">
                  {/* The student's OWN mistake, first. `selectedAnswer` is the
                      index into the original answers array (checkAnswer is
                      called with the unshuffled index), so it lines up with
                      distractorNotes directly. Shown only on a wrong answer —
                      on a correct one there is no misconception to unpick. */}
                  {!isCorrect &&
                    selectedAnswer !== null &&
                    Array.isArray(q.distractorNotes) &&
                    q.distractorNotes[selectedAnswer] && (
                      <div className="lesson-card lesson-wrong">
                        <div className="lesson-label">
                          <span>למה התשובה שבחרת שגויה</span>
                        </div>
                        <div className="lesson-text math-content">
                          <MathText>{q.distractorNotes[selectedAnswer]}</MathText>
                        </div>
                      </div>
                    )}

                  {q.explanation?.why_correct && (
                    <div className="lesson-card lesson-correct">
                      <div className="lesson-label">
                        <span>למה התשובה הנכונה</span>
                      </div>
                      <div className="lesson-text math-content">
                        <MathText>{q.explanation.why_correct}</MathText>
                      </div>
                    </div>
                  )}

                  {q.explanation?.why_wrong && (
                    <div className="lesson-card lesson-wrong">
                      <div className="lesson-label">
                        <span>למה האחרות שגויות</span>
                      </div>
                      <div className="lesson-text math-content">
                        <MathText>{q.explanation.why_wrong}</MathText>
                      </div>
                    </div>
                  )}

                  {q.explanation?.concept && (
                    <div className="lesson-card lesson-concept">
                      <div className="lesson-label">
                        <span>הרעיון העקרוני</span>
                      </div>
                      <div className="lesson-text math-content">
                        <MathText>{q.explanation.concept}</MathText>
                      </div>
                    </div>
                  )}

                  {q.explanation?.remember && (
                    <div className="lesson-card lesson-tip">
                      <div className="lesson-label">
                        <span>טיפ לזכור</span>
                      </div>
                      <div className="lesson-text math-content">
                        <MathText>{q.explanation.remember}</MathText>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                className="start-btn"
                onClick={nextQuestion}
                style={{ marginTop: '12px' }}
              >
                {currentQ >= questions.length - 1 ? 'לתוצאות →' : 'השאלה הבאה →'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    const [emoji, title, sub] = pct === 100 ? ['🏆', 'מושלם!', 'ציון 100 — אתה מוכן לבגרות!'] : pct >= 80 ? ['🔥', 'מצוין!', `${pct}% — כמעט שם!`] : pct >= 60 ? ['👍', 'לא רע!', `${pct}% — חזור על מה שפספסת`] : ['💪', 'יש מה לשפר', `${pct}% — תנסה שוב`];

    // Per-topic breakdown — the "מה גילינו עליך" moment. Only meaningful
    // when the session spans more than one topic (the mixed quiz).
    const byTopic = new Map<string, { correct: number; total: number }>();
    for (const a of answered) {
      const t = (a as { topic?: string }).topic;
      if (!t) continue;
      const cur = byTopic.get(t) ?? { correct: 0, total: 0 };
      cur.total += 1;
      if (a.correct) cur.correct += 1;
      byTopic.set(t, cur);
    }
    const breakdown = [...byTopic.entries()].sort(
      (a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total
    );

    // Wrong answers to REVIEW — the highest-value part of a quiz. Each carries
    // the chosen option, the correct one, and a targeted "why" note.
    const wrongAnswers = answered.filter((a) => !a.correct);

    // Predicted-grade delta — the strongest motivation hook. These answers are
    // already recorded, so re-predicting now reflects them.
    const endPrediction = predictOverall(currentSubject)?.score ?? null;
    const predDelta =
      startPrediction != null && endPrediction != null
        ? Math.round(endPrediction - startPrediction)
        : null;

    return (
      <div className="results-inner">
        <div className="result-hero">
          <span className="result-emoji">{emoji}</span>
          <div className="result-title">{title}</div>
          <div className="result-sub">{sub}</div>
        </div>
        {predDelta != null && predDelta !== 0 && (
          <div
            className="breakdown-box"
            style={{
              textAlign: 'center',
              fontWeight: 700,
              color: predDelta > 0 ? 'var(--correct)' : 'var(--text2)',
            }}
          >
            {predDelta > 0
              ? `הציון החזוי שלך עלה ב-${predDelta} נקודות`
              : `הציון החזוי ירד ב-${Math.abs(predDelta)} — שווה חזרה על הנושא`}
          </div>
        )}
        <div className="stats-row">
          <div className="stat-box stat-correct">
            <div className="stat-val">{score}</div>
            <div className="stat-lbl">נכון ✓</div>
          </div>
          <div className="stat-box stat-wrong">
            <div className="stat-val">{total - score}</div>
            <div className="stat-lbl">טעות ✗</div>
          </div>
          <div className="stat-box">
            <div className="stat-val" style={{ color: 'var(--text2)' }}>{total}</div>
            <div className="stat-lbl">שאלות</div>
          </div>
        </div>
        {breakdown.length > 1 && (
          <div className="breakdown-box">
            <div className="breakdown-title">פירוק לפי נושא — מהחלש לחזק</div>
            {breakdown.map(([t, s]) => {
              const topicPct = Math.round((s.correct / s.total) * 100);
              return (
                <div key={t} className="breakdown-row">
                  <span className="breakdown-topic">{t}</span>
                  <span className={`breakdown-score ${topicPct >= 70 ? 'bd-good' : topicPct >= 40 ? 'bd-mid' : 'bd-weak'}`}>
                    {s.correct}/{s.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {wrongAnswers.length > 0 && (
          <div className="breakdown-box">
            <div className="breakdown-title">הטעויות שלך בבוחן — כדאי לעבור עליהן</div>
            {wrongAnswers.map((a, i) => {
              const why =
                a.distractorNote ||
                a.explanation?.why_wrong ||
                a.explanation?.why_correct ||
                '';
              // Every text row carries `math-content` — this block is the one
              // place in the quiz that had none, so its KaTeX inherited
              // `direction: rtl` from <html dir="rtl"> and students read their
              // own wrong answer and the correct one as REVERSED equations, in
              // the exact screen they come to to learn from the mistake.
              return (
                <div key={i} className={`review-item${i === 0 ? ' review-first' : ''}`}>
                  <div className="review-q math-content">
                    <MathText inline>{a.question}</MathText>
                    {a.usedHint && <span className="review-hint-flag">נעזרת ברמז</span>}
                  </div>
                  {a.chosenText && (
                    <div className="review-chosen math-content">
                      התשובה שלך: <MathText inline>{a.chosenText}</MathText>
                    </div>
                  )}
                  {a.correctText && (
                    <div className="review-correct math-content">
                      הנכונה: <MathText inline>{a.correctText}</MathText>
                    </div>
                  )}
                  {why && (
                    <div className="review-why math-content">
                      <MathText>{why}</MathText>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="action-row">
          <button className="start-btn" onClick={() => startQuiz()}>
            {selectedTopic === MIXED_TOPIC
              ? 'בדיקה מעורבת נוספת'
              : `סבב נוסף — רמה ${effectiveLevel}`}
          </button>
          {effectiveLevel < 3 && selectedTopic !== MIXED_TOPIC && (
            <button
              className="btn-outline"
              onClick={() => {
                const next = (effectiveLevel + 1) as ConceptLevel;
                chooseLevel(next);
                startQuiz(next);
              }}
            >
              נסה את רמה {effectiveLevel + 1}
            </button>
          )}
          {wrongAnswers.length > 0 && (
            <a href="/errors" className="btn-outline" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              תרגל את הטעויות שלי — מחברת הטעויות
            </a>
          )}
          <a href="/insights" className="btn-outline" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            התמונה שלי — חוזקות, חולשות ותרגול חיזוק
          </a>
          <button className="btn-outline" onClick={() => setScreen('home')}>בחר נושא אחר</button>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        /* ===== Scoped to .quiz-root — was :root, *, and body =====
           This block used to hijack GLOBAL names. Three separate problems:

           1. It redefined --accent on :root as indigo #6366F1. globals.css
              defines --accent as the achievement gold #B8860B, so every shared
              component rendered on this page silently changed colour — and the
              whole screen stayed on the PRE-REBRAND indigo/pink palette while
              the rest of the app moved to violet/cyan. /quiz looked like a
              different product. The values below now MAP to the app's tokens
              instead of competing with them.
           2. The universal selector rule was a second CSS reset applied to the
              entire document (margin, padding, box-sizing). Tailwind's
              preflight already does all three, so it was redundant as well
              as global.
           3. The body rule restyled the document body from inside a page
              component, fighting globals.css and flattening anything else
              mounted in the layout. The centring it provided moves to the
              .quiz-root wrapper, where it belongs.

           NOTE: no backticks in this comment — the whole block lives inside a
           JS template literal, and one backtick here terminates the string. */
        .quiz-root { display: flex; align-items: flex-start; justify-content: center; }
        .quiz-root {
          --bg: var(--background); --surface: var(--surface-1); --surface2: var(--surface-2); --surface3: #E9E2FB;
          --border: rgba(15,23,42,0.10); --border2: rgba(15,23,42,0.20);
          --text: var(--foreground); --text2: var(--muted); --text3: var(--faint);
          --correct: var(--success); --wrong: var(--danger);
          --accent: var(--primary-deep); --accent2: var(--accent-cyan-ink);
          --radius: 24px; --radius-sm: 14px;
        }
        .bg-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .bg-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.10; }
        /* Brand orbs. Were indigo/pink/emerald — the pre-rebrand palette, and
           the reason this screen read as a different app. Now the same
           violet-with-a-cyan-glow field globals.css paints everywhere else. */
        .bg-orb-1 { width: 600px; height: 600px; top: -250px; right: -150px; background: #A78BFA; animation: orb1 15s ease-in-out infinite alternate; }
        .bg-orb-2 { width: 500px; height: 500px; bottom: -200px; left: -150px; background: #C4B5FD; animation: orb2 18s ease-in-out infinite alternate; }
        .bg-orb-3 { width: 400px; height: 400px; top: 30%; left: 20%; background: #67E8F9; animation: orb3 12s ease-in-out infinite alternate; opacity: 0.06; }
        @keyframes orb1 { to { transform: translate(-10%,15%) scale(1.15); } }
        @keyframes orb2 { to { transform: translate(10%,-10%) scale(0.95); } }
        @keyframes orb3 { to { transform: translate(-12%,12%) scale(1.25); } }
        .app { width: 100%; max-width: 520px; display: flex; flex-direction: column; position: relative; z-index: 1; box-shadow: 0 25px 60px -20px rgba(15,23,42,0.15); border-radius: 32px; background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); margin: 20px; }
        .header { padding: 24px 28px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); backdrop-filter: blur(10px); background: rgba(252,248,255,0.90); position: sticky; top: 0; z-index: 10; border-radius: 32px 32px 0 0; }
        .subject-pill { background: var(--surface2); border: 1px solid var(--border); border-radius: 24px; padding: 6px 16px; font-size: 12px; font-weight: 700; color: var(--text2); transition: all 0.3s; letter-spacing: 0.05em; }
        .screen { display: none; flex: 1; flex-direction: column; animation: fadeUp 0.4s cubic-bezier(.4,0,.2,1); }
        .screen.active { display: flex; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        .home-inner { padding: 0 28px 40px; display: flex; flex-direction: column; flex: 1; }
        .hero { padding: 40px 0 32px; text-align: center; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(103,232,249,0.15)); border: 1.5px solid rgba(139,92,246,0.4); border-radius: 28px; padding: 8px 18px; font-size: 13px; font-weight: 700; color: #5B21B6; margin-bottom: 20px; }
        .hero h1 { font-family: var(--font-jakarta), var(--font-heebo), sans-serif; font-size: 36px; font-weight: 900; line-height: 1.2; margin-bottom: 16px; color: var(--ink); }
        .hero p { color: var(--text2); font-size: 15px; line-height: 1.8; max-width: 320px; margin: 0 auto; font-weight: 500; }
        .section-label { font-size: 12px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent); margin-bottom: 16px; margin-top: 8px; }
        .subject-tabs { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 20px; scrollbar-width: none; }
        .subject-tabs::-webkit-scrollbar { display: none; }
        .subject-tab { flex-shrink: 0; background: var(--surface); border: 1.5px solid var(--border); border-radius: 20px; padding: 10px 18px; font-family: var(--font-heebo), sans-serif; font-size: 14px; font-weight: 700; color: var(--text2); cursor: pointer; transition: all 0.25s; white-space: nowrap; }
        .subject-tab:hover { color: var(--text); border-color: var(--accent); transform: translateY(-2px); }
        .subject-tab.active { color: var(--accent); border-color: var(--accent); background: rgba(139,92,246,0.10); }
        .tab-math.active { border-color: #6D28D9; background: rgba(109,40,217,0.10); color: #6D28D9; }
        .topics-grid { display: grid; gap: 12px; margin-bottom: 24px; }
        .topic-card { background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 18px 16px 16px; cursor: pointer; transition: all 0.25s cubic-bezier(.4,0,.2,1); text-align: center; position: relative; overflow: hidden; }
        .topic-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0, rgba(139,92,246,0.08), transparent); pointer-events: none; }
        .topic-card:hover { transform: translateY(-4px); border-color: var(--accent); box-shadow: 0 12px 32px -10px rgba(15,23,42,0.12); }
        .topic-card.selected { background: linear-gradient(135deg, var(--surface2) 0%, var(--surface3) 100%); border-color: var(--accent); transform: translateY(-4px); box-shadow: 0 16px 40px -12px rgba(124,58,237,0.20); }
        .topic-check { position: absolute; top: 12px; left: 12px; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #fff; opacity: 0; transform: scale(0.3); transition: all 0.25s cubic-bezier(.34,1.56,.64,1); background: var(--accent); }
        .topic-card.selected .topic-check { opacity: 1; transform: scale(1); }
        .topic-emoji { display: flex; align-items: center; justify-content: center; margin-bottom: 10px; color: var(--accent); }
        .topic-emoji svg { width: 28px; height: 28px; }
        .topic-name { font-size: 14px; font-weight: 700; color: var(--text); line-height: 1.3; position: relative; z-index: 1; }
        .topic-sub { font-size: 12px; color: var(--text3); margin-top: 4px; position: relative; z-index: 1; }
        /* ===== Level picker (3 · בחר רמה) =====
           Built on .topic-card's visual language so the third zone reads as a
           sibling of the first two, not a new dialect. Three chips, always
           clickable: the owner's standing rule is that levels never lock. */
        .zone-hint { font-size: 13px; color: var(--text3); line-height: 1.6; margin-bottom: 14px; font-weight: 500; }
        .level-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px; }
        .level-card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 16px 10px 14px; background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%); border: 1.5px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; transition: all 0.25s cubic-bezier(.4,0,.2,1); font-family: var(--font-heebo), sans-serif; text-align: center; }
        .level-card:hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 10px 26px -12px rgba(15,23,42,0.14); }
        .level-card.selected { background: linear-gradient(135deg, var(--surface2) 0%, var(--surface3) 100%); border-color: var(--accent); box-shadow: 0 14px 34px -14px rgba(124,58,237,0.22); }
        .level-emoji { display: flex; align-items: center; justify-content: center; color: var(--accent); }
        .level-emoji svg { width: 22px; height: 22px; }
        .level-title { font-size: 13px; font-weight: 800; color: var(--text); }
        .level-blurb { font-size: 11px; color: var(--text3); line-height: 1.5; font-weight: 500; }
        .level-count { font-size: 10px; font-weight: 700; color: var(--accent); letter-spacing: 0.03em; margin-top: 2px; }
        .level-badge-rec { position: absolute; top: -8px; inset-inline-start: 50%; transform: translateX(50%); background: var(--accent); color: #fff; font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 10px; white-space: nowrap; letter-spacing: 0.04em; }
        .level-note { font-size: 12px; color: var(--text2); line-height: 1.7; background: rgba(180,83,9,0.06); border: 1px solid rgba(180,83,9,0.25); border-radius: var(--radius-sm); padding: 11px 13px; margin-bottom: 18px; font-weight: 500; }
        /* ===== Hint (asked for, before answering) =====
           Reuses .lesson-tip's amber so it reads as help, not as a verdict. */
        .hint-btn { align-self: flex-start; background: rgba(180,83,9,0.07); border: 1.5px solid rgba(180,83,9,0.30); border-radius: var(--radius-sm); padding: 9px 15px; font-family: var(--font-heebo), sans-serif; font-size: 13px; font-weight: 700; color: #92400E; cursor: pointer; transition: all 0.2s; }
        .hint-btn:hover { background: rgba(180,83,9,0.12); border-color: rgba(180,83,9,0.5); transform: translateY(-1px); }
        .hint-card { background: linear-gradient(135deg, rgba(180,83,9,0.05) 0%, var(--surface3) 100%); border: 1.5px solid var(--border); border-right: 4px solid #B45309; border-radius: var(--radius-sm); padding: 14px 16px; animation: fadeUp 0.3s ease; }
        .hint-text { font-size: 14px; line-height: 1.85; color: var(--text); font-weight: 500; unicode-bidi: plaintext; text-align: start; }
        .meta-level-badge { display: inline-flex; align-items: center; gap: 4px; padding: 5px 11px; border-radius: 20px; font-size: 12px; font-weight: 800; color: var(--accent); background: rgba(139,92,246,0.09); border: 1.5px solid rgba(139,92,246,0.28); white-space: nowrap; }
        .review-hint-flag { display: inline-block; margin-inline-start: 8px; font-size: 11px; font-weight: 700; color: #92400E; background: rgba(180,83,9,0.08); border-radius: 8px; padding: 2px 7px; }
        .start-btn { width: 100%; padding: 16px; border: 1px solid rgba(139,92,246,0.25); border-radius: var(--radius); font-family: var(--font-heebo), sans-serif; font-size: 16px; font-weight: 800; color: #fff; cursor: pointer; background: linear-gradient(135deg, #241E7A 0%, #1E1B4B 100%); box-shadow: 0 12px 30px -10px rgba(30,27,75,0.45); transition: all 0.25s cubic-bezier(.4,0,.2,1); margin-top: auto; letter-spacing: 0.05em; }
        .start-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 16px 38px -12px rgba(30,27,75,0.55); }
        .start-btn:active:not(:disabled) { transform: translateY(-1px); }
        .start-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .chat-link { display: block; text-align: center; margin-top: 12px; padding: 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border); background: var(--surface); color: var(--text2); font-family: var(--font-heebo), sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; transition: all 0.25s; }
        .chat-link:hover { color: var(--text); border-color: var(--accent2); background: var(--surface2); }
        .quiz-inner { padding: 20px 28px 32px; display: flex; flex-direction: column; flex: 1; gap: 16px; }
        .quiz-topbar { display: flex; align-items: center; gap: 14px; }
        .back-icon-btn { width: 40px; height: 40px; background: var(--surface); border: 1.5px solid var(--border); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer; transition: all 0.2s; flex-shrink: 0; font-family: 'Heebo', sans-serif; color: var(--text2); }
        .back-icon-btn:hover { border-color: var(--accent); color: var(--text); background: var(--surface2); }
        .progress-track { flex: 1; }
        .progress-bar { height: 6px; background: var(--surface2); border-radius: 4px; overflow: hidden; border: 1px solid var(--border); }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #0E7490, #7C3AED); border-radius: 3px; transition: width 0.5s cubic-bezier(.4,0,.2,1); }
        .progress-labels { display: flex; justify-content: space-between; margin-top: 8px; }
        .progress-step { font-size: 12px; color: var(--text3); font-weight: 600; }
        .progress-score { font-size: 12px; font-weight: 800; color: var(--correct); }
        .quiz-meta-strip { display: flex; align-items: center; gap: 10px; }
        .meta-subject-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 24px; font-size: 13px; font-weight: 700; border: 1.5px solid; white-space: nowrap; background: rgba(139,92,246,0.10); }
        .meta-topic-label { font-size: 13px; color: var(--text3); font-weight: 600; }
        .question-card { background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%); border: 1.5px solid var(--border); border-radius: 24px; padding: 28px; position: relative; overflow: hidden; }
        .question-card::after { content: ''; position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(ellipse, rgba(139,92,246,0.12), transparent 70%); pointer-events: none; }
        .q-number { font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }
        .q-text { font-size: 17px; line-height: 1.8; font-weight: 600; color: var(--text); position: relative; z-index: 1; unicode-bidi: plaintext; text-align: start; }
        .answers { display: flex; flex-direction: column; gap: 11px; }
        .answer-btn { background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 15px 18px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: all 0.2s ease; font-family: var(--font-heebo), sans-serif; color: var(--text); font-size: 15px; font-weight: 600; line-height: 1.5; text-align: right; }
        .answer-btn:hover:not(:disabled) { border-color: var(--accent); background: linear-gradient(135deg, var(--surface2) 0%, var(--surface3) 100%); transform: translateX(-3px); box-shadow: 0 4px 12px rgba(139,92,246,0.10); }
        .answer-btn:disabled { cursor: default; }
        .answer-btn.correct { border-color: var(--correct); background: rgba(16,185,129,0.1); color: var(--correct); }
        .answer-btn.wrong { border-color: var(--wrong); background: rgba(239,68,68,0.1); color: var(--wrong); }
        .answer-letter { min-width: 34px; height: 34px; background: var(--surface2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: var(--accent); flex-shrink: 0; transition: all 0.2s; border: 1.5px solid var(--border); }
        .answer-btn.correct .answer-letter { background: rgba(16,185,129,0.15); color: var(--correct); border-color: var(--correct); }
        .answer-btn.wrong .answer-letter { background: rgba(239,68,68,0.15); color: var(--wrong); border-color: var(--wrong); }
        .explanation-box { background: linear-gradient(135deg, var(--surface2) 0%, var(--surface3) 100%); border: 1.5px solid var(--border); border-left: 4px solid var(--accent); border-radius: var(--radius-sm); padding: 16px 18px; animation: fadeUp 0.35s ease; }
        .ex-label { font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
        .ex-text { font-size: 14px; line-height: 1.8; color: var(--text2); font-weight: 500; }
        /* ===== Verdict banner (correct/wrong header) ===== */
        .verdict-banner { padding: 14px 18px; border-radius: var(--radius-sm); font-size: 16px; font-weight: 800; text-align: center; letter-spacing: 0.02em; animation: fadeUp 0.35s ease; border: 1.5px solid; }
        .verdict-correct { background: rgba(5,150,105,0.10); border-color: rgba(5,150,105,0.4); color: #047857; }
        .verdict-wrong { background: rgba(220,38,38,0.08); border-color: rgba(220,38,38,0.4); color: #B91C1C; }
        /* ===== Lesson cards (rich explanation - 4 sections) ===== */
        .lesson-stack { display: flex; flex-direction: column; gap: 10px; animation: fadeUp 0.4s ease; }
        .lesson-card { background: linear-gradient(135deg, var(--surface2) 0%, var(--surface3) 100%); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 14px 16px; transition: transform 0.2s ease, border-color 0.2s ease; }
        .lesson-card:hover { transform: translateX(-2px); }
        .lesson-correct { border-right: 4px solid #059669; }
        .lesson-correct:hover { border-color: rgba(16,185,129,0.4); }
        .lesson-wrong { border-right: 4px solid #ef4444; }
        .lesson-wrong:hover { border-color: rgba(239,68,68,0.4); }
        .lesson-concept { border-right: 4px solid var(--accent); }
        .lesson-concept:hover { border-color: rgba(139,92,246,0.4); }
        .lesson-tip { border-right: 4px solid #B45309; background: linear-gradient(135deg, rgba(180,83,9,0.05) 0%, var(--surface3) 100%); }
        .lesson-tip:hover { border-color: rgba(245,158,11,0.4); }
        .lesson-label { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; color: var(--text2); margin-bottom: 8px; text-transform: uppercase; }
        .lesson-icon { font-size: 16px; line-height: 1; }
        /* unicode-bidi: plaintext + text-align: start handles mixed Hebrew + math
           cleanly. Without it, "P(רק בנים) = C(5,3)/C(8,3)" renders as garbled
           order because the browser flips LTR fragments inside an RTL block. */
        .lesson-text { font-size: 14px; line-height: 1.85; color: var(--text); font-weight: 500; unicode-bidi: plaintext; text-align: start; }
        .loading-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: 50px 40px; }
        .loader-ring { width: 64px; height: 64px; position: relative; }
        .loader-ring::before, .loader-ring::after { content: ''; position: absolute; inset: 0; border-radius: 50%; border: 3px solid transparent; }
        .loader-ring::before { border-top-color: var(--accent); animation: spin 0.9s linear infinite; }
        .loader-ring::after { border-bottom-color: var(--accent2); animation: spin 1.3s linear infinite reverse; inset: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-tip { text-align: center; font-size: 15px; color: var(--text2); line-height: 1.8; max-width: 280px; font-weight: 500; }
        .loading-tip strong { color: var(--text); display: block; margin-bottom: 6px; font-size: 16px; font-weight: 800; }
        .results-inner { padding: 32px 28px 40px; display: flex; flex-direction: column; align-items: center; gap: 28px; flex: 1; }
        .result-hero { text-align: center; }
        .result-emoji { font-size: 60px; line-height: 1; margin-bottom: 16px; display: block; animation: bounce 0.8s ease; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .result-title { font-family: var(--font-jakarta), var(--font-heebo), sans-serif; font-size: 32px; font-weight: 900; margin-bottom: 8px; color: var(--ink); }
        .result-sub { font-size: 15px; color: var(--text2); line-height: 1.7; font-weight: 500; }
        .stats-row { display: flex; gap: 12px; width: 100%; }
        .stat-box { flex: 1; background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 18px; text-align: center; }
        .stat-val { font-size: 26px; font-weight: 900; margin-bottom: 4px; }
        .stat-lbl { font-size: 12px; color: var(--text3); font-weight: 700; letter-spacing: 0.05em; }
        .stat-correct .stat-val { color: var(--correct); }
        .stat-wrong .stat-val { color: var(--wrong); }
        .breakdown-box { width: 100%; background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
        .breakdown-title { font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); margin-bottom: 2px; }
        .breakdown-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .breakdown-topic { font-size: 14px; font-weight: 600; color: var(--text); }
        .breakdown-score { font-size: 14px; font-weight: 800; }
        /* ===== Wrong-answer review rows =====
           These four rows used to be inline-styled with no class at all, which
           is why their KaTeX rendered right-to-left: every LTR rule in
           globals.css is scoped behind :is(.chat-md, .math-content). They now
           carry math-content in the JSX, and each text row repeats the same
           bidi pair that .q-text and .lesson-text already use, so a Hebrew
           label followed by a formula ("הנכונה: $3e^{3x}$") resolves per-row
           instead of being swept into one LTR run.
           NOTE: styled per-ROW on purpose — .breakdown-box is shared with the
           per-topic breakdown (pure Hebrew, already correct), so the container
           is deliberately left alone. */
        .review-item { padding: 12px 0; border-top: 1px solid var(--border); font-size: 14px; }
        .review-item.review-first { border-top: none; }
        .review-q { font-weight: 600; margin-bottom: 6px; unicode-bidi: plaintext; text-align: start; }
        .review-chosen { color: var(--wrong); margin-bottom: 2px; unicode-bidi: plaintext; text-align: start; }
        .review-correct { color: var(--correct); margin-bottom: 6px; unicode-bidi: plaintext; text-align: start; }
        .review-why { color: var(--text2); font-size: 13px; unicode-bidi: plaintext; text-align: start; }
        .bd-good { color: var(--correct); }
        .bd-mid { color: #B45309; }
        .bd-weak { color: var(--wrong); }
        .action-row { display: flex; flex-direction: column; gap: 12px; width: 100%; }
        .btn-outline { background: transparent; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 15px; font-family: var(--font-heebo), sans-serif; font-size: 15px; font-weight: 700; color: var(--text2); cursor: pointer; transition: all 0.25s; letter-spacing: 0.05em; }
        .btn-outline:hover { color: var(--text); background: var(--surface); border-color: var(--accent); }
      `}</style>

      <div className="quiz-root">
        <div className="bg-layer">
          <div className="bg-orb bg-orb-1"></div>
          <div className="bg-orb bg-orb-2"></div>
          <div className="bg-orb bg-orb-3"></div>
        </div>

        <div className="app">
          {/* The in-card bar used to carry a second "MathUp ✦" wordmark. The
              app now has one persistent header; a page that draws its own logo
              underneath it is the clearest possible signal of a screen built
              in isolation. Only the sign-out control was doing real work. */}
          <div className="header">
            <span className="section-label" style={{ margin: 0 }}>בוחן מהיר</span>
            <form action="/auth/signout" method="post" style={{ margin: 0 }}>
              <button
                type="submit"
                className="subject-pill"
                style={{ cursor: 'pointer', background: 'transparent', fontFamily: 'inherit' }}
                title="התנתק"
              >
                ← התנתק
              </button>
            </form>
          </div>

          {/* One screen at a time. All three used to sit in the DOM together,
              hidden with display:none — so the home screen shipped the entire
              quiz and results markup, and every question the student had not
              reached yet was already in the page. */}
          <div className="screen active">
            {screen === 'home' && renderHome()}
            {screen === 'quiz' && renderQuiz()}
            {screen === 'results' && renderResults()}
          </div>
        </div>
      </div>
    </>
  );
}
