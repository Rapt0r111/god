"use client";

// components/tasks/TaskItem.tsx — Vision 2026 · Task Item with In-Place Quick Preview
// Uses CSS layout animations (no framer-motion dependency required)
// Drop-in replacement for task rows in TasksList

import { useState, useTransition, useRef, useEffect } from "react";
import { completeTask, reopenTask } from "@/actions/tasks";

// ── Types ──────────────────────────────────────────────────────────────

type SubtaskLite = {
  id: number;
  title: string;
  status: "pending" | "in_progress" | "done" | "cancelled";
};

export type TaskItemData = {
  id: number;
  title: string;
  category: string;
  priority: "critical" | "high" | "normal";
  status: "pending" | "in_progress" | "done" | "cancelled";
  responsible: string;
  month: number;
  dateFrom: number;
  dateTo: number;
  description?: string | null;
  notes?: string | null;
  subtasks: SubtaskLite[];
};

// ── Constants ─────────────────────────────────────────────────────────

const MONTHS_SHORT = ["", "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН",
                          "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК"];
const MONTHS_FULL  = ["", "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
                          "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

const CATEGORY_META: Record<string, { icon: string; color: string; label: string }> = {
  "Н":   { icon: "⚗",  color: "oklch(72% 0.17 155)", label: "Наука" },
  "А":   { icon: "📡", color: "oklch(68% 0.18 232)", label: "Агитация" },
  "БП":  { icon: "🎯", color: "oklch(68% 0.22 25)",  label: "Боевая подг." },
  "ПД":  { icon: "⚙",  color: "oklch(75% 0.18 75)",  label: "Повседн. деят." },
  "ВПР": { icon: "🎖", color: "oklch(66% 0.20 285)", label: "ВПР" },
  "У":   { icon: "🏁", color: "oklch(72% 0.18 55)",  label: "Увольнение" },
  "П":   { icon: "🔰", color: "oklch(72% 0.14 210)", label: "Призыв" },
  "ЗиТ": { icon: "💻", color: "oklch(60% 0.06 255)", label: "Техника" },
  "ЕМ":  { icon: "📋", color: "oklch(75% 0.18 75)",  label: "Ежемесячные" },
  "НД":  { icon: "🔬", color: "oklch(72% 0.17 155)", label: "Научная деят." },
  "МГ":  { icon: "⚡", color: "oklch(68% 0.22 25)",  label: "Мобготовность" },
};

const PRIORITY_META: Record<string, { color: string; label: string; glowColor: string }> = {
  critical: { color: "oklch(68% 0.22 25)",  label: "Критический", glowColor: "oklch(68% 0.22 25 / 0.35)" },
  high:     { color: "oklch(75% 0.18 75)",  label: "Высокий",     glowColor: "oklch(75% 0.18 75 / 0.30)" },
  normal:   { color: "oklch(68% 0.18 272)", label: "Нормальный",  glowColor: "oklch(68% 0.18 272 / 0.30)" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:     { label: "Ожидает",   color: "oklch(60% 0.05 260)", bg: "oklch(100% 0 0 / 0.04)",   border: "oklch(100% 0 0 / 0.10)" },
  in_progress: { label: "В работе",  color: "oklch(75% 0.18 75)",  bg: "oklch(75% 0.18 75 / 0.10)",  border: "oklch(75% 0.18 75 / 0.25)"  },
  done:        { label: "Выполнено", color: "oklch(72% 0.17 155)", bg: "oklch(72% 0.17 155 / 0.10)", border: "oklch(72% 0.17 155 / 0.25)" },
  cancelled:   { label: "Отменено",  color: "oklch(68% 0.22 25)",  bg: "oklch(68% 0.22 25 / 0.10)",  border: "oklch(68% 0.22 25 / 0.25)"  },
};

// ── Sub-components ────────────────────────────────────────────────────

function CheckBox({
  done,
  pending,
  onToggle,
}: {
  done: boolean;
  pending: boolean;
  onToggle: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={pending}
      className={`checkbox-military${done ? " checked" : ""}`}
      aria-label={done ? "Переоткрыть задачу" : "Завершить задачу"}
      style={{ opacity: pending ? 0.5 : 1, cursor: pending ? "wait" : "pointer" }}
    >
      {pending
        ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--text-muted)" }}>···</span>
        : done
          ? <span style={{ fontSize: 11 }}>✓</span>
          : null}
    </button>
  );
}

function ProgressBar({ done, total, color }: { done: number; total: number; color: string }) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);
  return (
    <div style={{ width: 56, flexShrink: 0 }}>
      <div
        style={{
          height: 4,
          borderRadius: 4,
          overflow: "hidden",
          background: "oklch(100% 0 0 / 0.07)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: pct === 100 ? "oklch(72% 0.17 155)" : color,
            borderRadius: 4,
            transition: "width 0.5s ease",
            boxShadow: pct === 100 ? "0 0 6px oklch(72% 0.17 155 / 0.5)" : "none",
          }}
        />
      </div>
      <p
        style={{
          fontSize: 9,
          fontFamily: "var(--font-mono)",
          color: pct === 100 ? "oklch(72% 0.17 155)" : "var(--text-muted)",
          textAlign: "right",
          marginTop: 2,
          letterSpacing: "0.5px",
        }}
      >
        {pct}%
      </p>
    </div>
  );
}

