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

const MONTHS_SHORT = ["", "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН", "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК"];

const CATEGORIES: Record<string, { icon: string; color: string }> = {
  "Н": { icon: "⚗", color: "#34d399" },
  "А": { icon: "📡", color: "#60a5fa" },
  "БП": { icon: "🎯", color: "#f87171" },
  "ПД": { icon: "⚙", color: "#f59e0b" },
  "ВПР": { icon: "🎖", color: "#a78bfa" },
  "У": { icon: "🏁", color: "#fb923c" },
  "П": { icon: "🔰", color: "#22d3ee" },
  "ЗиТ": { icon: "💻", color: "#94a3b8" },
  "ЕМ": { icon: "📋", color: "#fbbf24" },
  "НД": { icon: "🔬", color: "#34d399" },
  "МГ": { icon: "⚡", color: "#ef4444" },
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  normal: "#34d399",
};

interface TaskData {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  responsible: string;
  month: number;
  dateFrom: number;
  dateTo: number;
  description: string | null;
  notes: string | null;
  subtasksList: Subtask[];
}

function AutoTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string;
  className?: string;
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
      style={{ resize: "none", overflow: "hidden" }}
    />
  );
}

function CheckBox({ done, pending, onToggle }: { done: boolean; pending: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
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
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(subtask.title);
  const [desc, setDesc] = useState(subtask.description ?? "");
  const [showDesc, setShowDesc] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isDone = subtask.status === "done";

  useEffect(() => {
    setTitle(subtask.title);
    setDesc(subtask.description ?? "");
  }, [subtask.title, subtask.description]);

  const handleToggle = () => {
    startTransition(async () => {
      if (isDone) {
        onStatusChange(subtask.id, "pending");
        await reopenSubtask(subtask.id);
      } else {
        onStatusChange(subtask.id, "done");
        await completeSubtask(subtask.id);
      }
    });
  };

  const handleSave = () => {
    if (title.trim() === subtask.title && desc === (subtask.description ?? "")) {
      setEditing(false);
      return;
    }

    startTransition(async () => {
      const nextTitle = title.trim() || subtask.title;
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
    <div className={`group border-b border-border/60 last:border-0 ${isDone ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 py-2">
        <div className="w-1 h-1 rounded-full bg-border-bright shrink-0 ml-1" />
        <CheckBox done={isDone} pending={isPending} onToggle={handleToggle} />

        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setTitle(subtask.title);
                setEditing(false);
              }
            }}
            className="flex-1 bg-bg-deep border border-border-bright px-2 py-0.5 text-[12px] text-text-primary outline-none focus:border-accent-blue"
          />
        ) : (
          <span
            className={`flex-1 text-[12px] text-[#c8d8e8] cursor-text ${isDone ? "line-through text-text-secondary" : ""}`}
            onDoubleClick={() => !isDone && setEditing(true)}
          >
            {subtask.title}
          </span>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowDesc((s) => !s)}
            className="text-[9px] px-1.5 py-0.5 border border-border text-text-dim hover:border-border-bright hover:text-text-secondary"
          >
            {desc ? "≡" : "+"}
          </button>
          <button
            onClick={() => onDelete(subtask.id)}
            className="text-[9px] px-1.5 py-0.5 border border-border text-text-dim hover:border-[#ef4444] hover:text-[#ef4444]"
          >
            ×
          </button>
        </div>
      </div>

      {showDesc && (
        <div className="ml-6 mb-2 mr-2">
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
            className="w-full bg-bg-deep border border-border px-2 py-1.5 text-[11px] text-text-secondary outline-none"
          />
        </div>
      )}
    </div>
  );
}

function AddSubtaskInput({ taskId, onAdd }: { taskId: number; onAdd: (subtask: Subtask) => void }) {
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
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/60">
      <div className="w-1 h-1 rounded-full bg-border-bright shrink-0 ml-1" />
      <div className="w-[18px] h-[18px] min-w-[18px] border border-dashed border-border-bright" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") handleAdd();
          if (e.key === "Escape") setValue("");
        }}
        placeholder="Добавить подзадачу... (Enter)"
        disabled={isPending}
        className="flex-1 bg-transparent border-0 text-[12px] text-[#c8d8e8] outline-none"
      />
      {value.trim() && (
        <button
          onClick={handleAdd}
          disabled={isPending}
          className="text-[9px] px-2 py-0.5 border border-[#34d399] text-[#34d399] bg-[rgba(52,211,153,0.08)]"
        >
          {isPending ? "·" : "+ ОК"}
        </button>
      )}
    </div>
  );
}

function NotesSection({
  task,
  onTaskPatch,
}: {
  task: TaskData;
  onTaskPatch: (id: number, patch: Partial<TaskData>) => void;
}) {
  const [desc,    setDesc]    = useState(initialDescription ?? "");
  const [notes,   setNotes]   = useState(initialNotes ?? "");
  const [savedDesc, setSavedDesc] = useState(initialDescription ?? "");
  const [savedNotes, setSavedNotes] = useState(initialNotes ?? "");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [, startTransition]   = useTransition();

  useEffect(() => {
    setDesc(initialDescription ?? "");
    setNotes(initialNotes ?? "");
    setSavedDesc(initialDescription ?? "");
    setSavedNotes(initialNotes ?? "");
  }, [initialDescription, initialNotes]);

  const saveField = (field: "description" | "notes", value: string) => {
    const original = field === "description" ? savedDesc : savedNotes;
    if (value === original) return;

    setSaving(true);
    startTransition(async () => {
      await updateTaskNotes(taskId, { [field]: value });
      if (field === "description") setSavedDesc(value);
      if (field === "notes") setSavedNotes(value);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    });
  };

  return (
    <div className="space-y-3">
      <AutoTextarea
        value={desc}
        onChange={setDesc}
        onBlur={() => saveField("description", desc)}
        placeholder="Описание задачи"
        className="w-full bg-bg-deep border border-border px-3 py-2 text-[12px] text-[#c8d8e8] outline-none"
      />
      <AutoTextarea
        value={notes}
        onChange={setNotes}
        onBlur={() => saveField("notes", notes)}
        placeholder="Примечания"
        className="w-full bg-bg-deep border border-border px-3 py-2 text-[12px] text-[#f59e0b]/70 outline-none"
        style={{ fontFamily: "'Share Tech Mono', monospace" } as CSSProperties}
      />
      <div className="h-4 text-right text-[10px] text-text-dim">{saving ? "сохранение..." : saved ? "✓ сохранено" : ""}</div>
    </div>
  );
}

function TaskRow({
  task,
  onOpen,
  onTaskPatch,
}: {
  task: TaskData;
  onOpen: (id: number) => void;
  onTaskPatch: (id: number, patch: Partial<TaskData>) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "done";

  useEffect(() => {
    setStatus(task.status);
    setSubs(task.subtasksList);
  }, [task.status, task.subtasksList]);

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
        onTaskPatch(task.id, {
          status: "pending",
          subtasksList: task.subtasksList.map((s) => ({ ...s, status: "pending" })),
        });
        await reopenTask(task.id);
      } else {
        onTaskPatch(task.id, {
          status: "done",
          subtasksList: task.subtasksList.map((s) => ({ ...s, status: "done" })),
        });
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

  const handleSubtaskStatusChange = (id: number, nextStatus: Subtask["status"]) => {
    setSubs((prev) => prev.map((sub) => (sub.id === id ? { ...sub, status: nextStatus } : sub)));
  };

  const handleSubtaskContentChange = (
    id: number,
    data: { title?: string; description?: string | null },
  ) => {
    setSubs((prev) => prev.map((sub) => (sub.id === id ? { ...sub, ...data } : sub)));
  };

  return (
    <div
      className={`border transition-all duration-200 cursor-pointer ${isDone ? "opacity-50" : ""} border-border hover:border-border-bright`}
      style={{ borderLeft: `3px solid ${priColor}` }}
      onClick={() => onOpen(task.id)}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 pl-[16px] bg-bg-panel hover:bg-bg-card transition-colors">
        <CheckBox done={isDone} pending={isPending} onToggle={handleToggle} />
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-medium text-text-primary truncate ${isDone ? "line-through" : ""}`}>{task.title}</p>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-text-secondary">
              {MONTHS_SHORT[task.month]} {task.dateFrom === task.dateTo ? task.dateFrom : `${task.dateFrom}–${task.dateTo}`}
            </span>
            <span className="px-1.5 py-px text-[9px]" style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}40` }}>
              {cat.icon} {task.category}
            </span>
            <span className="px-1.5 py-px text-[9px]" style={{ background: `${priColor}10`, color: priColor, border: `1px solid ${priColor}30` }}>
              {task.responsible}
            </span>
            {subsTotal > 0 && <span className="text-[#34d399] text-[9px]">{subsDone}/{subsTotal} ({progress}%)</span>}
          </div>
        </div>
        <span className="text-[10px] text-text-dim">ОТКРЫТЬ →</span>
      </div>
    </div>
  );
}

