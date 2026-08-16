import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Heebo, Frank_Ruhl_Libre, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import ServiceWorkerRegistration from "./sw-register";
import AppChrome from "@/components/AppChrome";
import AppHeader from "@/components/AppHeader";
import TutorBubble from "@/components/tutor/TutorBubble";
import BottomNav from "@/components/BottomNav";
import GlobalSearch from "@/components/GlobalSearch";
import FormulaSheet from "@/components/FormulaSheet";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "600", "700", "900"],
});

const frankRuhlLibre = Frank_Ruhl_Libre({
  variable: "--font-frank-ruhl",
  subsets: ["latin", "hebrew"],
  weight: ["400", "700", "900"],
});

// Plus Jakarta Sans — the Lumina display/UI face. It has NO Hebrew glyphs,
// so it is deliberately stacked *before* Heebo rather than replacing it:
// the browser falls back per-glyph, so Latin letters, digits and punctuation
// (every score, percentage, year and שאלון number in the app) render in
// Jakarta while Hebrew renders in Heebo. Setting it as the sole sans would
// silently hand all Hebrew to the system font.
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  // Absolute base for every relative URL below. Without it `openGraph.images`
  // stays relative, and WhatsApp, Telegram and Google all drop an OG image they
  // cannot resolve — the share card renders as a bare link.
  metadataBase: new URL(SITE_URL),
  title: "MathUp — מתרגלים חכם, מצליחים יותר",
  // This used to say the questions are "נוצרות בזמן אמת ע״י בינה מלאכותית".
  // That has not been true since the product became static-first: there are
  // ~829 hand-authored, mathematically verified questions and AI is the
  // fallback. It was the description on EVERY page and in every share, and it
  // sold the one thing every competitor also claims while hiding the one thing
  // that is rare and true.
  description:
    "מתמטיקה 5 יחידות, שאלוני 571 ו-572: מאות שאלות בגרות פתורות שלב-אחר-שלב, מסלול לימוד מלא וללא הרשמה.",
  applicationName: "MathUp",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    // Home-screen label — iOS truncates past ~12 chars, so no tagline here.
    title: "MathUp",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "MathUp — מתרגלים חכם, מצליחים יותר",
    description: "מתמטיקה 5 יחידות: מאות שאלות בגרות פתורות שלב-אחר-שלב, בלי הרשמה.",
    locale: "he_IL",
    type: "website",
    siteName: "MathUp",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "MathUp" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#FCF8FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Required for env(safe-area-inset-bottom) to report a non-zero value —
  // without it the mobile bottom bar sits under the iPhone home indicator.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} ${heebo.variable} ${frankRuhlLibre.variable} ${plusJakarta.variable} w-screen`}
    >
      <body className="w-screen overflow-x-hidden m-0 p-0">
        <ServiceWorkerRegistration />
        <AppHeader />
        <AppChrome />
        <TutorBubble />
        <BottomNav />
        <GlobalSearch />
        <FormulaSheet />
        {children}
        <Toaster
          position="top-center"
          dir="rtl"
          theme="light"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'var(--font-jakarta), var(--font-heebo), sans-serif',
              fontWeight: 600,
            },
          }}
        />
      </body>
    </html>
  );
}
