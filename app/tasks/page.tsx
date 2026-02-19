// src/app/tasks/page.tsx
"use client";

import { useState, useMemo } from "react";

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

const MONTHS = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];

const PRIORITY_META: Record<Priority, { label: string; color: string; dot: string }> = {
  critical: { label: "КРИТ",    color: "#ef4444", dot: "bg-red-500"    },
  high:     { label: "ВЫСОКИЙ", color: "#f59e0b", dot: "bg-amber-500"  },
  medium:   { label: "СРЕДНИЙ", color: "#3b82f6", dot: "bg-blue-500"   },
  low:      { label: "НИЗКИЙ",  color: "#94a3b8", dot: "bg-slate-400"  },
};

const STATUS_META: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  pending:     { label: "ОЖИДАЕТ",    color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.25)" },
  "in-progress":{ label: "В РАБОТЕ",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.3)"  },
  done:        { label: "ВЫПОЛНЕНО",  color: "#10b981", bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.3)"  },
  overdue:     { label: "ПРОСРОЧЕНО", color: "#ef4444", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.3)"   },
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

// ── Mock данные (заменить на реальные db.select() вызовы) ─────────────

const MOCK_TASKS: Task[] = [
  { id:"1",  title:"Отчёт о НИР по направлению А2",          category:"Н",   month:2, dateFrom:1,  dateTo:10, responsible:"КВ-2",  status:"in-progress", priority:"critical" },
  { id:"2",  title:"Проверка САВЗ личного состава",           category:"БП",  month:2, dateFrom:3,  dateTo:3,  responsible:"ЗКВ-2", status:"pending",     priority:"high"     },
  { id:"3",  title:"Подготовка агитационных материалов",      category:"А",   month:2, dateFrom:5,  dateTo:14, responsible:"КВ-2",  status:"pending",     priority:"medium"   },
  { id:"4",  title:"Рапорт о боевой готовности",              category:"ПД",  month:2, dateFrom:7,  dateTo:7,  responsible:"ЗКВ-2", status:"done",        priority:"high"     },
  { id:"5",  title:"Научная конференция — подача тезисов",    category:"Н",   month:3, dateFrom:1,  dateTo:28, responsible:"КВ-2",  status:"pending",     priority:"critical" },
  { id:"6",  title:"Строевой смотр",                          category:"БП",  month:2, dateFrom:10, dateTo:10, responsible:"ПС",    status:"overdue",     priority:"critical" },
  { id:"7",  title:"Медицинское освидетельствование призыва", category:"П",   month:3, dateFrom:15, dateTo:20, responsible:"ЗКВ-2", status:"pending",     priority:"medium"   },
  { id:"8",  title:"Обновление служебных карточек",           category:"ПД",  month:2, dateFrom:20, dateTo:25, responsible:"ЗКВ-2", status:"in-progress", priority:"low"      },
  { id:"9",  title:"Оформление увольнительных записок",       category:"У",   month:2, dateFrom:15, dateTo:16, responsible:"КВ-2",  status:"done",        priority:"low"      },
  { id:"10", title:"Ежемесячный доклад командиру",            category:"ЕМ",  month:2, dateFrom:28, dateTo:28, responsible:"КВ-2",  status:"pending",     priority:"high"     },
];

// ── Компонент ─────────────────────────────────────────────────────────

