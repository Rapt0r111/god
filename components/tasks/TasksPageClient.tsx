// components/tasks/TasksPageClient.tsx — Vision 2026 · Tasks Journal
// FIXED:      BUG-1    — replaced fetch('/api/tasks/...') with Server Actions
// REFACTORED: Phase 1  — replaced inline CAT_META / PRI_META / ST_META /
//                        MONTHS_FULL / MONTHS_SHORT / STATUS_CYCLE
//                        with imports from @/lib/config/meta and @/lib/config/constants
"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

// FIXED: BUG-1 — import Server Actions instead of non-existent REST endpoints
import {
  createTask,
  updateTask,
  completeTask,
  reopenTask,
  setTaskStatus,
} from "@/actions/tasks";

// REFACTORED: Phase 1 — import from canonical config instead of inlining
import {
  CATEGORY_META,
  PRIORITY_META,
  STATUS_META,
  getCategoryMeta,
  getPriorityMeta,
  getStatusMeta,
} from "@/lib/config/meta";
import {
  MONTHS_FULL,
  MONTHS_SHORT,
  STATUS_CYCLE,
  type TaskStatus,
} from "@/lib/config/constants";

// ── Types ─────────────────────────────────────────────────────────────────────

type Subtask = {
  id: number;
  title: string;
  status: TaskStatus;
  description?: string | null;
};

type Task = {
  id: number;
  title: string;
  category: string;
  month: number;
  dateFrom: number;
  dateTo: number;
  responsible: string;
  status: TaskStatus;
  priority: "critical" | "high" | "normal";
  description?: string | null;
  notes?: string | null;
  subtasks?: Subtask[];
};

type Session = { user?: { name?: string; role?: string } } | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDueInDays(task: Task): number {
  const now  = new Date();
  const curM = now.getMonth() + 1;
  const curD = now.getDate();
  if (task.month < curM) return -999;
  if (task.month > curM) return (task.month - curM) * 30;
  return task.dateTo - curD;
}

function isOverdue(task: Task): boolean {
  return getDueInDays(task) < 0 && task.status !== "done" && task.status !== "cancelled";
}

function isCritical(task: Task): boolean {
  const d = getDueInDays(task);
  return (task.priority === "critical" || d <= 2) && task.status !== "done" && task.status !== "cancelled";
}

// ── Filter Chip ───────────────────────────────────────────────────────────────

function FilterChip({
  label, active, color, onClick,
}: { label: string; active: boolean; color?: string; onClick: () => void }) {
  const ac = color ?? "oklch(68% 0.18 288)";
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 13px", borderRadius: 99,
        fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: active ? 600 : 400,
        cursor: "pointer", whiteSpace: "nowrap",
        color: active ? ac : "var(--tx-4)",
        background: active ? `${ac.replace(")", " / 0.12)")}` : "oklch(100% 0 0 / 0.04)",
        border: active ? `1px solid ${ac.replace(")", " / 0.32)")}` : "1px solid var(--bd-1)",
        transition: "all 0.16s ease",
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.color = "var(--tx-2)";
          e.currentTarget.style.borderColor = "var(--bd-2)";
          e.currentTarget.style.background = "oklch(100% 0 0 / 0.07)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.color = "var(--tx-4)";
          e.currentTarget.style.borderColor = "var(--bd-1)";
          e.currentTarget.style.background = "oklch(100% 0 0 / 0.04)";
        }
      }}
    >
      {label}
    </button>
  );
}

// ── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({
  task, onEdit, onCycleStatus, isPending,
}: {
  task: Task;
  onEdit: (t: Task) => void;
  onCycleStatus: (t: Task) => void;
  isPending: boolean;
}) {
  // REFACTORED: Phase 1 — was inline constant lookups
  const cat = getCategoryMeta(task.category);
  const pri = getPriorityMeta(task.priority);
  const st  = getStatusMeta(task.status);

  const overdue     = isOverdue(task);
  const crit        = isCritical(task);
  const dueIn       = getDueInDays(task);
  const isDone      = task.status === "done";
  const isCancelled = task.status === "cancelled";
  const subs        = task.subtasks ?? [];
  const sDone       = subs.filter(s => s.status === "done").length;
  const pct         = subs.length > 0 ? Math.round((sDone / subs.length) * 100) : null;
  const dateStr     = task.dateFrom === task.dateTo
    ? String(task.dateFrom)
    : `${task.dateFrom}–${task.dateTo}`;

  const urgencyColor = overdue || dueIn <= 2
    ? "oklch(67% 0.21 22)"
    : dueIn <= 7
      ? "oklch(74% 0.18 68)"
      : "var(--tx-4)";

  const urgencyLabel = overdue
    ? "просрочено"
    : dueIn <= 0 ? "сегодня"
    : dueIn === 1 ? "завтра"
    : `${dueIn} дн.`;

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 0,
        borderRadius: 14, overflow: "hidden",
        background: isDone
          ? "oklch(100% 0 0 / 0.02)"
          : crit
            ? "linear-gradient(135deg, oklch(67% 0.21 22 / 0.07), transparent 60%)"
            : "var(--bg-raised)",
        border: isDone
          ? "1px solid var(--bd-1)"
          : crit ? "1px solid oklch(67% 0.21 22 / 0.24)"
          : "1px solid var(--bd-1)",
        opacity: isPending ? 0.5 : isCancelled ? 0.45 : 1,
        transition: "all 0.18s ease",
        position: "relative",
      }}
    >
      {/* Priority bar */}
      <div style={{
        width: 3, alignSelf: "stretch", flexShrink: 0,
        background: isDone || isCancelled ? "transparent" : pri.color,
        boxShadow: crit && !isDone ? `0 0 8px ${pri.color.replace(")", " / 0.5)")}` : "none",
      }} />

      {/* Status toggle */}
      <button
        onClick={() => onCycleStatus(task)}
        title={`Статус: ${st.label} → следующий`}
        style={{
          width: 44, alignSelf: "stretch", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", background: "transparent", border: "none",
          borderRight: "1px solid var(--bd-1)", transition: "background 0.15s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = `${st.color.replace(")", " / 0.10)")}`; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: 7,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: isDone ? 12 : 11,
          border: `2px solid ${isDone ? "oklch(72% 0.17 152 / 0.70)" : `${st.color.replace(")", " / 0.45)")}`}`,
          background: isDone ? "oklch(72% 0.17 152 / 0.15)" : "transparent",
          color: isDone ? "var(--success)" : st.color,
          transition: "all 0.15s ease",
        }}>
          {isDone ? "✓" : isCancelled ? "✕" : ""}
        </div>
      </button>

      {/* Main content */}
      <button
        onClick={() => onEdit(task)}
        style={{
          flex: 1, minWidth: 0, textAlign: "left", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
          background: "transparent", border: "none", transition: "background 0.15s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.03)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
          background: `${cat.color.replace(")", " / 0.12)")}`,
          border: `1px solid ${cat.color.replace(")", " / 0.22)")}`,
        }}>
          {cat.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3,
            color: isDone || isCancelled ? "var(--tx-4)" : overdue ? "oklch(82% 0.10 22)" : "var(--tx-1)",
            textDecoration: isDone || isCancelled ? "line-through" : "none",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4,
          }}>
            {task.title}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 600, padding: "2px 7px", borderRadius: 99, color: cat.color, background: `${cat.color.replace(")", " / 0.10)")}`, border: `1px solid ${cat.color.replace(")", " / 0.22)")}` }}>
              {cat.icon} {task.category}
            </span>
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-3)", padding: "2px 7px", borderRadius: 99, background: "oklch(100% 0 0 / 0.04)", border: "1px solid var(--bd-1)" }}>
              {task.responsible}
            </span>
            {subs.length > 0 && (
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: pct === 100 ? "var(--success)" : "var(--tx-4)" }}>
                ▫ {sDone}/{subs.length}
              </span>
            )}
            {overdue && (
              <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 7px", borderRadius: 99, color: "oklch(67% 0.21 22)", background: "oklch(67% 0.21 22 / 0.12)", border: "1px solid oklch(67% 0.21 22 / 0.28)" }}>
                ● просрочено
              </span>
            )}
          </div>
        </div>
        {pct !== null && (
          <div style={{ flexShrink: 0, width: 40 }}>
            <div style={{ height: 3, borderRadius: 3, overflow: "hidden", background: "oklch(100% 0 0 / 0.07)", marginBottom: 3 }}>
              <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: pct === 100 ? "var(--success)" : pri.color, transition: "width 0.5s ease" }} />
            </div>
            <p style={{ fontSize: 8, fontFamily: "var(--font-mono)", textAlign: "right", color: pct === 100 ? "var(--success)" : "var(--tx-4)" }}>{pct}%</p>
          </div>
        )}
      </button>

      {/* Date + urgency column */}
      <div style={{ flexShrink: 0, textAlign: "right", padding: "11px 14px", borderLeft: "1px solid var(--bd-1)", minWidth: 80 }}>
        <p style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", color: isDone ? "var(--tx-4)" : urgencyColor, marginBottom: 3, fontVariantNumeric: "tabular-nums" }}>
          {dateStr}
        </p>
        {!isDone && !isCancelled && (
          <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: urgencyColor }}>{urgencyLabel}</p>
        )}
        {(isDone || isCancelled) && (
          <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)" }}>{isDone ? "готово" : "отменено"}</p>
        )}
      </div>
    </div>
  );
}

