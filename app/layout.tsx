import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Heebo, Frank_Ruhl_Libre, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
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
  title: "MathUp — מתרגלים חכם, מצליחים יותר",
  description: "תרגול חכם של שאלות בגרות אמיתיות, נוצרות בזמן אמת ע״י בינה מלאכותית. הסבר מיידי לכל תשובה.",
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
    description: "תרגול חכם של שאלות בגרות אמיתיות עם AI",
    locale: "he_IL",
    type: "website",
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
