// src/components/tasks/TasksList.tsx
"use client";

import {
  useState,
  useTransition,
  useRef,
  useEffect,
  type KeyboardEvent,
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

// ─── Константы ───────────────────────────────────

const MONTHS_SHORT = [
  "", "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН",
  "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК",
];

const CATEGORIES: Record<string, { icon: string; color: string }> = {
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

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f59e0b",
  normal:   "#34d399",
};

// ─── Типы ────────────────────────────────────────

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

// ─── Вспомогательные компоненты ──────────────────

/** Авто-растягивающийся textarea */
function AutoTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
}: {
  value:       string;
  onChange:    (v: string) => void;
  onBlur?:     () => void;
  placeholder: string;
  className?:  string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={1}
      className={className}
      style={{ resize: "none", overflow: "hidden" }}
    />
  );
}

/** Чекбокс выполнения */
function CheckBox({
  done,
  pending,
  onToggle,
}: {
  done:     boolean;
  pending:  boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle(); }}
      disabled={pending}
      className={[
        "w-[18px] h-[18px] min-w-[18px] border flex items-center justify-center",
        "text-[10px] transition-all duration-150 shrink-0",
        pending
          ? "opacity-50 cursor-wait border-border-bright"
          : done
            ? "border-[#34d399] bg-[rgba(52,211,153,0.15)] text-[#34d399] hover:bg-[rgba(52,211,153,0.25)]"
            : "border-border-bright hover:border-[#34d399] hover:bg-[rgba(52,211,153,0.08)]",
      ].join(" ")}
      aria-label={done ? "Переоткрыть" : "Завершить"}
    >
      {pending ? "·" : done ? "✓" : ""}
    </button>
  );
}

// ─── Строка подзадачи ─────────────────────────────

function SubtaskRow({
  subtask,
  onDelete,
}: {
  subtask:  Subtask;
  onDelete: (id: number) => void;
}) {
  const [status,  setStatus]  = useState(subtask.status);
  const [editing, setEditing] = useState(false);
  const [title,   setTitle]   = useState(subtask.title);
  const [desc,    setDesc]    = useState(subtask.description ?? "");
  const [showDesc,setShowDesc]= useState(false);
  const [isPending, startTransition] = useTransition();

  const isDone = status === "done";

  const handleToggle = () => {
    startTransition(async () => {
      if (isDone) {
        setStatus("pending");
        await reopenSubtask(subtask.id);
      } else {
        setStatus("done");
        await completeSubtask(subtask.id);
      }
    });
  };

  const handleSaveTitle = () => {
    if (title.trim() === subtask.title && desc === (subtask.description ?? "")) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      await updateSubtask(subtask.id, {
        title:       title.trim() || subtask.title,
        description: desc || undefined,
      });
      setEditing(false);
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSaveTitle();
    if (e.key === "Escape") { setTitle(subtask.title); setEditing(false); }
  };

  return (
    <div className={`group border-b border-border/60 last:border-0 transition-opacity ${isDone ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 py-2">
        {/* Маркер */}
        <div className="w-1 h-1 rounded-full bg-border-bright shrink-0 ml-1" />

        {/* Чекбокс подзадачи */}
        <CheckBox done={isDone} pending={isPending} onToggle={handleToggle} />

        {/* Название */}
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-bg-deep border border-border-bright px-2 py-0.5 text-[12px] text-text-primary outline-none focus:border-accent-blue"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          />
        ) : (
          <span
            className={`flex-1 text-[12px] text-[#c8d8e8] cursor-text ${isDone ? "line-through text-text-secondary" : ""}`}
            onDoubleClick={() => !isDone && setEditing(true)}
            title="Двойной клик для редактирования"
          >
            {title}
          </span>
        )}

        {/* Кнопки действий */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Описание подзадачи */}
          {!editing && (
            <button
              onClick={() => setShowDesc(s => !s)}
              className={`text-[9px] px-1.5 py-0.5 border transition-all
                ${showDesc
                  ? "border-accent-blue text-accent-blue bg-[rgba(96,165,250,0.08)]"
                  : "border-border text-text-dim hover:border-border-bright hover:text-text-secondary"
                }`}
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
              title="Описание подзадачи"
            >
              {desc ? "≡" : "+"}
            </button>
          )}
          <button
            onClick={() => onDelete(subtask.id)}
            className="text-[9px] px-1.5 py-0.5 border border-border text-text-dim hover:border-[#ef4444] hover:text-[#ef4444] transition-all"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}
            title="Удалить подзадачу"
          >
            ×
          </button>
        </div>
      </div>

      {/* Описание подзадачи */}
      {showDesc && (
        <div className="ml-6 mb-2 mr-2">
          <AutoTextarea
            value={desc}
            onChange={setDesc}
            onBlur={() => {
              if (desc !== (subtask.description ?? "")) {
                startTransition(async () => {
                  await updateSubtask(subtask.id, { description: desc });
                });
              }
            }}
            placeholder="Описание подзадачи..."
            className="w-full bg-bg-deep border border-border px-2 py-1.5 text-[11px] text-text-secondary outline-none focus:border-border-bright placeholder-text-dim"
          />
        </div>
      )}
    </div>
  );
}

