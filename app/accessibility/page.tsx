import type { Metadata } from 'next';
import Link from 'next/link';

// An accessibility statement is a legal document, not marketing. Two rules
// govern what may be written here:
//
//   1. Only claim what has been MEASURED. Israeli regulations treat a false
//      declaration as worse than none, and "conforms to AA" is a claim about
//      every page, not about the ones that were checked. This page therefore
//      says "בתהליך התאמה" and lists what is actually done.
//   2. The known-limitations section is mandatory in spirit and in practice —
//      it is what makes the rest of the document credible.
//
// ⚠️ ITAY: replace ACCESSIBILITY_EMAIL with a dedicated address before this
// goes public. The regulations require a reachable contact for accessibility
// requests; a personal inbox works but a role address ages better.
const ACCESSIBILITY_EMAIL = 'meitalm1020@gmail.com';
const LAST_UPDATED = '16 באוגוסט 2026';

export const metadata: Metadata = {
  title: 'הצהרת נגישות | MathUp',
  description:
    'הצהרת הנגישות של MathUp — מצב ההתאמה לתקן הישראלי ת"י 5568 ולהנחיות WCAG 2.1 ברמה AA, ההתאמות שבוצעו, המגבלות הידועות ודרכי הפנייה.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900">{title}</h2>
      <div className="space-y-3 text-slate-700 leading-relaxed">{children}</div>
    </section>
  );
}

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen px-5 py-12 sm:py-16">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900">
            הצהרת נגישות
          </h1>
          <p className="text-slate-600">
            עודכן לאחרונה: {LAST_UPDATED}
          </p>
        </header>

        <div className="surface-premium rounded-2xl p-6 sm:p-8 space-y-8">
          <Section title="המחויבות שלנו">
            <p>
              MathUp היא פלטפורמת תרגול למתמטיקה לבגרות. אנחנו מאמינים שהיכולת ללמוד
              ולהיבחן לא צריכה להיות תלויה בדרך שבה מישהו קורא מסך, מזיז עכבר או תופס
              צבע. אנחנו פועלים להתאים את האתר להנחיות{' '}
              <span dir="ltr" className="font-mono text-sm">WCAG 2.1</span> ברמה{' '}
              <span dir="ltr" className="font-mono text-sm">AA</span> ולתקן הישראלי
              ת&quot;י 5568.
            </p>
            <p className="font-bold text-slate-900">
              האתר נמצא בתהליך התאמה מתמשך. הרשימה למטה מתארת מה כבר נבדק ומה עדיין לא —
              במכוון, ובלי לטשטש.
            </p>
          </Section>

          <Section title="מה כבר מותאם">
            <ul className="list-disc pr-5 space-y-2 marker:text-violet-600">
              <li>
                <strong className="text-slate-900">ניווט מקלדת מלא</strong> — כל פעולה
                שאפשר לעשות בעכבר אפשר לעשות במקלדת, עם סימון פוקוס נראה בכל רכיב
                אינטראקטיבי וסדר מעבר הגיוני.
              </li>
              <li>
                <strong className="text-slate-900">קישור דילוג לתוכן</strong> — הפריט
                הראשון בסדר המקלדת בכל עמוד, שמדלג מעל סרגלי הניווט הקבועים.
              </li>
              <li>
                <strong className="text-slate-900">חלונות ותפריטים</strong> — מוגדרים
                כדיאלוג, לוכדים את הפוקוס כל עוד הם פתוחים, נסגרים ב-Esc ומחזירים את
                הפוקוס לכפתור שפתח אותם.
              </li>
              <li>
                <strong className="text-slate-900">הכרזות קוליות</strong> — תשובה נכונה
                או שגויה, פתיחת רמז וחשיפת פתרון מוכרזות לקורא מסך ולא רק משנות צבע.
              </li>
              <li>
                <strong className="text-slate-900">נוסחאות מתמטיות</strong> — נבנות
                באמצעות KaTeX ונפלטות גם כ-MathML, כך שקורא מסך מקריא את הנוסחה עצמה ולא
                את הסימנים הגרפיים שמרכיבים אותה.
              </li>
              <li>
                <strong className="text-slate-900">עברית ומתמטיקה יחד</strong> — האתר כולו
                בכיוון ימין-לשמאל, והנוסחאות מבודדות לכיוון שמאל-לימין כדי שמשפט מעורב
                ייקרא בסדר הנכון.
              </li>
              <li>
                <strong className="text-slate-900">ניגודיות צבע</strong> — צבעי הליבה
                נמדדו מול הרקע ותועדו; טקסט רגיל עומד ביחס 4.5:1 לפחות. צבע לעולם אינו
                המידע היחיד — לצידו יש תמיד טקסט או סמל.
              </li>
              <li>
                <strong className="text-slate-900">העדפות מערכת</strong> — האתר מכבד
                &quot;הפחתת תנועה&quot;, &quot;הפחתת שקיפות&quot; ומצב ניגודיות גבוהה של
                מערכת ההפעלה.
              </li>
              <li>
                <strong className="text-slate-900">הגדלת טקסט</strong> — אין חסימת זום;
                אפשר להגדיל את התצוגה עד פי 5.
              </li>
            </ul>
          </Section>

          <Section title="מגבלות ידועות">
            <p>
              אלה החלקים שאנחנו יודעים שעדיין אינם מותאמים במלואם. הם בטיפול:
            </p>
            <ul className="list-disc pr-5 space-y-2 marker:text-amber-600">
              <li>
                חלק מהחלונות הצפים באזורים הפנימיים של האפליקציה טרם קיבלו את סמנטיקת
                הדיאלוג המלאה ואת מלכודת הפוקוס.
              </li>
              <li>
                שרטוטים גאומטריים מוצגים כגרפיקה וקטורית ללא תיאור מילולי מלא. תלמיד
                שמשתמש בקורא מסך יקבל את נוסח השאלה אך לא את השרטוט.
              </li>
              <li>
                נוסחאות מורכבות במיוחד — אינטגרלים מקוננים, מטריצות — נקראות על ידי חלק
                מקוראי המסך בצורה מסורבלת. זו מגבלה של MathML עצמו, ואנחנו בוחנים תיאורים
                מילוליים חלופיים.
              </li>
              <li>
                תכונת הסריקה (צילום שאלה) מחייבת מצלמה ואינה מציעה כרגע חלופה שוות ערך
                למי שאינו יכול לצלם. אפשר להקליד את השאלה ידנית במקום.
              </li>
            </ul>
          </Section>

          <Section title="פנייה בנושא נגישות">
            <p>
              נתקלת בבעיית נגישות, או שיש לך הצעה לשיפור? זה בדיוק המידע שאנחנו צריכים.
              נשמח לשמוע — נשתדל להשיב בתוך 5 ימי עסקים.
            </p>
            <p>
              <a
                href={`mailto:${ACCESSIBILITY_EMAIL}?subject=${encodeURIComponent('נגישות — MathUp')}`}
                className="text-violet-700 font-bold underline underline-offset-4 hover:text-violet-800"
              >
                {ACCESSIBILITY_EMAIL}
              </a>
            </p>
            <p className="text-sm text-slate-600">
              כשפונים, מה שהכי עוזר לנו: באיזה עמוד היית, באיזו טכנולוגיה מסייעת השתמשת
              (קורא מסך ודפדפן), ומה ניסית לעשות כשנתקעת.
            </p>
          </Section>
        </div>

        <p className="text-center">
          <Link href="/" className="text-violet-700 font-bold hover:text-violet-800">
            ← חזרה לדף הבית
          </Link>
        </p>
      </div>
    </main>
  );
}
