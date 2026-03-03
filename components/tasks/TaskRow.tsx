// components/tasks/TaskRow.tsx
// FIXED:      BUG-2    — was empty stub
// REFACTORED: Phase 1  — replaced inline CAT_META / PRI_META / ST_META / MONTHS_SHORT
//                        with imports from @/lib/config/meta and @/lib/config/constants
"use client";

// REFACTORED: Phase 1 — import from canonical config instead of inlining
import { getCategoryMeta, getPriorityMeta, getStatusMeta } from "@/lib/config/meta";

// ── Types ─────────────────────────────────────────────────────────────────────

type SubtaskStatus = "pending" | "in_progress" | "done" | "cancelled";

type Subtask = {
  id: number;
  title: string;
  status: SubtaskStatus;
  description?: string | null;
};

export type TaskRowData = {
  id: number;
  title: string;
  category: string;
  month: number;
  dateFrom: number;
  dateTo: number;
  responsible: string;
  status: "pending" | "in_progress" | "done" | "cancelled";
  priority: "critical" | "high" | "normal";
  description?: string | null;
  notes?: string | null;
  subtasks?: Subtask[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDueInDays(task: TaskRowData): number {
  const now  = new Date();
  const curM = now.getMonth() + 1;
  const curD = now.getDate();
  if (task.month < curM) return -999;
  if (task.month > curM) return (task.month - curM) * 30;
  return task.dateTo - curD;
}

function isOverdue(task: TaskRowData): boolean {
  return getDueInDays(task) < 0 && task.status !== "done" && task.status !== "cancelled";
}

function isCritical(task: TaskRowData): boolean {
  const d = getDueInDays(task);
  return (task.priority === "critical" || d <= 2) && task.status !== "done" && task.status !== "cancelled";
}

// ── TaskRow ───────────────────────────────────────────────────────────────────

export interface TaskRowProps {
  task: TaskRowData;
  onEdit: (task: TaskRowData) => void;
  onCycleStatus: (task: TaskRowData) => void;
  isPending?: boolean;
}

export function TaskRow({ task, onEdit, onCycleStatus, isPending = false }: TaskRowProps) {
  // REFACTORED: Phase 1 — was: const cat = CAT_META[task.category] ?? { icon: "•", ... }
  const cat = getCategoryMeta(task.category);
  const pri = getPriorityMeta(task.priority);
  const st  = getStatusMeta(task.status);

  const overdue     = isOverdue(task);
  const crit        = isCritical(task);
  const dueIn       = getDueInDays(task);
  const isDone      = task.status === "done";
  const isCancelled = task.status === "cancelled";

  const subs  = task.subtasks ?? [];
  const sDone = subs.filter(s => s.status === "done").length;
  const pct   = subs.length > 0 ? Math.round((sDone / subs.length) * 100) : null;

  const dateStr = task.dateFrom === task.dateTo
    ? String(task.dateFrom)
    : `${task.dateFrom}–${task.dateTo}`;

  const urgencyColor = overdue || dueIn <= 2
    ? "oklch(67% 0.21 22)"
    : dueIn <= 7
      ? "oklch(74% 0.18 68)"
      : "var(--tx-4)";

  const urgencyLabel = overdue
    ? "просрочено"
    : dueIn <= 0
      ? "сегодня"
      : dueIn === 1
        ? "завтра"
        : `${dueIn} дн.`;

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 0,
        borderRadius: 14, overflow: "hidden",
        background: isDone
          ? "oklch(100% 0 0 / 0.02)"
          : crit
            ? "linear-gradient(135deg, oklch(67% 0.21 22 / 0.07), transparent 60%)"
            : "var(--bg-raised)",
        border: isDone
          ? "1px solid var(--bd-1)"
          : crit
            ? "1px solid oklch(67% 0.21 22 / 0.24)"
            : "1px solid var(--bd-1)",
        opacity: isPending ? 0.5 : isCancelled ? 0.45 : 1,
        transition: "all 0.18s ease",
        position: "relative",
      }}
    >
      {/* Priority bar */}
      <div style={{
        width: 3, alignSelf: "stretch", flexShrink: 0,
        background: isDone || isCancelled ? "transparent" : pri.color,
        boxShadow: crit && !isDone ? `0 0 8px ${pri.color.replace(")", " / 0.5)")}` : "none",
      }} />

      {/* Status toggle */}
      <button
        onClick={() => onCycleStatus(task)}
        title={`Статус: ${st.label} → следующий`}
        style={{
          width: 44, alignSelf: "stretch", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          background: "transparent", border: "none",
          borderRight: "1px solid var(--bd-1)",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = `${st.color.replace(")", " / 0.10)")}`; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: 7,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: isDone ? 12 : 11,
          border: `2px solid ${isDone ? "oklch(72% 0.17 152 / 0.70)" : `${st.color.replace(")", " / 0.45)")}`}`,
          background: isDone ? "oklch(72% 0.17 152 / 0.15)" : "transparent",
          color: isDone ? "var(--success)" : st.color,
          transition: "all 0.15s ease",
        }}>
          {isDone ? "✓" : isCancelled ? "✕" : ""}
        </div>
      </button>

      {/* Main content — clickable to edit */}
      <button
        onClick={() => onEdit(task)}
        style={{
          flex: 1, minWidth: 0, textAlign: "left", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12,
          padding: "11px 14px",
          background: "transparent", border: "none",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.03)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        {/* Category icon */}
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15,
          background: `${cat.color.replace(")", " / 0.12)")}`,
          border: `1px solid ${cat.color.replace(")", " / 0.22)")}`,
        }}>
          {cat.icon}
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3,
            color: isDone || isCancelled ? "var(--tx-4)" : overdue ? "oklch(82% 0.10 22)" : "var(--tx-1)",
            textDecoration: isDone || isCancelled ? "line-through" : "none",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            marginBottom: 4,
          }}>
            {task.title}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 600,
              padding: "2px 7px", borderRadius: 99,
              color: cat.color,
              background: `${cat.color.replace(")", " / 0.10)")}`,
              border: `1px solid ${cat.color.replace(")", " / 0.22)")}`,
            }}>
              {cat.icon} {task.category}
            </span>
            <span style={{
              fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-3)",
              padding: "2px 7px", borderRadius: 99,
              background: "oklch(100% 0 0 / 0.04)", border: "1px solid var(--bd-1)",
            }}>
              {task.responsible}
            </span>
            {subs.length > 0 && (
              <span style={{
                fontSize: 9, fontFamily: "var(--font-mono)",
                color: pct === 100 ? "var(--success)" : "var(--tx-4)",
              }}>
                ▫ {sDone}/{subs.length}
              </span>
            )}
            {overdue && (
              <span style={{
                fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700,
                padding: "2px 7px", borderRadius: 99,
                color: "oklch(67% 0.21 22)",
                background: "oklch(67% 0.21 22 / 0.12)",
                border: "1px solid oklch(67% 0.21 22 / 0.28)",
              }}>
                ● просрочено
              </span>
            )}
          </div>
        </div>

        {/* Subtask mini progress bar */}
        {pct !== null && (
          <div style={{ flexShrink: 0, width: 40 }}>
            <div style={{
              height: 3, borderRadius: 3, overflow: "hidden",
              background: "oklch(100% 0 0 / 0.07)", marginBottom: 3,
            }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${pct}%`,
                background: pct === 100 ? "var(--success)" : pri.color,
                transition: "width 0.5s ease",
              }} />
            </div>
            <p style={{
              fontSize: 8, fontFamily: "var(--font-mono)", textAlign: "right",
              color: pct === 100 ? "var(--success)" : "var(--tx-4)",
            }}>
              {pct}%
            </p>
          </div>
        )}
      </button>

      {/* Date + urgency column */}
      <div style={{
        flexShrink: 0, textAlign: "right",
        padding: "11px 14px",
        borderLeft: "1px solid var(--bd-1)",
        minWidth: 80,
      }}>
        <p style={{
          fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)",
          color: isDone ? "var(--tx-4)" : urgencyColor,
          marginBottom: 3, fontVariantNumeric: "tabular-nums",
        }}>
          {dateStr}
        </p>
        {!isDone && !isCancelled && (
          <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: urgencyColor }}>
            {urgencyLabel}
          </p>
        )}
        {(isDone || isCancelled) && (
          <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)" }}>
            {isDone ? "готово" : "отменено"}
          </p>
        )}
      </div>
    </div>
  );
}

export default TaskRow;