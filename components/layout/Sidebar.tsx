"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/",         icon: "◈", label: "Дашборд",       desc: "Overview" },
  { href: "/tasks",    icon: "≡", label: "Задачи",         desc: "Tasks" },
  { href: "/timeline", icon: "◫", label: "Хронология",    desc: "Timeline" },
  { href: "/roles",    icon: "◉", label: "Личный состав",  desc: "Personnel" },
] as const;

const CATEGORIES = [
  { code: "Н",   icon: "⚗",  label: "Наука",            color: "#1ae8a0" },
  { code: "А",   icon: "📡", label: "Агитация",          color: "#4f8ef7" },
  { code: "БП",  icon: "🎯", label: "Боевая подготовка", color: "#ff6b6b" },
  { code: "ПД",  icon: "⚙",  label: "Повседн. деят.",    color: "#f5b942" },
  { code: "У",   icon: "🏁", label: "Увольнение",        color: "#ff8c42" },
  { code: "П",   icon: "🔰", label: "Призыв",            color: "#22d4f0" },
] as const;

interface SidebarProps {
  criticalCount?: number;
}

export function Sidebar({ criticalCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar_collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed(prev => {
      localStorage.setItem("sidebar_collapsed", String(!prev));
      return !prev;
    });
  };

  return (
    <nav
      className="relative flex flex-col z-20 transition-all duration-300 ease-in-out flex-shrink-0"
      style={{
        width: collapsed ? 68 : 228,
        background: "linear-gradient(180deg, rgba(7,13,26,0.96) 0%, rgba(4,8,15,0.98) 100%)",
        backdropFilter: "blur(32px)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "4px 0 40px rgba(0,0,0,0.6), 1px 0 0 rgba(255,255,255,0.04) inset",
      }}
    >
      {/* Toggle */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-8 z-30 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, rgba(20,32,56,0.95), rgba(12,21,40,0.98))",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
          color: "rgba(136,153,187,0.7)",
          fontSize: 10,
        }}
        title={collapsed ? "Развернуть" : "Свернуть"}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {/* Logo */}
      <div
        className="px-4 pt-6 pb-5 overflow-hidden"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[15px] shrink-0 relative"
            style={{
              background: "linear-gradient(135deg, rgba(79,142,247,0.3), rgba(34,212,240,0.15))",
              border: "1px solid rgba(79,142,247,0.3)",
              boxShadow: "0 0 20px rgba(79,142,247,0.2), 0 0 40px rgba(79,142,247,0.08)",
            }}
          >
            ◈
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
              style={{
                background: "#1ae8a0",
                boxShadow: "0 0 6px #1ae8a0",
                animation: "pulseGlow 2s ease-in-out infinite",
              }}
            />
          </div>
          {!collapsed && (
            <span
              className="text-[9px] font-mono tracking-[3px] uppercase"
              style={{ color: "rgba(79,142,247,0.65)" }}
            >
              // система
            </span>
          )}
        </div>

        {!collapsed && (
          <>
            <h1
              className="text-[20px] font-bold tracking-wider leading-none mb-1.5"
              style={{
                color: "#eef2ff",
                letterSpacing: "0.06em",
                textShadow: "0 0 30px rgba(79,142,247,0.25)",
              }}
            >
              ЦСУ ПД
            </h1>
            <p
              className="text-[9px] font-mono tracking-[2px] uppercase"
              style={{ color: "rgba(245,185,66,0.65)" }}
            >
              Научная рота · В/Ч
            </p>
          </>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p
            className="text-[8px] font-mono tracking-[2.5px] uppercase px-4 pb-3"
            style={{ color: "rgba(74,90,122,0.8)" }}
          >
            Навигация
          </p>
        )}

        <div className={collapsed ? "px-2 space-y-1.5" : "px-2.5 space-y-0.5"}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const hasCritical = item.href === "/tasks" && criticalCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-200 relative group overflow-hidden"
                style={active ? {
                  background: "linear-gradient(135deg, rgba(79,142,247,0.2), rgba(34,212,240,0.08))",
                  border: "1px solid rgba(79,142,247,0.3)",
                  color: "#eef2ff",
                  boxShadow: "0 4px 16px rgba(79,142,247,0.12), 0 1px 0 rgba(255,255,255,0.06) inset",
                } : {
                  border: "1px solid transparent",
                  color: "rgba(136,153,187,0.7)",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.color = "#eef2ff";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = "";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.color = "rgba(136,153,187,0.7)";
                  }
                }}
              >
                {active && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                    style={{
                      width: 3,
                      height: 22,
                      background: "linear-gradient(180deg, #4f8ef7, #22d4f0)",
                      boxShadow: "0 0 10px rgba(79,142,247,0.7)",
                    }}
                  />
                )}

                <span
                  className="text-[15px] shrink-0 transition-transform group-hover:scale-110 duration-200"
                  style={{
                    opacity: active ? 1 : 0.55,
                    width: 22,
                    textAlign: "center",
                    filter: active ? "drop-shadow(0 0 8px rgba(79,142,247,0.6))" : "none",
                  }}
                >
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="flex-1 whitespace-nowrap font-medium text-[13px]">
                    {item.label}
                  </span>
                )}

                {!collapsed && hasCritical && (
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "rgba(255,107,107,0.2)",
                      border: "1px solid rgba(255,107,107,0.45)",
                      color: "#ff9999",
                      boxShadow: "0 0 8px rgba(255,107,107,0.3)",
                    }}
                  >
                    {criticalCount}
                  </span>
                )}

                {collapsed && hasCritical && (
                  <span
                    className="absolute top-1 right-1 w-2 h-2 rounded-full"
                    style={{
                      background: "#ff6b6b",
                      boxShadow: "0 0 6px #ff6b6b",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Categories */}
        {!collapsed && (
          <div
            className="mt-5 pt-4 px-2.5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <p
              className="text-[8px] font-mono tracking-[2.5px] uppercase px-3 pb-2.5"
              style={{ color: "rgba(74,90,122,0.8)" }}
            >
              Категории
            </p>
            <div className="space-y-0.5">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.code}
                  href={`/tasks?category=${cat.code}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 group"
                  style={{ color: "rgba(136,153,187,0.5)" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.035)";
                    e.currentTarget.style.color = "rgba(238,242,255,0.8)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "";
                    e.currentTarget.style.color = "rgba(136,153,187,0.5)";
                  }}
                >
                  <span className="text-[12px] shrink-0 transition-transform group-hover:scale-110 duration-150">
                    {cat.icon}
                  </span>
                  <span
                    className="text-[10px] font-mono font-semibold tracking-wider w-7 shrink-0"
                    style={{ color: cat.color }}
                  >
                    {cat.code}
                  </span>
                  <span className="text-[11px] truncate">{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-3 py-4 overflow-hidden"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: "#1ae8a0", boxShadow: "0 0 6px #1ae8a0", animation: "pulseGlow 2s ease-in-out infinite" }} />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#1ae8a0", boxShadow: "0 0 6px #1ae8a0", animation: "pulseGlow 2s ease-in-out infinite" }} />
              <span className="text-[10px] font-mono" style={{ color: "rgba(136,153,187,0.5)" }}>Система онлайн</span>
            </div>
            <div
              className="px-3 py-2 rounded-xl"
              style={{
                background: "rgba(79,142,247,0.05)",
                border: "1px solid rgba(79,142,247,0.1)",
              }}
            >
              <p className="text-[9px] font-mono" style={{ color: "rgba(74,90,122,0.9)" }}>
                v1.0 · ЦСУ ПД 2025
              </p>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}