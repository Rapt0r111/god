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
import type { Subtask } from "@/lib/db/schema";

// ── Константы ──────────────────────────────────────────────────────────

const MONTHS_SHORT = [
  "", "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН",
  "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК",
];

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
  critical: "КРИТ",
  high:     "ВЫСОК",
  normal:   "НОРМ",
};

// ── Типы ──────────────────────────────────────────────────────────────

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
  subtasksList: Subtask[];
}

// ── AutoTextarea ──────────────────────────────────────────────────────

function AutoTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={1}
      className={className}
      style={{ resize: "none", overflow: "hidden", ...style }}
    />
  );
}

// ── CheckBox ──────────────────────────────────────────────────────────

function CheckBox({
  done,
  pending,
  onToggle,
}: {
  done: boolean;
  pending: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      disabled={pending}
      className="flex items-center justify-center shrink-0 rounded transition-all duration-150"
      style={{
        width: 18,
        height: 18,
        minWidth: 18,
        fontSize: 10,
        border: done
          ? "1px solid rgba(16,185,129,0.6)"
          : "1px solid rgba(255,255,255,0.2)",
        background: done
          ? "rgba(16,185,129,0.15)"
          : "rgba(255,255,255,0.03)",
        color: done ? "#34d399" : "transparent",
        opacity: pending ? 0.5 : 1,
        cursor: pending ? "wait" : "pointer",
        boxShadow: done ? "0 0 8px rgba(16,185,129,0.2)" : "none",
      }}
      aria-label={done ? "Переоткрыть" : "Завершить"}
    >
      {pending ? (
        <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
      ) : done ? (
        "✓"
      ) : null}
    </button>
  );
}

// ── SubtaskRow ────────────────────────────────────────────────────────

