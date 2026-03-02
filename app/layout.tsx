// app/layout.tsx — Vision 2026 · Warm Human-Centric
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ЦСУ ПД · Научная рота",
  description: "Цифровая система управления повседневной деятельностью",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${jetbrains.variable}`}>
      <body
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--tx-1)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {/* Ambient orbs — warm, subtle */}
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
          {/* Top-left violet */}
          <div style={{
            position: "absolute",
            width: 720, height: 540,
            top: -160, left: -180,
            borderRadius: "50%",
            background: "oklch(68% 0.18 288 / 0.14)",
            filter: "blur(90px)",
            animation: "float 12s ease-in-out infinite",
          }} />
          {/* Top-right amber */}
          <div style={{
            position: "absolute",
            width: 560, height: 420,
            top: -100, right: -140,
            borderRadius: "50%",
            background: "oklch(74% 0.18 68 / 0.09)",
            filter: "blur(80px)",
            animation: "float 15s ease-in-out 3s infinite",
          }} />
          {/* Bottom center */}
          <div style={{
            position: "absolute",
            width: 640, height: 480,
            bottom: -200, left: "50%",
            transform: "translateX(-50%)",
            borderRadius: "50%",
            background: "oklch(66% 0.20 300 / 0.09)",
            filter: "blur(100px)",
            animation: "float 18s ease-in-out 6s infinite",
          }} />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}