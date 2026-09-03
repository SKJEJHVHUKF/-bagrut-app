'use client';

/**
 * FocusDialog — point students at content that already exists.
 *
 * Four closed lists and a date. No free-text task, no question editor: the
 * teacher never authors content, which is the whole product decision. The one
 * text field is an optional one-line note.
 */

import { useEffect, useState } from 'react';
import { Target } from 'lucide-react';
import type { StudentRow } from '@/lib/class-board';
import { RUNG_LABEL } from '@/lib/rungs';
import type { CatalogueTopic } from '@/lib/focus-target';
import { Btn, inputCls } from '@/components/console/Panel';

export default function FocusDialog({
  classId,
  students,
  preselect,
  onClose,
  onSaved,
}: {
  classId: string;
  students: StudentRow[];
  preselect: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [catalogue, setCatalogue] = useState<CatalogueTopic[] | null>(null);
  const [topic, setTopic] = useState('');
  const [subTopicId, setSubTopicId] = useState('');
  const [rung, setRung] = useState('');
  const [targetCount, setTargetCount] = useState(5);
  const [dueOn, setDueOn] = useState('');
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState<string[]>(preselect ? [preselect] : []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    void fetch('/api/school/focus')
      .then((r) => r.json())
      .then((d) => setCatalogue(d.catalogue ?? []))
      .catch(() => setCatalogue([]));
  }, []);

  const entry = catalogue?.find((c) => c.topic === topic);
  const sub = entry?.subTopics.find((s) => s.id === subTopicId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/school/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          topic,
          subTopicId: subTopicId || undefined,
          rung: rung || undefined,
          targetCount,
          dueOn: dueOn || undefined,
          note: note.trim() || undefined,
          studentIds: picked,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? 'לא הצלחנו לשמור');
        return;
      }
      onSaved();
    } catch {
      setMessage('לא הצלחנו לשמור. נסה שוב.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      // Above the app header (z-[90]) and the mobile tab bar (z-[55]).
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
    >
      <form
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label="מיקוד תלמידים"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-2xl dark:bg-slate-900"
      >
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-50">
          <Target className="h-5 w-5 text-slate-500" aria-hidden />
          שליחת תרגול
        </h2>
        <p className="mt-1 mb-4 text-sm text-slate-500 dark:text-slate-400">
          בחר נושא, כמה תרגילים, ולמי. התלמידים יראו את זה כשלב מסומן במסלול שלהם — בלי שתכתוב שאלה אחת.
        </p>

        <Field label="נושא">
          <select
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setSubTopicId('');
              setRung('');
            }}
            className={inputCls}
            required
          >
            <option value="">בחר נושא…</option>
            {(catalogue ?? []).map((c) => (
              <option key={c.topic} value={c.topic}>
                {c.topic}
              </option>
            ))}
          </select>
        </Field>

        <Field label="כמה תרגילים">
          <input
            type="number"
            min={1}
            max={100}
            value={targetCount}
            onChange={(e) => setTargetCount(Number(e.target.value))}
            className={inputCls}
          />
        </Field>

        {/* Topic, how many, who — that is the whole task for most teachers.
            The precise controls exist, folded, for the teacher who wants
            "ביסוס בסדרה חשבונית עד יום ה׳" rather than "סדרות". */}
        <button
          type="button"
          onClick={() => setMore((v) => !v)}
          aria-expanded={more}
          className="mt-3 text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900 dark:text-slate-400"
        >
          {more ? 'פחות אפשרויות' : 'אפשרויות נוספות — תת-נושא, רמה, תאריך, הערה'}
        </button>

        {more && (
          <>
        {entry && entry.subTopics.length > 0 && (
          <Field label="תת-נושא (אופציונלי)">
            <select
              value={subTopicId}
              onChange={(e) => {
                setSubTopicId(e.target.value);
                setRung('');
              }}
              className={inputCls}
            >
              <option value="">כל הנושא</option>
              {entry.subTopics.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </Field>
        )}

        {sub && (
          <Field label="שלב (אופציונלי)">
            <select value={rung} onChange={(e) => setRung(e.target.value)} className={inputCls}>
              <option value="">כל הסולם</option>
              {/* Only the rungs this sub-topic really has content for. */}
              {sub.rungs.map((r) => (
                <option key={r} value={r}>
                  {RUNG_LABEL[r]}
                </option>
              ))}
            </select>
          </Field>
        )}

            <Field label="עד מתי (אופציונלי)">
              <input
                type="date"
                value={dueOn}
                onChange={(e) => setDueOn(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="הערה (אופציונלי)">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                placeholder="שורה אחת לתלמיד"
                className={inputCls}
              />
            </Field>
          </>
        )}

        <fieldset className="mt-4">
          <legend className="text-sm text-slate-600 dark:text-slate-400">
            למי — בלי בחירה, זה הולך לכל הכיתה
          </legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {students.map((s) => {
              const on = picked.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setPicked((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))
                  }
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    on
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </fieldset>

        {message && (
          <p role="status" className="mt-3 text-sm text-rose-600 dark:text-rose-400">
            {message}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <Btn kind="primary" type="submit" disabled={busy || !topic} className="flex-1 justify-center">
            {busy ? 'שולח…' : picked.length ? `שלח ל-${picked.length} תלמידים` : 'שלח לכל הכיתה'}
          </Btn>
          <Btn type="button" onClick={onClose}>
            ביטול
          </Btn>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 block">
      <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}