function SubtaskRow({
  subtask,
  onDelete,
  onStatusChange,
  onContentChange,
}: {
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

  useEffect(() => {
    setTitle(subtask.title);
    setDesc(subtask.description ?? "");
  }, [subtask.title, subtask.description]);

  const handleToggle = () => {
    startTransition(async () => {
      const next = isDone ? "pending" : "done";
      onStatusChange(subtask.id, next);
      if (isDone) await reopenSubtask(subtask.id);
      else        await completeSubtask(subtask.id);
    });
  };

  const handleSave = () => {
    if (
      title.trim() === subtask.title &&
      desc === (subtask.description ?? "")
    ) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const nextTitle       = title.trim() || subtask.title;
      const nextDescription = desc || null;
      await updateSubtask(subtask.id, {
        title:       nextTitle,
        description: desc || undefined,
      });
      onContentChange(subtask.id, { title: nextTitle, description: nextDescription });
      setEditing(false);
    });
  };

  return (
    <div
      className="group"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        opacity: isDone ? 0.45 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      <div className="flex items-center gap-2.5 py-2">
        {/* Маркер */}
        <div
          className="w-1 h-1 rounded-full shrink-0 ml-0.5"
          style={{ background: "rgba(255,255,255,0.2)" }}
        />

        <CheckBox done={isDone} pending={isPending} onToggle={handleToggle} />

        {/* Заголовок */}
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter")  handleSave();
              if (e.key === "Escape") { setTitle(subtask.title); setEditing(false); }
            }}
            className="flex-1 px-2 py-0.5 rounded text-[12px] outline-none"
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.3)",
              color: "#e8f0fe",
            }}
          />
        ) : (
          <span
            className="flex-1 text-[12px] cursor-text select-none"
            style={{
              color: isDone ? "rgba(255,255,255,0.3)" : "rgba(200,216,232,0.9)",
              textDecoration: isDone ? "line-through" : "none",
              lineHeight: "1.5",
            }}
            onDoubleClick={() => !isDone && setEditing(true)}
            title="Дважды кликните для редактирования"
          >
            {subtask.title}
          </span>
        )}

        {/* Контролы при ховере */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            onClick={() => setShowDesc((s) => !s)}
            className="flex items-center justify-center rounded transition-all"
            style={{
              width: 20,
              height: 20,
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              border: "1px solid rgba(255,255,255,0.12)",
              background: showDesc ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)",
              color: showDesc ? "#93c5fd" : "rgba(255,255,255,0.4)",
            }}
            title="Описание"
          >
            {desc ? "≡" : "+"}
          </button>
          <button
            onClick={() => onDelete(subtask.id)}
            className="flex items-center justify-center rounded transition-all"
            style={{
              width: 20,
              height: 20,
              fontSize: 11,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.25)",
            }}
            title="Удалить"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
              e.currentTarget.style.color = "#f87171";
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "rgba(255,255,255,0.25)";
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Описание подзадачи */}
      {showDesc && (
        <div className="ml-5 mb-2 mr-2">
          <AutoTextarea
            value={desc}
            onChange={setDesc}
            onBlur={() => {
              if (desc !== (subtask.description ?? "")) {
                startTransition(async () => {
                  await updateSubtask(subtask.id, { description: desc });
                  onContentChange(subtask.id, { description: desc || null });
                });
              }
            }}
            placeholder="Описание подзадачи..."
            className="w-full px-2.5 py-1.5 rounded-lg text-[11px] outline-none"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(200,216,232,0.7)",
              fontFamily: "var(--font-mono)",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── AddSubtaskInput ───────────────────────────────────────────────────

function AddSubtaskInput({
  taskId,
  onAdd,
}: {
  taskId: number;
  onAdd: (subtask: Subtask) => void;
}) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await addSubtask(taskId, { title: trimmed });
      if (result.success) {
        onAdd(result.subtask);
        setValue("");
      }
    });
  };

  return (
    <div
      className="flex items-center gap-2.5 mt-2 pt-3"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="w-1 h-1 rounded-full shrink-0 ml-0.5"
        style={{ background: "rgba(255,255,255,0.15)" }}
      />
      <div
        className="flex items-center justify-center shrink-0 rounded"
        style={{
          width: 18,
          height: 18,
          border: "1px dashed rgba(255,255,255,0.15)",
          background: "transparent",
        }}
      />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter")  handleAdd();
          if (e.key === "Escape") setValue("");
        }}
        placeholder="Добавить подзадачу... (Enter)"
        disabled={isPending}
        className="flex-1 bg-transparent text-[12px] outline-none"
        style={{
          color: "rgba(200,216,232,0.5)",
          fontFamily: "inherit",
        }}
      />
      {value.trim() && (
        <button
          onClick={handleAdd}
          disabled={isPending}
          className="px-2.5 py-1 rounded text-[9px] font-mono tracking-wide transition-all"
          style={{
            border: "1px solid rgba(16,185,129,0.3)",
            background: "rgba(16,185,129,0.08)",
            color: "#34d399",
          }}
        >
          {isPending ? "·" : "+ ОК"}
        </button>
      )}
    </div>
  );
}

// ── NotesSection ──────────────────────────────────────────────────────

