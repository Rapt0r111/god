"use client";

// components/roles/RolesClient.tsx — Vision 2026 · Personnel

import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────────────

type Task = {
  id: number;
  title: string;
  category: string;
  month: number;
  dateFrom: number;
  dateTo: number;
  responsible: string;
  status: "pending" | "in_progress" | "done" | "cancelled";
  priority: "critical" | "high" | "normal";
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  createdAt?: Date | string | null;
};

// ── Constants ─────────────────────────────────────────────────────────

const MONTHS_SHORT = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];

const CAT_META: Record<string, { icon: string; color: string }> = {
  "Н":   { icon: "⚗",  color: "oklch(72% 0.17 152)" },
  "А":   { icon: "📡", color: "oklch(70% 0.15 230)" },
  "БП":  { icon: "🎯", color: "oklch(67% 0.21 22)"  },
  "ПД":  { icon: "⚙",  color: "oklch(74% 0.18 68)"  },
  "ВПР": { icon: "🎖", color: "oklch(68% 0.18 288)" },
  "У":   { icon: "🏁", color: "oklch(74% 0.17 60)"  },
  "П":   { icon: "🔰", color: "oklch(70% 0.15 210)" },
  "ЗиТ": { icon: "💻", color: "oklch(62% 0.06 258)" },
  "ЕМ":  { icon: "📋", color: "oklch(74% 0.18 68)"  },
  "НД":  { icon: "🔬", color: "oklch(72% 0.17 152)" },
  "МГ":  { icon: "⚡", color: "oklch(67% 0.21 22)"  },
};

const ROLE_META: Record<string, { label: string; color: string; icon: string; rank: number }> = {
  admin:   { label: "Командир",    color: "oklch(74% 0.18 68)",  icon: "🎖", rank: 0 },
  officer: { label: "Офицер",      color: "oklch(68% 0.18 288)", icon: "◈",  rank: 1 },
  member:  { label: "Сотрудник",   color: "oklch(72% 0.17 152)", icon: "◆",  rank: 2 },
  viewer:  { label: "Наблюдатель", color: "oklch(62% 0.06 258)", icon: "○",  rank: 3 },
};

const SORT_OPTIONS = [
  { value: "load_desc",  label: "По нагрузке ↓" },
  { value: "load_asc",   label: "По нагрузке ↑" },
  { value: "done_desc",  label: "По выполнению ↓" },
  { value: "alpha",      label: "По алфавиту"    },
  { value: "role",       label: "По роли"        },
] as const;

type SortKey = typeof SORT_OPTIONS[number]["value"];

// ── Helpers ───────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function isOverdue(task: Task): boolean {
  const now = new Date();
  const curM = now.getMonth() + 1;
  const curD = now.getDate();
  if (task.status === "done" || task.status === "cancelled") return false;
  if (task.month < curM) return true;
  if (task.month === curM && task.dateTo < curD) return true;
  return false;
}

function getLoadColor(pct: number): string {
  if (pct >= 80) return "oklch(67% 0.21 22)";
  if (pct >= 50) return "oklch(74% 0.18 68)";
  return "oklch(68% 0.18 288)";
}

// Build avatar color deterministically from name
function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `oklch(62% 0.18 ${hue})`;
}

// ── Personnel Stats ───────────────────────────────────────────────────

type PersonStats = {
  name: string;
  user: User | null;
  total: number;
  done: number;
  inProgress: number;
  critical: number;
  overdue: number;
  byCategory: Record<string, number>;
  byMonth: number[];
  pctDone: number;
  activeTasks: Task[];
};

