import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MathUpLogo from '@/components/MathUpLogo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מדיניות פרטיות — MathUp',
  description: 'מדיניות הפרטיות של MathUp: איזה מידע נאסף, איך הוא מאוחסן, ומה הזכויות שלך.',
};

const LAST_UPDATED = '28 במאי 2026';
const CONTACT_EMAIL = 'meitalm1020@gmail.com';

export default function PrivacyPolicyPage() {
  return (
    <div
      className="min-h-screen text-slate-800 relative overflow-x-hidden"
      style={{ fontFamily: 'var(--font-heebo), sans-serif' }}
    >
      <BackgroundOrbs />
      <TopBar />

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
        <header className="text-center space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-black">
            <span className="font-display text-slate-900">
              מדיניות פרטיות
            </span>
          </h1>
          <p className="text-xs text-slate-600">עודכן לאחרונה: {LAST_UPDATED}</p>
        </header>

        <article className="surface-premium rounded-3xl p-6 sm:p-8 space-y-1 text-sm sm:text-base text-slate-700 leading-relaxed">
          <Section title="1. מי אנחנו">
            <p>
              <strong className="text-slate-900">&quot;MathUp&quot;</strong> (להלן: &quot;השירות&quot; או &quot;האתר&quot;) הוא פלטפורמת תרגול עצמית לתלמידי תיכון לקראת בחינות הבגרות. השירות מופעל באופן עצמאי על-ידי בעלים פרטי בישראל.
            </p>
            <p>
              לכל פנייה בנושאי פרטיות, ניתן ליצור קשר בכתובת:{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-violet-700 hover:text-violet-800 underline-offset-2 hover:underline"
                dir="ltr"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="2. איזה מידע אנחנו אוספים">
            <p>במסגרת השימוש בשירות, נאסף עליך המידע הבא:</p>
            <ul className="list-disc pr-5 space-y-2">
              <li><strong className="text-slate-900">פרטי חשבון:</strong> כתובת אימייל וסיסמה (הסיסמה נשמרת ב-hash בלבד — אין לנו גישה לסיסמה עצמה).</li>
              <li><strong className="text-slate-900">תוכן שיצרת בשירות:</strong> הודעות צ&apos;אט עם המורה הווירטואלי, תשובות לתרגילים, התקדמות בנושאים, תוכניות לימוד שיצרת.</li>
              <li><strong className="text-slate-900">תמונות:</strong> אם השתמשת בפיצ&apos;ר &quot;צילום שאלה&quot;, התמונה מועברת לעיבוד AI ואינה נשמרת באופן קבוע אצלנו.</li>
              <li><strong className="text-slate-900">מטא-דאטה טכנית:</strong> כתובת IP, סוג דפדפן ומערכת הפעלה — לצורך אבטחה והגנה מפני ניצול לרעה.</li>
            </ul>
          </Section>

          <Section title="3. למה אנחנו אוספים את המידע">
            <ul className="list-disc pr-5 space-y-2">
              <li>כדי לספק לך את השירות — לאמת את החשבון שלך, לשמור התקדמות, להציג תוכניות לימוד מותאמות.</li>
              <li>כדי לשפר את השירות — לזהות תקלות, להבין אילו פיצ&apos;רים פעילים, לבדוק שאיכות התוכן עומדת בסטנדרט.</li>
              <li>כדי למנוע ניצול לרעה — לחסום בוטים, להגביל קצב בקשות, להגן מפני התקפות.</li>
            </ul>
          </Section>

          <Section title="4. שותפים שלישיים">
            <p>השירות מסתמך על ספקים שלישיים שמעבדים חלק מהמידע עבורנו:</p>
            <ul className="list-disc pr-5 space-y-2">
              <li>
                <strong className="text-slate-900">Supabase</strong> — אחסון בסיס הנתונים וניהול חשבונות.
                {' '}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-700 hover:text-violet-800 underline-offset-2 hover:underline"
                >
                  מדיניות פרטיות של Supabase
                </a>.
              </li>
              <li>
                <strong className="text-slate-900">Anthropic</strong> — מעבד את הודעות הצ&apos;אט והבקשות ל-AI דרך מודלי Claude.
                {' '}
                <a
                  href="https://www.anthropic.com/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-700 hover:text-violet-800 underline-offset-2 hover:underline"
                >
                  מדיניות פרטיות של Anthropic
                </a>.
              </li>
              <li>
                <strong className="text-slate-900">Vercel</strong> — מארח את האתר ומספק תשתית הרצה.
                {' '}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-700 hover:text-violet-800 underline-offset-2 hover:underline"
                >
                  מדיניות פרטיות של Vercel
                </a>.
              </li>
            </ul>
            <p>אנחנו לא מוכרים את המידע שלך לאף גורם אחר ולא משתמשים בו לצרכי שיווק חיצוני.</p>
          </Section>

          <Section title="5. משך אחסון המידע">
            <p>
              המידע שלך נשמר כל עוד החשבון שלך פעיל. אם תבקש למחוק את חשבונך, נמחק את כל הנתונים האישיים הקשורים אליך תוך 30 ימים מהבקשה (פרט למידע שהחוק מחייב אותנו לשמור — למשל לוגים לצורכי אבטחה).
            </p>
          </Section>

          <Section title="6. Cookies">
            <p>
              האתר משתמש ב-cookies חיוניים בלבד — אלו הדרושים להתחברות לחשבון ולשמירת ה-session שלך. איננו משתמשים ב-cookies מעקב לצרכי פרסום או profiling. אם תוסיף הסכמה לאנליטיקס בעתיד — נעדכן את המדיניות הזו ונבקש את הסכמתך מראש.
            </p>
          </Section>

          <Section title="7. קטינים">
            <p>
              השירות מיועד לתלמידים מגיל <strong className="text-slate-900">16 ומעלה</strong>. תלמידים מתחת לגיל 18 רשאים להירשם רק באישור הורה או אפוטרופוס. אם הינך הורה ונודע לך שילדך מתחת לגיל 16 פתח חשבון בשירות — פנה אלינו ונמחק את החשבון.
            </p>
          </Section>

          <Section title="8. הזכויות שלך">
            <p>על-פי חוק הגנת הפרטיות, התשמ&quot;א-1981 (וכן תיקון 13 משנת 2025), עומדות לרשותך הזכויות הבאות:</p>
            <ul className="list-disc pr-5 space-y-2">
              <li><strong className="text-slate-900">זכות עיון</strong> — לבקש לראות איזה מידע אנחנו מחזיקים עליך.</li>
              <li><strong className="text-slate-900">זכות תיקון</strong> — לבקש לתקן מידע שגוי.</li>
              <li><strong className="text-slate-900">זכות מחיקה</strong> — לבקש למחוק את חשבונך ואת המידע האישי הקשור אליו.</li>
              <li><strong className="text-slate-900">זכות הגבלה</strong> — לבקש להגביל עיבוד של חלק מהמידע.</li>
            </ul>
            <p>
              לממש זכות כלשהי — שלח בקשה לאימייל שצוין למעלה. נשיב תוך 30 ימים.
            </p>
          </Section>

          <Section title="9. אבטחת מידע">
            <p>אנחנו נוקטים באמצעי אבטחה מקובלים להגנה על המידע שלך:</p>
            <ul className="list-disc pr-5 space-y-2">
              <li>תקשורת מוצפנת (HTTPS) בכל הבקשות לאתר.</li>
              <li>סיסמאות נשמרות בצורה מוצפנת (hash) — לא ניתן לשחזר אותן גם אצלנו.</li>
              <li>הפרדת גישות במסד הנתונים (Row Level Security) — משתמש יכול לראות רק את המידע שלו.</li>
              <li>הגנה מפני בוטים, rate-limiting והגבלות גישה ל-API.</li>
            </ul>
            <p>
              עם זאת, אין מערכת ב-100% חסינה. במקרה של אירוע אבטחה משמעותי — נודיע למשתמשים המושפעים ולרשויות הרלוונטיות כנדרש בחוק.
            </p>
          </Section>

          <Section title="10. שינויים במדיניות">
            <p>
              אנחנו רשאים לעדכן את המדיניות הזו מעת לעת. שינוי מהותי יתעדכן בעמוד זה ויסומן בעדכון התאריך שבראש העמוד. אם השינוי משמעותי — נשלח גם הודעה למייל הרשום בחשבונך.
            </p>
          </Section>

          <Section title="11. דין שולט וסמכות שיפוט">
            <p>
              מדיניות זו כפופה לחוקי מדינת ישראל. סמכות השיפוט הבלעדית לכל מחלוקת הנובעת ממדיניות זו תהיה לבתי המשפט המוסמכים בתל אביב-יפו.
            </p>
          </Section>
        </article>

        <footer className="text-center pt-4 pb-8 text-xs text-slate-500 space-x-2 space-x-reverse">
          <Link href="/terms" className="hover:text-slate-900 underline-offset-2 hover:underline">
            תנאי שימוש
          </Link>
          <span>·</span>
          <Link href="/" className="hover:text-slate-900 underline-offset-2 hover:underline">
            דף הבית
          </Link>
        </footer>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-6 first:pt-0 space-y-3">
      <h2 className="font-display text-lg font-black text-slate-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-400/12 blur-[130px] animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-400/10 blur-[130px] animate-pulse"
        style={{ animationDuration: '10s', animationDelay: '2s' }}
      />
    </div>
  );
}

function TopBar() {
  return (
    <nav className="md:hidden sticky top-0 z-50 glass-card border-x-0 border-t-0 rounded-none">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <MathUpLogo size="md" />
          <div>
            <div className="text-base font-black font-display text-slate-900">
              MathUp
            </div>
            <div className="text-[10px] text-slate-600 -mt-0.5">מדיניות פרטיות</div>
          </div>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 bg-white/70 hover:bg-white border border-white/60 hover:border-violet-500/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
        >
          <span>חזרה</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>
    </nav>
  );
}
