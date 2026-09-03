/**
 * HelpContent — the console explained, in a teacher's words.
 *
 * For the teacher who would rather read a page than click around. No
 * screenshots, no version numbers, no "click the hamburger": each entry is
 * what a thing IS, what it means, and what to do about it. Static — nothing
 * here can go stale except the product itself, and it lives next to the code.
 *
 * A plain component (no hooks, no server-only calls) so it renders identically
 * from the gated /console/help and the open /console-demo/help. The first
 * attempt re-exported a server page under the demo's client layout and got a
 * 404 back from the app itself; sharing the content instead of the page is the
 * pattern the other demo sections already use.
 */

import PageHeader from '@/components/console/PageHeader';
import { Panel } from '@/components/console/Panel';

const SECTIONS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: 'להתחיל',
    items: [
      {
        q: 'איך התלמידים מצטרפים לכיתה?',
        a: 'כל כיתה מקבלת קוד בן שש תווים. התלמיד נכנס לאפליקציה הרגילה שלו, לוחץ בסרגל על "כניסה לכיתה שלי", ומקליד את הקוד — פעם אחת בשנה. אין אימיילים, אין הזמנות. הכפתור "הודעה לכיתה" ליד הקוד מעתיק הודעה מוכנה להדבקה בקבוצת הוואטסאפ של הכיתה.',
      },
      {
        q: 'מה התלמידים צריכים לעשות אחרת?',
        a: 'כלום. הם מתרגלים באפליקציה בדיוק כמו קודם. כל תשובה נרשמת מעצמה, ואתה רואה אותה כאן.',
      },
      {
        q: 'כמה זמן זה לוקח לי?',
        a: 'המסך הראשון בנוי לתשעים שניות בין שיעורים: משפט אחד שאומר מה לעשות, ומתחתיו מי צריך אותך. הרשימה המלאה והמפה נמצאות מתחת, למי שרוצה להעמיק.',
      },
    ],
  },
  {
    title: 'מה המילים אומרות',
    items: [
      {
        q: '"תקוע"',
        a: 'תלמיד שניסה נושא לפחות שלוש פעמים ופחות מ-60% מהתשובות נכונות. שלוש — כי פעם אחת זו יכולה להיות שאלה קשה, לא בעיה.',
      },
      {
        q: '"לא נכנס"',
        a: 'לא פתר אף תרגיל שבעה ימים או יותר. זה אומר משהו על הרגלים, לא על הבנה — אחוז השליטה שלו לא נפגע מזה.',
      },
      {
        q: '"טרם התחיל" / "אין נתונים"',
        a: 'הצטרף לכיתה אבל עוד לא פתר כלום. חשוב: זה לא אפס. אפס זה "ניסה ונכשל בהכל"; אין נתונים זה "עוד לא ניסה". המערכת לעולם לא מציגה אפס למי שלא התחיל.',
      },
      {
        q: '"שליטה"',
        a: 'אחוז התשובות הנכונות מתוך התשובות שנמדדו. תרגיל שתלמיד פותר בפעם השנייה נספר כתרגול אבל לא כמדידה — אחרת אפשר היה להעלות את האחוז על ידי חזרה על מה שכבר יודעים.',
      },
      {
        q: '"מה ללמד שוב"',
        a: 'נושא שלפחות חמישה תלמידים ניסו, ורובם מתחת לחצי. כשכל הכיתה נופלת באותו מקום, זה שיעור שצריך ללמד מחדש — לא חמישה תלמידים חלשים. הממוצע הוא לפי תלמיד, כדי שתלמיד אחד שפתר מאתיים שאלות לא יקבע את התמונה של שלושים.',
      },
    ],
  },
  {
    title: 'לשלוח תרגול',
    items: [
      {
        q: 'מה זה "שלח תרגול"?',
        a: 'אתה מצביע על נושא (ואם תרצה, על תת-נושא ורמה) ואומר למי ועד מתי. התלמיד רואה את זה כשלב מסומן במסלול שלו. אתה לא כותב שאלות — הכל כבר קיים באפליקציה.',
      },
      {
        q: 'לכל הכיתה או לתלמיד?',
        a: 'שניהם. מהשורה "מה ללמד שוב" — לכל הכיתה. מליד שם של תלמיד — רק לו. בטבלה "תרגולים ששלחתי" רואים כמה מכל קבוצה סיימו.',
      },
    ],
  },
  {
    title: 'הצבעים במפה',
    items: [
      {
        q: 'טורקיז, אפור, כתום',
        a: 'טורקיז — שולט (70% ומעלה). אפור — על הגבול. כתום — מתקשה או תקוע (מתחת ל-55%). ריבוע ריק עם קו מקווקו — אין נתונים, לא אפס. המספר תמיד כתוב בתוך הריבוע, אז לא צריך לזכור צבעים.',
      },
      {
        q: 'טור שלם כתום, או שורה שלמה?',
        a: 'טור (נושא) כתום — ללמד את הנושא שוב לכולם. שורה (תלמיד) כתומה — לשבת עם התלמיד. זה ההבדל בין שיעור לשיחה.',
      },
    ],
  },
  {
    title: 'דוחות ופרטיות',
    items: [
      {
        q: 'הדוח להורים',
        a: '"דוחות" מפיק עמוד לכל תלמיד, מוכן להדפסה, עם המספרים מוסברים במילים. מכרטיס תלמיד אפשר להדפיס רק אותו. הדוח אומר במפורש שהוא מבוסס על תרגול באפליקציה ואינו ציון.',
      },
      {
        q: 'מה נשמר על התלמידים?',
        a: 'שם תצוגה, לאיזו כיתה הוא שייך, ומה פתר. לא אימייל, לא טלפון, לא תעודת זהות. מורה רואה רק את הכיתות שלו — זה נאכף במסד הנתונים, לא רק במסך.',
      },
      {
        q: 'הסרת תלמיד מהכיתה',
        a: 'ב"הגדרות". השיוך נמחק, ההיסטוריה שלו נשארת שלו. תלמיד שנכנס לכיתה הלא נכונה לא מאבד כלום כשמעבירים אותו.',
      },
    ],
  },
];

export default function HelpContent() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-16 pt-6 lg:px-8">
      <PageHeader title="עזרה" subtitle="הקונסולה מוסברת בעמוד אחד. בלי מסכים, בלי מונחים." />
      <div className="flex flex-col gap-4">
        {SECTIONS.map((s) => (
          <Panel key={s.title} title={s.title}>
            <dl className="divide-y divide-slate-100 dark:divide-slate-800">
              {s.items.map((it) => (
                <div key={it.q} className="py-3 first:pt-0 last:pb-0">
                  <dt className="font-semibold text-slate-900 dark:text-slate-50">{it.q}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {it.a}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>
        ))}
      </div>
    </main>
  );
}
