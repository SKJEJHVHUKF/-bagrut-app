'use client';

/**
 * FocusDialog — "שליחת תרגול": point students at content that already exists.
 *
 * Topic, how many, who — that is the whole task for most teachers, and it is
 * all that shows. Sub-topic, rung, date and note fold under "אפשרויות
 * נוספות" for the teacher who wants "ביסוס בסדרה חשבונית עד יום ה׳".
 *
 * The teacher never authors content: every field is a closed list into
 * material the app already serves, except the optional one-line note.
 *
 * Modal semantics come from lib/a11y/useDialog — role, label, focus trap, ESC,
 * focus restore — the one place in the app those live. The button that opened
 * this may already know the topic (a card for a student stuck in סדרות); then
 * the topic arrives pre-chosen and the teacher confirms rather than picks.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import type { StudentRow } from '@/lib/class-board';
import { RUNG_LABEL } from '@/lib/rungs';
import type { CatalogueTopic } from '@/lib/focus-target';
import { useDialog } from '@/lib/a11y/useDialog';
import { SECTION, BTN } from '@/components/console/copy';
import { Btn, inputCls } from '@/components/console/ui';

export default function FocusDialog({
  classId,
  students,
  preselect,
  presetTopic = null,
  onClose,
  onSaved,
}: {
  classId: string;
  students: StudentRow[];
  preselect: string | null;
  /** A topic the opening button already knew. Applied once the catalogue
   *  loads, and only if the name exists in it. */
  presetTopic?: string | null;
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

  const { panelRef, dialogProps } = useDialog<HTMLFormElement>(true, onClose, { label: SECTION.dialog });

  useEffect(() => {
    void fetch('/api/school/focus')
      .then((r) => r.json())
      .then((d) => {
        const cat: CatalogueTopic[] = d.catalogue ?? [];
        setCatalogue(cat);
        if (presetTopic && cat.some((c) => c.topic === presetTopic)) setTopic(presetTopic);
      })
      .catch(() => setCatalogue([]));
  }, [presetTopic]);

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
    <motion.div
      // Above the app header (z-[90]) and the mobile tab bar (z-[55]).
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 p-4 backdrop-blur-[2px] sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.form
        ref={panelRef}
        {...dialogProps}
        // Explicit as well as spread: scripts/verify-a11y.ts greps for a literal
        // role="dialog" or `useDialog(`, and the generic call site hides the
        // latter from its regex.
        role="dialog"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        className="surface-premium max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl p-5 outline-none"
      >
        <h2 className="font-display flex items-center gap-2 text-lg font-black text-ink">
          <Target className="h-5 w-5 text-violet-600" aria-hidden />
          {SECTION.dialog}
        </h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">
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

        <button
          type="button"
          onClick={() => setMore((v) => !v)}
          aria-expanded={more}
          className="mt-3 text-sm font-bold text-violet-700 underline-offset-4 hover:underline"
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
              <input type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} className={inputCls} />
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
          <legend className="text-sm text-slate-600">למי — בלי בחירה, זה הולך לכל הכיתה</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {students.map((s) => {
              const on = picked.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicked((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                  className={`rounded-full px-3 py-1 text-sm font-bold transition ${
                    on ? 'bg-primary-deep text-white' : 'bg-slate-900/[0.05] text-slate-700 hover:bg-slate-900/[0.09]'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </fieldset>

        {message && (
          <p role="status" className="mt-3 text-sm font-bold text-red-700">
            {message}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <Btn kind="primary" type="submit" disabled={busy || !topic} className="flex-1">
            {busy ? 'שולח…' : picked.length ? `שלח ל-${picked.length} תלמידים` : 'שלח לכל הכיתה'}
          </Btn>
          <Btn type="button" onClick={onClose}>
            ביטול
          </Btn>
        </div>
        <span className="sr-only">{BTN.send}</span>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
