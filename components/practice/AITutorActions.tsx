'use client';

import { useRef, useState } from 'react';
import { Sparkles, AlertCircle, RotateCw, MessageCircle, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { MathText } from './MathText';
import { answerLocally, type LocalAnswerKind } from '@/lib/tutor-local';
import { getTutorFocus, type TutorFocus } from '@/lib/tutor-presence';
import { buildHelpLadder } from '@/lib/help-ladder';
import { getSubTopics } from '@/content/lessons';

// ============================================================
// AITutorActions — the 4 AI tutor buttons + their response panels.
// ============================================================
//
// Used inline within QuestionPartCard and QuickExerciseView. The
// parent passes context (question, answers, hints) and the `show`
// prop says which buttons to render based on UI state.
//
// Each button:
//  - Has its own loading / response / error state.
//  - Click → fetch a specific tutor endpoint.
//  - Response appears in a collapsible panel below the button row.
//
// All 4 endpoints require Pro. The 402 response from any of them
// is shown as a "שדרג ל-Pro" CTA — the panel doesn't need to know
// the user's Pro status in advance.
//
// ===== AUTHORED CONTENT FIRST, THE MODEL SECOND =====
// Every button used to go straight to its endpoint. But the bubble beside the
// same question already answers "רמז", "למה טעיתי", "תסביר" from the authored
// hint, rule line, distractor notes and answer diagnosis (lib/tutor-local) at
// $0 — and a model paid to paraphrase that material can only drift from it.
// So each button now asks the local tutor first and pays only when it
// abstains. The acceptance rules are deliberately ACCURACY-first, not
// cost-first: a local answer is used only when it is the specific one —
//   hintHelp         an unserved real rung exists (hint / rule line / key
//                    points); a ladder that is exhausted goes to the model
//   whyWrong         a distractor note or an answer diagnosis exists; "I won't
//                    guess" is not an answer worth replacing a model with
//   explainSimpler   the specific wording rendered, not the template fallback
//   similarQuestion  an authored sibling exists in the same topic's banks
// The panel says "מהחומר הכתוב" when that is where the answer came from.

export type SimilarQuestionResult = {
  question: string;
  hint: string;
  solution: { steps: string[]; final_answer: string };
};

type AITutorActionsProps = {
  // Context for the buttons — pass what's available; each button
  // checks its own required fields.
  question: string;
  correctAnswer?: string;
  userAnswer?: string;
  solution?: string;
  hints?: string[];
  topic?: string;
  difficulty?: 'easy' | 'mid' | 'hard';
  context?: string;

  /**
   * The authored material behind this question, as the tutor bubble sees it.
   * When present, every button asks lib/tutor-local FIRST and only pays for a
   * model call when the local tutor abstains. When omitted, the focus the
   * screen PUBLISHED for the bubble is used — but only if it describes this
   * exact question (see `resolveFocus`); a stale or unrelated focus is worse
   * than paying.
   */
  localFocus?: TutorFocus | null;
  /** For "שאלה דומה": whose authored banks to draw a sibling from. */
  subject?: string;

  // Which buttons to show.
  show: {
    explainSimpler?: boolean;
    whyWrong?: boolean;
    similarQuestion?: boolean;
    hintHelp?: boolean;
  };

  // Optional callback when "similar question" returns a result.
  // The parent can wire this to replace its current question state.
  onSimilarQuestion?: (q: SimilarQuestionResult) => void;

  // Optional callback when "why wrong?" returns an error category — the
  // parent uses it to tag the mistake in the error notebook.
  onCategory?: (category: string) => void;
};

type ActionKey = 'explainSimpler' | 'whyWrong' | 'similarQuestion' | 'hintHelp';
type ActionState = {
  loading: boolean;
  response: string | null;       // For text-only endpoints
  error: string | null;
  expanded: boolean;
  /** The response came from authored content, not from a model call. */
  local?: boolean;
};

const INITIAL_STATE: ActionState = {
  loading: false,
  response: null,
  error: null,
  expanded: false,
};

export function AITutorActions(props: AITutorActionsProps) {
  const [states, setStates] = useState<Record<ActionKey, ActionState>>({
    explainSimpler: INITIAL_STATE,
    whyWrong: INITIAL_STATE,
    similarQuestion: INITIAL_STATE,
    hintHelp: INITIAL_STATE,
  });

  const setState = (key: ActionKey, patch: Partial<ActionState>) =>
    setStates((s) => ({ ...s, [key]: { ...s[key], ...patch } }));

  /** Rungs already handed out for THIS question, so a second press walks the
   *  help ladder instead of repeating the same hint. Reset per question. */
  const servedRef = useRef<{ key: string; kinds: LocalAnswerKind[] }>({ key: '', kinds: [] });

  async function run(key: ActionKey) {
    setState(key, { loading: true, error: null, response: null, expanded: true, local: false });

    // ===== authored content first — no API call, no quota, no Pro gate =====
    const focus = resolveFocus(props);
    const qKey = focus?.question?.id ?? props.question;
    if (servedRef.current.key !== qKey) servedRef.current = { key: qKey, kinds: [] };

    if (key === 'similarQuestion') {
      const sibling = findSibling(props.subject ?? 'math5', props.topic, props.difficulty, focus?.question?.id);
      if (sibling) {
        setState(key, {
          loading: false,
          local: true,
          response: `**שאלה חדשה:** ${sibling.question}\n\n**רמז:** ${sibling.hint}`,
        });
        props.onSimilarQuestion?.(sibling);
        return;
      }
    } else if (focus) {
      const local = answerLocally(LOCAL_ASK[key], focus, servedRef.current.kinds);
      if (local && acceptLocal(key, local, focus, servedRef.current.kinds)) {
        if (!servedRef.current.kinds.includes(local.kind)) servedRef.current.kinds.push(local.kind);
        setState(key, { loading: false, local: true, response: local.text });
        return;
      }
    }

    try {
      const { url, body, parse } = buildRequest(key, props);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 402) {
          setState(key, {
            loading: false,
            error: 'פיצ׳ר זה זמין למשתמשי Pro. שדרג כדי לקבל מורה פרטי.',
          });
        } else {
          setState(key, {
            loading: false,
            error: data?.error ?? `שגיאה (${res.status})`,
          });
        }
        return;
      }
      const text = parse(data);
      setState(key, { loading: false, response: text });
      // Special: similar-question also notifies parent so it can
      // swap the visible exercise.
      if (key === 'similarQuestion' && data && props.onSimilarQuestion) {
        props.onSimilarQuestion(data as SimilarQuestionResult);
      }
      // Special: why-wrong returns an error category → tag the mistake.
      if (
        key === 'whyWrong' &&
        data &&
        typeof (data as { category?: unknown }).category === 'string' &&
        props.onCategory
      ) {
        props.onCategory((data as { category: string }).category);
      }
    } catch (e) {
      setState(key, {
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const buttons: { key: ActionKey; show?: boolean; label: string; icon: React.ReactNode; tone: string }[] = [
    {
      key: 'explainSimpler',
      show: props.show.explainSimpler,
      label: 'הסבר פשוט יותר',
      icon: <Sparkles className="w-4 h-4" />,
      tone: 'bg-violet-500/15 hover:bg-violet-500/25 border-violet-500/40 text-violet-800',
    },
    {
      key: 'whyWrong',
      show: props.show.whyWrong,
      label: 'למה טעיתי?',
      icon: <AlertCircle className="w-4 h-4" />,
      tone: 'bg-violet-500/15 hover:bg-violet-500/25 border-violet-500/40 text-violet-800',
    },
    {
      key: 'hintHelp',
      show: props.show.hintHelp,
      label: 'עזרה שלב-שלב',
      icon: <MessageCircle className="w-4 h-4" />,
      tone: 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-800',
    },
    {
      key: 'similarQuestion',
      show: props.show.similarQuestion,
      label: 'שאלה דומה',
      icon: <RotateCw className="w-4 h-4" />,
      tone: 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-800',
    },
  ];

  const visible = buttons.filter((b) => b.show);
  if (visible.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {visible.map((b) => {
          const s = states[b.key];
          return (
            <button
              key={b.key}
              onClick={() => (s.response ? setState(b.key, { expanded: !s.expanded }) : run(b.key))}
              disabled={s.loading}
              className={`inline-flex items-center gap-1.5 ${b.tone} disabled:opacity-50 border px-3 py-2 rounded-xl text-xs font-bold transition-all`}
            >
              {s.loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                b.icon
              )}
              <span>{b.label}</span>
              <span className="text-[9px] opacity-70 mr-1">Pro</span>
              {s.response && (
                <span className="ms-1">
                  {s.expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Response panels — one per visible button that has been triggered */}
      {visible.map((b) => {
        const s = states[b.key];
        if (!s.expanded) return null;
        if (!s.response && !s.error) return null;
        return (
          <div
            key={`${b.key}-panel`}
            className={`bg-slate-900/[0.03] border border-slate-900/[0.12] rounded-xl px-3 py-2.5 chat-md text-sm text-slate-800`}
          >
            <div className="text-[10px] font-black tracking-widest text-violet-700 uppercase mb-1.5 flex items-center gap-1.5">
              {b.icon}
              <span>{b.label}</span>
              {s.local && (
                <span className="ms-auto text-[9px] font-bold text-emerald-700 normal-case tracking-normal">
                  מהחומר הכתוב · חינם
                </span>
              )}
            </div>
            {s.error ? (
              <div className="text-violet-800">{s.error}</div>
            ) : s.response ? (
              <div className="leading-relaxed">
                <MathText>{s.response}</MathText>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Per-endpoint request builder + response parser.
// ============================================================

function buildRequest(
  key: ActionKey,
  p: AITutorActionsProps
): { url: string; body: object; parse: (data: unknown) => string } {
  switch (key) {
    case 'explainSimpler':
      return {
        url: '/api/explain-simpler',
        body: { question: p.question, solution: p.solution ?? '', topic: p.topic ?? '' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parse: (d: any) => d?.explanation ?? '',
      };
    case 'whyWrong':
      return {
        url: '/api/why-wrong',
        body: {
          question: p.question,
          correctAnswer: p.correctAnswer ?? '',
          userAnswer: p.userAnswer ?? '',
          // The authored steps, so the diagnosis is a comparison against the
          // verified path rather than a re-solve. Only reached when the local
          // tutor had no diagnosis of its own.
          solution: p.solution ?? '',
          context: p.context,
          topic: p.topic ?? '',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parse: (d: any) =>
          d?.mistake && d?.correctApproach
            ? `**הטעות:** ${d.mistake}\n\n**הצעד הנכון:** ${d.correctApproach}`
            : d?.mistake ?? '',
      };
    case 'hintHelp':
      return {
        url: '/api/hint-help',
        body: { question: p.question, hints: p.hints ?? [], topic: p.topic ?? '' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parse: (d: any) => d?.response ?? '',
      };
    case 'similarQuestion':
      return {
        url: '/api/similar-question',
        body: {
          originalQuestion: p.question,
          topic: p.topic ?? '',
          difficulty: p.difficulty ?? 'mid',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parse: (d: any) =>
          d?.question
            ? `**שאלה חדשה:** ${d.question}\n\n**רמז:** ${d.hint ?? ''}`
            : '',
      };
  }
}

// ============================================================
// Local-first: what each button asks the authored tutor, and when the
// answer is specific enough to stand in for a model call.
// ============================================================

/** The app's own chip wording — each one is asserted to classify in
 *  scripts/test-tutor-voice.ts, so none can silently stop matching. */
const LOCAL_ASK: Record<Exclude<ActionKey, 'similarQuestion'>, string> = {
  hintHelp: 'אני תקוע בשאלה הזאת',
  whyWrong: 'למה התשובה שלי שגויה?',
  explainSimpler: 'תסביר לי את השאלה הזאת מההתחלה',
};

function resolveFocus(p: AITutorActionsProps): TutorFocus | null {
  if (p.localFocus !== undefined) return p.localFocus;
  // A screen that did not hand us its focus may still have PUBLISHED it for
  // the bubble (QuestionRunnerCard does, on every render). Use it only when
  // it describes this exact question — checked by text, since that is the one
  // identity both sides are guaranteed to share.
  const f = getTutorFocus();
  return f?.question && f.questionText === p.question ? f : null;
}

function acceptLocal(
  key: Exclude<ActionKey, 'similarQuestion'>,
  local: { kind: LocalAnswerKind; fallback?: boolean },
  focus: TutorFocus,
  served: LocalAnswerKind[],
): boolean {
  switch (key) {
    case 'hintHelp': {
      // Only while a real rung is left. Once hint, rule line and key points
      // are spent, the local tutor's next line is "tell me your last step" —
      // honest, but the model's unpacking of the last hint helps more there.
      if (!focus.question) return false;
      const ladder = buildHelpLadder(focus.question, focus.subTopic ?? null);
      return ladder.tiers.some((t) => t.kind !== 'full' && t.body.length > 0 && !served.includes(t.kind));
    }
    case 'whyWrong': {
      const note =
        typeof focus.chosenIndex === 'number'
          ? focus.question?.distractorNotes?.[focus.chosenIndex]?.trim()
          : '';
      return !!note || !!focus.answerDiagnosis;
    }
    case 'explainSimpler':
      return !local.fallback;
  }
}

/**
 * "שאלה דומה" from the authored banks: another open question on the same
 * topic, same difficulty when one exists. Verified content, $0 — against a
 * Sonnet call that invents one. Null when the topic has no authored bank, in
 * which case the endpoint still runs as before.
 */
function findSibling(
  subject: string,
  topic: string | undefined,
  difficulty: 'easy' | 'mid' | 'hard' | undefined,
  excludeId?: string,
): SimilarQuestionResult | null {
  if (!topic) return null;
  const pool = getSubTopics(subject, topic)
    .flatMap((st) => st.questions ?? [])
    .filter((q) => q.kind === 'open' && q.id !== excludeId);
  if (pool.length === 0) return null;
  const same = difficulty ? pool.filter((q) => q.difficulty === difficulty) : [];
  const from = same.length > 0 ? same : pool;
  const pick = from[Math.floor(Math.random() * from.length)];
  return {
    question: pick.question,
    hint: pick.hint ?? '',
    solution: { steps: pick.solution.steps, final_answer: pick.solution.finalAnswer },
  };
}