function buildStats(name: string, tasks: Task[], user: User | null): PersonStats {
  const done       = tasks.filter(t => t.status === "done").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const critical   = tasks.filter(t => t.priority === "critical" && t.status !== "done" && t.status !== "cancelled").length;
  const overdue    = tasks.filter(isOverdue).length;
  const total      = tasks.length;
  const pctDone    = total > 0 ? Math.round((done / total) * 100) : 0;

  const byCategory: Record<string, number> = {};
  tasks.forEach(t => { byCategory[t.category] = (byCategory[t.category] ?? 0) + 1; });

  const byMonth = Array.from({ length: 12 }, (_, i) =>
    tasks.filter(t => t.month === i + 1).length
  );

  const activeTasks = tasks
    .filter(t => t.status !== "done" && t.status !== "cancelled")
    .sort((a, b) => {
      const ac = a.priority === "critical" ? 0 : a.priority === "high" ? 1 : 2;
      const bc = b.priority === "critical" ? 0 : b.priority === "high" ? 1 : 2;
      return ac - bc || a.month - b.month || a.dateFrom - b.dateFrom;
    })
    .slice(0, 5);

  return { name, user, total, done, inProgress, critical, overdue, byCategory, byMonth, pctDone, activeTasks };
}

// ── Mini Month Sparkline ──────────────────────────────────────────────

function MonthSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const cur = new Date().getMonth(); // 0-indexed
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 22 }}>
      {data.map((v, i) => {
        const h = v > 0 ? Math.max(Math.round((v / max) * 18), 4) : 2;
        return (
          <div
            key={i}
            title={`${MONTHS_SHORT[i + 1]}: ${v}`}
            style={{
              flex: 1, height: h, borderRadius: 2,
              background: i === cur
                ? "oklch(74% 0.18 68 / 0.80)"
                : v > 0
                  ? "oklch(68% 0.18 288 / 0.45)"
                  : "oklch(100% 0 0 / 0.07)",
              transition: "height 0.5s ease",
            }}
          />
        );
      })}
    </div>
  );
}

// ── Category Breakdown ────────────────────────────────────────────────

function CategoryBreakdown({ byCategory, total }: { byCategory: Record<string, number>; total: number }) {
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {sorted.map(([cat, count]) => {
        const cm = CAT_META[cat];
        return (
          <span
            key={cat}
            title={`${cat}: ${count} задач`}
            style={{
              fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 600,
              padding: "2px 8px", borderRadius: 99,
              color: cm?.color ?? "var(--tx-3)",
              background: `${(cm?.color ?? "oklch(68% 0.18 288)").replace(")", " / 0.12)")}`,
              border: `1px solid ${(cm?.color ?? "oklch(68% 0.18 288)").replace(")", " / 0.24)")}`,
            }}
          >
            {cm?.icon ?? "•"} {cat} ×{count}
          </span>
        );
      })}
    </div>
  );
}

// ── Active Task Pill ──────────────────────────────────────────────────

function ActiveTaskPill({ task }: { task: Task }) {
  const cat = CAT_META[task.category] ?? { icon: "•", color: "var(--tx-3)" };
  const over = isOverdue(task);
  const isCrit = task.priority === "critical";
  const accentColor = over
    ? "oklch(67% 0.21 22)"
    : isCrit
      ? "oklch(67% 0.21 22)"
      : task.status === "in_progress"
        ? "oklch(74% 0.18 68)"
        : "var(--tx-4)";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 11px", borderRadius: 10,
      background: over || isCrit ? "oklch(67% 0.21 22 / 0.06)" : "oklch(100% 0 0 / 0.03)",
      border: over || isCrit ? "1px solid oklch(67% 0.21 22 / 0.20)" : "1px solid var(--bd-1)",
    }}>
      <span style={{ fontSize: 12, flexShrink: 0 }}>{cat.icon}</span>
      <span style={{
        flex: 1, minWidth: 0,
        fontSize: 11, fontWeight: 500, color: "var(--tx-2)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {task.title}
      </span>
      <span style={{
        fontSize: 8, fontFamily: "var(--font-mono)", fontWeight: 700, flexShrink: 0,
        padding: "1px 7px", borderRadius: 99,
        color: accentColor,
        background: `${accentColor.replace(")", " / 0.10)")}`,
        border: `1px solid ${accentColor.replace(")", " / 0.24)")}`,
      }}>
        {MONTHS_SHORT[task.month]} {task.dateFrom === task.dateTo ? task.dateFrom : `${task.dateFrom}–${task.dateTo}`}
      </span>
    </div>
  );
}

