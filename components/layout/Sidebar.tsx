"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/", icon: "◈", label: "Дашборд", desc: "Dashboard" },
  { href: "/tasks", icon: "≡", label: "Задачи", desc: "Tasks" },
  { href: "/timeline", icon: "◫", label: "Хронология", desc: "Timeline" },
  { href: "/roles", icon: "◉", label: "Личный состав", desc: "Personnel" },
] as const;

const CATEGORIES = [
  { code: "Н", icon: "⚗", label: "Наука", color: "oklch(72% 0.17 155)" },
  { code: "А", icon: "📡", label: "Агитация", color: "oklch(68% 0.18 232)" },
  { code: "БП", icon: "🎯", label: "Боевая подготовка", color: "oklch(68% 0.22 25)" },
  { code: "ПД", icon: "⚙", label: "Повседн. деят.", color: "oklch(75% 0.18 75)" },
  { code: "У", icon: "🏁", label: "Увольнение", color: "oklch(72% 0.18 55)" },
  { code: "П", icon: "🔰", label: "Призыв", color: "oklch(72% 0.14 210)" },
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
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        zIndex: 20,
        flexShrink: 0,
        width: collapsed ? 68 : 232,
        transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        background: "linear-gradient(180deg, oklch(20% 0.04 266 / 0.98) 0%, oklch(17% 0.035 268 / 0.99) 100%)",
        backdropFilter: "blur(40px)",
        borderRight: "1px solid oklch(100% 0 0 / 0.07)",
        boxShadow: "4px 0 40px oklch(0% 0 0 / 0.45), 1px 0 0 oklch(100% 0 0 / 0.04) inset",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow inside sidebar */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", width: 280, height: 280, top: -60, left: -80,
          background: "oklch(68% 0.18 272 / 0.08)",
          borderRadius: "50%", filter: "blur(60px)",
        }} />
        <div style={{
          position: "absolute", width: 200, height: 200, bottom: 40, right: -60,
          background: "oklch(72% 0.14 210 / 0.06)",
          borderRadius: "50%", filter: "blur(50px)",
        }} />
      </div>

      {/* Toggle button */}
      <button
        onClick={toggle}
        aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
        style={{
          position: "absolute", right: -12, top: 32, zIndex: 30,
          width: 26, height: 26, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, oklch(30% 0.05 264 / 0.98), oklch(24% 0.04 266 / 0.99))",
          border: "1px solid oklch(100% 0 0 / 0.12)",
          boxShadow: "0 4px 16px oklch(0% 0 0 / 0.5)",
          color: "oklch(68% 0.18 272 / 0.8)",
          fontSize: 19, cursor: "pointer", transition: "all 0.2s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = "oklch(88% 0.08 272)"; e.currentTarget.style.boxShadow = "0 4px 20px oklch(0% 0 0 / 0.6), 0 0 8px oklch(68% 0.18 272 / 0.2)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "oklch(68% 0.18 272 / 0.8)"; e.currentTarget.style.boxShadow = "0 4px 16px oklch(0% 0 0 / 0.5)"; }}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {/* ── LOGO ZONE ── */}
      <div style={{
        padding: collapsed ? "24px 14px 20px" : "24px 20px 20px",
        borderBottom: "1px solid oklch(100% 0 0 / 0.07)",
        position: "relative",
        transition: "padding 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: collapsed ? 0 : 12 }}>
          {/* Logo orb */}
          <div style={{
            width: 38, height: 38, borderRadius: 14, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
            background: "linear-gradient(135deg, oklch(68% 0.18 272 / 0.25), oklch(72% 0.14 210 / 0.15))",
            border: "1px solid oklch(68% 0.18 272 / 0.35)",
            boxShadow: "0 0 24px oklch(68% 0.18 272 / 0.18), 0 4px 12px oklch(0% 0 0 / 0.3)",
            position: "relative",
          }}>
            ◈
            <span style={{
              position: "absolute", top: -2, right: -2,
              width: 8, height: 8, borderRadius: "50%",
              background: "oklch(72% 0.17 155)",
              boxShadow: "0 0 8px oklch(72% 0.17 155 / 0.8)",
              border: "2px solid oklch(20% 0.04 266)",
              animation: "pulseGlow 2s ease-in-out infinite",
            }} />
          </div>

          {!collapsed && (
            <span style={{
              fontSize: 9, fontFamily: "var(--font-mono)",
              letterSpacing: "3px", textTransform: "uppercase",
              color: "oklch(68% 0.18 272 / 0.6)",
              whiteSpace: "nowrap",
            }}>
              // система
            </span>
          )}
        </div>

        {!collapsed && (
          <>
            <h1 style={{
              fontSize: 22, fontWeight: 700, letterSpacing: "0.07em",
              lineHeight: 1, marginBottom: 5,
              color: "oklch(96% 0.008 255)",
              textShadow: "0 0 32px oklch(68% 0.18 272 / 0.22)",
            }}>
              ЦСУ ПД
            </h1>
            <p style={{
              fontSize: 9, fontFamily: "var(--font-mono)",
              letterSpacing: "2.5px", textTransform: "uppercase",
              color: "oklch(75% 0.18 75 / 0.55)",
            }}>
              Научная рота · В/Ч
            </p>
          </>
        )}
      </div>

      {/* ── NAVIGATION ── */}
      <div style={{ flex: 1, padding: collapsed ? "16px 8px" : "16px 10px", overflowY: "auto", overflowX: "hidden", position: "relative" }}>
        {!collapsed && (
          <p style={{
            fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: "2.5px",
            textTransform: "uppercase", color: "oklch(50% 0.04 260)",
            padding: "0 12px 12px",
          }}>
            Навигация
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            const hasCritical = item.href === "/tasks" && criticalCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                style={{
                  display: "flex", alignItems: "center",
                  gap: collapsed ? 0 : 12,
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "12px 0" : "11px 14px",
                  borderRadius: 18,
                  textDecoration: "none",
                  position: "relative",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  ...(active ? {
                    background: "linear-gradient(135deg, oklch(68% 0.18 272 / 0.18), oklch(72% 0.14 210 / 0.08))",
                    border: "1px solid oklch(68% 0.18 272 / 0.32)",
                    boxShadow: "0 4px 20px oklch(68% 0.18 272 / 0.12), 0 1px 0 oklch(100% 0 0 / 0.06) inset",
                  } : {
                    border: "1px solid transparent",
                  }),
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = "oklch(100% 0 0 / 0.04)";
                    e.currentTarget.style.borderColor = "oklch(100% 0 0 / 0.08)";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }
                }}
              >
                {/* Active indicator stripe */}
                {active && (
                  <div style={{
                    position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                    width: 3, height: 22, borderRadius: "0 3px 3px 0",
                    background: "linear-gradient(180deg, oklch(68% 0.18 272), oklch(72% 0.14 210))",
                    boxShadow: "0 0 10px oklch(68% 0.18 272 / 0.7)",
                  }} />
                )}

                {/* Icon */}
                <span style={{
                  fontSize: 16, flexShrink: 0,
                  width: collapsed ? "100%" : 22,
                  textAlign: "center",
                  opacity: active ? 1 : 0.5,
                  filter: active ? "drop-shadow(0 0 8px oklch(68% 0.18 272 / 0.6))" : "none",
                  transition: "all 0.2s ease",
                  color: active ? "oklch(88% 0.06 272)" : "oklch(75% 0.04 258)",
                }}>
                  {item.icon}
                </span>

                {/* Label */}
                {!collapsed && (
                  <span style={{
                    flex: 1, fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? "oklch(96% 0.008 255)" : "oklch(65% 0.04 258)",
                    whiteSpace: "nowrap",
                    transition: "color 0.2s ease",
                  }}>
                    {item.label}
                  </span>
                )}

                {/* Critical badge */}
                {!collapsed && hasCritical && (
                  <span style={{
                    fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700,
                    padding: "2px 7px", borderRadius: 20,
                    background: "oklch(68% 0.22 25 / 0.18)",
                    border: "1px solid oklch(68% 0.22 25 / 0.42)",
                    color: "oklch(82% 0.12 25)",
                    boxShadow: "0 0 8px oklch(68% 0.22 25 / 0.28)",
                    animation: "pulseGlow 1.5s ease-in-out infinite",
                  }}>
                    {criticalCount}
                  </span>
                )}

                {/* Critical dot (collapsed) */}
                {collapsed && hasCritical && (
                  <span style={{
                    position: "absolute", top: 6, right: 6,
                    width: 8, height: 8, borderRadius: "50%",
                    background: "oklch(68% 0.22 25)",
                    boxShadow: "0 0 8px oklch(68% 0.22 25 / 0.8)",
                    animation: "pulseGlow 1.5s ease-in-out infinite",
                  }} />
                )}
              </Link>
            );
          })}
        </div>

        {/* ── CATEGORIES ── */}
        {!collapsed && (
          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid oklch(100% 0 0 / 0.06)",
          }}>
            <p style={{
              fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: "2.5px",
              textTransform: "uppercase", color: "oklch(50% 0.04 260)",
              padding: "0 12px 12px",
            }}>
              Категории
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.code}
                  href={`/tasks?category=${cat.code}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 14px", borderRadius: 12,
                    textDecoration: "none",
                    color: "oklch(60% 0.04 258)",
                    transition: "all 0.15s ease",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "oklch(100% 0 0 / 0.035)";
                    e.currentTarget.style.borderColor = "oklch(100% 0 0 / 0.07)";
                    e.currentTarget.style.color = "oklch(82% 0.04 258)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.color = "oklch(60% 0.04 258)";
                  }}
                >
                  <span style={{ fontSize: 12, flexShrink: 0 }}>{cat.icon}</span>
                  <span style={{
                    fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600,
                    letterSpacing: "0.5px", flexShrink: 0, width: 28,
                    color: cat.color,
                  }}>
                    {cat.code}
                  </span>
                  <span style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cat.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}