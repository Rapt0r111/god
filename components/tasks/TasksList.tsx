"use client";

import {
  useState,
  useTransition,
  useRef,
  useEffect,
  type KeyboardEvent,
  type CSSProperties,
} from "react";
import {
  completeTask,
  reopenTask,
  completeSubtask,
  reopenSubtask,
  addSubtask,
  deleteSubtask,
  updateSubtask,
  updateTaskNotes,
} from "@/actions/tasks";
// Local type matching the DB subtasks table shape
type Subtask = {
  id:          number;
  taskId:      number;
  title:       string;
  description: string | null;
  status:      "pending" | "in_progress" | "done" | "cancelled";
  order:       number;
  completedAt: Date | null;
  createdAt:   Date;
  updatedAt:   Date;
  [key: string]: unknown;
};

// ── Константы ─────────────────────────────────────────────────────────

const MONTHS_SHORT = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];
const MONTHS_FULL  = ["","Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

const CATEGORIES: Record<string, { icon: string; color: string; label: string }> = {
  "Н":   { icon: "⚗",  color: "#10b981", label: "Наука" },
  "А":   { icon: "📡", color: "#3b82f6", label: "Агитация" },
  "БП":  { icon: "🎯", color: "#ef4444", label: "Боевая подг." },
  "ПД":  { icon: "⚙",  color: "#f59e0b", label: "Повседн. деят." },
  "ВПР": { icon: "🎖", color: "#a78bfa", label: "ВПР" },
  "У":   { icon: "🏁", color: "#f97316", label: "Увольнение" },
  "П":   { icon: "🔰", color: "#06b6d4", label: "Призыв" },
  "ЗиТ": { icon: "💻", color: "#94a3b8", label: "Техника" },
  "ЕМ":  { icon: "📋", color: "#fbbf24", label: "Ежемесячные" },
  "НД":  { icon: "🔬", color: "#10b981", label: "Научная деят." },
  "МГ":  { icon: "⚡", color: "#ef4444", label: "Мобготовность" },
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f59e0b",
  normal:   "#10b981",
};

const PRIORITY_LABEL: Record<string, string> = {
  critical: "КРИТИЧЕСКИЙ",
  high:     "ВЫСОКИЙ",
  normal:   "НОРМАЛЬНЫЙ",
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:     { label: "ОЖИДАЕТ",    color: "#7d9ab5", bg: "rgba(125,154,181,0.1)",  border: "rgba(125,154,181,0.25)"  },
  in_progress: { label: "В РАБОТЕ",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.25)"   },
  done:        { label: "ВЫПОЛНЕНО",  color: "#10b981", bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.25)"   },
  cancelled:   { label: "ОТМЕНЕНО",   color: "#ef4444", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.25)"    },
};

// ── Типы ─────────────────────────────────────────────────────────────

interface TaskData {
  id:          number;
  title:       string;
  category:    string;
  priority:    string;
  status:      string;
  responsible: string;
  month:       number;
  dateFrom:    number;
  dateTo:      number;
  description: string | null;
  notes:       string | null;
  subtasks: Subtask[];
}

// ── AutoTextarea ──────────────────────────────────────────────────────

function AutoTextarea({ value, onChange, onBlur, placeholder, style }: {
  value: string; onChange: (v: string) => void;
  onBlur?: () => void; placeholder: string; style?: CSSProperties;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);
  return (
    <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)}
      onBlur={onBlur} placeholder={placeholder} rows={1}
      style={{ resize: "none", overflow: "hidden", ...style }} />
  );
}

// ── CheckBox ──────────────────────────────────────────────────────────

