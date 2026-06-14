'use client';

import { useState } from 'react';
import { Sparkles, AlertCircle, RotateCw, MessageCircle, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { MathText } from './MathText';

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
};

type ActionKey = 'explainSimpler' | 'whyWrong' | 'similarQuestion' | 'hintHelp';
type ActionState = {
  loading: boolean;
  response: string | null;       // For text-only endpoints
  error: string | null;
  expanded: boolean;
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

  async function run(key: ActionKey) {
    setState(key, { loading: true, error: null, response: null, expanded: true });
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
      tone: 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/40 text-indigo-100',
    },
    {
      key: 'whyWrong',
      show: props.show.whyWrong,
      label: 'למה טעיתי?',
      icon: <AlertCircle className="w-4 h-4" />,
      tone: 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/40 text-indigo-100',
    },
    {
      key: 'hintHelp',
      show: props.show.hintHelp,
      label: 'עזרה שלב-שלב',
      icon: <MessageCircle className="w-4 h-4" />,
      tone: 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-100',
    },
    {
      key: 'similarQuestion',
      show: props.show.similarQuestion,
      label: 'שאלה דומה',
      icon: <RotateCw className="w-4 h-4" />,
      tone: 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-100',
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
            className={`bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2.5 chat-md text-sm text-slate-100`}
          >
            <div className="text-[10px] font-black tracking-widest text-indigo-300 uppercase mb-1.5 flex items-center gap-1.5">
              {b.icon}
              <span>{b.label}</span>
            </div>
            {s.error ? (
              <div className="text-indigo-200">{s.error}</div>
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