// ─── Панель добавления подзадачи ─────────────────

function AddSubtaskInput({
  taskId,
  onAdd,
}: {
  taskId: number;
  onAdd:  (subtask: Subtask) => void;
}) {
  const [value,   setValue]   = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await addSubtask(taskId, { title: trimmed });
      if (result.success) {
        onAdd(result.subtask);
        setValue("");
        inputRef.current?.focus();
      }
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") setValue("");
  };

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/60">
      <div className="w-1 h-1 rounded-full bg-border-bright shrink-0 ml-1" />
      <div className="w-[18px] h-[18px] min-w-[18px] border border-dashed border-border-bright" />
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Добавить подзадачу... (Enter)"
        disabled={isPending}
        className="flex-1 bg-transparent border-0 text-[12px] text-[#c8d8e8] outline-none placeholder-[#2a4060] disabled:opacity-50"
        style={{ fontFamily: "'Exo 2', sans-serif" }}
      />
      {value.trim() && (
        <button
          onClick={handleAdd}
          disabled={isPending}
          className="text-[9px] px-2 py-0.5 border border-[#34d399] text-[#34d399] bg-[rgba(52,211,153,0.08)] hover:bg-[rgba(52,211,153,0.18)] transition-all disabled:opacity-50"
          style={{ fontFamily: "'Share Tech Mono', monospace" }}
        >
          {isPending ? "·" : "+ ОК"}
        </button>
      )}
    </div>
  );
}

// ─── Секция описания/примечаний ───────────────────

