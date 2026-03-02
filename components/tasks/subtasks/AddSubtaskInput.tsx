// components/tasks/subtasks/AddSubtaskInput.tsx
"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { addSubtask } from "@/actions/tasks";
import type { SubtaskData } from "@/lib/types";

interface Props {
  taskId: number;
  onAdd: (subtask: SubtaskData) => void;
}

export function AddSubtaskInput({ taskId, onAdd }: Props) {
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
    <div
      className="flex items-center gap-2.5 mt-2 pt-2.5"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.09)", flexShrink: 0 }} />
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 20, height: 20, border: "1px dashed rgba(255,255,255,0.12)",
        borderRadius: 6, flexShrink: 0,
      }} />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") handleAdd();
          if (e.key === "Escape") setValue("");
        }}
        placeholder="Добавить подзадачу... (Enter)"
        disabled={isPending}
        className="flex-1 bg-transparent text-[12px] outline-none"
        style={{ color: "rgba(200,216,232,0.4)", fontFamily: "inherit" }}
      />
      {value.trim() && (
        <button
          onClick={handleAdd}
          disabled={isPending}
          className="px-2.5 py-1 rounded-xl text-[10px] font-mono tracking-wide transition-all shrink-0"
          style={{ border: "1px solid rgba(26,232,160,0.3)", background: "rgba(26,232,160,0.08)", color: "#1ae8a0" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(26,232,160,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(26,232,160,0.08)"; }}
        >
          {isPending ? "···" : "+ ОК"}
        </button>
      )}
    </div>
  );
}