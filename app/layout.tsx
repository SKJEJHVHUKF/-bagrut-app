import type { Metadata } from "next";
import { Geist, Geist_Mono, Heebo, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";

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
  description: "כלי תרגול לבגרות ישראלית עם AI",
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
      <body className="w-screen overflow-x-hidden m-0 p-0">{children}</body>
    </html>
  );
}