function NotesSection({
  task,
  onTaskPatch,
}: {
  task: TaskData;
  onTaskPatch: (id: number, patch: Partial<TaskData>) => void;
}) {
  const [desc,       setDesc      ] = useState(task.description ?? "");
  const [notes,      setNotes     ] = useState(task.notes ?? "");
  const [savedDesc,  setSavedDesc ] = useState(task.description ?? "");
  const [savedNotes, setSavedNotes] = useState(task.notes ?? "");
  const [saving,     setSaving    ] = useState(false);
  const [saved,      setSaved     ] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setDesc(task.description ?? "");
    setNotes(task.notes ?? "");
    setSavedDesc(task.description ?? "");
    setSavedNotes(task.notes ?? "");
  }, [task.id, task.description, task.notes]);

  const saveField = (field: "description" | "notes", value: string) => {
    const original = field === "description" ? savedDesc : savedNotes;
    if (value === original) return;

    setSaving(true);
    startTransition(async () => {
      await updateTaskNotes(task.id, { [field]: value });
      if (field === "description") {
        setSavedDesc(value);
        onTaskPatch(task.id, { description: value || null });
      } else {
        setSavedNotes(value);
        onTaskPatch(task.id, { notes: value || null });
      }
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  };

  const fieldStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 12,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(200,216,232,0.85)",
    outline: "none",
    transition: "border-color 0.15s ease",
    fontFamily: "inherit",
    lineHeight: 1.6,
  };

  const notesStyle: CSSProperties = {
    ...fieldStyle,
    color: "rgba(245,158,11,0.75)",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.3px",
  };

  return (
    <div className="space-y-3">
      <label className="block">
        <span
          className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          // Описание задачи
        </span>
        <AutoTextarea
          value={desc}
          onChange={setDesc}
          onBlur={() => saveField("description", desc)}
          placeholder="Детальное описание задачи..."
          style={fieldStyle}
        />
      </label>

      <label className="block">
        <span
          className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5"
          style={{ color: "rgba(245,158,11,0.4)" }}
        >
          // Примечания офицера
        </span>
        <AutoTextarea
          value={notes}
          onChange={setNotes}
          onBlur={() => saveField("notes", notes)}
          placeholder="Заметки, ремарки, уточнения..."
          style={notesStyle}
        />
      </label>

      <div className="text-right h-4">
        {saving && (
          <span
            className="text-[10px] font-mono"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            сохранение...
          </span>
        )}
        {saved && (
          <span
            className="text-[10px] font-mono"
            style={{ color: "#10b981" }}
          >
            ✓ сохранено
          </span>
        )}
      </div>
    </div>
  );
}

// ── TaskRow ───────────────────────────────────────────────────────────

