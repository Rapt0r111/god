// src/app/timeline/page.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from "react";

// ── Типы ──────────────────────────────────────────────────────────────

type Priority = "critical" | "high" | "medium" | "low";
type Status   = "pending" | "in-progress" | "done" | "overdue";

interface Task {
  id:          string;
  title:       string;
  category:    string;
  month:       number;
  dateFrom:    number;
  dateTo:      number;
  responsible: string;
  status:      Status;
  priority:    Priority;
  note?:       string;
}

// ── Константы ──────────────────────────────────────────────────────────

const MONTHS_RU  = ["","Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const MONTHS_SHT = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];
const DAYS_IN_MONTH = [0,31,28,31,30,31,30,31,31,30,31,30,31];

const PRIORITY_META: Record<Priority, { color: string; glow: string; label: string; bg: string }> = {
  critical: { color: "#ef4444", glow: "rgba(239,68,68,0.3)",   label: "КРИТ",  bg: "rgba(239,68,68,0.08)"   },
  high:     { color: "#f59e0b", glow: "rgba(245,158,11,0.25)", label: "ВЫСОК", bg: "rgba(245,158,11,0.06)"  },
  medium:   { color: "#3b82f6", glow: "rgba(59,130,246,0.2)",  label: "СРЕДН", bg: "rgba(59,130,246,0.06)"  },
  low:      { color: "#64748b", glow: "rgba(100,116,139,0.15)",label: "НИЗ",   bg: "rgba(100,116,139,0.04)" },
};

const STATUS_META: Record<Status, { color: string; label: string; bg: string }> = {
  pending:      { color: "#7d9ab5", label: "ОЖИДАЕТ",   bg: "rgba(125,154,181,0.08)" },
  "in-progress":{ color: "#f59e0b", label: "В РАБОТЕ",  bg: "rgba(245,158,11,0.08)"  },
  done:         { color: "#10b981", label: "ВЫПОЛНЕНО", bg: "rgba(16,185,129,0.08)"  },
  overdue:      { color: "#ef4444", label: "ПРОСРОЧЕНО",bg: "rgba(239,68,68,0.08)"   },
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

const MOCK_TASKS: Task[] = [
  { id:"1",  title:"Отчёт о НИР по направлению А2",          category:"Н",  month:2,  dateFrom:1,  dateTo:10, responsible:"КВ-2",  status:"in-progress", priority:"critical" },
  { id:"2",  title:"Проверка САВЗ личного состава",           category:"БП", month:2,  dateFrom:3,  dateTo:3,  responsible:"ЗКВ-2", status:"pending",     priority:"high"     },
  { id:"3",  title:"Подготовка агитационных материалов",      category:"А",  month:2,  dateFrom:5,  dateTo:14, responsible:"КВ-2",  status:"pending",     priority:"medium"   },
  { id:"4",  title:"Рапорт о боевой готовности",              category:"ПД", month:2,  dateFrom:7,  dateTo:7,  responsible:"ЗКВ-2", status:"done",        priority:"high"     },
  { id:"5",  title:"Научная конференция — подача тезисов",    category:"Н",  month:3,  dateFrom:1,  dateTo:28, responsible:"КВ-2",  status:"pending",     priority:"critical" },
  { id:"6",  title:"Строевой смотр",                          category:"БП", month:2,  dateFrom:10, dateTo:10, responsible:"ПС",    status:"overdue",     priority:"critical" },
  { id:"7",  title:"Медицинское освидетельствование призыва", category:"П",  month:3,  dateFrom:15, dateTo:20, responsible:"ЗКВ-2", status:"pending",     priority:"medium"   },
  { id:"8",  title:"Обновление служебных карточек",           category:"ПД", month:2,  dateFrom:20, dateTo:25, responsible:"ЗКВ-2", status:"in-progress", priority:"low"      },
  { id:"9",  title:"Оформление увольнительных записок",       category:"У",  month:2,  dateFrom:15, dateTo:16, responsible:"КВ-2",  status:"done",        priority:"low"      },
  { id:"10", title:"Ежемесячный доклад командиру",            category:"ЕМ", month:2,  dateFrom:28, dateTo:28, responsible:"КВ-2",  status:"pending",     priority:"high"     },
  { id:"11", title:"Подведение итогов периода обучения",      category:"ПД", month:4,  dateFrom:25, dateTo:30, responsible:"КВ-2",  status:"pending",     priority:"critical" },
  { id:"12", title:"Оценка уровня физподготовки",             category:"БП", month:3,  dateFrom:5,  dateTo:6,  responsible:"ЗКВ-2", status:"pending",     priority:"high"     },
  { id:"13", title:"Сверка личных планов л/с",                category:"ПД", month:3,  dateFrom:28, dateTo:28, responsible:"ЗКВ-2", status:"pending",     priority:"medium"   },
  { id:"14", title:"Приказ №85дсп — контрольное мероприятие", category:"ЕМ", month:4,  dateFrom:10, dateTo:10, responsible:"ЗКВ-2", status:"pending",     priority:"high"     },
  { id:"15", title:"НИР — промежуточный отчёт",               category:"НД", month:5,  dateFrom:15, dateTo:25, responsible:"КВ-2",  status:"pending",     priority:"critical" },
];

// ── Компонент ──────────────────────────────────────────────────────────

export default function TimelinePage() {
  const currentMonth = new Date().getMonth() + 1;
  const currentDay   = new Date().getDate();

  const [selectedMonth,   setSelectedMonth  ] = useState(currentMonth);
  const [selectedTask,    setSelectedTask   ] = useState<Task | null>(null);
  const [filterStatus,    setFilterStatus   ] = useState<Status | "all">("all");
  const [filterPriority,  setFilterPriority ] = useState<Priority | "all">("all");

  const todayLineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    todayLineRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedMonth]);

  const daysInMonth = DAYS_IN_MONTH[selectedMonth];

  const monthTasks = useMemo(() => {
    let list = MOCK_TASKS.filter(t => t.month === selectedMonth);
    if (filterStatus   !== "all") list = list.filter(t => t.status   === filterStatus);
    if (filterPriority !== "all") list = list.filter(t => t.priority === filterPriority);
    return list;
  }, [selectedMonth, filterStatus, filterPriority]);

  const taskList = useMemo(() =>
    [...monthTasks].sort((a, b) => a.dateFrom - b.dateFrom)
  , [monthTasks]);

  const stats = useMemo(() => ({
    total:    monthTasks.length,
    critical: monthTasks.filter(t => t.priority === "critical").length,
    done:     monthTasks.filter(t => t.status   === "done").length,
    busy:     new Set(monthTasks.flatMap(t =>
      Array.from({ length: t.dateTo - t.dateFrom + 1 }, (_, i) => t.dateFrom + i)
    )).size,
  }), [monthTasks]);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── HEADER ── */}
      <div
        className="px-5 pt-4 pb-3 flex items-center gap-4 flex-wrap"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Месяц-навигатор */}
        <div className="flex gap-1 flex-wrap">
          {MONTHS_SHT.slice(1).map((m, i) => {
            const month   = i + 1;
            const hasTask = MOCK_TASKS.some(t => t.month === month);
            const hasCrit = MOCK_TASKS.some(t => t.month === month && t.priority === "critical");
            const isActive= selectedMonth === month;
            const isCur   = month === currentMonth;

            return (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className="relative px-2.5 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-150"
                style={isActive ? {
                  background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.12))",
                  border: "1px solid rgba(59,130,246,0.35)",
                  color: "#93c5fd",
                  boxShadow: "0 2px 8px rgba(59,130,246,0.15)",
                } : isCur ? {
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  color: "rgba(245,158,11,0.8)",
                } : {
                  border: "1px solid transparent",
                  color: hasTask ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.15)",
                }}
              >
                {m}
                {hasCrit && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: "#ef4444", boxShadow: "0 0 4px #ef4444" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Фильтры */}
        <div className="flex gap-2 ml-auto items-center">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as Status | "all")}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono outline-none cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            <option value="all">Все статусы</option>
            {(Object.keys(STATUS_META) as Status[]).map(s =>
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            )}
          </select>

          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as Priority | "all")}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono outline-none cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            <option value="all">Все приоритеты</option>
            {(Object.keys(PRIORITY_META) as Priority[]).map(p =>
              <option key={p} value={p}>{PRIORITY_META[p].label}</option>
            )}
          </select>
        </div>

        {/* Мини-статистика */}
        <div className="flex gap-3 text-[10px] font-mono">
          <span style={{ color: "#93c5fd" }}>{stats.total} задач</span>
          <span style={{ color: "#fca5a5" }}>{stats.critical} крит.</span>
          <span style={{ color: "#6ee7b7" }}>{stats.done} вып.</span>
          <span style={{ color: "#fcd34d" }}>{stats.busy} дн.</span>
        </div>
      </div>

      {/* ── BODY: gantt + sidebar ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── GANTT ── */}
        <div className="flex-1 overflow-auto p-5">

          {/* Заголовок */}
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-[14px] font-semibold tracking-wide"
              style={{ color: "#e8f0fe" }}
            >
              {MONTHS_RU[selectedMonth]}
              <span
                className="ml-2 text-[10px] font-mono font-normal"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                // Диаграмма Ганта
              </span>
            </h2>
          </div>

          {/* Шкала дней */}
          <div
            className="flex mb-1 ml-7"
            style={{ minWidth: `${daysInMonth * 22}px` }}
          >
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
              const isToday = d === currentDay && selectedMonth === currentMonth;
              const is5     = d % 5 === 0;
              return (
                <div
                  key={d}
                  className="flex-1 text-center"
                  style={{ minWidth: 22 }}
                >
                  <span
                    className="text-[9px] font-mono tabular-nums"
                    style={{
                      color: isToday
                        ? "#fbbf24"
                        : is5
                          ? "rgba(255,255,255,0.35)"
                          : "rgba(255,255,255,0.12)",
                      fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    {d}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Пустое состояние */}
          {taskList.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-20"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              <div className="text-4xl mb-4 opacity-30">◫</div>
              <p className="text-[12px] font-mono tracking-wider">// НА ЭТОТ МЕСЯЦ ЗАДАЧ НЕТ</p>
            </div>
          )}

          {/* Строки задач */}
          <div className="space-y-1.5" style={{ minWidth: `${daysInMonth * 22 + 28}px` }}>
            {taskList.map((task, idx) => {
              const pr    = PRIORITY_META[task.priority];
              const st    = STATUS_META[task.status];
              const cat   = CATEGORY_META[task.category] ?? { icon: "•", color: "#64748b" };
              const isDone= task.status === "done";

              const leftPct  = ((task.dateFrom - 1) / daysInMonth) * 100;
              const widthPct = ((task.dateTo - task.dateFrom + 1) / daysInMonth) * 100;
              const isSelected = selectedTask?.id === task.id;

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => setSelectedTask(isSelected ? null : task)}
                >
                  {/* Иконка категории */}
                  <div
                    className="w-6 min-w-6 text-center text-[12px]"
                    style={{ opacity: 0.7 }}
                    title={task.category}
                  >
                    {cat.icon}
                  </div>

                  {/* Полоса Ганта */}
                  <div className="flex-1 relative" style={{ height: 30 }}>
                    {/* Сетка */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {Array.from({ length: daysInMonth }, (_, i) => (
                        <div
                          key={i}
                          className="flex-1"
                          style={{
                            borderRight: "1px solid rgba(255,255,255,0.04)",
                            background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                          }}
                        />
                      ))}
                    </div>

                    {/* Линия сегодня */}
                    {selectedMonth === currentMonth && (
                      <div
                        className="absolute top-0 bottom-0 z-20 pointer-events-none"
                        style={{
                          left:     `${((currentDay - 0.5) / daysInMonth) * 100}%`,
                          width:    1,
                          background: "linear-gradient(180deg, #fbbf24, rgba(251,191,36,0.3))",
                          boxShadow: "0 0 6px rgba(251,191,36,0.4)",
                        }}
                        ref={idx === 0 ? todayLineRef : undefined}
                      />
                    )}

                    {/* Полоса задачи */}
                    <div
                      className="absolute top-1 bottom-1 rounded-lg overflow-hidden transition-all duration-150"
                      style={{
                        left:     `${leftPct}%`,
                        width:    `${widthPct}%`,
                        background: isDone
                          ? "rgba(16,185,129,0.12)"
                          : isSelected
                            ? `linear-gradient(90deg, ${pr.color}35, ${pr.color}18)`
                            : `linear-gradient(90deg, ${pr.color}22, ${pr.color}0d)`,
                        border: isDone
                          ? "1px solid rgba(16,185,129,0.25)"
                          : isSelected
                            ? `1px solid ${pr.color}60`
                            : `1px solid ${pr.color}30`,
                        boxShadow: isDone
                          ? "none"
                          : isSelected
                            ? `0 0 12px ${pr.glow}, 0 2px 8px rgba(0,0,0,0.3)`
                            : `0 0 6px ${pr.glow}`,
                        opacity: isDone ? 0.5 : 1,
                        transform: isSelected ? "scaleY(1.1)" : "scaleY(1)",
                      }}
                    >
                      <div
                        className="flex items-center h-full px-2 overflow-hidden"
                      >
                        <span
                          className="text-[10px] font-medium truncate"
                          style={{
                            color: isDone
                              ? "#10b981"
                              : isSelected
                                ? pr.color
                                : `${pr.color}cc`,
                            letterSpacing: "0.01em",
                          }}
                        >
                          {task.title}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Статус */}
                  <div className="w-20 min-w-20 text-right">
                    <span
                      className="text-[9px] font-mono tracking-wide"
                      style={{ color: st.color }}
                    >
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SIDEBAR: список задач ── */}
        <div
          className="w-[290px] min-w-[290px] flex flex-col overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(7,13,26,0.8), rgba(10,18,32,0.7))",
            backdropFilter: "blur(20px)",
            borderLeft: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p
              className="text-[9px] font-mono tracking-[2.5px] uppercase"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              // Задачи · {MONTHS_SHT[selectedMonth]}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {taskList.length === 0 && (
              <div
                className="text-center py-10 text-[11px] font-mono"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                — нет задач —
              </div>
            )}

            {taskList.map(task => {
              const cat    = CATEGORY_META[task.category] ?? { icon: "•", color: "#64748b" };
              const pr     = PRIORITY_META[task.priority];
              const st     = STATUS_META[task.status];
              const dateStr= task.dateFrom === task.dateTo
                ? `${task.dateFrom}`
                : `${task.dateFrom}–${task.dateTo}`;
              const isSelected = selectedTask?.id === task.id;

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(isSelected ? null : task)}
                  className="rounded-xl p-3 cursor-pointer transition-all duration-150"
                  style={isSelected ? {
                    background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.06))",
                    border: "1px solid rgba(59,130,246,0.3)",
                    boxShadow: "0 2px 12px rgba(59,130,246,0.1)",
                  } : task.priority === "critical" && task.status !== "done" ? {
                    background: "rgba(239,68,68,0.04)",
                    border: "1px solid rgba(239,68,68,0.15)",
                  } : {
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p
                    className="text-[12px] font-medium leading-snug mb-2"
                    style={{
                      color: task.status === "done"
                        ? "rgba(255,255,255,0.3)"
                        : "#e8f0fe",
                      textDecoration: task.status === "done" ? "line-through" : "none",
                    }}
                  >
                    {task.title}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md"
                      style={{
                        color: cat.color,
                        background: `${cat.color}15`,
                        border: `1px solid ${cat.color}25`,
                      }}
                    >
                      {cat.icon} {task.category}
                    </span>
                    <span
                      className="text-[9px] font-mono"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      {dateStr} {MONTHS_SHT[task.month]}
                    </span>
                    <span
                      className="ml-auto text-[9px] font-mono font-semibold"
                      style={{ color: st.color }}
                    >
                      {st.label}
                    </span>
                  </div>

                  {/* Детали при выборе */}
                  {isSelected && (
                    <div
                      className="mt-3 pt-3 space-y-2"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <div className="flex justify-between text-[10px] font-mono">
                        <span style={{ color: "rgba(255,255,255,0.3)" }}>Приоритет</span>
                        <span style={{ color: pr.color, fontWeight: 600 }}>{pr.label}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span style={{ color: "rgba(255,255,255,0.3)" }}>Ответственный</span>
                        <span style={{ color: "#e8f0fe" }}>{task.responsible}</span>
                      </div>
                      {task.note && (
                        <p
                          className="text-[10px] mt-1 leading-relaxed"
                          style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                          {task.note}
                        </p>
                      )}
                      <button
                        className="w-full mt-1.5 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-all"
                        style={{
                          border: "1px solid rgba(16,185,129,0.25)",
                          background: "rgba(16,185,129,0.06)",
                          color: "#34d399",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(16,185,129,0.12)";
                          e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(16,185,129,0.06)";
                          e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)";
                        }}
                      >
                        ✓ ВЫПОЛНИТЬ
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Легенда */}
          <div
            className="px-4 py-3 space-y-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p
              className="text-[9px] font-mono tracking-[2px] uppercase mb-2"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              // Легенда
            </p>
            {(Object.entries(PRIORITY_META) as [Priority, typeof PRIORITY_META[Priority]][]).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 text-[10px] font-mono">
                <div
                  className="w-8 h-2 rounded-sm shrink-0"
                  style={{
                    background: `${val.color}30`,
                    border: `1px solid ${val.color}50`,
                  }}
                />
                <span style={{ color: "rgba(255,255,255,0.35)" }}>{val.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <div
                className="w-8 h-2 rounded-sm shrink-0"
                style={{
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.3)",
                }}
              />
              <span style={{ color: "rgba(255,255,255,0.35)" }}>ВЫПОЛНЕНО</span>
            </div>
            {selectedMonth === currentMonth && (
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <div
                  className="ml-3.5 shrink-0"
                  style={{
                    width: 1,
                    height: 12,
                    background: "#fbbf24",
                    boxShadow: "0 0 4px #fbbf24",
                  }}
                />
                <span style={{ color: "rgba(251,191,36,0.6)" }}>СЕГОДНЯ</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}