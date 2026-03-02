"use client";

// components/timeline/TimelineClient.tsx — Vision 2026 · Gantt Timeline

import { useState, useMemo, useRef, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────

type Task = {
  id: number;
  title: string;
  category: string;
  month: number;
  dateFrom: number;
  dateTo: number;
  responsible: string;
  status: "pending" | "in_progress" | "done" | "cancelled";
  priority: "critical" | "high" | "normal";
  description?: string | null;
  notes?: string | null;
};

// ── Constants ─────────────────────────────────────────────────────────

const MONTHS_FULL  = ["","Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const MONTHS_SHORT = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];

const DAYS_IN_MONTH = [0,31,28,31,30,31,30,31,31,30,31,30,31];

const CAT_META: Record<string, { icon: string; color: string; label: string }> = {
  "Н":   { icon: "⚗",  color: "oklch(72% 0.17 152)", label: "Наука"            },
  "А":   { icon: "📡", color: "oklch(70% 0.15 230)", label: "Агитация"         },
  "БП":  { icon: "🎯", color: "oklch(67% 0.21 22)",  label: "Боевая подготовка" },
  "ПД":  { icon: "⚙",  color: "oklch(74% 0.18 68)",  label: "Повседн. деят."   },
  "ВПР": { icon: "🎖", color: "oklch(68% 0.18 288)", label: "ВПР"              },
  "У":   { icon: "🏁", color: "oklch(74% 0.17 60)",  label: "Увольнение"       },
  "П":   { icon: "🔰", color: "oklch(70% 0.15 210)", label: "Призыв"           },
  "ЗиТ": { icon: "💻", color: "oklch(62% 0.06 258)", label: "Техника"          },
  "ЕМ":  { icon: "📋", color: "oklch(74% 0.18 68)",  label: "Ежемесячные"      },
  "НД":  { icon: "🔬", color: "oklch(72% 0.17 152)", label: "Научная деят."    },
  "МГ":  { icon: "⚡", color: "oklch(67% 0.21 22)",  label: "Мобготовность"    },
};

const PRI_META: Record<string, { color: string; label: string }> = {
  critical: { color: "oklch(67% 0.21 22)",  label: "Критический" },
  high:     { color: "oklch(74% 0.18 68)",  label: "Высокий"     },
  normal:   { color: "oklch(68% 0.18 288)", label: "Нормальный"  },
};

const ST_META: Record<string, { label: string; color: string }> = {
  pending:     { label: "Ожидает",   color: "var(--tx-3)"              },
  in_progress: { label: "В работе",  color: "oklch(74% 0.18 68)"       },
  done:        { label: "Выполнено", color: "oklch(72% 0.17 152)"      },
  cancelled:   { label: "Отменено",  color: "oklch(50% 0.06 258)"     },
};

// ── Helpers ───────────────────────────────────────────────────────────

function getBarColor(task: Task): { fill: string; stroke: string; glow: string } {
  const isDone      = task.status === "done";
  const isCancelled = task.status === "cancelled";
  if (isDone)      return { fill: "oklch(72% 0.17 152 / 0.55)", stroke: "oklch(72% 0.17 152 / 0.80)", glow: "oklch(72% 0.17 152 / 0.30)" };
  if (isCancelled) return { fill: "oklch(50% 0.06 258 / 0.30)", stroke: "oklch(50% 0.06 258 / 0.50)", glow: "transparent" };
  const c = CAT_META[task.category]?.color ?? PRI_META[task.priority]?.color ?? "oklch(68% 0.18 288)";
  return {
    fill:   `${c.replace(")", " / 0.40)")}`,
    stroke: `${c.replace(")", " / 0.80)")}`,
    glow:   `${c.replace(")", " / 0.25)")}`,
  };
}

function daysInMonth(m: number): number {
  return DAYS_IN_MONTH[m] ?? 30;
}

function isOverdue(task: Task): boolean {
  const now = new Date();
  const curM = now.getMonth() + 1;
  const curD = now.getDate();
  if (task.status === "done" || task.status === "cancelled") return false;
  if (task.month < curM) return true;
  if (task.month === curM && task.dateTo < curD) return true;
  return false;
}

// ── Tooltip ───────────────────────────────────────────────────────────

function Tooltip({
  task, x, y, containerRef,
}: {
  task: Task; x: number; y: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const cat = CAT_META[task.category] ?? { icon: "•", color: "var(--tx-3)", label: task.category };
  const pri = PRI_META[task.priority] ?? PRI_META.normal;
  const st  = ST_META[task.status]    ?? ST_META.pending;
  const dur = task.dateTo - task.dateFrom + 1;
  const overdue = isOverdue(task);

  // Position relative to container
  // eslint-disable-next-line react-hooks/refs
  const rect = containerRef.current?.getBoundingClientRect();
  const px = rect ? x - rect.left : x;
  const py = rect ? y - rect.top  : y;

  // Keep within bounds
  const tipW = 240;
  const left = Math.min(Math.max(px - tipW / 2, 8), (rect?.width ?? 800) - tipW - 8);
  const top  = py - 10;

  return (
    <div
      style={{
        position: "absolute",
        left, top,
        transform: "translateY(-100%)",
        width: tipW, zIndex: 50,
        padding: "13px 15px",
        borderRadius: 16,
        background: "oklch(22% 0.030 268 / 0.98)",
        border: `1px solid ${cat.color.replace(")", " / 0.28)")}`,
        boxShadow: `0 12px 40px oklch(0% 0 0 / 0.55), 0 0 0 1px oklch(100% 0 0 / 0.05) inset`,
        animation: "fadeUp 0.18s ease forwards",
        pointerEvents: "none",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14,
          background: `${cat.color.replace(")", " / 0.15)")}`,
          border: `1px solid ${cat.color.replace(")", " / 0.28)")}`,
        }}>
          {cat.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, color: "var(--tx-1)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            marginBottom: 2,
            textDecoration: task.status === "done" ? "line-through" : "none",
          }}>
            {task.title}
          </p>
          <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)" }}>
            {task.responsible}
          </p>
        </div>
      </div>

      {/* Info rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {[
          { label: "Период",     val: `${task.dateFrom === task.dateTo ? task.dateFrom : `${task.dateFrom}–${task.dateTo}`} ${MONTHS_SHORT[task.month]} · ${dur} ${dur === 1 ? "день" : dur < 5 ? "дня" : "дней"}`, color: "var(--tx-2)" },
          { label: "Статус",     val: st.label,   color: st.color  },
          { label: "Приоритет",  val: pri.label,  color: pri.color },
          { label: "Категория",  val: `${cat.icon} ${cat.label}`, color: cat.color },
          overdue ? { label: "⚡ Внимание",  val: "Просрочена!", color: "oklch(67% 0.21 22)" } : null,
        ].filter(Boolean).map((row) => (
          <div key={row!.label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)", flexShrink: 0 }}>{row!.label}</span>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600, color: row!.color, textAlign: "right" }}>{row!.val}</span>
          </div>
        ))}
      </div>

      {/* Task description preview */}
      {task.description && (
        <p style={{
          marginTop: 10, paddingTop: 8,
          borderTop: "1px solid var(--bd-1)",
          fontSize: 11, lineHeight: 1.6,
          color: "var(--tx-3)",
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
        }}>
          {task.description}
        </p>
      )}
    </div>
  );
}

// ── Month Gantt Panel ─────────────────────────────────────────────────

function MonthPanel({
  month, tasks, today, onHover,
}: {
  month: number;
  tasks: Task[];
  today: { month: number; day: number };
  onHover: (task: Task | null, x: number, y: number) => void;
}) {
  const days    = daysInMonth(month);
  const isCurM  = month === today.month;
  const hasOver = tasks.some(isOverdue);
  const done    = tasks.filter(t => t.status === "done").length;
  const pct     = Math.round((done / tasks.length) * 100);

  // Day columns width: each day = 1 fraction
  const totalCols = days;

  return (
    <div style={{ display: "flex", gap: 0 }}>
      {/* Month label column */}
      <div style={{
        width: 110, flexShrink: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "flex-start",
        paddingRight: 14, paddingTop: 12,
        borderRight: "1px solid var(--bd-1)",
      }}>
        <p style={{
          fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)",
          letterSpacing: "0.06em", textTransform: "uppercase",
          color: isCurM ? "oklch(74% 0.18 68)" : hasOver ? "oklch(67% 0.21 22)" : "var(--tx-2)",
          marginBottom: 4,
        }}>
          {MONTHS_SHORT[month]}
        </p>
        <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)", marginBottom: 8 }}>
          {tasks.length} задач
        </p>
        {/* Mini progress */}
        <div style={{ height: 3, borderRadius: 3, overflow: "hidden", background: "oklch(100% 0 0 / 0.07)", marginBottom: 3, width: 60 }}>
          <div style={{
            height: "100%", width: `${pct}%`, borderRadius: 3,
            background: pct === 100 ? "var(--success)" : "oklch(68% 0.18 288 / 0.80)",
          }} />
        </div>
        <p style={{ fontSize: 8, fontFamily: "var(--font-mono)", color: pct === 100 ? "var(--success)" : "var(--tx-4)" }}>
          {done}/{tasks.length}
        </p>
      </div>

      {/* Gantt area */}
      <div style={{ flex: 1, minWidth: 0, padding: "0 0 0 0" }}>
        {/* Day ruler */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
          height: 22, borderBottom: "1px solid var(--bd-1)",
          paddingLeft: 12,
        }}>
          {Array.from({ length: days }, (_, i) => {
            const d    = i + 1;
            const isTod = isCurM && d === today.day;
            const show = d === 1 || d % 5 === 0 || d === days;
            return (
              <div key={d} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                {show && (
                  <span style={{
                    fontSize: 8, fontFamily: "var(--font-mono)",
                    color: isTod ? "oklch(74% 0.18 68)" : "var(--tx-4)",
                    fontWeight: isTod ? 700 : 400,
                    position: "absolute",
                  }}>
                    {d}
                  </span>
                )}
                {isTod && (
                  <div style={{
                    position: "absolute",
                    top: 0, bottom: -9999,
                    width: 1,
                    background: "oklch(74% 0.18 68 / 0.30)",
                    zIndex: 1,
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Task bars */}
        <div style={{ padding: "6px 0 10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {tasks.map(task => {
            const col    = getBarColor(task);
            const isDone = task.status === "done";
            const isCan  = task.status === "cancelled";
            const over   = isOverdue(task);
            const cat    = CAT_META[task.category] ?? { icon: "•", color: "var(--tx-3)", label: task.category };

            const startFrac = (task.dateFrom - 1) / totalCols;
            const endFrac   = task.dateTo / totalCols;
            const widthFrac = endFrac - startFrac;

            return (
              <div
                key={task.id}
                style={{
                  height: 26,
                  display: "grid",
                  gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
                  position: "relative",
                  alignItems: "center",
                }}
              >
                {/* Today line within row */}
                {isCurM && (
                  <div style={{
                    position: "absolute",
                    left: `${((today.day - 0.5) / totalCols) * 100}%`,
                    top: 0, bottom: 0, width: 1,
                    background: "oklch(74% 0.18 68 / 0.20)",
                    zIndex: 0, pointerEvents: "none",
                  }} />
                )}

                {/* Bar */}
                <div
                  onMouseEnter={e => onHover(task, e.clientX, e.clientY)}
                  onMouseLeave={() => onHover(null, 0, 0)}
                  onMouseMove={e => onHover(task, e.clientX, e.clientY)}
                  style={{
                    gridColumn: `${task.dateFrom} / ${task.dateTo + 1}`,
                    height: "100%",
                    borderRadius: 7,
                    position: "relative",
                    cursor: "pointer",
                    background: col.fill,
                    border: `1px solid ${col.stroke}`,
                    boxShadow: over && !isDone ? `0 0 10px ${col.glow}` : "none",
                    opacity: isCan ? 0.40 : 1,
                    overflow: "hidden",
                    display: "flex", alignItems: "center",
                    padding: "0 7px",
                    gap: 5,
                    transition: "filter 0.15s ease, box-shadow 0.15s ease",
                    zIndex: 2,
                  }}
                  onMouseOverCapture={e => {
                    (e.currentTarget as HTMLDivElement).style.filter = "brightness(1.30)";
                    (e.currentTarget as HTMLDivElement).style.zIndex = "10";
                  }}
                  onMouseMoveCapture={e => {
                    (e.currentTarget as HTMLDivElement).style.filter = "brightness(1)";
                    (e.currentTarget as HTMLDivElement).style.zIndex = "2";
                  }}
                >
                  {/* Done stripe pattern */}
                  {isDone && (
                    <div style={{
                      position: "absolute", inset: 0,
                      backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, oklch(72% 0.17 152 / 0.08) 4px, oklch(72% 0.17 152 / 0.08) 8px)",
                      pointerEvents: "none",
                    }} />
                  )}

                  {/* Overdue pulse */}
                  {over && (
                    <div style={{
                      position: "absolute", inset: 0,
                      borderRadius: 7,
                      boxShadow: "inset 0 0 0 1.5px oklch(67% 0.21 22 / 0.70)",
                      animation: "pulse 2s ease-in-out infinite",
                      pointerEvents: "none",
                    }} />
                  )}

                  {/* Cat icon (if bar wide enough) */}
                  {widthFrac > 0.05 && (
                    <span style={{ fontSize: 11, flexShrink: 0, lineHeight: 1 }}>{cat.icon}</span>
                  )}

                  {/* Title (if bar wide enough) */}
                  {widthFrac > 0.12 && (
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      color: isDone ? "var(--tx-4)" : "var(--tx-1)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      textDecoration: isDone ? "line-through" : "none",
                      lineHeight: 1.2,
                    }}>
                      {task.title}
                    </span>
                  )}

                  {/* Done checkmark */}
                  {isDone && (
                    <span style={{
                      marginLeft: "auto", fontSize: 10, color: "var(--success)", flexShrink: 0,
                    }}>
                      ✓
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────

function Legend() {
  const items = [
    { color: "oklch(68% 0.18 288 / 0.55)", border: "oklch(68% 0.18 288 / 0.80)", label: "Ожидает" },
    { color: "oklch(74% 0.18 68 / 0.50)",  border: "oklch(74% 0.18 68 / 0.80)",  label: "В работе" },
    { color: "oklch(72% 0.17 152 / 0.50)", border: "oklch(72% 0.17 152 / 0.80)", label: "Выполнено", stripe: true },
    { color: "oklch(67% 0.21 22 / 0.40)",  border: "oklch(67% 0.21 22 / 0.80)",  label: "Просрочено", pulse: true },
    { color: "oklch(50% 0.06 258 / 0.25)", border: "oklch(50% 0.06 258 / 0.45)", label: "Отменено" },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
      {items.map(item => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{
            width: 28, height: 13, borderRadius: 4,
            background: item.color,
            border: `1px solid ${item.border}`,
            position: "relative", overflow: "hidden",
          }}>
            {item.stripe && (
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, oklch(72% 0.17 152 / 0.12) 3px, oklch(72% 0.17 152 / 0.12) 6px)",
              }} />
            )}
          </div>
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-3)" }}>{item.label}</span>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div style={{ width: 1, height: 14, background: "oklch(74% 0.18 68 / 0.60)" }} />
        <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "oklch(74% 0.18 68 / 0.70)" }}>сегодня</span>
      </div>
    </div>
  );
}

// ── Main Timeline ─────────────────────────────────────────────────────

export function TimelineClient({ tasks }: { tasks: Task[] }) {
  const now    = new Date();
  const today  = { month: now.getMonth() + 1, day: now.getDate() };

  // Filters
  const [filterCat,  setFilterCat]  = useState<string | null>(null);
  const [filterPri,  setFilterPri]  = useState<string | null>(null);
  const [filterSt,   setFilterSt]   = useState<string | null>(null);
  const [showDone,   setShowDone]   = useState(true);
  const [jumpMonth,  setJumpMonth]  = useState<number | null>(null);

  // Tooltip
  const [tooltip, setTooltip] = useState<{ task: Task; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleHover = useCallback((task: Task | null, x: number, y: number) => {
    if (!task) setTooltip(null);
    else setTooltip({ task, x, y });
  }, []);

  // Stats
  const total   = tasks.length;
  const done    = tasks.filter(t => t.status === "done").length;
  const overdue = tasks.filter(isOverdue).length;
  const inProg  = tasks.filter(t => t.status === "in_progress").length;
  const pctDone = total > 0 ? Math.round((done / total) * 100) : 0;

  // Filtered
  const filtered = useMemo(() => {
    let r = tasks;
    if (filterCat) r = r.filter(t => t.category === filterCat);
    if (filterPri) r = r.filter(t => t.priority === filterPri);
    if (filterSt)  r = r.filter(t => t.status === filterSt);
    if (!showDone) r = r.filter(t => t.status !== "done" && t.status !== "cancelled");
    return r;
  }, [tasks, filterCat, filterPri, filterSt, showDone]);

  // Group by month
  const groups = useMemo(() => {
    const map = new Map<number, Task[]>();
    filtered.forEach(t => {
      if (!map.has(t.month)) map.set(t.month, []);
      map.get(t.month)!.push(t);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  // Active categories in filtered
  const activeCats = useMemo(() => {
    const s = new Set(tasks.map(t => t.category));
    return Array.from(s);
  }, [tasks]);

  // Active months for jump
  const activeMonths = useMemo(() => {
    const s = new Set(tasks.map(t => t.month));
    return Array.from(s).sort((a, b) => a - b);
  }, [tasks]);

  // Jump to month ref
  const monthRefs = useRef<Record<number, HTMLDivElement | null>>({});

  function scrollToMonth(m: number) {
    setJumpMonth(m);
    monthRefs.current[m]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => setJumpMonth(null), 1500);
  }

  const activeFilters = [filterCat, filterPri, filterSt, !showDone].filter(Boolean).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 1300 }}>

      {/* ── Top bar ── */}
      <div
        className="animate-fade-up"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}
      >
        {/* Yearly progress */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "12px 18px", borderRadius: 16,
          background: "var(--bg-card)", border: "1px solid var(--bd-1)", flex: 1, minWidth: 240,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "var(--tx-3)" }}>Годовой прогресс</span>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--success)" }}>{pctDone}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 6, overflow: "hidden", background: "oklch(100% 0 0 / 0.07)" }}>
              <div style={{
                height: "100%", width: `${pctDone}%`, borderRadius: 6,
                background: "linear-gradient(90deg, oklch(68% 0.18 288), oklch(72% 0.17 152))",
                boxShadow: "0 0 10px oklch(68% 0.18 288 / 0.40)",
                transition: "width 1.2s ease",
              }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>
            {[
              { val: done,    label: "готово",   color: "var(--success)" },
              { val: inProg,  label: "в работе", color: "oklch(74% 0.18 68)" },
              { val: overdue, label: "просроч.", color: overdue > 0 ? "oklch(67% 0.21 22)" : "var(--tx-4)" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)", color: s.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{s.val}</p>
                <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)", marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters + Jump ── */}
      <div
        className="animate-fade-up"
        style={{
          display: "flex", flexDirection: "column", gap: 10,
          padding: "14px 16px", borderRadius: 16,
          background: "var(--bg-card)", border: "1px solid var(--bd-1)",
        }}
      >
        {/* Jump to month */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)", marginRight: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Перейти →
          </span>
          {activeMonths.map(m => (
            <button
              key={m}
              onClick={() => scrollToMonth(m)}
              style={{
                padding: "4px 12px", borderRadius: 99, cursor: "pointer",
                fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: jumpMonth === m ? 700 : 400,
                color: m === today.month ? "oklch(74% 0.18 68)" : "var(--tx-3)",
                background: jumpMonth === m ? "oklch(68% 0.18 288 / 0.15)" : "oklch(100% 0 0 / 0.04)",
                border: m === today.month ? "1px solid oklch(74% 0.18 68 / 0.30)" : "1px solid var(--bd-1)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "oklch(68% 0.18 288 / 0.12)"; e.currentTarget.style.color = "var(--tx-1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = jumpMonth === m ? "oklch(68% 0.18 288 / 0.15)" : "oklch(100% 0 0 / 0.04)"; e.currentTarget.style.color = m === today.month ? "oklch(74% 0.18 68)" : "var(--tx-3)"; }}
            >
              {MONTHS_SHORT[m]}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--bd-1)" }} />

        {/* Filters row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
          {/* Category */}
          {activeCats.map(c => {
            const cm = CAT_META[c];
            const active = filterCat === c;
            return (
              <button
                key={c}
                onClick={() => setFilterCat(active ? null : c)}
                style={{
                  padding: "4px 12px", borderRadius: 99, cursor: "pointer",
                  fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: active ? 600 : 400,
                  color: active ? cm?.color ?? "var(--tx-2)" : "var(--tx-4)",
                  background: active ? `${(cm?.color ?? "oklch(68% 0.18 288)").replace(")", " / 0.12)")}` : "oklch(100% 0 0 / 0.04)",
                  border: active ? `1px solid ${(cm?.color ?? "oklch(68% 0.18 288)").replace(")", " / 0.32)")}` : "1px solid var(--bd-1)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "oklch(100% 0 0 / 0.08)"; e.currentTarget.style.color = "var(--tx-2)"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "oklch(100% 0 0 / 0.04)"; e.currentTarget.style.color = "var(--tx-4)"; } }}
              >
                {cm?.icon} {c}
              </button>
            );
          })}

          <div style={{ width: 1, height: 16, background: "var(--bd-2)", margin: "0 3px" }} />

          {/* Status */}
          {[
            { k: "pending",     label: "Ожидает",  color: "var(--tx-3)" },
            { k: "in_progress", label: "В работе", color: "oklch(74% 0.18 68)" },
            { k: "done",        label: "Готово",   color: "oklch(72% 0.17 152)" },
          ].map(s => {
            const active = filterSt === s.k;
            return (
              <button
                key={s.k}
                onClick={() => setFilterSt(active ? null : s.k)}
                style={{
                  padding: "4px 12px", borderRadius: 99, cursor: "pointer",
                  fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: active ? 600 : 400,
                  color: active ? s.color : "var(--tx-4)",
                  background: active ? `${s.color.replace(")", " / 0.12)")}` : "oklch(100% 0 0 / 0.04)",
                  border: active ? `1px solid ${s.color.replace(")", " / 0.30)")}` : "1px solid var(--bd-1)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "oklch(100% 0 0 / 0.08)"; e.currentTarget.style.color = "var(--tx-2)"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "oklch(100% 0 0 / 0.04)"; e.currentTarget.style.color = "var(--tx-4)"; } }}
              >
                {s.label}
              </button>
            );
          })}

          <div style={{ width: 1, height: 16, background: "var(--bd-2)", margin: "0 3px" }} />

          {/* Priority */}
          {Object.entries(PRI_META).map(([k, v]) => {
            const active = filterPri === k;
            return (
              <button
                key={k}
                onClick={() => setFilterPri(active ? null : k)}
                style={{
                  padding: "4px 12px", borderRadius: 99, cursor: "pointer",
                  fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: active ? 600 : 400,
                  color: active ? v.color : "var(--tx-4)",
                  background: active ? `${v.color.replace(")", " / 0.12)")}` : "oklch(100% 0 0 / 0.04)",
                  border: active ? `1px solid ${v.color.replace(")", " / 0.30)")}` : "1px solid var(--bd-1)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "oklch(100% 0 0 / 0.08)"; e.currentTarget.style.color = "var(--tx-2)"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "oklch(100% 0 0 / 0.04)"; e.currentTarget.style.color = "var(--tx-4)"; } }}
              >
                {v.label}
              </button>
            );
          })}

          <div style={{ width: 1, height: 16, background: "var(--bd-2)", margin: "0 3px" }} />

          {/* Hide done */}
          <button
            onClick={() => setShowDone(!showDone)}
            style={{
              padding: "4px 12px", borderRadius: 99, cursor: "pointer",
              fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: !showDone ? 600 : 400,
              color: !showDone ? "oklch(72% 0.17 152)" : "var(--tx-4)",
              background: !showDone ? "oklch(72% 0.17 152 / 0.10)" : "oklch(100% 0 0 / 0.04)",
              border: !showDone ? "1px solid oklch(72% 0.17 152 / 0.28)" : "1px solid var(--bd-1)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = showDone ? "oklch(100% 0 0 / 0.08)" : "oklch(72% 0.17 152 / 0.16)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = !showDone ? "oklch(72% 0.17 152 / 0.10)" : "oklch(100% 0 0 / 0.04)"; }}
          >
            Скрыть выполненные
          </button>

          {/* Reset */}
          {activeFilters > 0 && (
            <button
              onClick={() => { setFilterCat(null); setFilterPri(null); setFilterSt(null); setShowDone(true); }}
              style={{
                marginLeft: "auto", padding: "4px 12px", borderRadius: 99, cursor: "pointer",
                fontSize: 10, fontFamily: "var(--font-mono)",
                color: "oklch(67% 0.21 22)", background: "oklch(67% 0.21 22 / 0.08)",
                border: "1px solid oklch(67% 0.21 22 / 0.22)", transition: "all 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "oklch(67% 0.21 22 / 0.16)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "oklch(67% 0.21 22 / 0.08)"; }}
            >
              Сбросить ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* ── Gantt Board ── */}
      <div
        className="animate-fade-up delay-2"
        ref={containerRef}
        style={{
          borderRadius: 22, overflow: "hidden",
          background: "var(--bg-card)", border: "1px solid var(--bd-1)",
          boxShadow: "0 4px 24px oklch(0% 0 0 / 0.22)",
          position: "relative",
        }}
      >
        {/* Column: header legend */}
        <div style={{
          display: "flex",
          padding: "14px 18px 14px 18px",
          borderBottom: "2px solid var(--bd-1)",
          alignItems: "center", justifyContent: "space-between",
          background: "oklch(100% 0 0 / 0.01)",
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--tx-1)" }}>
            Временная шкала
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-4)", marginLeft: 10 }}>
              {filtered.length} задач · {new Date().getFullYear()}
            </span>
          </p>
          <Legend />
        </div>

        {groups.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <div style={{ fontSize: 36, opacity: 0.14, marginBottom: 14 }}>◈</div>
            <p style={{ fontSize: 14, color: "var(--tx-3)" }}>Нет задач по выбранным фильтрам</p>
          </div>
        ) : (
          <div>
            {groups.map(([month, mTasks], gi) => (
              <div
                key={month}
                ref={el => { monthRefs.current[month] = el; }}
                style={{
                  borderBottom: gi < groups.length - 1 ? "1px solid var(--bd-1)" : "none",
                  padding: "0 18px",
                  background: jumpMonth === month ? "oklch(68% 0.18 288 / 0.04)" : "transparent",
                  transition: "background 0.4s ease",
                }}
              >
                <MonthPanel
                  month={month}
                  tasks={mTasks}
                  today={today}
                  onHover={handleHover}
                />
              </div>
            ))}
          </div>
        )}

        {/* Tooltip overlay */}
        {tooltip && (
          <Tooltip
            task={tooltip.task}
            x={tooltip.x}
            y={tooltip.y}
            containerRef={containerRef}
          />
        )}
      </div>

      {/* Footer count */}
      {filtered.length > 0 && (
        <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-4)", textAlign: "center" }}>
          {filtered.length} задач из {total} · наведите на бар для деталей
          {activeFilters > 0 ? " · активны фильтры" : ""}
        </p>
      )}
    </div>
  );
}