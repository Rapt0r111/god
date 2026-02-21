// app/(dashboard)/page.tsx
import { db }    from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { isTaskDashboardCritical as isDashboardTaskCritical } from "@/lib/tasks/critical";

const MONTHS = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];

type DashboardTask = Awaited<ReturnType<typeof getStats>>["criticalTasks"][number];

async function getStats() {
  const allTasks = await db.select().from(tasks).orderBy(tasks.month, tasks.dateFrom);

  const total    = allTasks.length;
  const done     = allTasks.filter((t) => t.status === "done").length;
  const critical = allTasks.filter((t) => isDashboardTaskCritical(t)).length;

  const currentMonth  = new Date().getMonth() + 1;
  const thisMonth     = allTasks.filter((t) => t.month === currentMonth);
  const thisMonthDone = thisMonth.filter((t) => t.status === "done").length;

  const monthStats = Array.from({ length: 12 }, (_, i) => {
    const m = allTasks.filter((t) => t.month === i + 1);
    return {
      month:    i + 1,
      total:    m.length,
      done:     m.filter((t) => t.status === "done").length,
      critical: m.filter((t) => isDashboardTaskCritical(t)).length,
    };
  });

  const criticalTasks = allTasks
    .filter((t) => isDashboardTaskCritical(t))
    .sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      return a.dateTo - b.dateTo;
    })
    .slice(0, 6);

  return {
    total, done, critical,
    thisMonth: thisMonth.length, thisMonthDone,
    currentMonth, monthStats, criticalTasks,
  };
}

