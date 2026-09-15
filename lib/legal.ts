// One source for the legal footer links and the operator's details, so the
// home footer, the drawer and every legal page can't drift apart.

export const CONTACT_EMAIL = 'meitalm1020@gmail.com';

// Consumer-protection law requires the seller's real identity once money is
// taken. Fill these before Pro opens; a null field is simply not rendered.
export const BUSINESS: {
  legalName: string | null;
  businessId: string | null; // ע.מ / ח.פ
  address: string | null;
  phone: string | null;
} = {
  legalName: null,
  businessId: null,
  address: null,
  phone: null,
};

export const LEGAL_LINKS = [
  { href: '/terms', label: 'תנאי שימוש' },
  { href: '/privacy', label: 'מדיניות פרטיות' },
  { href: '/cookies', label: 'מדיניות עוגיות' },
  { href: '/refunds', label: 'ביטולים והחזרים' },
  { href: '/accessibility', label: 'הצהרת נגישות' },
] as const;
