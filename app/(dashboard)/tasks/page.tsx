// app/(dashboard)/tasks/page.tsx
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { TasksList } from "@/components/tasks/TasksList";
import { AddTaskButton } from "@/components/tasks/AddTaskButton";

// ── helpers ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { code: "Н", icon: "⚗", label: "Наука", color: "#10b981" },
  { code: "А", icon: "📡", label: "Агитация", color: "#3b82f6" },
  { code: "БП", icon: "🎯", label: "Боевая подг.", color: "#ef4444" },
  { code: "ПД", icon: "⚙", label: "Повседн.", color: "#f59e0b" },
  { code: "ВПР", icon: "🎖", label: "ВПР", color: "#a78bfa" },
  { code: "У", icon: "🏁", label: "Увольнение", color: "#f97316" },
  { code: "П", icon: "🔰", label: "Призыв", color: "#06b6d4" },
  { code: "ЗиТ", icon: "💻", label: "Техника", color: "#94a3b8" },
  { code: "ЕМ", icon: "📋", label: "Ежемесячные", color: "#fbbf24" },
  { code: "НД", icon: "🔬", label: "Научная деят.", color: "#10b981" },
  { code: "МГ", icon: "⚡", label: "Мобготовность", color: "#ef4444" },
];

const PRIORITIES = [
  { value: "critical", label: "Критический", color: "#ef4444" },
  { value: "high", label: "Высокий", color: "#f59e0b" },
  { value: "normal", label: "Нормальный", color: "#10b981" },
];

const STATUSES = [
  { value: "pending", label: "Ожидает", color: "#7d9ab5" },
  { value: "in_progress", label: "В работе", color: "#f59e0b" },
  { value: "done", label: "Выполнено", color: "#10b981" },
  { value: "cancelled", label: "Отменено", color: "#ef4444" },
];

const MONTHS_SHORT = ["", "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН", "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК"];

type ActiveFilters = {
  category: string;
  priority: string;
  status: string;
  month: number;
  search: string;
  criticalOnly: boolean;
};

function sortTasksForList<T extends { status: string; priority: string; month: number; dateTo: number; dateFrom: number }>(rows: T[]) {
  const priorityWeight: Record<string, number> = { critical: 0, high: 1, normal: 2 };

  return [...rows].sort((a, b) => {
    const aDone = a.status === "done";
    const bDone = b.status === "done";
    if (aDone !== bDone) return aDone ? 1 : -1;

    const pa = priorityWeight[a.priority] ?? 99;
    const pb = priorityWeight[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;

    if (a.month !== b.month) return a.month - b.month;
    if (a.dateTo !== b.dateTo) return a.dateTo - b.dateTo;
    return a.dateFrom - b.dateFrom;
  });
}

function updateTaskList<T extends { category: string; priority: string; status: string; month: number; title: string; description: string | null; dateTo: number; dateFrom: number }>(
  source: T[],
  activeFilters: ActiveFilters,
) {
  let list = [...source];

  if (activeFilters.criticalOnly) {
    list = list.filter((t) => t.priority === "critical" && t.status !== "done");
  }

  if (activeFilters.category) list = list.filter((t) => t.category === activeFilters.category);
  if (activeFilters.priority) list = list.filter((t) => t.priority === activeFilters.priority);
  if (activeFilters.status) list = list.filter((t) => t.status === activeFilters.status);
  if (activeFilters.month) list = list.filter((t) => t.month === activeFilters.month);

  if (activeFilters.search) {
    const q = activeFilters.search.toLowerCase();
    list = list.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q)
    );
  }

  return sortTasksForList(list);
}


// ── Page ─────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    category?: string;
    priority?: string;
    status?: string;
    month?: string;
    q?: string;
    criticalOnly?: string;
  }>;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filterCat = sp.category ?? "";
  const filterPri = sp.priority ?? "";
  const filterStat = sp.status ?? "";
  const filterMonth = sp.month ? parseInt(sp.month) : 0;
  const filterQ = sp.q ?? "";
  const criticalOnly = sp.criticalOnly === "1";

  // ── fetch all tasks (server-side) ──
  const sourceTasks = await db.query.tasks.findMany({
    with: { subtasks: true },
  });

  const activeFiltersState: ActiveFilters = {
    category: filterCat,
    priority: filterPri,
    status: filterStat,
    month: filterMonth,
    search: filterQ,
    criticalOnly,
  };

  const allTasks = updateTaskList(sourceTasks as any, activeFiltersState);

  // stats
  const total = allTasks.length;
  const done = allTasks.filter(t => t.status === "done").length;
  const critical = allTasks.filter(t => t.priority === "critical" && t.status !== "done").length;

  // Active filters count (for badge)
  const activeFiltersCount = [filterCat, filterPri, filterStat, filterMonth ? String(filterMonth) : "", filterQ, criticalOnly ? "criticalOnly" : ""].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold tracking-wide" style={{ color: "#e8f0fe", letterSpacing: "0.04em" }}>
            Журнал задач
          </h2>
          <p className="text-[11px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
            {total} задач · {done} выполнено
            {critical > 0 && (
              <span className="ml-2" style={{ color: "#fca5a5" }}>· ⚠ {critical} критических</span>
            )}
          </p>
        </div>
        <AddTaskButton />
      </div>

      {/* ── Filter bar ── */}
      <FilterBar
        filterCat={filterCat}
        filterPri={filterPri}
        filterStat={filterStat}
        filterMonth={filterMonth}
        filterQ={filterQ}
        activeFilters={activeFiltersCount}
        criticalOnly={criticalOnly}
      />

      {/* ── Task list ── */}
      <div className="flex-1 overflow-y-auto -mr-2 pr-2">
        <TasksList tasks={allTasks as any} />
      </div>
    </div>
  );
}

