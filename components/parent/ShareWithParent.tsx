'use client';

/**
 * ShareWithParent — get the weekly parent link and send it over WhatsApp.
 *
 * With `classId` + `studentId` it asks for that student's link (the teacher
 * path); with neither, for the signed-in user's own.
 *
 * ⚠️ The WhatsApp control is a real <a href="https://wa.me/?text=…"> rendered
 * AFTER the POST resolves, never window.open() after an await: popup blockers
 * drop a window opened outside the click's own tick, so the button would
 * silently do nothing on exactly the phones parents are reached on.
 */

import { useState } from 'react';
import { Copy, Link2, MessageCircle } from 'lucide-react';
import { Btn, btnPrimary } from '@/components/console/ui';

export function ShareWithParent({
  classId,
  studentId,
  name,
  disabled,
}: {
  classId?: string;
  studentId?: string;
  name?: string;
  disabled?: boolean;
}) {
  const teacher = classId !== undefined || studentId !== undefined;
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function request(method: 'POST' | 'DELETE') {
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch('/api/parent-link', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacher ? { classId, studentId } : {}),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: unknown };
      if (res.ok && typeof json.url === 'string') setUrl(json.url);
      else if (res.status === 403 && !teacher) setError('כדי ליצור קישור צריך להתחבר לחשבון');
      else setError('לא הצלחנו ליצור קישור. אפשר לנסות שוב.');
    } catch {
      setError('לא הצלחנו ליצור קישור. אפשר לנסות שוב.');
    } finally {
      setBusy(false);
    }
  }

  async function copy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setError('ההעתקה לא הצליחה. אפשר לסמן את הקישור ולהעתיק ידנית.');
    }
  }

  const errorLine = error && (
    <p role="alert" className="text-sm font-bold text-red-700">
      {error}
    </p>
  );

  if (!url) {
    return (
      <div className="flex flex-col gap-1">
        <Btn kind="secondary" onClick={() => request('POST')} disabled={disabled || busy}>
          <Link2 className="h-4 w-4" aria-hidden />
          קישור לדוח השבועי להורים
        </Btn>
        {errorLine}
      </div>
    );
  }

  const message = teacher
    ? `הדוח השבועי של ${name ?? 'התלמיד'} ב-MathUp: ${url}`
    : `הדוח השבועי שלי ב-MathUp: ${url}`;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btnPrimary}
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          שליחה בוואטסאפ
        </a>
        <Btn kind="secondary" onClick={() => copy(url)} disabled={busy}>
          <Copy className="h-4 w-4" aria-hidden />
          {copied ? 'הקישור הועתק' : 'העתקת הקישור'}
        </Btn>
      </div>
      <p dir="ltr" className="select-all break-all text-right text-xs text-slate-600">
        {url}
      </p>
      <button
        type="button"
        onClick={() => request('DELETE')}
        disabled={busy}
        className="self-start text-sm font-bold text-slate-600 underline underline-offset-2 hover:text-violet-700 disabled:opacity-40"
      >
        יצירת קישור חדש (הקודם יפסיק לעבוד)
      </button>
      {errorLine}
    </div>
  );
}
