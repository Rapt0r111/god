// src/app/tasks/page.tsx
import { db }       from "@/lib/db";
import { tasks, subtasks } from "@/lib/db/schema";
import { asc }      from "drizzle-orm";
import { TasksList } from "@/components/tasks/TasksList";
import type { Subtask } from "@/lib/db/schema";

const MONTHS_SHORT = [
  "", "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН",
  "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК",
];

const CATEGORIES = {
  "Н":   { icon: "⚗",  label: "Наука",            color: "#34d399" },
  "А":   { icon: "📡", label: "Агитация",          color: "#60a5fa" },
  "БП":  { icon: "🎯", label: "Боевая подготовка", color: "#f87171" },
  "ПД":  { icon: "⚙",  label: "Повседн. деят.",    color: "#f59e0b" },
  "ВПР": { icon: "🎖", label: "ВПР",               color: "#a78bfa" },
  "У":   { icon: "🏁", label: "Увольнение",        color: "#fb923c" },
  "П":   { icon: "🔰", label: "Призыв",            color: "#22d3ee" },
  "ЗиТ": { icon: "💻", label: "Техника",           color: "#94a3b8" },
  "ЕМ":  { icon: "📋", label: "Ежемесячные",       color: "#fbbf24" },
  "НД":  { icon: "🔬", label: "Научная деят.",     color: "#34d399" },
  "МГ":  { icon: "⚡", label: "Мобготовность",     color: "#ef4444" },
} as const;

interface PageProps {
  searchParams: Promise<{
    month?:    string;
    category?: string;
    priority?: string;
  }>;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const params      = await searchParams;
  const selMonth    = params.month    ? parseInt(params.month) : 0;
  const selCategory = params.category ?? "ALL";
  const selPriority = params.priority ?? "ALL";

  // Загружаем задачи и подзадачи параллельно
  const [allTasks, allSubtasks] = await Promise.all([
    db.select().from(tasks).orderBy(tasks.month, tasks.dateFrom),
    db.select().from(subtasks).orderBy(asc(subtasks.order)),
  ]);

  // Присоединяем подзадачи
  const tasksWithSubs = allTasks.map((task: typeof allTasks[number]) => ({
    ...task,
    subtasksList: allSubtasks.filter((s: Subtask) => s.taskId === task.id),
  }));

  // Фильтрация
  const filtered = tasksWithSubs
    .filter((t: typeof tasksWithSubs[number]) => {
      if (selMonth    !== 0     && t.month    !== selMonth)    return false;
      if (selCategory !== "ALL" && t.category !== selCategory) return false;
      if (selPriority !== "ALL" && t.priority !== selPriority) return false;
      return true;
    })
    .sort((a: typeof tasksWithSubs[number], b: typeof tasksWithSubs[number]) => {
      const prio: Record<string, number> = { critical: 0, high: 1, normal: 2 };
      return (prio[a.priority] ?? 3) - (prio[b.priority] ?? 3)
        || a.month - b.month
        || a.dateFrom - b.dateFrom;
    });

  const doneCount  = filtered.filter((t: typeof filtered[number]) => t.status === "done").length;
  const totalCount = filtered.length;

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  function filterUrl(key: string, value: string): string {
    const p = new URLSearchParams();
    if (selMonth    !== 0     && key !== "month")    p.set("month",    String(selMonth));
    if (selCategory !== "ALL" && key !== "category") p.set("category", selCategory);
    if (selPriority !== "ALL" && key !== "priority") p.set("priority", selPriority);
    if (value !== "ALL" && value !== "0") p.set(key, value);
    const s = p.toString();
    return `/tasks${s ? "?" + s : ""}`;
  }

  const monthLabel = selMonth !== 0 ? MONTHS_SHORT[selMonth] : "Все месяцы";

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary"
      style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="flex h-screen overflow-hidden">

