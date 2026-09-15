import type { Metadata } from 'next';
import LegalPage, { BusinessDetails, LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'ביטולים והחזרים — MathUp',
  description: 'מדיניות ביטול עסקה והחזרים למנויי MathUp Pro, לפי חוק הגנת הצרכן.',
};

export default function RefundsPage() {
  return (
    <LegalPage title="ביטולים והחזרים" updated="15 בספטמבר 2026">
      <LegalSection title="1. כללי">
        <p>
          השימוש הבסיסי ב-MathUp חינמי. מדיניות זו חלה על מנויים בתשלום (Pro) והיא כפופה לחוק הגנת הצרכן,
          התשמ&quot;א-1981, ולתקנות הגנת הצרכן (ביטול עסקה), התשע&quot;א-2010.
        </p>
      </LegalSection>

      <LegalSection title="2. ביטול תוך 14 יום">
        <p>
          ניתן לבטל רכישת מנוי תוך 14 יום מיום העסקה. במקרה כזה יוחזר התשלום בניכוי דמי ביטול של 5% ממחיר
          העסקה או 100 ₪ — הנמוך מביניהם. ההחזר יבוצע לאמצעי התשלום המקורי תוך 14 יום מקבלת הודעת הביטול.
        </p>
      </LegalSection>

      <LegalSection title="3. ביטול מנוי מתחדש">
        <ul className="list-disc pr-5 space-y-2">
          <li>מנוי חודשי ניתן לביטול בכל עת. החיוב הבא לא יתבצע, והגישה נשארת עד סוף התקופה ששולמה.</li>
          <li>
            מנוי לתקופה (חצי-שנתי / שנתי) שבוטל אחרי 14 הימים — יוחזר החלק היחסי של התקופה שלא נוצלה, בניכוי
            דמי ביטול כאמור בסעיף 2.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. זכאות מיוחדת">
        <p>
          אדם עם מוגבלות, אזרח ותיק (מעל גיל 65) או עולה חדש (עד 5 שנים מיום העלייה) רשאים לבטל עסקה שנעשתה
          באינטרנט תוך 4 חודשים, בכפוף לחוק.
        </p>
      </LegalSection>

      <LegalSection title="5. איך מבטלים">
        <p>שלחו הודעת ביטול באימייל, עם כתובת האימייל של החשבון. נאשר את קבלת ההודעה.</p>
        <BusinessDetails />
      </LegalSection>
    </LegalPage>
  );
}
