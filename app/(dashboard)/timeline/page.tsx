"use client";

import { completeTask, reopenTask, getTimelineTasks } from "@/actions/tasks";
import { useEffect, useMemo, useState, useTransition, useCallback } from "react";

type Priority = "critical" | "high" | "normal";
type Status   = "pending" | "in_progress" | "done" | "cancelled";

type TimelineTask = {
  id: number; title: string; category: string;
  month: number; dateFrom: number; dateTo: number;
  responsible: string; status: Status; priority: Priority;
};

// ── Constants ─────────────────────────────────────────────────────────

const MONTHS      = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"] as const;
const MONTHS_FULL = ["","Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"] as const;
const DAYS_IN_MONTH = [0,31,28,31,30,31,30,31,31,30,31,30,31];
const ALLOWED_PERSONNEL = ["КВ-1","КВ-2","СР","КНР","ЗКВ-1","ЗКВ-2","КО-2"] as const;

const PRIORITY_CFG: Record<Priority, { color: string; glow: string; label: string; abbr: string }> = {
  critical: { color: "oklch(68% 0.22 25)",  glow: "oklch(68% 0.22 25 / 0.40)",  label: "Критический", abbr: "КРТ" },
  high:     { color: "oklch(75% 0.18 75)",  glow: "oklch(75% 0.18 75 / 0.35)",  label: "Высокий",     abbr: "ВЫС" },
  normal:   { color: "oklch(68% 0.18 272)", glow: "oklch(68% 0.18 272 / 0.30)", label: "Нормальный",  abbr: "НОР" },
};

const STATUS_CFG: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  pending:     { label: "ОЖИДАЕТ",   color: "oklch(60% 0.05 260)", bg: "oklch(100% 0 0 / 0.05)",          border: "oklch(100% 0 0 / 0.12)"          },
  in_progress: { label: "В РАБОТЕ",  color: "oklch(75% 0.18 75)",  bg: "oklch(75% 0.18 75 / 0.10)",       border: "oklch(75% 0.18 75 / 0.25)"       },
  done:        { label: "ВЫПОЛНЕНО", color: "oklch(72% 0.17 155)", bg: "oklch(72% 0.17 155 / 0.10)",      border: "oklch(72% 0.17 155 / 0.25)"      },
  cancelled:   { label: "ОТМЕНЕНО",  color: "oklch(68% 0.22 25)",  bg: "oklch(68% 0.22 25 / 0.10)",       border: "oklch(68% 0.22 25 / 0.25)"       },
};

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  "Н":   { icon: "⚗",  color: "oklch(72% 0.17 155)" },
  "А":   { icon: "📡", color: "oklch(68% 0.18 232)" },
  "БП":  { icon: "🎯", color: "oklch(68% 0.22 25)"  },
  "ПД":  { icon: "⚙",  color: "oklch(75% 0.18 75)"  },
  "ВПР": { icon: "🎖", color: "oklch(66% 0.20 285)" },
  "У":   { icon: "🏁", color: "oklch(72% 0.18 55)"  },
  "П":   { icon: "🔰", color: "oklch(72% 0.14 210)" },
  "ЗиТ": { icon: "💻", color: "oklch(60% 0.06 255)" },
  "ЕМ":  { icon: "📋", color: "oklch(75% 0.18 75)"  },
  "НД":  { icon: "🔬", color: "oklch(72% 0.17 155)" },
  "МГ":  { icon: "⚡", color: "oklch(68% 0.22 25)"  },
};

function toPos(day: number, total: number) { return ((day - 1) / total) * 100; }
function toWidth(from: number, to: number, total: number) { return ((to - from + 1) / total) * 100; }

// ── Main Page ─────────────────────────────────────────────────────────

