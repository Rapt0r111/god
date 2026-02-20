"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",         icon: "◈", label: "Дашборд",       desc: "Обзор" },
  { href: "/tasks",    icon: "≡", label: "Задачи",         desc: "Журнал" },
  { href: "/timeline", icon: "◫", label: "Хронология",     desc: "Ганта" },
  { href: "/roles",    icon: "◉", label: "Личный состав",  desc: "Л/С" },
] as const;

const CATEGORIES = [
  { code: "Н",   icon: "⚗",  label: "Наука",             color: "#10b981" },
  { code: "А",   icon: "📡", label: "Агитация",           color: "#3b82f6" },
  { code: "БП",  icon: "🎯", label: "Боевая подготовка",  color: "#ef4444" },
  { code: "ПД",  icon: "⚙",  label: "Повседн. деят.",     color: "#f59e0b" },
  { code: "У",   icon: "🏁", label: "Увольнение",         color: "#f97316" },
  { code: "П",   icon: "🔰", label: "Призыв",             color: "#06b6d4" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="w-[224px] min-w-[224px] flex flex-col relative z-10"
      style={{
        background: "linear-gradient(180deg, rgba(7,13,26,0.98) 0%, rgba(10,18,32,0.95) 100%)",
        backdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* ── Логотип ── */}
      <div
        className="px-5 pt-6 pb-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px]"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.2))",
              border: "1px solid rgba(59,130,246,0.3)",
              boxShadow: "0 0 16px rgba(59,130,246,0.15)",
            }}
          >
            ◈
          </div>
          <div>
            <p
              className="text-[9px] font-mono tracking-[3px] uppercase leading-none"
              style={{ color: "rgba(59,130,246,0.7)" }}
            >
              // система
            </p>
          </div>
        </div>

        <h1
          className="text-[22px] font-bold tracking-wide leading-none mb-1"
          style={{ color: "#e8f0fe", letterSpacing: "0.05em" }}
        >
          ЦСУ ПД
        </h1>
        <p
          className="text-[10px] font-mono tracking-[2px] uppercase"
          style={{ color: "rgba(245,158,11,0.7)" }}
        >
          Научная рота · В/Ч
        </p>
      </div>

      {/* ── Навигация ── */}
      <div className="flex-1 py-4 overflow-y-auto">
        <p
          className="text-[9px] font-mono tracking-[2.5px] uppercase px-5 pt-1 pb-3"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          Навигация
        </p>

        <div className="px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative group"
                style={active ? {
                  background: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.1))",
                  border: "1px solid rgba(59,130,246,0.25)",
                  color: "#93c5fd",
                  boxShadow: "0 2px 12px rgba(59,130,246,0.1)",
                } : {
                  border: "1px solid transparent",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {/* Активная метка */}
                {active && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: "#3b82f6", boxShadow: "0 0 8px #3b82f6" }}
                  />
                )}

                <span
                  className="text-[16px] w-5 text-center"
                  style={{ opacity: active ? 1 : 0.5 }}
                >
                  {item.icon}
                </span>

                <span className="flex-1">{item.label}</span>

                {/* Desc badge при hover */}
                <span
                  className="text-[9px] font-mono opacity-0 group-hover:opacity-60 transition-opacity"
                  style={{ color: active ? "#93c5fd" : "rgba(255,255,255,0.3)" }}
                >
                  {item.desc}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── Категории ── */}
        <div
          className="mt-5 pt-4 px-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p
            className="text-[9px] font-mono tracking-[2.5px] uppercase px-3 pb-2"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            Категории
          </p>

          <div className="space-y-0.5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.code}
                href={`/tasks?category=${cat.code}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 group"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                <span className="text-[12px] group-hover:scale-110 transition-transform">
                  {cat.icon}
                </span>
                <span
                  className="text-[10px] font-mono font-semibold tracking-wider w-7"
                  style={{ color: cat.color }}
                >
                  {cat.code}
                </span>
                <span
                  className="text-[11px] truncate group-hover:text-white/70 transition-colors"
                >
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Статус системы ── */}
      <div
        className="px-5 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <StatusRow color="#10b981" label="Система активна" delay="0s" />
        <div className="mt-1.5">
          <StatusRow color="#f59e0b" label="Offline · Local-first" delay="1.2s" />
        </div>

        <div
          className="mt-3 px-3 py-2 rounded-lg"
          style={{
            background: "rgba(59,130,246,0.05)",
            border: "1px solid rgba(59,130,246,0.1)",
          }}
        >
          <p className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
            v1.0 · ЦСУ ПД 2025
          </p>
        </div>
      </div>
    </nav>
  );
}

function StatusRow({
  color,
  label,
  delay,
}: {
  color: string;
  label: string;
  delay: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
        style={{ backgroundColor: color, animationDelay: delay, boxShadow: `0 0 6px ${color}` }}
      />
      <span
        className="text-[10px] font-mono tracking-wide"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {label}
      </span>
    </div>
  );
}