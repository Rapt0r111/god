"use client";

// components/dashboard/DashboardClient.tsx — Vision 2026 · Warm Dashboard

import { useState, useCallback, useEffect } from "react";
import { getTaskDueInDays } from "@/lib/tasks/critical";

// ── Constants ─────────────────────────────────────────────────────────

const MONTHS_SHORT = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];
const MONTHS_FULL  = ["","Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

const CAT_META: Record<string, { icon: string; color: string; label: string }> = {
  "Н":   { icon: "⚗",  color: "oklch(72% 0.17 152)", label: "Наука"            },
  "А":   { icon: "📡", color: "oklch(70% 0.15 230)", label: "Агитация"         },
  "БП":  { icon: "🎯", color: "oklch(67% 0.21 22)",  label: "Боевая подготовка" },
  "ПД":  { icon: "⚙",  color: "oklch(74% 0.18 68)",  label: "Повседн. деят."   },
  "ВПР": { icon: "🎖", color: "oklch(68% 0.18 288)", label: "ВПР"              },
  "У":   { icon: "🏁", color: "oklch(74% 0.17 60)",  label: "Увольнение"       },
  "П":   { icon: "🔰", color: "oklch(70% 0.15 210)", label: "Призыв"           },
  "ЗиТ": { icon: "💻", color: "oklch(62% 0.06 258)", label: "Техника"          },
  "ЕМ":  { icon: "📋", color: "oklch(74% 0.18 68)",  label: "Ежемесячные"      },
  "НД":  { icon: "🔬", color: "oklch(72% 0.17 152)", label: "Научная деят."    },
  "МГ":  { icon: "⚡", color: "oklch(67% 0.21 22)",  label: "Мобготовность"    },
};

const PRI_META: Record<string, { color: string; label: string }> = {
  critical: { color: "oklch(67% 0.21 22)",  label: "Критический" },
  high:     { color: "oklch(74% 0.18 68)",  label: "Высокий"     },
  normal:   { color: "oklch(68% 0.18 288)", label: "Нормальный"  },
};

const ST_META: Record<string, { label: string; color: string; bg: string; bd: string }> = {
  pending:     { label: "Ожидает",   color: "var(--tx-3)",                       bg: "oklch(100% 0 0 / 0.04)", bd: "var(--bd-1)" },
  in_progress: { label: "В работе",  color: "oklch(74% 0.18 68)",                bg: "oklch(74% 0.18 68 / 0.10)", bd: "oklch(74% 0.18 68 / 0.24)" },
  done:        { label: "Выполнено", color: "oklch(72% 0.17 152)",               bg: "oklch(72% 0.17 152 / 0.10)", bd: "oklch(72% 0.17 152 / 0.24)" },
  cancelled:   { label: "Отменено",  color: "oklch(67% 0.21 22)",               bg: "oklch(67% 0.21 22 / 0.10)", bd: "oklch(67% 0.21 22 / 0.24)" },
};

// ── Types ─────────────────────────────────────────────────────────────

type SubtaskLite = {
  id: number;
  title: string;
  status: "pending" | "in_progress" | "done" | "cancelled";
  description?: string | null;
};

type TaskLike = {
  id: number; title: string; category: string;
  month: number; dateFrom: number; dateTo: number;
  responsible: string; status: string; priority: string;
  description?: string | null; notes?: string | null;
  subtasks?: SubtaskLite[];
};

type MonthStat = { month: number; total: number; done: number; critical: number };

interface DashboardProps {
  total: number; done: number; critical: number; pending: number;
  curMonth: number; curDone: number; currentMonth: number;
  monthStats: MonthStat[];
  upcoming: TaskLike[];
}

// ── Helpers ───────────────────────────────────────────────────────────

function urgencyOf(task: TaskLike) {
  const d = getTaskDueInDays(task as Parameters<typeof getTaskDueInDays>[0]);
  if (d <= 0) return { label: "Просрочено", color: "oklch(67% 0.21 22)",  dot: true };
  if (d <= 2) return { label: "Сегодня-завтра", color: "oklch(67% 0.21 22)",  dot: true };
  if (d <= 7) return { label: `Через ${d} дн.`, color: "oklch(74% 0.18 68)",  dot: false };
  return           { label: `Через ${d} дн.`, color: "oklch(68% 0.18 288)", dot: false };
}

// ── Task Detail Modal ─────────────────────────────────────────────────

function TaskModal({ task, onClose }: { task: TaskLike; onClose: () => void }) {
  const cat    = CAT_META[task.category] ?? { icon: "•", color: "var(--tx-3)", label: task.category };
  const pri    = PRI_META[task.priority] ?? PRI_META.normal;
  const st     = ST_META[task.status]    ?? ST_META.pending;
  const urg    = urgencyOf(task);
  const subs   = task.subtasks ?? [];
  const sDone  = subs.filter(s => s.status === "done").length;
  const sTotal = subs.length;
  const pct    = sTotal > 0 ? Math.round((sDone / sTotal) * 100) : 0;
  const dur    = task.dateTo - task.dateFrom + 1;
  const dueIn  = getTaskDueInDays(task as Parameters<typeof getTaskDueInDays>[0]);
  const isDone = task.status === "done";

  const [tab, setTab] = useState<"overview" | "subtasks" | "notes">("overview");

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px",
        background: "oklch(8% 0.016 270 / 0.75)",
        backdropFilter: "blur(18px)",
        animation: "fadeIn 0.18s ease forwards",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 660,
          maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          borderRadius: 24, overflow: "hidden",
          background: "oklch(19% 0.028 268 / 0.98)",
          border: `1px solid ${cat.color.replace(")", " / 0.22)")}`,
          boxShadow: [
            "0 40px 100px oklch(0% 0 0 / 0.60)",
            "0 0 0 1px oklch(100% 0 0 / 0.06) inset",
          ].join(", "),
          animation: "scaleIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* ── HEADER ── */}
        <div style={{
          padding: "22px 24px 18px",
          background: `linear-gradient(145deg, ${cat.color.replace(")", " / 0.10)")} 0%, transparent 60%)`,
          borderBottom: "1px solid var(--bd-1)",
          flexShrink: 0,
        }}>
          {/* Icon + title row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
            {/* Cat icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 15, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
              background: `${cat.color.replace(")", " / 0.14)")}`,
              border: `1px solid ${cat.color.replace(")", " / 0.28)")}`,
              boxShadow: `0 4px 16px ${cat.color.replace(")", " / 0.16)")}`,
            }}>
              {cat.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 9 }}>
                {/* Category */}
                <span className="badge" style={{
                  color: cat.color,
                  background: `${cat.color.replace(")", " / 0.12)")}`,
                  borderColor: `${cat.color.replace(")", " / 0.28)")}`,
                }}>
                  {cat.icon} {cat.label}
                </span>
                {/* Priority */}
                <span className="badge" style={{
                  color: pri.color,
                  background: `${pri.color.replace(")", " / 0.12)")}`,
                  borderColor: `${pri.color.replace(")", " / 0.28)")}`,
                }}>
                  {pri.label}
                </span>
                {/* Status */}
                <span className="badge" style={{ color: st.color, background: st.bg, borderColor: st.bd }}>
                  {st.label}
                </span>
                {/* Urgency */}
                <span className="badge" style={{
                  color: urg.color,
                  background: `${urg.color.replace(")", " / 0.10)")}`,
                  borderColor: `${urg.color.replace(")", " / 0.25)")}`,
                }}>
                  {urg.dot && (
                    <span style={{
                      display: "inline-block", width: 5, height: 5, borderRadius: "50%",
                      background: urg.color, animation: "pulse 1.5s ease-in-out infinite",
                    }} />
                  )}
                  {urg.label}
                </span>
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25,
                color: isDone ? "var(--tx-3)" : "var(--tx-1)",
                textDecoration: isDone ? "line-through" : "none",
              }}>
                {task.title}
              </h2>
              <p style={{ fontSize: 11, color: "var(--tx-3)", marginTop: 5, fontFamily: "var(--font-mono)" }}>
                Ответственный: <span style={{ color: "oklch(78% 0.12 288)" }}>{task.responsible}</span>
                &nbsp;·&nbsp;ID #{task.id}
                &nbsp;·&nbsp;{MONTHS_FULL[task.month]}, {task.dateFrom === task.dateTo ? task.dateFrom : `${task.dateFrom}–${task.dateTo}`}
              </p>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, lineHeight: 1, cursor: "pointer",
                border: "1px solid var(--bd-1)", background: "oklch(100% 0 0 / 0.04)",
                color: "var(--tx-4)", transition: "all 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.09)"; e.currentTarget.style.color = "var(--tx-1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.04)"; e.currentTarget.style.color = "var(--tx-4)"; }}
            >×</button>
          </div>

          {/* Subtask progress strip */}
          {sTotal > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-4)", letterSpacing: "0.08em" }}>
                  Прогресс подзадач
                </span>
                <span style={{
                  fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700,
                  color: pct === 100 ? "var(--success)" : pri.color,
                }}>
                  {sDone}/{sTotal} · {pct}%
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 5, overflow: "hidden", background: "oklch(100% 0 0 / 0.08)" }}>
                <div style={{
                  height: "100%", width: `${pct}%`, borderRadius: 5,
                  background: pct === 100
                    ? "linear-gradient(90deg, var(--success), oklch(72% 0.17 152 / 0.80))"
                    : `linear-gradient(90deg, ${pri.color}, ${pri.color.replace(")", " / 0.72)")})`,
                  boxShadow: pct === 100 ? "0 0 10px oklch(72% 0.17 152 / 0.50)" : `0 0 10px ${pri.color.replace(")", " / 0.40)")}`,
                  transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
                }} />
              </div>
            </div>
          )}
        </div>

        {/* ── TABS ── */}
        <div style={{
          display: "flex", borderBottom: "1px solid var(--bd-1)",
          flexShrink: 0, background: "oklch(100% 0 0 / 0.01)",
        }}>
          {([
            { id: "overview"  as const, label: "Обзор" },
            { id: "subtasks"  as const, label: sTotal > 0 ? `Подзадачи (${sDone}/${sTotal})` : "Подзадачи" },
            { id: "notes"     as const, label: "Примечания" },
          ]).map(t => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "11px 20px",
                  fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: isActive ? 600 : 400,
                  color: isActive ? "oklch(82% 0.10 288)" : "var(--tx-4)",
                  background: isActive ? "oklch(68% 0.18 288 / 0.07)" : "transparent",
                  border: "none",
                  borderBottom: isActive ? "2px solid oklch(68% 0.18 288)" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  position: "relative", top: 1,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── CONTENT ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Timeline block */}
              <div style={{
                padding: "18px 20px", borderRadius: 18,
                background: "oklch(68% 0.18 288 / 0.07)",
                border: "1px solid oklch(68% 0.18 288 / 0.16)",
              }}>
                <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.10em", textTransform: "uppercase", color: "oklch(68% 0.18 288 / 0.55)", marginBottom: 14 }}>
                  Сроки исполнения
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 14, alignItems: "center" }}>
                  {[
                    { label: "Начало", val: task.dateFrom },
                    null,
                    { label: "Конец",  val: task.dateTo  },
                  ].map((item, i) =>
                    item === null ? (
                      <div key="mid" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 28, height: 1, background: "oklch(68% 0.18 288 / 0.35)" }} />
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: "oklch(74% 0.10 288)" }}>
                          {dur} {dur === 1 ? "день" : dur < 5 ? "дня" : "дней"}
                        </span>
                        <div style={{ width: 28, height: 1, background: "oklch(68% 0.18 288 / 0.35)" }} />
                        <span style={{
                          fontSize: 9, fontFamily: "var(--font-mono)", textAlign: "center", marginTop: 2,
                          color: dueIn <= 0 ? "var(--danger)" : "var(--tx-4)",
                        }}>
                          {dueIn <= 0 ? "просрочено" : `через ${dueIn} дн.`}
                        </span>
                      </div>
                    ) : (
                      <div key={i} style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.08em", color: "var(--tx-4)", marginBottom: 5 }}>{item.label}</p>
                        <p style={{ fontSize: 40, fontWeight: 700, fontFamily: "var(--font-mono)", color: "oklch(80% 0.10 288)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{item.val}</p>
                        <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-3)", marginTop: 3 }}>{MONTHS_FULL[task.month]}</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Info grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Категория",     value: `${cat.icon} ${cat.label}`, color: cat.color },
                  { label: "Ответственный", value: task.responsible,           color: "oklch(80% 0.10 288)" },
                  { label: "Приоритет",     value: pri.label,                  color: pri.color },
                  { label: "Статус",        value: st.label,                   color: st.color },
                ].map(row => (
                  <div key={row.label} style={{
                    padding: "13px 16px", borderRadius: 14,
                    background: "oklch(100% 0 0 / 0.03)",
                    border: "1px solid var(--bd-1)",
                  }}>
                    <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{row.label}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)", color: row.color }}>{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div style={{
                padding: "16px 18px", borderRadius: 16,
                background: task.description ? "oklch(100% 0 0 / 0.03)" : "oklch(100% 0 0 / 0.01)",
                border: task.description ? "1px solid var(--bd-1)" : "1px dashed var(--bd-1)",
              }}>
                <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Описание задачи
                </p>
                {task.description
                  ? <p style={{ fontSize: 13, lineHeight: 1.75, color: "var(--tx-2)" }}>{task.description}</p>
                  : <p style={{ fontSize: 12, color: "var(--tx-4)", fontStyle: "italic" }}>Описание не добавлено</p>
                }
              </div>

              {/* Subtask shortcut */}
              {sTotal > 0 && (
                <button
                  onClick={() => setTab("subtasks")}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 18px", borderRadius: 14, cursor: "pointer",
                    border: "1px solid oklch(68% 0.18 288 / 0.20)",
                    background: "oklch(68% 0.18 288 / 0.06)",
                    color: "oklch(78% 0.10 288)", fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 500,
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "oklch(68% 0.18 288 / 0.12)"; e.currentTarget.style.borderColor = "oklch(68% 0.18 288 / 0.36)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "oklch(68% 0.18 288 / 0.06)"; e.currentTarget.style.borderColor = "oklch(68% 0.18 288 / 0.20)"; }}
                >
                  <span>◻ Подзадачи — {sDone} из {sTotal} выполнено ({pct}%)</span>
                  <span style={{ fontSize: 16 }}>›</span>
                </button>
              )}
            </div>
          )}

          {/* SUBTASKS */}
          {tab === "subtasks" && (
            <div>
              {sTotal === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 32, opacity: 0.18, marginBottom: 10 }}>◻</div>
                  <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--tx-4)" }}>
                    Подзадачи не добавлены
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {/* Progress summary */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                    borderRadius: 14, marginBottom: 4,
                    background: `${pri.color.replace(")", " / 0.07)")}`,
                    border: `1px solid ${pri.color.replace(")", " / 0.18)")}`,
                  }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 6, overflow: "hidden", background: "oklch(100% 0 0 / 0.08)" }}>
                      <div style={{
                        height: "100%", width: `${pct}%`, borderRadius: 6,
                        background: pct === 100 ? "var(--success)" : pri.color,
                        transition: "width 0.8s ease",
                      }} />
                    </div>
                    <span style={{
                      fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, flexShrink: 0,
                      color: pct === 100 ? "var(--success)" : pri.color,
                    }}>
                      {pct}%
                    </span>
                  </div>

                  {subs.map((sub, idx) => {
                    const subSt  = ST_META[sub.status] ?? ST_META.pending;
                    const isDoneS = sub.status === "done";
                    return (
                      <div key={sub.id} style={{
                        padding: "12px 16px", borderRadius: 14,
                        background: isDoneS ? "oklch(72% 0.17 152 / 0.04)" : "oklch(100% 0 0 / 0.03)",
                        border: isDoneS ? "1px solid oklch(72% 0.17 152 / 0.16)" : "1px solid var(--bd-1)",
                        opacity: isDoneS ? 0.72 : 1,
                        transition: "opacity 0.2s",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-4)", width: 22, textAlign: "right", flexShrink: 0 }}>
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <div style={{
                            width: 19, height: 19, borderRadius: 6, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: isDoneS ? "1px solid oklch(72% 0.17 152 / 0.70)" : "1px solid var(--bd-3)",
                            background: isDoneS ? "oklch(72% 0.17 152 / 0.15)" : "transparent",
                          }}>
                            {isDoneS && <span style={{ fontSize: 10, color: "var(--success)", fontWeight: 700 }}>✓</span>}
                          </div>
                          <span style={{
                            flex: 1, fontSize: 13, lineHeight: 1.4, fontWeight: 500,
                            color: isDoneS ? "var(--tx-4)" : "var(--tx-1)",
                            textDecoration: isDoneS ? "line-through" : "none",
                          }}>
                            {sub.title}
                          </span>
                          <span style={{
                            fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 600,
                            padding: "2px 8px", borderRadius: 99, flexShrink: 0,
                            color: subSt.color, background: subSt.bg, border: `1px solid ${subSt.bd}`,
                          }}>
                            {subSt.label}
                          </span>
                        </div>
                        {sub.description && (
                          <p style={{
                            marginTop: 8, marginLeft: 52,
                            fontSize: 11, lineHeight: 1.6,
                            color: "var(--tx-3)", fontFamily: "var(--font-mono)",
                            paddingLeft: 11, borderLeft: "2px solid var(--bd-2)",
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

          {/* NOTES */}
          {tab === "notes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{
                padding: "18px 20px", borderRadius: 16,
                background: task.notes ? "oklch(74% 0.18 68 / 0.05)" : "oklch(100% 0 0 / 0.01)",
                border: task.notes ? "1px solid oklch(74% 0.18 68 / 0.18)" : "1px dashed var(--bd-1)",
              }}>
                <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "oklch(74% 0.18 68 / 0.55)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Примечания офицера
                </p>
                {task.notes
                  ? <p style={{ fontSize: 13, lineHeight: 1.8, fontFamily: "var(--font-mono)", color: "oklch(82% 0.10 68)", whiteSpace: "pre-wrap" }}>{task.notes}</p>
                  : <p style={{ fontSize: 12, color: "var(--tx-4)", fontStyle: "italic" }}>Примечания не добавлены</p>
                }
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          padding: "14px 24px", flexShrink: 0,
          borderTop: "1px solid var(--bd-1)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <a
            href={`/tasks?month=${task.month}`}
            style={{
              fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 500,
              color: "var(--tx-3)", textDecoration: "none",
              padding: "7px 14px", borderRadius: 10,
              border: "1px solid var(--bd-1)", background: "oklch(100% 0 0 / 0.03)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--tx-1)"; e.currentTarget.style.background = "oklch(100% 0 0 / 0.07)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--tx-3)"; e.currentTarget.style.background = "oklch(100% 0 0 / 0.03)"; }}
          >
            Открыть в журнале →
          </a>
          <button
            onClick={onClose}
            style={{
              fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600, cursor: "pointer",
              padding: "7px 20px", borderRadius: 10,
              color: "oklch(80% 0.10 288)", border: "1px solid oklch(68% 0.18 288 / 0.30)",
              background: "oklch(68% 0.18 288 / 0.10)", transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "oklch(68% 0.18 288 / 0.20)"; e.currentTarget.style.borderColor = "oklch(68% 0.18 288 / 0.50)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "oklch(68% 0.18 288 / 0.10)"; e.currentTarget.style.borderColor = "oklch(68% 0.18 288 / 0.30)"; }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, progress, color, icon, index,
}: {
  label: string; value: number; sub: string; progress: number;
  color: string; icon: string; index: number;
}) {
  return (
    <div
      className="animate-fade-up"
      style={{
        borderRadius: 22, padding: "22px 24px",
        position: "relative", overflow: "hidden",
        animationDelay: `${index * 0.07}s`,
        background: "var(--bg-card)",
        border: "1px solid var(--bd-1)",
        boxShadow: "0 4px 24px oklch(0% 0 0 / 0.22)",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 8px 32px oklch(0% 0 0 / 0.32)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 4px 24px oklch(0% 0 0 / 0.22)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute", top: -30, right: -30, width: 140, height: 140,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color.replace(")", " / 0.14)")} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Icon + label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{
          fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--tx-4)", fontWeight: 600,
        }}>
          {label}
        </p>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
          background: `${color.replace(")", " / 0.14)")}`,
          border: `1px solid ${color.replace(")", " / 0.24)")}`,
        }}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <p style={{
        fontSize: 52, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em",
        color, textShadow: `0 0 32px ${color.replace(")", " / 0.40)")}`,
        marginBottom: 6, fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </p>

      {/* Sub */}
      <p style={{ fontSize: 12, color: "var(--tx-3)", marginBottom: 16, lineHeight: 1.4 }}>{sub}</p>

      {/* Progress bar */}
      <div style={{ height: 4, borderRadius: 4, overflow: "hidden", background: "oklch(100% 0 0 / 0.07)" }}>
        <div style={{
          height: "100%",
          width: `${Math.min(100, progress)}%`,
          borderRadius: 4,
          background: `linear-gradient(90deg, ${color.replace(")", " / 0.70)")}, ${color})`,
          boxShadow: `0 0 8px ${color.replace(")", " / 0.45)")}`,
          transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }} />
      </div>
    </div>
  );
}

// ── Annual Bar Chart ──────────────────────────────────────────────────

function AnnualChart({ monthStats, currentMonth }: { monthStats: MonthStat[]; currentMonth: number }) {
  const maxVal = Math.max(...monthStats.map(m => m.total), 1);
  const [hov,  setHov ] = useState<number | null>(null);

  return (
    <div
      className="animate-fade-up delay-3"
      style={{
        borderRadius: 22, padding: "22px 24px",
        background: "var(--bg-card)", border: "1px solid var(--bd-1)",
        boxShadow: "0 4px 24px oklch(0% 0 0 / 0.22)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--tx-1)", marginBottom: 3 }}>
            Годовой план
          </p>
          <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-4)" }}>
            Нагрузка и исполнение по месяцам
          </p>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { color: "oklch(68% 0.18 288 / 0.65)", label: "план" },
            { color: "oklch(72% 0.17 152 / 0.65)", label: "выполнено" },
            { color: "oklch(67% 0.21 22 / 0.65)",  label: "критично" },
          ].map(l => (
            <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-3)" }}>
              <span style={{ display: "inline-block", width: 12, height: 4, borderRadius: 4, background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Bars */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 110 }}>
        {monthStats.map(m => {
          const barH  = m.total > 0 ? Math.max(Math.round((m.total / maxVal) * 90), 6) : 0;
          const doneH = m.total > 0 ? Math.round((m.done / m.total) * barH) : 0;
          const isCur = m.month === currentMonth;
          const isHov = hov === m.month;
          const hasCrit = m.critical > 0;

          const barColor = isCur
            ? "linear-gradient(to top, oklch(74% 0.18 68 / 0.75), oklch(74% 0.18 68 / 0.32))"
            : hasCrit
              ? "linear-gradient(to top, oklch(67% 0.21 22 / 0.65), oklch(67% 0.21 22 / 0.22))"
              : "linear-gradient(to top, oklch(68% 0.18 288 / 0.60), oklch(68% 0.18 288 / 0.18))";

          const barBorder = isCur
            ? "1px solid oklch(74% 0.18 68 / 0.50)"
            : hasCrit
              ? "1px solid oklch(67% 0.21 22 / 0.35)"
              : "1px solid oklch(68% 0.18 288 / 0.30)";

          return (
            <a
              key={m.month}
              href={`/tasks?month=${m.month}`}
              onMouseEnter={() => setHov(m.month)}
              onMouseLeave={() => setHov(null)}
              style={{
                flex: 1, minWidth: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "flex-end",
                height: "100%", textDecoration: "none",
                cursor: m.total > 0 ? "pointer" : "default",
                position: "relative",
                gap: 4,
              }}
            >
              {/* Tooltip */}
              {isHov && m.total > 0 && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 10px)", left: "50%",
                  transform: "translateX(-50%)", zIndex: 10,
                  whiteSpace: "nowrap", padding: "8px 13px", borderRadius: 12,
                  background: "oklch(24% 0.030 268 / 0.98)",
                  border: "1px solid var(--bd-2)",
                  boxShadow: "0 8px 28px oklch(0% 0 0 / 0.40)",
                  animation: "fadeUp 0.15s ease forwards",
                }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--tx-1)", marginBottom: 2 }}>
                    {MONTHS_FULL[m.month]}
                  </p>
                  <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-3)" }}>
                    {m.done}/{m.total} задач{m.critical > 0 ? ` · ${m.critical} крит.` : ""}
                  </p>
                </div>
              )}

              {m.total > 0 ? (
                <div style={{
                  width: "100%",
                  height: barH,
                  borderRadius: "8px 8px 0 0",
                  position: "relative",
                  overflow: "hidden",
                  background: barColor,
                  border: barBorder,
                  boxShadow: isCur ? "0 0 12px oklch(74% 0.18 68 / 0.22)" : isHov ? "0 0 12px oklch(68% 0.18 288 / 0.22)" : "none",
                  filter: isHov ? "brightness(1.25)" : "brightness(1)",
                  transition: "filter 0.2s, box-shadow 0.2s",
                }}>
                  {/* Done overlay */}
                  {doneH > 0 && (
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      height: doneH,
                      background: "oklch(72% 0.17 152 / 0.35)",
                      borderTop: "1px solid oklch(72% 0.17 152 / 0.45)",
                    }} />
                  )}
                </div>
              ) : (
                <div style={{ width: "100%", height: 4, borderRadius: 4, background: "oklch(100% 0 0 / 0.04)" }} />
              )}
            </a>
          );
        })}
      </div>

      {/* Month labels */}
      <div style={{ display: "flex", gap: 7, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--bd-1)" }}>
        {monthStats.map(m => (
          <div key={m.month} style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <span style={{
              fontSize: 8, fontFamily: "var(--font-mono)", display: "block",
              overflow: "hidden", letterSpacing: "0.04em",
              color: m.month === currentMonth ? "oklch(74% 0.18 68)" : m.total > 0 ? "var(--tx-3)" : "var(--tx-4)",
              fontWeight: m.month === currentMonth ? 700 : 400,
            }}>
              {MONTHS_SHORT[m.month]}
            </span>
            {m.total > 0 && (
              <span style={{
                fontSize: 7, fontFamily: "var(--font-mono)",
                color: "var(--tx-4)", display: "block", marginTop: 1,
              }}>
                {m.total}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Upcoming Task Row ─────────────────────────────────────────────────

function UpcomingRow({ task, onOpen }: { task: TaskLike; onOpen: (t: TaskLike) => void }) {
  const cat  = CAT_META[task.category] ?? { icon: "•", color: "var(--tx-3)", label: task.category };
  const pri  = PRI_META[task.priority] ?? PRI_META.normal;
  const urg  = urgencyOf(task);
  const subs = task.subtasks ?? [];
  const sDone = subs.filter(s => s.status === "done").length;
  const sTotal = subs.length;
  const pct  = sTotal > 0 ? Math.round((sDone / sTotal) * 100) : 0;
  const isDone = task.status === "done";

  return (
    <button
      onClick={() => onOpen(task)}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 13,
        padding: "13px 17px 13px 20px", borderRadius: 16,
        position: "relative", overflow: "hidden",
        background: task.priority === "critical" && !isDone
          ? "linear-gradient(145deg, oklch(67% 0.21 22 / 0.08), oklch(22% 0.030 268 / 0.75))"
          : isDone
            ? "oklch(100% 0 0 / 0.02)"
            : "var(--bg-raised)",
        border: isDone
          ? "1px solid var(--bd-1)"
          : task.priority === "critical"
            ? "1px solid oklch(67% 0.21 22 / 0.26)"
            : "1px solid var(--bd-1)",
        opacity: isDone ? 0.55 : 1,
        transition: "all 0.20s ease",
      }}
      onMouseEnter={e => {
        if (!isDone) {
          e.currentTarget.style.background = "var(--bg-card)";
          e.currentTarget.style.borderColor = "var(--bd-2)";
          e.currentTarget.style.transform = "translateX(2px)";
          e.currentTarget.style.boxShadow = "0 4px 18px oklch(0% 0 0 / 0.22)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = task.priority === "critical" && !isDone
          ? "linear-gradient(145deg, oklch(67% 0.21 22 / 0.08), oklch(22% 0.030 268 / 0.75))"
          : isDone ? "oklch(100% 0 0 / 0.02)" : "var(--bg-raised)";
        e.currentTarget.style.borderColor = isDone ? "var(--bd-1)" : task.priority === "critical" ? "oklch(67% 0.21 22 / 0.26)" : "var(--bd-1)";
        e.currentTarget.style.transform = "translateX(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Priority stripe */}
      <div className="priority-bar" style={{
        background: isDone ? "var(--bd-1)" : pri.color,
        boxShadow: !isDone && task.priority === "critical" ? `0 0 8px ${pri.color.replace(")", " / 0.50)")}` : "none",
      }} />

      {/* Category icon bubble */}
      <div style={{
        width: 36, height: 36, borderRadius: 11, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 17,
        background: `${cat.color.replace(")", " / 0.12)")}`,
        border: `1px solid ${cat.color.replace(")", " / 0.22)")}`,
      }}>
        {cat.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          marginBottom: 5, lineHeight: 1.3,
          color: isDone ? "var(--tx-4)" : "var(--tx-1)",
          textDecoration: isDone ? "line-through" : "none",
        }}>
          {task.title}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {/* Date */}
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-4)" }}>
            {MONTHS_SHORT[task.month]} {task.dateFrom === task.dateTo ? task.dateFrom : `${task.dateFrom}–${task.dateTo}`}
          </span>
          {/* Urgency pill */}
          <span style={{
            fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700,
            padding: "2px 8px", borderRadius: 99,
            color: urg.color,
            background: `${urg.color.replace(")", " / 0.10)")}`,
            border: `1px solid ${urg.color.replace(")", " / 0.24)")}`,
          }}>
            {urg.dot && "● "}{urg.label}
          </span>
          {/* Responsible */}
          <span style={{
            fontSize: 9, fontFamily: "var(--font-mono)",
            padding: "2px 8px", borderRadius: 99,
            color: "var(--tx-3)", background: "oklch(100% 0 0 / 0.04)", border: "1px solid var(--bd-1)",
          }}>
            {task.responsible}
          </span>
          {/* Subtask count */}
          {sTotal > 0 && (
            <span style={{
              fontSize: 9, fontFamily: "var(--font-mono)",
              color: sDone === sTotal ? "var(--success)" : "var(--tx-4)",
            }}>
              ◻ {sDone}/{sTotal}
            </span>
          )}
        </div>
      </div>

      {/* Progress mini-bar */}
      {sTotal > 0 && (
        <div style={{ flexShrink: 0, width: 44 }}>
          <div style={{ height: 3, borderRadius: 3, overflow: "hidden", background: "oklch(100% 0 0 / 0.07)" }}>
            <div style={{
              height: "100%", width: `${pct}%`, borderRadius: 3,
              background: pct === 100 ? "var(--success)" : pri.color,
              transition: "width 0.5s ease",
            }} />
          </div>
          <p style={{
            fontSize: 8, fontFamily: "var(--font-mono)", textAlign: "right", marginTop: 2,
            color: pct === 100 ? "var(--success)" : "var(--tx-4)",
          }}>
            {pct}%
          </p>
        </div>
      )}

      {/* Arrow */}
      <span style={{ fontSize: 16, color: "var(--tx-4)", flexShrink: 0, lineHeight: 1 }}>›</span>
    </button>
  );
}

// ── Summary Strip ─────────────────────────────────────────────────────

function SummaryStrip({ critical, pending, done }: { critical: number; pending: number; done: number }) {
  const items = [
    { label: "Критичных",   value: critical, color: "oklch(67% 0.21 22)",  icon: "⚡" },
    { label: "В работе",    value: pending,  color: "oklch(74% 0.18 68)",  icon: "⏳" },
    { label: "Выполнено",   value: done,     color: "oklch(72% 0.17 152)", icon: "✓"  },
  ] as const;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {items.map((row, i) => (
        <div
          key={row.label}
          className="animate-fade-up"
          style={{
            padding: "16px 20px",
            borderRadius: 18,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--bg-card)", border: "1px solid var(--bd-1)",
            animationDelay: `${0.38 + i * 0.07}s`,
          }}
        >
          <div>
            <p style={{ fontSize: 11, color: "var(--tx-3)", marginBottom: 5 }}>{row.label}</p>
            <p style={{
              fontSize: 30, fontWeight: 700, fontVariantNumeric: "tabular-nums",
              color: row.color, lineHeight: 1,
              textShadow: `0 0 20px ${row.color.replace(")", " / 0.40)")}`,
            }}>
              {row.value}
            </p>
          </div>
          <span style={{ fontSize: 26, opacity: 0.30 }}>{row.icon}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────

export function DashboardClient({
  total, done, critical, pending,
  curMonth, curDone, currentMonth,
  monthStats, upcoming,
}: DashboardProps) {
  const [modal, setModal] = useState<TaskLike | null>(null);
  const readiness = total > 0 ? Math.round((done / total) * 100) : 0;

  const openTask  = useCallback((t: TaskLike) => setModal(t), []);
  const closeTask = useCallback(() => setModal(null), []);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 1200 }}>

        {/* ── Critical Banner ── */}
        {critical > 0 && (
          <a
            href="/tasks?criticalOnly=1"
            className="animate-fade-up"
            style={{
              display: "flex", alignItems: "center", gap: 13,
              padding: "13px 18px", borderRadius: 16, textDecoration: "none",
              background: "oklch(67% 0.21 22 / 0.07)",
              border: "1px solid oklch(67% 0.21 22 / 0.26)",
              boxShadow: "0 2px 18px oklch(67% 0.21 22 / 0.10)",
              transition: "all 0.20s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "oklch(67% 0.21 22 / 0.12)"; e.currentTarget.style.boxShadow = "0 4px 28px oklch(67% 0.21 22 / 0.18)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "oklch(67% 0.21 22 / 0.07)"; e.currentTarget.style.boxShadow = "0 2px 18px oklch(67% 0.21 22 / 0.10)"; }}
          >
            {/* Pulsing dot */}
            <span style={{
              width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
              background: "var(--danger)", boxShadow: "0 0 9px var(--danger)",
              animation: "pulse 1.6s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 13, color: "oklch(82% 0.12 22)", flex: 1 }}>
              <strong>Внимание:</strong> {critical} {critical === 1 ? "задача требует" : critical < 5 ? "задачи требуют" : "задач требуют"} немедленного внимания
            </span>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "oklch(67% 0.21 22 / 0.60)", flexShrink: 0 }}>
              Показать →
            </span>
          </a>
        )}

        {/* ── KPI Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <KpiCard
            index={0}
            label="Критичных задач"
            value={critical}
            icon="⚡"
            color="oklch(67% 0.21 22)"
            sub="Требуют немедленного решения"
            progress={0}
          />
          <KpiCard
            index={1}
            label={`Задач в ${MONTHS_FULL[currentMonth]}`}
            value={curMonth}
            icon="📅"
            color="oklch(74% 0.18 68)"
            sub={`${curDone} из ${curMonth} выполнено`}
            progress={curMonth > 0 ? (curDone / curMonth) * 100 : 0}
          />
          <KpiCard
            index={2}
            label="Всего выполнено"
            value={done}
            icon="✦"
            color="oklch(72% 0.17 152)"
            sub={`${readiness}% выполнено из ${total} за год`}
            progress={total > 0 ? (done / total) * 100 : 0}
          />
        </div>

        {/* ── Annual Chart ── */}
        <AnnualChart monthStats={monthStats} currentMonth={currentMonth} />

        {/* ── Upcoming Tasks ── */}
        <div
          className="animate-fade-up delay-4"
          style={{
            borderRadius: 22, overflow: "hidden",
            background: "var(--bg-card)", border: "1px solid var(--bd-1)",
            boxShadow: "0 4px 24px oklch(0% 0 0 / 0.22)",
          }}
        >
          {/* Card header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 22px",
            borderBottom: "1px solid var(--bd-1)",
          }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--tx-1)", marginBottom: 3 }}>
                Ближайшие задачи
              </h3>
              <p style={{ fontSize: 11, color: "var(--tx-4)", fontFamily: "var(--font-mono)" }}>
                Нажмите на задачу для просмотра деталей
              </p>
            </div>
            <a
              href="/tasks"
              style={{
                fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 500,
                padding: "6px 14px", borderRadius: 10, textDecoration: "none",
                color: "var(--tx-3)", border: "1px solid var(--bd-1)",
                background: "oklch(100% 0 0 / 0.03)", transition: "all 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.07)"; e.currentTarget.style.color = "var(--tx-1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.03)"; e.currentTarget.style.color = "var(--tx-3)"; }}
            >
              Все задачи →
            </a>
          </div>

          {/* Task list */}
          <div style={{ padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
            {upcoming.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 0" }}>
                <div style={{ fontSize: 28, opacity: 0.20, marginBottom: 10 }}>✓</div>
                <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--tx-4)" }}>
                  Все задачи выполнены
                </p>
              </div>
            ) : (
              upcoming.map(t => (
                <UpcomingRow key={t.id} task={t} onOpen={openTask} />
              ))
            )}
          </div>
        </div>

        {/* ── Summary Strip ── */}
        <SummaryStrip critical={critical} pending={pending} done={done} />
      </div>

      {/* ── Detail Modal ── */}
      {modal && <TaskModal task={modal} onClose={closeTask} />}
    </>
  );
}