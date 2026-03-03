// components/modals/EditTaskModal.tsx
// FIXED:      BUG-2    — was empty stub
// REFACTORED: Phase 1  — replaced inline CATEGORIES_LIST / PRIORITIES_LIST /
//                        MONTHS_FORM / PERSONNEL with imports from @/lib/config
"use client";

import { useState, useEffect, useTransition, type CSSProperties } from "react";
import { updateTask, deleteTask } from "@/actions/tasks";
import { useRouter } from "next/navigation";
// REFACTORED: Phase 1 — import from canonical config instead of inlining
import { CATEGORY_LIST, PRIORITY_LIST } from "@/lib/config/meta";
import { MONTHS_LIST, PERSONNEL }       from "@/lib/config/constants";

// ── Types ─────────────────────────────────────────────────────────────────────

type SubtaskStatus = "pending" | "in_progress" | "done" | "cancelled";

type Subtask = {
  id: number; taskId: number; title: string; description: string | null;
  status: SubtaskStatus; order: number;
  completedAt: Date | null; createdAt: Date; updatedAt: Date;
  [key: string]: unknown;
};

export interface TaskData {
  id: number; title: string; category: string; priority: string;
  status: string; responsible: string; month: number; dateFrom: number;
  dateTo: number; description: string | null; notes: string | null;
  subtasks: Subtask[];
}

// ── Styles ────────────────────────────────────────────────────────────────────

const INPUT_STYLE: CSSProperties = {
  width: "100%", padding: "9px 14px", borderRadius: 12, fontSize: 13,
  background: "rgba(8,15,28,0.9)", border: "1px solid rgba(255,255,255,0.08)",
  color: "#eef2ff", outline: "none", fontFamily: "inherit", transition: "border-color 0.15s",
};

const LABEL_CLS = "text-[9px] font-mono tracking-[2px] uppercase block mb-1.5";
const LABEL_STYLE: CSSProperties = { color: "rgba(136,153,187,0.6)" };

// ── EditTaskModal ─────────────────────────────────────────────────────────────

interface EditTaskModalProps {
  task: TaskData;
  onClose: () => void;
  onTaskPatch?: (id: number, patch: Partial<TaskData>) => void;
  onTaskDelete?: (id: number) => void;
}

