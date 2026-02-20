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
      <span className="text-[15px] font-bold tracking-widest" style={{ color: "#34d399" }}>
        {time.h}:{time.m}
      </span>
      <span className="text-[11px] tabular-nums" style={{ color: "rgba(52,211,153,0.45)" }}>
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
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  });

  return (
    <header
      className="h-14 min-h-14 flex items-center px-5 gap-4"
      style={{
        background: "linear-gradient(90deg, rgba(7,13,26,0.99), rgba(10,18,32,0.97))",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.35)",
      }}
    >
      {/* Back button */}
      <button
        type="button"
        onClick={() => window.history.back()}
        disabled={pathname === "/"}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 disabled:opacity-20 disabled:cursor-not-allowed"
        style={{
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.04)",
          color: "rgba(255,255,255,0.5)",
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
        }}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.color = "rgba(255,255,255,0.9)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          e.currentTarget.style.color = "rgba(255,255,255,0.5)";
        }}
      >
        ← <span className="tracking-wider">НАЗАД</span>
      </button>

      {/* Divider */}
      <div className="w-px h-6 shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />

      {/* Page title */}
      <div className="flex items-center gap-2.5">
        <span className="text-[14px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          {meta.icon}
        </span>
        <h2
          className="text-[14px] font-semibold tracking-wide uppercase"
          style={{ color: "#e8f0fe", letterSpacing: "0.08em" }}
        >
          {meta.title}
        </h2>
        {meta.desc && (
          <span
            className="text-[9px] font-mono tracking-wider hidden lg:block"
            style={{ color: "rgba(255,255,255,0.18)" }}
          >
            // {meta.desc}
          </span>
        )}
      </div>

      {/* Critical alert */}
      {criticalCount > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: "rgba(239,68,68,0.09)",
            border: "1px solid rgba(239,68,68,0.22)",
            boxShadow: "0 0 12px rgba(239,68,68,0.08)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#ef4444", boxShadow: "0 0 6px #ef4444" }}
          />
          <span
            className="text-[10px] font-mono font-semibold tracking-wider"
            style={{ color: "#fca5a5" }}
          >
            ⚠ {criticalCount} КРИТИЧНЫХ
          </span>
        </div>
      )}

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">
        <span
          className="text-[11px] capitalize hidden md:block"
          style={{ color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-mono)" }}
        >
          {today}
        </span>

        <div className="w-px h-5 hidden md:block" style={{ background: "rgba(255,255,255,0.08)" }} />

        <LiveClock />
      </div>
    </header>
  );
}