"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface TopbarProps {
  criticalCount?: number;
}

const VIEW_META: Record<string, { title: string; icon: string; desc: string; color: string }> = {
  "/":         { title: "Оперативный центр",      icon: "◈", desc: "Dashboard",  color: "oklch(68% 0.18 272)" },
  "/tasks":    { title: "Журнал задач",            icon: "≡", desc: "Tasks",      color: "oklch(75% 0.18 75)"  },
  "/timeline": { title: "Хронология мероприятий", icon: "◫", desc: "Timeline",   color: "oklch(72% 0.14 210)" },
  "/roles":    { title: "Личный состав",           icon: "◉", desc: "Personnel",  color: "oklch(66% 0.20 285)" },
};

function LiveClock() {
  const [time, setTime] = useState({ h: "--", m: "--", s: "--" });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setTime({ h: pad(now.getHours()), m: pad(now.getMinutes()), s: pad(now.getSeconds()) });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 2, fontFamily: "var(--font-mono)" }}>
      <span style={{
        fontSize: 16, fontWeight: 700, letterSpacing: "0.12em",
        color: "oklch(72% 0.17 155)",
        textShadow: "0 0 20px oklch(72% 0.17 155 / 0.45)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {time.h}:{time.m}
      </span>
      <span style={{
        fontSize: 11, color: "oklch(72% 0.17 155 / 0.35)",
        fontVariantNumeric: "tabular-nums",
      }}>
        :{time.s}
      </span>
    </div>
  );
}

export function Topbar({ criticalCount = 0 }: TopbarProps) {
  const pathname = usePathname();
  const meta = VIEW_META[pathname] ?? { title: "ЦСУ ПД", icon: "◈", desc: "", color: "oklch(68% 0.18 272)" };

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <header style={{
      height: 56, minHeight: 56,
      display: "flex", alignItems: "center",
      padding: "0 20px",
      gap: 14,
      background: "linear-gradient(90deg, oklch(20% 0.04 266 / 0.97), oklch(17% 0.035 268 / 0.98))",
      backdropFilter: "blur(24px)",
      borderBottom: "1px solid oklch(100% 0 0 / 0.07)",
      boxShadow: "0 2px 24px oklch(0% 0 0 / 0.4)",
      position: "relative",
      zIndex: 10,
    }}>
      {/* Subtle accent line at top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${meta.color.replace(")", " / 0.4)")}, transparent)`,
      }} />

      {/* Back button */}
      <button
        type="button"
        onClick={() => window.history.back()}
        disabled={pathname === "/"}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 12,
          border: "1px solid oklch(100% 0 0 / 0.09)",
          background: "oklch(100% 0 0 / 0.03)",
          color: "oklch(60% 0.04 258)",
          fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.05em",
          cursor: "pointer",
          transition: "all 0.18s ease",
          opacity: pathname === "/" ? 0.25 : 1,
          pointerEvents: pathname === "/" ? "none" : "auto",
        }}
        onMouseEnter={e => {
          if (pathname !== "/") {
            e.currentTarget.style.background = "oklch(100% 0 0 / 0.07)";
            e.currentTarget.style.borderColor = "oklch(100% 0 0 / 0.15)";
            e.currentTarget.style.color = "oklch(96% 0.008 255)";
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "oklch(100% 0 0 / 0.03)";
          e.currentTarget.style.borderColor = "oklch(100% 0 0 / 0.09)";
          e.currentTarget.style.color = "oklch(60% 0.04 258)";
        }}
      >
        ← <span>НАЗАД</span>
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: "oklch(100% 0 0 / 0.08)", flexShrink: 0 }} />

      {/* Page title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          fontSize: 15,
          color: meta.color,
          filter: `drop-shadow(0 0 6px ${meta.color.replace(")", " / 0.5)")})`,
          lineHeight: 1,
        }}>
          {meta.icon}
        </span>
        <h2 style={{
          fontSize: 13, fontWeight: 600, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "oklch(96% 0.008 255)",
          whiteSpace: "nowrap",
        }}>
          {meta.title}
        </h2>
        {meta.desc && (
          <span style={{
            fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "1.5px",
            color: "oklch(45% 0.04 262)",
            display: "none",  /* visible at lg+ via inline below */
          }}
            className="hidden lg:inline"
          >
            // {meta.desc}
          </span>
        )}
      </div>

      {/* Critical badge */}
      {criticalCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 12px", borderRadius: 12,
          background: "oklch(68% 0.22 25 / 0.09)",
          border: "1px solid oklch(68% 0.22 25 / 0.25)",
          boxShadow: "0 0 20px oklch(68% 0.22 25 / 0.10)",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "oklch(68% 0.22 25)",
            boxShadow: "0 0 8px oklch(68% 0.22 25 / 0.9)",
            flexShrink: 0,
            animation: "pulseGlow 1.5s ease-in-out infinite",
          }} />
          <span style={{
            fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700,
            letterSpacing: "1.5px", textTransform: "uppercase",
            color: "oklch(82% 0.12 25)",
          }}>
            ⚠ {criticalCount} КРИТИЧНЫХ
          </span>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right: date + clock */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{
          fontSize: 10, fontFamily: "var(--font-mono)",
          color: "oklch(45% 0.04 262)",
          textTransform: "capitalize",
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}
          className="hidden md:block"
        >
          {today}
        </span>

        <div style={{
          width: 1, height: 20,
          background: "oklch(100% 0 0 / 0.08)",
          flexShrink: 0,
        }} className="hidden md:block" />

        <LiveClock />
      </div>
    </header>
  );
}