function CheckBox({ done, pending, onToggle }: { done: boolean; pending: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle(); }}
      disabled={pending}
      className="flex items-center justify-center shrink-0 rounded transition-all duration-200"
      style={{
        width: 20, height: 20, minWidth: 20, fontSize: 11,
        border: done ? "1px solid rgba(16,185,129,0.7)" : "1px solid rgba(255,255,255,0.2)",
        background: done ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.03)",
        color: done ? "#34d399" : "transparent",
        opacity: pending ? 0.5 : 1,
        cursor: pending ? "wait" : "pointer",
        boxShadow: done ? "0 0 10px rgba(16,185,129,0.25)" : "none",
      }}
    >
      {pending ? <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>···</span> : done ? "✓" : null}
    </button>
  );
}

// ── SubtaskRow ────────────────────────────────────────────────────────

function SubtaskRow({ subtask, onDelete, onStatusChange, onContentChange }: {
  subtask: Subtask;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: Subtask["status"]) => void;
  onContentChange: (id: number, data: { title?: string; description?: string | null }) => void;
}) {
  const [editing,  setEditing ] = useState(false);
  const [title,    setTitle   ] = useState(subtask.title);
  const [desc,     setDesc    ] = useState(subtask.description ?? "");
  const [showDesc, setShowDesc] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isDone = subtask.status === "done";

  useEffect(() => { setTitle(subtask.title); setDesc(subtask.description ?? ""); }, [subtask.title, subtask.description]);

  const handleToggle = () => startTransition(async () => {
    const next = isDone ? "pending" : "done";
    onStatusChange(subtask.id, next);
    if (isDone) await reopenSubtask(subtask.id); else await completeSubtask(subtask.id);
  });

  const handleSave = () => {
    if (title.trim() === subtask.title && desc === (subtask.description ?? "")) { setEditing(false); return; }
    startTransition(async () => {
      const nextTitle = title.trim() || subtask.title;
      await updateSubtask(subtask.id, { title: nextTitle, description: desc || undefined });
      onContentChange(subtask.id, { title: nextTitle, description: desc || null });
      setEditing(false);
    });
  };

  return (
    <div className="group" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: isDone ? 0.45 : 1, transition: "opacity 0.2s" }}>
      <div className="flex items-center gap-2.5 py-2">
        <div className="w-1 h-1 rounded-full shrink-0 ml-0.5" style={{ background: "rgba(255,255,255,0.2)" }} />
        <CheckBox done={isDone} pending={isPending} onToggle={handleToggle} />
        {editing ? (
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") { setTitle(subtask.title); setEditing(false); }
            }}
            className="flex-1 px-2 py-0.5 rounded text-[12px] outline-none"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.3)", color: "#e8f0fe" }}
          />
        ) : (
          <span className="flex-1 text-[12px] cursor-text select-none"
            style={{ color: isDone ? "rgba(255,255,255,0.3)" : "rgba(200,216,232,0.9)", textDecoration: isDone ? "line-through" : "none", lineHeight: "1.5" }}
            onDoubleClick={() => !isDone && setEditing(true)} title="Дважды кликните для редактирования"
          >
            {subtask.title}
          </span>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setShowDesc(s => !s)}
            className="flex items-center justify-center rounded transition-all"
            style={{ width: 20, height: 20, fontSize: 9, fontFamily: "var(--font-mono)",
              border: "1px solid rgba(255,255,255,0.12)",
              background: showDesc ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)",
              color: showDesc ? "#93c5fd" : "rgba(255,255,255,0.4)" }}>
            {desc ? "≡" : "+"}
          </button>
          <button onClick={() => onDelete(subtask.id)}
            className="flex items-center justify-center rounded transition-all"
            style={{ width: 20, height: 20, fontSize: 13, border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.25)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
            ×
          </button>
        </div>
      </div>
      {showDesc && (
        <div className="ml-5 mb-2 mr-2">
          <AutoTextarea value={desc} onChange={setDesc}
            onBlur={() => { if (desc !== (subtask.description ?? "")) startTransition(async () => { await updateSubtask(subtask.id, { description: desc }); onContentChange(subtask.id, { description: desc || null }); }); }}
            placeholder="Описание подзадачи..."
            style={{ width: "100%", padding: "6px 10px", borderRadius: 8, fontSize: 11, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(200,216,232,0.7)", fontFamily: "var(--font-mono)", outline: "none" }}
          />
        </div>
      )}
    </div>
  );
}

// ── AddSubtaskInput ───────────────────────────────────────────────────

function AddSubtaskInput({ taskId, onAdd }: { taskId: number; onAdd: (s: Subtask) => void }) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await addSubtask(taskId, { title: trimmed });
      if (result.success) { onAdd(result.subtask); setValue(""); }
    });
  };

  return (
    <div className="flex items-center gap-2.5 mt-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="w-1 h-1 rounded-full shrink-0 ml-0.5" style={{ background: "rgba(255,255,255,0.15)" }} />
      <div className="flex items-center justify-center shrink-0 rounded" style={{ width: 18, height: 18, border: "1px dashed rgba(255,255,255,0.15)" }} />
      <input value={value} onChange={e => setValue(e.target.value)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setValue(""); }}
        placeholder="Добавить подзадачу... (Enter)" disabled={isPending}
        className="flex-1 bg-transparent text-[12px] outline-none"
        style={{ color: "rgba(200,216,232,0.5)", fontFamily: "inherit" }}
      />
      {value.trim() && (
        <button onClick={handleAdd} disabled={isPending}
          className="px-2.5 py-1 rounded-lg text-[10px] font-mono tracking-wide transition-all"
          style={{ border: "1px solid rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.1)", color: "#34d399" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(16,185,129,0.18)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.55)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(16,185,129,0.1)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.35)"; }}>
          {isPending ? "···" : "+ ОК"}
        </button>
      )}
    </div>
  );
}

