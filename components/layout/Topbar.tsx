"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface TopbarProps {
  criticalCount: number;
}

const VIEW_META: Record<string, { title: string; icon: string; desc: string }> = {
  "/":         { title: "Оперативный центр",      icon: "◈", desc: "Dashboard" },
  "/tasks":    { title: "Журнал задач",            icon: "≡", desc: "Tasks" },
  "/timeline": { title: "Хронология мероприятий", icon: "◫", desc: "Timeline" },
  "/roles":    { title: "Личный состав",           icon: "◉", desc: "Personnel" },
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
    <div className="flex items-center gap-1 font-mono">
      <span className="text-[15px] font-bold tabular-nums tracking-widest" style={{ color: "#1ae8a0", textShadow: "0 0 16px rgba(26,232,160,0.4)" }}>
        {time.h}:{time.m}
      </span>
      <span className="text-[11px] tabular-nums" style={{ color: "rgba(26,232,160,0.35)" }}>
        :{time.s}
      </span>
    </div>
  );
}

export function Topbar({ criticalCount }: TopbarProps) {
  const pathname = usePathname();
  const meta = VIEW_META[pathname] ?? { title: "ЦСУ ПД", icon: "◈", desc: "" };

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header
      className="h-14 min-h-14 flex items-center px-5 gap-4"
      style={{
        background: "linear-gradient(90deg, rgba(7,13,26,0.96), rgba(4,8,15,0.98))",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.4)",
      }}
    >
      {/* Back button */}
      <button
        type="button"
        onClick={() => window.history.back()}
        disabled={pathname === "/"}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-150 disabled:opacity-20 disabled:cursor-not-allowed"
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          color: "rgba(136,153,187,0.7)",
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
        }}
        onMouseEnter={e => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
            e.currentTarget.style.color = "#eef2ff";
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "rgba(136,153,187,0.7)";
        }}
      >
        ← <span className="tracking-wider">НАЗАД</span>
      </button>

      <div className="w-px h-5 shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />

      {/* Page title */}
      <div className="flex items-center gap-2.5">
        <span className="text-[14px]" style={{ color: "rgba(136,153,187,0.5)" }}>
          {meta.icon}
        </span>
        <h2
          className="text-[13px] font-semibold tracking-widest uppercase"
          style={{ color: "#eef2ff", letterSpacing: "0.1em" }}
        >
          {meta.title}
        </h2>
        {meta.desc && (
          <span
            className="text-[9px] font-mono tracking-wider hidden lg:block"
            style={{ color: "rgba(74,90,122,0.6)" }}
          >
            // {meta.desc}
          </span>
        )}
      </div>

      {/* Critical badge */}
      {criticalCount > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{
            background: "rgba(255,107,107,0.08)",
            border: "1px solid rgba(255,107,107,0.2)",
            boxShadow: "0 0 16px rgba(255,107,107,0.08)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#ff6b6b", boxShadow: "0 0 6px #ff6b6b", animation: "pulseGlow 1.5s ease-in-out infinite" }}
          />
          <span className="text-[10px] font-mono font-semibold tracking-wider" style={{ color: "#ff9999" }}>
            ⚠ {criticalCount} КРИТИЧНЫХ
          </span>
        </div>
      )}

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">
        <span
          className="text-[10px] capitalize hidden md:block font-mono"
          style={{ color: "rgba(74,90,122,0.7)" }}
        >
          {today}
        </span>

        <div className="w-px h-5 hidden md:block" style={{ background: "rgba(255,255,255,0.07)" }} />

        <LiveClock />
      </div>
    </header>
  );
}