'use client';

import React, { useState, useEffect, ReactNode, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { hasQuestionBank, getQuestions } from '@/content/lessons';
import { markStep } from '@/lib/study-plan';

// Renders a string with markdown + LaTeX math.
// `inline` strips the wrapping <p> so the content can sit inside a flex
// button / single-line container without taking a full block.
function MathText({ children, inline = false }: { children: string; inline?: boolean }) {
  const components = inline
    ? { p: ({ children }: { children?: ReactNode }) => <>{children}</> }
    : undefined;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}

const SUBJECTS = {
  // ===== Math 5 units (highest level) — שאלון 581/582 =====
  // Topic list reflects the post-2020 reform curriculum.
  math5: {
    name: 'מתמטיקה 5 יח׳',
    emoji: '📐',
    tabCls: 'tab-math',
    gridCls: 's-math',
    badge: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
    // Topics ordered to match the official Ministry of Education
    // syllabus for math5 (שאלון 806/581 + 807/582), 2024-2025 curriculum.
    // Source of truth: content/bagrut-curriculum.ts.
    topics: [
      // ===== שאלון 581 (806) =====
      // אלגברה, גיאו׳ אוקלידית + טריגו, חדו"א של פונקציות אלגבריות
      { name: 'אלגברה', emoji: '🔣', sub: '581 • בכל בגרות • 15-25 נק׳' },
      { name: 'סדרות', emoji: '⋯', sub: '581 • ברוב הבגרויות • 15-25 נק׳' },
      { name: 'הסתברות', emoji: '🎲', sub: '581 • ברוב הבגרויות • 15-25 נק׳' },
      { name: 'גיאומטריה אוקלידית', emoji: '△', sub: '581 • בכל בגרות • 15-20 נק׳' },
      { name: 'פונקציות', emoji: '📈', sub: '581/582 • יסודות חקירה — מקדים חדו"א' },
      { name: 'טריגונומטריה', emoji: '🔺', sub: '581 (במישור) + 582 (במרחב) • 20-25 נק׳' },
      { name: 'חשבון דיפרנציאלי', emoji: '∂', sub: '581 + 582 • בכל בגרות • 20-25 נק׳' },
      { name: 'חשבון אינטגרלי', emoji: '∫', sub: '581 + 582 • בכל בגרות • 20-25 נק׳' },
      // ===== שאלון 582 (807) =====
      // מעריכית/ln, גיאו׳ אנליטית, וקטורים, מרוכבים
      { name: 'פונקציה מעריכית', emoji: '📊', sub: '582 • בכל בגרות • 20-25 נק׳' },
      { name: 'פונקציית ln', emoji: '🧮', sub: '582 • בכל בגרות • 20-25 נק׳' },
      { name: 'גאומטריה אנליטית', emoji: '📍', sub: '582 • ברוב הבגרויות • 20-25 נק׳' },
      { name: 'וקטורים במרחב', emoji: '➡️', sub: '582 • ברוב הבגרויות • 20-25 נק׳' },
      { name: 'מספרים מרוכבים', emoji: 'ℂ', sub: '582 • בכל בגרות • 15-25 נק׳' },
      { name: 'סטטיסטיקה', emoji: '📉', sub: '⚠️ מחוץ לסילבוס העדכני — תוכן רזרבי' },
    ],
  },
  // ===== Math 4 units (intermediate) — שאלון 481/482 =====
  math4: {
    name: 'מתמטיקה 4 יח׳',
    emoji: '🔢',
    tabCls: 'tab-math',
    gridCls: 's-math',
    badge: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
    topics: [
      { name: 'אלגברה', emoji: '🔣', sub: 'משוואות, אי-שוויונים, ערך מוחלט' },
      { name: 'פונקציות', emoji: '📈', sub: 'פולינומיות, רציונליות, חקירה' },
      { name: 'פונקציה מעריכית', emoji: '📊', sub: 'e^x, a^x, גדילה ודעיכה' },
      { name: 'פונקציית ln', emoji: '🧮', sub: 'לוגריתם טבעי, חוקים, חקירה' },
      { name: 'טריגונומטריה', emoji: '🔺', sub: 'פתרון משולשים, זהויות בסיסיות' },
      { name: 'חשבון דיפרנציאלי', emoji: '∂', sub: 'נגזרות, חקירת פונקציות' },
      { name: 'חשבון אינטגרלי', emoji: '∫', sub: 'אינטגרל בלתי-מסוים ומסוים' },
      { name: 'גאומטריה אוקלידית', emoji: '📐', sub: 'משולשים, מרובעים, מעגלים' },
      { name: 'גאומטריה אנליטית', emoji: '📍', sub: 'הישר והמעגל' },
      { name: 'סדרות', emoji: '⋯', sub: 'חשבוניות והנדסיות' },
      { name: 'הסתברות', emoji: '🎲', sub: 'הסתברות בסיסית, נוסחאות' },
      { name: 'סטטיסטיקה', emoji: '📉', sub: 'שכיחות, ממוצע, סטיית תקן' },
    ],
  },
  physics: { name: 'פיזיקה', emoji: '⚛️', tabCls: 'tab-physics', gridCls: 's-physics', badge: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.25)' }, topics: [{ name: 'מכניקה', emoji: '🔧', sub: 'כוחות, תנועה' }, { name: 'חשמל', emoji: '⚡', sub: 'מעגלים, שדות' }, { name: 'גלים', emoji: '🌊', sub: 'גלים, עדשות' }, { name: 'תרמודינמיקה', emoji: '🌡️', sub: 'חוקי החום' }, { name: 'קוונטים', emoji: '🔬', sub: 'פוטון, אפקט פוטואלקטרי' }, { name: 'כבידה', emoji: '🪐', sub: 'כוח כבידה, מסלולים' }] },
  english: { name: 'אנגלית', emoji: '🇬🇧', tabCls: 'tab-english', gridCls: 's-english', badge: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.25)' }, topics: [{ name: 'Reading', emoji: '📖', sub: 'הבנת הנקרא' }, { name: 'Grammar', emoji: '📝', sub: 'דקדוק ותחביר' }, { name: 'Vocabulary', emoji: '💬', sub: 'אוצר מילים' }, { name: 'Writing', emoji: '✍️', sub: 'כתיבה' }] },
  history: { name: 'היסטוריה', emoji: '📜', tabCls: 'tab-history', gridCls: 's-history', badge: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' }, topics: [{ name: 'השואה', emoji: '✡️', sub: 'מדיניות נאצית' }, { name: 'מלחמת עולם א׳', emoji: '🗺️', sub: 'סיבות, מהלך' }, { name: 'מלחמת עולם ב׳', emoji: '⚔️', sub: 'חזיתות ותוצאות' }, { name: 'הקמת המדינה', emoji: '🇮🇱', sub: 'ציונות, הכרזה' }, { name: 'המהפכה הצרפתית', emoji: '🗼', sub: 'סיבות ומורשת' }] },
  bible: { name: 'תנ"ך', emoji: '📕', tabCls: 'tab-bible', gridCls: 's-bible', badge: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' }, topics: [{ name: 'בראשית', emoji: '🌿', sub: 'בריאה, אבות' }, { name: 'שמות', emoji: '🔥', sub: 'יציאת מצרים' }, { name: 'שמואל', emoji: '👑', sub: 'שאול ודוד' }, { name: 'מלכים', emoji: '🏛️', sub: 'שלמה, פיצול' }, { name: 'נביאים', emoji: '📣', sub: 'ישעיהו, ירמיהו' }] },
  chem: { name: 'כימיה', emoji: '🧪', tabCls: 'tab-chem', gridCls: 's-chem', badge: { color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.25)' }, topics: [{ name: 'מבנה האטום', emoji: '⚛️', sub: 'מודלים, קשרים' }, { name: 'כימיה אורגנית', emoji: '🧬', sub: 'פחמימנים' }, { name: 'שיווי משקל', emoji: '⚖️', sub: 'לה-שטליה' }, { name: 'חומצות ובסיסים', emoji: '🔬', sub: 'pH, טיטרציה' }, { name: 'אלקטרוכימיה', emoji: '🔋', sub: 'תאים, אלקטרוליזה' }] }
};

// Next.js 16 requires useSearchParams() to be wrapped in a Suspense boundary
// so the rest of the tree can pre-render statically. The inner component
// holds the actual logic; the default export is the Suspense wrapper.
export default function QuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <Quiz />
    </Suspense>
  );
}

function Quiz() {
  const searchParams = useSearchParams();
  const urlSubject = searchParams.get('subject');
  const urlTopic = searchParams.get('topic');

  const [screen, setScreen] = useState('home');
  const [currentSubject, setCurrentSubject] = useState(
    urlSubject && urlSubject in SUBJECTS ? urlSubject : 'math5'
  );
  const [selectedTopic, setSelectedTopic] = useState<string | null>(urlTopic);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const subject = SUBJECTS[currentSubject as keyof typeof SUBJECTS];
  const letters = ['א', 'ב', 'ג', 'ד'];

  // Deep-link auto-start: if /quiz?subject=...&topic=... has both params and
  // the topic has a static question bank, jump straight into the quiz.
  // This is how the TopicJourney "step 2" button gets students into a
  // topic-specific quiz without making them pick again.
  useEffect(() => {
    if (
      urlSubject &&
      urlTopic &&
      urlSubject in SUBJECTS &&
      hasQuestionBank(urlSubject, urlTopic) &&
      screen === 'home'
    ) {
      // Defer one tick so state updates land before startQuiz runs.
      setTimeout(() => startQuiz(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startQuiz = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    setScreen('quiz');
    setCurrentQ(0);
    setScore(0);
    setQuestions([]);
    setAnswered([]);
    setSelectedAnswer(null);
    setIsCorrect(null);

    // ===== STATIC-FIRST PATH =====
    // If we have a hand-written question bank for this subject/topic,
    // serve from it instantly — no API call, no loading wait, no cost.
    // The static PracticeQuestion shape matches what this UI already
    // expects (question + answers + correct), so we filter to MCQs and
    // pick 5 at random.
    if (hasQuestionBank(currentSubject, selectedTopic)) {
      const bank = getQuestions(currentSubject, selectedTopic)
        .filter((q) => q.kind === 'mcq' && Array.isArray(q.answers) && typeof q.correct === 'number');
      // Fisher-Yates shuffle, take 5 (or all available if bank is smaller).
      const shuffled = [...bank];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const picked = shuffled.slice(0, 5).map((q) => ({
        question: q.question,
        answers: q.answers,
        correct: q.correct,
        // Adapt the static `solution` into the structured-explanation shape
        // the existing UI renders.
        explanation: {
          why_correct: `${q.solution.explanation}\n\n${q.solution.steps.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}`,
          why_wrong: '',
          concept: '',
          remember: `**תשובה סופית:** ${q.solution.finalAnswer}`,
        },
      }));

      if (picked.length > 0) {
        setQuestions(picked);
        setLoading(false);
        return;
      }
      // If the bank existed but had no MCQs, fall through to API.
    }

    // ===== API FALLBACK (temporary, removed after migration) =====
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: currentSubject, topic: selectedTopic })
      });

      if (!res.ok) {
        let serverMsg = '';
        try {
          const errData = await res.json();
          serverMsg = errData?.error ?? '';
        } catch {
          serverMsg = await res.text().catch(() => '');
        }
        throw new Error(`HTTP ${res.status}: ${serverMsg || '(no body)'}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.questions) throw new Error('No questions field in response');

      setQuestions(data.questions);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`שגיאה: ${msg}`);
      setScreen('home');
    }
    setLoading(false);
  };

  const checkAnswer = (idx: number) => {
    const q = questions[currentQ];
    const ok = idx === q.correct;
    setSelectedAnswer(idx);
    setIsCorrect(ok);
    setAnswered([...answered, { question: q.question, correct: ok }]);
    if (ok) setScore(score + 1);
  };

  // Persist the completed session to Supabase. Fire-and-forget so the UX
  // never blocks waiting for the network. Errors are logged for debugging
  // but never surfaced to the user — losing a history row is worse UX
  // than blocking the results screen on a flaky DB call.
  const saveSession = (finalScore: number, finalAnswered: Array<{ question: string; correct: boolean }>) => {
    if (!selectedTopic) return;
    const supabase = createClient();
    supabase
      .from('practice_sessions')
      .insert({
        // user_id auto-fills from auth.uid() via the column default in SQL
        subject_key: currentSubject,
        subject_name: subject.name,
        subject_emoji: subject.emoji,
        topic: selectedTopic,
        score: finalScore,
        total: questions.length,
        answered: finalAnswered,
        questions: questions,
      })
      .then(({ error }) => {
        if (error) console.error('[practice_sessions] insert failed:', error);
      });
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    if (currentQ >= questions.length - 1) {
      // This is the transition from the last question to the results
      // screen — the only moment we have the final score AND the full
      // per-question outcome list. Save now.
      saveSession(score, answered);
      setScreen('results');
      // Mark the 'quiz' step in the personalized study plan so the
      // TopicJourney can advance to stage 3 (practice).
      if (selectedTopic) {
        markStep(currentSubject, selectedTopic, 'quiz');
      }
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  const renderHome = () => (
    <div className="home-inner">
      <div className="hero">
        <div className="hero-badge">⚡ AI אמיתי · שאלות בגרות</div>
        <h1>10 דקות<br />ואתה מוכן</h1>
        <p>שאלות בגרות אמיתיות, הסבר מיידי לכל תשובה, בכל מקצוע</p>
      </div>
      <div className="section-label">בחר מקצוע</div>
      <div className="subject-tabs">
        {Object.entries(SUBJECTS).map(([key, s]) => (
          <button key={key} className={`subject-tab ${s.tabCls} ${currentSubject === key ? 'active' : ''}`} onClick={() => { setCurrentSubject(key); setSelectedTopic(null); }}>
            {s.emoji} {s.name}
          </button>
        ))}
      </div>
      <div className="section-label">בחר נושא</div>
      <div className="topics-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {subject.topics.map((t, i) => (
          <div key={i} className={`topic-card ${selectedTopic === t.name ? 'selected' : ''}`} onClick={() => setSelectedTopic(t.name)}>
            <span className="topic-check">✓</span>
            <span className="topic-emoji">{t.emoji}</span>
            <div className="topic-name">{t.name}</div>
            <div className="topic-sub">{t.sub}</div>
          </div>
        ))}
      </div>
      <button className="start-btn" onClick={startQuiz} disabled={!selectedTopic}>
        התחל תרגול →
      </button>
      <a href="/chat" className="chat-link">
        💬 שאל את המורה — צ&apos;אט עם AI
      </a>
      <a href="/history" className="chat-link" style={{ marginTop: '8px' }}>
        📊 ההיסטוריה שלי
      </a>
    </div>
  );

  const renderQuiz = () => {
    if (loading || questions.length === 0) {
      return (
        <div className="quiz-inner">
          <div className="loading-state">
            <div className="loader-ring"></div>
            <div className="loading-tip">
              <strong>{subject.emoji} {subject.name} — {selectedTopic}</strong>
              <span>⚡ מכין לך שאלות עם הסברים מעמיקים...</span>
              <span style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>בדרך כלל 5-15 שניות</span>
            </div>
          </div>
        </div>
      );
    }

    const q = questions[currentQ];
    const pct = Math.round((currentQ / questions.length) * 100);

    return (
      <div className="quiz-inner">
        <div className="quiz-topbar">
          <button className="back-icon-btn" onClick={() => setScreen('home')}>←</button>
          <div className="progress-track">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%` }}></div>
            </div>
            <div className="progress-labels">
              <span className="progress-step">שאלה {currentQ + 1} מ-{questions.length}</span>
              <span className="progress-score">{score} נכון</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '12px' }}>
          <div className="quiz-meta-strip">
            <span className="meta-subject-badge" style={{ color: subject.badge.color, background: subject.badge.bg, borderColor: subject.badge.border }}>
              {subject.emoji} {subject.name}
            </span>
            <span className="meta-topic-label">{selectedTopic}</span>
          </div>
          <div className="question-card">
            <div className="q-number">שאלה {currentQ + 1}</div>
            <div className="q-text math-content">
              <MathText>{q.question}</MathText>
            </div>
          </div>
          <div className="answers">
            {q.answers.map((ans: string, i: number) => (
              <button
                key={i}
                className={`answer-btn ${selectedAnswer === i ? (isCorrect ? 'correct' : 'wrong') : ''}`}
                onClick={() => checkAnswer(i)}
                disabled={selectedAnswer !== null}
              >
                <span className="answer-letter">{letters[i]}</span>
                <span className="answer-text math-content">
                  <MathText inline>{ans}</MathText>
                </span>
              </button>
            ))}
          </div>
          {selectedAnswer !== null && (
            <>
              <div className={`verdict-banner ${isCorrect ? 'verdict-correct' : 'verdict-wrong'}`}>
                {isCorrect ? '✅ נכון! כל הכבוד' : '❌ טעות — אבל בוא נלמד מזה'}
              </div>

              {/* Structured explanation (new rich format).
                  Falls back to plain text for legacy/cached entries.
                  Each text block now renders markdown + LaTeX math via
                  MathText so the AI can use $...$ / $$...$$ to typeset
                  fractions, exponents, ln, integrals, etc. — same as in
                  the /chat page. */}
              {typeof q.explanation === 'string' ? (
                <div className="explanation-box" style={{ display: 'block' }}>
                  <div className="ex-label">הסבר</div>
                  <div className="ex-text math-content">
                    <MathText>{q.explanation}</MathText>
                  </div>
                </div>
              ) : (
                <div className="lesson-stack">
                  {q.explanation?.why_correct && (
                    <div className="lesson-card lesson-correct">
                      <div className="lesson-label">
                        <span className="lesson-icon">✅</span>
                        <span>למה התשובה הנכונה</span>
                      </div>
                      <div className="lesson-text math-content">
                        <MathText>{q.explanation.why_correct}</MathText>
                      </div>
                    </div>
                  )}

                  {q.explanation?.why_wrong && (
                    <div className="lesson-card lesson-wrong">
                      <div className="lesson-label">
                        <span className="lesson-icon">❌</span>
                        <span>למה האחרות שגויות</span>
                      </div>
                      <div className="lesson-text math-content">
                        <MathText>{q.explanation.why_wrong}</MathText>
                      </div>
                    </div>
                  )}

                  {q.explanation?.concept && (
                    <div className="lesson-card lesson-concept">
                      <div className="lesson-label">
                        <span className="lesson-icon">📚</span>
                        <span>הרעיון העקרוני</span>
                      </div>
                      <div className="lesson-text math-content">
                        <MathText>{q.explanation.concept}</MathText>
                      </div>
                    </div>
                  )}

                  {q.explanation?.remember && (
                    <div className="lesson-card lesson-tip">
                      <div className="lesson-label">
                        <span className="lesson-icon">💡</span>
                        <span>טיפ לזכור</span>
                      </div>
                      <div className="lesson-text math-content">
                        <MathText>{q.explanation.remember}</MathText>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                className="start-btn"
                onClick={nextQuestion}
                style={{ marginTop: '12px' }}
              >
                {currentQ >= questions.length - 1 ? 'לתוצאות →' : 'השאלה הבאה →'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    const [emoji, title, sub] = pct === 100 ? ['🏆', 'מושלם!', 'ציון 100 — אתה מוכן לבגרות!'] : pct >= 80 ? ['🔥', 'מצוין!', `${pct}% — כמעט שם!`] : pct >= 60 ? ['👍', 'לא רע!', `${pct}% — חזור על מה שפספסת`] : ['💪', 'יש מה לשפר', `${pct}% — תנסה שוב`];

    return (
      <div className="results-inner">
        <div className="result-hero">
          <span className="result-emoji">{emoji}</span>
          <div className="result-title">{title}</div>
          <div className="result-sub">{sub}</div>
        </div>
        <div className="stats-row">
          <div className="stat-box stat-correct">
            <div className="stat-val">{score}</div>
            <div className="stat-lbl">נכון ✓</div>
          </div>
          <div className="stat-box stat-wrong">
            <div className="stat-val">{total - score}</div>
            <div className="stat-lbl">טעות ✗</div>
          </div>
          <div className="stat-box">
            <div className="stat-val" style={{ color: 'var(--text2)' }}>{total}</div>
            <div className="stat-lbl">שאלות</div>
          </div>
        </div>
        <div className="action-row">
          <button className="start-btn" onClick={startQuiz}>סבב נוסף באותו נושא 🔁</button>
          <button className="btn-outline" onClick={() => setScreen('home')}>בחר נושא אחר</button>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        :root { --bg: #0a0e27; --surface: #12172f; --surface2: #1a2050; --surface3: #252d5e; --border: #2d3a6f; --border2: #3d4d8f; --text: #f0f2ff; --text2: #9aa5d1; --text3: #5f6d9f; --correct: #10b981; --wrong: #ef4444; --accent: #6366f1; --accent2: #ec4899; --radius: 24px; --radius-sm: 14px; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font-heebo), sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; overflow-x: hidden; }
        .bg-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .bg-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.25; }
        .bg-orb-1 { width: 600px; height: 600px; top: -250px; right: -150px; background: #6366f1; animation: orb1 15s ease-in-out infinite alternate; }
        .bg-orb-2 { width: 500px; height: 500px; bottom: -200px; left: -150px; background: #ec4899; animation: orb2 18s ease-in-out infinite alternate; }
        .bg-orb-3 { width: 400px; height: 400px; top: 30%; left: 20%; background: #10b981; animation: orb3 12s ease-in-out infinite alternate; opacity: 0.12; }
        @keyframes orb1 { to { transform: translate(-10%,15%) scale(1.15); } }
        @keyframes orb2 { to { transform: translate(10%,-10%) scale(0.95); } }
        @keyframes orb3 { to { transform: translate(-12%,12%) scale(1.25); } }
        .app { width: 100%; max-width: 520px; display: flex; flex-direction: column; position: relative; z-index: 1; box-shadow: 0 25px 50px rgba(0,0,0,0.5); border-radius: 32px; background: rgba(10,14,39,0.8); backdrop-filter: blur(20px); margin: 20px; }
        .header { padding: 24px 28px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); backdrop-filter: blur(10px); background: rgba(10,14,39,0.9); position: sticky; top: 0; z-index: 10; border-radius: 32px 32px 0 0; }
        .logo { font-family: var(--font-frank-ruhl), serif; font-size: 24px; font-weight: 900; background: linear-gradient(135deg, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .subject-pill { background: var(--surface2); border: 1px solid var(--border); border-radius: 24px; padding: 6px 16px; font-size: 12px; font-weight: 700; color: var(--text2); transition: all 0.3s; letter-spacing: 0.05em; }
        .screen { display: none; flex: 1; flex-direction: column; animation: fadeUp 0.4s cubic-bezier(.4,0,.2,1); }
        .screen.active { display: flex; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        .home-inner { padding: 0 28px 40px; display: flex; flex-direction: column; flex: 1; }
        .hero { padding: 40px 0 32px; text-align: center; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.15)); border: 1.5px solid rgba(99,102,241,0.4); border-radius: 28px; padding: 8px 18px; font-size: 13px; font-weight: 700; color: #6366f1; margin-bottom: 20px; }
        .hero h1 { font-family: var(--font-frank-ruhl), serif; font-size: 36px; font-weight: 900; line-height: 1.2; margin-bottom: 16px; background: linear-gradient(160deg, #f0f2ff 30%, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero p { color: var(--text2); font-size: 15px; line-height: 1.8; max-width: 320px; margin: 0 auto; font-weight: 500; }
        .section-label { font-size: 12px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent); margin-bottom: 16px; margin-top: 8px; }
        .subject-tabs { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 20px; scrollbar-width: none; }
        .subject-tabs::-webkit-scrollbar { display: none; }
        .subject-tab { flex-shrink: 0; background: var(--surface); border: 1.5px solid var(--border); border-radius: 20px; padding: 10px 18px; font-family: var(--font-heebo), sans-serif; font-size: 14px; font-weight: 700; color: var(--text2); cursor: pointer; transition: all 0.25s; white-space: nowrap; }
        .subject-tab:hover { color: var(--text); border-color: var(--accent); transform: translateY(-2px); }
        .subject-tab.active { color: #fff; border-color: var(--accent); background: rgba(99,102,241,0.2); }
        .tab-math.active { border-color: #a78bfa; background: rgba(167,139,250,0.2); color: #a78bfa; }
        .tab-physics.active { border-color: #38bdf8; background: rgba(56,189,248,0.2); color: #38bdf8; }
        .tab-english.active { border-color: #fb923c; background: rgba(251,146,60,0.2); color: #fb923c; }
        .tab-history.active { border-color: #f59e0b; background: rgba(245,158,11,0.2); color: #f59e0b; }
        .tab-bible.active { border-color: #34d399; background: rgba(52,211,153,0.2); color: #34d399; }
        .tab-chem.active { border-color: #f472b6; background: rgba(244,114,182,0.2); color: #f472b6; }
        .topics-grid { display: grid; gap: 12px; margin-bottom: 24px; }
        .topic-card { background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 18px 16px 16px; cursor: pointer; transition: all 0.25s cubic-bezier(.4,0,.2,1); text-align: center; position: relative; overflow: hidden; }
        .topic-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0, rgba(99,102,241,0.1), transparent); pointer-events: none; }
        .topic-card:hover { transform: translateY(-4px); border-color: var(--accent); box-shadow: 0 12px 32px rgba(99,102,241,0.15); }
        .topic-card.selected { background: linear-gradient(135deg, var(--surface2) 0%, var(--surface3) 100%); border-color: var(--accent); transform: translateY(-4px); box-shadow: 0 16px 40px rgba(99,102,241,0.25); }
        .topic-check { position: absolute; top: 12px; left: 12px; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #fff; opacity: 0; transform: scale(0.3); transition: all 0.25s cubic-bezier(.34,1.56,.64,1); background: var(--accent); }
        .topic-card.selected .topic-check { opacity: 1; transform: scale(1); }
        .topic-emoji { font-size: 32px; margin-bottom: 10px; display: block; line-height: 1; }
        .topic-name { font-size: 14px; font-weight: 700; color: var(--text); line-height: 1.3; position: relative; z-index: 1; }
        .topic-sub { font-size: 12px; color: var(--text3); margin-top: 4px; position: relative; z-index: 1; }
        .start-btn { width: 100%; padding: 16px; border: none; border-radius: var(--radius); font-family: var(--font-heebo), sans-serif; font-size: 16px; font-weight: 800; color: #fff; cursor: pointer; background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); box-shadow: 0 8px 24px rgba(99,102,241,0.4); transition: all 0.25s cubic-bezier(.4,0,.2,1); margin-top: auto; letter-spacing: 0.05em; }
        .start-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(99,102,241,0.6); }
        .start-btn:active:not(:disabled) { transform: translateY(-1px); }
        .start-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .chat-link { display: block; text-align: center; margin-top: 12px; padding: 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border); background: var(--surface); color: var(--text2); font-family: var(--font-heebo), sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; transition: all 0.25s; }
        .chat-link:hover { color: var(--text); border-color: var(--accent2); background: var(--surface2); }
        .quiz-inner { padding: 20px 28px 32px; display: flex; flex-direction: column; flex: 1; gap: 16px; }
        .quiz-topbar { display: flex; align-items: center; gap: 14px; }
        .back-icon-btn { width: 40px; height: 40px; background: var(--surface); border: 1.5px solid var(--border); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer; transition: all 0.2s; flex-shrink: 0; font-family: 'Heebo', sans-serif; color: var(--text2); }
        .back-icon-btn:hover { border-color: var(--accent); color: var(--text); background: var(--surface2); }
        .progress-track { flex: 1; }
        .progress-bar { height: 6px; background: var(--surface2); border-radius: 4px; overflow: hidden; border: 1px solid var(--border); }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #ec4899); border-radius: 3px; transition: width 0.5s cubic-bezier(.4,0,.2,1); }
        .progress-labels { display: flex; justify-content: space-between; margin-top: 8px; }
        .progress-step { font-size: 12px; color: var(--text3); font-weight: 600; }
        .progress-score { font-size: 12px; font-weight: 800; color: var(--correct); }
        .quiz-meta-strip { display: flex; align-items: center; gap: 10px; }
        .meta-subject-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 24px; font-size: 13px; font-weight: 700; border: 1.5px solid; white-space: nowrap; background: rgba(99,102,241,0.1); }
        .meta-topic-label { font-size: 13px; color: var(--text3); font-weight: 600; }
        .question-card { background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%); border: 1.5px solid var(--border); border-radius: 24px; padding: 28px; position: relative; overflow: hidden; }
        .question-card::after { content: ''; position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(ellipse, rgba(99,102,241,0.15), transparent 70%); pointer-events: none; }
        .q-number { font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }
        .q-text { font-size: 17px; line-height: 1.8; font-weight: 600; color: var(--text); position: relative; z-index: 1; unicode-bidi: plaintext; text-align: start; }
        .answers { display: flex; flex-direction: column; gap: 11px; }
        .answer-btn { background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 15px 18px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: all 0.2s ease; font-family: var(--font-heebo), sans-serif; color: var(--text); font-size: 15px; font-weight: 600; line-height: 1.5; text-align: right; }
        .answer-btn:hover:not(:disabled) { border-color: var(--accent); background: linear-gradient(135deg, var(--surface2) 0%, var(--surface3) 100%); transform: translateX(-3px); box-shadow: 0 4px 12px rgba(99,102,241,0.1); }
        .answer-btn:disabled { cursor: default; }
        .answer-btn.correct { border-color: var(--correct); background: rgba(16,185,129,0.1); color: var(--correct); }
        .answer-btn.wrong { border-color: var(--wrong); background: rgba(239,68,68,0.1); color: var(--wrong); }
        .answer-letter { min-width: 34px; height: 34px; background: var(--surface2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: var(--accent); flex-shrink: 0; transition: all 0.2s; border: 1.5px solid var(--border); }
        .answer-btn.correct .answer-letter { background: rgba(16,185,129,0.15); color: var(--correct); border-color: var(--correct); }
        .answer-btn.wrong .answer-letter { background: rgba(239,68,68,0.15); color: var(--wrong); border-color: var(--wrong); }
        .explanation-box { background: linear-gradient(135deg, var(--surface2) 0%, var(--surface3) 100%); border: 1.5px solid var(--border); border-left: 4px solid var(--accent); border-radius: var(--radius-sm); padding: 16px 18px; animation: fadeUp 0.35s ease; }
        .ex-label { font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
        .ex-text { font-size: 14px; line-height: 1.8; color: var(--text2); font-weight: 500; }
        /* ===== Verdict banner (correct/wrong header) ===== */
        .verdict-banner { padding: 14px 18px; border-radius: var(--radius-sm); font-size: 16px; font-weight: 800; text-align: center; letter-spacing: 0.02em; animation: fadeUp 0.35s ease; border: 1.5px solid; }
        .verdict-correct { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.4); color: #34d399; }
        .verdict-wrong { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.4); color: #f87171; }
        /* ===== Lesson cards (rich explanation - 4 sections) ===== */
        .lesson-stack { display: flex; flex-direction: column; gap: 10px; animation: fadeUp 0.4s ease; }
        .lesson-card { background: linear-gradient(135deg, var(--surface2) 0%, var(--surface3) 100%); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 14px 16px; transition: transform 0.2s ease, border-color 0.2s ease; }
        .lesson-card:hover { transform: translateX(-2px); }
        .lesson-correct { border-right: 4px solid #10b981; }
        .lesson-correct:hover { border-color: rgba(16,185,129,0.4); }
        .lesson-wrong { border-right: 4px solid #ef4444; }
        .lesson-wrong:hover { border-color: rgba(239,68,68,0.4); }
        .lesson-concept { border-right: 4px solid #6366f1; }
        .lesson-concept:hover { border-color: rgba(99,102,241,0.4); }
        .lesson-tip { border-right: 4px solid #f59e0b; background: linear-gradient(135deg, rgba(245,158,11,0.05) 0%, var(--surface3) 100%); }
        .lesson-tip:hover { border-color: rgba(245,158,11,0.4); }
        .lesson-label { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; color: var(--text2); margin-bottom: 8px; text-transform: uppercase; }
        .lesson-icon { font-size: 16px; line-height: 1; }
        /* unicode-bidi: plaintext + text-align: start handles mixed Hebrew + math
           cleanly. Without it, "P(רק בנים) = C(5,3)/C(8,3)" renders as garbled
           order because the browser flips LTR fragments inside an RTL block. */
        .lesson-text { font-size: 14px; line-height: 1.85; color: var(--text); font-weight: 500; unicode-bidi: plaintext; text-align: start; }
        .loading-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: 50px 40px; }
        .loader-ring { width: 64px; height: 64px; position: relative; }
        .loader-ring::before, .loader-ring::after { content: ''; position: absolute; inset: 0; border-radius: 50%; border: 3px solid transparent; }
        .loader-ring::before { border-top-color: #6366f1; animation: spin 0.9s linear infinite; }
        .loader-ring::after { border-bottom-color: #ec4899; animation: spin 1.3s linear infinite reverse; inset: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-tip { text-align: center; font-size: 15px; color: var(--text2); line-height: 1.8; max-width: 280px; font-weight: 500; }
        .loading-tip strong { color: var(--text); display: block; margin-bottom: 6px; font-size: 16px; font-weight: 800; }
        .results-inner { padding: 32px 28px 40px; display: flex; flex-direction: column; align-items: center; gap: 28px; flex: 1; }
        .result-hero { text-align: center; }
        .result-emoji { font-size: 60px; line-height: 1; margin-bottom: 16px; display: block; animation: bounce 0.8s ease; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .result-title { font-family: var(--font-frank-ruhl), serif; font-size: 32px; font-weight: 900; margin-bottom: 8px; background: linear-gradient(135deg, #f0f2ff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .result-sub { font-size: 15px; color: var(--text2); line-height: 1.7; font-weight: 500; }
        .stats-row { display: flex; gap: 12px; width: 100%; }
        .stat-box { flex: 1; background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 18px; text-align: center; }
        .stat-val { font-size: 26px; font-weight: 900; margin-bottom: 4px; }
        .stat-lbl { font-size: 12px; color: var(--text3); font-weight: 700; letter-spacing: 0.05em; }
        .stat-correct .stat-val { color: var(--correct); }
        .stat-wrong .stat-val { color: var(--wrong); }
        .action-row { display: flex; flex-direction: column; gap: 12px; width: 100%; }
        .btn-outline { background: transparent; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 15px; font-family: var(--font-heebo), sans-serif; font-size: 15px; font-weight: 700; color: var(--text2); cursor: pointer; transition: all 0.25s; letter-spacing: 0.05em; }
        .btn-outline:hover { color: var(--text); background: var(--surface); border-color: var(--accent); }
      `}</style>

      <div className="bg-layer">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>

      <div className="app">
        <div className="header">
          <span className="logo">בגרות בכיס ✦</span>
          <form action="/auth/signout" method="post" style={{ margin: 0 }}>
            <button
              type="submit"
              className="subject-pill"
              style={{ cursor: 'pointer', background: 'transparent', fontFamily: 'inherit' }}
              title="התנתק"
            >
              ← התנתק
            </button>
          </form>
        </div>

        <div className={`screen ${screen === 'home' ? 'active' : ''}`}>
          {renderHome()}
        </div>

        <div className={`screen ${screen === 'quiz' ? 'active' : ''}`}>
          {renderQuiz()}
        </div>

        <div className={`screen ${screen === 'results' ? 'active' : ''}`}>
          {renderResults()}
        </div>
      </div>
    </>
  );
}