// ── NotesSection ──────────────────────────────────────────────────────

function NotesSection({ task, onTaskPatch }: { task: TaskData; onTaskPatch: (id: number, patch: Partial<TaskData>) => void }) {
  const [desc, setDesc]           = useState(task.description ?? "");
  const [notes, setNotes]         = useState(task.notes ?? "");
  const [savedDesc, setSavedDesc] = useState(task.description ?? "");
  const [savedNotes, setSavedNotes] = useState(task.notes ?? "");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [, startTransition]       = useTransition();

  useEffect(() => { setDesc(task.description ?? ""); setNotes(task.notes ?? ""); setSavedDesc(task.description ?? ""); setSavedNotes(task.notes ?? ""); }, [task.id, task.description, task.notes]);

  const saveField = (field: "description" | "notes", value: string) => {
    const original = field === "description" ? savedDesc : savedNotes;
    if (value === original) return;
    setSaving(true);
    startTransition(async () => {
      await updateTaskNotes(task.id, { [field]: value });
      if (field === "description") { setSavedDesc(value); onTaskPatch(task.id, { description: value || null }); }
      else { setSavedNotes(value); onTaskPatch(task.id, { notes: value || null }); }
      setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 1500);
    });
  };

  const fieldStyle: CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(200,216,232,0.85)", outline: "none", transition: "border-color 0.15s ease", fontFamily: "inherit", lineHeight: 1.6 };

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>// Описание задачи</span>
        <AutoTextarea value={desc} onChange={setDesc} onBlur={() => saveField("description", desc)} placeholder="Детальное описание задачи..." style={fieldStyle} />
      </label>
      <label className="block">
        <span className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5" style={{ color: "rgba(245,158,11,0.4)" }}>// Примечания офицера</span>
        <AutoTextarea value={notes} onChange={setNotes} onBlur={() => saveField("notes", notes)} placeholder="Заметки, ремарки, уточнения..."
          style={{ ...fieldStyle, color: "rgba(245,158,11,0.75)", fontFamily: "var(--font-mono)", fontSize: 11 }} />
      </label>
      <div className="text-right h-4">
        {saving && <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>сохранение...</span>}
        {saved  && <span className="text-[10px] font-mono" style={{ color: "#10b981" }}>✓ сохранено</span>}
      </div>
    </div>
  );
}

