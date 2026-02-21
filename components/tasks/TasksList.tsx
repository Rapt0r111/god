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
  updateTask,
  deleteTask,
} from "@/actions/tasks";
import { useRouter } from "next/navigation";

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
const MONTHS_FORM  = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"] as const;

const CATEGORIES_META: Record<string, { icon: string; color: string; label: string }> = {
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

const CATEGORIES_LIST = [
  { code: "Н",   icon: "⚗",  label: "Наука",         color: "#10b981" },
  { code: "А",   icon: "📡", label: "Агитация",       color: "#3b82f6" },
  { code: "БП",  icon: "🎯", label: "Боевая подг.",   color: "#ef4444" },
  { code: "ПД",  icon: "⚙",  label: "Повседн. деят.", color: "#f59e0b" },
  { code: "ВПР", icon: "🎖", label: "ВПР",            color: "#a78bfa" },
  { code: "У",   icon: "🏁", label: "Увольнение",     color: "#f97316" },
  { code: "П",   icon: "🔰", label: "Призыв",         color: "#06b6d4" },
  { code: "ЗиТ", icon: "💻", label: "Техника",        color: "#94a3b8" },
  { code: "ЕМ",  icon: "📋", label: "Ежемесячные",   color: "#fbbf24" },
  { code: "НД",  icon: "🔬", label: "Научная деят.", color: "#10b981" },
  { code: "МГ",  icon: "⚡", label: "Мобготовность", color: "#ef4444" },
] as const;

const PERSONNEL = ["КВ-2", "КВ-1", "ЗКВ-2", "ЗКВ-1", "СР", "КНР", "КО-2"] as const;

const PRIORITIES_LIST = [
  { value: "normal",   label: "Нормальный",  color: "#10b981" },
  { value: "high",     label: "Высокий",     color: "#f59e0b" },
  { value: "critical", label: "Критический", color: "#ef4444" },
] as const;

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

// ── Shared input styles ───────────────────────────────────────────────

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  fontSize: 13,
  background: "var(--bg-input)",
  border: "1px solid var(--border-color)",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.15s",
  fontFamily: "inherit",
};

const labelCls = "text-[9px] font-mono tracking-[2px] uppercase block mb-1.5";
const labelStyle: CSSProperties = { color: "var(--text-secondary)" };

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
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)", color: "var(--text-primary)" }}
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
              background: showDesc ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
              color: showDesc ? "#c7d2fe" : "rgba(255,255,255,0.4)" }}>
            {desc ? "≡" : "+"}
          </button>
          <button onClick={() => onDelete(subtask.id)}
            className="flex items-center justify-center rounded transition-all"
            style={{ width: 20, height: 20, fontSize: 13, border: "1px solid var(--border-color)",
              background: "#1a2435", color: "var(--text-secondary)" }}
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
            style={{ width: "100%", padding: "6px 10px", borderRadius: 8, fontSize: 11, background: "#1a2435", border: "1px solid var(--border-color)", color: "rgba(200,216,232,0.7)", fontFamily: "var(--font-mono)", outline: "none" }}
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
    <div className="flex items-center gap-2.5 mt-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
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

  const fieldStyle: CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 12, background: "#1a2435", border: "1px solid var(--border-color)", color: "rgba(200,216,232,0.85)", outline: "none", transition: "border-color 0.15s ease", fontFamily: "inherit", lineHeight: 1.6 };

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5" style={{ color: "var(--text-secondary)" }}>// Описание задачи</span>
        <AutoTextarea value={desc} onChange={setDesc} onBlur={() => saveField("description", desc)} placeholder="Детальное описание задачи..." style={fieldStyle} />
      </label>
      <label className="block">
        <span className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5" style={{ color: "rgba(245,158,11,0.4)" }}>// Примечания офицера</span>
        <AutoTextarea value={notes} onChange={setNotes} onBlur={() => saveField("notes", notes)} placeholder="Заметки, ремарки, уточнения..."
          style={{ ...fieldStyle, color: "rgba(245,158,11,0.75)", fontFamily: "var(--font-mono)", fontSize: 11 }} />
      </label>
      <div className="text-right h-4">
        {saving && <span className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>сохранение...</span>}
        {saved  && <span className="text-[10px] font-mono" style={{ color: "#10b981" }}>✓ сохранено</span>}
      </div>
    </div>
  );
}

