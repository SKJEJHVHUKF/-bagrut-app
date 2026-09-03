import HelpContent from '@/components/console/HelpContent';

export const metadata = { title: 'עזרה — קונסולת מורה' };

/** /console/help — the console explained, on one page. Content lives in
 *  HelpContent so the open demo can show the same page without an account. */
export default function HelpPage() {
  return <HelpContent />;
}