        {/* ── Sidebar ─────────────────────────────── */}
        <nav className="w-55 min-w-55 bg-bg-panel border-r border-border flex flex-col">
          <div className="px-4 pt-5 pb-4 border-b border-border">
            <p className="text-[9px] text-accent-blue tracking-[3px] uppercase mb-1.5 opacity-70"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}>
              // СИСТЕМА УПРАВЛЕНИЯ
            </p>
            <h1 className="text-[18px] font-bold tracking-wide"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              ЦСУ ПД
            </h1>
            <p className="text-[10px] text-[#f59e0b] mt-1 tracking-wide"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}>
              НАУЧНАЯ РОТА · В/Ч
            </p>
          </div>
          <div className="flex-1 py-3 overflow-y-auto">
            <p className="text-[9px] text-text-dim tracking-[2px] px-4 py-2 uppercase"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}>
              Навигация
            </p>
            {([
              { href: "/",         icon: "◈", label: "Дашборд"       },
              { href: "/tasks",    icon: "≡", label: "Задачи",        active: true },
              { href: "/timeline", icon: "◫", label: "Хронология"    },
              { href: "/roles",    icon: "◉", label: "Личный состав" },
            ] as const).map(item => (
              <a key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-4 py-2.25 border-l-2 text-[13px] font-medium transition-all
                  ${"active" in item && item.active
                    ? "border-accent-blue bg-[rgba(96,165,250,0.08)] text-accent-blue"
                    : "border-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                  }`}
              >
                <span className="text-[15px] w-5 text-center">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border space-y-1.5">
            {[
              { color: "#34d399", label: "СИСТЕМА АКТИВНА",  delay: "0s" },
              { color: "#f59e0b", label: "OFFLINE OK",        delay: "1s" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 text-[10px] text-text-dim"
                style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: s.color, animationDelay: s.delay }} />
                {s.label}
              </div>
            ))}
          </div>
        </nav>

        {/* ── Main ────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 min-h-14 bg-bg-panel border-b border-border flex items-center px-6 gap-5">
            <span className="text-[16px] font-bold tracking-wide uppercase"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              Журнал задач
            </span>
            <div className="w-px h-5 bg-border" />
            <span className="text-[11px] text-text-secondary capitalize"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}>
              {today}
            </span>
          </header>

          <div className="flex-1 overflow-y-auto p-5 px-6">

            {/* Прогресс */}
            <div className="flex items-center gap-4 mb-5">
              <h2 className="text-[20px] font-bold tracking-wide uppercase"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                {monthLabel}
                {selCategory !== "ALL" && ` · ${selCategory}`}
              </h2>
              <span className="text-[10px] text-text-secondary"
                style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                {doneCount}/{totalCount} выполнено
              </span>
              <div className="flex-1 h-0.5 bg-border relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full bg-[#34d399] transition-all duration-700"
                  style={{ width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : "0%" }} />
              </div>
            </div>

            {/* Фильтр — месяцы */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <a href={filterUrl("month", "0")}
                className={`text-[10px] px-3 py-1 border tracking-wide transition-all
                  ${selMonth === 0
                    ? "border-[#f59e0b] text-[#f59e0b] bg-[rgba(245,158,11,0.08)]"
                    : "border-border text-text-dim hover:text-text-secondary hover:border-border-bright"
                  }`}
                style={{ fontFamily: "'Share Tech Mono', monospace" }}
              >
                ВСЕ
              </a>
              {MONTHS_SHORT.slice(1).map((m, i) => {
                const month = i + 1;
                const cnt   = allTasks.filter(t => t.month === month).length;
                if (cnt === 0) return null;
                return (
                  <a key={month} href={filterUrl("month", String(month))}
                    className={`text-[10px] px-3 py-1 border tracking-wide transition-all
                      ${selMonth === month
                        ? "border-[#f59e0b] text-[#f59e0b] bg-[rgba(245,158,11,0.08)]"
                        : "border-border text-text-dim hover:text-text-secondary hover:border-border-bright"
                      }`}
                    style={{ fontFamily: "'Share Tech Mono', monospace" }}
                  >
                    {m}
                  </a>
                );
              })}
            </div>

            {/* Фильтр — категории + приоритет */}
            <div className="flex flex-wrap gap-1 mb-5">
              <a href={filterUrl("category", "ALL")}
                className={`text-[10px] px-2.5 py-1 border transition-all
                  ${selCategory === "ALL"
                    ? "border-accent-blue text-accent-blue bg-[rgba(96,165,250,0.08)]"
                    : "border-border text-text-dim hover:border-border-bright"
                  }`}
                style={{ fontFamily: "'Share Tech Mono', monospace" }}
              >
                ★ ВСЕ
              </a>
              {Object.entries(CATEGORIES).map(([code, meta]) => (
                <a key={code} href={filterUrl("category", code)}
                  className="text-[10px] px-2.5 py-1 border transition-all"
                  style={{
                    fontFamily:  "'Share Tech Mono', monospace",
                    color:       selCategory === code ? meta.color : "#3d5570",
                    borderColor: selCategory === code ? meta.color : "#1a2d4a",
                    background:  selCategory === code ? `${meta.color}10` : "transparent",
                  }}
                >
                  {meta.icon} {code}
                </a>
              ))}
              <div className="ml-auto flex gap-1">
                {(["ALL", "critical", "high", "normal"] as const).map(p => {
                  const labels = { ALL: "ВСЕ", critical: "КРИ", high: "ВЫС", normal: "НОР" } as const;
                  const colors = { ALL: "#60a5fa", critical: "#ef4444", high: "#f59e0b", normal: "#34d399" } as const;
                  const active = selPriority === p;
                  return (
                    <a key={p} href={filterUrl("priority", p)}
                      className="text-[10px] px-2.5 py-1 border transition-all"
                      style={{
                        fontFamily:  "'Share Tech Mono', monospace",
                        color:       active ? colors[p] : "#3d5570",
                        borderColor: active ? colors[p] : "#1a2d4a",
                        background:  active ? `${colors[p]}10` : "transparent",
                      }}
                    >
                      {labels[p]}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Список задач */}
            <TasksList tasks={filtered} />
          </div>
        </div>
      </div>
    </div>
  );
}