// ── Personnel Card ────────────────────────────────────────────────────

function PersonCard({ stats, expanded, onToggle }: {
  stats: PersonStats;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { name, user, total, done, inProgress, critical, overdue, pctDone, activeTasks, byCategory, byMonth } = stats;
  const role = user?.role ?? "member";
  const rm   = ROLE_META[role] ?? ROLE_META.member;
  const avatarColor = nameToColor(name);
  const loadColor   = getLoadColor(total > 0 ? (total - done) / Math.max(total, 1) * 100 : 0);
  const hasCrit     = critical > 0;
  const hasOver     = overdue > 0;

  return (
    <div
      style={{
        borderRadius: 20, overflow: "hidden",
        background: hasCrit
          ? "linear-gradient(145deg, oklch(67% 0.21 22 / 0.06), var(--bg-card))"
          : "var(--bg-card)",
        border: hasCrit
          ? "1px solid oklch(67% 0.21 22 / 0.22)"
          : "1px solid var(--bd-1)",
        boxShadow: "0 4px 20px oklch(0% 0 0 / 0.20)",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 30px oklch(0% 0 0 / 0.30)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px oklch(0% 0 0 / 0.20)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* ── Main info ── */}
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "oklch(98% 0 0)",
              background: user?.image
                ? "transparent"
                : `linear-gradient(145deg, ${avatarColor}, ${avatarColor.replace("oklch(62%", "oklch(52%")})`,
              border: `2px solid ${avatarColor.replace(")", " / 0.40)")}`,
              overflow: "hidden",
            }}>
              {user?.image
                ? <img src={user.image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : getInitials(name)
              }
            </div>
            {/* Online dot */}
            <div style={{
              position: "absolute", bottom: 2, right: 2,
              width: 10, height: 10, borderRadius: "50%",
              background: "var(--success)",
              border: "2px solid var(--bg-card)",
              boxShadow: "0 0 6px var(--success)",
            }} />
          </div>

          {/* Name + role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <h3 style={{
                fontSize: 15, fontWeight: 700, color: "var(--tx-1)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {name}
              </h3>
              {hasCrit && (
                <span style={{
                  fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, flexShrink: 0,
                  padding: "2px 8px", borderRadius: 99,
                  color: "oklch(67% 0.21 22)",
                  background: "oklch(67% 0.21 22 / 0.12)",
                  border: "1px solid oklch(67% 0.21 22 / 0.28)",
                  animation: "pulse 2s ease-in-out infinite",
                }}>
                  ⚡ {critical}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{
                fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600,
                padding: "2px 9px", borderRadius: 99,
                color: rm.color,
                background: `${rm.color.replace(")", " / 0.12)")}`,
                border: `1px solid ${rm.color.replace(")", " / 0.28)")}`,
              }}>
                {rm.icon} {rm.label}
              </span>
              {user?.email && (
                <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-4)" }}>
              Выполнение задач
            </span>
            <span style={{
              fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700,
              color: pctDone === 100 ? "var(--success)" : loadColor,
            }}>
              {done}/{total} · {pctDone}%
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 6, overflow: "hidden", background: "oklch(100% 0 0 / 0.07)" }}>
            <div style={{
              height: "100%", width: `${pctDone}%`, borderRadius: 6,
              background: pctDone === 100
                ? "linear-gradient(90deg, var(--success), oklch(72% 0.17 152 / 0.70))"
                : `linear-gradient(90deg, ${loadColor}, ${loadColor.replace(")", " / 0.70)")})`,
              boxShadow: `0 0 8px ${loadColor.replace(")", " / 0.35)")}`,
              transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }} />
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
          {[
            { label: "Всего",     val: total,      color: "var(--tx-2)"              },
            { label: "В работе",  val: inProgress, color: "oklch(74% 0.18 68)"       },
            { label: "Просроч.",  val: overdue,    color: overdue > 0 ? "oklch(67% 0.21 22)" : "var(--tx-4)" },
            { label: "Выполн.",   val: done,       color: "var(--success)"            },
          ].map(k => (
            <div key={k.label} style={{
              padding: "8px 10px", borderRadius: 12, textAlign: "center",
              background: "oklch(100% 0 0 / 0.03)", border: "1px solid var(--bd-1)",
            }}>
              <p style={{
                fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)",
                color: k.color, lineHeight: 1, marginBottom: 3,
                fontVariantNumeric: "tabular-nums",
                textShadow: k.val > 0 ? `0 0 12px ${k.color.replace(")", " / 0.30)")}` : "none",
              }}>
                {k.val}
              </p>
              <p style={{ fontSize: 8, fontFamily: "var(--font-mono)", color: "var(--tx-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {k.label}
              </p>
            </div>
          ))}
        </div>

        {/* Month sparkline */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Нагрузка по месяцам
          </p>
          <MonthSparkline data={byMonth} />
          {/* Month labels */}
          <div style={{ display: "flex", gap: 2, marginTop: 3 }}>
            {MONTHS_SHORT.slice(1).map((m, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <span style={{
                  fontSize: 6, fontFamily: "var(--font-mono)", display: "block",
                  color: i === new Date().getMonth() ? "oklch(74% 0.18 68)" : "var(--tx-4)",
                  overflow: "hidden",
                }}>
                  {m.slice(0, 1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <CategoryBreakdown byCategory={byCategory} total={total} />
      </div>

      {/* ── Expand toggle ── */}
      {activeTasks.length > 0 && (
        <button
          onClick={onToggle}
          style={{
            width: "100%", padding: "10px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 500,
            color: "var(--tx-4)", cursor: "pointer",
            background: "oklch(100% 0 0 / 0.02)",
            border: "none",
            borderTop: "1px solid var(--bd-1)",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.05)"; e.currentTarget.style.color = "var(--tx-2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.02)"; e.currentTarget.style.color = "var(--tx-4)"; }}
        >
          <span>Активные задачи ({activeTasks.length})</span>
          <span style={{
            fontSize: 14, transition: "transform 0.25s ease",
            display: "inline-block",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}>
            ∨
          </span>
        </button>
      )}

      {/* ── Expanded task list ── */}
      {expanded && activeTasks.length > 0 && (
        <div style={{
          padding: "10px 14px 14px",
          borderTop: "1px solid var(--bd-1)",
          display: "flex", flexDirection: "column", gap: 5,
          animation: "fadeUp 0.22s ease forwards",
        }}>
          {activeTasks.map(t => (
            <ActiveTaskPill key={t.id} task={t} />
          ))}
          <a
            href={`/tasks?responsible=${encodeURIComponent(name)}`}
            style={{
              marginTop: 4, textAlign: "center",
              fontSize: 10, fontFamily: "var(--font-mono)",
              color: "oklch(68% 0.18 288 / 0.70)", textDecoration: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "oklch(68% 0.18 288)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "oklch(68% 0.18 288 / 0.70)"; }}
          >
            Все задачи в журнале →
          </a>
        </div>
      )}
    </div>
  );
}

// ── Summary KPI Bar ───────────────────────────────────────────────────

function SummaryBar({ stats }: { stats: PersonStats[] }) {
  const totalPersonnel = stats.length;
  const totalTasks     = stats.reduce((s, p) => s + p.total, 0);
  const totalDone      = stats.reduce((s, p) => s + p.done, 0);
  const totalCrit      = stats.reduce((s, p) => s + p.critical, 0);
  const totalOverdue   = stats.reduce((s, p) => s + p.overdue, 0);
  const pct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  return (
    <div
      className="animate-fade-up"
      style={{
        display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12,
        marginBottom: 2,
      }}
    >
      {[
        { label: "Личный состав", val: totalPersonnel, color: "oklch(68% 0.18 288)", icon: "◎" },
        { label: "Всего задач",   val: totalTasks,     color: "var(--tx-2)",          icon: "◻" },
        { label: "Выполнено",     val: `${totalDone} (${pct}%)`, color: "var(--success)", icon: "✓" },
        { label: "Критичных",     val: totalCrit,      color: totalCrit > 0 ? "oklch(67% 0.21 22)" : "var(--tx-4)", icon: "⚡" },
        { label: "Просрочено",    val: totalOverdue,   color: totalOverdue > 0 ? "oklch(67% 0.21 22)" : "var(--tx-4)", icon: "⏱" },
      ].map((k, i) => (
        <div
          key={k.label}
          className="animate-fade-up"
          style={{
            padding: "16px 20px", borderRadius: 18,
            background: "var(--bg-card)", border: "1px solid var(--bd-1)",
            boxShadow: "0 3px 16px oklch(0% 0 0 / 0.18)",
            animationDelay: `${i * 0.06}s`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {k.label}
            </span>
            <span style={{ fontSize: 15, opacity: 0.30 }}>{k.icon}</span>
          </div>
          <p style={{
            fontSize: 28, fontWeight: 700, fontFamily: "var(--font-mono)",
            color: k.color, lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            textShadow: `0 0 20px ${typeof k.color === "string" ? k.color.replace(")", " / 0.30)") : "transparent"}`,
          }}>
            {k.val}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export function RolesClient({ tasks, users }: { tasks: Task[]; users: User[] }) {
  const [search,    setSearch]    = useState("");
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [sortBy,    setSortBy]    = useState<SortKey>("load_desc");
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set());

  // Build unique list of responsible names
  const allPersonnel = useMemo(() => {
    const namesFromTasks = new Set(tasks.map(t => t.responsible.trim()).filter(Boolean));
    // Merge with user accounts
    const userNames = new Set(users.map(u => u.name?.trim()).filter(Boolean));
    const all = new Set([...namesFromTasks, ...userNames]);
    return Array.from(all);
  }, [tasks, users]);

  // Build stats per person
  const allStats = useMemo<PersonStats[]>(() => {
    return allPersonnel.map(name => {
      const personTasks = tasks.filter(t => t.responsible.trim() === name);
      const user = users.find(u => u.name?.trim() === name) ?? null;
      return buildStats(name, personTasks, user);
    });
  }, [allPersonnel, tasks, users]);

  // Active roles
  const activeRoles = useMemo(() => {
    const s = new Set(allStats.map(s => s.user?.role ?? "member"));
    return Array.from(s);
  }, [allStats]);

  // Filter + search + sort
  const displayed = useMemo(() => {
    let res = allStats;

    if (search)     res = res.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(search.toLowerCase())
    );
    if (filterRole) res = res.filter(s => (s.user?.role ?? "member") === filterRole);

    res = [...res].sort((a, b) => {
      switch (sortBy) {
        case "load_desc":  return (b.total - b.done) - (a.total - a.done);
        case "load_asc":   return (a.total - a.done) - (b.total - b.done);
        case "done_desc":  return b.pctDone - a.pctDone;
        case "alpha":      return a.name.localeCompare(b.name, "ru");
        case "role": {
          const ra = ROLE_META[a.user?.role ?? "member"]?.rank ?? 99;
          const rb = ROLE_META[b.user?.role ?? "member"]?.rank ?? 99;
          return ra - rb;
        }
        default: return 0;
      }
    });
    return res;
  }, [allStats, search, filterRole, sortBy]);

  function toggleExpand(name: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 1200 }}>

      {/* ── Summary KPI bar ── */}
      <SummaryBar stats={allStats} />

      {/* ── Controls ── */}
      <div
        className="animate-fade-up"
        style={{
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          padding: "12px 16px", borderRadius: 16,
          background: "var(--bg-card)", border: "1px solid var(--bd-1)",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 320 }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            fontSize: 14, color: "var(--tx-4)", pointerEvents: "none",
          }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени..."
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 14px 8px 34px", borderRadius: 11,
              fontSize: 12, fontFamily: "inherit",
              background: "oklch(100% 0 0 / 0.05)", border: "1px solid var(--bd-1)",
              color: "var(--tx-1)", outline: "none", transition: "border-color 0.15s ease",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "oklch(68% 0.18 288 / 0.50)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "var(--bd-1)"; }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
              fontSize: 15, color: "var(--tx-4)", background: "none", border: "none", cursor: "pointer",
            }}>×</button>
          )}
        </div>

        {/* Role chips */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <button
            onClick={() => setFilterRole(null)}
            style={{
              padding: "5px 12px", borderRadius: 99, cursor: "pointer",
              fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: filterRole === null ? 600 : 400,
              color: filterRole === null ? "oklch(68% 0.18 288)" : "var(--tx-4)",
              background: filterRole === null ? "oklch(68% 0.18 288 / 0.12)" : "oklch(100% 0 0 / 0.04)",
              border: filterRole === null ? "1px solid oklch(68% 0.18 288 / 0.30)" : "1px solid var(--bd-1)",
              transition: "all 0.15s ease",
            }}
          >
            Все роли
          </button>
          {activeRoles.map(r => {
            const rm = ROLE_META[r] ?? ROLE_META.member;
            const active = filterRole === r;
            return (
              <button
                key={r}
                onClick={() => setFilterRole(active ? null : r)}
                style={{
                  padding: "5px 12px", borderRadius: 99, cursor: "pointer",
                  fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: active ? 600 : 400,
                  color: active ? rm.color : "var(--tx-4)",
                  background: active ? `${rm.color.replace(")", " / 0.12)")}` : "oklch(100% 0 0 / 0.04)",
                  border: active ? `1px solid ${rm.color.replace(")", " / 0.30)")}` : "1px solid var(--bd-1)",
                  transition: "all 0.15s ease",
                }}
              >
                {rm.icon} {rm.label}
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortKey)}
            style={{
              padding: "7px 12px", borderRadius: 11, cursor: "pointer",
              fontSize: 11, fontFamily: "var(--font-mono)",
              background: "oklch(100% 0 0 / 0.05)", border: "1px solid var(--bd-1)",
              color: "var(--tx-2)", outline: "none",
            }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value} style={{ background: "oklch(20% 0.028 268)" }}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Expand all / collapse */}
        <button
          onClick={() => {
            if (expanded.size > 0) setExpanded(new Set());
            else setExpanded(new Set(displayed.map(s => s.name)));
          }}
          style={{
            padding: "7px 14px", borderRadius: 11, cursor: "pointer",
            fontSize: 11, fontFamily: "var(--font-mono)",
            color: "var(--tx-3)", border: "1px solid var(--bd-1)",
            background: "oklch(100% 0 0 / 0.03)", transition: "all 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.07)"; e.currentTarget.style.color = "var(--tx-1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.03)"; e.currentTarget.style.color = "var(--tx-3)"; }}
        >
          {expanded.size > 0 ? "Свернуть все" : "Развернуть все"}
        </button>
      </div>

      {/* ── Card Grid ── */}
      {displayed.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "64px 0",
          borderRadius: 22, background: "var(--bg-card)", border: "1px solid var(--bd-1)",
        }}>
          <div style={{ fontSize: 36, opacity: 0.15, marginBottom: 14 }}>◎</div>
          <p style={{ fontSize: 14, color: "var(--tx-3)" }}>Сотрудники не найдены</p>
          <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--tx-4)", marginTop: 5 }}>
            Попробуйте изменить фильтры
          </p>
        </div>
      ) : (
        <div
          className="animate-fade-up delay-2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 14,
          }}
        >
          {displayed.map(stats => (
            <PersonCard
              key={stats.name}
              stats={stats}
              expanded={expanded.has(stats.name)}
              onToggle={() => toggleExpand(stats.name)}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {displayed.length > 0 && (
        <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-4)", textAlign: "center" }}>
          Показано {displayed.length} из {allPersonnel.length} сотрудников
        </p>
      )}
    </div>
  );
}