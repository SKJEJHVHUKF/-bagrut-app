import Link from 'next/link';
import { BUSINESS, CONTACT_EMAIL, LEGAL_LINKS } from '@/lib/legal';

// Shell for the short legal pages (cookies, refunds). The older privacy/terms
// pages keep their own markup; they only share LEGAL_LINKS.
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen text-slate-800" style={{ fontFamily: 'var(--font-heebo), sans-serif' }}>
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
        <header className="text-center space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900">{title}</h1>
          <p className="text-xs text-slate-600">עודכן לאחרונה: {updated}</p>
        </header>
        <article className="surface-premium rounded-3xl p-6 sm:p-8 space-y-6 text-sm sm:text-base text-slate-700 leading-relaxed">
          {children}
        </article>
        <LegalFooter />
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-black text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr" className="text-violet-700 hover:text-violet-800 underline underline-offset-2">
      {CONTACT_EMAIL}
    </a>
  );
}

export function BusinessDetails() {
  const rows = [
    ['שם העסק', BUSINESS.legalName],
    ['מספר עוסק / ח.פ', BUSINESS.businessId],
    ['כתובת', BUSINESS.address],
    ['טלפון', BUSINESS.phone],
  ].filter((r): r is [string, string] => Boolean(r[1]));
  return (
    <ul className="space-y-1">
      {rows.map(([k, v]) => (
        <li key={k}>
          <strong className="text-slate-900">{k}:</strong> {v}
        </li>
      ))}
      <li>
        <strong className="text-slate-900">אימייל:</strong> <ContactLink />
      </li>
    </ul>
  );
}

export function LegalFooter() {
  return (
    <nav aria-label="מסמכים משפטיים" className="flex flex-wrap justify-center gap-x-1 pb-8 text-xs text-slate-600">
      {LEGAL_LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="inline-flex items-center min-h-[44px] px-2 hover:text-slate-900 underline-offset-2 hover:underline">
          {l.label}
        </Link>
      ))}
      <Link href="/" className="inline-flex items-center min-h-[44px] px-2 hover:text-slate-900 underline-offset-2 hover:underline">
        דף הבית
      </Link>
    </nav>
  );
}