function TaskRow({
  task,
  onOpen,
  onTaskPatch,
}: {
  task:        TaskData;
  onOpen:      (id: number) => void;
  onTaskPatch: (id: number, patch: Partial<TaskData>) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isDone    = task.status === "done";
  const isCrit    = task.priority === "critical";

  const cat      = CATEGORIES[task.category] ?? { icon: "•", color: "#6b8ba8", label: task.category };
  const priColor = PRIORITY_COLOR[task.priority] ?? "#6b8ba8";
  const subsDone = task.subtasksList.filter((s) => s.status === "done").length;
  const subsTotal= task.subtasksList.length;
  const progress = subsTotal > 0 ? Math.round((subsDone / subsTotal) * 100) : 0;

  const handleToggle = () => {
    startTransition(async () => {
      if (isDone) {
        onTaskPatch(task.id, {
          status:       "pending",
          subtasksList: task.subtasksList.map((s) => ({ ...s, status: "pending" })),
        });
        await reopenTask(task.id);
      } else {
        onTaskPatch(task.id, {
          status:       "done",
          subtasksList: task.subtasksList.map((s) => ({ ...s, status: "done" })),
        });
        await completeTask(task.id);
      }
    });
  };

  const dateStr = task.dateFrom === task.dateTo
    ? `${task.dateFrom}`
    : `${task.dateFrom}–${task.dateTo}`;

  return (
    <div
      className="relative cursor-pointer transition-all duration-200 rounded-xl overflow-hidden"
      style={{
        background: isDone
          ? "rgba(255,255,255,0.01)"
          : isCrit
            ? "linear-gradient(135deg, rgba(239,68,68,0.04), rgba(255,255,255,0.02))"
            : "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        border: isDone
          ? "1px solid rgba(255,255,255,0.05)"
          : isCrit
            ? "1px solid rgba(239,68,68,0.15)"
            : "1px solid rgba(255,255,255,0.08)",
        opacity: isDone ? 0.5 : 1,
      }}
      onClick={() => onOpen(task.id)}
      onMouseEnter={(e) => {
        if (!isDone) {
          e.currentTarget.style.borderColor = isCrit
            ? "rgba(239,68,68,0.3)"
            : "rgba(255,255,255,0.14)";
          e.currentTarget.style.background = isCrit
            ? "linear-gradient(135deg, rgba(239,68,68,0.07), rgba(255,255,255,0.03))"
            : "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isDone
          ? "rgba(255,255,255,0.05)"
          : isCrit
            ? "rgba(239,68,68,0.15)"
            : "rgba(255,255,255,0.08)";
        e.currentTarget.style.background = isDone
          ? "rgba(255,255,255,0.01)"
          : isCrit
            ? "linear-gradient(135deg, rgba(239,68,68,0.04), rgba(255,255,255,0.02))"
            : "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))";
      }}
    >
      {/* Полоса приоритета */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: 3,
          background: isDone
            ? "rgba(255,255,255,0.08)"
            : priColor,
          opacity: isDone ? 0.3 : 1,
          boxShadow: isDone ? "none" : `0 0 8px ${priColor}40`,
        }}
      />

      <div className="flex items-center gap-3 px-4 py-3 pl-5">
        {/* Чекбокс */}
        <CheckBox done={isDone} pending={isPending} onToggle={handleToggle} />

        {/* Информация */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] font-medium truncate mb-1"
            style={{
              color: isDone ? "rgba(255,255,255,0.3)" : "#e8f0fe",
              textDecoration: isDone ? "line-through" : "none",
              letterSpacing: "0.01em",
            }}
          >
            {task.title}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Дата */}
            <span
              className="text-[10px] font-mono"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {MONTHS_SHORT[task.month]} {dateStr}
            </span>

            {/* Категория */}
            <span
              className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md"
              style={{
                background: `${cat.color}15`,
                color: cat.color,
                border: `1px solid ${cat.color}30`,
              }}
            >
              {cat.icon} {task.category}
            </span>

            {/* Ответственный */}
            <span
              className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md"
              style={{
                background: `${priColor}10`,
                color: priColor,
                border: `1px solid ${priColor}25`,
              }}
            >
              {task.responsible}
            </span>

            {/* Прогресс подзадач */}
            {subsTotal > 0 && (
              <span
                className="text-[9px] font-mono"
                style={{ color: progress === 100 ? "#10b981" : "rgba(255,255,255,0.3)" }}
              >
                {subsDone}/{subsTotal}
                {progress > 0 && ` (${progress}%)`}
              </span>
            )}
          </div>
        </div>

        {/* Прогресс-бар (если есть подзадачи) */}
        {subsTotal > 0 && (
          <div className="w-16 shrink-0">
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: progress === 100
                    ? "#10b981"
                    : `linear-gradient(90deg, ${priColor}80, ${priColor})`,
                }}
              />
            </div>
          </div>
        )}

        {/* Кнопка открытия */}
        <div
          className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-mono tracking-wide transition-all opacity-0 group-hover:opacity-100"
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          →
        </div>

        {/* Спиннер */}
        {isPending && (
          <span
            className="text-[10px] font-mono animate-pulse"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            ···
          </span>
        )}
      </div>
    </div>
  );
}

// ── TaskDetailsModal ──────────────────────────────────────────────────