export default function TimelinePage() {
  const currentMonth = new Date().getMonth() + 1;
  const today        = new Date().getDate();

  const [tasks,          setTasks         ] = useState<TimelineTask[]>([]);
  const [selectedMonth,  setSelectedMonth ] = useState(currentMonth);
  const [selectedId,     setSelectedId    ] = useState<number | null>(null);
  const [filterPriority, setFilterPriority] = useState<Priority | "">("");
  const [filterPerson,   setFilterPerson  ] = useState("");
  const [filterStatus,   setFilterStatus  ] = useState<Status | "">("");
  const [loading,        setLoading       ] = useState(true);
  const [isPending,      startTransition  ] = useTransition();

  const loadTasks = useCallback(async () => {
    const rows = await getTimelineTasks();
    setTasks(rows
      .filter(t => ALLOWED_PERSONNEL.includes(t.responsible as typeof ALLOWED_PERSONNEL[number]))
      .map(t => ({
        id: t.id, title: t.title, category: t.category,
        month: t.month, dateFrom: t.dateFrom, dateTo: t.dateTo,
        responsible: t.responsible, status: t.status as Status,
        priority: (t.priority === "normal" ? "normal" : t.priority) as Priority,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  const monthTasks = useMemo(() => {
    let list = tasks.filter(t => t.month === selectedMonth);
    if (filterPriority) list = list.filter(t => t.priority === filterPriority);
    if (filterPerson)   list = list.filter(t => t.responsible === filterPerson);
    if (filterStatus)   list = list.filter(t => t.status === filterStatus);
    return list.sort((a, b) => a.dateFrom - b.dateFrom);
  }, [tasks, selectedMonth, filterPriority, filterPerson, filterStatus]);

  const selectedTask = tasks.find(t => t.id === selectedId) ?? null;
  const totalDays    = DAYS_IN_MONTH[selectedMonth];
  const doneCount    = monthTasks.filter(t => t.status === "done").length;
  const critCount    = monthTasks.filter(t => t.priority === "critical" && t.status !== "done").length;

  const handleToggle = (task: TimelineTask) => {
    const isDone = task.status === "done";
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: isDone ? "pending" : "done" } : t));
    startTransition(async () => {
      if (isDone) await reopenTask(task.id);
      else await completeTask(task.id);
      await loadTasks();
    });
  };

  const dayTicks = useMemo(() => Array.from({ length: totalDays }, (_, i) => i + 1), [totalDays]);
  const monthPersons = useMemo(() => {
    const set = new Set(tasks.filter(t => t.month === selectedMonth).map(t => t.responsible));
    return ALLOWED_PERSONNEL.filter(p => set.has(p));
  }, [tasks, selectedMonth]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{
            fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "3px",
            color: "oklch(68% 0.18 272 / 0.7)",
            animation: "pulseGlow 1.5s ease-in-out infinite",
          }}>
            // ЗАГРУЗКА ОПЕРАТИВНЫХ ДАННЫХ...
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                height: 2, width: 32, borderRadius: 2,
                background: "oklch(68% 0.18 272 / 0.4)",
                animation: `pulseGlow 1.5s ease-in-out ${i * 0.12}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", overflow: "hidden",
      fontFamily: "var(--font-mono)",
      gap: 0,
    }}>

      {/* ── TOP HEADER ── */}
      <div style={{
        flexShrink: 0, padding: "16px 20px 12px",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
        borderBottom: "1px solid oklch(100% 0 0 / 0.07)",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "oklch(68% 0.18 272)",
              boxShadow: "0 0 8px oklch(68% 0.18 272)",
              animation: "pulseGlow 2s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", color: "oklch(68% 0.18 272 / 0.65)" }}>
              ОПЕРАТИВНЫЙ КАЛЕНДАРЬ · ЦСУ ПД · НР ВАС
            </span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.06em", color: "oklch(96% 0.008 255)", lineHeight: 1.2 }}>
            {MONTHS_FULL[selectedMonth]}{" "}
            <span style={{ color: "oklch(100% 0 0 / 0.25)", fontWeight: 300 }}>·</span>{" "}
            <span style={{ color: "oklch(100% 0 0 / 0.4)", fontSize: 14, fontWeight: 400 }}>{monthTasks.length} задач</span>
          </h2>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {[
            { label: "ВСЕГО", value: monthTasks.length, color: "oklch(68% 0.18 272)" },
            { label: "ВЫПОЛ", value: doneCount,         color: "oklch(72% 0.17 155)" },
            { label: "КРИТ",  value: critCount,         color: critCount > 0 ? "oklch(68% 0.22 25)" : "oklch(100% 0 0 / 0.2)" },
          ].map(s => (
            <div key={s.label} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "8px 14px", borderRadius: 14, minWidth: 50,
              background: "oklch(100% 0 0 / 0.04)",
              border: "1px solid oklch(100% 0 0 / 0.09)",
            }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
              <span style={{ fontSize: 8, letterSpacing: "1.5px", color: "oklch(100% 0 0 / 0.3)", marginTop: 2 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MONTH SELECTOR ── */}
      <div style={{
        flexShrink: 0, padding: "10px 20px",
        display: "flex", gap: 5, flexWrap: "wrap",
        borderBottom: "1px solid oklch(100% 0 0 / 0.06)",
      }}>
        {MONTHS.slice(1).map((m, i) => {
          const month  = i + 1;
          const count  = tasks.filter(t => t.month === month).length;
          const done   = tasks.filter(t => t.month === month && t.status === "done").length;
          const active = month === selectedMonth;
          const isCur  = month === currentMonth;
          const pct    = count > 0 ? Math.round((done / count) * 100) : 0;

          return (
            <button key={month} onClick={() => { setSelectedMonth(month); setSelectedId(null); }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "8px 10px", borderRadius: 14,
                minWidth: 42, cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                background: active ? "oklch(68% 0.18 272 / 0.18)" : "oklch(100% 0 0 / 0.03)",
                border: active ? "1px solid oklch(68% 0.18 272 / 0.45)" : isCur ? "1px solid oklch(68% 0.18 272 / 0.22)" : "1px solid oklch(100% 0 0 / 0.07)",
                boxShadow: active ? "0 4px 20px oklch(68% 0.18 272 / 0.18)" : "none",
                position: "relative",
              }}>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.5px",
                color: active ? "oklch(88% 0.08 272)" : count > 0 ? "oklch(75% 0.04 258)" : "oklch(45% 0.04 260)",
              }}>{m}</span>
              {count > 0 && (
                <>
                  <div style={{ width: "100%", height: 2, borderRadius: 2, overflow: "hidden", background: "oklch(100% 0 0 / 0.07)" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "oklch(72% 0.17 155)" : "oklch(68% 0.18 272 / 0.7)", borderRadius: 2, transition: "width 0.5s ease" }} />
                  </div>
                  <span style={{ fontSize: 8, color: "oklch(100% 0 0 / 0.25)", fontVariantNumeric: "tabular-nums" }}>{count}</span>
                </>
              )}
              {isCur && !active && (
                <div style={{
                  position: "absolute", top: 4, right: 4,
                  width: 4, height: 4, borderRadius: "50%",
                  background: "oklch(68% 0.18 272)",
                  boxShadow: "0 0 6px oklch(68% 0.18 272)",
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── FILTERS ── */}
      <div style={{
        flexShrink: 0, padding: "8px 20px",
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        borderBottom: "1px solid oklch(100% 0 0 / 0.05)",
      }}>
        <span style={{ fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "oklch(100% 0 0 / 0.22)" }}>ФИЛЬТР:</span>

        {(["critical","high","normal"] as Priority[]).map(p => {
          const cfg = PRIORITY_CFG[p];
          const active = filterPriority === p;
          return (
            <button key={p} onClick={() => setFilterPriority(active ? "" : p)}
              style={{
                padding: "3px 10px", borderRadius: 8, fontSize: 9, letterSpacing: "1px", cursor: "pointer",
                transition: "all 0.15s ease",
                ...(active ? {
                  background: `${cfg.color} / 0.15`.replace("oklch(", "oklch(").replace("/ 0.15", ""),
                  backgroundColor: `color-mix(in oklch, ${cfg.color} 15%, transparent)`,
                  border: `1px solid ${cfg.color.replace(")", " / 0.55)")}`,
                  color: cfg.color,
                } : {
                  background: "oklch(100% 0 0 / 0.03)",
                  border: "1px solid oklch(100% 0 0 / 0.09)",
                  color: "oklch(55% 0.04 258)",
                }),
              }}>
              {cfg.abbr}
            </button>
          );
        })}

        <div style={{ width: 1, height: 14, background: "oklch(100% 0 0 / 0.10)" }} />

        {monthPersons.map(p => {
          const active = filterPerson === p;
          return (
            <button key={p} onClick={() => setFilterPerson(active ? "" : p)}
              style={{
                padding: "3px 10px", borderRadius: 8, fontSize: 9, letterSpacing: "1px", cursor: "pointer",
                transition: "all 0.15s ease",
                ...(active ? {
                  background: "oklch(68% 0.18 272 / 0.18)",
                  border: "1px solid oklch(68% 0.18 272 / 0.45)",
                  color: "oklch(88% 0.08 272)",
                } : {
                  background: "oklch(100% 0 0 / 0.03)",
                  border: "1px solid oklch(100% 0 0 / 0.09)",
                  color: "oklch(55% 0.04 258)",
                }),
              }}>
              {p}
            </button>
          );
        })}

        <div style={{ width: 1, height: 14, background: "oklch(100% 0 0 / 0.10)" }} />

        {(["pending","in_progress","done"] as Status[]).map(s => {
          const cfg = STATUS_CFG[s];
          const active = filterStatus === s;
          return (
            <button key={s} onClick={() => setFilterStatus(active ? "" : s)}
              style={{
                padding: "3px 10px", borderRadius: 8, fontSize: 9, letterSpacing: "1px", cursor: "pointer",
                transition: "all 0.15s ease",
                ...(active ? { background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color } : {
                  background: "oklch(100% 0 0 / 0.03)",
                  border: "1px solid oklch(100% 0 0 / 0.09)",
                  color: "oklch(55% 0.04 258)",
                }),
              }}>
              {cfg.label}
            </button>
          );
        })}

        {(filterPriority || filterPerson || filterStatus) && (
          <button onClick={() => { setFilterPriority(""); setFilterPerson(""); setFilterStatus(""); }}
            style={{
              padding: "3px 10px", borderRadius: 8, fontSize: 9, cursor: "pointer",
              border: "1px solid oklch(68% 0.22 25 / 0.35)",
              background: "oklch(68% 0.22 25 / 0.07)",
              color: "oklch(68% 0.22 25 / 0.75)",
              transition: "all 0.15s ease",
            }}>
            × сброс
          </button>
        )}
      </div>

      {/* ── MAIN GANTT + SIDEBAR ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── GANTT CHART ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Day ruler */}
          <div style={{
            flexShrink: 0, position: "relative", display: "flex",
            height: 28, paddingLeft: 224,
            borderBottom: "1px solid oklch(100% 0 0 / 0.06)",
          }}>
            <div style={{ position: "relative", flex: 1 }}>
              {selectedMonth === currentMonth && (
                <div style={{
                  position: "absolute", top: 0, bottom: 0, width: 1, zIndex: 10,
                  left: `${toPos(today, totalDays)}%`,
                  background: "oklch(68% 0.18 272 / 0.6)",
                }} />
              )}
              {dayTicks.filter(d => d === 1 || d % 5 === 0).map(d => (
                <div key={d} style={{
                  position: "absolute", top: 0,
                  left: `${toPos(d, totalDays)}%`,
                  transform: "translateX(-50%)",
                  display: "flex", flexDirection: "column", alignItems: "center",
                }}>
                  <div style={{
                    height: 8, width: 1,
                    background: d % 10 === 0 || d === 1 ? "oklch(100% 0 0 / 0.15)" : "oklch(100% 0 0 / 0.07)",
                  }} />
                  <span style={{
                    fontSize: 8, marginTop: 2, fontVariantNumeric: "tabular-nums",
                    color: d === today && selectedMonth === currentMonth ? "oklch(68% 0.18 272)" : "oklch(100% 0 0 / 0.22)",
                  }}>{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {monthTasks.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "oklch(100% 0 0 / 0.18)" }}>
              <div style={{ fontSize: 40, opacity: 0.2 }}>◈</div>
              <p style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase" }}>// НА ВЫБРАННЫЙ МЕСЯЦ ЗАДАЧ НЕТ</p>
              {(filterPriority || filterPerson || filterStatus) && (
                <p style={{ fontSize: 10, color: "oklch(100% 0 0 / 0.12)" }}>Попробуйте сбросить фильтры</p>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {monthTasks.map((task, idx) => {
                const cfg     = PRIORITY_CFG[task.priority];
                const stMeta  = STATUS_CFG[task.status];
                const catMeta = CATEGORY_META[task.category] ?? { icon: "◆", color: "oklch(60% 0.05 258)" };
                const isDone  = task.status === "done";
                const isSelected = selectedId === task.id;
                const left   = toPos(task.dateFrom, totalDays);
                const width  = toWidth(task.dateFrom, task.dateTo, totalDays);

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedId(isSelected ? null : task.id)}
                    style={{
                      display: "flex", alignItems: "stretch",
                      cursor: "pointer",
                      borderBottom: "1px solid oklch(100% 0 0 / 0.04)",
                      background: isSelected
                        ? "linear-gradient(90deg, oklch(68% 0.18 272 / 0.08), oklch(68% 0.18 272 / 0.03))"
                        : idx % 2 === 0 ? "oklch(100% 0 0 / 0.012)" : "transparent",
                      transition: "background 0.15s ease",
                    }}
                  >
                    {/* Left label column */}
                    <div style={{
                      flexShrink: 0, width: 224,
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px",
                      borderRight: "1px solid oklch(100% 0 0 / 0.06)",
                    }}>
                      {/* Priority stripe */}
                      <div style={{
                        flexShrink: 0, alignSelf: "stretch", width: 2, borderRadius: 2, margin: "4px 0",
                        background: isDone ? "oklch(100% 0 0 / 0.10)" : cfg.color,
                        boxShadow: isDone ? "none" : `0 0 6px ${cfg.glow}`,
                      }} />
                      <span style={{ fontSize: 13, flexShrink: 0 }}>{catMeta.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          lineHeight: 1.3, marginBottom: 3,
                          color: isDone ? "oklch(100% 0 0 / 0.35)" : "oklch(96% 0.008 255)",
                          textDecoration: isDone ? "line-through" : "none",
                        }}>{task.title}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 8, color: "oklch(55% 0.04 258)" }}>{task.responsible}</span>
                          <span style={{
                            fontSize: 8, padding: "1px 5px", borderRadius: 5,
                            background: stMeta.bg, color: stMeta.color, border: `1px solid ${stMeta.border}`,
                          }}>{stMeta.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Gantt bar zone */}
                    <div style={{ position: "relative", flex: 1, margin: "6px 8px 6px 0" }}>
                      {selectedMonth === currentMonth && (
                        <div style={{
                          position: "absolute", top: 0, bottom: 0, width: 1, pointerEvents: "none", zIndex: 10,
                          left: `${toPos(today, totalDays)}%`,
                          background: "oklch(68% 0.18 272 / 0.22)",
                        }} />
                      )}
                      {[7, 14, 21].map(d => d <= totalDays && (
                        <div key={d} style={{
                          position: "absolute", top: 0, bottom: 0, width: 1, pointerEvents: "none",
                          left: `${toPos(d, totalDays)}%`,
                          background: "oklch(100% 0 0 / 0.04)",
                        }} />
                      ))}

                      {/* Bar */}
                      <div style={{
                        position: "absolute", top: 0, bottom: 0, borderRadius: 6,
                        left: `${left}%`, width: `${width}%`,
                        display: "flex", alignItems: "center", overflow: "hidden",
                        transition: "all 0.3s ease",
                        background: isDone
                          ? "oklch(72% 0.17 155 / 0.15)"
                          : `linear-gradient(90deg, ${cfg.color.replace(")", " / 0.25)")}, ${cfg.color.replace(")", " / 0.14)")})`,
                        border: isDone
                          ? "1px solid oklch(72% 0.17 155 / 0.30)"
                          : `1px solid ${cfg.color.replace(")", " / 0.45)")}`,
                        boxShadow: isDone ? "none" : isSelected ? `0 0 14px ${cfg.glow}` : "none",
                      }}>
                        {width > 8 && (
                          <span style={{
                            position: "absolute", left: 6, fontSize: 8, whiteSpace: "nowrap",
                            color: isDone ? "oklch(72% 0.17 155 / 0.7)" : `${cfg.color.replace(")", " / 0.85)")}`,
                            userSelect: "none",
                          }}>
                            {isDone ? "✓" : ""} {task.dateFrom}→{task.dateTo}
                          </span>
                        )}
                      </div>

                      {width <= 8 && (
                        <div style={{
                          position: "absolute", top: "50%", transform: "translateY(-50%)",
                          left: `${left + width + 0.5}%`,
                          fontSize: 8, whiteSpace: "nowrap", color: "oklch(100% 0 0 / 0.25)",
                        }}>
                          {task.dateFrom}–{task.dateTo}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── DETAIL SIDEBAR ── */}
        {selectedTask && (
          <DetailSidebar
            task={selectedTask}
            onClose={() => setSelectedId(null)}
            onToggle={handleToggle}
            isPending={isPending}
          />
        )}
      </div>
    </div>
  );
}

// ── Detail Sidebar ─────────────────────────────────────────────────────

function DetailSidebar({ task, onClose, onToggle, isPending }: {
  task: TimelineTask; onClose: () => void;
  onToggle: (task: TimelineTask) => void; isPending: boolean;
}) {
  const isDone  = task.status === "done";
  const cfg     = PRIORITY_CFG[task.priority];
  const stMeta  = STATUS_CFG[task.status];
  const catMeta = CATEGORY_META[task.category] ?? { icon: "◆", color: "oklch(60% 0.05 258)" };
  const dur     = task.dateTo - task.dateFrom + 1;
  const totalDays = DAYS_IN_MONTH[task.month];

  return (
    <div style={{
      flexShrink: 0, display: "flex", flexDirection: "column", height: "100%",
      width: 300, overflow: "hidden",
      borderLeft: "1px solid oklch(100% 0 0 / 0.09)",
      background: "linear-gradient(180deg, oklch(22% 0.04 266 / 0.98), oklch(18% 0.035 268 / 0.99))",
      boxShadow: "-16px 0 48px oklch(0% 0 0 / 0.4)",
      animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        borderBottom: `1px solid ${cfg.color.replace(")", " / 0.20)")}`,
        background: `linear-gradient(135deg, ${cfg.color.replace(")", " / 0.08)")}, transparent)`,
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          background: `${catMeta.color.replace(")", " / 0.15)")}`,
          border: `1px solid ${catMeta.color.replace(")", " / 0.28)")}`,
        }}>
          {catMeta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: `${cfg.color.replace(")", " / 0.70)")}`, marginBottom: 4 }}>
            // ID #{task.id} · {cfg.label.toUpperCase()}
          </p>
          <p style={{
            fontSize: 12, fontWeight: 700, lineHeight: 1.35,
            color: isDone ? "oklch(100% 0 0 / 0.5)" : "oklch(96% 0.008 255)",
            textDecoration: isDone ? "line-through" : "none",
          }}>
            {task.title}
          </p>
        </div>
        <button onClick={onClose}
          style={{
            width: 26, height: 26, borderRadius: 10, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, lineHeight: 1, cursor: "pointer",
            border: "1px solid oklch(100% 0 0 / 0.10)",
            background: "oklch(100% 0 0 / 0.04)",
            color: "oklch(55% 0.04 258)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.09)"; e.currentTarget.style.color = "oklch(96% 0.008 255)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.04)"; e.currentTarget.style.color = "oklch(55% 0.04 258)"; }}
        >×</button>
      </div>

      {/* Status badge */}
      <div style={{ padding: "12px 16px 8px" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 10, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px",
          background: stMeta.bg, border: `1px solid ${stMeta.border}`, color: stMeta.color,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: stMeta.color, boxShadow: `0 0 5px ${stMeta.color}` }} />
          {stMeta.label}
        </span>
      </div>

      {/* Mini Gantt */}
      <div style={{ padding: "0 16px 12px" }}>
        <p style={{ fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "oklch(100% 0 0 / 0.25)", marginBottom: 8 }}>
          // ПОЗИЦИЯ · {MONTHS[task.month]}
        </p>
        <div style={{
          position: "relative", height: 24, borderRadius: 10, overflow: "hidden",
          background: "oklch(100% 0 0 / 0.05)", border: "1px solid oklch(100% 0 0 / 0.08)",
        }}>
          {[7, 14, 21].map(d => d <= totalDays && (
            <div key={d} style={{
              position: "absolute", top: 0, bottom: 0, width: 1,
              left: `${toPos(d, totalDays)}%`,
              background: "oklch(100% 0 0 / 0.07)",
            }} />
          ))}
          <div style={{
            position: "absolute", top: 4, bottom: 4, borderRadius: 6,
            left: `${toPos(task.dateFrom, totalDays)}%`,
            width: `${toWidth(task.dateFrom, task.dateTo, totalDays)}%`,
            background: isDone ? "oklch(72% 0.17 155 / 0.5)" : `linear-gradient(90deg, ${cfg.color.replace(")", " / 0.65)")}, ${cfg.color.replace(")", " / 0.45)")})`,
            boxShadow: isDone ? "none" : `0 0 8px ${cfg.glow}`,
          }} />
        </div>
      </div>

      <div style={{ height: 1, background: "oklch(100% 0 0 / 0.07)", margin: "0 16px" }} />

      {/* Info grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Timeline */}
        <div style={{
          padding: "16px", borderRadius: 16,
          background: "oklch(68% 0.18 272 / 0.07)",
          border: "1px solid oklch(68% 0.18 272 / 0.15)",
        }}>
          <p style={{ fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "oklch(68% 0.18 272 / 0.5)", marginBottom: 14 }}>
            // СРОКИ ИСПОЛНЕНИЯ
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center" }}>
            {[{ val: task.dateFrom, label: "НАЧ" }, null, { val: task.dateTo, label: "КОН" }].map((item, i) =>
              item === null ? (
                <div key="mid" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 24, height: 1, background: "oklch(68% 0.18 272 / 0.4)" }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: "oklch(72% 0.12 272)" }}>
                    {dur} {dur === 1 ? "дн" : dur < 5 ? "дня" : "дней"}
                  </span>
                  <div style={{ width: 24, height: 1, background: "oklch(68% 0.18 272 / 0.4)" }} />
                </div>
              ) : (
                <div key={i} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 8, color: "oklch(100% 0 0 / 0.3)", marginBottom: 4 }}>{item.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: "oklch(80% 0.12 272)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{item.val}</p>
                  <p style={{ fontSize: 8, color: "oklch(55% 0.04 258)", marginTop: 2 }}>{MONTHS[task.month]}</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Detail grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "КАТЕГОРИЯ",   value: `${catMeta.icon} ${task.category}`, color: catMeta.color      },
            { label: "ОТВЕТСТВ.",   value: task.responsible,                   color: "oklch(88% 0.08 272)" },
            { label: "ПРИОРИТЕТ",  value: cfg.label,                          color: cfg.color           },
            { label: "ОХВАТ МЕС.", value: `${Math.round(toWidth(task.dateFrom, task.dateTo, totalDays))}%`, color: "oklch(100% 0 0 / 0.55)" },
          ].map(row => (
            <div key={row.label} style={{
              padding: "10px 12px", borderRadius: 12,
              background: "oklch(100% 0 0 / 0.03)",
              border: "1px solid oklch(100% 0 0 / 0.08)",
            }}>
              <p style={{ fontSize: 7, letterSpacing: "1.5px", textTransform: "uppercase", color: "oklch(100% 0 0 / 0.25)", marginBottom: 5 }}>{row.label}</p>
              <p style={{ fontSize: 11, fontWeight: 600, color: row.color }}>{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer action */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid oklch(100% 0 0 / 0.08)" }}>
        <button
          onClick={() => onToggle(task)}
          disabled={isPending}
          style={{
            width: "100%", padding: "10px", borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
            cursor: isPending ? "wait" : "pointer",
            transition: "all 0.18s ease",
            opacity: isPending ? 0.4 : 1,
            ...(isDone ? {
              background: "oklch(75% 0.18 75 / 0.10)",
              border: "1px solid oklch(75% 0.18 75 / 0.35)",
              color: "oklch(75% 0.18 75)",
            } : {
              background: `${cfg.color.replace(")", " / 0.14)")}`,
              border: `1px solid ${cfg.color.replace(")", " / 0.45)")}`,
              color: cfg.color,
              boxShadow: `0 4px 20px ${cfg.glow}`,
            }),
          }}
          onMouseEnter={e => { if (!isPending) e.currentTarget.style.opacity = "0.8"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {isPending ? <span style={{ animation: "pulseGlow 0.8s ease-in-out infinite" }}>···</span>
            : isDone ? <><span>↺</span> Переоткрыть</>
            : <><span style={{ fontSize: 14 }}>✓</span> Выполнена</>
          }
        </button>
      </div>
    </div>
  );
}