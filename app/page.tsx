// src/app/page.tsx
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";

const MONTHS = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];

async function getStats() {
  const allTasks = await db.select().from(tasks).orderBy(tasks.month, tasks.dateFrom);

  const total    = allTasks.length;
  const done     = allTasks.filter((t: typeof allTasks[number]) => t.status === "done").length;
  const critical = allTasks.filter((t: typeof allTasks[number]) => t.priority === "critical" && t.status !== "done").length;

  const currentMonth = new Date().getMonth() + 1;
  const thisMonth    = allTasks.filter((t: typeof allTasks[number]) => t.month === currentMonth);
  const thisMonthDone= thisMonth.filter((t: typeof allTasks[number]) => t.status === "done").length;

  const monthStats = Array.from({ length: 12 }, (_, i) => {
    const m = allTasks.filter((t: typeof allTasks[number]) => t.month === i + 1);
    return {
      month:    i + 1,
      total:    m.length,
      done:     m.filter((t: typeof allTasks[number]) => t.status === "done").length,
      critical: m.filter((t: typeof allTasks[number]) => t.priority === "critical").length,
    };
  });

  const criticalTasks = allTasks
    .filter((t: typeof allTasks[number]) => t.priority === "critical" && t.status !== "done")
    .slice(0, 6);

  return { total, done, critical, thisMonth: thisMonth.length, thisMonthDone, currentMonth, monthStats, criticalTasks, allTasks };
}

