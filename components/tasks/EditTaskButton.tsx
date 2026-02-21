"use client";

import { useState } from "react";
import { EditTaskModal } from "./EditTaskModal";
import type { TaskWithSubtasks } from "@/lib/db/schema";

// ── EditTaskButton ─────────────────────────────────────────────────────
// Кнопка-карандаш. Вставь её в TaskCard/TasksList рядом с другими кнопками.
//
// Пример использования:
//   <EditTaskButton task={task} />

export function EditTaskButton({ task }: { task: TaskWithSubtasks }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={e => { e.stopPropagation(); setOpen(true); }}
        title="Редактировать задачу"
        className="flex items-center justify-center w-7 h-7 rounded-lg transition-all shrink-0"
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          color: "rgba(255,255,255,0.3)",
          fontSize: 13,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "rgba(245,158,11,0.1)";
          e.currentTarget.style.borderColor = "rgba(245,158,11,0.35)";
          e.currentTarget.style.color = "#fcd34d";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "rgba(255,255,255,0.3)";
        }}
      >
        ✎
      </button>

      {open && <EditTaskModal task={task} onClose={() => setOpen(false)} />}
    </>
  );
}