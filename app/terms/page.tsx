import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MathUpLogo from '@/components/MathUpLogo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'תנאי שימוש — MathUp',
  description: 'תנאי השימוש של MathUp: כללי השימוש בשירות, אחריות, וזכויות.',
};

const LAST_UPDATED = '28 במאי 2026';
const CONTACT_EMAIL = 'meitalm1020@gmail.com';

export default function TermsPage() {
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
              תנאי שימוש
            </span>
          </h1>
          <p className="text-xs text-slate-600">עודכן לאחרונה: {LAST_UPDATED}</p>
        </header>

        <article className="surface-premium rounded-3xl p-6 sm:p-8 space-y-1 text-sm sm:text-base text-slate-700 leading-relaxed">
          <Section title="1. תיאור השירות">
            <p>
              <strong className="text-slate-900">"MathUp"</strong> הוא כלי לעזרה עצמית בלימודי הבגרות בישראל. השירות מציע: תרגול נושאי לימוד, יצירת שאלות ופתרונות באמצעות AI, צילום שאלות לפתרון, ומאגר בגרויות עבר.
            </p>
            <p>
              <strong className="text-slate-900">חשוב להבין:</strong> השירות נועד להיות עזר לימוד בלבד, ואינו מהווה תחליף למורה, למבחן רשמי, או לתוכנית לימודים בית-ספרית. תוצאות התרגול וההסברים נוצרים באמצעות AI ועלולים להכיל טעויות. האחריות הסופית לאימות הנכונות של כל פתרון חלה על המשתמש.
            </p>
          </Section>

          <Section title="2. כשירות לשימוש">
            <ul className="list-disc pr-5 space-y-2">
              <li>השימוש בשירות מותר מגיל <strong className="text-slate-900">16 ומעלה</strong>.</li>
              <li>משתמשים מתחת לגיל 18 — חייבים לקבל את הסכמת הורה או אפוטרופוס לפני ההרשמה.</li>
              <li>הרשמה לשירות מהווה הצהרה שעמדת בתנאי הכשירות הללו.</li>
            </ul>
          </Section>

          <Section title="3. חשבון משתמש">
            <ul className="list-disc pr-5 space-y-2">
              <li>אתה אחראי לשמירה על סודיות פרטי הגישה לחשבונך (אימייל וסיסמה).</li>
              <li>חשבון אחד למשתמש. אסור לשתף את החשבון שלך עם אדם אחר.</li>
              <li>חובה לספק כתובת אימייל אמיתית בעת ההרשמה.</li>
              <li>אנחנו רשאים להשעות או לחסום חשבונות שמפרים את התנאים האלה.</li>
            </ul>
          </Section>

          <Section title="4. שימוש מותר ואסור">
            <p>במהלך השימוש בשירות, אתה מתחייב <strong className="text-slate-900">לא</strong>:</p>
            <ul className="list-disc pr-5 space-y-2">
              <li>להשתמש בבוטים, סקריפטים אוטומטיים, או scraping של תוכן.</li>
              <li>לנסות לעקוף הגבלות שימוש, מנגנוני אבטחה, או חסימות תשלום.</li>
              <li>לנסות לחלץ את ה-prompts הפנימיים של ה-AI או לתפעל אותו לפעולות שאינן לימודיות.</li>
              <li>לשתף את חשבונך עם אדם נוסף.</li>
              <li>להשתמש בשירות תוך כדי בחינת בגרות ממשית — זה מהווה הפרה של תקנות משרד החינוך, ויכולה להוביל לפסילת הבחינה.</li>
              <li>להעלות תוכן בלתי-חוקי, פוגעני, מטעה או המפר זכויות יוצרים.</li>
              <li>לנצל את השירות לרעה באופן שיגרום לעלויות תשתית מופרזות (למשל ניסיון לבזבז אסימוני AI במכוון).</li>
            </ul>
          </Section>

          <Section title="5. תוכן וזכויות יוצרים">
            <ul className="list-disc pr-5 space-y-2">
              <li>
                <strong className="text-slate-900">תוכן השירות</strong> (שיעורים, סיכומים, דיאגרמות, עיצוב האתר) הוא קניינו של "MathUp" ומוגן בזכויות יוצרים. אסור להעתיק, להפיץ או למכור אותו ללא רשות.
              </li>
              <li>
                <strong className="text-slate-900">שאלות מבגרויות עבר</strong> שמוצגות במאגר — הן רכוש משרד החינוך והן מצורפות בשירות לפי הוראות שימוש הוגן לצרכים לימודיים. הפתרונות עצמם נכתבים על-ידינו.
              </li>
              <li>
                <strong className="text-slate-900">התוכן שאתה יוצר</strong> (תשובות שכתבת, הודעות צ'אט) — הוא שלך. בשימוש בשירות אתה מעניק לנו רישיון מוגבל להשתמש בו כדי לספק לך את השירות (לדוגמה, לשמור היסטוריה ולשלוח את ההודעה ל-AI לעיבוד).
              </li>
            </ul>
          </Section>

          <Section title="6. הצהרה לגבי AI">
            <p>
              חלק מהפיצ'רים בשירות מבוססים על מודלי AI של חברת Anthropic (Claude). מודלי AI הם כלי סטטיסטי ואינם מובטחים להיות מדויקים. תשובות שגויות, חלקיות או מטעות יכולות להופיע — במיוחד בנושאים מתמטיים מורכבים או בחישובים.
            </p>
            <p>
              <strong className="text-slate-900">המשתמש חייב לאמת כל פתרון או הסבר באופן עצמאי</strong> מול ספרי לימוד, מורים, או מקורות מהימנים אחרים. השירות אינו אחראי לתוצאות אקדמיות, ציוני בגרות, או החלטות שתקבל על סמך תכני AI.
            </p>
          </Section>

          <Section title="7. הגבלת אחריות">
            <p>
              השירות ניתן <strong className="text-slate-900">"כפי שהוא" (AS IS)</strong>, ללא כל הבטחה — מפורשת או משתמעת — לנוגע ל:
            </p>
            <ul className="list-disc pr-5 space-y-2">
              <li>שיפור הציון שלך בבגרות.</li>
              <li>נכונות, שלמות או עדכניות של התוכן (כולל פתרונות AI).</li>
              <li>זמינות רציפה של השירות (יתכנו תקלות, תחזוקה או הפסקות שירות).</li>
            </ul>
            <p>
              בכל מקרה שבו נימצא אחראים על נזק כלשהו — סכום האחריות המקסימלי שלנו יוגבל לסכום ששילמת לנו בששת החודשים האחרונים (אם בכלל). כיום השירות בחינם, ולכן הגבלת האחריות היא בפועל ₪0.
            </p>
            <p>
              הגבלה זו לא חלה במקרה של הפרת חוק הגנת הצרכן, מעשי זדון, או רשלנות חמורה מצידנו.
            </p>
          </Section>

          <Section title="8. סיום השירות">
            <ul className="list-disc pr-5 space-y-2">
              <li>אנחנו רשאים לסיים או להשעות את חשבונך אם הפרת את התנאים האלה, או אם השירות צריך להפסיק לפעול מסיבות עסקיות.</li>
              <li>אתה רשאי למחוק את חשבונך בכל עת על-ידי פנייה אלינו באימייל.</li>
              <li>לאחר סיום החשבון — לא תוכל לגשת לנתונים שלך. מומלץ לשמור עותקים של כל מידע חשוב לך לפני המחיקה.</li>
            </ul>
          </Section>

          <Section title="9. שינויים בתנאים">
            <p>
              אנחנו רשאים לעדכן את התנאים האלה מעת לעת. שינוי מהותי יסומן בעדכון התאריך שבראש העמוד ויפורסם כאן. במידה והשינוי משמעותי — נשלח גם הודעה למייל הרשום בחשבונך 14 ימים לפני שהתנאים החדשים יכנסו לתוקף.
            </p>
            <p>
              המשך שימוש בשירות לאחר עדכון התנאים מהווה הסכמה לתנאים החדשים.
            </p>
          </Section>

          <Section title="10. דין שולט וסמכות שיפוט">
            <p>
              תנאים אלה כפופים לחוקי מדינת ישראל. סמכות השיפוט הבלעדית לכל מחלוקת הנובעת מתנאים אלה תהיה לבתי המשפט המוסמכים בתל אביב-יפו.
            </p>
          </Section>

          <Section title="11. יצירת קשר">
            <p>
              לכל שאלה, תלונה או בקשה בנוגע לתנאים אלה — ניתן ליצור קשר בכתובת:{' '}
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
        </article>

        <footer className="text-center pt-4 pb-8 text-xs text-slate-500 space-x-2 space-x-reverse">
          <Link href="/privacy" className="hover:text-slate-900 underline-offset-2 hover:underline">
            מדיניות פרטיות
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
            <div className="text-[10px] text-slate-600 -mt-0.5">תנאי שימוש</div>
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
