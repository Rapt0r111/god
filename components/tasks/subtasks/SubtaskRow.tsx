// components/tasks/subtasks/SubtaskRow.tsx
"use client";

import { useState, useEffect, useTransition, type KeyboardEvent } from "react";
import { completeSubtask, reopenSubtask, updateSubtask, deleteSubtask } from "@/actions/tasks";
import { CheckBox } from "@/components/ui/CheckBox";
import type { SubtaskData, SubtaskStatus } from "@/lib/types";

interface Props {
  subtask: SubtaskData;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: SubtaskStatus) => void;
  onContentChange: (id: number, data: { title?: string; description?: string | null }) => void;
}

export function SubtaskRow({ subtask, onDelete, onStatusChange, onContentChange }: Props) {
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

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      const next: SubtaskStatus = isDone ? "pending" : "done";
      onStatusChange(subtask.id, next);
      if (isDone) await reopenSubtask(subtask.id);
      else await completeSubtask(subtask.id);
    });
  };

  const handleSave = () => {
    const nextTitle = title.trim() || subtask.title;
    if (nextTitle === subtask.title && desc === (subtask.description ?? "")) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      await updateSubtask(subtask.id, { title: nextTitle, description: desc || undefined });
      onContentChange(subtask.id, { title: nextTitle, description: desc || null });
      setEditing(false);
    });
  };

  const handleSaveDesc = () => {
    if (desc === (subtask.description ?? "")) return;
    startTransition(async () => {
      await updateSubtask(subtask.id, { description: desc });
      onContentChange(subtask.id, { description: desc || null });
    });
  };

  return (
    <div
      className="group"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: isDone ? 0.45 : 1, transition: "opacity 0.2s" }}
    >
      <div className="flex items-center gap-2.5 py-2">
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.14)", flexShrink: 0 }} />

        <CheckBox done={isDone} pending={isPending} onToggle={handleToggle} size={20} />

        {editing ? (
          <input
            autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") { setTitle(subtask.title); setEditing(false); }
            }}
            className="flex-1 px-2 py-1 rounded-lg text-[12px] outline-none"
            style={{ background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.3)", color: "#eef2ff" }}
          />
        ) : (
          <span
            className="flex-1 text-[12px] select-none"
            style={{
              color: isDone ? "rgba(255,255,255,0.3)" : "rgba(200,216,232,0.88)",
              textDecoration: isDone ? "line-through" : "none",
              lineHeight: 1.5,
              cursor: isDone ? "default" : "text",
            }}
            onDoubleClick={() => !isDone && setEditing(true)}
            title={isDone ? undefined : "Дважды кликните для редактирования"}
          >
            {subtask.title}
          </span>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => setShowDesc((s) => !s)}
            className="flex items-center justify-center rounded-lg transition-all"
            style={{
              width: 22, height: 22, fontSize: 9, fontFamily: "var(--font-mono)",
              border: "1px solid rgba(255,255,255,0.1)",
              background: showDesc ? "rgba(79,142,247,0.12)" : "rgba(255,255,255,0.04)",
              color: showDesc ? "#93c5fd" : "rgba(136,153,187,0.5)",
            }}
            title={desc ? "Описание" : "Добавить описание"}
          >
            {desc ? "≡" : "+"}
          </button>
          <button
            onClick={() => { onDelete(subtask.id); void deleteSubtask(subtask.id); }}
            className="flex items-center justify-center rounded-lg transition-all"
            style={{ width: 22, height: 22, fontSize: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(136,153,187,0.4)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,107,107,0.35)"; e.currentTarget.style.color = "#ff9999"; e.currentTarget.style.background = "rgba(255,107,107,0.07)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(136,153,187,0.4)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            title="Удалить подзадачу"
          >×</button>
        </div>
      </div>

      {showDesc && (
        <div style={{ marginLeft: 36, marginBottom: 8, marginRight: 8 }}>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={handleSaveDesc}
            placeholder="Описание подзадачи..."
            rows={2}
            style={{
              width: "100%", padding: "7px 10px", borderRadius: 10, fontSize: 11,
              background: "rgba(8,15,28,0.8)", border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(200,216,232,0.7)", fontFamily: "var(--font-mono)", outline: "none",
              resize: "vertical",
            }}
          />
        </div>
      )}
    </div>
  );
}