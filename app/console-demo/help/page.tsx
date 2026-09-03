'use client';

import HelpContent from '@/components/console/HelpContent';

/** /console-demo/help — the same help page, reachable without an account. A
 *  teacher evaluating the console should be able to read what the words mean
 *  before deciding to sign up. A client page, like the demo's other sections. */
export default function DemoHelpPage() {
  return <HelpContent />;
}