// ── TaskRow ───────────────────────────────────────────────────────────

function TaskRow({ task, onOpen, onTaskPatch }: { task: TaskData; onOpen: (id: number) => void; onTaskPatch: (id: number, patch: Partial<TaskData>) => void }) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "done";
  const isCrit = task.priority === "critical";

  const cat      = CATEGORIES[task.category] ?? { icon: "•", color: "#6b8ba8", label: task.category };
  const priColor = PRIORITY_COLOR[task.priority] ?? "#6b8ba8";
  const subsDone = task.subtasks.filter(s => s.status === "done").length;
  const subsTotal= task.subtasks.length;
  const progress = subsTotal > 0 ? Math.round((subsDone / subsTotal) * 100) : 0;

  const handleToggle = () => startTransition(async () => {
    if (isDone) {
      onTaskPatch(task.id, { status: "pending", subtasks: task.subtasks.map(s => ({ ...s, status: "pending" })) });
      await reopenTask(task.id);
    } else {
      onTaskPatch(task.id, { status: "done", subtasks: task.subtasks.map(s => ({ ...s, status: "done" })) });
      await completeTask(task.id);
    }
  });

  const dateStr = task.dateFrom === task.dateTo ? `${task.dateFrom}` : `${task.dateFrom}–${task.dateTo}`;

  return (
    <div
      className="relative cursor-pointer transition-all duration-200 rounded-xl overflow-hidden group"
      style={{
        background: isDone ? "rgba(255,255,255,0.01)" : isCrit
          ? "linear-gradient(135deg, rgba(239,68,68,0.05), rgba(255,255,255,0.02))"
          : "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        border: isDone ? "1px solid rgba(255,255,255,0.05)" : isCrit
          ? "1px solid rgba(239,68,68,0.18)"
          : "1px solid rgba(255,255,255,0.08)",
        opacity: isDone ? 0.55 : 1,
      }}
      onClick={() => onOpen(task.id)}
    >
      {/* Priority bar */}
      <div className="absolute left-0 top-0 bottom-0" style={{ width: 3, background: isDone ? "rgba(255,255,255,0.08)" : priColor, boxShadow: isDone ? "none" : `0 0 8px ${priColor}50` }} />

      <div className="flex items-center gap-3 px-4 py-3 pl-5">
        <CheckBox done={isDone} pending={isPending} onToggle={handleToggle} />

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium truncate mb-1.5"
            style={{ color: isDone ? "rgba(255,255,255,0.3)" : "#e8f0fe", textDecoration: isDone ? "line-through" : "none", letterSpacing: "0.01em" }}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date range */}
            <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
              <span style={{ opacity: 0.5 }}>📅</span>
              {MONTHS_SHORT[task.month]} {dateStr}
            </span>

            {/* Category */}
            <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md"
              style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }}>
              {cat.icon} {task.category}
            </span>

            {/* Responsible */}
            <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md"
              style={{ background: `${priColor}10`, color: priColor, border: `1px solid ${priColor}25` }}>
              {task.responsible}
            </span>

            {/* Subtask progress */}
            {subsTotal > 0 && (
              <span className="text-[9px] font-mono" style={{ color: progress === 100 ? "#10b981" : "rgba(255,255,255,0.3)" }}>
                {subsDone}/{subsTotal} подз.
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {subsTotal > 0 && (
          <div className="w-14 shrink-0">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: progress === 100 ? "#10b981" : `linear-gradient(90deg, ${priColor}80, ${priColor})` }} />
            </div>
          </div>
        )}

        {/* Open arrow */}
        <span className="shrink-0 text-[13px] opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: "#93c5fd" }}>→</span>

        {isPending && <span className="text-[10px] font-mono animate-pulse shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>···</span>}
      </div>
    </div>
  );
}

