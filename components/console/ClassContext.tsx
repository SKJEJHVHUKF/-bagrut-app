'use client';

/**
 * ClassContext — one class, fetched once, shared by every section of it.
 *
 * The console's class area is five pages (סקירה, תלמידים, מיקודים, דוחות,
 * הגדרות) over ONE payload. Fetching it per page would be five round-trips for
 * the same rows and five chances for two screens to show two numbers; holding
 * it here means a teacher moving between sections is moving between views of a
 * single truth.
 *
 * It also owns the two overlays every section can open — the student drawer
 * and the focus dialog — so "מקד" behaves identically whether it was pressed on
 * the overview, the roster, or inside a student's card.
 *
 * Sample mode: `isDemo` is derived from an empty roster, exactly as the old
 * board did, and the demo route seeds the provider with the sample payload.
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ClassBoard, StudentRow } from '@/lib/class-board';
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
  reload: () => void;
  openStudent: StudentRow | null;
  showStudent: (s: StudentRow | null) => void;
  showStudentById: (id: string) => void;
  focusFor: FocusTarget | null;
  openFocus: (f: FocusTarget) => void;
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

  const [openStudent, showStudent] = useState<StudentRow | null>(null);
  const [focusFor, setFocusFor] = useState<FocusTarget | null>(null);

  const showStudentById = useCallback(
    (id: string) => showStudent(board.students.find((s) => s.id === id) ?? null),
    [board.students]
  );

  const value: Ctx = {
    data,
    board,
    focuses,
    isDemo,
    classId: isDemo ? null : data.class.id,
    reload,
    openStudent,
    showStudent,
    showStudentById,
    focusFor,
    // No focus in sample mode — the ids are invented, and a button that 403s
    // is worse than no button.
    openFocus: (f) => {
      if (!isDemo) setFocusFor(f);
    },
    closeFocus: () => setFocusFor(null),
  };

  return <ClassCtx.Provider value={value}>{children}</ClassCtx.Provider>;
}

export function useClass(): Ctx {
  const ctx = useContext(ClassCtx);
  if (!ctx) throw new Error('useClass must be used inside <ClassProvider>');
  return ctx;
}