// ── Month Group ───────────────────────────────────────────────────────────────

function MonthGroup({
  month, tasks, onEdit, onCycleStatus, pendingId,
}: {
  month: number; tasks: Task[];
  onEdit: (t: Task) => void;
  onCycleStatus: (t: Task) => void;
  pendingId: number | null;
}) {
  const done       = tasks.filter(t => t.status === "done").length;
  const total      = tasks.length;
  const pct        = Math.round((done / total) * 100);
  const hasOverdue = tasks.some(isOverdue);
  const cur        = new Date().getMonth() + 1;
  const isCurMonth = month === cur;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--bd-1)" }}>
        {/* REFACTORED: Phase 1 — was inline MONTHS_FULL */}
        <h3 style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase", color: isCurMonth ? "oklch(74% 0.18 68)" : hasOverdue ? "oklch(67% 0.21 22)" : "var(--tx-2)" }}>
          {MONTHS_FULL[month]}
        </h3>
        {isCurMonth && (
          <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 9px", borderRadius: 99, color: "oklch(74% 0.18 68)", background: "oklch(74% 0.18 68 / 0.12)", border: "1px solid oklch(74% 0.18 68 / 0.28)" }}>
            текущий
          </span>
        )}
        {hasOverdue && (
          <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 9px", borderRadius: 99, color: "oklch(67% 0.21 22)", background: "oklch(67% 0.21 22 / 0.10)", border: "1px solid oklch(67% 0.21 22 / 0.26)" }}>
            ● просрочены
          </span>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 60, height: 3, borderRadius: 3, overflow: "hidden", background: "oklch(100% 0 0 / 0.07)" }}>
            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3, background: pct === 100 ? "var(--success)" : "oklch(68% 0.18 288 / 0.80)", transition: "width 0.8s ease" }} />
          </div>
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: pct === 100 ? "var(--success)" : "var(--tx-3)" }}>
            {done}/{total}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {tasks.map(t => (
          <TaskRow key={t.id} task={t} onEdit={onEdit} onCycleStatus={onCycleStatus} isPending={pendingId === t.id} />
        ))}
      </div>
    </div>
  );
}

// ── Edit / Create Modal ───────────────────────────────────────────────────────

