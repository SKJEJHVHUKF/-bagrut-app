'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { isProUser, FREE_DAILY_CHAT, PRO_DAILY_CHAT } from '@/lib/access';
import { hasLesson } from '@/content/lessons';
import { buildStudentSnapshot } from '@/lib/tutor-context';
import {
  buildTutorGreeting,
  GENERIC_PROMPTS,
  type TutorGreeting,
} from '@/lib/tutor-greeting';
import { getUnitLevel, getPaper } from '@/lib/study-plan';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  Send,
  Sparkles,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Lightbulb,
  Plus,
  History,
  Trash2,
  X,
  Camera,
  Target,
  RotateCcw,
  Brain,
} from 'lucide-react';
import { SolutionAudit } from '@/components/practice/SolutionAudit';
import { MathText } from '@/components/practice/MathText';
import MathUpLogo from '@/components/MathUpLogo';
import type { ResolvedSuggestion } from '@/lib/agents/tools';
import type { TutorFact } from '@/lib/tutor-memory';

const MAX_MESSAGE_LEN = 500;

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  /**
   * A suggestion the tutor made on this turn. Deliberately NOT persisted —
   * chat_messages stores text, so reloading an old conversation shows the
   * words without the button. That is the honest behaviour: the suggestion was
   * about the moment ("you just got this wrong twice — practice it"), and a
   * button resurrected from last Tuesday is a worse thing than no button.
   */
  action?: ResolvedSuggestion;
};

type Conversation = {
  id: string;
  title: string;
  updated_at: string;
};

