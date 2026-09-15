import Link from 'next/link';
import type { Metadata } from 'next';
import LegalPage, { BusinessDetails, ContactLink, LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'מדיניות פרטיות — MathUp',
  description: 'מדיניות הפרטיות של MathUp: איזה מידע נאסף, למה, עם מי הוא משותף ומה הזכויות שלך.',
};

const link = 'text-violet-700 hover:text-violet-800 underline underline-offset-2';

const PROVIDERS: [string, string][] = [
  ['Supabase', 'שמירת החשבונות וההתקדמות (בסיס הנתונים)'],
  ['Vercel', 'אחסון והפעלת האתר'],
  ['Anthropic (Claude) ו-Google (Gemini)', 'עיבוד הודעות למורה הווירטואלי ושאלות מצולמות'],
  ['Mathpix', 'זיהוי כתב וסימנים מתמטיים בתמונת שאלה'],
  ['YouTube', 'הצגת סרטוני שיעור, במצב פרטיות משופרת'],
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="מדיניות פרטיות" updated="15 בספטמבר 2026">
      <LegalSection title="1. מבוא">
        <p>
          ב-MathUp אכפת לנו מהפרטיות שלך — במיוחד כי רוב המשתמשים שלנו הם תלמידים. המדיניות הזו מסבירה בפשטות איזה
          מידע אנחנו אוספים, למה, ומה אפשר לעשות איתו. היא נכתבה לפי חוק הגנת הפרטיות, התשמ&quot;א-1981.
        </p>
      </LegalSection>

      <LegalSection title="2. איזה מידע אנחנו אוספים">
        <ul className="list-disc pr-5 space-y-2">
          <li><strong className="text-slate-900">פרטי חשבון:</strong> שם, אימייל וסיסמה (הסיסמה נשמרת מוצפנת, ואין לנו גישה אליה).</li>
          <li><strong className="text-slate-900">מידע לימודי:</strong> תשובות לתרגילים, התקדמות במסלול, טעויות, תאריך בגרות אם בחרת להזין.</li>
          <li><strong className="text-slate-900">הודעות למורה הווירטואלי:</strong> מה ששאלת ומה נענה.</li>
          <li><strong className="text-slate-900">תמונות שאלה:</strong> תמונה שצילמת נשלחת לעיבוד ואינה נשמרת אצלנו.</li>
          <li><strong className="text-slate-900">כיתה:</strong> אם הצטרפת לכיתה — לאיזו כיתה ומי המורה.</li>
          <li><strong className="text-slate-900">מידע טכני:</strong> כתובת IP, סוג דפדפן ומכשיר, ודוחות תקלה — לאבטחה ולתיקון באגים.</li>
        </ul>
        <p>
          איננו מבקשים מספר טלפון, תעודת זהות, כתובת מגורים או שם בית ספר. אנחנו אוספים רק את מה שצריך כדי שהשירות
          יעבוד.
        </p>
      </LegalSection>

      <LegalSection title="3. למה אנחנו משתמשים במידע">
        <ul className="list-disc pr-5 space-y-1">
          <li>כדי להפעיל את השירות: לשמור התקדמות, להתאים תרגול ולענות לשאלות</li>
          <li>כדי לשפר את התוכן ואת איכות התשובות של המורה הווירטואלי</li>
          <li>כדי להציג למורה את התקדמות התלמידים בכיתה שלו</li>
          <li>כדי לשלוח הודעות חשובות על החשבון או על שינויים בשירות</li>
          <li>כדי להגן על השירות מפני ניצול לרעה, ולעמוד בדרישות החוק</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. שיתוף מידע">
        <p>
          <strong className="text-slate-900">אנחנו לא מוכרים מידע אישי ולא מציגים פרסומות.</strong> המידע משותף רק
          במקרים האלה:
        </p>
        <ul className="list-disc pr-5 space-y-1">
          <li><strong className="text-slate-900">המורה שלך</strong> — רק אם הצטרפת לכיתה שלו עם קוד.</li>
          <li>
            <strong className="text-slate-900">הורים</strong> — רק אם אתה או המורה שלחתם קישור לדוח ההתקדמות. אפשר
            לבטל קישור בכל רגע, והקישור הישן מפסיק לעבוד.
          </li>
          <li><strong className="text-slate-900">ספקי שירות</strong> שעובדים בשבילנו (פירוט למטה).</li>
          <li><strong className="text-slate-900">רשויות</strong> — כשהחוק מחייב.</li>
        </ul>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-right border-b border-slate-900/10">
                <th className="py-2 pl-3 font-bold text-slate-900">ספק</th>
                <th className="py-2 font-bold text-slate-900">בשביל מה</th>
              </tr>
            </thead>
            <tbody>
              {PROVIDERS.map(([name, why]) => (
                <tr key={name} className="border-b border-slate-900/5">
                  <td className="py-2 pl-3 whitespace-nowrap" dir="ltr">{name}</td>
                  <td className="py-2">{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>חלק מהספקים שומרים מידע בשרתים מחוץ לישראל, בהתאם לדין.</p>
      </LegalSection>

      <LegalSection title="5. אבטחת מידע">
        <p>
          החיבור לאתר מוצפן (HTTPS), סיסמאות נשמרות מוצפנות, וכל משתמש יכול לגשת רק למידע שלו. אין מערכת חסינה
          לגמרי — אם יקרה אירוע אבטחה משמעותי, נודיע למי שהושפע ולרשויות כנדרש.
        </p>
      </LegalSection>

      <LegalSection title="6. כמה זמן נשמר המידע">
        <p>
          המידע נשמר כל עוד החשבון פעיל. אחרי בקשת מחיקה נמחק את המידע האישי תוך 30 יום, חוץ ממידע שהחוק מחייב
          לשמור.
        </p>
      </LegalSection>

      <LegalSection title="7. הזכויות שלך">
        <ul className="list-disc pr-5 space-y-1">
          <li>לראות איזה מידע אנחנו שומרים עליך</li>
          <li>לתקן מידע שגוי</li>
          <li>למחוק את החשבון ואת המידע</li>
          <li>לקבל עותק של המידע שלך</li>
          <li>להתנגד לשימוש מסוים במידע</li>
        </ul>
        <p>
          כדי לממש זכות — כתבו אלינו: <ContactLink />. נענה תוך 30 יום לכל היותר.
        </p>
      </LegalSection>

      <LegalSection title="8. קטינים">
        <p>
          ההרשמה מיועדת לגילאי 14 ומעלה, ומתחת לגיל 18 — באישור הורה. הורה שחושב שילד מתחת לגיל 14 נרשם, או שרוצה
          לראות או למחוק את המידע של ילדו, מוזמן לפנות אלינו.
        </p>
      </LegalSection>

      <LegalSection title="9. עוגיות">
        <p>
          אנחנו משתמשים רק בעוגיות ובאחסון מקומי חיוניים — בלי מעקב ובלי פרסום. פירוט ב
          <Link href="/cookies" className={link}>מדיניות העוגיות</Link>.
        </p>
      </LegalSection>

      <LegalSection title="10. שינויים במדיניות">
        <p>נעדכן את המדיניות מעת לעת. על שינוי מהותי נודיע באתר או באימייל, ותאריך העדכון יופיע בראש העמוד.</p>
      </LegalSection>

      <LegalSection title="11. יצירת קשר">
        <p>לשאלות בנושא פרטיות:</p>
        <BusinessDetails />
      </LegalSection>
    </LegalPage>
  );
}
