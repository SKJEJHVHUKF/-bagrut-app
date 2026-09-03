'use client';

/**
 * Root error boundary — catches a crash in app/layout.tsx itself.
 *
 * Replaces the root layout, so it must render its own <html>/<body> and can
 * rely on nothing from globals.css or the font loaders: styles are inline.
 * Reports the crash the same way app/error.tsx does.
 */

import { useEffect } from 'react';
import { reportClientError } from '@/lib/report-client-error';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FDFDFB',
          color: '#0F172A',
          fontFamily: 'Heebo, "Segoe UI", Arial, sans-serif',
          padding: '0 16px',
          textAlign: 'center',
        }}
      >
        <main style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px' }}>MathUp נתקל בתקלה</h1>
          <p style={{ color: '#475569', lineHeight: 1.6, margin: '0 0 24px' }}>
            התקדמות הלמידה שלך שמורה. טען מחדש כדי להמשיך.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: '#4F46E5',
              color: '#fff',
              border: 0,
              borderRadius: 12,
              padding: '12px 22px',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            טען מחדש
          </button>
        </main>
      </body>
    </html>
  );
}
