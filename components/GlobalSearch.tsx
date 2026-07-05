'use client';

// GlobalSearch — a Ctrl+K command-palette over everything in the app:
// topics, sub-topics, formulas, and past-bagrut questions. Mounted once in
// the root layout; opens via the keyboard shortcut or the custom
// 'open-global-search' window event (fired from buttons anywhere).

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { searchAll, KIND_LABELS, type SearchItem, type SearchKind } from '@/lib/search-index';

const KIND_ORDER: SearchKind[] = ['topic', 'subtopic', 'formula', 'bagrut'];

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open triggers: Ctrl/Cmd+K anywhere + a custom event from buttons.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-global-search', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-global-search', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      // Focus after the enter animation starts.
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const grouped = open ? searchAll(query) : new Map<SearchKind, SearchItem[]>();
  const flat: SearchItem[] = KIND_ORDER.flatMap((k) => grouped.get(k) ?? []);
  const clampedSelected = Math.min(selected, Math.max(0, flat.length - 1));

  const go = (item: SearchItem) => {
    setOpen(false);
    router.push(item.href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && flat[clampedSelected]) {
      e.preventDefault();
      go(flat[clampedSelected]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[80] bg-slate-900/30 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            dir="rtl"
            className="fixed top-[12vh] left-1/2 -translate-x-1/2 z-[81] w-[92vw] max-w-xl bg-[#FDFDFB] border border-slate-900/10 rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-900/[0.08]">
              <Search className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(0);
                }}
                onKeyDown={onInputKey}
                placeholder="חפש נושא, נוסחה או שאלת בגרות..."
                className="flex-1 bg-transparent outline-none text-base text-slate-900 placeholder:text-slate-400"
              />
              <button
                onClick={() => setOpen(false)}
                aria-label="סגור"
                className="w-7 h-7 rounded-lg hover:bg-slate-900/5 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <div className="text-center text-xs text-slate-500 py-8">
                  הקלד לפחות 2 תווים — נושאים, נוסחאות ובגרויות
                </div>
              ) : flat.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-8">
                  לא נמצא כלום עבור ״{query}״
                </div>
              ) : (
                KIND_ORDER.map((kind) => {
                  const items = grouped.get(kind);
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={kind} className="mb-2">
                      <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase px-3 py-1.5">
                        {KIND_LABELS[kind]}
                      </div>
                      {items.map((item) => {
                        const idx = flat.indexOf(item);
                        const active = idx === clampedSelected;
                        return (
                          <button
                            key={`${item.kind}|${item.title}|${item.subtitle}`}
                            onClick={() => go(item)}
                            onMouseEnter={() => setSelected(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-colors ${
                              active ? 'bg-indigo-500/10 border border-indigo-500/25' : 'border border-transparent hover:bg-slate-900/[0.03]'
                            }`}
                          >
                            <span className="text-lg flex-shrink-0">{item.emoji ?? '🔎'}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold text-slate-900 truncate">{item.title}</span>
                              <span className="block text-[11px] text-slate-500 truncate">{item.subtitle}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2 border-t border-slate-900/[0.08] text-[10px] text-slate-400 flex items-center gap-3">
              <span>↑↓ ניווט</span>
              <span>Enter פתיחה</span>
              <span>Esc סגירה</span>
              <span className="mr-auto">Ctrl+K</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