export default function TasksPage() {
  const [search,        setSearch       ] = useState("");
  const [filterMonth,   setFilterMonth  ] = useState<number | "all">("all");
  const [filterCat,     setFilterCat    ] = useState<string  | "all">("all");
  const [filterStatus,  setFilterStatus ] = useState<Status  | "all">("all");
  const [filterPriority,setFilterPriority] = useState<Priority| "all">("all");
  const [sortField,     setSortField    ] = useState<"month" | "priority" | "status">("month");
  const [viewMode,      setViewMode     ] = useState<"table" | "kanban">("table");
  const [selectedTask,  setSelectedTask ] = useState<Task | null>(null);

  const tasks = useMemo(() => {
    let list = [...MOCK_TASKS];
    if (filterMonth   !== "all") list = list.filter(t => t.month    === filterMonth);
    if (filterCat     !== "all") list = list.filter(t => t.category === filterCat);
    if (filterStatus  !== "all") list = list.filter(t => t.status   === filterStatus);
    if (filterPriority!== "all") list = list.filter(t => t.priority === filterPriority);
    if (search)                  list = list.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

    list.sort((a, b) => {
      if (sortField === "month")    return a.month - b.month || a.dateFrom - b.dateFrom;
      if (sortField === "priority") {
        const order: Priority[] = ["critical","high","medium","low"];
        return order.indexOf(a.priority) - order.indexOf(b.priority);
      }
      return a.status.localeCompare(b.status);
    });
    return list;
  }, [search, filterMonth, filterCat, filterStatus, filterPriority, sortField]);

  const stats = useMemo(() => ({
    total:    MOCK_TASKS.length,
    done:     MOCK_TASKS.filter(t => t.status === "done").length,
    critical: MOCK_TASKS.filter(t => t.priority === "critical" && t.status !== "done").length,
    overdue:  MOCK_TASKS.filter(t => t.status === "overdue").length,
  }), []);

  const categories = [...new Set(MOCK_TASKS.map(t => t.category))];

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 border-b border-white/10 space-y-4">

        {/* Статистика */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "ВСЕГО",      value: stats.total,    color: "#60a5fa" },
            { label: "КРИТИЧНЫХ",  value: stats.critical, color: "#ef4444" },
            { label: "ПРОСРОЧЕНО", value: stats.overdue,  color: "#f97316" },
            { label: "ВЫПОЛНЕНО",  value: stats.done,     color: "#10b981" },
          ].map(s => (
            <div key={s.label}
              className="glass rounded-xl px-4 py-3 flex items-center gap-3 border border-white/8"
            >
              <span className="text-[28px] font-bold font-mono leading-none" style={{ color: s.color }}>
                {s.value}
              </span>
              <span className="text-[10px] text-white/40 tracking-[1.5px] uppercase font-mono leading-tight">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Фильтры */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Поиск */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[13px]">⌕</span>
            <input
              type="text"
              placeholder="Поиск задач..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 w-[200px]"
            />
          </div>

          <FilterSelect label="Месяц" value={String(filterMonth)} onChange={v => setFilterMonth(v === "all" ? "all" : Number(v))}>
            <option value="all">Все месяцы</option>
            {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </FilterSelect>

          <FilterSelect label="Категория" value={filterCat} onChange={v => setFilterCat(v)}>
            <option value="all">Все категории</option>
            {categories.map(c => <option key={c} value={c}>{c} — {CATEGORY_META[c]?.icon}</option>)}
          </FilterSelect>

          <FilterSelect label="Статус" value={filterStatus} onChange={v => setFilterStatus(v as Status | "all")}>
            <option value="all">Все статусы</option>
            {(Object.keys(STATUS_META) as Status[]).map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </FilterSelect>

          <FilterSelect label="Приоритет" value={filterPriority} onChange={v => setFilterPriority(v as Priority | "all")}>
            <option value="all">Все приоритеты</option>
            {(Object.keys(PRIORITY_META) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
          </FilterSelect>

          {/* Сортировка */}
          <div className="flex items-center gap-1 ml-auto">
            {(["month","priority","status"] as const).map(f => (
              <button key={f} onClick={() => setSortField(f)}
                className={[
                  "px-3 py-1.5 rounded-lg text-[11px] font-mono tracking-wide uppercase transition-all",
                  sortField === f
                    ? "bg-blue-500/20 border border-blue-500/40 text-blue-400"
                    : "text-white/40 hover:text-white/70 hover:bg-white/8",
                ].join(" ")}
              >
                {f === "month" ? "ДАТА" : f === "priority" ? "ПРИОР." : "СТАТУС"}
              </button>
            ))}
            <div className="w-px h-5 bg-white/15 mx-1" />
            {(["table","kanban"] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={[
                  "px-3 py-1.5 rounded-lg text-[11px] font-mono tracking-wide uppercase transition-all",
                  viewMode === v
                    ? "bg-blue-500/20 border border-blue-500/40 text-blue-400"
                    : "text-white/40 hover:text-white/70 hover:bg-white/8",
                ].join(" ")}
              >
                {v === "table" ? "≡ ТАБЛИЦА" : "⊞ КАНБАН"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === "table"
          ? <TableView tasks={tasks} onSelect={setSelectedTask} />
          : <KanbanView tasks={tasks} onSelect={setSelectedTask} />
        }
      </div>

      {/* ── TASK DETAIL MODAL ─────────────────────────────── */}
      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}

// ── TableView ──────────────────────────────────────────────────────────

function TableView({ tasks, onSelect }: { tasks: Task[]; onSelect: (t: Task) => void }) {
  if (tasks.length === 0) return <EmptyState />;

  return (
    <div className="space-y-1">
      {/* Заголовок таблицы */}
      <div className="grid gap-2 px-4 py-2 text-[10px] text-white/30 tracking-[1.5px] uppercase font-mono"
        style={{ gridTemplateColumns: "2fr 80px 100px 80px 110px 90px" }}
      >
        <span>ЗАДАЧА</span>
        <span>КАТ.</span>
        <span>СРОК</span>
        <span>ИСПОЛН.</span>
        <span>СТАТУС</span>
        <span>ПРИОРИТЕТ</span>
      </div>

      {tasks.map(task => {
        const cat  = CATEGORY_META[task.category] ?? { icon: "•", color: "#94a3b8" };
        const st   = STATUS_META[task.status];
        const pr   = PRIORITY_META[task.priority];
        const date = task.dateFrom === task.dateTo
          ? `${task.dateFrom} ${MONTHS[task.month]}`
          : `${task.dateFrom}–${task.dateTo} ${MONTHS[task.month]}`;

        return (
          <div key={task.id}
            onClick={() => onSelect(task)}
            className={[
              "grid gap-2 px-4 py-3 rounded-xl border cursor-pointer items-center",
              "transition-all hover:bg-white/5",
              task.status === "done"
                ? "border-white/5 opacity-60"
                : task.priority === "critical"
                  ? "border-red-500/20 bg-red-500/4"
                  : "border-white/8 glass",
            ].join(" ")}
            style={{ gridTemplateColumns: "2fr 80px 100px 80px 110px 90px" }}
          >
            {/* Название */}
            <div className="flex items-center gap-3 min-w-0">
              <Checkbox done={task.status === "done"} />
              <span className={[
                "text-[13px] font-medium truncate",
                task.status === "done" ? "line-through text-white/40" : "text-white",
              ].join(" ")}>
                {task.title}
              </span>
            </div>

            {/* Категория */}
            <span className="text-[11px] font-mono flex items-center gap-1" style={{ color: cat.color }}>
              <span>{cat.icon}</span> {task.category}
            </span>

            {/* Дата */}
            <span className="text-[11px] text-white/50 font-mono">{date}</span>

            {/* Ответственный */}
            <span className="text-[11px] text-white/50 font-mono">{task.responsible}</span>

            {/* Статус */}
            <span className="text-[10px] px-2 py-1 rounded-md font-mono tracking-wide w-fit"
              style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
            >
              {st.label}
            </span>

            {/* Приоритет */}
            <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: pr.color }}>
              <span className={`w-1.5 h-1.5 rounded-full ${pr.dot}`} />
              {pr.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── KanbanView ─────────────────────────────────────────────────────────

function KanbanView({ tasks, onSelect }: { tasks: Task[]; onSelect: (t: Task) => void }) {
  const columns: { status: Status; label: string; color: string }[] = [
    { status: "pending",     label: "Ожидает",    color: "#94a3b8" },
    { status: "in-progress", label: "В работе",   color: "#f59e0b" },
    { status: "overdue",     label: "Просрочено", color: "#ef4444" },
    { status: "done",        label: "Выполнено",  color: "#10b981" },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.status);
        return (
          <div key={col.status} className="glass rounded-xl border border-white/8 flex flex-col overflow-hidden">
            {/* Заголовок колонки */}
            <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className="text-[12px] font-semibold text-white/70">{col.label}</span>
              </div>
              <span className="text-[11px] text-white/30 font-mono">{colTasks.length}</span>
            </div>
            {/* Карточки */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {colTasks.map(task => {
                const cat = CATEGORY_META[task.category] ?? { icon: "•", color: "#94a3b8" };
                const pr  = PRIORITY_META[task.priority];
                return (
                  <div key={task.id}
                    onClick={() => onSelect(task)}
                    className="glass-elevated rounded-xl p-3 border border-white/8 cursor-pointer hover:border-white/20 transition-all"
                  >
                    <p className="text-[12px] text-white/80 leading-snug mb-2">{task.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                        style={{ color: cat.color, background: `${cat.color}15`, border: `1px solid ${cat.color}25` }}
                      >
                        {cat.icon} {task.category}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1"
                        style={{ color: pr.color }}
                      >
                        <span className={`w-1 h-1 rounded-full ${pr.dot}`} />
                        {pr.label}
                      </span>
                      <span className="ml-auto text-[10px] text-white/30 font-mono">
                        {task.responsible}
                      </span>
                    </div>
                  </div>
                );
              })}
              {colTasks.length === 0 && (
                <p className="text-[11px] text-white/20 text-center py-8 font-mono">— пусто —</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── TaskModal ──────────────────────────────────────────────────────────

function TaskModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const cat = CATEGORY_META[task.category] ?? { icon: "•", color: "#94a3b8" };
  const st  = STATUS_META[task.status];
  const pr  = PRIORITY_META[task.priority];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-elevated rounded-2xl border border-white/15 w-full max-w-lg p-6 shadow-2xl">
        {/* Шапка */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-[10px] text-white/30 tracking-[2px] uppercase mb-2 font-mono">
              // ЗАДАЧА #{task.id}
            </p>
            <h3 className="text-[18px] font-bold text-white leading-snug">{task.title}</h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/15 text-white/50 hover:text-white hover:bg-white/8 transition-all text-[18px] shrink-0"
          >
            ×
          </button>
        </div>

        {/* Детали */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "КАТЕГОРИЯ",   value: `${cat.icon} ${task.category}`, color: cat.color  },
            { label: "ПРИОРИТЕТ",   value: pr.label,                       color: pr.color   },
            { label: "СТАТУС",      value: st.label,                       color: st.color   },
            { label: "ОТВЕТСТВЕННЫЙ", value: task.responsible,             color: "#e2e8f0"  },
            { label: "МЕСЯЦ",       value: MONTHS[task.month],             color: "#e2e8f0"  },
            { label: "СРОК",        value: task.dateFrom === task.dateTo ? `${task.dateFrom}` : `${task.dateFrom}–${task.dateTo}`, color: "#e2e8f0" },
          ].map(row => (
            <div key={row.label} className="glass rounded-xl p-3 border border-white/8">
              <p className="text-[9px] text-white/30 tracking-[1.5px] uppercase mb-1 font-mono">{row.label}</p>
              <p className="text-[13px] font-semibold font-mono" style={{ color: row.color }}>{row.value}</p>
            </div>
          ))}
        </div>

        {/* Заметка */}
        {task.note && (
          <div className="glass rounded-xl p-4 border border-white/8 mb-5">
            <p className="text-[9px] text-white/30 tracking-[1.5px] uppercase mb-2 font-mono">// ПРИМЕЧАНИЕ</p>
            <p className="text-[13px] text-white/70">{task.note}</p>
          </div>
        )}

        {/* Действия */}
        <div className="flex gap-2">
          <button className="flex-1 py-2 rounded-xl border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[12px] font-medium tracking-wide hover:bg-emerald-500/20 transition-all">
            ✓ ОТМЕТИТЬ ВЫПОЛНЕННЫМ
          </button>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/15 text-white/50 text-[12px] hover:bg-white/8 transition-all"
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Мелкие вспомогательные компоненты ─────────────────────────────────

function Checkbox({ done }: { done: boolean }) {
  return (
    <div className={[
      "w-4 h-4 min-w-4 rounded border flex items-center justify-center transition-all",
      done
        ? "bg-emerald-500 border-emerald-500 text-white"
        : "border-white/25 hover:border-white/50",
    ].join(" ")}
    >
      {done && <span className="text-[10px]">✓</span>}
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[12px] text-white/70 focus:outline-none focus:border-blue-500/50 cursor-pointer"
    >
      {children}
    </select>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-white/30">
      <span className="text-5xl mb-4 opacity-50">◫</span>
      <p className="text-[13px] font-mono tracking-wide">// ЗАДАЧИ НЕ НАЙДЕНЫ</p>
      <p className="text-[11px] mt-1">Попробуйте изменить фильтры</p>
    </div>
  );
}