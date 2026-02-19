// src/app/timeline/page.tsx
import { db }    from "@/lib/db";
import { tasks } from "@/lib/db/schema";

const MONTHS_FULL  = ["","Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const MONTHS_SHORT = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];

const CATEGORIES: Record<string, { icon: string; color: string }> = {
  "Н":   { icon: "⚗",  color: "#34d399" },
  "А":   { icon: "📡", color: "#60a5fa" },
  "БП":  { icon: "🎯", color: "#f87171" },
  "ПД":  { icon: "⚙",  color: "#f59e0b" },
  "ВПР": { icon: "🎖", color: "#a78bfa" },
  "У":   { icon: "🏁", color: "#fb923c" },
  "П":   { icon: "🔰", color: "#22d3ee" },
  "ЗиТ": { icon: "💻", color: "#94a3b8" },
  "ЕМ":  { icon: "📋", color: "#fbbf24" },
  "НД":  { icon: "🔬", color: "#34d399" },
  "МГ":  { icon: "⚡", color: "#ef4444" },
};

const PRIORITY_COLOR = { critical: "#ef4444", high: "#f59e0b", normal: "#34d399" } as const;

export default async function TimelinePage() {
  const allTasks = await db.select().from(tasks).orderBy(tasks.month, tasks.dateFrom);
  const currentMonth = new Date().getMonth() + 1;

  const byMonth = Array.from({ length: 12 }, (_, i) => ({
    month:    i + 1,
    tasks:    allTasks.filter((t: typeof tasks.$inferSelect) => t.month === i + 1).sort((a: typeof tasks.$inferSelect, b: typeof tasks.$inferSelect) => a.dateFrom - b.dateFrom),
    critical: allTasks.filter((t: typeof tasks.$inferSelect) => t.month === i + 1 && t.priority === "critical").length,
    done:     allTasks.filter((t: typeof tasks.$inferSelect) => t.month === i + 1 && t.status   === "done").length,
  })).filter((m: any) => m.tasks.length > 0);

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#060b14] text-[#e2eaf4]" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <nav className="w-[220px] min-w-[220px] bg-[#0a1220] border-r border-[#1a2d4a] flex flex-col">
          <div className="px-4 pt-5 pb-4 border-b border-[#1a2d4a]">
            <p className="text-[9px] text-[#60a5fa] tracking-[3px] uppercase mb-1.5 opacity-70" style={{ fontFamily: "'Share Tech Mono', monospace" }}>// СИСТЕМА УПРАВЛЕНИЯ</p>
            <h1 className="text-[18px] font-bold tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif" }}>ЦСУ ПД</h1>
            <p className="text-[10px] text-[#f59e0b] mt-1 tracking-wide" style={{ fontFamily: "'Share Tech Mono', monospace" }}>НАУЧНАЯ РОТА · В/Ч</p>
          </div>
          <div className="flex-1 py-3 overflow-y-auto">
            <p className="text-[9px] text-[#3d5570] tracking-[2px] px-4 py-2 uppercase" style={{ fontFamily: "'Share Tech Mono', monospace" }}>Навигация</p>
            {[
              { href: "/",         icon: "◈", label: "Дашборд"      },
              { href: "/tasks",    icon: "≡", label: "Задачи"        },
              { href: "/timeline", icon: "◫", label: "Хронология",   active: true },
              { href: "/roles",    icon: "◉", label: "Личный состав" },
            ].map(item => (
              <a key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-4 py-[9px] border-l-2 text-[13px] font-medium transition-all
                  ${item.active
                    ? "border-[#60a5fa] bg-[rgba(96,165,250,0.08)] text-[#60a5fa]"
                    : "border-transparent text-[#6b8ba8] hover:bg-[#111f35] hover:text-[#e2eaf4]"}`}
              >
                <span className="text-[15px] w-5 text-center">{item.icon}</span>
                {item.label}
              </a>
            ))}

            {/* Быстрый переход по месяцам */}
            <p className="text-[9px] text-[#3d5570] tracking-[2px] px-4 pt-4 pb-2 uppercase" style={{ fontFamily: "'Share Tech Mono', monospace" }}>Месяцы</p>
            {byMonth.map(m => (
              <a key={m.month} href={`#month-${m.month}`}
                className={`flex items-center justify-between px-4 py-1.5 text-[11px] transition-all hover:bg-[#111f35]
                  ${m.month === currentMonth ? "text-[#f59e0b]" : "text-[#3d5570] hover:text-[#6b8ba8]"}`}
                style={{ fontFamily: "'Share Tech Mono', monospace" }}
              >
                <span>{MONTHS_SHORT[m.month]}</span>
                <span className="flex items-center gap-1">
                  {m.critical > 0 && <span className="text-[#ef4444]">⚠</span>}
                  <span>{m.tasks.length}</span>
                </span>
              </a>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-[#1a2d4a] space-y-1.5">
            {[{ color: "#34d399", label: "СИСТЕМА АКТИВНА", delay: "0s" }, { color: "#f59e0b", label: "OFFLINE OK", delay: "1s" }].map(s => (
              <div key={s.label} className="flex items-center gap-2 text-[10px] text-[#3d5570]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: s.color, animationDelay: s.delay }} />
                {s.label}
              </div>
            ))}
          </div>
        </nav>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 min-h-14 bg-[#0a1220] border-b border-[#1a2d4a] flex items-center px-6 gap-5">
            <span className="text-[16px] font-bold tracking-wide uppercase" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Хронология мероприятий</span>
            <div className="w-px h-5 bg-[#1a2d4a]" />
            <span className="text-[11px] text-[#6b8ba8] capitalize" style={{ fontFamily: "'Share Tech Mono', monospace" }}>{today}</span>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            {byMonth.map(m => {
              const isCurrent = m.month === currentMonth;
              const progress  = m.tasks.length > 0 ? Math.round((m.done / m.tasks.length) * 100) : 0;

              return (
                <div key={m.month} id={`month-${m.month}`} className="mb-8">
                  {/* Заголовок месяца */}
                  <div className={`flex items-center gap-4 px-4 py-3 mb-3 border
                    ${isCurrent
                      ? "border-[rgba(245,158,11,0.3)] border-l-[3px] border-l-[#f59e0b] bg-[rgba(245,158,11,0.04)]"
                      : "border-[#1a2d4a] border-l-[3px] border-l-[#1a2d4a] bg-[#0a1220]"}`}
                  >
                    <span className={`text-[22px] font-bold tracking-widest ${isCurrent ? "text-[#f59e0b]" : "text-[#e2eaf4]"}`}
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                      {MONTHS_FULL[m.month].toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[#6b8ba8]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                      {m.tasks.length} мероприятий
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] text-[#f59e0b] tracking-widest" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                        ◉ ТЕКУЩИЙ МЕСЯЦ
                      </span>
                    )}
                    {m.critical > 0 && (
                      <span className="text-[9px] text-[#ef4444] tracking-widest" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                        ⚠ {m.critical} КРИТ
                      </span>
                    )}
                    {/* Прогресс месяца */}
                    <div className="ml-auto flex items-center gap-3">
                      <span className="text-[10px] text-[#6b8ba8]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                        {m.done}/{m.tasks.length}
                      </span>
                      <div className="w-24 h-[3px] bg-[#1a2d4a] rounded-sm overflow-hidden">
                        <div className="h-full rounded-sm" style={{ width: `${progress}%`, background: isCurrent ? "#f59e0b" : "#34d399" }} />
                      </div>
                      <span className={`text-[11px] font-bold ${isCurrent ? "text-[#f59e0b]" : "text-[#34d399]"}`}
                        style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                        {progress}%
                      </span>
                    </div>
                  </div>

                  {/* Задачи месяца — Timeline */}
                  <div className="ml-4 pl-5 border-l border-[#1a2d4a] space-y-2">
                    {m.tasks.map((task: typeof tasks.$inferSelect) => {
                      const cat      = CATEGORIES[task.category] ?? { icon: "•", color: "#6b8ba8" };
                      const priColor = PRIORITY_COLOR[task.priority as keyof typeof PRIORITY_COLOR] ?? "#6b8ba8";
                      const subs     = (task.subtasks as string[]) ?? [];
                      const date     = task.dateFrom === task.dateTo ? `${task.dateFrom}` : `${task.dateFrom}–${task.dateTo}`;
                      const isDone   = task.status === "done";

                      return (
                        <div key={task.id} className="relative">
                          {/* Маркер на timeline */}
                          <div className="absolute -left-[25px] top-3 w-2 h-2 rounded-full border border-[#060b14]"
                            style={{ background: isDone ? "#34d399" : priColor }} />

                          <div className={`border bg-[#0a1220] transition-all hover:bg-[#111f35] ${isDone ? "opacity-40" : ""}`}
                            style={{ borderColor: "#1a2d4a", borderLeft: `2px solid ${priColor}` }}
                          >
                            <div className="flex items-center gap-3 px-4 py-2.5">
                              <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-medium text-[#e2eaf4] truncate mb-0.5 ${isDone ? "line-through" : ""}`}>
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-2 text-[10px]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                  <span className="text-[#6b8ba8]">{MONTHS_SHORT[task.month]} {date}</span>
                                  <span className="px-1.5 py-px text-[9px]" style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}40` }}>
                                    {cat.icon} {task.category}
                                  </span>
                                  <span className="px-1.5 py-px text-[9px]" style={{ background: `${priColor}10`, color: priColor, border: `1px solid ${priColor}30` }}>
                                    {task.responsible}
                                  </span>
                                  {subs.length > 0 && <span className="text-[#3d5570]">/{subs.length} подзадач</span>}
                                </div>
                              </div>
                              {isDone && (
                                <span className="text-[10px] text-[#34d399]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>✓ ВЫПОЛНЕНО</span>
                              )}
                            </div>
                            {subs.length > 0 && (
                              <details>
                                <summary className="px-4 pb-1 pl-4 text-[10px] text-[#3d5570] cursor-pointer list-none hover:text-[#6b8ba8]"
                                  style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                  ▶ показать {subs.length} подзадач
                                </summary>
                                <div className="px-4 pb-3 pl-4 space-y-1">
                                  {subs.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[11px] text-[#6b8ba8] py-[3px] border-b border-[#1a2d4a]/50"
                                      style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                      <span className="text-[#3d5570] w-5 text-right text-[10px]">{String(i + 1).padStart(2, "0")}</span>
                                      <span>{s}</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}