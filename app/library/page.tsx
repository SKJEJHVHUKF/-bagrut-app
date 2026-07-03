'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, BookOpen, Trash2, ChevronDown, ChevronUp, Calendar, Sparkles } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { scansByTopic, deleteScan, type Scan } from '@/lib/scans';

export default function LibraryPage() {
  const [groups, setGroups] = useState<{ topic: string; scans: Scan[] }[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Read from localStorage on mount only (avoids SSR hydration mismatch).
  useEffect(() => {
    setMounted(true);
    setGroups(scansByTopic());
  }, []);

  const refresh = () => setGroups(scansByTopic());

  const handleDelete = (id: string) => {
    if (!confirm('למחוק את השאלה הזו מהספרייה?')) return;
    deleteScan(id);
    refresh();
    if (expanded === id) setExpanded(null);
  };

  const totalCount = groups.reduce((sum, g) => sum + g.scans.length, 0);

  if (!mounted) {
    // Skeleton — avoids "0 שאלות" flashing before localStorage reads.
    return (
      <main className="min-h-screen px-4 sm:px-6 py-8 max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-slate-900/[0.03] rounded animate-pulse mb-4" />
        <div className="h-32 bg-slate-900/[0.02] rounded-2xl animate-pulse" />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <header className="space-y-2 mb-6">
        <div className="text-xs font-black tracking-widest text-indigo-700 uppercase flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>הספרייה שלי</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-black leading-tight">
          <span className="font-display text-slate-800">
            השאלות שצילמת
          </span>
        </h1>
        <p className="text-sm text-slate-600">
          {totalCount === 0
            ? 'עדיין לא שמרת שאלות. צלמי שאלת בגרות ראשונה.'
            : `${totalCount} שאלות שמורות, מקובצות לפי נושא`}
        </p>
      </header>

      {/* CTA to scan more */}
      <div className="mb-6">
        <Link
          href="/scan"
          className="inline-flex items-center gap-3 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-500/40 transition-all"
        >
          <Camera className="w-5 h-5" />
          <span>צלמי שאלה חדשה</span>
        </Link>
      </div>

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="surface-premium rounded-2xl p-8 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-indigo-600 mx-auto" />
          <div className="text-base font-bold">איך זה עובד?</div>
          <ol className="text-sm text-slate-700 space-y-1 inline-block text-right">
            <li>1. צלמי שאלת בגרות מספר תרגול / מבחן</li>
            <li>2. ה-AI יזהה את הנושא ויפתור צעד-אחר-צעד</li>
            <li>3. לחצי "שמרי לספרייה" — והשאלה תופיע פה</li>
            <li>4. בכל זמן, חזרי לעיין בפתרון</li>
          </ol>
        </div>
      )}

      {/* Topic groups */}
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.topic}>
            <h2 className="font-display text-sm font-black text-indigo-700 mb-3 flex items-center gap-2">
              <span>{group.topic}</span>
              <span className="text-xs font-normal text-slate-600">({group.scans.length})</span>
            </h2>
            <div className="space-y-2">
              {group.scans.map((scan) => {
                const isOpen = expanded === scan.id;
                return (
                  <article
                    key={scan.id}
                    className="surface-premium rounded-2xl overflow-hidden"
                  >
                    {/* Collapsed header */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : scan.id)}
                      className="w-full text-right p-4 flex gap-3 items-start hover:bg-slate-900/[0.02] transition-colors"
                    >
                      {/* Thumbnail */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:${scan.thumbnailMime};base64,${scan.thumbnail}`}
                        alt=""
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-slate-900/10 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-800 line-clamp-2 chat-md leading-relaxed">
                          <MathText inline>{scan.transcribedQuestion}</MathText>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(scan.createdAt).toLocaleDateString('he-IL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-slate-600">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {/* Expanded body */}
                    {isOpen && (
                      <div className="px-4 pb-4 space-y-4 border-t border-slate-900/10 pt-4">
                        {/* Full question */}
                        <div>
                          <div className="text-xs font-black tracking-widest text-indigo-700 uppercase mb-1.5">
                            השאלה
                          </div>
                          <div className="chat-md text-sm text-slate-800 leading-relaxed">
                            <MathText>{scan.transcribedQuestion}</MathText>
                          </div>
                        </div>

                        {/* Steps */}
                        <div>
                          <div className="text-xs font-black tracking-widest text-emerald-700 uppercase mb-2">
                            פתרון צעד-אחר-צעד
                          </div>
                          <ol className="space-y-2">
                            {scan.steps.map((step, i) => (
                              <li key={i} className="bg-slate-900/[0.03] rounded-xl p-3 flex gap-2">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-black text-emerald-800">
                                  {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-black text-emerald-800 mb-1 chat-md">
                                    <MathText inline>{step.title}</MathText>
                                  </div>
                                  <div className="chat-md text-sm text-slate-800 leading-relaxed">
                                    <MathText>{step.content}</MathText>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Final answer */}
                        <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-3">
                          <div className="text-xs font-black tracking-widest text-emerald-700 uppercase mb-1">
                            תשובה סופית
                          </div>
                          <div className="chat-md text-sm font-bold text-emerald-900 leading-relaxed">
                            <MathText>{scan.finalAnswer}</MathText>
                          </div>
                        </div>

                        {/* Delete */}
                        <div className="pt-2">
                          <button
                            onClick={() => handleDelete(scan.id)}
                            className="inline-flex items-center gap-2 text-xs text-red-300 hover:text-red-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            מחיקת שאלה
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Back link */}
      <div className="mt-8 pt-6 border-t border-slate-900/10">
        <Link href="/my-plan" className="text-sm text-slate-600 hover:text-slate-800">
          ← חזרה לתוכנית הלימוד
        </Link>
      </div>
    </main>
  );
}