export function EditTaskModal({ task, onClose, onTaskPatch, onTaskDelete }: EditTaskModalProps) {
  const router = useRouter();
  const [isPending,  startTransition      ] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError]               = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState({
    title:       task.title,
    category:    task.category,
    priority:    task.priority,
    responsible: task.responsible,
    month:       task.month,
    dateFrom:    task.dateFrom,
    dateTo:      task.dateTo,
    description: task.description ?? "",
    notes:       task.notes ?? "",
  });

  const set = (key: keyof typeof form, value: string | number) =>
    setForm(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as unknown as KeyboardEvent).key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // REFACTORED: Phase 1 — was: CATEGORIES_LIST.find(c => c.code === form.category)
  const selectedCat = CATEGORY_LIST.find(c => c.code === form.category);

  const handleSubmit = () => {
    if (!form.title.trim()) { setError("Введите название задачи"); return; }
    if (form.dateFrom > form.dateTo) { setError("Дата начала не может быть позже даты конца"); return; }
    setError("");
    startTransition(async () => {
      const result = await updateTask(task.id, {
        title:       form.title.trim(),
        category:    form.category,
        priority:    form.priority,
        responsible: form.responsible,
        month:       form.month,
        dateFrom:    form.dateFrom,
        dateTo:      form.dateTo,
        description: form.description || null,
        notes:       form.notes || null,
      });
      if (result.success) {
        onTaskPatch?.(task.id, {
          ...form,
          title: form.title.trim(),
          description: form.description || null,
          notes: form.notes || null,
        });
        onClose();
        router.refresh();
      } else {
        setError(result.error ?? "Ошибка при обновлении задачи");
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      await deleteTask(task.id);
      onTaskDelete?.(task.id);
      onClose();
      router.refresh();
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(16px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl animate-scale-in"
        style={{
          background: "linear-gradient(145deg, rgba(10,18,34,0.99), rgba(6,11,22,0.97))",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.07) inset",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(135deg, rgba(245,185,66,0.04), transparent)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(245,185,66,0.2), rgba(255,140,66,0.12))",
                border: "1px solid rgba(245,185,66,0.3)",
              }}
            >
              <span style={{ fontSize: 14 }}>✎</span>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold" style={{ color: "#eef2ff" }}>
                Редактирование задачи
              </h3>
              <p className="text-[10px] font-mono" style={{ color: "rgba(136,153,187,0.5)" }}>
                // ID #{task.id} · {task.responsible}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[18px] transition-all"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(136,153,187,0.5)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#eef2ff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "rgba(136,153,187,0.5)"; }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Title */}
          <label className="block">
            <span className={LABEL_CLS} style={LABEL_STYLE}>// Название задачи *</span>
            <input
              autoFocus
              value={form.title}
              onChange={e => set("title", e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="Наименование мероприятия..."
              style={INPUT_STYLE}
            />
          </label>

          {/* Category — REFACTORED: Phase 1, was CATEGORIES_LIST */}
          <div>
            <span className={LABEL_CLS} style={LABEL_STYLE}>// Категория</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_LIST.map(cat => {
                const active = form.category === cat.code;
                return (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => set("category", cat.code)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-semibold transition-all"
                    style={active
                      ? { background: `${cat.color}18`, border: `1px solid ${cat.color}45`, color: cat.color }
                      : { background: "rgba(8,15,28,0.8)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(136,153,187,0.5)" }
                    }
                  >
                    <span className="text-[11px]">{cat.icon}</span> {cat.code}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Priority — REFACTORED: Phase 1, was PRIORITIES_LIST */}
            <div>
              <span className={LABEL_CLS} style={LABEL_STYLE}>// Приоритет</span>
              <div className="flex gap-1.5">
                {PRIORITY_LIST.map(p => {
                  const active = form.priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => set("priority", p.value)}
                      className="flex-1 py-2 rounded-xl text-[9px] font-mono font-semibold tracking-wide transition-all"
                      style={active
                        ? { background: `${p.color}15`, border: `1px solid ${p.color}45`, color: p.color }
                        : { background: "rgba(8,15,28,0.8)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(136,153,187,0.4)" }
                      }
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Responsible — REFACTORED: Phase 1, was inline PERSONNEL */}
            <div>
              <span className={LABEL_CLS} style={LABEL_STYLE}>// Ответственный</span>
              <div className="grid grid-cols-3 gap-1">
                {PERSONNEL.map(p => {
                  const active = form.responsible === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => set("responsible", p)}
                      className="py-2 rounded-xl text-[10px] font-mono font-bold tracking-wide transition-all"
                      style={active
                        ? { background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.4)", color: "#c7d8ff" }
                        : { background: "rgba(8,15,28,0.8)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(136,153,187,0.5)" }
                      }
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Month — REFACTORED: Phase 1, was inline MONTHS_FORM */}
          <div>
            <span className={LABEL_CLS} style={LABEL_STYLE}>// Месяц исполнения</span>
            <div className="flex gap-1 flex-wrap">
              {MONTHS_LIST.map((m, i) => {
                const monthNum = i + 1;
                const active   = form.month === monthNum;
                return (
                  <button
                    key={monthNum}
                    type="button"
                    onClick={() => set("month", monthNum)}
                    className="px-2.5 py-1.5 rounded-xl text-[9px] font-mono font-semibold transition-all"
                    style={active
                      ? { background: "rgba(79,142,247,0.18)", border: "1px solid rgba(79,142,247,0.45)", color: "#c7d8ff" }
                      : { background: "rgba(8,15,28,0.8)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(136,153,187,0.45)" }
                    }
                  >
                    {m.substring(0, 3).toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates — REFACTORED: Phase 1, was inline MONTHS_FORM[form.month - 1] */}
          <div>
            <span className={LABEL_CLS} style={LABEL_STYLE}>
              // Сроки · {MONTHS_LIST[form.month - 1]}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[9px] font-mono mb-1" style={{ color: "rgba(136,153,187,0.3)" }}>С числа</p>
                <input
                  type="number" min={1} max={31} value={form.dateFrom}
                  onChange={e => set("dateFrom", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{ ...INPUT_STYLE, textAlign: "center", fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#c7d8ff" }}
                />
              </div>
              <div className="flex flex-col items-center gap-1 pt-4">
                <div className="h-px w-8" style={{ background: "rgba(79,142,247,0.3)" }} />
                <span className="text-[10px] font-mono" style={{ color: "rgba(136,153,187,0.3)" }}>→</span>
                <div className="h-px w-8" style={{ background: "rgba(79,142,247,0.3)" }} />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-mono mb-1" style={{ color: "rgba(136,153,187,0.3)" }}>По число</p>
                <input
                  type="number" min={1} max={31} value={form.dateTo}
                  onChange={e => set("dateTo", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{ ...INPUT_STYLE, textAlign: "center", fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#c7d8ff" }}
                />
              </div>
              <div className="flex-1 pt-4">
                <p className="text-[9px] font-mono text-center" style={{ color: "rgba(136,153,187,0.35)" }}>
                  {form.dateTo >= form.dateFrom ? `${form.dateTo - form.dateFrom + 1} дн.` : "❌"}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <label className="block">
            <span className={LABEL_CLS} style={LABEL_STYLE}>// Описание (необязательно)</span>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Детали, контекст, требования..."
              rows={2}
              style={{ ...INPUT_STYLE, resize: "none", lineHeight: 1.6 }}
            />
          </label>

          {/* Notes */}
          <label className="block">
            <span className={LABEL_CLS} style={{ color: "rgba(245,185,66,0.4)" }}>// Примечания офицера</span>
            <textarea
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="Ремарки, уточнения..."
              rows={2}
              style={{ ...INPUT_STYLE, resize: "none", lineHeight: 1.6, color: "rgba(245,185,66,0.75)", fontFamily: "var(--font-mono)", fontSize: 12 }}
            />
          </label>

          {/* Delete confirmation */}
          {confirmDelete && (
            <div
              className="px-4 py-3 rounded-2xl space-y-2"
              style={{ background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.25)" }}
            >
              <p className="text-[11px] font-mono" style={{ color: "#ff9999" }}>
                ⚠ Удалить задачу и все её подзадачи ({task.subtasks?.length ?? 0} шт.)? Это нельзя отменить.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold transition-all disabled:opacity-50"
                  style={{ background: "rgba(255,107,107,0.18)", border: "1px solid rgba(255,107,107,0.45)", color: "#ff9999" }}
                >
                  {isDeleting ? "Удаление..." : "Да, удалить"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(136,153,187,0.5)" }}
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {error && (
            <div
              className="px-3 py-2.5 rounded-2xl text-[11px] font-mono"
              style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.25)", color: "#ff9999" }}
            >
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2">
            {!confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-mono transition-all"
                style={{ border: "1px solid rgba(255,107,107,0.2)", background: "rgba(255,107,107,0.04)", color: "rgba(255,107,107,0.55)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,107,107,0.09)"; e.currentTarget.style.color = "#ff9999"; e.currentTarget.style.borderColor = "rgba(255,107,107,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,107,107,0.04)"; e.currentTarget.style.color = "rgba(255,107,107,0.55)"; e.currentTarget.style.borderColor = "rgba(255,107,107,0.2)"; }}
              >
                🗑 Удалить
              </button>
            )}
            {selectedCat && (
              <span
                className="text-[10px] font-mono font-semibold px-2 py-1 rounded-xl"
                style={{
                  background: `${selectedCat.color}15`,
                  border: `1px solid ${selectedCat.color}35`,
                  color: selectedCat.color,
                }}
              >
                {selectedCat.icon} {form.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[12px] font-mono tracking-wide transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(136,153,187,0.5)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-[12px] font-semibold tracking-wide transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, rgba(245,185,66,0.28), rgba(255,140,66,0.18))",
                border: "1px solid rgba(245,185,66,0.45)",
                color: "#fcd34d",
                boxShadow: "0 4px 16px rgba(245,185,66,0.12)",
              }}
            >
              {isPending ? <span className="animate-pulse">···</span> : <><span>✓</span> Сохранить</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}