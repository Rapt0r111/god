"use client";

import { completeTask, reopenTask, getTimelineTasks } from "@/actions/tasks";
import { useEffect, useMemo, useState, useTransition, useCallback } from "react";

type Priority = "critical" | "high" | "normal";
type Status = "pending" | "in_progress" | "done" | "cancelled";

type TimelineTask = {
  id: number;
  title: string;
  category: string;
  month: number;
  dateFrom: number;
  dateTo: number;
  responsible: string;
  status: Status;
  priority: Priority;
};

// ── Constants ─────────────────────────────────────────────────────────

const MONTHS      = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"] as const;
const MONTHS_FULL = ["","Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"] as const;
const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const ALLOWED_PERSONNEL = ["КВ-1","КВ-2","СР","КНР","ЗКВ-1","ЗКВ-2","КО-2"] as const;

const PRIORITY_CONFIG: Record<Priority, { color: string; glow: string; label: string; abbr: string }> = {
  critical: { color: "#ef4444", glow: "rgba(239,68,68,0.45)", label: "Критический", abbr: "КРТ" },
  high:     { color: "#f59e0b", glow: "rgba(245,158,11,0.4)",  label: "Высокий",    abbr: "ВЫС" },
  normal:   { color: "#3b82f6", glow: "rgba(59,130,246,0.35)", label: "Нормальный", abbr: "НОР" },
};

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  pending:     { label: "ОЖИДАЕТ",   color: "#7d9ab5", bg: "rgba(125,154,181,0.1)",  border: "rgba(125,154,181,0.3)"  },
  in_progress: { label: "В РАБОТЕ",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.3)"   },
  done:        { label: "ВЫПОЛНЕНО", color: "#10b981", bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.3)"   },
  cancelled:   { label: "ОТМЕНЕНО",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.3)"    },
};

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  "Н":   { icon: "⚗",  color: "#10b981" },
  "А":   { icon: "📡", color: "#3b82f6" },
  "БП":  { icon: "🎯", color: "#ef4444" },
  "ПД":  { icon: "⚙",  color: "#f59e0b" },
  "ВПР": { icon: "🎖", color: "#a78bfa" },
  "У":   { icon: "🏁", color: "#f97316" },
  "П":   { icon: "🔰", color: "#06b6d4" },
  "ЗиТ": { icon: "💻", color: "#94a3b8" },
  "ЕМ":  { icon: "📋", color: "#fbbf24" },
  "НД":  { icon: "🔬", color: "#10b981" },
  "МГ":  { icon: "⚡", color: "#ef4444" },
};

