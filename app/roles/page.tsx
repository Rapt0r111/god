// src/app/roles/page.tsx
import { db }    from "@/lib/db";
import { tasks } from "@/lib/db/schema";

const ROLES = {
  "КНР":   { color: "#f59e0b", full: "Командир научной роты",    icon: "★" },
  "КВ-1":  { color: "#34d399", full: "Командир взвода 1",        icon: "◈" },
  "КВ-2":  { color: "#60a5fa", full: "Командир взвода 2",        icon: "◈" },
  "ЗКВ-1": { color: "#a78bfa", full: "Зам. командира взвода 1",  icon: "◇" },
  "ЗКВ-2": { color: "#f472b6", full: "Зам. командира взвода 2",  icon: "◇" },
  "ПС":    { color: "#fb923c", full: "Постоянный состав",        icon: "▣" },
  "СР":    { color: "#94a3b8", full: "Старшина роты",            icon: "▤" },
} as const;

const CATEGORIES: Record<string, { icon: string; color: string; label: string }> = {
  "Н":   { icon: "⚗",  color: "#34d399", label: "Наука"            },
  "А":   { icon: "📡", color: "#60a5fa", label: "Агитация"          },
  "БП":  { icon: "🎯", color: "#f87171", label: "Боевая подготовка" },
  "ПД":  { icon: "⚙",  color: "#f59e0b", label: "Повседн. деят."   },
  "ВПР": { icon: "🎖", color: "#a78bfa", label: "ВПР"              },
  "У":   { icon: "🏁", color: "#fb923c", label: "Увольнение"        },
  "П":   { icon: "🔰", color: "#22d3ee", label: "Призыв"           },
  "ЗиТ": { icon: "💻", color: "#94a3b8", label: "Техника"          },
  "ЕМ":  { icon: "📋", color: "#fbbf24", label: "Ежемесячные"      },
  "НД":  { icon: "🔬", color: "#34d399", label: "Научная деят."    },
  "МГ":  { icon: "⚡", color: "#ef4444", label: "Мобготовность"    },
};

const MONTHS_SHORT = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];
const PRIORITY_COLOR = { critical: "#ef4444", high: "#f59e0b", normal: "#34d399" } as const;