export default async function DashboardPage() {
  const { total, done, critical, thisMonth, thisMonthDone, currentMonth, monthStats, criticalTasks } = await getStats();

  const readiness  = total > 0 ? Math.round((done / total) * 100) : 0;
  const maxCount   = Math.max(...monthStats.map(m => m.total), 1);

  const gaugeColor = readiness < 30 ? "#ef4444" : readiness < 60 ? "#f59e0b" : "#10b981";

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">

      {/* ── TOPBAR ───────────────────────────────── */}
      <header className="h-14 glass-elevated border-b border-white/10 flex items-center px-6 gap-5">
        <span className="font-bold text-[16px] tracking-wide uppercase text-white">
          Оперативный центр управления
        </span>
        <div className="w-px h-5 bg-white/20" />
        <span className="text-[11px] text-white/50 capitalize font-mono">
          {today}
        </span>
        {critical > 0 && (
          <span className="text-[10px] text-red-400 tracking-widest font-mono">
            ⚠ {critical} КРИ
          </span>
        )}
      </header>

      <div className="flex h-[calc(100vh-56px)]">

        {/* ── SIDEBAR ──────────────────────────────── */}
        <nav className="w-[220px] min-w-[220px] glass-elevated border-r border-white/10 flex flex-col">
          <div className="px-5 pt-6 pb-5 border-b border-white/10">
            <p className="text-[10px] text-blue-400/70 tracking-[3px] uppercase mb-2 font-mono">
              // СИСТЕМА УПРАВЛЕНИЯ
            </p>
            <h1 className="text-[20px] font-bold tracking-wide">ЦСУ ПД</h1>
            <p className="text-[11px] text-amber-400/80 mt-1 tracking-wide font-mono">
              НАУЧНАЯ РОТА · В/Ч
            </p>
          </div>

          <div className="flex-1 py-4 overflow-y-auto">
            <p className="text-[9px] text-white/30 tracking-[2px] px-5 py-2 uppercase font-mono">
              Навигация
            </p>
            {[
              { href: "/",         icon: "◈", label: "Дашборд",       active: true  },
              { href: "/tasks",    icon: "≡", label: "Задачи",        active: false },
              { href: "/timeline", icon: "◫", label: "Хронология",    active: false },
              { href: "/roles",    icon: "◉", label: "Личный состав", active: false },
            ].map(item => (
              <a key={item.href} href={item.href}
                className={[
                  "flex items-center gap-3 px-5 py-2.5 mx-2 rounded-lg text-[13px] font-medium transition-all",
                  item.active
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                    : "text-white/60 hover:bg-white/8 hover:text-white",
                ].join(" ")}
              >
                <span className="text-[15px] w-5 text-center">{item.icon}</span>
                {item.label}
                {item.href === "/tasks" && critical > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-mono">
                    {critical}
                  </span>
                )}
              </a>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-white/10 space-y-2">
            {[
              { color: "#10b981", label: "СИСТЕМА АКТИВНА",         delay: "0s"  },
              { color: "#f59e0b", label: "OFFLINE OK · LOCAL-FIRST", delay: "1s" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 text-[10px] text-white/30 font-mono">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: s.color, animationDelay: s.delay }} />
                {s.label}
              </div>
            ))}
          </div>
        </nav>

        {/* ── MAIN CONTENT ─────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* Алерт критичных */}
          {critical > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 mb-5 rounded-xl border border-red-500/20 bg-red-500/8 text-[12px] text-red-300">
              <span className="text-red-400 text-base">⚠</span>
              <span>
                <span className="text-red-400 font-semibold mr-1">ВНИМАНИЕ:</span>
                {critical} критичных задач без исполнения требуют немедленного внимания
              </span>
            </div>
          )}

          {/* ── BENTO GRID ─────────────────────────── */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr 1fr 300px", gridTemplateRows: "auto auto auto" }}>

            {/* KPI карточки */}
            <KpiCard
              label="// КРИТИЧНЫХ ЗАДАЧ"
              value={critical}
              color="#ef4444"
              colorBg="rgba(239,68,68,0.08)"
              colorBorder="rgba(239,68,68,0.2)"
              sub="не выполнено · требует решения"
              progress={0}
            />
            <KpiCard
              label={`// ЗАДАЧ В ${MONTHS[currentMonth]}`}
              value={thisMonth}
              color="#f59e0b"
              colorBg="rgba(245,158,11,0.08)"
              colorBorder="rgba(245,158,11,0.2)"
              sub={`${thisMonthDone} выполнено`}
              progress={thisMonth > 0 ? (thisMonthDone / thisMonth) * 100 : 0}
            />
            <KpiCard
              label="// ВСЕГО ВЫПОЛНЕНО"
              value={done}
              color="#10b981"
              colorBg="rgba(16,185,129,0.08)"
              colorBorder="rgba(16,185,129,0.2)"
              sub={`из ${total} задач за год`}
              progress={total > 0 ? (done / total) * 100 : 0}
            />

            {/* Gauge — правая колонка, 2 строки */}
            <div className="row-span-2 glass-elevated rounded-xl border border-white/10 p-5 relative overflow-hidden">
              <p className="text-[9px] text-white/40 tracking-[2px] uppercase mb-4 font-mono">
                // ОПЕРАТИВНАЯ ГОТОВНОСТЬ
              </p>
              <GaugeSvg value={readiness} color={gaugeColor} />
              <div className="mt-5 space-y-2.5">
                {[
                  { label: "🔴 КРИТИЧНЫЕ", value: critical },
                  { label: "🟡 ВЫСОКИЕ",   value: total - done - critical },
                  { label: "🟢 ВЫПОЛНЕНО", value: done },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-[11px] text-white/50 font-mono">
                    <span>{row.label}</span>
                    <span className="text-white font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* График по месяцам */}
            <div className="col-span-3 glass-elevated rounded-xl border border-white/10 p-5">
              <p className="text-[9px] text-white/40 tracking-[2px] uppercase mb-4 font-mono">
                // ГОДОВОЙ ПЛАН · НАГРУЗКА ПО МЕСЯЦАМ
              </p>
              <div className="flex gap-[3px] items-end h-[80px]">
                {monthStats.map(m => {
                  const h     = Math.round((m.total / maxCount) * 64);
                  const isCur = m.month === currentMonth;
                  return (
                    <a key={m.month} href={`/tasks?month=${m.month}`}
                      className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <div className="w-full flex flex-col justify-end" style={{ height: 64 }}>
                        {m.total > 0 && (
                          <div
                            className="w-full rounded-t-sm transition-all group-hover:opacity-80"
                            style={{
                              height: h,
                              background: isCur
                                ? "linear-gradient(to top, #f59e0b, #fbbf24)"
                                : m.critical > 0
                                  ? "linear-gradient(to top, rgba(239,68,68,0.5), rgba(239,68,68,0.15))"
                                  : "linear-gradient(to top, rgba(59,130,246,0.4), rgba(59,130,246,0.1))",
                              border: isCur ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(255,255,255,0.08)",
                            }}
                          />
                        )}
                      </div>
                      <span className="text-[9px] font-mono tracking-wide" style={{
                        color: isCur ? "#f59e0b" : "rgba(255,255,255,0.3)",
                      }}>
                        {MONTHS[m.month]}
                      </span>
                      <span className="text-[9px] text-white/20 font-mono">
                        {m.total}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Критичные задачи */}
            <div className="col-span-3 glass-elevated rounded-xl border border-white/10 p-5">
              <p className="text-[9px] text-white/40 tracking-[2px] uppercase mb-4 font-mono">
                // КРИТИЧНЫЕ ЗАДАЧИ · ТРЕБУЮТ ИСПОЛНЕНИЯ
              </p>
              {criticalTasks.length === 0 ? (
                <p className="text-[12px] text-white/30 text-center py-6 font-mono">
                  // ВСЕ КРИТИЧНЫЕ ЗАДАЧИ ВЫПОЛНЕНЫ ✓
                </p>
              ) : (
                <div className="space-y-2">
                  {criticalTasks.map((task: typeof criticalTasks[number]) => (
                    <StaticTaskRow key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>

            {/* Постоянные задачи */}
            <div className="glass-elevated rounded-xl border border-white/10 p-5">
              <p className="text-[9px] text-white/40 tracking-[2px] uppercase mb-4 font-mono">
                // ПОСТОЯННЫЕ ЗАДАЧИ
              </p>
              {[
                { freq: "ЕЖН", label: "Рапорт в ЗГТ",           role: "ЗКВ-2" },
                { freq: "ЕЖН", label: "Проверка САВЗ",           role: "ЗКВ-2" },
                { freq: "ЕЖН", label: "Рапорт о ГДП",            role: "ЗКВ-2" },
                { freq: "ЕЖН", label: "Анализ электронной почты", role: "КВ-2"  },
                { freq: "ЕМС", label: "Сверка личных планов",     role: "КВ-2"  },
                { freq: "ЕМС", label: "Сверка служебных карточек",role: "ЗКВ-2" },
                { freq: "ЕМС", label: "Дисциплинарная практика",  role: "ЗКВ-2" },
                { freq: "ЕМС", label: "Подведение итогов роты",   role: "ПС"    },
                { freq: "ЕМС", label: "Приказ № 85дсп",           role: "ЗКВ-2" },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2 border-b border-white/5 last:border-0 text-white/50">
                  <span className="px-1.5 py-0.5 text-[9px] tracking-wide rounded font-mono"
                    style={r.freq === "ЕЖН"
                      ? { background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)"  }
                      : { background: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)" }
                    }
                  >
                    {r.freq}
                  </span>
                  <span className="flex-1 text-[11px] leading-tight text-white/70">{r.label}</span>
                  <span className="text-[10px] text-white/30 font-mono">{r.role}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Вспомогательные компоненты ──────────────────────

function KpiCard({ label, value, color, colorBg, colorBorder, sub, progress }: {
  label: string; value: number; color: string; colorBg: string; colorBorder: string; sub: string; progress: number;
}) {
  return (
    <div
      className="glass-elevated rounded-xl p-5 relative overflow-hidden"
      style={{ border: `1px solid ${colorBorder}`, background: colorBg }}
    >
      <p className="text-[9px] text-white/40 tracking-[2px] uppercase mb-3 font-mono">
        {label}
      </p>
      <p className="text-[44px] font-bold leading-none mb-1.5" style={{ color, filter: `drop-shadow(0 0 12px ${color}40)` }}>
        {value}
      </p>
      <p className="text-[11px] text-white/50 mb-3 font-mono">{sub}</p>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: color }} />
      </div>
    </div>
  );
}

function GaugeSvg({ value, color }: { value: number; color: string }) {
  const toRad = (a: number) => (a * Math.PI) / 180;
  const cx = 100, cy = 100, r = 78;
  const startAngle = -210, sweepAngle = 240;
  const endAngle = startAngle + sweepAngle * (value / 100);

  const arcPath = (start: number, sweep: number) => {
    const s = { x: cx + r * Math.cos(toRad(start)), y: cy + r * Math.sin(toRad(start)) };
    const e = { x: cx + r * Math.cos(toRad(start + sweep)), y: cy + r * Math.sin(toRad(start + sweep)) };
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
  };

  const needleX = cx + (r - 18) * Math.cos(toRad(endAngle));
  const needleY = cy + (r - 18) * Math.sin(toRad(endAngle));

  return (
    <div className="flex justify-center">
      <svg width="200" height="160" viewBox="0 0 200 160">
        <path d={arcPath(startAngle, sweepAngle)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
        {value > 0 && (
          <path d={arcPath(startAngle, sweepAngle * value / 100)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }} />
        )}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill={color} />
        <circle cx={cx} cy={cy} r="3" fill="#0f172a" />
        <text x={cx} y={cy + 26} textAnchor="middle" fill={color}
          style={{ fontFamily: "Inter, sans-serif", fontSize: 30, fontWeight: 700 }}>
          {value}%
        </text>
        <text x={cx} y={cy + 42} textAnchor="middle" fill="rgba(255,255,255,0.3)"
          style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9 }}>
          ГОТОВНОСТЬ К ПРОВЕРКЕ
        </text>
      </svg>
    </div>
  );
}

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

const MONTH_SHORT = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];

function StaticTaskRow({ task }: { task: any }) {
  const cat  = CATEGORY_META[task.category] ?? { icon: "•", color: "#94a3b8" };
  const date = task.dateFrom === task.dateTo ? `${task.dateFrom}` : `${task.dateFrom}–${task.dateTo}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/15 bg-red-500/5 hover:bg-red-500/8 transition-colors">
      <div className="w-[18px] h-[18px] min-w-[18px] border border-white/20 rounded-sm" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-white truncate mb-1">{task.title}</p>
        <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
          <span className="text-white/50">{MONTH_SHORT[task.month]} {date}</span>
          <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }}>
            {cat.icon} {task.category}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
            {task.responsible}
          </span>
        </div>
      </div>
    </div>
  );
}