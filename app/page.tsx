// src/app/page.tsx
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, sql, ne } from "drizzle-orm";
import { TaskCard } from "@/components/tasks/TaskCard";

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

  const gaugeColor = readiness < 30 ? "#ef4444" : readiness < 60 ? "#f59e0b" : "#34d399";

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#060b14] text-[#e2eaf4]" style={{ fontFamily: "'Exo 2', sans-serif" }}>

      {/* ── TOPBAR ───────────────────────────────── */}
      <header className="h-14 bg-[#0a1220] border-b border-[#1a2d4a] flex items-center px-6 gap-5">
        <span className="font-bold text-[16px] tracking-wide uppercase" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          Оперативный центр управления
        </span>
        <div className="w-px h-5 bg-[#1a2d4a]" />
        <span className="text-[11px] text-[#6b8ba8] capitalize" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
          {today}
        </span>
        {critical > 0 && (
          <span className="text-[10px] text-[#ef4444] tracking-widest" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
            ⚠ {critical} КРИ
          </span>
        )}
      </header>

      <div className="flex h-[calc(100vh-56px)]">

        {/* ── SIDEBAR ──────────────────────────────── */}
        <nav className="w-[220px] min-w-[220px] bg-[#0a1220] border-r border-[#1a2d4a] flex flex-col">
          <div className="px-4 pt-5 pb-4 border-b border-[#1a2d4a]">
            <p className="text-[9px] text-[#60a5fa] tracking-[3px] uppercase mb-1.5 opacity-70" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
              // СИСТЕМА УПРАВЛЕНИЯ
            </p>
            <h1 className="text-[18px] font-bold tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif" }}>ЦСУ ПД</h1>
            <p className="text-[10px] text-[#f59e0b] mt-1 tracking-wide" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
              НАУЧНАЯ РОТА · В/Ч
            </p>
          </div>

          <div className="flex-1 py-3 overflow-y-auto">
            <p className="text-[9px] text-[#3d5570] tracking-[2px] px-4 py-2 uppercase" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
              Навигация
            </p>
            {[
              { href: "/",         icon: "◈", label: "Дашборд",       active: true  },
              { href: "/tasks",    icon: "≡", label: "Задачи",        active: false },
              { href: "/timeline", icon: "◫", label: "Хронология",    active: false },
              { href: "/roles",    icon: "◉", label: "Личный состав", active: false },
            ].map(item => (
              <a key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-4 py-[9px] border-l-2 text-[13px] font-medium transition-all
                  ${item.active
                    ? "border-[#60a5fa] bg-[rgba(96,165,250,0.08)] text-[#60a5fa]"
                    : "border-transparent text-[#6b8ba8] hover:bg-[#111f35] hover:text-[#e2eaf4]"
                  }`}
              >
                <span className="text-[15px] w-5 text-center">{item.icon}</span>
                {item.label}
                {item.href === "/tasks" && critical > 0 && (
                  <span className="ml-auto bg-[#ef4444] text-white text-[9px] px-1.5 py-px rounded-sm" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                    !
                  </span>
                )}
              </a>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-[#1a2d4a] space-y-1.5">
            {[
              { color: "#34d399", label: "СИСТЕМА АКТИВНА",         delay: "0s"  },
              { color: "#f59e0b", label: "OFFLINE OK · LOCAL-FIRST", delay: "1s" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 text-[10px] text-[#3d5570]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: s.color, animationDelay: s.delay }} />
                {s.label}
              </div>
            ))}
          </div>
        </nav>

        {/* ── MAIN CONTENT ─────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-5 px-6">

          {/* Алерт критичных */}
          {critical > 0 && (
            <div className="flex items-center gap-3 px-3.5 py-2.5 mb-4 border border-l-[3px] border-[rgba(239,68,68,0.3)] border-l-[#ef4444] bg-[rgba(239,68,68,0.06)] text-[11px]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
              <span className="text-[#ef4444] text-sm">⚠</span>
              <span>
                <span className="text-[#ef4444] tracking-widest text-[9px] mr-1">ВНИМАНИЕ:</span>
                {critical} критичных задач без исполнения требуют немедленного внимания
              </span>
            </div>
          )}

          {/* ── BENTO GRID ─────────────────────────── */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr 1fr 300px", gridTemplateRows: "auto auto auto" }}>

            {/* KPI — Критичных */}
            <KpiCard
              label="// КРИТИЧНЫХ ЗАДАЧ"
              value={critical}
              color="#f87171"
              sub="не выполнено · требует решения"
              progress={0}
            />

            {/* KPI — Этот месяц */}
            <KpiCard
              label={`// ЗАДАЧ В ${MONTHS[currentMonth]}`}
              value={thisMonth}
              color="#f59e0b"
              sub={`${thisMonthDone} выполнено`}
              progress={thisMonth > 0 ? (thisMonthDone / thisMonth) * 100 : 0}
            />

            {/* KPI — Всего выполнено */}
            <KpiCard
              label="// ВСЕГО ВЫПОЛНЕНО"
              value={done}
              color="#34d399"
              sub={`из ${total} задач за год`}
              progress={total > 0 ? (done / total) * 100 : 0}
            />

            {/* Gauge — правая колонка, 2 строки */}
            <div className="row-span-2 bg-[#0d1929] border border-[#1a2d4a] p-4 relative overflow-hidden"
              style={{ borderTop: "1px solid transparent", backgroundImage: "linear-gradient(#0d1929,#0d1929), linear-gradient(to right, transparent, rgba(96,165,250,0.3), transparent)", backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box" }}
            >
              <p className="text-[9px] text-[#3d5570] tracking-[2px] uppercase mb-3" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                // ОПЕРАТИВНАЯ ГОТОВНОСТЬ
              </p>
              <GaugeSvg value={readiness} color={gaugeColor} />
              <div className="mt-4 space-y-2">
                {[
                  { label: "🔴 КРИТИЧНЫЕ", value: criticalTasks.length + critical },
                  { label: "🟡 ВЫСОКИЕ",   value: total - done - critical },
                  { label: "🟢 ВЫПОЛНЕНО", value: done },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-[10px] text-[#6b8ba8]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                    <span>{row.label}</span>
                    <span className="text-[#e2eaf4]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* График по месяцам */}
            <div className="col-span-3 bg-[#0d1929] border border-[#1a2d4a] p-4">
              <p className="text-[9px] text-[#3d5570] tracking-[2px] uppercase mb-3" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                // ГОДОВОЙ ПЛАН · НАГРУЗКА ПО МЕСЯЦАМ
              </p>
              <div className="flex gap-[3px] items-end h-[72px]">
                {monthStats.map(m => {
                  const h     = Math.round((m.total / maxCount) * 60);
                  const isCur = m.month === currentMonth;
                  return (
                    <a key={m.month} href={`/tasks?month=${m.month}`}
                      className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <div className="w-full flex flex-col justify-end" style={{ height: 60 }}>
                        {m.total > 0 && (
                          <div
                            className="w-full rounded-sm transition-all group-hover:opacity-80"
                            style={{
                              height: h,
                              background: isCur
                                ? "linear-gradient(to top, #f59e0b, #fbbf24)"
                                : m.critical > 0
                                  ? "linear-gradient(to top, rgba(239,68,68,0.5), #1a2d4a)"
                                  : "linear-gradient(to top, #1e3a5f, #0d1929)",
                              border: isCur ? "1px solid rgba(245,158,11,0.4)" : "1px solid #1a2d4a",
                            }}
                          />
                        )}
                      </div>
                      <span className="text-[9px] tracking-wide" style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        color: isCur ? "#f59e0b" : "#6b8ba8",
                      }}>
                        {MONTHS[m.month]}
                      </span>
                      <span className="text-[9px] text-[#3d5570]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                        {m.total}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Критичные задачи */}
            <div className="col-span-3 bg-[#0d1929] border border-[#1a2d4a] p-4">
              <p className="text-[9px] text-[#3d5570] tracking-[2px] uppercase mb-3" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                // КРИТИЧНЫЕ ЗАДАЧИ · ТРЕБУЮТ ИСПОЛНЕНИЯ
              </p>
              {criticalTasks.length === 0 ? (
                <p className="text-[12px] text-[#3d5570] text-center py-6" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
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
            <div className="bg-[#0d1929] border border-[#1a2d4a] p-4">
              <p className="text-[9px] text-[#3d5570] tracking-[2px] uppercase mb-3" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                // ПОСТОЯННЫЕ ЗАДАЧИ
              </p>
              {[
                { freq: "ЕЖН", label: "Рапорт в ЗГТ",          role: "ЗКВ-2" },
                { freq: "ЕЖН", label: "Проверка САВЗ",          role: "ЗКВ-2" },
                { freq: "ЕЖН", label: "Рапорт о ГДП",           role: "ЗКВ-2" },
                { freq: "ЕЖН", label: "Анализ электронной почты",role: "КВ-2"  },
                { freq: "ЕМС", label: "Сверка личных планов",    role: "КВ-2"  },
                { freq: "ЕМС", label: "Сверка служебных карточек",role:"ЗКВ-2" },
                { freq: "ЕМС", label: "Дисциплинарная практика", role: "ЗКВ-2" },
                { freq: "ЕМС", label: "Подведение итогов роты",  role: "ПС"    },
                { freq: "ЕМС", label: "Приказ № 85дсп",          role: "ЗКВ-2" },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-2 py-[6px] border-b border-[#1a2d4a] last:border-0 text-[#6b8ba8]" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10 }}>
                  <span className="px-1.5 py-px text-[8px] tracking-wide border"
                    style={r.freq === "ЕЖН"
                      ? { background: "rgba(96,165,250,0.1)",  color: "#60a5fa", borderColor: "rgba(96,165,250,0.3)"  }
                      : { background: "rgba(245,158,11,0.1)", color: "#f59e0b", borderColor: "rgba(245,158,11,0.3)" }
                    }
                  >
                    {r.freq}
                  </span>
                  <span className="flex-1 leading-tight">{r.label}</span>
                  <span className="text-[9px] text-[#3d5570]">{r.role}</span>
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

function KpiCard({ label, value, color, sub, progress }: {
  label: string; value: number; color: string; sub: string; progress: number;
}) {
  return (
    <div className="bg-[#0d1929] border border-[#1a2d4a] p-4 relative overflow-hidden"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <p className="text-[9px] text-[#3d5570] tracking-[2px] uppercase mb-2" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
        {label}
      </p>
      <p className="text-[40px] font-bold leading-none mb-1" style={{ fontFamily: "'Rajdhani', sans-serif", color, filter: `drop-shadow(0 0 8px ${color}40)` }}>
        {value}
      </p>
      <p className="text-[10px] text-[#6b8ba8] mb-2" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
        {sub}
      </p>
      <div className="h-[3px] bg-[#0a1220] rounded-sm overflow-hidden">
        <div className="h-full rounded-sm transition-all duration-700" style={{ width: `${progress}%`, background: color }} />
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
        <path d={arcPath(startAngle, sweepAngle)} fill="none" stroke="#1a2d4a" strokeWidth="12" strokeLinecap="round" />
        {value > 0 && (
          <path d={arcPath(startAngle, sweepAngle * value / 100)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }} />
        )}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill={color} />
        <circle cx={cx} cy={cy} r="3" fill="#060b14" />
        <text x={cx} y={cy + 24} textAnchor="middle" fill={color}
          style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 28, fontWeight: 700 }}>
          {value}%
        </text>
        <text x={cx} y={cy + 40} textAnchor="middle" fill="#3d5570"
          style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9 }}>
          ГОТОВНОСТЬ К ПРОВЕРКЕ
        </text>
      </svg>
    </div>
  );
}

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
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

const MONTH_SHORT = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];

function StaticTaskRow({ task }: { task: any }) {
  const cat  = CATEGORY_META[task.category] ?? { icon: "•", color: "#6b8ba8" };
  const date = task.dateFrom === task.dateTo ? `${task.dateFrom}` : `${task.dateFrom}–${task.dateTo}`;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border border-[#1a2d4a] bg-[#0a1220] relative"
      style={{ borderLeft: "3px solid #ef4444" }}
    >
      <div className="w-[18px] h-[18px] min-w-[18px] border border-[#1e3a5f]" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[#e2eaf4] truncate mb-0.5">{task.title}</p>
        <div className="flex items-center gap-2 text-[10px] text-[#3d5570]" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
          <span className="text-[#6b8ba8]">{MONTH_SHORT[task.month]} {date}</span>
          <span className="px-1.5 py-px text-[9px]" style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}40` }}>
            {cat.icon} {task.category}
          </span>
          <span className="px-1.5 py-px text-[9px] text-[#ef4444]" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            {task.responsible}
          </span>
        </div>
      </div>
    </div>
  );
}