function NotesSection({
  taskId,
  initialDescription,
  initialNotes,
}: {
  taskId:             number;
  initialDescription: string | null;
  initialNotes:       string | null;
}) {
  const [desc,    setDesc]    = useState(initialDescription ?? "");
  const [notes,   setNotes]   = useState(initialNotes ?? "");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [, startTransition]   = useTransition();

  const saveField = (field: "description" | "notes", value: string) => {
    const original = field === "description" ? (initialDescription ?? "") : (initialNotes ?? "");
    if (value === original) return;
    setSaving(true);
    startTransition(async () => {
      await updateTaskNotes(taskId, { [field]: value });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="border-t border-border mt-3 pt-3 space-y-3">
      {/* Описание */}
      <div>
        <label className="block text-[9px] text-text-dim tracking-[2px] uppercase mb-1.5"
          style={{ fontFamily: "'Share Tech Mono', monospace" }}>
          // ОПИСАНИЕ ЗАДАЧИ
        </label>
        <AutoTextarea
          value={desc}
          onChange={setDesc}
          onBlur={() => saveField("description", desc)}
          placeholder="Подробное описание задачи, цели, контекст..."
          className="w-full bg-bg-deep border border-border px-3 py-2 text-[12px] text-[#c8d8e8] outline-none focus:border-border-bright placeholder-[#2a4060] transition-colors"
        />
      </div>

      {/* Примечания */}
      <div>
        <label className="block text-[9px] text-text-dim tracking-[2px] uppercase mb-1.5"
          style={{ fontFamily: "'Share Tech Mono', monospace" }}>
          // ПРИМЕЧАНИЯ ОФИЦЕРА
        </label>
        <AutoTextarea
          value={notes}
          onChange={setNotes}
          onBlur={() => saveField("notes", notes)}
          placeholder="Заметки, напоминания, особые указания..."
          className="w-full bg-bg-deep border border-border px-3 py-2 text-[12px] text-[#f59e0b]/70 outline-none focus:border-border-bright placeholder-[#2a4060] transition-colors"
          style={{ fontFamily: "'Share Tech Mono', monospace" } as React.CSSProperties}
        />
      </div>

      {/* Индикатор сохранения */}
      <div className="flex justify-end h-4">
        {saving && (
          <span className="text-[9px] text-text-dim animate-pulse"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}>
            сохранение...
          </span>
        )}
        {saved && !saving && (
          <span className="text-[9px] text-[#34d399]"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}>
            ✓ сохранено
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Карточка задачи ─────────────────────────────

function TaskRow({ task }: { task: TaskData }) {
  const [status,   setStatus]   = useState(task.status);
  const [expanded, setExpanded] = useState(false);
  const [activeTab,setActiveTab]= useState<"subtasks" | "notes">("subtasks");
  const [subs,     setSubs]     = useState<Subtask[]>(task.subtasksList);
  const [isPending, startTransition] = useTransition();

  const isDone      = status === "done";
  const cat         = CATEGORIES[task.category] ?? { icon: "•", color: "#6b8ba8" };
  const priColor    = PRIORITY_COLOR[task.priority] ?? "#6b8ba8";
  const dateRange   = task.dateFrom === task.dateTo
    ? `${task.dateFrom}`
    : `${task.dateFrom}–${task.dateTo}`;

  const subsDone    = subs.filter(s => s.status === "done").length;
  const subsTotal   = subs.length;
  const hasNotes    = !!(task.description || task.notes);
  const progress    = subsTotal > 0 ? Math.round((subsDone / subsTotal) * 100) : null;

  const handleToggle = () => {
    startTransition(async () => {
      if (isDone) {
        setStatus("pending");
        setSubs(prev => prev.map(s => ({ ...s, status: "pending" as const })));
        await reopenTask(task.id);
      } else {
        setStatus("done");
        setSubs(prev => prev.map(s => ({ ...s, status: "done" as const })));
        await completeTask(task.id);
      }
    });
  };

  const handleDeleteSubtask = (id: number) => {
    startTransition(async () => {
      await deleteSubtask(id);
      setSubs(prev => prev.filter(s => s.id !== id));
    });
  };

  const handleAddSubtask = (subtask: Subtask) => {
    setSubs(prev => [...prev, subtask]);
  };

  return (
    <div className={`border transition-all duration-200 ${isDone ? "opacity-50" : ""} ${expanded ? "border-border-bright" : "border-border hover:border-border-bright"}`}
      style={{ borderLeft: `3px solid ${priColor}` }}
    >
      {/* ── Шапка карточки ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 pl-[16px] bg-bg-panel hover:bg-bg-card transition-colors">
        {/* Чекбокс */}
        <CheckBox done={isDone} pending={isPending} onToggle={handleToggle} />

        {/* Инфо */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <p className={`text-[13px] font-medium text-text-primary truncate mb-0.5 ${isDone ? "line-through" : ""}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 text-[10px] flex-wrap"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}>
            <span className="text-text-secondary">{MONTHS_SHORT[task.month]} {dateRange}</span>
            <span className="px-1.5 py-px text-[9px]"
              style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}40` }}>
              {cat.icon} {task.category}
            </span>
            <span className="px-1.5 py-px text-[9px]"
              style={{ background: `${priColor}10`, color: priColor, border: `1px solid ${priColor}30` }}>
              {task.responsible}
            </span>

            {/* Прогресс подзадач */}
            {subsTotal > 0 && (
              <span className="flex items-center gap-1 text-[9px]">
                <span className="text-text-dim">{subsDone}/{subsTotal}</span>
                <span className="w-12 h-[3px] bg-border rounded-sm overflow-hidden inline-block">
                  <span className="block h-full rounded-sm bg-[#34d399] transition-all"
                    style={{ width: `${progress}%` }} />
                </span>
                <span className="text-[#34d399]">{progress}%</span>
              </span>
            )}

            {/* Иконка заметок */}
            {hasNotes && (
              <span className="text-[9px] text-[#f59e0b]" title="Есть примечания">✎</span>
            )}
          </div>
        </div>

        {/* Кнопка разворота */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 px-2 py-1 text-text-dim hover:text-text-secondary transition-all group"
          aria-label={expanded ? "Свернуть" : "Развернуть"}
        >
          <span className="text-[9px] group-hover:text-text-secondary transition-all hidden group-hover:inline"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}>
            {expanded ? "СВЕРНУТЬ" : "ОТКРЫТЬ"}
          </span>
          <svg
            width="12" height="12" viewBox="0 0 12 12"
            className="transition-transform duration-200"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <path d="M2 4 L6 8 L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Раскрытое тело ── */}
      {expanded && (
        <div className="bg-[#080f1c] border-t border-border">
          {/* Вкладки */}
          <div className="flex border-b border-border">
            {([
              { key: "subtasks" as const, label: `ПОДЗАДАЧИ${subsTotal > 0 ? ` (${subsDone}/${subsTotal})` : ""}` },
              { key: "notes"    as const, label: "ОПИСАНИЕ / ПРИМЕЧАНИЯ" + (hasNotes ? " ✎" : "") },
            ] as const).map(tab => (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-[9px] tracking-widest border-b-2 transition-all
                  ${activeTab === tab.key
                    ? "border-accent-blue text-accent-blue bg-[rgba(96,165,250,0.05)]"
                    : "border-transparent text-text-dim hover:text-text-secondary"
                  }`}
                style={{ fontFamily: "'Share Tech Mono', monospace" }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Содержимое вкладки */}
          <div className="px-4 py-3">
            {activeTab === "subtasks" && (
              <div>
                {subs.length === 0 && (
                  <p className="text-[11px] text-[#2a4060] py-2 text-center"
                    style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                    // подзадачи не добавлены
                  </p>
                )}
                {subs.map(sub => (
                  <SubtaskRow
                    key={sub.id}
                    subtask={sub}
                    onDelete={handleDeleteSubtask}
                  />
                ))}
                <AddSubtaskInput taskId={task.id} onAdd={handleAddSubtask} />
              </div>
            )}

            {activeTab === "notes" && (
              <NotesSection
                taskId={task.id}
                initialDescription={task.description}
                initialNotes={task.notes}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Экспорт ─────────────────────────────────────

interface TasksListProps {
  tasks: TaskData[];
}

export function TasksList({ tasks: taskList }: TasksListProps) {
  if (taskList.length === 0) {
    return (
      <div className="text-center py-16 text-text-dim"
        style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12 }}>
        // ЗАДАЧИ НЕ НАЙДЕНЫ
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {taskList.map(task => (
        <TaskRow key={task.id} task={task} />
      ))}
    </div>
  );
}