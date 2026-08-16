'use client';

// The app's single pair of live regions, mounted once in the root layout.
// Everything reaches it through announce() in lib/a11y/announce.ts.

import { useEffect, useState } from 'react';
import { A11Y_ANNOUNCE_EVENT, type Announcement } from '@/lib/a11y/announce';

export default function LiveRegion() {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');

  useEffect(() => {
    let timer = 0;
    const onAnnounce = (e: Event) => {
      const { message, urgency = 'polite' } = (e as CustomEvent<Announcement>).detail;
      const set = urgency === 'assertive' ? setAssertive : setPolite;
      // Clear first. Assistive tech diffs the node's text, so answering two
      // questions correctly in a row would otherwise announce "תשובה נכונה"
      // once and then stay silent — the string never changed.
      set('');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => set(message), 60);
    };
    window.addEventListener(A11Y_ANNOUNCE_EVENT, onAnnounce);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(A11Y_ANNOUNCE_EVENT, onAnnounce);
    };
  }, []);

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {polite}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertive}
      </div>
    </>
  );
}
