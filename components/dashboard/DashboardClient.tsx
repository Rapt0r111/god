"use client";

// components/dashboard/DashboardClient.tsx — Vision 2026
// Full task detail modal with subtasks, timeline, description, notes tabs

import { useState, useCallback, useEffect } from "react";
import { getTaskDueInDays } from "@/lib/tasks/critical";

// ── Constants ─────────────────────────────────────────────────────────

const MONTHS = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];
const MONTHS_FULL = ["","Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

const CATEGORY_META: Record<string, { icon: string; color: string; label: string }> = {
  "Н":   { icon: "⚗",  color: "oklch(72% 0.17 155)", label: "Наука"           },
  "А":   { icon: "📡", color: "oklch(68% 0.18 232)", label: "Агитация"        },
  "БП":  { icon: "🎯", color: "oklch(68% 0.22 25)",  label: "Боевая подготовка"},
  "ПД":  { icon: "⚙",  color: "oklch(75% 0.18 75)",  label: "Повседн. деят."  },
  "ВПР": { icon: "🎖", color: "oklch(66% 0.20 285)", label: "ВПР"             },
  "У":   { icon: "🏁", color: "oklch(72% 0.18 55)",  label: "Увольнение"      },
  "П":   { icon: "🔰", color: "oklch(72% 0.14 210)", label: "Призыв"          },
  "ЗиТ": { icon: "💻", color: "oklch(60% 0.07 255)", label: "Техника"         },
  "ЕМ":  { icon: "📋", color: "oklch(75% 0.18 75)",  label: "Ежемесячные"     },
  "НД":  { icon: "🔬", color: "oklch(72% 0.17 155)", label: "Научная деят."   },
  "МГ":  { icon: "⚡", color: "oklch(68% 0.22 25)",  label: "Мобготовность"   },
};

const PRIORITY_META: Record<string, { color: string; label: string }> = {
  critical: { color: "oklch(68% 0.22 25)",  label: "Критический" },
  high:     { color: "oklch(75% 0.18 75)",  label: "Высокий"     },
  normal:   { color: "oklch(68% 0.18 272)", label: "Нормальный"  },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:     { label: "Ожидает",   color: "oklch(64% 0.055 260)", bg: "oklch(100% 0 0 / 0.05)",   border: "oklch(100% 0 0 / 0.12)" },
  in_progress: { label: "В работе",  color: "oklch(75% 0.18 75)",  bg: "oklch(75% 0.18 75 / 0.12)", border: "oklch(75% 0.18 75 / 0.28)"  },
  done:        { label: "Выполнено", color: "oklch(72% 0.17 155)", bg: "oklch(72% 0.17 155 / 0.12)",border: "oklch(72% 0.17 155 / 0.28)" },
  cancelled:   { label: "Отменено",  color: "oklch(68% 0.22 25)",  bg: "oklch(68% 0.22 25 / 0.12)", border: "oklch(68% 0.22 25 / 0.28)"  },
};

// ── Types ─────────────────────────────────────────────────────────────

type SubtaskLite = {
  id: number; title: string;
  status: "pending" | "in_progress" | "done" | "cancelled";
  description?: string | null;
};

type TaskLike = {
  id: number; title: string; category: string; month: number;
  dateFrom: number; dateTo: number; responsible: string;
  status: string; priority: string;
  description?: string | null; notes?: string | null;
  subtasks?: SubtaskLite[];
};

type MonthStat = { month: number; total: number; done: number; critical: number };

interface DashboardProps {
  total: number; done: number; critical: number;
  thisMonth: number; thisMonthDone: number; currentMonth: number;
  monthStats: MonthStat[]; upcomingTasks: TaskLike[];
}

// ── Helpers ───────────────────────────────────────────────────────────

function getUrgencyMeta(task: TaskLike) {
  const dueIn = getTaskDueInDays(task as Parameters<typeof getTaskDueInDays>[0]);
  if (dueIn <= 2) return { label: "Критично", color: "oklch(68% 0.22 25)",  bg: "oklch(68% 0.22 25 / 0.12)",  border: "oklch(68% 0.22 25 / 0.28)",  pulse: true };
  if (dueIn <= 7) return { label: "Скоро",    color: "oklch(75% 0.18 75)",  bg: "oklch(75% 0.18 75 / 0.12)",  border: "oklch(75% 0.18 75 / 0.28)",  pulse: false };
  return             { label: "Планово",  color: "oklch(68% 0.18 272)", bg: "oklch(68% 0.18 272 / 0.12)", border: "oklch(68% 0.18 272 / 0.28)", pulse: false };
}

// ── Task Detail Modal ─────────────────────────────────────────────────

function TaskDetailModal({ task, onClose }: { task: TaskLike; onClose: () => void }) {
  const cat      = CATEGORY_META[task.category] ?? { icon: "•", color: "oklch(64% 0.06 262)", label: task.category };
  const priMeta  = PRIORITY_META[task.priority] ?? PRIORITY_META.normal;
  const stMeta   = STATUS_META[task.status]     ?? STATUS_META.pending;
  const urgency  = getUrgencyMeta(task);
  const subtasks = task.subtasks ?? [];
  const subsDone = subtasks.filter(s => s.status === "done").length;
  const subsTotal= subtasks.length;
  const progress = subsTotal > 0 ? Math.round((subsDone / subsTotal) * 100) : 0;
  const dur      = task.dateTo - task.dateFrom + 1;
  const dueIn    = getTaskDueInDays(task as Parameters<typeof getTaskDueInDays>[0]);
  const [activeTab, setActiveTab] = useState<"overview" | "subtasks" | "notes">("overview");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const badge = (label: string, color: string, bg: string, border: string, extra?: React.ReactNode) => (
    <span key={label} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 8, flexShrink: 0,
      fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700,
      letterSpacing: "1.3px", textTransform: "uppercase",
      color, background: bg, border: `1px solid ${border}`,
    }}>
      {extra}{label}
    </span>
  );

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
        background: "oklch(12% 0.03 265 / 0.70)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        animation: "fadeIn 0.18s ease forwards",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 700,
          maxHeight: "92vh",
          display: "flex", flexDirection: "column",
          borderRadius: 28, overflow: "hidden",
          background: "oklch(30% 0.05 264 / 0.98)",
          backdropFilter: "blur(48px)",
          border: `1px solid ${cat.color.replace(")", " / 0.24)")}`,
          boxShadow: [
            "0 40px 100px oklch(0% 0 0 / 0.55)",
            "0 0 0 1px oklch(100% 0 0 / 0.07) inset",
            `0 0 80px ${cat.color.replace(")", " / 0.09)")}`,
          ].join(", "),
          animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* ── HEADER ── */}
        <div style={{
          padding: "24px 28px 20px",
          background: `linear-gradient(135deg, ${cat.color.replace(")", " / 0.12)")} 0%, transparent 55%)`,
          borderBottom: "1px solid oklch(100% 0 0 / 0.08)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            {/* Category orb */}
            <div style={{
              width: 54, height: 54, borderRadius: 18, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
              background: `${cat.color.replace(")", " / 0.18)")}`,
              border: `1px solid ${cat.color.replace(")", " / 0.32)")}`,
              boxShadow: `0 4px 20px ${cat.color.replace(")", " / 0.18)")}`,
            }}>
              {cat.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Badge row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {badge(cat.label, cat.color, `${cat.color.replace(")", " / 0.13)")}`, `${cat.color.replace(")", " / 0.30)")}`)}
                {badge(priMeta.label, priMeta.color, `${priMeta.color.replace(")", " / 0.13)")}`, `${priMeta.color.replace(")", " / 0.30)")}`)}
                {badge(stMeta.label, stMeta.color, stMeta.bg, stMeta.border)}
                {badge(urgency.label, urgency.color, urgency.bg, urgency.border,
                  urgency.pulse ? <span style={{ width: 5, height: 5, borderRadius: "50%", background: urgency.color, display: "inline-block", animation: "pulseGlow 1.5s ease-in-out infinite" }} /> : null
                )}
              </div>
              <h2 style={{
                fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em",
                color: "oklch(96% 0.008 255)", lineHeight: 1.25,
                textDecoration: task.status === "done" ? "line-through" : "none",
              }}>
                {task.title}
              </h2>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
                Ответственный:&nbsp;<span style={{ color: "oklch(78% 0.10 272)" }}>{task.responsible}</span>
                &nbsp;·&nbsp;ID #{task.id}
                &nbsp;·&nbsp;{MONTHS_FULL[task.month]} {task.dateFrom === task.dateTo ? task.dateFrom : `${task.dateFrom}–${task.dateTo}`}
              </p>
            </div>

            {/* Close */}
            <button onClick={onClose} style={{
              width: 34, height: 34, borderRadius: 12, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, lineHeight: 1, cursor: "pointer",
              border: "1px solid oklch(100% 0 0 / 0.11)",
              background: "oklch(100% 0 0 / 0.06)",
              color: "oklch(60% 0.04 260)",
              transition: "all 0.15s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.12)"; e.currentTarget.style.color = "oklch(96% 0.008 255)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.06)"; e.currentTarget.style.color = "oklch(60% 0.04 260)"; }}
            >×</button>
          </div>

          {/* Subtask progress bar */}
          {subsTotal > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-dim)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Прогресс подзадач
                </span>
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: progress === 100 ? "oklch(72% 0.17 155)" : priMeta.color }}>
                  {subsDone}/{subsTotal} · {progress}%
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 5, background: "oklch(100% 0 0 / 0.09)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${progress}%`, borderRadius: 5,
                  background: progress === 100
                    ? "linear-gradient(90deg, oklch(72% 0.17 155), oklch(72% 0.17 155 / 0.8))"
                    : `linear-gradient(90deg, ${priMeta.color}, ${priMeta.color.replace(")", " / 0.75)")})`,
                  boxShadow: progress === 100 ? "0 0 10px oklch(72% 0.17 155 / 0.5)" : `0 0 10px ${priMeta.color.replace(")", " / 0.45)")}`,
                  transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
                }} />
              </div>
            </div>
          )}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: "flex", borderBottom: "1px solid oklch(100% 0 0 / 0.07)", flexShrink: 0, background: "oklch(100% 0 0 / 0.02)" }}>
          {([
            { id: "overview" as const, label: "Детали" },
            { id: "subtasks" as const, label: subsTotal > 0 ? `Подзадачи (${subsDone}/${subsTotal})` : "Подзадачи" },
            { id: "notes"    as const, label: "Примечания" },
          ]).map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: "12px 22px",
                fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: active ? 600 : 400,
                letterSpacing: "0.05em",
                color: active ? "oklch(88% 0.08 272)" : "var(--text-dim)",
                background: active ? "oklch(68% 0.18 272 / 0.08)" : "transparent",
                border: "none",
                borderBottom: active ? "2px solid oklch(68% 0.18 272)" : "2px solid transparent",
                cursor: "pointer", transition: "all 0.15s ease",
                position: "relative", top: 1,
              }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── CONTENT ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px 28px" }}>

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Timeline block */}
              <div style={{
                padding: "20px 24px", borderRadius: 20,
                background: "oklch(68% 0.18 272 / 0.07)",
                border: "1px solid oklch(68% 0.18 272 / 0.18)",
              }}>
                <p style={{ fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: "2px", textTransform: "uppercase", color: "oklch(68% 0.18 272 / 0.5)", marginBottom: 16 }}>
                  // Сроки исполнения
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "1.5px", color: "var(--text-dim)", marginBottom: 8 }}>НАЧАЛО</p>
                    <p style={{ fontSize: 44, fontWeight: 700, fontFamily: "var(--font-mono)", color: "oklch(80% 0.12 272)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{task.dateFrom}</p>
                    <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginTop: 5 }}>{MONTHS_FULL[task.month]}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "0 10px" }}>
                    <div style={{ width: 36, height: 1, background: "oklch(68% 0.18 272 / 0.4)" }} />
                    <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "oklch(72% 0.12 272)" }}>
                      {dur}{" "}{dur === 1 ? "день" : dur < 5 ? "дня" : "дней"}
                    </span>
                    <div style={{ width: 36, height: 1, background: "oklch(68% 0.18 272 / 0.4)" }} />
                    <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: dueIn <= 0 ? "oklch(68% 0.22 25)" : "var(--text-dim)", textAlign: "center" }}>
                      {dueIn <= 0 ? "просрочено" : `через ${dueIn} дн.`}
                    </span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "1.5px", color: "var(--text-dim)", marginBottom: 8 }}>КОНЕЦ</p>
                    <p style={{ fontSize: 44, fontWeight: 700, fontFamily: "var(--font-mono)", color: "oklch(80% 0.12 272)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{task.dateTo}</p>
                    <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginTop: 5 }}>{MONTHS_FULL[task.month]}</p>
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "КАТЕГОРИЯ",     value: `${cat.icon} ${cat.label}`, color: cat.color },
                  { label: "ОТВЕТСТВЕННЫЙ", value: task.responsible,           color: "oklch(78% 0.10 272)" },
                  { label: "ПРИОРИТЕТ",     value: priMeta.label,              color: priMeta.color },
                  { label: "СТАТУС",        value: stMeta.label,               color: stMeta.color },
                ].map(row => (
                  <div key={row.label} style={{
                    padding: "14px 18px", borderRadius: 16,
                    background: "oklch(100% 0 0 / 0.04)",
                    border: "1px solid oklch(100% 0 0 / 0.09)",
                  }}>
                    <p style={{ fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: "1.5px", color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 7 }}>{row.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-mono)", color: row.color }}>{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div style={{
                padding: "18px 20px", borderRadius: 18,
                background: task.description ? "oklch(100% 0 0 / 0.04)" : "oklch(100% 0 0 / 0.02)",
                border: task.description ? "1px solid oklch(100% 0 0 / 0.10)" : "1px dashed oklch(100% 0 0 / 0.07)",
              }}>
                <p style={{ fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: "2px", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 12 }}>// Описание задачи</p>
                {task.description
                  ? <p style={{ fontSize: 13, lineHeight: 1.75, color: "oklch(82% 0.04 258)" }}>{task.description}</p>
                  : <p style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>Описание не добавлено</p>
                }
              </div>

              {/* Quick link to subtasks */}
              {subsTotal > 0 && (
                <button onClick={() => setActiveTab("subtasks")} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 20px", borderRadius: 16, cursor: "pointer",
                  border: "1px solid oklch(68% 0.18 272 / 0.22)",
                  background: "oklch(68% 0.18 272 / 0.07)",
                  color: "oklch(78% 0.10 272)", fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 500,
                  transition: "all 0.18s ease",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "oklch(68% 0.18 272 / 0.14)"; e.currentTarget.style.borderColor = "oklch(68% 0.18 272 / 0.40)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "oklch(68% 0.18 272 / 0.07)"; e.currentTarget.style.borderColor = "oklch(68% 0.18 272 / 0.22)"; }}
                >
                  <span>◻ Подзадачи — {subsDone} из {subsTotal} выполнено</span>
                  <span style={{ fontSize: 16 }}>→</span>
                </button>
              )}
            </div>
          )}

          {/* SUBTASKS TAB */}
          {activeTab === "subtasks" && (
            <div>
              {subsTotal === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ fontSize: 36, opacity: 0.2, marginBottom: 12 }}>◻</div>
                  <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>// Подзадачи не добавлены</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Progress summary */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                    borderRadius: 16, marginBottom: 4,
                    background: `${priMeta.color.replace(")", " / 0.08)")}`,
                    border: `1px solid ${priMeta.color.replace(")", " / 0.20)")}`,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 7, borderRadius: 7, overflow: "hidden", background: "oklch(100% 0 0 / 0.10)" }}>
                        <div style={{
                          height: "100%", width: `${progress}%`, borderRadius: 7,
                          background: progress === 100 ? "oklch(72% 0.17 155)" : priMeta.color,
                          boxShadow: `0 0 8px ${progress === 100 ? "oklch(72% 0.17 155 / 0.5)" : priMeta.color.replace(")", " / 0.45)")}`,
                          transition: "width 0.8s ease",
                        }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 700, color: progress === 100 ? "oklch(72% 0.17 155)" : priMeta.color, flexShrink: 0 }}>
                      {progress}%
                    </span>
                  </div>

                  {/* Subtask list */}
                  {subtasks.map((sub, idx) => {
                    const isDone  = sub.status === "done";
                    const subSt   = STATUS_META[sub.status] ?? STATUS_META.pending;
                    return (
                      <div key={sub.id} style={{
                        padding: "14px 18px", borderRadius: 16,
                        background: isDone ? "oklch(72% 0.17 155 / 0.04)" : "oklch(100% 0 0 / 0.04)",
                        border: isDone ? "1px solid oklch(72% 0.17 155 / 0.18)" : "1px solid oklch(100% 0 0 / 0.09)",
                        opacity: isDone ? 0.72 : 1,
                        transition: "opacity 0.2s",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {/* Index */}
                          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-dim)", width: 22, textAlign: "right", flexShrink: 0 }}>
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          {/* Checkbox */}
                          <div style={{
                            width: 20, height: 20, borderRadius: 7, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: isDone ? "1px solid oklch(72% 0.17 155 / 0.8)" : "1px solid oklch(100% 0 0 / 0.20)",
                            background: isDone ? "oklch(72% 0.17 155 / 0.18)" : "transparent",
                          }}>
                            {isDone && <span style={{ fontSize: 11, color: "oklch(72% 0.17 155)", fontWeight: 700 }}>✓</span>}
                          </div>
                          {/* Title */}
                          <span style={{
                            flex: 1, fontSize: 13, lineHeight: 1.45, fontWeight: 500,
                            color: isDone ? "var(--text-dim)" : "var(--text-primary)",
                            textDecoration: isDone ? "line-through" : "none",
                          }}>
                            {sub.title}
                          </span>
                          {/* Status */}
                          <span style={{
                            fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 600,
                            letterSpacing: "0.8px", textTransform: "uppercase",
                            padding: "3px 9px", borderRadius: 7, flexShrink: 0,
                            color: subSt.color, background: subSt.bg, border: `1px solid ${subSt.border}`,
                          }}>
                            {subSt.label}
                          </span>
                        </div>
                        {/* Sub-description */}
                        {sub.description && (
                          <p style={{
                            marginTop: 9, marginLeft: 54,
                            fontSize: 11, lineHeight: 1.65,
                            color: "var(--text-secondary)", fontFamily: "var(--font-mono)",
                            paddingLeft: 12, borderLeft: "2px solid oklch(100% 0 0 / 0.10)",
                          }}>
                            {sub.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === "notes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{
                padding: "20px 22px", borderRadius: 20,
                background: task.notes ? "oklch(75% 0.18 75 / 0.06)" : "oklch(100% 0 0 / 0.02)",
                border: task.notes ? "1px solid oklch(75% 0.18 75 / 0.20)" : "1px dashed oklch(100% 0 0 / 0.08)",
              }}>
                <p style={{ fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: "2px", textTransform: "uppercase", color: "oklch(75% 0.18 75 / 0.5)", marginBottom: 14 }}>// Примечания офицера</p>
                {task.notes
                  ? <p style={{ fontSize: 13, lineHeight: 1.8, fontFamily: "var(--font-mono)", color: "oklch(82% 0.10 75)", whiteSpace: "pre-wrap" }}>{task.notes}</p>
                  : <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Примечания не добавлены</p>
                }
              </div>
              {task.description && (
                <div style={{
                  padding: "20px 22px", borderRadius: 20,
                  background: "oklch(100% 0 0 / 0.03)",
                  border: "1px solid oklch(100% 0 0 / 0.09)",
                }}>
                  <p style={{ fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: "2px", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 14 }}>// Описание задачи</p>
                  <p style={{ fontSize: 13, lineHeight: 1.75, color: "oklch(82% 0.04 258)" }}>{task.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          padding: "16px 28px", flexShrink: 0,
          borderTop: "1px solid oklch(100% 0 0 / 0.07)",
          background: "oklch(100% 0 0 / 0.02)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <a href={`/tasks?month=${task.month}`} style={{
            fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 500,
            color: "var(--text-muted)", textDecoration: "none",
            padding: "8px 16px", borderRadius: 11,
            border: "1px solid oklch(100% 0 0 / 0.11)",
            background: "oklch(100% 0 0 / 0.05)",
            transition: "all 0.15s ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "oklch(100% 0 0 / 0.10)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "oklch(100% 0 0 / 0.05)"; }}
          >
            Открыть в журнале →
          </a>
          <button onClick={onClose} style={{
            fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600,
            cursor: "pointer", padding: "8px 22px", borderRadius: 11,
            color: "oklch(78% 0.10 272)",
            border: "1px solid oklch(68% 0.18 272 / 0.35)",
            background: "oklch(68% 0.18 272 / 0.12)",
            transition: "all 0.15s ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "oklch(68% 0.18 272 / 0.22)"; e.currentTarget.style.borderColor = "oklch(68% 0.18 272 / 0.55)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "oklch(68% 0.18 272 / 0.12)"; e.currentTarget.style.borderColor = "oklch(68% 0.18 272 / 0.35)"; }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, progress, color, index }: {
  label: string; value: number; sub: string; progress: number; color: string; index: number;
}) {
  return (
    <div className="glass-card animate-fade-up" style={{
      padding: "24px 28px", position: "relative", overflow: "hidden",
      animationDelay: `${index * 0.08}s`, animationFillMode: "both",
      border: `1px solid ${color.replace(")", " / 0.18)")}`,
    }}>
      <div style={{
        position: "absolute", top: 0, right: 0, width: 180, height: 180, pointerEvents: "none",
        background: `radial-gradient(circle, ${color.replace(")", " / 0.12)")} 0%, transparent 70%)`,
        transform: "translate(40%, -40%)",
      }} />
      <p className="label-mono" style={{ marginBottom: 16, position: "relative" }}>{label}</p>
      <p style={{
        fontSize: 56, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em",
        color, textShadow: `0 0 40px ${color.replace(")", " / 0.45)")}`,
        marginBottom: 8, position: "relative", fontVariantNumeric: "tabular-nums",
      }}>{value}</p>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16, position: "relative" }}>{sub}</p>
      <div style={{ height: 3, borderRadius: 3, overflow: "hidden", background: "oklch(100% 0 0 / 0.08)", position: "relative" }}>
        <div style={{
          height: "100%", width: `${progress}%`, borderRadius: 3,
          background: `linear-gradient(90deg, ${color.replace(")", " / 0.75)")}, ${color})`,
          boxShadow: `0 0 8px ${color.replace(")", " / 0.5)")}`,
          transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }} />
      </div>
    </div>
  );
}

// ── Annual Chart ──────────────────────────────────────────────────────

function AnnualChart({ monthStats, currentMonth }: { monthStats: MonthStat[]; currentMonth: number }) {
  const maxTotal  = Math.max(...monthStats.map(m => m.total), 1);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="glass-card animate-fade-up" style={{ padding: "24px 28px", animationDelay: "0.22s", animationFillMode: "both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <p className="label-mono">// Годовой план · нагрузка по месяцам</p>
        <div style={{ display: "flex", gap: 14 }}>
          {[
            { color: "oklch(68% 0.18 272 / 0.7)", label: "план" },
            { color: "oklch(72% 0.17 155 / 0.7)", label: "выполнено" },
            { color: "oklch(68% 0.22 25 / 0.7)",  label: "критичные" },
          ].map(l => (
            <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              <span style={{ width: 14, height: 3, borderRadius: 3, background: l.color, display: "inline-block" }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ width: "100%", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 110, width: "100%" }}>
          {monthStats.map(m => {
            const barH    = m.total > 0 ? Math.max(Math.round((m.total / maxTotal) * 88), 6) : 0;
            const doneH   = m.total > 0 ? Math.round((m.done / m.total) * barH) : 0;
            const isCur   = m.month === currentMonth;
            const isHov   = hovered === m.month;
            const hasCrit = m.critical > 0;

            return (
              <a key={m.month} href={`/tasks?month=${m.month}`}
                onMouseEnter={() => setHovered(m.month)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "flex-end",
                  height: "100%", textDecoration: "none",
                  cursor: m.total > 0 ? "pointer" : "default", position: "relative",
                }}
              >
                {isHov && m.total > 0 && (
                  <div style={{
                    position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
                    transform: "translateX(-50%)", zIndex: 10, whiteSpace: "nowrap",
                    background: "oklch(32% 0.05 262 / 0.98)", backdropFilter: "blur(16px)",
                    border: "1px solid oklch(100% 0 0 / 0.14)", borderRadius: 12,
                    padding: "8px 14px", boxShadow: "0 8px 24px oklch(0% 0 0 / 0.35)",
                  }}>
                    <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>{MONTHS_FULL[m.month]}</p>
                    <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginTop: 2 }}>
                      {m.done}/{m.total} задач{m.critical > 0 ? ` · ${m.critical} крит.` : ""}
                    </p>
                  </div>
                )}
                {m.total > 0 ? (
                  <div style={{
                    width: "100%", height: barH, borderRadius: "6px 6px 0 0",
                    position: "relative", overflow: "hidden",
                    background: isCur
                      ? "linear-gradient(to top, oklch(75% 0.18 75 / 0.65), oklch(75% 0.18 75 / 0.28))"
                      : hasCrit
                        ? "linear-gradient(to top, oklch(68% 0.22 25 / 0.55), oklch(68% 0.22 25 / 0.20))"
                        : "linear-gradient(to top, oklch(68% 0.18 272 / 0.55), oklch(68% 0.18 272 / 0.20))",
                    border: isCur
                      ? "1px solid oklch(75% 0.18 75 / 0.5)"
                      : hasCrit
                        ? "1px solid oklch(68% 0.22 25 / 0.32)"
                        : "1px solid oklch(68% 0.18 272 / 0.26)",
                    boxShadow: isCur ? "0 0 14px oklch(75% 0.18 75 / 0.25)" : isHov ? "0 0 12px oklch(68% 0.18 272 / 0.22)" : "none",
                    filter: isHov ? "brightness(1.35)" : "brightness(1)",
                    transition: "filter 0.2s, box-shadow 0.2s",
                  }}>
                    {doneH > 0 && (
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: doneH, background: "oklch(72% 0.17 155 / 0.30)", borderTop: "1px solid oklch(72% 0.17 155 / 0.40)" }} />
                    )}
                  </div>
                ) : (
                  <div style={{ width: "100%", height: 3, borderRadius: 3, background: "oklch(100% 0 0 / 0.05)" }} />
                )}
              </a>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, borderTop: "1px solid oklch(100% 0 0 / 0.07)", paddingTop: 8 }}>
          {monthStats.map(m => (
            <div key={m.month} style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
              <span style={{
                fontSize: 8, fontFamily: "var(--font-mono)", display: "block",
                overflow: "hidden", letterSpacing: "0.5px",
                color: m.month === currentMonth ? "oklch(75% 0.18 75)" : m.total > 0 ? "var(--text-muted)" : "var(--text-dim)",
                fontWeight: m.month === currentMonth ? 600 : 400,
              }}>{MONTHS[m.month]}</span>
              {m.total > 0 && <span style={{ fontSize: 7, fontFamily: "var(--font-mono)", color: "var(--text-dim)", display: "block", marginTop: 1 }}>{m.total}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Task Row ────────────────────────────────────────────────

function DashTaskRow({ task, onOpen }: { task: TaskLike; onOpen: (t: TaskLike) => void }) {
  const urgency  = getUrgencyMeta(task);
  const cat      = CATEGORY_META[task.category] ?? { icon: "•", color: "oklch(64% 0.06 262)", label: task.category };
  const priMeta  = PRIORITY_META[task.priority] ?? PRIORITY_META.normal;
  const subtasks = task.subtasks ?? [];
  const subsDone = subtasks.filter(s => s.status === "done").length;
  const subsTotal= subtasks.length;
  const isDone   = task.status === "done";

  return (
    <button
      onClick={() => onOpen(task)}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 14,
        padding: "15px 18px 15px 22px", borderRadius: 18,
        background: task.priority === "critical" && !isDone
          ? "linear-gradient(145deg, oklch(68% 0.22 25 / 0.09), oklch(32% 0.05 262 / 0.60))"
          : isDone
            ? "oklch(100% 0 0 / 0.02)"
            : "oklch(32% 0.05 262 / 0.55)",
        border: isDone
          ? "1px solid oklch(100% 0 0 / 0.07)"
          : task.priority === "critical"
            ? "1px solid oklch(68% 0.22 25 / 0.30)"
            : "1px solid oklch(100% 0 0 / 0.11)",
        opacity: isDone ? 0.55 : 1,
        position: "relative",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={e => {
        if (!isDone) {
          e.currentTarget.style.background = "oklch(36% 0.06 260 / 0.75)";
          e.currentTarget.style.borderColor = "oklch(68% 0.18 272 / 0.30)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 20px oklch(0% 0 0 / 0.22)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = task.priority === "critical" && !isDone
          ? "linear-gradient(145deg, oklch(68% 0.22 25 / 0.09), oklch(32% 0.05 262 / 0.60))"
          : isDone ? "oklch(100% 0 0 / 0.02)" : "oklch(32% 0.05 262 / 0.55)";
        e.currentTarget.style.borderColor = isDone ? "oklch(100% 0 0 / 0.07)" : task.priority === "critical" ? "oklch(68% 0.22 25 / 0.30)" : "oklch(100% 0 0 / 0.11)";
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Priority stripe */}
      <div style={{
        position: "absolute", left: 0, top: 7, bottom: 7, width: 3, borderRadius: "0 3px 3px 0",
        background: isDone ? "oklch(100% 0 0 / 0.07)" : priMeta.color,
        boxShadow: !isDone && task.priority === "critical" ? `0 0 8px ${priMeta.color.replace(")", " / 0.5)")}` : "none",
      }} />

      {/* Urgency dot */}
      <div style={{
        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
        background: urgency.color,
        boxShadow: `0 0 6px ${urgency.color}`,
        animation: urgency.pulse ? "pulseGlow 1.5s ease-in-out infinite" : "none",
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          marginBottom: 6,
          color: isDone ? "var(--text-dim)" : "oklch(96% 0.008 255)",
          textDecoration: isDone ? "line-through" : "none",
        }}>
          {task.title}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            {MONTHS[task.month]} {task.dateFrom === task.dateTo ? task.dateFrom : `${task.dateFrom}–${task.dateTo}`}
          </span>
          <span style={{
            fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 600,
            padding: "2px 7px", borderRadius: 6, letterSpacing: "0.5px",
            color: cat.color, background: `${cat.color.replace(")", " / 0.13)")}`,
            border: `1px solid ${cat.color.replace(")", " / 0.26)")}`,
          }}>
            {cat.icon} {task.category}
          </span>
          <span style={{
            fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 600,
            padding: "2px 7px", borderRadius: 6,
            color: urgency.color, background: urgency.bg, border: `1px solid ${urgency.border}`,
          }}>
            {urgency.label}
          </span>
          <span style={{
            fontSize: 9, fontFamily: "var(--font-mono)",
            padding: "2px 7px", borderRadius: 6,
            color: "var(--text-muted)", background: "oklch(100% 0 0 / 0.05)", border: "1px solid oklch(100% 0 0 / 0.10)",
          }}>
            {task.responsible}
          </span>
          {subsTotal > 0 && (
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: subsDone === subsTotal ? "oklch(72% 0.17 155)" : "var(--text-dim)" }}>
              ◻ {subsDone}/{subsTotal}
            </span>
          )}
        </div>
      </div>

      {/* "Open detail" hint */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
        fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-dim)",
      }}>
        <span style={{ fontSize: 16 }}>›</span>
      </div>
    </button>
  );
}

// ── Summary Strip ─────────────────────────────────────────────────────

function SummaryStrip({ critical, inProgress, done }: { critical: number; inProgress: number; done: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {([
        { label: "Критичных", value: critical,   color: "oklch(68% 0.22 25)"  },
        { label: "В работе",  value: inProgress, color: "oklch(75% 0.18 75)"  },
        { label: "Выполнено", value: done,        color: "oklch(72% 0.17 155)" },
      ] as const).map((row, i) => (
        <div key={row.label} className="glass-card animate-fade-up" style={{
          padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
          animationDelay: `${0.42 + i * 0.08}s`, animationFillMode: "both",
          border: `1px solid ${row.color.replace(")", " / 0.16)")}`,
        }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{row.label}</span>
          <span style={{
            fontSize: 32, fontWeight: 700, fontVariantNumeric: "tabular-nums",
            color: row.color, textShadow: `0 0 20px ${row.color.replace(")", " / 0.4)")}`,
          }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────

export function DashboardClient({
  total, done, critical, thisMonth, thisMonthDone,
  currentMonth, monthStats, upcomingTasks,
}: DashboardProps) {
  const [modalTask, setModalTask] = useState<TaskLike | null>(null);
  const readiness  = total > 0 ? Math.round((done / total) * 100) : 0;
  const inProgress = Math.max(total - done - critical, 0);

  const handleOpen  = useCallback((t: TaskLike) => setModalTask(t), []);
  const handleClose = useCallback(() => setModalTask(null), []);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Critical Alert Banner */}
        {critical > 0 && (
          <a href="/tasks?criticalOnly=1" className="animate-fade-up" style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 20px", borderRadius: 18, textDecoration: "none",
            background: "oklch(68% 0.22 25 / 0.08)",
            border: "1px solid oklch(68% 0.22 25 / 0.28)",
            boxShadow: "0 4px 20px oklch(68% 0.22 25 / 0.10)",
            transition: "all 0.2s ease", animationFillMode: "both",
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 30px oklch(68% 0.22 25 / 0.20)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px oklch(68% 0.22 25 / 0.10)"; }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "oklch(68% 0.22 25)", boxShadow: "0 0 8px oklch(68% 0.22 25)", flexShrink: 0, animation: "pulseGlow 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: 13, color: "oklch(82% 0.12 25)" }}>
              <strong>ВНИМАНИЕ: </strong>{critical} критичных задач требуют немедленного исполнения
            </span>
            <span style={{ marginLeft: "auto", fontSize: 11, fontFamily: "var(--font-mono)", color: "oklch(68% 0.22 25 / 0.6)", flexShrink: 0 }}>Открыть →</span>
          </a>
        )}

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <KpiCard label="// Критичных задач" value={critical} color="oklch(68% 0.22 25)"
            sub="не выполнено · требует решения" progress={0} index={0} />
          <KpiCard label={`// Задач в ${MONTHS[currentMonth]}`} value={thisMonth} color="oklch(75% 0.18 75)"
            sub={`${thisMonthDone} выполнено в этом месяце`}
            progress={thisMonth > 0 ? (thisMonthDone / thisMonth) * 100 : 0} index={1} />
          <KpiCard label="// Всего выполнено" value={done} color="oklch(72% 0.17 155)"
            sub={`${readiness}% · из ${total} задач за год`}
            progress={total > 0 ? (done / total) * 100 : 0} index={2} />
        </div>

        {/* Annual Chart */}
        <AnnualChart monthStats={monthStats} currentMonth={currentMonth} />

        {/* Upcoming Tasks List */}
        <div className="glass-card animate-fade-up" style={{ overflow: "hidden", padding: 0, animationDelay: "0.30s", animationFillMode: "both" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid oklch(100% 0 0 / 0.08)",
          }}>
            <div>
              <p className="label-mono">// Ближайшие задачи</p>
              <p style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--font-mono)", marginTop: 3 }}>
                Нажмите на задачу для просмотра деталей, подзадач и примечаний
              </p>
            </div>
            <a href="/tasks" className="btn-glass" style={{ textDecoration: "none" }}>Все задачи →</a>
          </div>
          <div style={{ padding: "14px 18px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {upcomingTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 28, opacity: 0.2, marginBottom: 10 }}>✓</div>
                <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>Все задачи выполнены</p>
              </div>
            ) : (
              upcomingTasks.map(task => (
                <DashTaskRow key={task.id} task={task} onOpen={handleOpen} />
              ))
            )}
          </div>
        </div>

        {/* Summary Strip */}
        <SummaryStrip critical={critical} inProgress={inProgress} done={done} />
      </div>

      {/* ── Task Detail Modal (portal-like, rendered last) ── */}
      {modalTask && <TaskDetailModal task={modalTask} onClose={handleClose} />}
    </>
  );
}