export default async function DashboardPage() {
  const {
    total, done, critical,
    thisMonth, thisMonthDone,
    currentMonth, monthStats, criticalTasks,
  } = await getStats();

  const readiness = total > 0 ? Math.round((done / total) * 100) : 0;
  const maxCount  = Math.max(...monthStats.map(m => m.total), 1);
  const gaugeColor = readiness < 30 ? "#ef4444" : readiness < 60 ? "#f59e0b" : "#10b981";
  const inProgress = Math.max(total - done - critical, 0);

  return (
    <div className="space-y-5">
      {/* Critical alert banner */}
      {critical > 0 && (
        <a
          href="/tasks?criticalOnly=1&autoMonthWindow=0"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer hover:brightness-110"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.28)",
            boxShadow: "0 4px 16px rgba(239,68,68,0.12)",
          }}
          title="Показать только критичные невыполненные задачи"
        >
          <span style={{ color: "#ef4444", fontSize: 16 }}>⚠</span>
          <span className="text-[12px]" style={{ color: "#fca5a5" }}>
            <span className="font-semibold">ВНИМАНИЕ: </span>
            {critical} критичных задач требуют немедленного исполнения
          </span>
          <span className="ml-auto text-[10px] font-mono" style={{ color: "rgba(252,165,165,0.8)" }}>
            Открыть фильтр →
          </span>
        </a>
      )}

      {/* ── BENTO GRID ── */}
      <div
        className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_300px]"
      >
        {/* KPI cards */}
        <KpiCard
          label="// Критичных задач"
          value={critical}
          color="#ef4444"
          colorBg="rgba(239,68,68,0.05)"
          colorBorder="rgba(239,68,68,0.15)"
          sub="не выполнено · требует решения"
          progress={0}
        />
        <KpiCard
          label={`// Задач в ${MONTHS[currentMonth]}`}
          value={thisMonth}
          color="#f59e0b"
          colorBg="rgba(245,158,11,0.05)"
          colorBorder="rgba(245,158,11,0.15)"
          sub={`${thisMonthDone} выполнено`}
          progress={thisMonth > 0 ? (thisMonthDone / thisMonth) * 100 : 0}
        />
        <KpiCard
          label="// Всего выполнено"
          value={done}
          color="#10b981"
          colorBg="rgba(16,185,129,0.05)"
          colorBorder="rgba(16,185,129,0.15)"
          sub={`${readiness}% · из ${total} задач за год`}
          progress={total > 0 ? (done / total) * 100 : 0}
        />

        {/* Gauge — spans 2 rows */}
        <div
          className="rounded-xl p-5 relative overflow-hidden xl:row-span-2"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 1px 0 var(--border-color) inset",
          }}
        >
          <p
            className="text-[9px] font-mono tracking-[2px] uppercase mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            // Оперативная готовность
          </p>
          <GaugeSvg value={readiness} color={gaugeColor} />
          <div className="mt-5 space-y-3">
            {[
              { label: "🔴 КРИТИЧНЫЕ",  value: critical },
              { label: "🟡 В РАБОТЕ",   value: inProgress },
              { label: "🟢 ВЫПОЛНЕНО",  value: done },
            ].map(row => (
              <div
                key={row.label}
                className="flex justify-between items-center"
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#1a2435",
                  border: "1px solid var(--border-color)",
                }}
              >
                <span className="text-[11px] font-mono" style={{ color: "var(--text-secondary)" }}>
                  {row.label}
                </span>
                <span className="text-[14px] font-bold font-mono tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly chart */}
        <div
          className="rounded-xl p-5 xl:col-span-3"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 1px 0 var(--border-color) inset",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] font-mono tracking-[2px] uppercase" style={{ color: "var(--text-secondary)" }}>
              // Годовой план · нагрузка по месяцам
            </p>
            <div className="flex items-center gap-3 text-[9px] font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full inline-block" style={{ background: "rgba(99,102,241,0.5)" }} />
                <span style={{ color: "var(--text-secondary)" }}>обычные</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full inline-block" style={{ background: "rgba(239,68,68,0.5)" }} />
                <span style={{ color: "var(--text-secondary)" }}>с критичными</span>
              </span>
            </div>
          </div>
          <div className="flex gap-1 items-end" style={{ height: 88 }}>
            {monthStats.map(m => {
              const h     = Math.round((m.total / maxCount) * 68);
              const isCur = m.month === currentMonth;
              return (
                <a
                  key={m.month}
                  href={`/tasks?month=${m.month}`}
                  className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-full flex flex-col justify-end" style={{ height: 68 }}>
                    {m.total > 0 && (
                      <div
                        className="w-full rounded-t transition-all group-hover:brightness-125"
                        style={{
                          height: h,
                          background: isCur
                            ? "linear-gradient(to top, #f59e0b, #fbbf24)"
                            : m.critical > 0
                              ? "linear-gradient(to top, rgba(239,68,68,0.55), rgba(239,68,68,0.15))"
                              : "linear-gradient(to top, rgba(99,102,241,0.45), rgba(59,130,246,0.12))",
                          border: isCur
                            ? "1px solid rgba(245,158,11,0.4)"
                            : m.critical > 0
                              ? "1px solid rgba(239,68,68,0.25)"
                              : "1px solid rgba(99,102,241,0.2)",
                          boxShadow: isCur ? "0 0 12px rgba(245,158,11,0.2)" : "none",
                          borderRadius: "4px 4px 0 0",
                        }}
                      />
                    )}
                  </div>
                  <span
                    className="text-[9px] font-mono tracking-wide"
                    style={{ color: isCur ? "#fbbf24" : "var(--text-secondary)" }}
                  >
                    {MONTHS[m.month]}
                  </span>
                  <span className="text-[8px] font-mono tabular-nums" style={{ color: "rgba(255,255,255,0.15)" }}>
                    {m.total}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Critical tasks list */}
        <div
          className="rounded-xl p-5 xl:col-span-3"
          style={{
            background: "linear-gradient(145deg, rgba(239,68,68,0.04), rgba(255,255,255,0.02))",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(239,68,68,0.12)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 1px 0 #1a2435 inset",
          }}
        >
          <p className="text-[9px] font-mono tracking-[2px] uppercase mb-4" style={{ color: "rgba(239,68,68,0.5)" }}>
            // Критичные задачи · требуют исполнения
          </p>
          {criticalTasks.length === 0 ? (
            <div className="text-center py-6" style={{ color: "rgba(16,185,129,0.5)" }}>
              <div className="text-2xl mb-2">✓</div>
              <p className="text-[12px] font-mono">Все критичные задачи выполнены</p>
            </div>
          ) : (
            <div className="space-y-2">
              {criticalTasks.map((task) => (
                <StaticTaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Recurring tasks */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 1px 0 var(--border-color) inset",
          }}
        >
          <p className="text-[9px] font-mono tracking-[2px] uppercase mb-4" style={{ color: "var(--text-secondary)" }}>
            // Постоянные задачи
          </p>
          {[
            { freq: "ЕЖН", label: "Рапорт в ЗГТ",             role: "ЗКВ-2" },
            { freq: "ЕЖН", label: "Проверка САВЗ",             role: "ЗКВ-2" },
            { freq: "ЕЖН", label: "Рапорт о ГДП",              role: "ЗКВ-2" },
            { freq: "ЕЖН", label: "Анализ электронной почты",  role: "КВ-2"  },
            { freq: "ЕМС", label: "Сверка личных планов",      role: "КВ-2"  },
            { freq: "ЕМС", label: "Сверка служебных карточек", role: "ЗКВ-2" },
            { freq: "ЕМС", label: "Дисциплинарная практика",   role: "ЗКВ-2" },
            { freq: "ЕМС", label: "Подведение итогов роты",    role: "ПС"    },
            { freq: "ЕМС", label: "Приказ № 85дсп",            role: "ЗКВ-2" },
          ].map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 py-2"
              style={{ borderBottom: i < 8 ? "1px solid #1a2435" : "none" }}
            >
              <span
                className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded"
                style={r.freq === "ЕЖН" ? {
                  background: "rgba(59,130,246,0.1)",
                  color: "#60a5fa",
                  border: "1px solid rgba(99,102,241,0.2)",
                } : {
                  background: "rgba(245,158,11,0.1)",
                  color: "#fbbf24",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                {r.freq}
              </span>
              <span className="flex-1 text-[11px] leading-tight" style={{ color: "rgba(255,255,255,0.6)" }}>
                {r.label}
              </span>
              <span className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
                {r.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── KpiCard ──────────────────────────────────────────────────────────────

function KpiCard({
  label, value, color, colorBg, colorBorder, sub, progress,
}: {
  label: string; value: number; color: string;
  colorBg: string; colorBorder: string; sub: string; progress: number;
}) {
  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden"
      style={{
        background: colorBg,
        border: `1px solid ${colorBorder}`,
        backdropFilter: "blur(20px)",
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 40px ${color}08`,
      }}
    >
      <p className="text-[9px] font-mono tracking-[2px] uppercase mb-3" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>
      <p
        className="text-[46px] font-bold leading-none mb-1.5 tabular-nums"
        style={{ color, textShadow: `0 0 40px ${color}50`, fontFamily: "var(--font-mono)" }}
      >
        {value}
      </p>
      <p className="text-[11px] mb-3 font-mono" style={{ color: "var(--text-secondary)" }}>
        {sub}
      </p>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border-color)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, background: color, boxShadow: `0 0 8px ${color}50` }}
        />
      </div>
    </div>
  );
}

// ── GaugeSvg ──────────────────────────────────────────────────────────────

function GaugeSvg({ value, color }: { value: number; color: string }) {
  const toRad = (a: number) => (a * Math.PI) / 180;
  const cx = 100, cy = 100, r = 75;
  const startAngle = -210, sweepAngle = 240;
  const endAngle = startAngle + sweepAngle * (value / 100);

  const arcPath = (start: number, sweep: number) => {
    const s = { x: cx + r * Math.cos(toRad(start)), y: cy + r * Math.sin(toRad(start)) };
    const e = { x: cx + r * Math.cos(toRad(start + sweep)), y: cy + r * Math.sin(toRad(start + sweep)) };
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
  };

  const needleX = cx + (r - 15) * Math.cos(toRad(endAngle));
  const needleY = cy + (r - 15) * Math.sin(toRad(endAngle));

  return (
    <div className="flex justify-center">
      <svg width="200" height="160" viewBox="0 0 200 160">
        <path d={arcPath(startAngle, sweepAngle)} fill="none" stroke="var(--border-color)" strokeWidth="10" strokeLinecap="round" />
        {value > 0 && (
          <path d={arcPath(startAngle, sweepAngle * value / 100)} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }} />
        )}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth="2" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        <circle cx={cx} cy={cy} r="6" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        <circle cx={cx} cy={cy} r="3" fill="#070d1a" />
        <text x={cx} y={cy + 46} textAnchor="middle" fill={color}
          style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 30, fontWeight: 700 }}>
          {value}%
        </text>
        <text x={cx} y={cy + 58} textAnchor="middle" fill="rgba(255,255,255,0.2)"
          style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8, letterSpacing: "2px" }}>
          ГОТОВНОСТЬ
        </text>
      </svg>
    </div>
  );
}

// ── Category & task row ───────────────────────────────────────────────────

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

function StaticTaskRow({ task }: { task: DashboardTask }) {
  const cat  = CATEGORY_META[task.category] ?? { icon: "•", color: "#94a3b8" };
  const date = task.dateFrom === task.dateTo ? `${task.dateFrom}` : `${task.dateFrom}–${task.dateTo}`;

  return (
    <a
      href={`/tasks?criticalOnly=1&month=${task.month}`}
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 group"
      style={{
        background: "rgba(239,68,68,0.04)",
        border: "1px solid rgba(239,68,68,0.12)",
      }}
      title="Открыть список критичных задач этого месяца"
    >
      <div
        className="w-4 h-4 rounded shrink-0"
        style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.02)" }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate mb-1" style={{ color: "var(--text-primary)", letterSpacing: "0.01em" }}>
          {task.title}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
            {MONTH_SHORT[task.month]} {date}
          </span>
          <span
            className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded"
            style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}25` }}
          >
            {cat.icon} {task.category}
          </span>
          <span
            className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            {task.responsible}
          </span>
        </div>
      </div>
      <span
        className="text-[12px] opacity-0 group-hover:opacity-60 transition-opacity"
        style={{ color: "#c7d2fe" }}
      >
        →
      </span>
    </a>
  );
}
