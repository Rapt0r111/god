// app/layout.tsx — Vision 2026 · Root Layout
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ЦСУ ПД | Научная рота",
  description: "Цифровая система управления повседневной деятельностью",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${fontSans.variable} ${fontMono.variable}`}>
      <body className="min-h-screen antialiased" style={{ background: "oklch(26% 0.045 268)" }}>
        {/* ── Ambient Light Layer ── */}
        {/* These decorative orbs create depth and prevent the "morbid darkness" feel */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          {/* Top-left strong indigo orb */}
          <div
            className="ambient-orb"
            style={{
              width: 800,
              height: 600,
              top: -160,
              left: -200,
              background: "oklch(68% 0.18 272 / 0.20)",
              animationDelay: "0s",
            }}
          />
          {/* Top-right cyan orb */}
          <div
            className="ambient-orb"
            style={{
              width: 600,
              height: 500,
              top: -100,
              right: -120,
              background: "oklch(72% 0.14 210 / 0.15)",
              animationDelay: "2.5s",
            }}
          />
          {/* Mid-left soft violet */}
          <div
            className="ambient-orb"
            style={{
              width: 400,
              height: 400,
              top: "35%",
              left: -80,
              background: "oklch(66% 0.20 285 / 0.10)",
              animationDelay: "4s",
            }}
          />
          {/* Bottom center violet orb */}
          <div
            className="ambient-orb"
            style={{
              width: 700,
              height: 500,
              bottom: -180,
              left: "50%",
              transform: "translateX(-50%)",
              background: "oklch(66% 0.20 285 / 0.13)",
              animationDelay: "5s",
            }}
          />
          {/* Bottom-right indigo */}
          <div
            className="ambient-orb"
            style={{
              width: 400,
              height: 400,
              bottom: 60,
              right: -80,
              background: "oklch(68% 0.18 272 / 0.10)",
              animationDelay: "3.5s",
            }}
          />

          {/* Subtle noise texture for tactile depth */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E")`,
              opacity: 0.6,
            }}
          />
        </div>

        {/* ── App Content ── */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}