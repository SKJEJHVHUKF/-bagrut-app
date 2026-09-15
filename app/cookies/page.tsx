import type { Metadata } from 'next';
import LegalPage, { ContactLink, LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'מדיניות עוגיות — MathUp',
  description: 'אילו עוגיות (cookies) ונתוני אחסון מקומי MathUp משתמשת בהם, ולמה.',
};

export default function CookiesPage() {
  return (
    <LegalPage title="מדיניות עוגיות" updated="15 בספטמבר 2026">
      <LegalSection title="1. מה זה עוגיות">
        <p>
          עוגיות (cookies) הן קבצים קטנים שהדפדפן שומר. בנוסף, האתר שומר מידע בזיכרון המקומי של הדפדפן
          (localStorage) כדי לזכור את ההתקדמות שלך גם בלי חיבור.
        </p>
      </LegalSection>

      <LegalSection title="2. במה אנחנו משתמשים">
        <ul className="list-disc pr-5 space-y-2">
          <li>
            <strong className="text-slate-900">עוגיות התחברות (חיוניות)</strong> — של Supabase, שומרות את
            ההתחברות לחשבון. בלעדיהן אי אפשר להתחבר.
          </li>
          <li>
            <strong className="text-slate-900">אחסון מקומי (חיוני)</strong> — התקדמות במסלול, הגדרות
            תצוגה, וזכירה שכבר ראית את הודעת העוגיות.
          </li>
          <li>
            <strong className="text-slate-900">סרטוני YouTube</strong> — חלק מהשיעורים כוללים סרטון מוטמע במצב
            &quot;פרטיות משופרת&quot; (youtube-nocookie.com). YouTube (Google) עשויה לשמור נתונים רק כשמפעילים את
            הסרטון.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. במה אנחנו לא משתמשים">
        <p>
          אין באתר עוגיות פרסום, פיקסלים של רשתות חברתיות או כלי מעקב וניתוח של צד שלישי (כמו Google
          Analytics). אם נוסיף כלי כזה בעתיד — נבקש את הסכמתך מראש.
        </p>
      </LegalSection>

      <LegalSection title="4. שליטה">
        <p>
          אפשר למחוק עוגיות ואחסון מקומי בהגדרות הדפדפן בכל עת. מחיקת עוגיות ההתחברות תנתק אותך מהחשבון.
          שאלות: <ContactLink />
        </p>
      </LegalSection>
    </LegalPage>
  );
}
