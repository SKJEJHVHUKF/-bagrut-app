'use client';

/**
 * ClassContext — one class, fetched once, shared by every section of it.
 *
 * The console's class area is six pages (סקירה, תלמידים, תלמיד, תרגולים,
 * דוחות, הגדרות) over ONE payload. Fetching it per page would be six
 * round-trips for the same rows and six chances for two screens to show two
 * numbers; holding it here means a teacher moving between sections is moving
 * between views of a single truth.
 *
 * It also owns the one overlay every section can open — the send-practice
 * dialog — so "שלח תרגול" behaves identically whether it was pressed on a
 * card, a topic row, or a student's page. The dialog can be opened WITH a
 * topic already chosen: pressing "שלח תרגול" on a student stuck in סדרות
 * should not then ask which topic.
 *
 * Sample mode: `isDemo` is derived from an empty roster, and the demo route
 * seeds the provider with the sample payload.
 */

import { createContext, useContext, useMemo, useState } from 'react';
import type { ClassBoard } from '@/lib/class-board';
import { demoBoard, demoFocuses } from '@/lib/demo-board';
import type { Rung } from '@/lib/rungs';

export type FocusRow = {
  id: string;
  label: string;
  topic: string;
  subTopicId: string | null;
  rung: Rung | null;
  targetCount: number | null;
  dueOn: string | null;
  note: string | null;
  targetedCount: number | null;
  totalCount: number;
  started: number;
  done: number;
  /** Who it was aimed at. null = the whole class. */
  studentIds: string[] | null;
};

export type ClassPayload = {
  class: {
    id: string;
    name: string;
    school: string | null;
    units: number | null;
    schoolYear: string;
    joinCode: string | null;
    archived: boolean;
  };
  board: ClassBoard;
  focuses: FocusRow[];
  windowDays: number;
};

export type FocusTarget = { studentId: string; name: string } | 'class';

type Ctx = {
  data: ClassPayload;
  /** The board actually on screen — the sample when the roster is empty. */
  board: ClassBoard;
  focuses: FocusRow[];
  isDemo: boolean;
  /** null in sample mode: there is no class to write to. */
  classId: string | null;
  /** The URL prefix every link under this class starts with. */
  base: string;
  reload: () => void;
  focusFor: FocusTarget | null;
  /** A topic to have pre-selected in the dialog, when the button that opened
   *  it already knew one. */
  focusTopic: string | null;
  openFocus: (f: FocusTarget, topic?: string | null) => void;
  closeFocus: () => void;
};

const ClassCtx = createContext<Ctx | null>(null);

export function ClassProvider({
  data,
  reload,
  children,
}: {
  data: ClassPayload;
  reload: () => void;
  children: React.ReactNode;
}) {
  const isDemo = data.board.studentCount === 0;
  const board = useMemo(() => (isDemo ? demoBoard() : data.board), [isDemo, data.board]);
  const focuses = useMemo(() => (isDemo ? demoFocuses() : data.focuses), [isDemo, data.focuses]);

  const [focusFor, setFocusFor] = useState<FocusTarget | null>(null);
  const [focusTopic, setFocusTopic] = useState<string | null>(null);

  const value: Ctx = {
    data,
    board,
    focuses,
    isDemo,
    classId: isDemo ? null : data.class.id,
    base: isDemo ? '/console-demo' : `/console/class/${data.class.id}`,
    reload,
    focusFor,
    focusTopic,
    // No sending in sample mode — the ids are invented, and a button that 403s
    // is worse than no button.
    openFocus: (f, topic = null) => {
      if (isDemo) return;
      setFocusTopic(topic);
      setFocusFor(f);
    },
    closeFocus: () => {
      setFocusFor(null);
      setFocusTopic(null);
    },
  };

  return <ClassCtx.Provider value={value}>{children}</ClassCtx.Provider>;
}

export function useClass(): Ctx {
  const ctx = useContext(ClassCtx);
  if (!ctx) throw new Error('useClass must be used inside <ClassProvider>');
  return ctx;
}
