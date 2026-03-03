// components/modals/TaskDetailsModal.tsx
// FIXED:      BUG-2    — was empty stub
// REFACTORED: Phase 1  — replaced inline CATEGORIES_META / STATUS_META / PRIORITY_META /
//                        MONTHS_SHORT with imports from @/lib/config/meta and @/lib/config/constants
"use client";

import { useState, useEffect, useTransition, useRef, type CSSProperties } from "react";
import {
  completeTask, reopenTask,
  completeSubtask, reopenSubtask,
  addSubtask, deleteSubtask,
} from "@/actions/tasks";
import { useRouter } from "next/navigation";
import type { TaskData } from "./EditTaskModal";
// REFACTORED: Phase 1 — import from canonical config instead of inlining
import { getCategoryMeta, getPriorityMeta, getStatusMeta } from "@/lib/config/meta";
import { MONTHS_SHORT } from "@/lib/config/constants";

// ── Types ─────────────────────────────────────────────────────────────────────

type SubtaskItem = TaskData["subtasks"][number];

// ── SubtaskRow ────────────────────────────────────────────────────────────────

function SubtaskRow({
  sub, onToggle, onDelete,
}: {
  sub: SubtaskItem;
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const isDone = sub.status === "done";
  // REFACTORED: Phase 1 — was: STATUS_META[sub.status] ?? STATUS_META.pending
  const sm = getStatusMeta(sub.status);

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group"
      style={{
        background: isDone ? "rgba(26,232,160,0.04)" : "rgba(255,255,255,0.025)",
        border: isDone ? "1px solid rgba(26,232,160,0.14)" : "1px solid rgba(255,255,255,0.06)",
        opacity: isDone ? 0.7 : 1,
      }}
    >
      <button
        onClick={() => onToggle(sub.id, !isDone)}
        className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all"
        style={{
          border: isDone ? "1.5px solid rgba(26,232,160,0.55)" : "1.5px solid rgba(136,153,187,0.35)",
          background: isDone ? "rgba(26,232,160,0.15)" : "transparent",
        }}
      >
        {isDone && <span style={{ fontSize: 9, color: "#1ae8a0", lineHeight: 1 }}>✓</span>}
      </button>

      <span
        className="flex-1 text-[12px]"
        style={{
          color: isDone ? "rgba(136,153,187,0.55)" : "#c5cde8",
          textDecoration: isDone ? "line-through" : "none",
        }}
      >
        {sub.title}
      </span>

      <span
        className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-lg flex-shrink-0"
        style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.bd}` }}
      >
        {sm.icon} {sm.label}
      </span>

      <button
        onClick={() => onDelete(sub.id)}
        className="flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        style={{
          border: "1px solid rgba(255,107,107,0.2)",
          background: "rgba(255,107,107,0.05)",
          color: "rgba(255,107,107,0.55)",
          fontSize: 12,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,107,107,0.12)"; e.currentTarget.style.color = "#ff9999"; e.currentTarget.style.borderColor = "rgba(255,107,107,0.4)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,107,107,0.05)"; e.currentTarget.style.color = "rgba(255,107,107,0.55)"; e.currentTarget.style.borderColor = "rgba(255,107,107,0.2)"; }}
      >
        ×
      </button>
    </div>
  );
}

// ── AddSubtaskInput ───────────────────────────────────────────────────────────

function AddSubtaskInput({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const [value, setValue]   = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const INPUT_STYLE: CSSProperties = {
    flex: 1, padding: "8px 12px", borderRadius: 12, fontSize: 12,
    background: "rgba(8,15,28,0.9)", border: "1px solid rgba(255,255,255,0.08)",
    color: "#eef2ff", outline: "none", fontFamily: "inherit",
  };

  const handleAdd = async () => {
    const title = value.trim();
    if (!title) return;
    setAdding(true);
    await onAdd(title);
    setValue("");
    setAdding(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex gap-2 mt-1">
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
        placeholder="Новая подзадача..."
        style={INPUT_STYLE}
      />
      <button
        onClick={handleAdd}
        disabled={!value.trim() || adding}
        className="px-3 py-2 rounded-xl text-[12px] font-mono font-semibold transition-all disabled:opacity-40 flex-shrink-0"
        style={{
          background: "rgba(79,142,247,0.14)",
          border: "1px solid rgba(79,142,247,0.35)",
          color: "#c7d8ff",
        }}
      >
        {adding ? "···" : "+ Добавить"}
      </button>
    </div>
  );
}

// ── TaskDetailsModal ──────────────────────────────────────────────────────────

interface TaskDetailsModalProps {
  task: TaskData;
  onClose: () => void;
  onOpenEdit?: (task: TaskData) => void;
  onTaskPatch?: (id: number, patch: Partial<TaskData>) => void;
}

export function TaskDetailsModal({
  task: initialTask,
  onClose,
  onOpenEdit,
  onTaskPatch,
}: TaskDetailsModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [task, setTask] = useState<TaskData>(initialTask);

  useEffect(() => { setTask(initialTask); }, [initialTask]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // REFACTORED: Phase 1 — was: CATEGORIES_META[task.category] ?? { icon: "•", ... }
  const cat = getCategoryMeta(task.category);
  const pri = getPriorityMeta(task.priority);
  const sm  = getStatusMeta(task.status);

  const subs  = task.subtasks ?? [];
  const sDone = subs.filter(s => s.status === "done").length;
  const pct   = subs.length > 0 ? Math.round((sDone / subs.length) * 100) : null;
  const isDone = task.status === "done";

  // REFACTORED: Phase 1 — was: MONTHS_SHORT[task.month] (inline array)
  const dateStr = task.dateFrom === task.dateTo
    ? `${MONTHS_SHORT[task.month]} ${task.dateFrom}`
    : `${MONTHS_SHORT[task.month]} ${task.dateFrom}–${task.dateTo}`;

  const handleToggleTask = () => {
    startTransition(async () => {
      if (isDone) {
        await reopenTask(task.id);
        const patch = { status: "pending" as const };
        setTask(prev => ({ ...prev, ...patch }));
        onTaskPatch?.(task.id, patch);
      } else {
        await completeTask(task.id);
        const patch = { status: "done" as const };
        setTask(prev => ({ ...prev, ...patch }));
        onTaskPatch?.(task.id, patch);
      }
      router.refresh();
    });
  };

  const handleToggleSubtask = (subId: number, markDone: boolean) => {
    startTransition(async () => {
      if (markDone) {
        await completeSubtask(subId);
      } else {
        await reopenSubtask(subId);
      }
      setTask(prev => ({
        ...prev,
        subtasks: prev.subtasks.map(s =>
          s.id === subId
            ? { ...s, status: markDone ? ("done" as const) : ("pending" as const) }
            : s
        ),
      }));
      router.refresh();
    });
  };

  const handleDeleteSubtask = (subId: number) => {
    startTransition(async () => {
      await deleteSubtask(subId);
      setTask(prev => ({ ...prev, subtasks: prev.subtasks.filter(s => s.id !== subId) }));
      router.refresh();
    });
  };

  const handleAddSubtask = async (title: string) => {
    const result = await addSubtask(task.id, { title });
    if (result.success && result.subtask) {
      setTask(prev => ({ ...prev, subtasks: [...prev.subtasks, result.subtask as SubtaskItem] }));
      router.refresh();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(16px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden rounded-3xl animate-scale-in"
        style={{
          background: "linear-gradient(145deg, rgba(10,18,34,0.99), rgba(6,11,22,0.97))",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.80), 0 1px 0 rgba(255,255,255,0.07) inset",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-4 flex-shrink-0"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: `linear-gradient(135deg, ${cat.color}08, transparent 60%)`,
          }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-[18px]"
              style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}35` }}
            >
              {cat.icon}
            </div>
            <div className="min-w-0">
              <h3
                className="text-[15px] font-bold leading-tight mb-1"
                style={{
                  color: isDone ? "rgba(136,153,187,0.6)" : "#eef2ff",
                  textDecoration: isDone ? "line-through" : "none",
                }}
              >
                {task.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-lg"
                  style={{ color: cat.color, background: `${cat.color}14`, border: `1px solid ${cat.color}30` }}>
                  {cat.icon} {task.category}
                </span>
                <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-lg"
                  style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.bd}` }}>
                  {sm.icon} {sm.label}
                </span>
                <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-lg"
                  style={{ color: pri.color, background: `${pri.color}12`, border: `1px solid ${pri.color}30` }}>
                  {pri.label}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[18px] flex-shrink-0 ml-2 transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(136,153,187,0.5)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#eef2ff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "rgba(136,153,187,0.5)"; }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Date + Responsible */}
          <div className="grid grid-cols-2 gap-3">
            <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.16)" }}>
              <p className="text-[9px] font-mono tracking-[2px] uppercase mb-1" style={{ color: "rgba(136,153,187,0.5)" }}>// Срок</p>
              {/* REFACTORED: Phase 1 — was: MONTHS_SHORT[task.month] (inline) */}
              <p className="text-[15px] font-bold font-mono" style={{ color: "#c7d8ff" }}>{dateStr}</p>
            </div>
            <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[9px] font-mono tracking-[2px] uppercase mb-1" style={{ color: "rgba(136,153,187,0.5)" }}>// Ответственный</p>
              <p className="text-[15px] font-bold font-mono" style={{ color: "#eef2ff" }}>{task.responsible}</p>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[9px] font-mono tracking-[2px] uppercase mb-2" style={{ color: "rgba(136,153,187,0.5)" }}>// Описание</p>
              <p className="text-[13px] leading-relaxed" style={{ color: "#c5cde8" }}>{task.description}</p>
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(245,185,66,0.04)", border: "1px solid rgba(245,185,66,0.14)" }}>
              <p className="text-[9px] font-mono tracking-[2px] uppercase mb-2" style={{ color: "rgba(245,185,66,0.45)" }}>// Примечания офицера</p>
              <p className="text-[12px] font-mono leading-relaxed" style={{ color: "rgba(245,185,66,0.75)" }}>{task.notes}</p>
            </div>
          )}

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-mono tracking-[2px] uppercase" style={{ color: "rgba(136,153,187,0.5)" }}>
                // Подзадачи {subs.length > 0 ? `(${sDone}/${subs.length})` : ""}
              </p>
              {pct !== null && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: pct === 100 ? "#1ae8a0" : "#4f8ef7" }} />
                  </div>
                  <span className="text-[10px] font-mono font-semibold"
                    style={{ color: pct === 100 ? "#1ae8a0" : "rgba(136,153,187,0.6)" }}>
                    {pct}%
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              {subs.map(sub => (
                <SubtaskRow
                  key={sub.id}
                  sub={sub}
                  onToggle={handleToggleSubtask}
                  onDelete={handleDeleteSubtask}
                />
              ))}
              {subs.length === 0 && (
                <p className="text-[11px] font-mono text-center py-3" style={{ color: "rgba(136,153,187,0.3)" }}>
                  Подзадачи не добавлены
                </p>
              )}
            </div>
            <AddSubtaskInput onAdd={handleAddSubtask} />
          </div>

          <p className="text-[9px] font-mono text-right" style={{ color: "rgba(136,153,187,0.25)" }}>
            // task.id = {task.id}
          </p>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={handleToggleTask}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-mono font-semibold transition-all disabled:opacity-50"
            style={isDone
              ? { background: "rgba(136,153,187,0.08)", border: "1px solid rgba(136,153,187,0.2)", color: "rgba(136,153,187,0.7)" }
              : { background: "rgba(26,232,160,0.10)", border: "1px solid rgba(26,232,160,0.30)", color: "#1ae8a0" }
            }
          >
            {isPending
              ? <span className="animate-pulse">···</span>
              : isDone
                ? <><span>↩</span> Переоткрыть</>
                : <><span>✓</span> Выполнено</>
            }
          </button>

          <div className="flex items-center gap-2">
            {onOpenEdit && (
              <button
                onClick={() => { onClose(); onOpenEdit(task); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-mono transition-all"
                style={{ border: "1px solid rgba(245,185,66,0.28)", background: "rgba(245,185,66,0.07)", color: "rgba(245,185,66,0.75)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,185,66,0.13)"; e.currentTarget.style.color = "#fcd34d"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(245,185,66,0.07)"; e.currentTarget.style.color = "rgba(245,185,66,0.75)"; }}
              >
                ✎ Изменить
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[12px] font-mono tracking-wide transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(136,153,187,0.5)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}