// ── EditTaskModal ─────────────────────────────────────────────────────

function EditTaskModal({
  task,
  onClose,
  onTaskPatch,
  onTaskDelete,
}: {
  task: TaskData;
  onClose: () => void;
  onTaskPatch: (id: number, patch: Partial<TaskData>) => void;
  onTaskDelete: (id: number) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState("");
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

  const selectedCat = CATEGORIES_LIST.find(c => c.code === form.category);

  useEffect(() => {
    const handler = (e: Event) => { if ((e as unknown as KeyboardEvent).key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

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
        onTaskPatch(task.id, {
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
      onTaskDelete(task.id);
      onClose();
      router.refresh();
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(145deg, rgba(13,24,41,0.99), rgba(7,13,26,0.97))",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05) inset",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "linear-gradient(135deg, rgba(245,158,11,0.05), transparent)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(249,115,22,0.15))", border: "1px solid rgba(245,158,11,0.35)" }}>
              <span style={{ fontSize: 14 }}>✎</span>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>Редактирование задачи</h3>
              <p className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>// ID #{task.id} · {task.responsible}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[18px] transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "var(--bg-input)", color: "var(--text-secondary)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Title */}
          <label className="block">
            <span className={labelCls} style={labelStyle}>// Название задачи *</span>
            <input
              autoFocus
              value={form.title}
              onChange={e => set("title", e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="Наименование мероприятия..."
              style={inputStyle}
            />
          </label>

          {/* Category */}
          <div>
            <span className={labelCls} style={labelStyle}>// Категория</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES_LIST.map(cat => {
                const active = form.category === cat.code;
                return (
                  <button key={cat.code} type="button" onClick={() => set("category", cat.code)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold transition-all"
                    style={active ? {
                      background: `${cat.color}20`,
                      border: `1px solid ${cat.color}50`,
                      color: cat.color,
                    } : {
                      background: "#1a2435",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-secondary)",
                    }}>
                    <span className="text-[11px]">{cat.icon}</span> {cat.code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority + Responsible */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={labelCls} style={labelStyle}>// Приоритет</span>
              <div className="flex gap-1.5">
                {PRIORITIES_LIST.map(p => {
                  const active = form.priority === p.value;
                  return (
                    <button key={p.value} type="button" onClick={() => set("priority", p.value)}
                      className="flex-1 py-2 rounded-lg text-[9px] font-mono font-semibold tracking-wide transition-all"
                      style={active ? {
                        background: `${p.color}18`,
                        border: `1px solid ${p.color}50`,
                        color: p.color,
                      } : {
                        background: "#1a2435",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.28)",
                      }}>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <span className={labelCls} style={labelStyle}>// Ответственный</span>
              <div className="grid grid-cols-3 gap-1">
                {PERSONNEL.map(p => {
                  const active = form.responsible === p;
                  return (
                    <button key={p} type="button" onClick={() => set("responsible", p)}
                      className="py-2 rounded-lg text-[10px] font-mono font-bold tracking-wide transition-all"
                      style={active ? {
                        background: "rgba(99,102,241,0.18)",
                        border: "1px solid rgba(99,102,241,0.5)",
                        color: "#c7d2fe",
                      } : {
                        background: "#1a2435",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "var(--text-secondary)",
                      }}>
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Month */}
          <div>
            <span className={labelCls} style={labelStyle}>// Месяц исполнения</span>
            <div className="flex gap-1 flex-wrap">
              {MONTHS_FORM.map((m, i) => {
                const monthNum = i + 1;
                const active = form.month === monthNum;
                return (
                  <button key={monthNum} type="button" onClick={() => set("month", monthNum)}
                    className="px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-semibold transition-all"
                    style={active ? {
                      background: "rgba(99,102,241,0.2)",
                      border: "1px solid rgba(99,102,241,0.5)",
                      color: "#c7d2fe",
                    } : {
                      background: "#1a2435",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "var(--text-secondary)",
                    }}>
                    {m.substring(0, 3).toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range */}
          <div>
            <span className={labelCls} style={labelStyle}>// Сроки · {MONTHS_FORM[form.month - 1]}</span>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[9px] font-mono mb-1" style={{ color: "rgba(255,255,255,0.2)" }}>С числа</p>
                <input type="number" min={1} max={31} value={form.dateFrom}
                  onChange={e => set("dateFrom", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{ ...inputStyle, textAlign: "center", fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#c7d2fe" }}
                />
              </div>
              <div className="flex flex-col items-center gap-1 pt-4">
                <div className="h-px w-8" style={{ background: "rgba(99,102,241,0.35)" }} />
                <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>→</span>
                <div className="h-px w-8" style={{ background: "rgba(99,102,241,0.35)" }} />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-mono mb-1" style={{ color: "rgba(255,255,255,0.2)" }}>По число</p>
                <input type="number" min={1} max={31} value={form.dateTo}
                  onChange={e => set("dateTo", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{ ...inputStyle, textAlign: "center", fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#c7d2fe" }}
                />
              </div>
              <div className="flex-1 pt-4">
                <p className="text-[9px] font-mono text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {form.dateTo >= form.dateFrom ? `${form.dateTo - form.dateFrom + 1} дн.` : "❌"}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <label className="block">
            <span className={labelCls} style={labelStyle}>// Описание (необязательно)</span>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Детали, контекст, требования..." rows={2}
              style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
          </label>

          {/* Notes */}
          <label className="block">
            <span className={labelCls} style={{ color: "rgba(245,158,11,0.4)" }}>// Примечания офицера</span>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Ремарки, уточнения..." rows={2}
              style={{ ...inputStyle, resize: "none", lineHeight: 1.6, color: "rgba(245,158,11,0.75)", fontFamily: "var(--font-mono)", fontSize: 12 }} />
          </label>

          {/* Delete confirmation */}
          {confirmDelete && (
            <div className="px-4 py-3 rounded-xl space-y-2"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <p className="text-[11px] font-mono" style={{ color: "#fca5a5" }}>
                ⚠ Удалить задачу и все её подзадачи ({task.subtasks?.length ?? 0} шт.)? Это нельзя отменить.
              </p>
              <div className="flex gap-2">
                <button onClick={handleDelete} disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all disabled:opacity-50"
                  style={{ background: "rgba(239,68,68,0.22)", border: "1px solid rgba(239,68,68,0.5)", color: "#fca5a5" }}>
                  {isDeleting ? "Удаление..." : "Да, удалить"}
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", background: "var(--bg-input)", color: "rgba(255,255,255,0.5)" }}>
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-3 py-2.5 rounded-xl text-[11px] font-mono"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            {!confirmDelete && (
              <button type="button" onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-mono transition-all"
                style={{ border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.05)", color: "rgba(239,68,68,0.6)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#fca5a5"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.45)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.05)"; e.currentTarget.style.color = "rgba(239,68,68,0.6)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)"; }}>
                🗑 Удалить
              </button>
            )}
            {selectedCat && (
              <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded-lg"
                style={{ background: `${selectedCat.color}18`, border: `1px solid ${selectedCat.color}40`, color: selectedCat.color }}>
                {selectedCat.icon} {form.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-[12px] font-mono tracking-wide transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.1)", background: "var(--bg-input)", color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
              Отмена
            </button>
            <button type="button" onClick={handleSubmit} disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-[12px] font-semibold tracking-wide transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.35), rgba(249,115,22,0.25))",
                border: "1px solid rgba(245,158,11,0.5)",
                color: "#fcd34d",
                boxShadow: "0 4px 16px rgba(245,158,11,0.18)",
                letterSpacing: "0.04em",
              }}
              onMouseEnter={e => { if (!isPending) e.currentTarget.style.boxShadow = "0 4px 22px rgba(245,158,11,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(245,158,11,0.18)"; }}>
              {isPending ? <span className="flex items-center gap-2"><span className="animate-pulse">···</span> Сохранение</span> : <><span style={{ fontSize: 14 }}>✓</span> Сохранить</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TaskRow ───────────────────────────────────────────────────────────

function TaskRow({ task, onOpen, onTaskPatch, onEdit }: {
  task: TaskData;
  onOpen: (id: number) => void;
  onTaskPatch: (id: number, patch: Partial<TaskData>) => void;
  onEdit: (id: number) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "done";
  const isCrit = task.priority === "critical";

  const cat      = CATEGORIES_META[task.category] ?? { icon: "•", color: "#6b8ba8", label: task.category };
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
      className="relative transition-all duration-300 rounded-2xl overflow-hidden group hover:-translate-y-0.5"
      style={{
        background: isDone ? "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))" : isCrit
          ? "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(17,24,39,0.42))"
          : "linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))",
        border: isDone ? "1px solid rgba(255,255,255,0.1)" : isCrit
          ? "1px solid rgba(239,68,68,0.35)"
          : "1px solid rgba(255,255,255,0.16)",
        boxShadow: isDone ? "0 8px 20px rgba(0,0,0,0.22)" : "0 12px 28px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.08) inset",
        backdropFilter: "blur(14px)",
        opacity: isDone ? 0.72 : 1,
      }}
    >
      {/* Priority bar */}
      <div className="absolute left-0 top-0 bottom-0" style={{ width: 3, background: isDone ? "rgba(255,255,255,0.08)" : priColor, boxShadow: isDone ? "none" : `0 0 8px ${priColor}50` }} />

      <div className="flex items-center gap-3 px-5 py-4 pl-6 cursor-pointer" onClick={() => onOpen(task.id)}>
        <CheckBox done={isDone} pending={isPending} onToggle={handleToggle} />

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold truncate mb-1.5"
            style={{ color: isDone ? "rgba(255,255,255,0.5)" : "#f8fbff", textDecoration: isDone ? "line-through" : "none", letterSpacing: "0.01em" }}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.62)" }}>
              <span style={{ opacity: 0.5 }}>📅</span>
              {MONTHS_SHORT[task.month]} {dateStr}
            </span>
            <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md"
              style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }}>
              {cat.icon} {task.category}
            </span>
            <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md"
              style={{ background: `${priColor}10`, color: priColor, border: `1px solid ${priColor}25` }}>
              {task.responsible}
            </span>
            {subsTotal > 0 && (
              <span className="text-[9px] font-mono" style={{ color: progress === 100 ? "#10b981" : "rgba(255,255,255,0.3)" }}>
                {subsDone}/{subsTotal} подз.
              </span>
            )}
          </div>
        </div>

        {subsTotal > 0 && (
          <div className="w-14 shrink-0">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: progress === 100 ? "#10b981" : `linear-gradient(90deg, ${priColor}80, ${priColor})` }} />
            </div>
          </div>
        )}

        {/* Edit button — visible on hover */}
        <button
          onClick={e => { e.stopPropagation(); onEdit(task.id); }}
          title="Редактировать"
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100"
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            background: "var(--bg-input)",
            color: "var(--text-secondary)",
            fontSize: 13,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(245,158,11,0.12)";
            e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)";
            e.currentTarget.style.color = "#fcd34d";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "rgba(255,255,255,0.35)";
          }}
        >
          ✎
        </button>

        <span className="shrink-0 text-[13px] opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: "#c7d2fe" }}>→</span>

        {isPending && <span className="text-[10px] font-mono animate-pulse shrink-0" style={{ color: "var(--text-secondary)" }}>···</span>}
      </div>
    </div>
  );
}

// ── TaskDetailsModal ──────────────────────────────────────────────────

function TaskDetailsModal({ task, onClose, onTaskPatch, onEdit }: {
  task: TaskData; onClose: () => void;
  onTaskPatch: (id: number, patch: Partial<TaskData>) => void;
  onEdit: (id: number) => void;
}) {
  const [activeTab, setActiveTab] = useState<"info" | "subtasks" | "notes">("info");
  const [isPending, startTransition] = useTransition();

  const isDone    = task.status === "done";
  const cat       = CATEGORIES_META[task.category] ?? { icon: "•", color: "#6b8ba8", label: task.category };
  const priColor  = PRIORITY_COLOR[task.priority] ?? "#6b8ba8";
  const priLabel  = PRIORITY_LABEL[task.priority] ?? task.priority;
  const statusMeta= STATUS_META[task.status] ?? STATUS_META.pending;
  const subsDone  = task.subtasks.filter(s => s.status === "done").length;
  const subsTotal = task.subtasks.length;
  const progress  = subsTotal > 0 ? Math.round((subsDone / subsTotal) * 100) : 0;

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
      style={{ background: "rgba(2,6,16,0.62)", backdropFilter: "blur(8px) saturate(1.05)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(145deg, rgba(20,30,52,0.9), rgba(9,14,28,0.88))",
          backdropFilter: "blur(26px)",
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.72), 0 1px 0 rgba(255,255,255,0.14) inset, 0 0 0 1px rgba(255,255,255,0.05)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-5 py-4 flex items-start gap-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "linear-gradient(135deg, rgba(255,255,255,0.03), transparent)" }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[20px] shrink-0"
            style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}35`, boxShadow: `0 4px 16px ${cat.color}15` }}>
            {cat.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[9px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded-md"
                style={{ background: `${cat.color}18`, color: cat.color, border: `1px solid ${cat.color}35` }}>
                {cat.icon} {cat.label}
              </span>
              <span className="text-[9px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded-md"
                style={{ background: `${priColor}15`, color: priColor, border: `1px solid ${priColor}35` }}>
                {priLabel}
              </span>
              <span className="text-[9px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded-md"
                style={{ background: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.border}` }}>
                {statusMeta.label}
              </span>
            </div>
            <h3 className="text-[15px] font-semibold leading-snug"
              style={{ color: isDone ? "rgba(255,255,255,0.6)" : "#f8fbff", textDecoration: isDone ? "line-through" : "none" }}>
              {task.title}
            </h3>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Edit button */}
            <button
              onClick={() => { onClose(); onEdit(task.id); }}
              title="Редактировать задачу"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold tracking-wider transition-all"
              style={{
                border: "1px solid rgba(245,158,11,0.35)",
                background: "rgba(245,158,11,0.08)",
                color: "rgba(245,158,11,0.7)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,11,0.14)"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.5)"; e.currentTarget.style.color = "#fcd34d"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(245,158,11,0.08)"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.35)"; e.currentTarget.style.color = "rgba(245,158,11,0.7)"; }}
            >
              ✎ Изменить
            </button>

            {/* Complete / Reopen button */}
            <button onClick={handleToggleTask} disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold tracking-wider transition-all duration-200 disabled:opacity-50"
              style={isDone ? {
                border: "1px solid rgba(245,158,11,0.4)",
                background: "rgba(245,158,11,0.1)",
                color: "#fbbf24",
              } : {
                border: "1px solid rgba(16,185,129,0.4)",
                background: "rgba(16,185,129,0.1)",
                color: "#34d399",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {isPending ? "···" : isDone ? "↺ Открыть" : "✓ Завершить"}
            </button>

            {/* Close button */}
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all text-[18px]"
              style={{ border: "1px solid rgba(255,255,255,0.1)", background: "var(--bg-input)", color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
              title="Закрыть (Esc)">
              ×
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {subsTotal > 0 && (
          <div className="px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono tracking-wider" style={{ color: "var(--text-secondary)" }}>ПРОГРЕСС ПОДЗАДАЧ</span>
              <span className="text-[10px] font-mono" style={{ color: progress === 100 ? "#10b981" : "rgba(255,255,255,0.4)" }}>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: progress === 100 ? "linear-gradient(90deg, #10b981, #34d399)" : `linear-gradient(90deg, ${priColor}80, ${priColor})` }} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="px-5 py-2.5 text-[11px] font-mono tracking-wide transition-all relative"
                style={{ color: isActive ? "#c7d2fe" : "rgba(255,255,255,0.3)", borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent", background: isActive ? "rgba(99,102,241,0.05)" : "transparent" }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.04))", border: "1px solid rgba(99,102,241,0.2)" }}>
                <p className="text-[9px] font-mono tracking-[2px] uppercase mb-3" style={{ color: "rgba(99,102,241,0.6)" }}>// Сроки исполнения</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-[9px] font-mono tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>НАЧАЛО</p>
                    <p className="text-[22px] font-bold font-mono tabular-nums" style={{ color: "#c7d2fe" }}>{task.dateFrom}</p>
                    <p className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>{MONTHS_SHORT[task.month]}</p>
                  </div>
                  <div className="text-center flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="h-px w-6" style={{ background: "rgba(99,102,241,0.4)" }} />
                      <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>→</span>
                      <div className="h-px w-6" style={{ background: "rgba(99,102,241,0.4)" }} />
                    </div>
                    <p className="text-[11px] font-mono font-semibold" style={{ color: "#60a5fa" }}>{durationDays} {durationDays === 1 ? "день" : durationDays < 5 ? "дня" : "дней"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-mono tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>КОНЕЦ</p>
                    <p className="text-[22px] font-bold font-mono tabular-nums" style={{ color: "#c7d2fe" }}>{task.dateTo}</p>
                    <p className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>{MONTHS_SHORT[task.month]}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 text-center" style={{ borderTop: "1px solid rgba(99,102,241,0.15)" }}>
                  <p className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>{dateStr}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "КАТЕГОРИЯ",    value: `${cat.icon} ${cat.label}`, color: cat.color },
                  { label: "ОТВЕТСТВЕННЫЙ", value: task.responsible,          color: priColor  },
                  { label: "ПРИОРИТЕТ",    value: priLabel,                   color: priColor  },
                  { label: "СТАТУС",       value: statusMeta.label,           color: statusMeta.color },
                ].map(row => (
                  <div key={row.label} className="rounded-xl p-3" style={{ background: "#1a2435", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-[8px] font-mono tracking-[1.5px] uppercase mb-1.5" style={{ color: "var(--text-secondary)" }}>{row.label}</p>
                    <p className="text-[12px] font-semibold font-mono" style={{ color: row.color }}>{row.value}</p>
                  </div>
                ))}
              </div>

              {task.description && (
                <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-[9px] font-mono tracking-[2px] uppercase mb-2" style={{ color: "var(--text-secondary)" }}>// Описание</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: "rgba(200,216,232,0.8)" }}>{task.description}</p>
                </div>
              )}

              {task.notes && (
                <div className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <p className="text-[9px] font-mono tracking-[2px] uppercase mb-2" style={{ color: "rgba(245,158,11,0.5)" }}>// Примечания офицера</p>
                  <p className="text-[12px] leading-relaxed font-mono" style={{ color: "rgba(245,158,11,0.75)" }}>{task.notes}</p>
                </div>
              )}

              <button onClick={() => setActiveTab("subtasks")}
                className="w-full py-2.5 rounded-xl text-[11px] font-mono tracking-wider transition-all duration-200"
                style={{ border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.06)", color: "#c7d2fe" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.12)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.06)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)"; }}>
                ◻ Подзадачи{subsTotal > 0 ? ` · ${subsDone}/${subsTotal} выполнено` : " · нет"}
              </button>
            </div>
          )}

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
  const [editingTaskId, setEditingTaskId]   = useState<number | null>(null);

  useEffect(() => { setTasks(initialTasks); }, [initialTasks]);

  const patchTask = (id: number, patch: Partial<TaskData>) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

  const removeTask = (id: number) =>
    setTasks(prev => prev.filter(t => t.id !== id));

  const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null;
  const editingTask  = tasks.find(t => t.id === editingTaskId) ?? null;

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
          <TaskRow
            key={task.id}
            task={task}
            onOpen={setSelectedTaskId}
            onTaskPatch={patchTask}
            onEdit={id => { setSelectedTaskId(null); setEditingTaskId(id); }}
          />
        ))}
      </div>

      {/* Details modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onTaskPatch={patchTask}
          onEdit={id => { setSelectedTaskId(null); setEditingTaskId(id); }}
        />
      )}

      {/* Edit modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTaskId(null)}
          onTaskPatch={patchTask}
          onTaskDelete={removeTask}
        />
      )}
    </>
  );
}