// ── TaskDetailsModal ──────────────────────────────────────────────────

function TaskDetailsModal({ task, onClose, onTaskPatch }: {
  task: TaskData; onClose: () => void;
  onTaskPatch: (id: number, patch: Partial<TaskData>) => void;
}) {
  const [activeTab, setActiveTab] = useState<"info" | "subtasks" | "notes">("info");
  const [isPending, startTransition] = useTransition();

  const isDone    = task.status === "done";
  const cat       = CATEGORIES[task.category] ?? { icon: "•", color: "#6b8ba8", label: task.category };
  const priColor  = PRIORITY_COLOR[task.priority] ?? "#6b8ba8";
  const priLabel  = PRIORITY_LABEL[task.priority] ?? task.priority;
  const statusMeta= STATUS_META[task.status] ?? STATUS_META.pending;
  const subsDone  = task.subtasks.filter(s => s.status === "done").length;
  const subsTotal = task.subtasks.length;
  const progress  = subsTotal > 0 ? Math.round((subsDone / subsTotal) * 100) : 0;

  // Duration in days
  const durationDays = task.dateTo - task.dateFrom + 1;
  const dateStr = task.dateFrom === task.dateTo
    ? `${task.dateFrom} ${MONTHS_FULL[task.month]}`
    : `${task.dateFrom}–${task.dateTo} ${MONTHS_FULL[task.month]}`;

  useEffect(() => { setActiveTab("info"); }, [task.id]);

  useEffect(() => {
    const handler = (e: Event) => { if ((e as unknown as KeyboardEvent).key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleToggleTask = () => startTransition(async () => {
    if (isDone) {
      onTaskPatch(task.id, { status: "pending", subtasks: task.subtasks.map(s => ({ ...s, status: "pending" as Subtask["status"] })) });
      await reopenTask(task.id);
    } else {
      onTaskPatch(task.id, { status: "done", subtasks: task.subtasks.map(s => ({ ...s, status: "done" as Subtask["status"] })) });
      await completeTask(task.id);
    }
  });

  const handleSubtaskStatusChange = (id: number, status: Subtask["status"]) =>
    onTaskPatch(task.id, { subtasks: task.subtasks.map(s => s.id === id ? { ...s, status } : s) });

  const handleSubtaskContentChange = (id: number, data: { title?: string; description?: string | null }) =>
    onTaskPatch(task.id, { subtasks: task.subtasks.map(s => s.id === id ? { ...s, ...data } : s) });

  const handleDeleteSubtask = (id: number) => {
    onTaskPatch(task.id, { subtasks: task.subtasks.filter(s => s.id !== id) });
    void deleteSubtask(id);
  };

  const handleAddSubtask = (subtask: Subtask) =>
    onTaskPatch(task.id, { subtasks: [...task.subtasks, subtask] });

  const tabs = [
    { id: "info" as const,     label: "Детали" },
    { id: "subtasks" as const, label: `Подзадачи${subsTotal > 0 ? ` (${subsDone}/${subsTotal})` : ""}` },
    { id: "notes" as const,    label: "Примечания" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(14px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl animate-scale-in"
        style={{
          background: "linear-gradient(145deg, rgba(13,24,41,0.98), rgba(7,13,26,0.96))",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05) inset",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-5 py-4 flex items-start gap-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "linear-gradient(135deg, rgba(255,255,255,0.03), transparent)" }}>
          {/* Category icon */}
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[20px] shrink-0"
            style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}35`, boxShadow: `0 4px 16px ${cat.color}15` }}>
            {cat.icon}
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[9px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded-md"
                style={{ background: `${cat.color}18`, color: cat.color, border: `1px solid ${cat.color}35` }}>
                {cat.icon} {cat.label}
              </span>
              <span className="text-[9px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded-md"
                style={{ background: `${priColor}15`, color: priColor, border: `1px solid ${priColor}35`, boxShadow: task.priority === "critical" ? `0 0 8px ${priColor}20` : "none" }}>
                {priLabel}
              </span>
              <span className="text-[9px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded-md"
                style={{ background: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.border}` }}>
                {statusMeta.label}
              </span>
            </div>

            <h3 className="text-[15px] font-semibold leading-snug"
              style={{ color: isDone ? "rgba(255,255,255,0.4)" : "#e8f0fe", textDecoration: isDone ? "line-through" : "none" }}>
              {task.title}
            </h3>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Complete / Reopen button */}
            <button onClick={handleToggleTask} disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold tracking-wider transition-all duration-200 disabled:opacity-50"
              style={isDone ? {
                border: "1px solid rgba(245,158,11,0.4)",
                background: "rgba(245,158,11,0.1)",
                color: "#fbbf24",
                boxShadow: "0 2px 8px rgba(245,158,11,0.1)",
              } : {
                border: "1px solid rgba(16,185,129,0.4)",
                background: "rgba(16,185,129,0.1)",
                color: "#34d399",
                boxShadow: "0 2px 8px rgba(16,185,129,0.1)",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {isPending ? "···" : isDone ? "↺ Открыть" : "✓ Завершить"}
            </button>

            {/* Close button */}
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all text-[18px]"
              style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
              title="Закрыть (Esc)">
              ×
            </button>
          </div>
        </div>

        {/* ── Progress bar (if subtasks) ── */}
        {subsTotal > 0 && (
          <div className="px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>ПРОГРЕСС ПОДЗАДАЧ</span>
              <span className="text-[10px] font-mono" style={{ color: progress === 100 ? "#10b981" : "rgba(255,255,255,0.4)" }}>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: progress === 100 ? "linear-gradient(90deg, #10b981, #34d399)" : `linear-gradient(90deg, ${priColor}80, ${priColor})`, boxShadow: progress === 100 ? "0 0 8px rgba(16,185,129,0.4)" : "none" }} />
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="px-5 py-2.5 text-[11px] font-mono tracking-wide transition-all relative"
                style={{ color: isActive ? "#93c5fd" : "rgba(255,255,255,0.3)", borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent", background: isActive ? "rgba(59,130,246,0.05)" : "transparent" }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* INFO TAB */}
          {activeTab === "info" && (
            <div className="space-y-4">

              {/* Date block — main highlight */}
              <div className="rounded-xl p-4" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.04))", border: "1px solid rgba(59,130,246,0.2)" }}>
                <p className="text-[9px] font-mono tracking-[2px] uppercase mb-3" style={{ color: "rgba(59,130,246,0.6)" }}>
                  // Сроки исполнения
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-[9px] font-mono tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>НАЧАЛО</p>
                    <p className="text-[22px] font-bold font-mono tabular-nums" style={{ color: "#93c5fd" }}>{task.dateFrom}</p>
                    <p className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{MONTHS_SHORT[task.month]}</p>
                  </div>
                  <div className="text-center flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="h-px w-6" style={{ background: "rgba(59,130,246,0.4)" }} />
                      <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>→</span>
                      <div className="h-px w-6" style={{ background: "rgba(59,130,246,0.4)" }} />
                    </div>
                    <p className="text-[11px] font-mono font-semibold" style={{ color: "#60a5fa" }}>{durationDays} {durationDays === 1 ? "день" : durationDays < 5 ? "дня" : "дней"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-mono tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>КОНЕЦ</p>
                    <p className="text-[22px] font-bold font-mono tabular-nums" style={{ color: "#93c5fd" }}>{task.dateTo}</p>
                    <p className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{MONTHS_SHORT[task.month]}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 text-center" style={{ borderTop: "1px solid rgba(59,130,246,0.15)" }}>
                  <p className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {dateStr}
                  </p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "КАТЕГОРИЯ",    value: `${cat.icon} ${cat.label}`, color: cat.color },
                  { label: "ОТВЕТСТВЕННЫЙ", value: task.responsible,          color: priColor  },
                  { label: "ПРИОРИТЕТ",    value: priLabel,                   color: priColor  },
                  { label: "СТАТУС",       value: statusMeta.label,           color: statusMeta.color },
                ].map(row => (
                  <div key={row.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-[8px] font-mono tracking-[1.5px] uppercase mb-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>{row.label}</p>
                    <p className="text-[12px] font-semibold font-mono" style={{ color: row.color }}>{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              {task.description && (
                <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-[9px] font-mono tracking-[2px] uppercase mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>// Описание</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: "rgba(200,216,232,0.8)" }}>{task.description}</p>
                </div>
              )}

              {/* Notes */}
              {task.notes && (
                <div className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <p className="text-[9px] font-mono tracking-[2px] uppercase mb-2" style={{ color: "rgba(245,158,11,0.5)" }}>// Примечания офицера</p>
                  <p className="text-[12px] leading-relaxed font-mono" style={{ color: "rgba(245,158,11,0.75)" }}>{task.notes}</p>
                </div>
              )}

              {/* Quick action: go to subtasks */}
              <button onClick={() => setActiveTab("subtasks")}
                className="w-full py-2.5 rounded-xl text-[11px] font-mono tracking-wider transition-all duration-200"
                style={{ border: "1px solid rgba(59,130,246,0.25)", background: "rgba(59,130,246,0.06)", color: "#93c5fd" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.12)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(59,130,246,0.06)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.25)"; }}>
                ◻ Подзадачи{subsTotal > 0 ? ` · ${subsDone}/${subsTotal} выполнено` : " · нет"}
              </button>
            </div>
          )}

          {/* SUBTASKS TAB */}
          {activeTab === "subtasks" && (
            <div>
              {task.subtasks.length === 0 ? (
                <div className="text-center py-10" style={{ color: "rgba(255,255,255,0.2)" }}>
                  <div className="text-3xl mb-3 opacity-30">◻</div>
                  <p className="text-[11px] font-mono">// Подзадачи не добавлены</p>
                </div>
              ) : (
                task.subtasks.map(sub => (
                  <SubtaskRow key={sub.id} subtask={sub}
                    onDelete={handleDeleteSubtask}
                    onStatusChange={handleSubtaskStatusChange}
                    onContentChange={handleSubtaskContentChange}
                  />
                ))
              )}
              <AddSubtaskInput taskId={task.id} onAdd={handleAddSubtask} />
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === "notes" && <NotesSection task={task} onTaskPatch={onTaskPatch} />}
        </div>
      </div>
    </div>
  );
}

// ── TasksList (main) ──────────────────────────────────────────────────

interface TasksListProps {
  tasks: TaskData[];
}

export function TasksList({ tasks: initialTasks }: TasksListProps) {
  const [tasks, setTasks]               = useState<TaskData[]>(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  useEffect(() => { setTasks(initialTasks); }, [initialTasks]);

  const patchTask = (id: number, patch: Partial<TaskData>) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

  const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null;

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20" style={{ color: "rgba(255,255,255,0.2)" }}>
        <div className="text-5xl mb-4 opacity-30">≡</div>
        <p className="text-[13px] font-mono tracking-wider">// ЗАДАЧИ НЕ НАЙДЕНЫ</p>
        <p className="text-[11px] mt-2 opacity-70">Попробуйте изменить фильтры</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1.5">
        {tasks.map(task => (
          <TaskRow key={task.id} task={task} onOpen={setSelectedTaskId} onTaskPatch={patchTask} />
        ))}
      </div>

      {selectedTask && (
        <TaskDetailsModal task={selectedTask} onClose={() => setSelectedTaskId(null)} onTaskPatch={patchTask} />
      )}
    </>
  );
}