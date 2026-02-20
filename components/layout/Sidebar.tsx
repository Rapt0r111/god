"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/",         icon: "◈", label: "Дашборд",      desc: "Обзор" },
  { href: "/tasks",    icon: "≡", label: "Задачи",        desc: "Журнал" },
  { href: "/timeline", icon: "◫", label: "Хронология",   desc: "Ганта" },
  { href: "/roles",    icon: "◉", label: "Личный состав", desc: "Л/С" },
] as const;

const CATEGORIES = [
  { code: "Н",   icon: "⚗",  label: "Наука",            color: "#10b981" },
  { code: "А",   icon: "📡", label: "Агитация",          color: "#3b82f6" },
  { code: "БП",  icon: "🎯", label: "Боевая подготовка", color: "#ef4444" },
  { code: "ПД",  icon: "⚙",  label: "Повседн. деят.",    color: "#f59e0b" },
  { code: "У",   icon: "🏁", label: "Увольнение",        color: "#f97316" },
  { code: "П",   icon: "🔰", label: "Призыв",            color: "#06b6d4" },
] as const;

interface SidebarProps {
  criticalCount?: number;
}

export function Sidebar({ criticalCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Persist collapse state
  useEffect(() => {
    const stored = localStorage.getItem("sidebar_collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar_collapsed", String(!prev));
      return !prev;
    });
  };

  return (
    <nav
      className="relative flex flex-col z-20 transition-all duration-300 ease-in-out flex-shrink-0"
      style={{
        width: collapsed ? 64 : 224,
        background: "linear-gradient(180deg, rgba(7,13,26,0.99) 0%, rgba(10,18,32,0.97) 100%)",
        backdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── Toggle button ── */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-8 z-30 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, #1e3a5f, #0d1829)",
          border: "1px solid rgba(59,130,246,0.3)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          color: "#93c5fd",
          fontSize: 10,
        }}
        title={collapsed ? "Развернуть" : "Свернуть"}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {/* ── Logo ── */}
      <div
        className="px-4 pt-6 pb-5 overflow-hidden"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.35), rgba(99,102,241,0.2))",
              border: "1px solid rgba(59,130,246,0.35)",
              boxShadow: "0 0 16px rgba(59,130,246,0.2)",
            }}
          >
            ◈
          </div>
          {!collapsed && (
            <p
              className="text-[9px] font-mono tracking-[3px] uppercase leading-none whitespace-nowrap"
              style={{ color: "rgba(59,130,246,0.7)" }}
            >
              // система
            </p>
          )}
        </div>

        {!collapsed && (
          <>
            <h1
              className="text-[22px] font-bold tracking-wide leading-none mb-1"
              style={{ color: "#e8f0fe", letterSpacing: "0.05em" }}
            >
              ЦСУ ПД
            </h1>
            <p
              className="text-[10px] font-mono tracking-[2px] uppercase"
              style={{ color: "rgba(245,158,11,0.75)" }}
            >
              Научная рота · В/Ч
            </p>
          </>
        )}
      </div>

      {/* ── Nav items ── */}
      <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p
            className="text-[9px] font-mono tracking-[2.5px] uppercase px-4 pt-1 pb-3 whitespace-nowrap"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            Навигация
          </p>
        )}

        <div className={collapsed ? "px-2 space-y-1" : "px-2 space-y-0.5"}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const hasCritical = item.href === "/tasks" && criticalCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative group overflow-hidden"
                style={active ? {
                  background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.1))",
                  border: "1px solid rgba(59,130,246,0.3)",
                  color: "#93c5fd",
                  boxShadow: "0 2px 12px rgba(59,130,246,0.12)",
                } : {
                  border: "1px solid transparent",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {active && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: "#3b82f6", boxShadow: "0 0 8px #3b82f6" }}
                  />
                )}

                <span
                  className="text-[16px] shrink-0"
                  style={{ opacity: active ? 1 : 0.6, width: 20, textAlign: "center" }}
                >
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="flex-1 whitespace-nowrap">{item.label}</span>
                )}

                {!collapsed && hasCritical && (
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ml-auto"
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      boxShadow: "0 0 8px rgba(239,68,68,0.5)",
                    }}
                  >
                    {criticalCount}
                  </span>
                )}

                {collapsed && hasCritical && (
                  <span
                    className="absolute top-1 right-1 w-2 h-2 rounded-full"
                    style={{ background: "#ef4444", boxShadow: "0 0 4px #ef4444" }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* ── Categories ── */}
        {!collapsed && (
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
                  <span className="text-[12px] group-hover:scale-110 transition-transform shrink-0">
                    {cat.icon}
                  </span>
                  <span
                    className="text-[10px] font-mono font-semibold tracking-wider w-7 shrink-0"
                    style={{ color: cat.color }}
                  >
                    {cat.code}
                  </span>
                  <span className="text-[11px] truncate group-hover:text-white/70 transition-colors">
                    {cat.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Status footer ── */}
      <div
        className="px-3 py-4 overflow-hidden"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#10b981", boxShadow: "0 0 6px #10b981" }}
            />
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#f59e0b", boxShadow: "0 0 6px #f59e0b", animationDelay: "1.2s" }}
            />
          </div>
        ) : (
          <>
            <StatusRow color="#10b981" label="Система активна" delay="0s" />
            <div className="mt-1.5">
              <StatusRow color="#f59e0b" label="Offline · Local-first" delay="1.2s" />
            </div>
            <div
              className="mt-3 px-3 py-2 rounded-lg"
              style={{
                background: "rgba(59,130,246,0.05)",
                border: "1px solid rgba(59,130,246,0.12)",
              }}
            >
              <p className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                v1.0 · ЦСУ ПД 2025
              </p>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

function StatusRow({ color, label, delay }: { color: string; label: string; delay: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
        style={{ backgroundColor: color, animationDelay: delay, boxShadow: `0 0 6px ${color}` }}
      />
      <span
        className="text-[10px] font-mono tracking-wide whitespace-nowrap"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {label}
      </span>
    </div>
  );
}