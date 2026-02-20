import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-sans",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "ЦСУ ПД | Научная рота",
  description: "Цифровая система управления повседневной деятельностью",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${fontSans.variable} ${fontMono.variable}`}>
      <body className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