function TaskDetailsModal({
  task,
  onClose,
  onTaskPatch,
}: {
  task:        TaskData;
  onClose:     () => void;
  onTaskPatch: (id: number, patch: Partial<TaskData>) => void;
}) {
  const [activeTab, setActiveTab] = useState<"subtasks" | "notes">("subtasks");
  const [isPending, startTransition] = useTransition();

  const isDone    = task.status === "done";
  const cat       = CATEGORIES[task.category] ?? { icon: "•", color: "#6b8ba8", label: task.category };
  const priColor  = PRIORITY_COLOR[task.priority] ?? "#6b8ba8";
  const priLabel  = PRIORITY_LABEL[task.priority] ?? task.priority;
  const subsDone  = task.subtasksList.filter((s) => s.status === "done").length;
  const subsTotal = task.subtasksList.length;
  const progress  = subsTotal > 0 ? Math.round((subsDone / subsTotal) * 100) : 0;

  useEffect(() => { setActiveTab("subtasks"); }, [task.id]);

  // Закрыть по Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler as any);
    return () => document.removeEventListener("keydown", handler as any);
  }, [onClose]);

  const handleToggleTask = () => {
    startTransition(async () => {
      if (isDone) {
        onTaskPatch(task.id, {
          status:       "pending",
          subtasksList: task.subtasksList.map((s) => ({ ...s, status: "pending" })),
        });
        await reopenTask(task.id);
      } else {
        onTaskPatch(task.id, {
          status:       "done",
          subtasksList: task.subtasksList.map((s) => ({ ...s, status: "done" })),
        });
        await completeTask(task.id);
      }
    });
  };

  const handleSubtaskStatusChange = (id: number, status: Subtask["status"]) => {
    onTaskPatch(task.id, {
      subtasksList: task.subtasksList.map((s) => (s.id === id ? { ...s, status } : s)),
    });
  };

  const handleSubtaskContentChange = (
    id: number,
    data: { title?: string; description?: string | null }
  ) => {
    onTaskPatch(task.id, {
      subtasksList: task.subtasksList.map((s) => (s.id === id ? { ...s, ...data } : s)),
    });
  };

  const handleDeleteSubtask = (id: number) => {
    onTaskPatch(task.id, { subtasksList: task.subtasksList.filter((s) => s.id !== id) });
    void deleteSubtask(id);
  };

  const handleAddSubtask = (subtask: Subtask) => {
    onTaskPatch(task.id, { subtasksList: [...task.subtasksList, subtask] });
  };

  const dateStr = task.dateFrom === task.dateTo
    ? `${task.dateFrom}`
    : `${task.dateFrom}–${task.dateTo}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl animate-scale-in"
        style={{
          background: "linear-gradient(145deg, rgba(13,24,41,0.97), rgba(7,13,26,0.95))",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05) inset",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Шапка модального ── */}
        <div
          className="px-5 py-4 flex items-start gap-4"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.03), transparent)",
          }}
        >
          {/* Иконка категории */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0"
            style={{
              background: `${cat.color}15`,
              border: `1px solid ${cat.color}30`,
            }}
          >
            {cat.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {/* Категория */}
              <span
                className="text-[9px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded"
                style={{
                  background: `${cat.color}15`,
                  color: cat.color,
                  border: `1px solid ${cat.color}30`,
                }}
              >
                {cat.icon} {cat.label}
              </span>

              {/* Приоритет */}
              <span
                className="text-[9px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded"
                style={{
                  background: `${priColor}12`,
                  color: priColor,
                  border: `1px solid ${priColor}30`,
                  boxShadow: task.priority === "critical" ? `0 0 8px ${priColor}20` : "none",
                }}
              >
                {priLabel}
              </span>

              {/* Статус */}
              {isDone && (
                <span
                  className="text-[9px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded"
                  style={{
                    background: "rgba(16,185,129,0.12)",
                    color: "#34d399",
                    border: "1px solid rgba(16,185,129,0.3)",
                  }}
                >
                  ✓ ВЫПОЛНЕНО
                </span>
              )}
            </div>

            <h3
              className="text-[15px] font-semibold leading-snug"
              style={{
                color: isDone ? "rgba(255,255,255,0.4)" : "#e8f0fe",
                textDecoration: isDone ? "line-through" : "none",
              }}
            >
              {task.title}
            </h3>

            <div
              className="flex items-center gap-3 mt-1.5 text-[10px] font-mono flex-wrap"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              <span>{MONTHS_SHORT[task.month]} {dateStr}</span>
              <span>·</span>
              <span style={{ color: priColor }}>{task.responsible}</span>
              {subsTotal > 0 && (
                <>
                  <span>·</span>
                  <span style={{ color: progress === 100 ? "#10b981" : "inherit" }}>
                    {subsDone}/{subsTotal} подзадач
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Кнопки шапки */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleTask}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono tracking-wide transition-all"
              style={isDone ? {
                border: "1px solid rgba(245,158,11,0.3)",
                background: "rgba(245,158,11,0.08)",
                color: "#fbbf24",
              } : {
                border: "1px solid rgba(16,185,129,0.3)",
                background: "rgba(16,185,129,0.08)",
                color: "#34d399",
              }}
            >
              {isPending ? "···" : isDone ? "↺ Открыть" : "✓ Закрыть"}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all text-[16px]"
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.4)",
              }}
              title="Закрыть (Esc)"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Прогресс-бар ── */}
        {subsTotal > 0 && (
          <div className="px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>
                ПРОГРЕСС ПОДЗАДАЧ
              </span>
              <span className="text-[10px] font-mono" style={{ color: progress === 100 ? "#10b981" : "rgba(255,255,255,0.4)" }}>
                {progress}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: progress === 100
                    ? "linear-gradient(90deg, #10b981, #34d399)"
                    : `linear-gradient(90deg, ${priColor}80, ${priColor})`,
                  boxShadow: progress === 100 ? "0 0 8px rgba(16,185,129,0.4)" : "none",
                }}
              />
            </div>
          </div>
        )}

        {/* ── Вкладки ── */}
        <div
          className="flex"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          {(["subtasks", "notes"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === "subtasks"
              ? `Подзадачи${subsTotal > 0 ? ` (${subsDone}/${subsTotal})` : ""}`
              : "Примечания";
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-5 py-2.5 text-[11px] font-mono tracking-wide transition-all relative"
                style={{
                  color: isActive ? "#93c5fd" : "rgba(255,255,255,0.3)",
                  borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                  background: isActive ? "rgba(59,130,246,0.05)" : "transparent",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Контент вкладки ── */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "subtasks" ? (
            <div>
              {task.subtasksList.length === 0 ? (
                <div
                  className="text-center py-10"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  <div className="text-3xl mb-3 opacity-30">◻</div>
                  <p className="text-[11px] font-mono">// Подзадачи не добавлены</p>
                </div>
              ) : (
                task.subtasksList.map((sub) => (
                  <SubtaskRow
                    key={sub.id}
                    subtask={sub}
                    onDelete={handleDeleteSubtask}
                    onStatusChange={handleSubtaskStatusChange}
                    onContentChange={handleSubtaskContentChange}
                  />
                ))
              )}
              <AddSubtaskInput taskId={task.id} onAdd={handleAddSubtask} />
            </div>
          ) : (
            <NotesSection task={task} onTaskPatch={onTaskPatch} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── TasksList (главный) ───────────────────────────────────────────────

interface TasksListProps {
  tasks: TaskData[];
}

export function TasksList({ tasks: initialTasks }: TasksListProps) {
  const [tasks,          setTasks         ] = useState<TaskData[]>(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  useEffect(() => { setTasks(initialTasks); }, [initialTasks]);

  const patchTask = (id: number, patch: Partial<TaskData>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  if (tasks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20"
        style={{ color: "rgba(255,255,255,0.2)" }}
      >
        <div className="text-5xl mb-4 opacity-30">≡</div>
        <p className="text-[13px] font-mono tracking-wider">// ЗАДАЧИ НЕ НАЙДЕНЫ</p>
        <p className="text-[11px] mt-2 opacity-70">Попробуйте изменить фильтры</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onOpen={setSelectedTaskId}
            onTaskPatch={patchTask}
          />
        ))}
      </div>

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onTaskPatch={patchTask}
        />
      )}
    </>
  );
}