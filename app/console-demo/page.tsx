'use client';

/**
 * /console-demo — the board, with a sample class, and no account needed.
 *
 * Two jobs, and the second is the one that matters commercially:
 *
 *   1. It is how the board gets LOOKED AT while it is being built. The real
 *      route needs a session, a class and thirty students who have practised;
 *      a screen nobody can open is a screen nobody reviews.
 *   2. It is what you send a teacher. "Open this link" is a very different ask
 *      from "sign up, open a class, recruit your students, then judge whether
 *      this was worth it" — and the second one is why school software never
 *      gets past the first conversation.
 *
 * It renders the SAME component as the real class board, fed by lib/demo-board.
 * There is no second copy of the markup and no mock of the output: every number
 * is computed by the buildClassBoard that runs in production, so this page
 * cannot show something the product does not do.
 */

import ClassBoardView, { type Payload } from '@/components/school/ClassBoardView';
import ConsoleShell from '@/components/school/ConsoleShell';

export default function ConsoleDemoPage() {
  // studentCount 0 is what puts the view into its sample mode — the same branch
  // a real, newly-opened class takes on the teacher's first visit.
  const data: Payload = {
    class: {
      id: 'demo',
      name: 'י׳3 — כיתת דוגמה',
      school: null,
      units: 5,
      schoolYear: 'תשפ״ז',
      joinCode: null,
      archived: false,
    },
    board: {
      studentCount: 0,
      activeThisWeek: 0,
      neverStarted: 0,
      needsAttention: [],
      reteach: [],
      students: [],
      topics: [],
    },
    focuses: [],
    windowDays: 120,
  };

  // ConsoleShell without a name: the same chrome a signed-in teacher sees,
  // minus the identity and the sign-out button he does not have yet.
  return (
    <ConsoleShell>
      <ClassBoardView data={data} classId={null} onReload={() => {}} />
    </ConsoleShell>
  );
}
