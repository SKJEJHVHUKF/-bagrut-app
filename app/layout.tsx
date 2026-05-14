import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Heebo, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "./sw-register";

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

export const metadata: Metadata = {
  title: "בגרות בכיס",
  description: "תרגול חכם של שאלות בגרות אמיתיות, נוצרות בזמן אמת ע״י בינה מלאכותית. הסבר מיידי לכל תשובה.",
  applicationName: "בגרות בכיס",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "בגרות בכיס",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "בגרות בכיס",
    description: "תרגול חכם של שאלות בגרות אמיתיות עם AI",
    locale: "he_IL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#a855f7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
      className={`${geistSans.variable} ${geistMono.variable} ${heebo.variable} ${frankRuhlLibre.variable} w-screen`}
    >
      <body className="w-screen overflow-x-hidden m-0 p-0">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