// ── Helpers ───────────────────────────────────────────────────────────

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
  const [filterPerson,   setFilterPerson  ] = useState<string>("");
  const [filterStatus,   setFilterStatus  ] = useState<Status | "">("");
  const [loading,        setLoading       ] = useState(true);
  const [isPending,      startTransition  ] = useTransition();

  // Load
  const loadTasks = useCallback(async () => {
    const rows = await getTimelineTasks();
    const normalized: TimelineTask[] = rows
      .filter(t => ALLOWED_PERSONNEL.includes(t.responsible as typeof ALLOWED_PERSONNEL[number]))
      .map(t => ({
        id:          t.id,
        title:       t.title,
        category:    t.category,
        month:       t.month,
        dateFrom:    t.dateFrom,
        dateTo:      t.dateTo,
        responsible: t.responsible,
        status:      t.status as Status,
        priority:    t.priority === "normal" ? "normal" : t.priority as Priority,
      }));
    setTasks(normalized);
    setLoading(false);
  }, []);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  // Filter
  const monthTasks = useMemo(() => {
    let list = tasks.filter(t => t.month === selectedMonth);
    if (filterPriority) list = list.filter(t => t.priority === filterPriority);
    if (filterPerson)   list = list.filter(t => t.responsible === filterPerson);
    if (filterStatus)   list = list.filter(t => t.status === filterStatus);
    return list.sort((a, b) => a.dateFrom - b.dateFrom || a.priority.localeCompare(b.priority));
  }, [tasks, selectedMonth, filterPriority, filterPerson, filterStatus]);

  const selectedTask = tasks.find(t => t.id === selectedId) ?? null;
  const totalDays    = DAYS_IN_MONTH[selectedMonth];
  const doneCount    = monthTasks.filter(t => t.status === "done").length;
  const critCount    = monthTasks.filter(t => t.priority === "critical" && t.status !== "done").length;

  // Toggle done
  const handleToggle = (task: TimelineTask) => {
    const isDone = task.status === "done";
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: isDone ? "pending" : "done" } : t));
    startTransition(async () => {
      if (isDone) await reopenTask(task.id);
      else await completeTask(task.id);
      await loadTasks();
    });
  };

  // Day ticks
  const dayTicks = useMemo(() => Array.from({ length: totalDays }, (_, i) => i + 1), [totalDays]);

  // Persons in this month
  const monthPersons = useMemo(() => {
    const set = new Set(tasks.filter(t => t.month === selectedMonth).map(t => t.responsible));
    return ALLOWED_PERSONNEL.filter(p => set.has(p));
  }, [tasks, selectedMonth]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="text-[11px] font-mono tracking-[3px] animate-pulse" style={{ color: "rgba(59,130,246,0.7)" }}>
            // ЗАГРУЗКА ОПЕРАТИВНЫХ ДАННЫХ...
          </div>
          <div className="flex gap-1">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="h-0.5 w-8 rounded-full animate-pulse"
                style={{ background: "rgba(59,130,246,0.4)", animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-0 overflow-hidden" style={{ fontFamily: "'Courier New', monospace" }}>

      {/* ── TOP HEADER ── */}
      <div className="shrink-0 px-5 pt-4 pb-3 flex items-start justify-between gap-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3b82f6", boxShadow: "0 0 6px #3b82f6" }} />
            <span className="text-[9px] tracking-[3px] uppercase" style={{ color: "rgba(59,130,246,0.7)" }}>
              ОПЕРАТИВНЫЙ КАЛЕНДАРЬ · ЦСУ ПД · НР ВАС
            </span>
          </div>
          <h2 className="text-[20px] font-bold tracking-wide" style={{ color: "#e8f0fe", letterSpacing: "0.06em" }}>
            {MONTHS_FULL[selectedMonth]} <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>{" "}
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 400 }}>
              {monthTasks.length} задач
            </span>
          </h2>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 shrink-0">
          {[
            { label: "ВСЕГО", value: monthTasks.length, color: "#93c5fd" },
            { label: "ВЫПОЛ", value: doneCount, color: "#10b981" },
            { label: "КРИТ",  value: critCount, color: critCount > 0 ? "#ef4444" : "rgba(255,255,255,0.2)" },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", minWidth: 48 }}>
              <span className="text-[18px] font-bold tabular-nums" style={{ color: s.color, lineHeight: 1.1 }}>{s.value}</span>
              <span className="text-[8px] tracking-[1.5px]" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MONTH SELECTOR ── */}
      <div className="shrink-0 px-5 py-2.5 flex items-center gap-1.5 flex-wrap"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {MONTHS.slice(1).map((m, i) => {
          const month  = i + 1;
          const count  = tasks.filter(t => t.month === month).length;
          const done   = tasks.filter(t => t.month === month && t.status === "done").length;
          const active = month === selectedMonth;
          const isCur  = month === currentMonth;
          const pct    = count > 0 ? Math.round((done / count) * 100) : 0;

          return (
            <button key={month} onClick={() => { setSelectedMonth(month); setSelectedId(null); }}
              className="relative flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all duration-200"
              style={{
                background: active ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.03)",
                border: active ? "1px solid rgba(59,130,246,0.5)" : isCur ? "1px solid rgba(59,130,246,0.25)" : "1px solid rgba(255,255,255,0.07)",
                boxShadow: active ? "0 4px 16px rgba(59,130,246,0.2)" : "none",
                minWidth: 44,
              }}>
              <span className="text-[10px] font-mono font-semibold tracking-wider"
                style={{ color: active ? "#93c5fd" : count > 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)" }}>
                {m}
              </span>
              {count > 0 && (
                <>
                  <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "rgba(59,130,246,0.7)" }} />
                  </div>
                  <span className="text-[8px] tabular-nums" style={{ color: "rgba(255,255,255,0.25)" }}>{count}</span>
                </>
              )}
              {isCur && !active && (
                <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full" style={{ background: "#3b82f6" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── FILTERS ── */}
      <div className="shrink-0 px-5 py-2 flex items-center gap-2 flex-wrap"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="text-[8px] tracking-[2px]" style={{ color: "rgba(255,255,255,0.2)" }}>ФИЛЬТР:</span>

        {/* Priority filter */}
        {(["critical","high","normal"] as Priority[]).map(p => {
          const cfg = PRIORITY_CONFIG[p];
          const active = filterPriority === p;
          return (
            <button key={p} onClick={() => setFilterPriority(active ? "" : p)}
              className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wide transition-all"
              style={active ? {
                background: `${cfg.color}20`,
                border: `1px solid ${cfg.color}60`,
                color: cfg.color,
              } : {
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.3)",
              }}>
              {cfg.abbr}
            </button>
          );
        })}

        <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.1)" }} />

        {/* Person filter */}
        {monthPersons.map(p => {
          const active = filterPerson === p;
          return (
            <button key={p} onClick={() => setFilterPerson(active ? "" : p)}
              className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wide transition-all"
              style={active ? {
                background: "rgba(59,130,246,0.2)",
                border: "1px solid rgba(59,130,246,0.5)",
                color: "#93c5fd",
              } : {
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.3)",
              }}>
              {p}
            </button>
          );
        })}

        <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.1)" }} />

        {/* Status filter */}
        {(["pending","in_progress","done"] as Status[]).map(s => {
          const cfg = STATUS_CONFIG[s];
          const active = filterStatus === s;
          return (
            <button key={s} onClick={() => setFilterStatus(active ? "" : s)}
              className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wide transition-all"
              style={active ? {
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                color: cfg.color,
              } : {
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.3)",
              }}>
              {cfg.label}
            </button>
          );
        })}

        {(filterPriority || filterPerson || filterStatus) && (
          <button onClick={() => { setFilterPriority(""); setFilterPerson(""); setFilterStatus(""); }}
            className="ml-1 px-2 py-0.5 rounded text-[9px] font-mono transition-all"
            style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "rgba(239,68,68,0.7)" }}>
            × сброс
          </button>
        )}
      </div>

      {/* ── MAIN: GANTT + SIDEBAR ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── GANTT ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Day ruler */}
          <div className="shrink-0 relative flex" style={{
            height: 28,
            paddingLeft: 220,
            paddingRight: selectedId ? 0 : 0,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div className="relative flex-1">
              {/* Today line in ruler */}
              {selectedMonth === currentMonth && (
                <div className="absolute top-0 bottom-0 w-px z-10"
                  style={{ left: `${toPos(today, totalDays)}%`, background: "rgba(59,130,246,0.6)" }} />
              )}
              {/* Day labels — every 5 days */}
              {dayTicks.filter(d => d === 1 || d % 5 === 0).map(d => (
                <div key={d} className="absolute top-0 flex flex-col items-center"
                  style={{ left: `${toPos(d, totalDays)}%`, transform: "translateX(-50%)" }}>
                  <div className="h-2" style={{ width: 1, background: d % 10 === 0 || d === 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)" }} />
                  <span className="text-[8px] tabular-nums mt-0.5"
                    style={{ color: d === today && selectedMonth === currentMonth ? "#60a5fa" : "rgba(255,255,255,0.2)" }}>
                    {d}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {monthTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: "rgba(255,255,255,0.15)" }}>
              <div className="text-[36px] opacity-20">◈</div>
              <p className="text-[11px] font-mono tracking-[2px]">// НА ВЫБРАННЫЙ МЕСЯЦ ЗАДАЧ НЕТ</p>
              {(filterPriority || filterPerson || filterStatus) && (
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.1)" }}>Попробуйте сбросить фильтры</p>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {monthTasks.map((task, idx) => {
                const cfg     = PRIORITY_CONFIG[task.priority];
                const stMeta  = STATUS_CONFIG[task.status];
                const catMeta = CATEGORY_META[task.category] ?? { icon: "◆", color: "#6b8ba8" };
                const isDone  = task.status === "done";
                const isSelected = selectedId === task.id;
                const left   = toPos(task.dateFrom, totalDays);
                const width  = toWidth(task.dateFrom, task.dateTo, totalDays);
                const dur    = task.dateTo - task.dateFrom + 1;

                return (
                  <div key={task.id}
                    className="flex items-stretch group cursor-pointer transition-all duration-150"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: isSelected
                        ? "linear-gradient(90deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))"
                        : idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                    }}
                    onClick={() => setSelectedId(isSelected ? null : task.id)}
                  >
                    {/* Left label column */}
                    <div className="shrink-0 flex items-center gap-2.5 px-3 py-2.5"
                      style={{ width: 220, borderRight: "1px solid rgba(255,255,255,0.05)" }}>

                      {/* Priority stripe */}
                      <div className="shrink-0 self-stretch w-0.5 rounded-full my-1"
                        style={{ background: isDone ? "rgba(255,255,255,0.1)" : cfg.color, boxShadow: isDone ? "none" : `0 0 6px ${cfg.glow}` }} />

                      {/* Category icon */}
                      <span className="text-[12px] shrink-0">{catMeta.icon}</span>

                      {/* Title + meta */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold truncate leading-tight"
                          style={{
                            color: isDone ? "rgba(255,255,255,0.35)" : "#e8f0fe",
                            textDecoration: isDone ? "line-through" : "none",
                          }}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{task.responsible}</span>
                          <span className="text-[8px] font-mono px-1 rounded"
                            style={{ background: stMeta.bg, color: stMeta.color, border: `1px solid ${stMeta.border}` }}>
                            {stMeta.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Gantt bar zone */}
                    <div className="relative flex-1 my-1.5 mr-2">
                      {/* Today line */}
                      {selectedMonth === currentMonth && (
                        <div className="absolute top-0 bottom-0 w-px pointer-events-none z-10"
                          style={{ left: `${toPos(today, totalDays)}%`, background: "rgba(59,130,246,0.25)" }} />
                      )}

                      {/* Grid lines every 7 days */}
                      {[7, 14, 21].map(d => d <= totalDays && (
                        <div key={d} className="absolute top-0 bottom-0 w-px pointer-events-none"
                          style={{ left: `${toPos(d, totalDays)}%`, background: "rgba(255,255,255,0.04)" }} />
                      ))}

                      {/* The bar */}
                      <div
                        className="absolute top-0 bottom-0 rounded flex items-center overflow-hidden transition-all duration-300"
                        style={{
                          left:   `${left}%`,
                          width:  `${width}%`,
                          background: isDone
                            ? "rgba(16,185,129,0.15)"
                            : `linear-gradient(90deg, ${cfg.color}28, ${cfg.color}16)`,
                          border: isDone
                            ? "1px solid rgba(16,185,129,0.3)"
                            : `1px solid ${cfg.color}50`,
                          boxShadow: isDone ? "none" : isSelected ? `0 0 12px ${cfg.glow}` : "none",
                        }}
                      >
                        {/* Shimmer fill for done */}
                        {isDone && (
                          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))" }} />
                        )}

                        {/* Duration label inside bar */}
                        {width > 8 && (
                          <span className="absolute left-1.5 text-[8px] font-mono tabular-nums select-none whitespace-nowrap"
                            style={{ color: isDone ? "rgba(16,185,129,0.7)" : `${cfg.color}CC` }}>
                            {isDone ? "✓" : ""} {task.dateFrom}→{task.dateTo}
                          </span>
                        )}
                      </div>

                      {/* Date labels outside bar if too narrow */}
                      {width <= 8 && (
                        <div className="absolute top-1/2 -translate-y-1/2 text-[8px] font-mono whitespace-nowrap"
                          style={{ left: `${left + width + 0.5}%`, color: "rgba(255,255,255,0.25)" }}>
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

// ── Detail Sidebar ────────────────────────────────────────────────────

function DetailSidebar({
  task,
  onClose,
  onToggle,
  isPending,
}: {
  task: TimelineTask;
  onClose: () => void;
  onToggle: (task: TimelineTask) => void;
  isPending: boolean;
}) {
  const isDone  = task.status === "done";
  const cfg     = PRIORITY_CONFIG[task.priority];
  const stMeta  = STATUS_CONFIG[task.status];
  const catMeta = CATEGORY_META[task.category] ?? { icon: "◆", color: "#6b8ba8" };
  const dur     = task.dateTo - task.dateFrom + 1;
  const totalDays = DAYS_IN_MONTH[task.month];
  const pct     = Math.round((toWidth(task.dateFrom, task.dateTo, totalDays)));

  return (
    <div
      className="shrink-0 flex flex-col h-full overflow-hidden"
      style={{
        width: 300,
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(180deg, rgba(13,22,40,0.98), rgba(7,13,26,0.97))",
        boxShadow: "-12px 0 40px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-2"
        style={{ borderBottom: `1px solid ${cfg.color}25`, background: `linear-gradient(135deg, ${cfg.color}08, transparent)` }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[16px] shrink-0"
            style={{ background: `${catMeta.color}15`, border: `1px solid ${catMeta.color}30` }}>
            {catMeta.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-mono tracking-[2px] mb-0.5" style={{ color: `${cfg.color}90` }}>
              // ID #{task.id} · {cfg.label.toUpperCase()}
            </p>
            <p className="text-[12px] font-bold leading-tight" style={{ color: isDone ? "rgba(255,255,255,0.5)" : "#f0f6ff", textDecoration: isDone ? "line-through" : "none" }}>
              {task.title}
            </p>
          </div>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 text-[16px] transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
          ×
        </button>
      </div>

      {/* Status badge */}
      <div className="px-4 pt-3 pb-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold tracking-wider"
          style={{ background: stMeta.bg, border: `1px solid ${stMeta.border}`, color: stMeta.color }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: stMeta.color, boxShadow: `0 0 4px ${stMeta.color}` }} />
          {stMeta.label}
        </span>
      </div>

      {/* Gantt mini-map */}
      <div className="px-4 pb-3">
        <p className="text-[8px] font-mono tracking-[2px] mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>
          // ПОЗИЦИЯ В МЕСЯЦЕ · {MONTHS[task.month]}
        </p>
        <div className="relative h-6 rounded-lg overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Day markers */}
          {[7, 14, 21].map(d => d <= totalDays && (
            <div key={d} className="absolute top-0 bottom-0 w-px"
              style={{ left: `${toPos(d, totalDays)}%`, background: "rgba(255,255,255,0.06)" }} />
          ))}
          {/* Bar */}
          <div className="absolute top-1 bottom-1 rounded"
            style={{
              left:   `${toPos(task.dateFrom, totalDays)}%`,
              width:  `${toWidth(task.dateFrom, task.dateTo, totalDays)}%`,
              background: isDone ? "rgba(16,185,129,0.5)" : `linear-gradient(90deg, ${cfg.color}70, ${cfg.color}45)`,
              boxShadow: isDone ? "none" : `0 0 8px ${cfg.glow}`,
            }} />
        </div>
        {/* Day markers labels */}
        <div className="relative mt-0.5" style={{ height: 10 }}>
          {[1, 7, 14, 21, totalDays].map(d => (
            <span key={d} className="absolute text-[7px] font-mono tabular-nums"
              style={{ left: `${toPos(d, totalDays)}%`, transform: "translateX(-50%)", color: "rgba(255,255,255,0.15)" }}>
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px" }} />

      {/* Info grid */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">

        {[
          {
            label: "СРОКИ ИСПОЛНЕНИЯ",
            content: (
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <p className="text-[22px] font-bold tabular-nums" style={{ color: "#93c5fd", lineHeight: 1 }}>{task.dateFrom}</p>
                  <p className="text-[8px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{MONTHS[task.month]}</p>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="h-px w-6" style={{ background: "rgba(59,130,246,0.4)" }} />
                  <span className="text-[9px] font-mono font-semibold" style={{ color: "#60a5fa" }}>
                    {dur} {dur === 1 ? "дн" : dur < 5 ? "дня" : "дней"}
                  </span>
                  <div className="h-px w-6" style={{ background: "rgba(59,130,246,0.4)" }} />
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[22px] font-bold tabular-nums" style={{ color: "#93c5fd", lineHeight: 1 }}>{task.dateTo}</p>
                  <p className="text-[8px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{MONTHS[task.month]}</p>
                </div>
              </div>
            ),
          },
        ].map(block => (
          <div key={block.label} className="rounded-xl p-3"
            style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.07), rgba(59,130,246,0.03))", border: "1px solid rgba(59,130,246,0.15)" }}>
            <p className="text-[8px] font-mono tracking-[2px] mb-2" style={{ color: "rgba(59,130,246,0.5)" }}>// {block.label}</p>
            {block.content}
          </div>
        ))}

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "КАТЕГОРИЯ",    value: `${catMeta.icon} ${task.category}`, color: catMeta.color },
            { label: "ОТВЕТСТВ.",    value: task.responsible,                   color: "#93c5fd"     },
            { label: "ПРИОРИТЕТ",   value: cfg.label,                          color: cfg.color     },
            { label: "ОХВАТ",       value: `${pct.toFixed(0)}% мес.`,          color: "rgba(255,255,255,0.5)" },
          ].map(row => (
            <div key={row.label} className="rounded-lg p-2.5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[7px] font-mono tracking-[1.5px] mb-1" style={{ color: "rgba(255,255,255,0.22)" }}>{row.label}</p>
              <p className="text-[11px] font-semibold font-mono" style={{ color: row.color }}>{row.value}</p>
            </div>
          ))}
        </div>

        {/* Priority indicator */}
        <div className="rounded-xl p-3"
          style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}25` }}>
          <p className="text-[8px] font-mono tracking-[2px] mb-2" style={{ color: `${cfg.color}70` }}>// ИНДИКАТОР ПРИОРИТЕТА</p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {["critical","high","normal"].map((p, i) => (
                <div key={p} className="h-3 rounded-sm transition-all"
                  style={{
                    width: task.priority === "critical" ? (i === 0 ? 28 : i === 1 ? 18 : 10) :
                           task.priority === "high"     ? (i === 0 ? 10 : i === 1 ? 28 : 18) :
                                                          (i === 0 ? 10 : i === 1 ? 10 : 28),
                    background: task.priority === p ? cfg.color :
                                (task.priority === "critical" && p === "high") || task.priority === "normal" ? `${cfg.color}20` : `rgba(255,255,255,0.06)`,
                    boxShadow: task.priority === p ? `0 0 6px ${cfg.glow}` : "none",
                  }} />
              ))}
            </div>
            <span className="text-[10px] font-mono font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
        </div>
      </div>

      {/* Footer action */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button
          onClick={() => onToggle(task)}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-mono font-semibold tracking-wider transition-all disabled:opacity-40"
          style={isDone ? {
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.4)",
            color: "#fbbf24",
          } : {
            background: `${cfg.color}15`,
            border: `1px solid ${cfg.color}50`,
            color: cfg.color,
            boxShadow: `0 4px 16px ${cfg.glow}`,
          }}
          onMouseEnter={e => { if (!isPending) e.currentTarget.style.opacity = "0.8"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {isPending ? (
            <span className="animate-pulse">···</span>
          ) : isDone ? (
            <><span>↺</span> Переоткрыть задачу</>
          ) : (
            <><span style={{ fontSize: 14 }}>✓</span> Отметить выполненной</>
          )}
        </button>
      </div>
    </div>
  );
}