function TaskFormModal({
  task, onClose, onSave,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (data: Partial<Task> & { id?: number }) => Promise<void>;
}) {
  const isNew = task === null;
  const [form, setForm] = useState({
    title:       task?.title       ?? "",
    category:    task?.category    ?? "ПД",
    month:       task?.month       ?? (new Date().getMonth() + 1),
    dateFrom:    task?.dateFrom    ?? 1,
    dateTo:      task?.dateTo      ?? 1,
    responsible: task?.responsible ?? "",
    status:      (task?.status      ?? "pending") as TaskStatus,
    priority:    (task?.priority    ?? "normal")  as Task["priority"],
    description: task?.description ?? "",
    notes:       task?.notes       ?? "",
  });
  const [tab, setTab]       = useState<"main" | "extra">("main");
  const [saving, setSaving] = useState(false);

  useMemo(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    if (!form.title.trim() || !form.responsible.trim()) return;
    setSaving(true);
    await onSave({ ...form, id: task?.id });
    setSaving(false);
  }

  const isValid = form.title.trim().length > 0 && form.responsible.trim().length > 0;

  const inp = {
    width: "100%", boxSizing: "border-box" as const,
    padding: "10px 14px", borderRadius: 12, fontSize: 13, fontFamily: "inherit",
    background: "oklch(100% 0 0 / 0.05)", border: "1px solid var(--bd-2)",
    color: "var(--tx-1)", outline: "none", transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  };
  const labelStyle = {
    fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600,
    textTransform: "uppercase" as const, letterSpacing: "0.08em",
    color: "var(--tx-4)", marginBottom: 7, display: "block" as const,
  };

  const focusStyle = { borderColor: "oklch(68% 0.18 288 / 0.60)", boxShadow: "0 0 0 3px oklch(68% 0.18 288 / 0.12)" };
  const blurStyle  = { borderColor: "var(--bd-2)", boxShadow: "none" };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px",
        background: "oklch(8% 0.016 270 / 0.75)", backdropFilter: "blur(18px)",
        animation: "fadeIn 0.18s ease forwards",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 580, maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          borderRadius: 24, overflow: "hidden",
          background: "oklch(19% 0.028 268 / 0.98)",
          border: "1px solid var(--bd-2)",
          boxShadow: "0 40px 100px oklch(0% 0 0 / 0.60), 0 0 0 1px oklch(100% 0 0 / 0.06) inset",
          animation: "scaleIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 18px", borderBottom: "1px solid var(--bd-1)", flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--tx-1)", marginBottom: 2 }}>
              {isNew ? "Новая задача" : "Редактировать задачу"}
            </h2>
            {!isNew && <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-4)" }}>ID #{task!.id}</p>}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", border: "1px solid var(--bd-1)", background: "oklch(100% 0 0 / 0.04)", color: "var(--tx-4)", transition: "all 0.15s ease" }}
            onMouseEnter={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.09)"; e.currentTarget.style.color = "var(--tx-1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.04)"; e.currentTarget.style.color = "var(--tx-4)"; }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--bd-1)", flexShrink: 0 }}>
          {([{ id: "main" as const, label: "Основное" }, { id: "extra" as const, label: "Дополнительно" }]).map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "11px 20px", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: active ? 600 : 400, color: active ? "oklch(82% 0.10 288)" : "var(--tx-4)", background: active ? "oklch(68% 0.18 288 / 0.07)" : "transparent", borderBottom: active ? "2px solid oklch(68% 0.18 288)" : "2px solid transparent", position: "relative", top: 1, transition: "all 0.15s ease" }}>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {tab === "main" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Название задачи *</label>
                <input value={form.title} onChange={e => setField("title", e.target.value)} placeholder="Введите название..." style={inp}
                  onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                  onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
              </div>
              <div>
                <label style={labelStyle}>Ответственный *</label>
                <input value={form.responsible} onChange={e => setField("responsible", e.target.value)} placeholder="Фамилия И.О." style={inp}
                  onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                  onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Категория</label>
                  {/* REFACTORED: Phase 1 — was Object.entries(CAT_META) */}
                  <select value={form.category} onChange={e => setField("category", e.target.value)} style={{ ...inp, cursor: "pointer" }}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}>
                    {Object.entries(CATEGORY_META).map(([k, v]) => (
                      <option key={k} value={k} style={{ background: "oklch(20% 0.028 268)" }}>{v.icon} {k} — {v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Приоритет</label>
                  {/* REFACTORED: Phase 1 — was Object.entries(PRI_META) */}
                  <select value={form.priority} onChange={e => setField("priority", e.target.value as Task["priority"])} style={{ ...inp, cursor: "pointer" }}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}>
                    {Object.entries(PRIORITY_META).map(([k, v]) => (
                      <option key={k} value={k} style={{ background: "oklch(20% 0.028 268)" }}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Месяц</label>
                  {/* REFACTORED: Phase 1 — was inline MONTHS_FULL.slice(1) */}
                  <select value={form.month} onChange={e => setField("month", Number(e.target.value))} style={{ ...inp, cursor: "pointer" }}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}>
                    {MONTHS_FULL.slice(1).map((m, i) => (
                      <option key={i + 1} value={i + 1} style={{ background: "oklch(20% 0.028 268)" }}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Дата начала</label>
                  <input type="number" min={1} max={31} value={form.dateFrom} onChange={e => setField("dateFrom", Number(e.target.value))} style={{ ...inp, fontFamily: "var(--font-mono)" }}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
                </div>
                <div>
                  <label style={labelStyle}>Дата конца</label>
                  <input type="number" min={1} max={31} value={form.dateTo} onChange={e => setField("dateTo", Number(e.target.value))} style={{ ...inp, fontFamily: "var(--font-mono)" }}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Статус</label>
                {/* REFACTORED: Phase 1 — was inline STATUS_CYCLE */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {STATUS_CYCLE.map(s => {
                    const sm     = STATUS_META[s];
                    const active = form.status === s;
                    return (
                      <button key={s} onClick={() => setField("status", s)} style={{ padding: "9px 10px", borderRadius: 11, cursor: "pointer", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: active ? 600 : 400, color: active ? sm.color : "var(--tx-4)", background: active ? sm.bg : "oklch(100% 0 0 / 0.03)", border: active ? `1px solid ${sm.bd}` : "1px solid var(--bd-1)", transition: "all 0.16s ease" }}>
                        {sm.icon} {sm.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {tab === "extra" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Описание задачи</label>
                <textarea value={form.description} onChange={e => setField("description", e.target.value)} placeholder="Подробное описание задачи..." rows={5}
                  style={{ ...inp, resize: "vertical" as const, lineHeight: 1.7, minHeight: 100 }}
                  onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                  onBlur={e => Object.assign(e.currentTarget.style, blurStyle)} />
              </div>
              <div>
                <label style={labelStyle}>Примечания офицера</label>
                <textarea value={form.notes} onChange={e => setField("notes", e.target.value)} placeholder="Внутренние заметки..." rows={4}
                  style={{ ...inp, resize: "vertical" as const, lineHeight: 1.7, minHeight: 80, borderColor: "oklch(74% 0.18 68 / 0.22)", fontFamily: "var(--font-mono)" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "oklch(74% 0.18 68 / 0.50)"; e.currentTarget.style.boxShadow = "0 0 0 3px oklch(74% 0.18 68 / 0.10)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "oklch(74% 0.18 68 / 0.22)"; e.currentTarget.style.boxShadow = "none"; }} />
              </div>
              {task?.subtasks && task.subtasks.length > 0 && (
                <div>
                  <label style={{ ...labelStyle, marginBottom: 10 }}>
                    Подзадачи ({task.subtasks.filter(s => s.status === "done").length}/{task.subtasks.length})
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {task.subtasks.map(sub => {
                      // REFACTORED: Phase 1 — was inline ST_META[sub.status]
                      const subSt = getStatusMeta(sub.status);
                      const done  = sub.status === "done";
                      return (
                        <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: done ? "oklch(72% 0.17 152 / 0.05)" : "oklch(100% 0 0 / 0.03)", border: done ? "1px solid oklch(72% 0.17 152 / 0.15)" : "1px solid var(--bd-1)", opacity: done ? 0.70 : 1 }}>
                          <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: done ? "1px solid oklch(72% 0.17 152 / 0.60)" : "1px solid var(--bd-3)", background: done ? "oklch(72% 0.17 152 / 0.15)" : "transparent" }}>
                            {done && <span style={{ fontSize: 9, color: "var(--success)" }}>✓</span>}
                          </div>
                          <span style={{ flex: 1, fontSize: 12, color: done ? "var(--tx-4)" : "var(--tx-1)", textDecoration: done ? "line-through" : "none" }}>{sub.title}</span>
                          <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 600, padding: "2px 8px", borderRadius: 99, color: subSt.color, background: subSt.bg, border: `1px solid ${subSt.bd}` }}>{subSt.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid var(--bd-1)", flexShrink: 0, gap: 10 }}>
          <button onClick={onClose} style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 500, padding: "8px 18px", borderRadius: 11, cursor: "pointer", color: "var(--tx-3)", border: "1px solid var(--bd-1)", background: "oklch(100% 0 0 / 0.03)", transition: "all 0.15s ease" }}
            onMouseEnter={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.07)"; e.currentTarget.style.color = "var(--tx-1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.03)"; e.currentTarget.style.color = "var(--tx-3)"; }}>
            Отмена
          </button>
          <button onClick={handleSave} disabled={!isValid || saving} style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, padding: "8px 24px", borderRadius: 11, cursor: isValid ? "pointer" : "not-allowed", color: isValid ? "var(--tx-1)" : "var(--tx-4)", background: isValid ? "linear-gradient(135deg, oklch(68% 0.18 288), oklch(62% 0.20 280))" : "oklch(100% 0 0 / 0.04)", border: isValid ? "1px solid oklch(68% 0.18 288 / 0.50)" : "1px solid var(--bd-1)", boxShadow: isValid ? "0 4px 16px oklch(68% 0.18 288 / 0.30)" : "none", opacity: saving ? 0.65 : 1, transition: "all 0.18s ease" }}>
            {saving ? "Сохранение..." : isNew ? "Создать задачу" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function TasksPageClient({ tasks: initialTasks, session }: { tasks: Task[]; session: Session }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const [search,      setSearch]      = useState("");
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterCat,   setFilterCat]   = useState<string | null>(null);
  const [filterPri,   setFilterPri]   = useState<string | null>(null);
  const [filterSt,    setFilterSt]    = useState<string | null>(null);
  const [filterCrit,  setFilterCrit]  = useState(false);
  const [showDone,    setShowDone]    = useState(true);
  const [editTask,    setEditTask]    = useState<Task | null | "new">(null);
  const [pendingId,   setPendingId]   = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const total   = tasks.length;
  const done    = tasks.filter(t => t.status === "done").length;
  const crit    = tasks.filter(isCritical).length;
  const overdue = tasks.filter(isOverdue).length;

  const activeMonths = useMemo(() => {
    const s = new Set(tasks.map(t => t.month));
    return Array.from(s).sort((a, b) => a - b);
  }, [tasks]);

  const activeCats = useMemo(() => {
    const s = new Set(tasks.map(t => t.category));
    return Array.from(s);
  }, [tasks]);

  const filtered = useMemo(() => {
    let res = tasks;
    if (search)      res = res.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.responsible.toLowerCase().includes(search.toLowerCase()));
    if (filterMonth) res = res.filter(t => t.month === filterMonth);
    if (filterCat)   res = res.filter(t => t.category === filterCat);
    if (filterPri)   res = res.filter(t => t.priority === filterPri);
    if (filterSt)    res = res.filter(t => t.status === filterSt);
    if (filterCrit)  res = res.filter(isCritical);
    if (!showDone)   res = res.filter(t => t.status !== "done" && t.status !== "cancelled");
    return res;
  }, [tasks, search, filterMonth, filterCat, filterPri, filterSt, filterCrit, showDone]);

  const groups = useMemo(() => {
    const map = new Map<number, Task[]>();
    filtered.forEach(t => {
      if (!map.has(t.month)) map.set(t.month, []);
      map.get(t.month)!.push(t);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  // FIXED: BUG-1 — replaced fetch('/api/tasks/...') with Server Action calls
  const handleCycleStatus = useCallback(async (task: Task) => {
    const idx  = STATUS_CYCLE.indexOf(task.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    setPendingId(task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    try {
      if (next === "done")    await completeTask(task.id);
      else if (next === "pending") await reopenTask(task.id);
      else                   await setTaskStatus(task.id, next);
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    } finally {
      setPendingId(null);
      startTransition(() => router.refresh());
    }
  }, [router]);

  // FIXED: BUG-1 — replaced fetch('/api/tasks', POST/PUT) with Server Actions
  const handleSave = useCallback(async (data: Partial<Task> & { id?: number }) => {
    const isNew = !data.id;
    if (isNew) {
      const result = await createTask({
        title: data.title!, category: data.category!, priority: data.priority!,
        responsible: data.responsible!, month: data.month!,
        dateFrom: data.dateFrom!, dateTo: data.dateTo!,
        description: data.description ?? null, notes: data.notes ?? null,
        status: data.status ?? "pending",
      });
      if (result.success && result.task) {
        setTasks(prev => [...prev, result.task as Task]);
        setEditTask(null);
        startTransition(() => router.refresh());
      }
    } else {
      const result = await updateTask(data.id!, {
        title: data.title!, category: data.category!, priority: data.priority!,
        responsible: data.responsible!, month: data.month!,
        dateFrom: data.dateFrom!, dateTo: data.dateTo!,
        description: data.description ?? null, notes: data.notes ?? null,
      });
      if (result.success && result.task) {
        setTasks(prev => prev.map(t => t.id === data.id ? { ...t, ...result.task } as Task : t));
        setEditTask(null);
        startTransition(() => router.refresh());
      }
    }
  }, [router]);

  const activeFilters = [filterMonth, filterCat, filterPri, filterSt, filterCrit, !showDone].filter(Boolean).length;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 1100 }}>

        {/* Header bar */}
        <div className="animate-fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 380 }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--tx-4)", pointerEvents: "none" }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по названию или ответственному..."
              style={{ width: "100%", boxSizing: "border-box", padding: "9px 14px 9px 36px", borderRadius: 12, fontSize: 13, fontFamily: "inherit", background: "oklch(100% 0 0 / 0.05)", border: "1px solid var(--bd-1)", color: "var(--tx-1)", outline: "none", transition: "border-color 0.15s ease" }}
              onFocus={e => { e.currentTarget.style.borderColor = "oklch(68% 0.18 288 / 0.50)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "var(--bd-1)"; }} />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--tx-4)", background: "none", border: "none", cursor: "pointer" }}>×</button>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {[
              { label: "всего",    val: total,   color: "var(--tx-3)",                            onClick: () => {} },
              { label: "готово",   val: done,    color: "var(--success)",                         onClick: () => setFilterSt(filterSt === "done" ? null : "done") },
              { label: "крит.",    val: crit,    color: "oklch(67% 0.21 22)",                     onClick: () => setFilterCrit(!filterCrit) },
              { label: "просроч.", val: overdue, color: overdue > 0 ? "oklch(67% 0.21 22)" : "var(--tx-4)", onClick: () => {} },
            ].map(s => (
              <button key={s.label} onClick={s.onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 14px", borderRadius: 12, cursor: "pointer", background: "var(--bg-raised)", border: "1px solid var(--bd-1)", transition: "all 0.15s ease", lineHeight: 1 }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-raised)"; }}>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.val}</span>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--tx-4)", marginTop: 2 }}>{s.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setEditTask("new")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--tx-1)", background: "linear-gradient(135deg, oklch(68% 0.18 288), oklch(62% 0.20 280))", border: "1px solid oklch(68% 0.18 288 / 0.50)", boxShadow: "0 4px 18px oklch(68% 0.18 288 / 0.30)", transition: "all 0.18s ease", flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px oklch(68% 0.18 288 / 0.44)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 18px oklch(68% 0.18 288 / 0.30)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            + Новая задача
          </button>
        </div>

        {/* Filters */}
        <div className="animate-fade-up" style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", padding: "12px 16px", borderRadius: 16, background: "var(--bg-card)", border: "1px solid var(--bd-1)" }}>
          <FilterChip label="Все месяцы" active={filterMonth === null} onClick={() => setFilterMonth(null)} />
          {/* REFACTORED: Phase 1 — was inline MONTHS_SHORT */}
          {activeMonths.map(m => (
            <FilterChip key={m} label={MONTHS_SHORT[m]} active={filterMonth === m} onClick={() => setFilterMonth(filterMonth === m ? null : m)} />
          ))}
          <div style={{ width: 1, height: 18, background: "var(--bd-2)", margin: "0 4px" }} />
          {activeCats.map(c => {
            // REFACTORED: Phase 1 — was inline CAT_META[c]
            const cm = CATEGORY_META[c];
            return <FilterChip key={c} label={cm ? `${cm.icon} ${c}` : c} active={filterCat === c} color={cm?.color} onClick={() => setFilterCat(filterCat === c ? null : c)} />;
          })}
          <div style={{ width: 1, height: 18, background: "var(--bd-2)", margin: "0 4px" }} />
          {/* REFACTORED: Phase 1 — was Object.entries(PRI_META) */}
          {Object.entries(PRIORITY_META).map(([k, v]) => (
            <FilterChip key={k} label={`${v.icon} ${v.label}`} active={filterPri === k} color={v.color} onClick={() => setFilterPri(filterPri === k ? null : k)} />
          ))}
          <div style={{ width: 1, height: 18, background: "var(--bd-2)", margin: "0 4px" }} />
          <FilterChip label="Скрыть выполненные" active={!showDone} color="oklch(72% 0.17 152)" onClick={() => setShowDone(!showDone)} />
          <FilterChip label="⚡ Только критичные" active={filterCrit} color="oklch(67% 0.21 22)" onClick={() => setFilterCrit(!filterCrit)} />
          {activeFilters > 0 && (
            <button onClick={() => { setFilterMonth(null); setFilterCat(null); setFilterPri(null); setFilterSt(null); setFilterCrit(false); setShowDone(true); setSearch(""); }}
              style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 99, fontSize: 10, fontFamily: "var(--font-mono)", color: "oklch(67% 0.21 22)", background: "oklch(67% 0.21 22 / 0.08)", border: "1px solid oklch(67% 0.21 22 / 0.22)", cursor: "pointer", transition: "all 0.15s ease" }}
              onMouseEnter={e => { e.currentTarget.style.background = "oklch(67% 0.21 22 / 0.16)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "oklch(67% 0.21 22 / 0.08)"; }}>
              Сбросить ({activeFilters})
            </button>
          )}
        </div>

        {/* Task list */}
        <div className="animate-fade-up delay-2" style={{ borderRadius: 22, overflow: "hidden", background: "var(--bg-card)", border: "1px solid var(--bd-1)", boxShadow: "0 4px 24px oklch(0% 0 0 / 0.22)" }}>
          {groups.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <div style={{ fontSize: 36, opacity: 0.15, marginBottom: 14 }}>▫</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--tx-3)", marginBottom: 6 }}>{search || activeFilters > 0 ? "Ничего не найдено" : "Задачи отсутствуют"}</p>
              <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--tx-4)" }}>{search || activeFilters > 0 ? "Попробуйте изменить фильтры" : "Создайте первую задачу нажав кнопку выше"}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {groups.map(([month, monthTasks], gi) => (
                <div key={month} style={{ padding: "18px 18px 16px", borderBottom: gi < groups.length - 1 ? "1px solid var(--bd-1)" : "none" }}>
                  <MonthGroup month={month} tasks={monthTasks} onEdit={setEditTask} onCycleStatus={handleCycleStatus} pendingId={pendingId} />
                </div>
              ))}
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--tx-4)", textAlign: "center" }}>
            Показано {filtered.length} из {total} задач{activeFilters > 0 || search ? " · активны фильтры" : ""}
          </p>
        )}
      </div>

      {/* Modal */}
      {editTask !== null && (
        <TaskFormModal
          task={editTask === "new" ? null : editTask}
          onClose={() => setEditTask(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}