function utcDayStartIso() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [remaining, setRemaining] = useState<number>(FREE_DAILY_CHAT);
  const [dailyCap, setDailyCap] = useState<number>(FREE_DAILY_CHAT);
  const [error, setError] = useState<string | null>(null);
  // Saved-conversations sidebar. `conversationId` is null on a fresh chat
  // until the first message creates a conversation server-side.
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Optional topic context from the URL (?topic=...). When it's the grounded
  // pilot ("מספרים מרוכבים") the chat tutor teaches from the verified content
  // and follows the private-tutor bar; otherwise it's the normal chat.
  const [topic, setTopic] = useState('');
  const [showAudit, setShowAudit] = useState(false);
  // What the tutor remembers about this student, and the panel that shows it.
  // Loaded once per visit; /api/chat pushes an updated list whenever the tutor
  // writes, so the panel never shows a fact the student hasn't been told about.
  const [facts, setFacts] = useState<TutorFact[]>([]);
  const [showMemory, setShowMemory] = useState(false);

  const listEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  // Load the saved-conversations list (for the sidebar). Degrades to an
  // empty list if the `conversations` table doesn't exist yet.
  const loadConversations = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, updated_at')
        .order('updated_at', { ascending: false })
        .limit(50);
      if (!error && data) setConversations(data as Conversation[]);
    } catch {
      // table missing — sidebar just stays empty
    }
  }, []);

  // On mount: open a FRESH clean chat (no old thread loaded), and load the
  // sidebar list + today's quota.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();

      // Tier-aware daily cap: free vs Pro.
      const { data: { user } } = await supabase.auth.getUser();
      const cap = isProUser(user) ? PRO_DAILY_CHAT : FREE_DAILY_CHAT;

      // Today's billed turns, from the same append-only log the server counts
      // (ai_generation_log, kind 'chat'; RLS shows the student his own rows).
      // Counting chat_messages here would drift from the server's number as
      // soon as a conversation is deleted.
      const { count } = await supabase
        .from('ai_generation_log')
        .select('id', { count: 'exact', head: true })
        .eq('kind', 'chat')
        .gte('created_at', utcDayStartIso());

      if (cancelled) return;
      setDailyCap(cap);
      setRemaining(Math.max(0, cap - (count ?? 0)));
      loadConversations();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadConversations]);

  // Start a brand-new empty conversation.
  const newChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setSidebarOpen(false);
    textareaRef.current?.focus();
  }, []);

  // Open a saved conversation — load its messages and continue it.
  const openConversation = useCallback(
    async (id: string) => {
      setSidebarOpen(false);
      if (id === conversationId) return;
      setLoadingHistory(true);
      setConversationId(id);
      setMessages([]);
      const supabase = createClient();
      const { data } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })
        .limit(200);
      setMessages((data ?? []) as ChatMessage[]);
      setLoadingHistory(false);
      setTimeout(scrollToBottom, 50);
    },
    [conversationId, scrollToBottom]
  );

  // Delete a saved conversation.
  const deleteConversation = useCallback(
    async (id: string) => {
      const supabase = createClient();
      await supabase.from('conversations').delete().eq('id', id);
      setConversations((cs) => cs.filter((c) => c.id !== id));
      if (id === conversationId) {
        setMessages([]);
        setConversationId(null);
      }
    },
    [conversationId]
  );

  // Auto-scroll on new message
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Read the optional ?topic= once on mount (client-only — avoids the
  // useSearchParams Suspense-boundary requirement).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('topic');
    if (t) setTopic(t);
  }, []);

  // What the tutor already remembers. Silent on failure: an unreachable memory
  // endpoint should cost the panel, never the chat.
  useEffect(() => {
    fetch('/api/chat/memory')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.facts)) setFacts(d.facts);
      })
      .catch(() => {});
  }, []);

  /** Delete one remembered fact, or all of them. Server returns the new list. */
  async function forgetFact(text?: string) {
    const url = text ? `/api/chat/memory?text=${encodeURIComponent(text)}` : '/api/chat/memory';
    try {
      const res = await fetch(url, { method: 'DELETE' });
      const d = await res.json();
      if (Array.isArray(d?.facts)) setFacts(d.facts);
    } catch {
      /* the panel keeps showing the old list — better than a silent lie */
    }
  }

  /**
   * @param extraContext Call-only context for THIS turn — e.g. the photo-audit
   *   brief. Merged with the student snapshot and injected server-side into the
   *   current turn only; never persisted into the transcript.
   */
  async function send(text: string, extraContext?: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (trimmed.length > MAX_MESSAGE_LEN) {
      setError(`הודעה ארוכה מדי (מקסימום ${MAX_MESSAGE_LEN} תווים)`);
      return;
    }
    if (remaining <= 0) {
      setError(
        dailyCap <= FREE_DAILY_CHAT
          ? `הגעת למכסת ${dailyCap} ההודעות היומית בחשבון החינמי. שדרג ל-Pro לצ׳אט ללא הגבלה.`
          : `הגעת למכסת ${dailyCap} ההודעות היומית. חזור מחר.`
      );
      return;
    }

    setError(null);
    setSending(true);
    setInput('');

    // Optimistic user message; replaced/kept after server response.
    const optimisticId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);

    try {
      // Student snapshot (mistakes / level / pace / due reviews) — lets the
      // tutor diagnose instead of guessing. Call-only: the server injects it
      // into this turn, never persists it. Best-effort — never block sending.
      let studentContext = '';
      try {
        studentContext = buildStudentSnapshot('math5', topic);
      } catch {
        studentContext = '';
      }
      // The audit brief goes FIRST and the snapshot second, because the server
      // hard-truncates `context` at 2000 chars from the END — snapshot alone can
      // reach 1800. Brief-last would have silently cut off the very instruction
      // that tells the tutor how to open. We also trim here rather than letting
      // the server chop mid-sentence.
      if (extraContext) {
        studentContext = [extraContext, studentContext].filter(Boolean).join('\n\n').slice(0, 2000);
      }

      // Level + שאלון from the student's own plan, so the tutor pitches a
      // 3-unit explanation differently from a 5-unit one. Best-effort: if
      // there's no plan yet the server falls back to 5 units / 572.
      let unitLevel: 3 | 4 | 5 | undefined;
      let formNumber: string | undefined;
      try {
        unitLevel = getUnitLevel();
        formNumber = getPaper() ?? undefined;
      } catch {
        /* no plan — let the server default */
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          topic,
          conversationId,
          ...(studentContext ? { context: studentContext } : {}),
          ...(unitLevel ? { unitLevel } : {}),
          ...(formNumber ? { formNumber } : {}),
        }),
      });

      if (!res.ok) {
        // Try to parse the JSON error body the server returns.
        let serverMsg = '';
        try {
          const j = await res.json();
          serverMsg = j?.error ?? '';
          if (j?.quotaExceeded) setRemaining(0);
        } catch {
          serverMsg = await res.text().catch(() => '');
        }
        throw new Error(serverMsg || `HTTP ${res.status}`);
      }

      // ===== consume the SSE stream =====
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');
      const decoder = new TextDecoder();
      const assistantId = `assist-${Date.now()}`;
      let buf = '';
      let acc = '';
      let created = false;
      let streamErr: string | null = null;

      const applyEvent = (event: string, dataStr: string) => {
        let data: {
          text?: string;
          reply?: string;
          error?: string;
          remaining?: number;
          conversationId?: string | null;
          facts?: TutorFact[];
        } & Partial<ResolvedSuggestion>;
        try {
          data = JSON.parse(dataStr);
        } catch {
          return;
        }
        if (event === 'meta') {
          if (typeof data.remaining === 'number') setRemaining(data.remaining);
          if (data.conversationId) {
            const isNew = data.conversationId !== conversationId;
            setConversationId(data.conversationId);
            if (isNew) loadConversations();
          }
        } else if (event === 'delta') {
          acc += data.text ?? '';
          if (!created) {
            created = true;
            setMessages((m) => [
              ...m,
              { id: assistantId, role: 'assistant', content: acc, created_at: new Date().toISOString() },
            ]);
          } else {
            setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, content: acc } : x)));
          }
        } else if (event === 'action') {
          // The server already resolved this to a real route and dropped it if
          // it couldn't — so anything that arrives here is safe to render.
          if (data.href && data.label) {
            const action = data as ResolvedSuggestion;
            setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, action } : x)));
          }
        } else if (event === 'memory') {
          if (Array.isArray(data.facts)) setFacts(data.facts);
        } else if (event === 'error') {
          streamErr = data.error || "שגיאת צ'אט. נסה שוב.";
        } else if (event === 'done') {
          if (typeof data.reply === 'string' && data.reply.trim()) {
            acc = data.reply;
            setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, content: acc } : x)));
          }
        }
      };

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf('\n\n')) !== -1) {
          const raw = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          let ev = 'message';
          let dataStr = '';
          for (const line of raw.split('\n')) {
            if (line.startsWith('event:')) ev = line.slice(6).trim();
            else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
          }
          if (dataStr) applyEvent(ev, dataStr);
        }
      }

      if (streamErr || !acc.trim()) {
        setMessages((m) => m.filter((x) => x.id !== assistantId && x.id !== optimisticId));
        throw new Error(streamErr || 'לא התקבלה תשובה. נסה שוב.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      // Drop the optimistic user message so it doesn't look like it sent.
      setMessages((m) => m.filter((x) => x.id !== optimisticId));
    } finally {
      setSending(false);
      // Refocus the input for fast follow-ups
      textareaRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter inserts newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  // Grounded 'private tutor' mode — every topic with an authored lesson.
  // The backend applies the verified-content prompt; the badge lets the
  // student SEE they're in the grounded mode.
  const grounded = !!topic && hasLesson('math5', topic);
  const isEmpty = !loadingHistory && messages.length === 0;

  return (
    <div
      className="min-h-screen text-slate-900 relative overflow-x-hidden flex flex-col"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/30 blur-[120px] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/25 blur-[120px] animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        />
      </div>

      {/* Top bar */}
      <nav className="md:hidden sticky top-0 z-50 glass-card border-x-0 border-t-0 rounded-none">
        {/* pl-16 on mobile reserves room for the global profile avatar (fixed
            top-left); restored to px-4 from sm up where there's space. */}
        <div className="max-w-3xl mx-auto px-4 pl-16 sm:pl-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MathUpLogo size="md" />
            <div>
              <div className="text-base font-black font-display text-slate-800">
                MathUp
              </div>
              <div className="text-[10px] text-slate-600 -mt-0.5">המורה הפרטי שלך</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={newChat}
              className="group flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">שיחה חדשה</span>
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="היסטוריית שיחות"
              className="flex items-center gap-1.5 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-violet-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">היסטוריה</span>
            </button>
            {/* Only shown once there is something to show. A student with no
                remembered facts should not be handed a mystery button. */}
            {facts.length > 0 && (
              <button
                onClick={() => setShowMemory((v) => !v)}
                aria-label="מה המורה זוכר עליי"
                aria-expanded={showMemory}
                className="flex items-center gap-1.5 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-violet-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              >
                <Brain className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">מה אני זוכר</span>
                <span className="text-violet-700">{facts.length}</span>
              </button>
            )}
            <Link
              href="/quiz"
              className="group hidden sm:flex items-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-violet-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              <span>לתרגול</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Conversations sidebar (drawer) */}
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeId={conversationId}
        onNew={newChat}
        onOpen={openConversation}
        onDelete={deleteConversation}
      />

      {/* Grounded-mode badge — only when opened with the pilot topic. Lets the
          student see the tutor is teaching from the verified content. */}
      {grounded && (
        <div className="relative z-10 max-w-3xl w-full mx-auto px-4 pt-3">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-800 bg-violet-500/10 border border-violet-500/30 rounded-full px-3 py-1.5">
            <Sparkles className="w-3 h-3 flex-shrink-0" />
            <span>מצב מורה מעוגן · {topic} — מלמד מהחומר המאומת, מכוון ולא נותן תשובות מוכנות</span>
          </div>
        </div>
      )}

      {/* What the tutor remembers — visible and deletable, which is the whole
          justification for writing it in the first place. */}
      {showMemory && facts.length > 0 && (
        <div className="relative z-10 max-w-3xl w-full mx-auto px-3 sm:px-4 pt-3">
          <div className="bg-slate-900/[0.03] border border-slate-900/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-600" />
                מה שסיפרת לי
              </div>
              <button
                onClick={() => forgetFact()}
                className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
              >
                שכח הכל
              </button>
            </div>
            <ul className="space-y-1.5">
              {facts.map((f) => (
                <li
                  key={f.text}
                  className="flex items-start gap-2 text-sm text-slate-700 bg-slate-900/[0.02] border border-slate-900/[0.06] rounded-lg px-3 py-2"
                >
                  <span className="flex-1" style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}>
                    {f.text}
                  </span>
                  <button
                    onClick={() => forgetFact(f.text)}
                    aria-label={`שכח: ${f.text}`}
                    className="text-slate-400 hover:text-red-600 transition-colors flex-shrink-0 mt-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              אלה דברים שאמרת לי בשיחות קודמות, ואני משתמש בהם כדי להתאים את ההסבר. הציונים
              והטעויות שלך נשמרים בנפרד ולא מופיעים כאן.
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-3 sm:px-4 pt-4 pb-40">
        {loadingHistory ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
          </div>
        ) : isEmpty ? (
          <EmptyState topic={topic} onPick={(t) => send(t)} />
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} content={m.content} action={m.action} />
            ))}
            {/* Typing dots only until the streamed reply's first token lands
                (while the last bubble is still the user's). */}
            {sending && messages[messages.length - 1]?.role !== 'assistant' && (
              <TypingBubble />
            )}
            <div ref={listEndRef} />
          </div>
        )}
      </main>

      {/* Solution-audit overlay (camera button in composer) */}
      {showAudit && (
        <div
          className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-slate-900/30 backdrop-blur-[2px] p-3"
          onClick={() => setShowAudit(false)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <SolutionAudit
              topic={topic}
              onClose={() => setShowAudit(false)}
              onContinueInChat={(brief) => {
                // Close the overlay and open the conversation on the finding —
                // the student lands in a live tutoring turn, not a report card.
                setShowAudit(false);
                void send('צילמתי את הפתרון שלי. תעזור לי להבין את הטעות ולתקן אותה בעצמי.', brief);
              }}
            />
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-[var(--background)]/90 backdrop-blur-xl border-t border-slate-900/10">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3">
          {error && (
            <div className="mb-2 text-sm text-violet-700 bg-violet-500/10 border border-violet-500/30 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <button
              type="button"
              onClick={() => setShowAudit(true)}
              aria-label="בדוק פתרון מצילום"
              className="flex-shrink-0 surface-premium hover:bg-slate-900/[0.04] text-violet-700 p-3 rounded-2xl transition-all"
            >
              <Camera className="w-5 h-5" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={remaining > 0 ? 'שאל את המורה...' : 'הגעת למכסה היומית'}
              rows={1}
              maxLength={MAX_MESSAGE_LEN}
              disabled={sending || remaining <= 0}
              className="flex-1 surface-premium rounded-2xl px-4 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:bg-slate-900/[0.04] transition-all resize-none max-h-32"
              style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending || remaining <= 0}
              className="bg-gradient-to-l from-violet-600 to-violet-600 hover:from-violet-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white p-3 rounded-2xl shadow-lg shadow-violet-500/30 transition-all"
              aria-label="שלח"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 -scale-x-100" />
              )}
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>נשארו לך {remaining} הודעות היום</span>
            <span>{input.length}/{MAX_MESSAGE_LEN}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== sub-components =====

/** Icons per suggestion kind — the tutor's intent, at a glance. */
const ACTION_ICON: Record<ResolvedSuggestion['kind'], typeof Target> = {
  practice: Target,
  review: RotateCcw,
  replay: Brain,
};

/**
 * The tutor's suggestion, rendered as a button the student may ignore.
 *
 * It sits UNDER the reply, never instead of it: the model is told to answer
 * first and suggest second, and this placement is the other half of that rule.
 */
function ActionCard({ action }: { action: ResolvedSuggestion }) {
  const Icon = ACTION_ICON[action.kind] ?? Target;
  return (
    <Link
      href={action.href}
      className="group mt-3 flex items-center gap-3 bg-violet-500/[0.07] hover:bg-violet-500/[0.12] border border-violet-500/25 hover:border-violet-500/50 rounded-xl px-3.5 py-3 transition-all"
    >
      <span className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-violet-700" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-slate-800">{action.label}</span>
        <span className="block text-xs text-slate-600 leading-snug">{action.reason}</span>
      </span>
      <ArrowLeft className="w-4 h-4 text-violet-700 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
    </Link>
  );
}

function MessageBubble({
  role,
  content,
  action,
}: {
  role: 'user' | 'assistant';
  content: string;
  action?: ResolvedSuggestion;
}) {
  const isUser = role === 'user';

  // User messages: plain text. Their input is treated as data, never rendered
  // as markdown (avoids HTML/script injection via a user typing $$...$$).
  if (isUser) {
    return (
      <div className="flex justify-start">
        <div
          className="max-w-[85%] bg-gradient-to-l from-violet-600 to-violet-600 text-white px-4 py-3 rounded-2xl rounded-tl-md shadow-lg shadow-violet-500/20"
          style={{
            unicodeBidi: 'plaintext',
            textAlign: 'start',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  // Assistant messages: full markdown + LaTeX rendering.
  // - remark-math parses $...$ (inline) and $$...$$ (display) math
  // - rehype-katex renders parsed math nodes via KaTeX (white text on dark bg
  //   inherits from the bubble; katex.min.css handles typography)
  // - react-markdown renders headings, bold, lists, etc.
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%]">
        <div
          className="chat-md bg-slate-900/[0.03] backdrop-blur-md border border-slate-900/10 text-slate-800 px-4 py-3 rounded-2xl rounded-tr-md"
          style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {content}
          </ReactMarkdown>
        </div>
        {action && <ActionCard action={action} />}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-slate-900/[0.03] backdrop-blur-md border border-slate-900/10 text-slate-700 px-4 py-3 rounded-2xl rounded-tr-md inline-flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
        <span className="text-sm">המורה כותב…</span>
      </div>
    </div>
  );
}

/**
 * The tutor speaks first.
 *
 * The greeting is built from localStorage, so it CANNOT be computed during
 * render — this component is server-rendered like any client component, and
 * reading localStorage there crashes the build. Same mount-effect pattern the
 * page already uses for `?topic=`. Until the effect runs we show the generic
 * prompts, so the first paint is a working screen and not an empty grid.
 */
function EmptyState({ topic, onPick }: { topic: string; onPick: (text: string) => void }) {
  const [greeting, setGreeting] = useState<TutorGreeting | null>(null);

  useEffect(() => {
    setGreeting(buildTutorGreeting('math5', topic));
  }, [topic]);

  const prompts = greeting?.prompts ?? GENERIC_PROMPTS;

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-5">
        <MessageCircle className="w-8 h-8 text-violet-700" />
      </div>
      <h2 className="font-display text-2xl font-black mb-2">
        <span className="font-display text-slate-800">
          {greeting?.headline ?? 'המורה הפרטי שלך'}
        </span>
      </h2>

      {/* Factual chips — each one is a number the app already tracks. */}
      {!!greeting?.chips.length && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {greeting.chips.map((c) => (
            <span
              key={c}
              className="text-xs text-slate-700 bg-slate-900/[0.04] border border-slate-900/10 rounded-full px-3 py-1"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* MathText, not a bare string: the catalog writes maths inside insights
          as LaTeX (`$i$`, `$4$`) exactly like the rest of the content, so
          rendering it as plain text shows the student raw dollar signs. */}
      <div className="text-slate-600 max-w-md mb-6" style={{ unicodeBidi: 'plaintext' }}>
        {greeting?.insight ? (
          <MathText>{greeting.insight}</MathText>
        ) : (
          'שאל אותי כל דבר על חומרי הבגרות. אענה בקצרה וברור.'
        )}
      </div>

      {/* The cross-topic pattern. Placed BEFORE the next-step button because it
          is the one observation on this screen the student could not have made
          themselves: lib/cognition's insight is scoped to a topic, and a mistake
          that repeats across three of them is invisible from inside any one. */}
      {greeting?.pattern && (
        <Link
          href={greeting.pattern.href}
          className="mb-6 block max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 text-right transition-colors hover:bg-amber-100"
        >
          <p className="text-sm text-amber-950 leading-relaxed">{greeting.pattern.sentence}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-amber-800">
            לדוח המעקב
            <ArrowLeft aria-hidden="true" className="w-3.5 h-3.5" />
          </span>
        </Link>
      )}

      {/* The next step lib/cognition already picked, with the route it chose.
          Safe as the only CTA here — unlike /roadmap, this screen has none. */}
      {greeting?.action && (
        <Link
          href={greeting.action.href}
          title={greeting.action.reason}
          className="mb-8 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl px-5 py-3 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>{greeting.action.label}</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
        {prompts.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(s)}
            className="group bg-slate-900/[0.03] hover:bg-slate-900/[0.05] border border-slate-900/10 hover:border-violet-500/40 rounded-xl px-4 py-3 text-right text-sm text-slate-800 transition-all flex items-center gap-2.5"
          >
            <Lightbulb className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="flex-1">{s}</span>
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-700 group-hover:-translate-x-1 transition-all" />
          </button>
        ))}
      </div>
      <p className="mt-8 text-xs text-slate-500">
        <Sparkles className="inline w-3 h-3 -mt-0.5 mr-1" />
        מבוסס Claude AI · {FREE_DAILY_CHAT} שאלות ביום בחינם
      </p>
    </div>
  );
}

function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const day = 86400000;
  if (diff < day && new Date(iso).getDate() === new Date().getDate()) return 'היום';
  if (diff < 2 * day) return 'אתמול';
  const days = Math.floor(diff / day);
  if (days < 7) return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

function ChatSidebar({
  open,
  onClose,
  conversations,
  activeId,
  onNew,
  onOpen,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-slate-900/30 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            dir="rtl"
            className="fixed top-0 bottom-0 right-0 z-[71] w-[300px] max-w-[85vw] bg-[var(--background)] border-r border-slate-900/10 shadow-2xl shadow-slate-900/20 flex flex-col"
          >
            <div className="p-4 border-b border-slate-900/[0.08] flex items-center justify-between">
              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-violet-600" />
                שיחות קודמות
              </div>
              <button
                onClick={onClose}
                aria-label="סגור"
                className="w-8 h-8 rounded-lg hover:bg-slate-900/5 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3">
              <button
                onClick={onNew}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-3 py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                <Plus className="w-4 h-4" />
                שיחה חדשה
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
              {conversations.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-10 leading-relaxed px-4">
                  אין עדיין שיחות שמורות.
                  <br />
                  כל שיחה חדשה עם המורה תישמר כאן אוטומטית.
                </div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`group flex items-center gap-1 rounded-xl transition-colors ${
                      c.id === activeId
                        ? 'bg-violet-500/10 border border-violet-500/30'
                        : 'hover:bg-slate-900/[0.04] border border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => onOpen(c.id)}
                      className="flex-1 min-w-0 text-right px-3 py-2.5"
                    >
                      <div className="text-sm font-bold text-slate-800 truncate">{c.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{relativeDate(c.updated_at)}</div>
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      aria-label="מחק שיחה"
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-400 hover:text-red-600 transition-all flex-shrink-0 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
