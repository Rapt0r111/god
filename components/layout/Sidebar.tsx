"use client";

// components/layout/Sidebar.tsx — Vision 2026 · Warm & Friendly

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/",         icon: "⬡",  label: "Дашборд",        sub: "Сводка" },
  { href: "/tasks",    icon: "✦",  label: "Задачи",          sub: "Журнал" },
  { href: "/timeline", icon: "◈",  label: "Хронология",      sub: "Gantt" },
  { href: "/roles",    icon: "◎",  label: "Личный состав",   sub: "Люди" },
] as const;

const QUICK_CATS = [
  { code: "Н",   icon: "⚗",  label: "Наука",   color: "oklch(72% 0.17 152)" },
  { code: "БП",  icon: "🎯", label: "Боевая",  color: "oklch(67% 0.21 22)"  },
  { code: "ПД",  icon: "⚙",  label: "Повседн.", color: "oklch(74% 0.18 68)"  },
  { code: "А",   icon: "📡", label: "Агитац.", color: "oklch(70% 0.15 230)" },
] as const;

interface SidebarProps {
  criticalCount?: number;
}

export function Sidebar({ criticalCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sb_collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  const toggle = () =>
    setCollapsed(prev => {
      localStorage.setItem("sb_collapsed", prev ? "0" : "1");
      return !prev;
    });

  const w = collapsed ? "var(--sidebar-w-min)" : "var(--sidebar-w)";

  return (
    <nav
      style={{
        position: "relative",
        flexShrink: 0,
        width: w,
        transition: "width 0.30s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        zIndex: 30,
        background: "oklch(16% 0.026 270 / 0.97)",
        backdropFilter: "blur(32px)",
        borderRight: "1px solid var(--bd-1)",
        boxShadow: "4px 0 32px oklch(0% 0 0 / 0.35)",
        overflow: "hidden",
      }}
    >
      {/* Collapse toggle */}
      <button
        onClick={toggle}
        aria-label={collapsed ? "Развернуть" : "Свернуть"}
        style={{
          position: "absolute",
          right: -13,
          top: 28,
          zIndex: 1000,
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: "1px solid var(--bd-2)",
          background: "var(--bg-card)",
          color: "var(--tx-3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          cursor: "pointer",
          boxShadow: "0 2px 12px oklch(0% 0 0 / 0.45)",
          transition: "all 0.18s ease",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = "var(--tx-1)";
          e.currentTarget.style.background = "var(--bg-hover)";
          e.currentTarget.style.borderColor = "var(--bd-3)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = "var(--tx-3)";
          e.currentTarget.style.background = "var(--bg-card)";
          e.currentTarget.style.borderColor = "var(--bd-2)";
        }}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {/* ── LOGO ── */}
      <div
        style={{
          padding: collapsed ? "20px 14px 18px" : "20px 18px 18px",
          borderBottom: "1px solid var(--bd-1)",
          display: "flex",
          alignItems: "center",
          gap: 11,
          transition: "padding 0.3s ease",
          minHeight: 70,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            background: "linear-gradient(135deg, oklch(68% 0.18 288 / 0.22), oklch(74% 0.18 68 / 0.14))",
            border: "1px solid oklch(68% 0.18 288 / 0.30)",
            boxShadow: "0 2px 12px oklch(68% 0.18 288 / 0.20)",
            position: "relative",
          }}
        >
          ⬡
          <span style={{
            position: "absolute",
            top: -2, right: -2,
            width: 8, height: 8,
            borderRadius: "50%",
            background: "var(--success)",
            border: "2px solid oklch(16% 0.026 270)",
            boxShadow: "0 0 6px var(--success)",
            animation: "pulse 2.5s ease-in-out infinite",
          }} />
        </div>

        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--tx-1)",
              letterSpacing: "0.03em",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}>
              ЦСУ ПД
            </p>
            <p style={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              color: "var(--tx-4)",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              marginTop: 2,
            }}>
              Научная рота
            </p>
          </div>
        )}
      </div>

      {/* ── NAV ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: collapsed ? "12px 8px" : "12px 10px",
        }}
      >
        {!collapsed && (
          <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)", padding: "0 8px 8px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Навигация
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(item => {
            const isActive = pathname === item.href;
            const hasCrit  = item.href === "/tasks" && criticalCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: collapsed ? 0 : 10,
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "11px 0" : "10px 12px",
                  borderRadius: 14,
                  textDecoration: "none",
                  position: "relative",
                  transition: "all 0.20s ease",
                  ...(isActive ? {
                    background: "oklch(68% 0.18 288 / 0.14)",
                    border: "1px solid oklch(68% 0.18 288 / 0.28)",
                    boxShadow: "0 2px 12px oklch(68% 0.18 288 / 0.10)",
                  } : {
                    border: "1px solid transparent",
                  }),
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "oklch(100% 0 0 / 0.04)";
                    e.currentTarget.style.borderColor = "var(--bd-1)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }
                }}
              >
                {/* Active left bar */}
                {isActive && (
                  <div style={{
                    position: "absolute",
                    left: 0, top: "50%",
                    transform: "translateY(-50%)",
                    width: 3, height: 20,
                    borderRadius: "0 3px 3px 0",
                    background: "linear-gradient(180deg, oklch(74% 0.16 290), oklch(68% 0.18 288))",
                    boxShadow: "0 0 8px oklch(68% 0.18 288 / 0.60)",
                  }} />
                )}

                {/* Icon */}
                <span
                  style={{
                    fontSize: 16,
                    flexShrink: 0,
                    width: collapsed ? "100%" : 22,
                    textAlign: "center",
                    color: isActive ? "oklch(82% 0.12 290)" : "var(--tx-3)",
                    filter: isActive ? "drop-shadow(0 0 6px oklch(68% 0.18 288 / 0.55))" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  {item.icon}
                </span>

                {/* Label + sub */}
                {!collapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--tx-1)" : "var(--tx-3)",
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                    }}>
                      {item.label}
                    </p>
                    <p style={{
                      fontSize: 9,
                      fontFamily: "var(--font-mono)",
                      color: "var(--tx-4)",
                      marginTop: 1,
                    }}>
                      {item.sub}
                    </p>
                  </div>
                )}

                {/* Critical badge */}
                {hasCrit && !collapsed && (
                  <span style={{
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 99,
                    background: "oklch(67% 0.21 22 / 0.15)",
                    border: "1px solid oklch(67% 0.21 22 / 0.35)",
                    color: "oklch(80% 0.14 22)",
                    animation: "pulse 2s ease-in-out infinite",
                    flexShrink: 0,
                  }}>
                    {criticalCount}
                  </span>
                )}

                {/* Critical dot (collapsed) */}
                {hasCrit && collapsed && (
                  <span style={{
                    position: "absolute",
                    top: 8, right: 10,
                    width: 7, height: 7,
                    borderRadius: "50%",
                    background: "var(--danger)",
                    boxShadow: "0 0 7px var(--danger)",
                    animation: "pulse 2s ease-in-out infinite",
                  }} />
                )}
              </Link>
            );
          })}
        </div>

        {/* ── Quick filters ── */}
        {!collapsed && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--bd-1)" }}>
            <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)", padding: "0 8px 8px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Категории
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {QUICK_CATS.map(cat => (
                <Link
                  key={cat.code}
                  href={`/tasks?category=${cat.code}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "7px 12px",
                    borderRadius: 11,
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "oklch(100% 0 0 / 0.04)";
                    e.currentTarget.style.borderColor = "var(--bd-1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  <span style={{ fontSize: 13 }}>{cat.icon}</span>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: cat.color, width: 26, flexShrink: 0 }}>
                    {cat.code}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--tx-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cat.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        padding: collapsed ? "12px 10px" : "12px 14px",
        borderTop: "1px solid var(--bd-1)",
        flexShrink: 0,
      }}>
        {collapsed ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--success)",
              boxShadow: "0 0 8px var(--success)",
            }} />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--success)",
              boxShadow: "0 0 8px var(--success)",
              flexShrink: 0,
            }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-4)", lineHeight: 1.4 }}>
                Система работает
              </p>
              <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)", opacity: 0.6 }}>
                v2026.1
              </p>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}