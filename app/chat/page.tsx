'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { hasLesson } from '@/content/lessons';
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
} from 'lucide-react';

const MAX_DAILY_MESSAGES = 20;
const MAX_MESSAGE_LEN = 500;

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

type Conversation = {
  id: string;
  title: string;
  updated_at: string;
};

// Suggested prompts shown on the empty state for fresh chats.
const SUGGESTIONS = [
  'הסבר לי על מספרים מרוכבים',
  'תפתור איתי בעיה בנגזרות',
  'מה ההבדל בין סדרה חשבונית להנדסית?',
  'איך כותבים אנליזה ספרותית בבגרות?',
];

function utcDayStartIso() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function BagrutLogo({ size = 'md' as 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  return (
    <div
      className={`relative ${dim} rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-500 to-amber-400 flex items-center justify-center shadow-xl shadow-indigo-500/50 ring-1 ring-slate-900/10`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white drop-shadow-md">
        <path
          d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [remaining, setRemaining] = useState<number>(MAX_DAILY_MESSAGES);
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

      // Today's user-sent count to compute remaining.
      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'user')
        .gte('created_at', utcDayStartIso());

      if (cancelled) return;
      setRemaining(Math.max(0, MAX_DAILY_MESSAGES - (count ?? 0)));
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

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (trimmed.length > MAX_MESSAGE_LEN) {
      setError(`הודעה ארוכה מדי (מקסימום ${MAX_MESSAGE_LEN} תווים)`);
      return;
    }
    if (remaining <= 0) {
      setError(`הגעת למכסת ${MAX_DAILY_MESSAGES} ההודעות היומית. חזור מחר.`);
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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, topic, conversationId }),
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

      const data = await res.json();
      if (!data.reply) throw new Error('No reply field in response');

      const assistantMsg: ChatMessage = {
        id: `assist-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, assistantMsg]);
      if (typeof data.remaining === 'number') setRemaining(data.remaining);
      // First message of a fresh chat → server created a conversation.
      // Adopt its id and refresh the sidebar so it appears at the top.
      if (data.conversationId) {
        const isNew = data.conversationId !== conversationId;
        setConversationId(data.conversationId);
        if (isNew) loadConversations();
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
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/30 blur-[120px] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/25 blur-[120px] animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        />
      </div>

      {/* Top bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-[#FDFDFB]/80 border-b border-slate-900/10">
        {/* pl-16 on mobile reserves room for the global profile avatar (fixed
            top-left); restored to px-4 from sm up where there's space. */}
        <div className="max-w-3xl mx-auto px-4 pl-16 sm:pl-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BagrutLogo size="md" />
            <div>
              <div className="text-base font-black font-display text-slate-800">
                בגרות בכיס
              </div>
              <div className="text-[10px] text-slate-600 -mt-0.5">המורה הפרטי שלך</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={newChat}
              className="group flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">שיחה חדשה</span>
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="היסטוריית שיחות"
              className="flex items-center gap-1.5 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-indigo-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">היסטוריה</span>
            </button>
            <Link
              href="/quiz"
              className="group hidden sm:flex items-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 hover:border-indigo-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
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
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-800 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3 py-1.5">
            <Sparkles className="w-3 h-3 flex-shrink-0" />
            <span>מצב מורה מעוגן · {topic} — מלמד מהחומר המאומת, מכוון ולא נותן תשובות מוכנות</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-3 sm:px-4 pt-4 pb-40">
        {loadingHistory ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        ) : isEmpty ? (
          <EmptyState onPick={(t) => send(t)} />
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} content={m.content} />
            ))}
            {sending && <TypingBubble />}
            <div ref={listEndRef} />
          </div>
        )}
      </main>

      {/* Composer */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-[#FDFDFB]/90 backdrop-blur-xl border-t border-slate-900/10">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3">
          {error && (
            <div className="mb-2 text-sm text-indigo-700 bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={remaining > 0 ? 'שאל את המורה...' : 'הגעת למכסה היומית'}
              rows={1}
              maxLength={MAX_MESSAGE_LEN}
              disabled={sending || remaining <= 0}
              className="flex-1 surface-premium rounded-2xl px-4 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-900/[0.04] transition-all resize-none max-h-32"
              style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending || remaining <= 0}
              className="bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white p-3 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all"
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

function MessageBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user';

  // User messages: plain text. Their input is treated as data, never rendered
  // as markdown (avoids HTML/script injection via a user typing $$...$$).
  if (isUser) {
    return (
      <div className="flex justify-start">
        <div
          className="max-w-[85%] bg-gradient-to-l from-indigo-600 to-indigo-600 text-white px-4 py-3 rounded-2xl rounded-tl-md shadow-lg shadow-indigo-500/20"
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
      <div
        className="chat-md max-w-[85%] bg-slate-900/[0.03] backdrop-blur-md border border-slate-900/10 text-slate-800 px-4 py-3 rounded-2xl rounded-tr-md"
        style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-slate-900/[0.03] backdrop-blur-md border border-slate-900/10 text-slate-700 px-4 py-3 rounded-2xl rounded-tr-md inline-flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
        <span className="text-sm">המורה כותב…</span>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-5">
        <MessageCircle className="w-8 h-8 text-indigo-700" />
      </div>
      <h2 className="font-display text-2xl font-black mb-2">
        <span className="font-display text-slate-800">
          המורה הפרטי שלך
        </span>
      </h2>
      <p className="text-slate-600 max-w-md mb-8">
        שאל אותי כל דבר על חומרי הבגרות. אענה בקצרה וברור. נסה אחת מהשאלות:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(s)}
            className="group bg-slate-900/[0.03] hover:bg-slate-900/[0.05] border border-slate-900/10 hover:border-indigo-500/40 rounded-xl px-4 py-3 text-right text-sm text-slate-800 transition-all flex items-center gap-2.5"
          >
            <Lightbulb className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="flex-1">{s}</span>
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-700 group-hover:-translate-x-1 transition-all" />
          </button>
        ))}
      </div>
      <p className="mt-8 text-xs text-slate-500">
        <Sparkles className="inline w-3 h-3 -mt-0.5 mr-1" />
        מבוסס Claude AI · מקסימום 20 שאלות ביום
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
            className="fixed top-0 bottom-0 right-0 z-[71] w-[300px] max-w-[85vw] bg-[#FDFDFB] border-r border-slate-900/10 shadow-2xl shadow-slate-900/20 flex flex-col"
          >
            <div className="p-4 border-b border-slate-900/[0.08] flex items-center justify-between">
              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
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
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2.5 rounded-xl text-sm font-bold transition-colors"
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
                        ? 'bg-indigo-500/10 border border-indigo-500/30'
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
