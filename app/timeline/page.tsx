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

// ── Константы ─────────────────────────────────────────────────────────

const MONTHS_RU  = ["","Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const MONTHS_SHT = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];
const DAYS_IN_MONTH = [0,31,28,31,30,31,30,31,31,30,31,30,31];

const PRIORITY_META: Record<Priority, { color: string; glow: string; label: string }> = {
  critical: { color: "#ef4444", glow: "rgba(239,68,68,0.35)",  label: "КРИТ"    },
  high:     { color: "#f59e0b", glow: "rgba(245,158,11,0.3)",  label: "ВЫС"     },
  medium:   { color: "#3b82f6", glow: "rgba(59,130,246,0.25)", label: "СРД"     },
  low:      { color: "#94a3b8", glow: "rgba(148,163,184,0.2)", label: "НИЗ"     },
};

const STATUS_META: Record<Status, { color: string; label: string }> = {
  pending:      { color: "#94a3b8", label: "ОЖИДАЕТ"   },
  "in-progress":{ color: "#f59e0b", label: "В РАБОТЕ"  },
  done:         { color: "#10b981", label: "ВЫПОЛНЕНО"  },
  overdue:      { color: "#ef4444", label: "ПРОСРОЧЕНО" },
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

// ── Компонент ─────────────────────────────────────────────────────────

export default function TimelinePage() {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentDay   = new Date().getDate();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedTask,  setSelectedTask ] = useState<Task | null>(null);
  const [filterStatus,  setFilterStatus ] = useState<Status | "all">("all");
  const [filterPriority,setFilterPriority]= useState<Priority | "all">("all");

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

  // Группируем задачи по дням для timeline
  const tasksByDay = useMemo(() => {
    const map: Record<number, Task[]> = {};
    for (let d = 1; d <= daysInMonth; d++) map[d] = [];
    monthTasks.forEach(task => {
      for (let d = task.dateFrom; d <= task.dateTo; d++) {
        if (d >= 1 && d <= daysInMonth) map[d].push(task);
      }
    });
    return map;
  }, [monthTasks, daysInMonth]);

  // Уникальные задачи для sidebar-списка
  const taskList = useMemo(() => {
    return [...monthTasks].sort((a, b) => a.dateFrom - b.dateFrom);
  }, [monthTasks]);

  const stats = useMemo(() => ({
    total:    monthTasks.length,
    critical: monthTasks.filter(t => t.priority === "critical").length,
    done:     monthTasks.filter(t => t.status   === "done").length,
    busy:     new Set(monthTasks.flatMap(t => Array.from({length: t.dateTo - t.dateFrom + 1}, (_,i) => t.dateFrom + i))).size,
  }), [monthTasks]);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 border-b border-white/10 flex items-center gap-5 flex-wrap">

        {/* Месяц-навигатор */}
        <div className="flex gap-1 flex-wrap">
          {MONTHS_SHT.slice(1).map((m, i) => {
            const month = i + 1;
            const hasTask = MOCK_TASKS.some(t => t.month === month);
            const hasCrit = MOCK_TASKS.some(t => t.month === month && t.priority === "critical");
            return (
              <button key={month}
                onClick={() => setSelectedMonth(month)}
                className={[
                  "px-3 py-1.5 rounded-lg text-[11px] font-mono tracking-wide uppercase transition-all relative",
                  selectedMonth === month
                    ? "bg-blue-500/20 border border-blue-500/40 text-blue-400"
                    : month === currentMonth
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-400/80"
                      : hasTask
                        ? "text-white/50 hover:bg-white/8 hover:text-white border border-transparent"
                        : "text-white/20 border border-transparent",
                ].join(" ")}
              >
                {m}
                {hasCrit && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Фильтры */}
        <div className="flex gap-2 ml-auto items-center">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as Status | "all")}
            className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[12px] text-white/70 focus:outline-none"
          >
            <option value="all">Все статусы</option>
            {(Object.keys(STATUS_META) as Status[]).map(s =>
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            )}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as Priority | "all")}
            className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[12px] text-white/70 focus:outline-none"
          >
            <option value="all">Все приоритеты</option>
            {(Object.keys(PRIORITY_META) as Priority[]).map(p =>
              <option key={p} value={p}>{PRIORITY_META[p].label}</option>
            )}
          </select>
        </div>

        {/* Мини-статистика */}
        <div className="flex gap-3 text-[11px] font-mono text-white/40">
          <span className="text-blue-400">{stats.total} задач</span>
          <span className="text-red-400">{stats.critical} крит.</span>
          <span className="text-emerald-400">{stats.done} вып.</span>
          <span className="text-amber-400">{stats.busy} загруж. дней</span>
        </div>
      </div>

      {/* ── BODY: timeline + sidebar ──────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── GANTT TIMELINE ───────────────────────────── */}
        <div className="flex-1 overflow-auto px-6 py-5">
          <h2 className="text-[13px] font-bold text-white/80 tracking-wide uppercase mb-4">
            {MONTHS_RU[selectedMonth]} — Диаграмма Ганта
          </h2>

          {/* Шкала дней */}
          <div className="flex mb-2 pl-[32px]">
            {Array.from({length: daysInMonth}, (_, i) => i + 1).map(d => {
              const isToday = d === currentDay && selectedMonth === currentMonth;
              return (
                <div key={d} className="flex-1 text-center relative" style={{minWidth: 20}}>
                  <span className={[
                    "text-[9px] font-mono",
                    isToday ? "text-amber-400 font-bold" : d % 5 === 0 ? "text-white/40" : "text-white/15",
                  ].join(" ")}>{d}</span>
                  {isToday && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-px h-full bg-amber-400/40 z-10" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Задачи — строки */}
          {taskList.length === 0 && (
            <div className="flex items-center justify-center py-20 text-white/25 font-mono text-[13px]">
              // НА ЭТОТ МЕСЯЦ ЗАДАЧ НЕТ
            </div>
          )}

          <div className="space-y-1.5">
            {taskList.map(task => {
              const pr  = PRIORITY_META[task.priority];
              const st  = STATUS_META[task.status];
              const cat = CATEGORY_META[task.category] ?? { icon: "•", color: "#94a3b8" };

              const leftPct  = ((task.dateFrom - 1) / daysInMonth) * 100;
              const widthPct = ((task.dateTo - task.dateFrom + 1) / daysInMonth) * 100;

              const isDone = task.status === "done";

              return (
                <div key={task.id}
                  className="flex items-center gap-2 group cursor-pointer"
                  onClick={() => setSelectedTask(task)}
                >
                  {/* Категория иконка */}
                  <div className="w-[28px] min-w-[28px] text-[13px] text-center opacity-70" title={task.category}>
                    {cat.icon}
                  </div>

                  {/* Полоса */}
                  <div className="flex-1 relative h-[28px]">
                    {/* Фон-сетка */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {Array.from({length: daysInMonth}, (_, i) => (
                        <div key={i} className="flex-1 border-r border-white/4 last:border-0" />
                      ))}
                    </div>

                    {/* Сегодняшняя линия */}
                    {selectedMonth === currentMonth && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-amber-400/50 z-20 pointer-events-none"
                        style={{ left: `${((currentDay - 0.5) / daysInMonth) * 100}%` }}
                        ref={task.id === taskList[0]?.id ? todayLineRef : undefined}
                      />
                    )}

                    {/* Сама полоса задачи */}
                    <div
                      className={[
                        "absolute top-1 bottom-1 rounded-md flex items-center overflow-hidden transition-all",
                        "group-hover:brightness-110",
                        isDone ? "opacity-50" : "",
                      ].join(" ")}
                      style={{
                        left:    `${leftPct}%`,
                        width:   `${widthPct}%`,
                        background: isDone
                          ? "rgba(16,185,129,0.15)"
                          : `linear-gradient(to right, ${pr.color}25, ${pr.color}12)`,
                        border:  `1px solid ${isDone ? "rgba(16,185,129,0.3)" : pr.color + "40"}`,
                        boxShadow: isDone ? "none" : `0 0 8px ${pr.glow}`,
                      }}
                    >
                      <span className="text-[10px] font-medium px-2 truncate leading-none"
                        style={{ color: isDone ? "#10b981" : pr.color }}
                      >
                        {task.title}
                      </span>
                    </div>
                  </div>

                  {/* Статус метка */}
                  <div className="w-[70px] min-w-[70px] text-right">
                    <span className="text-[9px] font-mono" style={{ color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SIDEBAR: список задач ─────────────────────── */}
        <div className="w-[300px] min-w-[300px] glass-elevated border-l border-white/10 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-[9px] text-white/30 tracking-[2px] uppercase font-mono">
              // ЗАДАЧИ · {MONTHS_SHT[selectedMonth]}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {taskList.length === 0 && (
              <p className="text-[11px] text-white/25 text-center py-10 font-mono">— нет задач —</p>
            )}
            {taskList.map(task => {
              const cat = CATEGORY_META[task.category] ?? { icon: "•", color: "#94a3b8" };
              const pr  = PRIORITY_META[task.priority];
              const st  = STATUS_META[task.status];
              const dateStr = task.dateFrom === task.dateTo
                ? `${task.dateFrom}`
                : `${task.dateFrom}–${task.dateTo}`;
              const isSelected = selectedTask?.id === task.id;

              return (
                <div key={task.id}
                  onClick={() => setSelectedTask(isSelected ? null : task)}
                  className={[
                    "rounded-xl p-3 border cursor-pointer transition-all",
                    isSelected
                      ? "border-blue-500/40 bg-blue-500/8"
                      : task.priority === "critical" && task.status !== "done"
                        ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/8"
                        : "border-white/8 glass hover:border-white/20",
                  ].join(" ")}
                >
                  <p className={[
                    "text-[12px] font-medium leading-snug mb-2",
                    task.status === "done" ? "line-through text-white/40" : "text-white/85",
                  ].join(" ")}>
                    {task.title}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                      style={{ color: cat.color, background: `${cat.color}15`, border: `1px solid ${cat.color}25` }}
                    >
                      {cat.icon} {task.category}
                    </span>
                    <span className="text-[9px] text-white/30 font-mono">
                      {dateStr} {MONTHS_SHT[task.month]}
                    </span>
                    <span className="ml-auto text-[9px] font-mono" style={{ color: st.color }}>
                      {st.label}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-white/8 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/30">Приоритет</span>
                        <span style={{ color: pr.color }}>{pr.label}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/30">Ответственный</span>
                        <span className="text-white/70">{task.responsible}</span>
                      </div>
                      {task.note && (
                        <p className="text-[10px] text-white/40 mt-2 leading-snug">{task.note}</p>
                      )}
                      <button className="w-full mt-2 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 bg-emerald-500/8 text-[10px] font-mono tracking-wide hover:bg-emerald-500/15 transition-all">
                        ✓ ВЫПОЛНИТЬ
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Легенда */}
          <div className="px-4 py-3 border-t border-white/8 space-y-1.5">
            <p className="text-[9px] text-white/20 tracking-[2px] uppercase font-mono mb-2">// ЛЕГЕНДА</p>
            {(Object.entries(PRIORITY_META) as [Priority, typeof PRIORITY_META[Priority]][]).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
                <span className="w-6 h-2 rounded-sm shrink-0" style={{ background: val.color + "40", border: `1px solid ${val.color}60` }} />
                {val.label}
              </div>
            ))}
            <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono mt-1">
              <span className="w-6 h-2 rounded-sm shrink-0" style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.35)" }} />
              ВЫПОЛНЕНО
            </div>
            {selectedMonth === currentMonth && (
              <div className="flex items-center gap-2 text-[10px] text-amber-400/60 font-mono">
                <span className="w-px h-3 bg-amber-400/60 ml-2.5" />
                СЕГОДНЯ
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}