// ── Quick Preview Panel ───────────────────────────────────────────────

function QuickPreview({ task, priMeta, catMeta }: {
  task: TaskItemData;
  priMeta: typeof PRIORITY_META[string];
  catMeta: typeof CATEGORY_META[string];
}) {
  const dur = task.dateTo - task.dateFrom + 1;
  const subsDone  = task.subtasks.filter(s => s.status === "done").length;
  const subsTotal = task.subtasks.length;
  const statusMeta = STATUS_META[task.status] ?? STATUS_META.pending;

  return (
    <div
      style={{
        overflow: "hidden",
        animation: "fadeUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      {/* Divider */}
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, oklch(100% 0 0 / 0.08), transparent)`,
          margin: "0 20px",
        }}
      />

      <div style={{ padding: "16px 20px 20px" }}>
        {/* Status + priority row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <span
            className="badge"
            style={{
              color: statusMeta.color,
              background: statusMeta.bg,
              borderColor: statusMeta.border,
            }}
          >
            {statusMeta.label}
          </span>
          <span
            className="badge"
            style={{
              color: priMeta.color,
              background: `${priMeta.color}18`.replace("oklch", "oklch").replace(")", " / 0.12)").replace("/ 0.12)", "/ 0.12)"),
              borderColor: `${priMeta.color.replace(")", " / 0.28)")}`,
            }}
          >
            {priMeta.label}
          </span>
          <span
            className="badge badge-muted"
          >
            {task.responsible}
          </span>
        </div>

        {/* Timeline block */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 12,
            alignItems: "center",
            padding: "14px 16px",
            borderRadius: 14,
            background: "oklch(68% 0.18 272 / 0.07)",
            border: "1px solid oklch(68% 0.18 272 / 0.15)",
            marginBottom: 14,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "1.5px", marginBottom: 4 }}>
              НАЧАЛО
            </p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-mono)", color: "oklch(78% 0.10 272)", lineHeight: 1 }}>
              {task.dateFrom}
            </p>
            <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-dim)", marginTop: 2 }}>
              {MONTHS_SHORT[task.month]}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 32, height: 1, background: "oklch(68% 0.18 272 / 0.35)" }} />
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "oklch(72% 0.12 272)", fontWeight: 600 }}>
              {dur} {dur === 1 ? "дн" : dur < 5 ? "дня" : "дней"}
            </span>
            <div style={{ width: 32, height: 1, background: "oklch(68% 0.18 272 / 0.35)" }} />
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "1.5px", marginBottom: 4 }}>
              КОНЕЦ
            </p>
            <p style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-mono)", color: "oklch(78% 0.10 272)", lineHeight: 1 }}>
              {task.dateTo}
            </p>
            <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-dim)", marginTop: 2 }}>
              {MONTHS_SHORT[task.month]}
            </p>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "oklch(100% 0 0 / 0.025)",
              border: "1px solid oklch(100% 0 0 / 0.07)",
              marginBottom: 12,
            }}
          >
            <p className="label-mono" style={{ marginBottom: 6 }}>// Описание</p>
            <p style={{ fontSize: 12, lineHeight: 1.65, color: "oklch(80% 0.04 258)" }}>
              {task.description}
            </p>
          </div>
        )}

        {/* Notes */}
        {task.notes && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "oklch(75% 0.18 75 / 0.05)",
              border: "1px solid oklch(75% 0.18 75 / 0.14)",
              marginBottom: 12,
            }}
          >
            <p className="label-mono" style={{ marginBottom: 6, color: "oklch(75% 0.18 75 / 0.5)" }}>// Примечания офицера</p>
            <p style={{ fontSize: 12, lineHeight: 1.65, fontFamily: "var(--font-mono)", color: "oklch(75% 0.18 75 / 0.75)" }}>
              {task.notes}
            </p>
          </div>
        )}

        {/* Subtasks mini-list */}
        {subsTotal > 0 && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "oklch(100% 0 0 / 0.02)",
              border: "1px solid oklch(100% 0 0 / 0.07)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p className="label-mono">// Подзадачи</p>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: subsDone === subsTotal ? "oklch(72% 0.17 155)" : "var(--text-secondary)" }}>
                {subsDone}/{subsTotal}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: 3, borderRadius: 3, overflow: "hidden", background: "oklch(100% 0 0 / 0.07)", marginBottom: 10 }}>
              <div style={{
                height: "100%",
                width: `${subsTotal > 0 ? (subsDone / subsTotal) * 100 : 0}%`,
                background: subsDone === subsTotal ? "oklch(72% 0.17 155)" : "oklch(68% 0.18 272)",
                borderRadius: 3,
                transition: "width 0.5s ease",
              }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 120, overflowY: "auto" }}>
              {task.subtasks.slice(0, 6).map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: sub.status === "done" ? 0.45 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 4,
                      border: sub.status === "done"
                        ? "1px solid oklch(72% 0.17 155 / 0.7)"
                        : "1px solid oklch(100% 0 0 / 0.18)",
                      background: sub.status === "done" ? "oklch(72% 0.17 155 / 0.18)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {sub.status === "done" && (
                      <span style={{ fontSize: 7, color: "oklch(72% 0.17 155)" }}>✓</span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: sub.status === "done" ? "var(--text-dim)" : "var(--text-secondary)",
                      textDecoration: sub.status === "done" ? "line-through" : "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sub.title}
                  </span>
                </div>
              ))}
              {subsTotal > 6 && (
                <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-dim)", paddingTop: 2 }}>
                  +{subsTotal - 6} ещё...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main TaskItem Component ───────────────────────────────────────────

interface TaskItemProps {
  task: TaskItemData;
  /** Called when user wants to open full detail modal */
  onOpenDetail?: (id: number) => void;
  /** Called after optimistic toggle for parent state sync */
  onToggle?: (id: number, newDone: boolean) => void;
}

export function TaskItem({ task, onOpenDetail, onToggle }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [localDone, setLocalDone] = useState(task.status === "done");

  // Sync if parent re-renders with updated status
  useEffect(() => {
    setLocalDone(task.status === "done");
  }, [task.status]);

  const cat       = CATEGORY_META[task.category] ?? { icon: "•", color: "oklch(60% 0.05 255)", label: task.category };
  const priMeta   = PRIORITY_META[task.priority];
  const subsDone  = task.subtasks.filter(s => s.status === "done").length;
  const subsTotal = task.subtasks.length;
  const dateStr   = task.dateFrom === task.dateTo ? `${task.dateFrom}` : `${task.dateFrom}–${task.dateTo}`;
  const isCrit    = task.priority === "critical";

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newDone = !localDone;
    setLocalDone(newDone);
    onToggle?.(task.id, newDone);
    startTransition(async () => {
      if (newDone) await completeTask(task.id);
      else await reopenTask(task.id);
    });
  };

  const handleRowClick = () => {
    setExpanded((prev) => !prev);
  };

  const handleOpenFull = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenDetail?.(task.id);
  };

  return (
    <article
      style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        background: localDone
          ? "oklch(100% 0 0 / 0.02)"
          : isCrit
            ? `linear-gradient(145deg, oklch(68% 0.22 25 / 0.09), oklch(24% 0.03 258 / 0.65))`
            : "oklch(24% 0.03 258 / 0.65)",
        border: localDone
          ? "1px solid oklch(100% 0 0 / 0.07)"
          : isCrit
            ? "1px solid oklch(68% 0.22 25 / 0.28)"
            : "1px solid oklch(100% 0 0 / 0.10)",
        backdropFilter: "blur(24px)",
        boxShadow: localDone
          ? "0 2px 12px oklch(0% 0 0 / 0.25)"
          : expanded
            ? `0 8px 32px oklch(0% 0 0 / 0.45), 0 0 0 1px oklch(68% 0.18 272 / 0.14)`
            : "0 4px 20px oklch(0% 0 0 / 0.35)",
        opacity: localDone ? 0.6 : 1,
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: expanded ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      {/* Priority stripe */}
      <div
        className="priority-stripe"
        style={{
          background: localDone ? "oklch(100% 0 0 / 0.06)" : priMeta.color,
          boxShadow: localDone || !isCrit ? "none" : `0 0 10px ${priMeta.glowColor}`,
        }}
      />

      {/* Main row — clickable to expand */}
      <div
        onClick={handleRowClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleRowClick(); }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px 14px 22px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Checkbox */}
        <CheckBox done={localDone} pending={isPending} onToggle={handleToggle} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: localDone ? "oklch(50% 0.04 258)" : "oklch(96% 0.008 255)",
              textDecoration: localDone ? "line-through" : "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginBottom: 6,
              letterSpacing: "-0.01em",
            }}
          >
            {task.title}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {/* Month + date */}
            <span
              style={{
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
              }}
            >
              {MONTHS_SHORT[task.month]} {dateStr}
            </span>

            {/* Category badge */}
            <span
              className="badge"
              style={{
                color: cat.color,
                background: `${cat.color} / 0.12`.replace("oklch(", "oklch(").replace(" / 0.12", ""),
                // Use inline rgba-equivalent:
                backgroundColor: `color-mix(in oklch, ${cat.color} 15%, transparent)`,
                borderColor: `color-mix(in oklch, ${cat.color} 30%, transparent)`,
              }}
            >
              {cat.icon} {task.category}
            </span>

            {/* Responsible */}
            <span
              className="badge badge-muted"
            >
              {task.responsible}
            </span>

            {/* Subtask count */}
            {subsTotal > 0 && (
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  color: subsDone === subsTotal ? "oklch(72% 0.17 155)" : "var(--text-dim)",
                }}
              >
                {subsDone}/{subsTotal} подз.
              </span>
            )}
          </div>
        </div>

        {/* Progress + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <ProgressBar done={subsDone} total={subsTotal} color={priMeta.color} />

          {/* Open full detail button */}
          {onOpenDetail && (
            <button
              onClick={handleOpenFull}
              title="Открыть полную карточку"
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                border: "1px solid oklch(100% 0 0 / 0.09)",
                background: "oklch(100% 0 0 / 0.04)",
                color: "var(--text-muted)",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.18s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "oklch(68% 0.18 272 / 0.12)";
                e.currentTarget.style.borderColor = "oklch(68% 0.18 272 / 0.35)";
                e.currentTarget.style.color = "oklch(78% 0.10 272)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "oklch(100% 0 0 / 0.04)";
                e.currentTarget.style.borderColor = "oklch(100% 0 0 / 0.09)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              ↗
            </button>
          )}

          {/* Expand chevron */}
          <span
            style={{
              fontSize: 12,
              color: expanded ? "oklch(78% 0.10 272)" : "var(--text-dim)",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.25s ease, color 0.2s ease",
              lineHeight: 1,
            }}
          >
            ›
          </span>
        </div>
      </div>

      {/* ── In-Place Quick Preview ── */}
      {expanded && (
        <QuickPreview task={task} priMeta={priMeta} catMeta={cat} />
      )}
    </article>
  );
}

// ── Export convenience wrapper for TasksList compatibility ─────────────

export default TaskItem;