// ── FilterBar (server component with links) ──────────────────────────

function buildUrl(params: Record<string, string | number>) {
  const entries = Object.entries(params).filter(([, v]) => v !== "" && v !== 0);
  if (!entries.length) return "/tasks";
  return "/tasks?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}

function FilterBar({ filterCat, filterPri, filterStat, filterMonth, filterQ, activeFilters, criticalOnly }: {
  filterCat: string; filterPri: string; filterStat: string;
  filterMonth: number; filterQ: string; activeFilters: number; criticalOnly: boolean;
}) {
  const base = {
    category: filterCat,
    priority: filterPri,
    status: filterStat,
    month: filterMonth,
    q: filterQ,
    criticalOnly: criticalOnly ? 1 : 0,
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2.5">
        <form method="GET" action="/tasks" className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
          {filterCat && <input type="hidden" name="category" value={filterCat} />}
          {filterPri && <input type="hidden" name="priority" value={filterPri} />}
          {filterStat && <input type="hidden" name="status" value={filterStat} />}
          {filterMonth > 0 && <input type="hidden" name="month" value={filterMonth} />}
          {criticalOnly && <input type="hidden" name="criticalOnly" value="1" />}
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>⌕</span>
          <input name="q" defaultValue={filterQ} placeholder="Поиск задач..."
            className="flex-1 bg-transparent text-[12px] outline-none"
            style={{ color: "rgba(200,216,232,0.85)", fontFamily: "inherit" }} />
          {filterQ && (
            <a href={buildUrl({ ...base, q: "" })}
              className="text-[12px] leading-none transition-opacity hover:opacity-70"
              style={{ color: "rgba(255,255,255,0.3)" }}>
              ×
            </a>
          )}
        </form>

        {activeFilters > 0 && (
          <a href="/tasks"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-mono tracking-wide transition-all"
            style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", color: "#fca5a5", whiteSpace: "nowrap" }}>
            × Сбросить {activeFilters > 1 ? `(${activeFilters})` : ""}
          </a>
        )}
      </div>

      <details className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} open={activeFilters > 0}>
        <summary className="cursor-pointer list-none flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-[1.4px]" style={{ color: "rgba(255,255,255,0.6)" }}>
            // ФИЛЬТРЫ ЗАДАЧ
          </span>
          <span className="text-[10px] font-mono px-2 py-1 rounded-lg" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd" }}>
            {activeFilters > 0 ? `Активно: ${activeFilters}` : "Скрыты"}
          </span>
        </summary>

        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.28)" }}>Быстрый фильтр:</span>
            <a href={buildUrl({ ...base, criticalOnly: criticalOnly ? 0 : 1, priority: criticalOnly ? filterPri : "critical", status: criticalOnly ? filterStat : "" })}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold tracking-wide transition-all"
              style={criticalOnly ? {
                background: "rgba(239,68,68,0.22)", border: "1px solid rgba(239,68,68,0.55)", color: "#fca5a5",
              } : {
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)",
              }}>
              ⚠ Критичные (не выполнено)
            </a>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.28)" }}>Приоритет:</span>
            <div className="flex gap-1 flex-wrap">
              {PRIORITIES.map(p => {
                const active = filterPri === p.value;
                const url = buildUrl({ ...base, priority: active ? "" : p.value });
                return (
                  <a key={p.value} href={url}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold tracking-wide transition-all"
                    style={active ? {
                      background: `${p.color}22`, border: `1px solid ${p.color}55`, color: p.color,
                    } : {
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)",
                    }}>
                    {p.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.28)" }}>Статус:</span>
            <div className="flex gap-1 flex-wrap">
              {STATUSES.map(s => {
                const active = filterStat === s.value;
                const url = buildUrl({ ...base, status: active ? "" : s.value });
                return (
                  <a key={s.value} href={url}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold tracking-wide transition-all"
                    style={active ? {
                      background: `${s.color}18`, border: `1px solid ${s.color}45`, color: s.color,
                    } : {
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)",
                    }}>
                    {s.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.28)" }}>Месяц:</span>
            <div className="flex gap-1 flex-wrap">
              {MONTHS_SHORT.slice(1).map((m, i) => {
                const monthNum = i + 1;
                const active = filterMonth === monthNum;
                const url = buildUrl({ ...base, month: active ? 0 : monthNum });
                return (
                  <a key={monthNum} href={url}
                    className="w-8 py-1.5 rounded-lg text-[9px] font-mono font-semibold tracking-wide transition-all text-center"
                    style={active ? {
                      background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.5)", color: "#93c5fd",
                    } : {
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.28)",
                    }}>
                    {m}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.28)" }}>Категория:</span>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(cat => {
                const active = filterCat === cat.code;
                const url = buildUrl({ ...base, category: active ? "" : cat.code });
                return (
                  <a key={cat.code} href={url}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-semibold transition-all"
                    style={active ? {
                      background: `${cat.color}18`, border: `1px solid ${cat.color}45`, color: cat.color,
                    } : {
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)",
                    }}>
                    <span className="text-[11px]">{cat.icon}</span>
                    {cat.code}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
