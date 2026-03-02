// components/tasks/modals/NotesSection.tsx
"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { updateTaskNotes } from "@/actions/tasks";
import type { TaskData } from "@/lib/types";

const FIELD_STYLE = {
  width: "100%", padding: "10px 14px", borderRadius: 12, fontSize: 12,
  background: "rgba(8,15,28,0.9)", border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(200,216,232,0.85)", outline: "none", fontFamily: "inherit", lineHeight: 1.6,
};

interface Props {
  task: TaskData;
  onTaskPatch: (id: number, patch: Partial<TaskData>) => void;
}

export function NotesSection({ task, onTaskPatch }: Props) {
  const [desc,  setDesc ] = useState(task.description ?? "");
  const [notes, setNotes] = useState(task.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved ] = useState(false);
  const savedRef = useRef({ desc: task.description ?? "", notes: task.notes ?? "" });
  const [, startTransition] = useTransition();

  useEffect(() => {
    setDesc(task.description ?? "");
    setNotes(task.notes ?? "");
    savedRef.current = { desc: task.description ?? "", notes: task.notes ?? "" };
  }, [task.id, task.description, task.notes]);

  const saveField = (field: "description" | "notes", value: string) => {
    if (value === savedRef.current[field === "description" ? "desc" : "notes"]) return;
    setSaving(true);
    startTransition(async () => {
      await updateTaskNotes(task.id, { [field]: value });
      if (field === "description") {
        savedRef.current.desc = value;
        onTaskPatch(task.id, { description: value || null });
      } else {
        savedRef.current.notes = value;
        onTaskPatch(task.id, { notes: value || null });
      }
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  };

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5" style={{ color: "rgba(136,153,187,0.6)" }}>
          // Описание задачи
        </span>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={() => saveField("description", desc)}
          placeholder="Детальное описание задачи..."
          rows={3}
          style={{ ...FIELD_STYLE, resize: "vertical" }}
        />
      </label>

      <label className="block">
        <span className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5" style={{ color: "rgba(245,185,66,0.45)" }}>
          // Примечания офицера
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => saveField("notes", notes)}
          placeholder="Заметки, ремарки, уточнения..."
          rows={3}
          style={{ ...FIELD_STYLE, resize: "vertical", color: "rgba(245,185,66,0.75)", fontFamily: "var(--font-mono)", fontSize: 11 }}
        />
      </label>

      <div className="text-right h-4">
        {saving && <span className="text-[10px] font-mono" style={{ color: "rgba(136,153,187,0.5)" }}>сохранение...</span>}
        {saved  && <span className="text-[10px] font-mono" style={{ color: "#1ae8a0" }}>✓ сохранено</span>}
      </div>
    </div>
  );
}