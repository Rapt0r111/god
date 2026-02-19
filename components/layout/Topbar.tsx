"use client";

import { useEffect, useState } from "react";

interface TopbarProps {
  criticalCount: number;
}

const VIEW_TITLES: Record<string, string> = {
  "/": "Оперативный центр управления",
  "/tasks": "Журнал задач",
  "/timeline": "Хронология мероприятий",
  "/roles": "Личный состав",
};

function LiveClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setTime(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="font-mono text-sm tracking-widest text-emerald-400">{time}</span>;
}

export function Topbar({ criticalCount }: TopbarProps) {
  const [pathname, setPathname] = useState("/");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const title = VIEW_TITLES[pathname] ?? "ЦСУ ПД";
  const isRoot = pathname === "/";

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="h-14 min-h-14 glass-elevated border-b border-white/10 flex items-center px-6 gap-5">
      <button
        type="button"
        onClick={() => window.history.back()}
        disabled={isRoot}
        className="px-2 py-1 text-[11px] font-mono border border-white/20 rounded text-white/70 hover:text-white hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ← НАЗАД
      </button>

      <h2 className="text-[16px] font-bold text-white tracking-wide uppercase">{title}</h2>
      <div className="w-px h-5 bg-white/20" />
      <span className="font-mono text-[11px] text-white/50 capitalize">{today}</span>

      {criticalCount > 0 && (
        <span className="font-mono text-[10px] text-red-400 tracking-wide">⚠ {criticalCount} КРИ</span>
      )}

      <div className="ml-auto flex items-center gap-4">
        <LiveClock />
      </div>
    </header>
  );
}
