"use client";

// components/layout/Topbar.tsx — Vision 2026 · Warm & Clear

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface TopbarProps {
  criticalCount?: number;
}

const PAGE_META: Record<string, { title: string; icon: string; color: string }> = {
  "/":         { title: "Дашборд",           icon: "⬡", color: "oklch(68% 0.18 288)" },
  "/tasks":    { title: "Журнал задач",       icon: "✦", color: "oklch(74% 0.18 68)"  },
  "/timeline": { title: "Хронология",         icon: "◈", color: "oklch(70% 0.15 230)" },
  "/roles":    { title: "Личный состав",      icon: "◎", color: "oklch(72% 0.17 152)" },
};

function LiveClock() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      setTime(`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: 14,
      fontWeight: 700,
      fontVariantNumeric: "tabular-nums",
      letterSpacing: "0.06em",
      color: "var(--success)",
      textShadow: "0 0 14px oklch(72% 0.17 152 / 0.45)",
    }}>
      {time}
    </span>
  );
}

export function Topbar({ criticalCount = 0 }: TopbarProps) {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: "ЦСУ ПД", icon: "⬡", color: "var(--primary)" };

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // Capitalize first letter
  const todayStr = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <header
      style={{
        height: "var(--topbar-h)",
        minHeight: "var(--topbar-h)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 12,
        background: "oklch(15% 0.024 270 / 0.97)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--bd-1)",
        boxShadow: "0 1px 0 var(--bd-1)",
        position: "relative",
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 1,
        background: `linear-gradient(90deg, transparent 0%, ${meta.color.replace(")", " / 0.35)")} 50%, transparent 100%)`,
      }} />

      {/* Back */}
      <button
        type="button"
        onClick={() => window.history.back()}
        disabled={pathname === "/"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 11px",
          borderRadius: 9,
          border: "1px solid var(--bd-1)",
          background: "transparent",
          color: "var(--tx-4)",
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          cursor: "pointer",
          transition: "all 0.18s ease",
          opacity: pathname === "/" ? 0.25 : 1,
          pointerEvents: pathname === "/" ? "none" : "auto",
        }}
        onMouseEnter={e => {
          if (pathname !== "/") {
            e.currentTarget.style.background = "oklch(100% 0 0 / 0.05)";
            e.currentTarget.style.borderColor = "var(--bd-2)";
            e.currentTarget.style.color = "var(--tx-2)";
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "var(--bd-1)";
          e.currentTarget.style.color = "var(--tx-4)";
        }}
      >
        ← <span>Назад</span>
      </button>

      <div style={{ width: 1, height: 18, background: "var(--bd-1)", flexShrink: 0 }} />

      {/* Page title */}
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{
          fontSize: 16,
          color: meta.color,
          filter: `drop-shadow(0 0 5px ${meta.color.replace(")", " / 0.50)")})`,
        }}>
          {meta.icon}
        </span>
        <h1 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--tx-1)",
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}>
          {meta.title}
        </h1>
      </div>

      {/* Critical alert */}
      {criticalCount > 0 && (
        <a
          href="/tasks?criticalOnly=1"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 12px",
            borderRadius: 99,
            background: "oklch(67% 0.21 22 / 0.10)",
            border: "1px solid oklch(67% 0.21 22 / 0.30)",
            textDecoration: "none",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "oklch(67% 0.21 22 / 0.18)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "oklch(67% 0.21 22 / 0.10)"; }}
        >
          <span style={{
            width: 6, height: 6,
            borderRadius: "50%",
            background: "var(--danger)",
            boxShadow: "0 0 7px var(--danger)",
            flexShrink: 0,
            animation: "pulse 2s ease-in-out infinite",
          }} />
          <span style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            color: "oklch(80% 0.14 22)",
            letterSpacing: "0.04em",
          }}>
            {criticalCount} срочных
          </span>
        </a>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Date */}
      <span
        style={{
          fontSize: 11,
          color: "var(--tx-4)",
          letterSpacing: "0.01em",
          textTransform: "capitalize",
          whiteSpace: "nowrap",
        }}
        className="hidden md:block"
      >
        {todayStr}
      </span>

      <div style={{ width: 1, height: 18, background: "var(--bd-1)", flexShrink: 0 }} className="hidden md:block" />

      <LiveClock />
    </header>
  );
}