function TaskDetailsModal({
  task,
  onClose,
  onTaskPatch,
}: {
  task: TaskData;
  onClose: () => void;
  onTaskPatch: (id: number, patch: Partial<TaskData>) => void;
}) {
  const [activeTab, setActiveTab] = useState<"subtasks" | "notes">("subtasks");

  const handleSubtaskStatusChange = (id: number, status: Subtask["status"]) => {
    onTaskPatch(task.id, {
      subtasksList: task.subtasksList.map((s) => (s.id === id ? { ...s, status } : s)),
    });
  };

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
                    onStatusChange={handleSubtaskStatusChange}
                    onContentChange={handleSubtaskContentChange}
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
          <button onClick={onClose} className="px-3 py-1 text-xs border border-white/20 text-white/70 hover:text-white">Закрыть</button>
        </div>

        <div className="flex border-b border-white/10">
          <button onClick={() => setActiveTab("subtasks")} className={`px-4 py-2 text-xs ${activeTab === "subtasks" ? "text-blue-300 border-b border-blue-300" : "text-white/40"}`}>
            ПОДЗАДАЧИ ({task.subtasksList.filter((s) => s.status === "done").length}/{task.subtasksList.length})
          </button>
          <button onClick={() => setActiveTab("notes")} className={`px-4 py-2 text-xs ${activeTab === "notes" ? "text-blue-300 border-b border-blue-300" : "text-white/40"}`}>
            ПРИМЕЧАНИЯ
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {activeTab === "subtasks" ? (
            <div>
              {task.subtasksList.map((sub) => (
                <SubtaskRow
                  key={sub.id}
                  subtask={sub}
                  onDelete={handleDeleteSubtask}
                  onStatusChange={handleSubtaskStatusChange}
                  onContentChange={handleSubtaskContentChange}
                />
              ))}
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

interface TasksListProps {
  tasks: TaskData[];
}

export function TasksList({ tasks: initialTasks }: TasksListProps) {
  const [tasks, setTasks] = useState<TaskData[]>(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const patchTask = (id: number, patch: Partial<TaskData>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  if (tasks.length === 0) {
    return <div className="text-center py-16 text-text-dim text-xs">// ЗАДАЧИ НЕ НАЙДЕНЫ</div>;
  }

  return (
    <>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onOpen={setSelectedTaskId} onTaskPatch={patchTask} />
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
