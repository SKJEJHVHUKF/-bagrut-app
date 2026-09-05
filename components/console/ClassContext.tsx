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
  /** Who has NOT closed it, the ones who never opened it first. This is the
   *  list a teacher acts on; the count alone only tells her that she has to
   *  go looking. */
  notDone: { id: string; name: string; answered: number }[];
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

/**
 * Who a task is aimed at.
 *
 * The third variant is the one that saves a teacher real work: the board
 * already knows exactly which students are stuck in a topic, or which never
 * closed a task she sent, so she should never have to find those names in a
 * list and tick them one by one. `label` is what the button that opened the
 * dialog promised, so the dialog can say it back.
 */
export type FocusTarget =
  | 'class'
  | { studentId: string; name: string }
  | { studentIds: string[]; label: string };

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
  /** The student ids the opening button already chose, or null for none. */
  focusPreselect: string[] | null;
  /** What that button promised, in its own words, so the dialog can say it
   *  back instead of making a teacher count ticked names. */
  focusPreselectLabel: string | null;
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
    focusPreselect:
      focusFor === null || focusFor === 'class'
        ? null
        : 'studentId' in focusFor
          ? [focusFor.studentId]
          : focusFor.studentIds,
    focusPreselectLabel:
      focusFor === null || focusFor === 'class' || 'studentId' in focusFor ? null : focusFor.label,
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
