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
    <span className="font-mono text-sm tracking-widest text-[var(--color-accent-green)]">
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
    <header className="h-14 min-h-14 bg-panel border-b border-default flex items-center px-6 gap-5">
      {/* Заголовок страницы */}
      <h2 className="font-display text-[16px] font-bold text-primary tracking-wide uppercase">
        {title}
      </h2>

      {/* Разделитель */}
      <div className="w-px h-5 bg-[var(--color-border)]" />

      {/* Дата */}
      <span className="font-mono text-[11px] text-secondary capitalize">{today}</span>

      {/* Критичных задач */}
      {criticalCount > 0 && (
        <span className="font-mono text-[10px] text-[var(--color-critical)] tracking-wide">
          ⚠ {criticalCount} КРИ
        </span>
      )}

      {/* Правая часть */}
      <div className="ml-auto flex items-center gap-3">
        <button className="font-mono text-[11px] tracking-wide px-3.5 py-1.5 border border-[var(--color-accent-blue)] text-[var(--color-accent-blue)] bg-[rgba(96,165,250,0.08)] hover:bg-[rgba(96,165,250,0.18)] transition-colors uppercase">
          ⊕ Добавить задачу
        </button>
        <button className="font-mono text-[11px] tracking-wide px-3.5 py-1.5 border border-[var(--color-accent-green)] text-[var(--color-accent-green)] bg-[rgba(52,211,153,0.08)] hover:bg-[rgba(52,211,153,0.18)] transition-colors uppercase">
          ⤓ Доклад
        </button>
        <LiveClock />
      </div>
    </header>
  );
}