export default async function RolesPage() {
  const allTasks = await db.select().from(tasks).orderBy(tasks.month, tasks.dateFrom);
  const today    = new Date().toLocaleDateString("ru-RU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const roleStats = Object.entries(ROLES).map(([key, role]) => {
    const roleTasks: (typeof allTasks)[number][] = allTasks.filter((t: typeof allTasks[number]): t is typeof allTasks[number] => t.responsible === key);
    const done: number = roleTasks.filter(t => t.status === "done").length;
    const critical     = roleTasks.filter(t => t.priority === "critical" && t.status !== "done").length;
    const progress     = roleTasks.length > 0 ? Math.round((done / roleTasks.length) * 100) : 0;

    // Распределение по категориям
    const catBreakdown = Object.keys(CATEGORIES).map(cat => ({
      cat,
      count: roleTasks.filter(t => t.category === cat).length,
    })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

    // Ближайшие незавершённые задачи
    const upcoming = roleTasks
      .filter(t => t.status !== "done")
      .sort((a, b) => a.month - b.month || a.dateFrom - b.dateFrom)
      .slice(0, 3);

    return { key, ...role, roleTasks, done, critical, progress, catBreakdown, upcoming };
  });

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="flex h-screen overflow-hidden">

        {/* Sidebar */}
        <nav className="w-[220px] min-w-[220px] bg-[#0a1220] border-r border-[#1a2d4a] flex flex-col">
          <div className="px-4 pt-5 pb-4 border-b border-[#1a2d4a]">
            <p className="text-[9px] text-[#60a5fa] tracking-[3px] uppercase mb-1.5 opacity-70" style={{ fontFamily: "'Share Tech Mono', monospace" }}>// СИСТЕМА УПРАВЛЕНИЯ</p>
            <h1 className="text-[18px] font-bold tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif" }}>ЦСУ ПД</h1>
            <p className="text-[10px] text-[#f59e0b] mt-1 tracking-wide" style={{ fontFamily: "'Share Tech Mono', monospace" }}>НАУЧНАЯ РОТА · В/Ч</p>
          </div>
          <div className="flex-1 py-3">
            <p className="text-[9px] text-[#3d5570] tracking-[2px] px-4 py-2 uppercase" style={{ fontFamily: "'Share Tech Mono', monospace" }}>Навигация</p>
            {[
              { href: "/",         icon: "◈", label: "Дашборд"      },
              { href: "/tasks",    icon: "≡", label: "Задачи"        },
              { href: "/timeline", icon: "◫", label: "Хронология"    },
              { href: "/roles",    icon: "◉", label: "Личный состав", active: true },
            ].map(item => (
              <a key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-4 py-[9px] border-l-2 text-[13px] font-medium transition-all
                  ${(item as any).active
                    ? "border-[#60a5fa] bg-[rgba(96,165,250,0.08)] text-[#60a5fa]"
                    : "border-transparent text-[#6b8ba8] hover:bg-[#111f35] hover:text-[#e2eaf4]"}`}
              >
                <span className="text-[15px] w-5 text-center">{item.icon}</span>
                {item.label}
              </a>
            ))}

            {/* Быстрый переход к роли */}
            <p className="text-[9px] text-[#3d5570] tracking-[2px] px-4 pt-4 pb-2 uppercase" style={{ fontFamily: "'Share Tech Mono', monospace" }}>Роли</p>
            {roleStats.map(r => (
              <a key={r.key} href={`#role-${r.key}`}
                className="flex items-center justify-between px-4 py-1.5 transition-all hover:bg-[#111f35]"
              >
                <span className="text-[11px]" style={{ fontFamily: "'Share Tech Mono', monospace", color: r.color }}>{r.key}</span>
                <span className="text-[10px] text-[#3d5570]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>{r.roleTasks.length} зад.</span>
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
            <span className="text-[16px] font-bold tracking-wide uppercase" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Личный состав</span>
            <div className="w-px h-5 bg-[#1a2d4a]" />
            <span className="text-[11px] text-[#6b8ba8] capitalize" style={{ fontFamily: "'Share Tech Mono', monospace" }}>{today}</span>
            <div className="ml-auto">
              <span className="text-[10px] text-[#6b8ba8]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                {Object.keys(ROLES).length} должностей · {allTasks.length} задач
              </span>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">

            {/* Сводная таблица нагрузки */}
            <div className="mb-6 bg-[#0d1929] border border-[#1a2d4a] p-4">
              <p className="text-[9px] text-[#3d5570] tracking-[2px] uppercase mb-4" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                // СВОДНАЯ НАГРУЗКА ПО ДОЛЖНОСТЯМ
              </p>
              <div className="space-y-2">
                {roleStats.sort((a, b) => b.roleTasks.length - a.roleTasks.length).map(r => (
                  <div key={r.key} className="flex items-center gap-4">
                    <span className="w-14 text-[11px] font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: r.color }}>
                      {r.key}
                    </span>
                    <div className="flex-1 h-5 bg-[#0a1220] border border-[#1a2d4a] relative overflow-hidden">
                      <div className="absolute left-0 top-0 h-full transition-all duration-700"
                        style={{ width: `${r.roleTasks.length > 0 ? (r.done / r.roleTasks.length) * 100 : 0}%`, background: `${r.color}30` }} />
                      <div className="absolute left-0 top-0 h-full w-[2px]" style={{ background: r.color }} />
                      <span className="absolute left-3 top-0 bottom-0 flex items-center text-[10px] text-[#6b8ba8]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                        {r.done}/{r.roleTasks.length} задач
                      </span>
                      <span className="absolute right-3 top-0 bottom-0 flex items-center text-[11px] font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: r.color }}>
                        {r.progress}%
                      </span>
                    </div>
                    {r.critical > 0 && (
                      <span className="text-[10px] text-[#ef4444]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                        ⚠ {r.critical}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Карточки ролей */}
            <div className="grid grid-cols-2 gap-4">
              {roleStats.map(r => (
                <div key={r.key} id={`role-${r.key}`}
                  className="bg-[#0d1929] border border-[#1a2d4a] p-4 relative overflow-hidden"
                  style={{ borderLeft: `3px solid ${r.color}` }}
                >
                  {/* Заголовок */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-bold shrink-0"
                      style={{ background: `${r.color}15`, border: `2px solid ${r.color}40`, color: r.color, fontFamily: "'Rajdhani', sans-serif" }}>
                      {r.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[18px] font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", color: r.color }}>
                        {r.key}
                      </h3>
                      <p className="text-[10px] text-[#6b8ba8]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                        {r.full}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[28px] font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", color: r.color }}>
                        {r.progress}%
                      </span>
                    </div>
                  </div>

                  {/* Прогресс-бар */}
                  <div className="h-[3px] bg-[#0a1220] rounded-sm overflow-hidden mb-4">
                    <div className="h-full rounded-sm transition-all duration-700" style={{ width: `${r.progress}%`, background: r.color }} />
                  </div>

                  {/* Счётчики */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "ВСЕГО",     value: r.roleTasks.length, color: "#6b8ba8"  },
                      { label: "ВЫПОЛНЕНО", value: r.done,             color: "#34d399"  },
                      { label: "КРИТИЧНЫХ", value: r.critical,         color: "#ef4444"  },
                    ].map(stat => (
                      <div key={stat.label} className="bg-[#0a1220] border border-[#1a2d4a] p-2 text-center">
                        <p className="text-[18px] font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", color: stat.color }}>{stat.value}</p>
                        <p className="text-[8px] text-[#3d5570] tracking-wide" style={{ fontFamily: "'Share Tech Mono', monospace" }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Категории */}
                  {r.catBreakdown.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[9px] text-[#3d5570] tracking-widest uppercase mb-2" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                        Направления
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {r.catBreakdown.slice(0, 6).map(c => {
                          const meta = CATEGORIES[c.cat];
                          if (!meta) return null;
                          return (
                            <span key={c.cat} className="px-1.5 py-px text-[9px]"
                              style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}40`, fontFamily: "'Share Tech Mono', monospace" }}>
                              {meta.icon} {c.cat} ({c.count})
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Ближайшие задачи */}
                  {r.upcoming.length > 0 && (
                    <div>
                      <p className="text-[9px] text-[#3d5570] tracking-widest uppercase mb-2" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                        Ближайшие задачи
                      </p>
                      <div className="space-y-1">
                        {r.upcoming.map((task: typeof allTasks[number]) => {
                          const priColor = PRIORITY_COLOR[task.priority as keyof typeof PRIORITY_COLOR];
                          return (
                            <div key={task.id} className="flex items-center gap-2 py-1.5 border-b border-[#1a2d4a]/50">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: priColor }} />
                              <span className="text-[11px] text-[#e2eaf4] flex-1 truncate">{task.title}</span>
                              <span className="text-[9px] text-[#3d5570] shrink-0" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                                {MONTHS_SHORT[task.month]} {task.dateFrom}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {r.roleTasks.length === 0 && (
                    <p className="text-[11px] text-[#3d5570] text-center py-4" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                      // задачи не назначены
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}