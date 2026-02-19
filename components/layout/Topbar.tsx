// src/components/layout/Topbar.tsx
"use client";

import { useEffect, useState } from "react";

interface TopbarProps {
  criticalCount: number;
}

const VIEW_TITLES: Record<string, string> = {
  "/":         "Оперативный центр управления",
  "/tasks":    "Журнал задач",
  "/timeline": "Хронология мероприятий",
  "/roles":    "Личный состав",
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

  return (
    <span className="font-mono text-sm tracking-widest text-emerald-400">
      {time}
    </span>
  );
}

export function Topbar({ criticalCount }: TopbarProps) {
  const [pathname, setPathname] = useState("/");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const title = VIEW_TITLES[pathname] ?? "ЦСУ ПД";

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  });

  return (
    <header className="h-14 min-h-14 glass-elevated border-b border-white/10 flex items-center px-6 gap-5">
      {/* Заголовок страницы */}
      <h2 className="text-[16px] font-bold text-white tracking-wide uppercase">
        {title}
      </h2>

      {/* Разделитель */}
      <div className="w-px h-5 bg-white/20" />

      {/* Дата */}
      <span className="font-mono text-[11px] text-white/50 capitalize">{today}</span>

      {/* Критичных задач */}
      {criticalCount > 0 && (
        <span className="font-mono text-[10px] text-red-400 tracking-wide">
          ⚠ {criticalCount} КРИ
        </span>
      )}

      {/* Правая часть */}
      <div className="ml-auto flex items-center gap-3">
        <button className="text-[11px] tracking-wide px-4 py-1.5 rounded-lg border border-blue-500/40 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors uppercase font-medium">
          ⊕ Добавить задачу
        </button>
        <button className="text-[11px] tracking-wide px-4 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors uppercase font-medium">
          ⤓ Доклад
        </button>
        <LiveClock />
      </div>
    </header>
  );
}