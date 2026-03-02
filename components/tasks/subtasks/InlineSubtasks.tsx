// components/tasks/subtasks/InlineSubtasks.tsx
"use client";

import { deleteSubtask } from "@/actions/tasks";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SubtaskRow } from "./SubtaskRow";
import { AddSubtaskInput } from "./AddSubtaskInput";
import { getPriMeta } from "@/lib/config/meta";
import type { TaskData, SubtaskData, SubtaskStatus } from "@/lib/types";

interface Props {
  task: TaskData;
  onTaskPatch: (id: number, patch: Partial<TaskData>) => void;
}

export function InlineSubtasks({ task, onTaskPatch }: Props) {
  const subsDone  = task.subtasks.filter((s) => s.status === "done").length;
  const subsTotal = task.subtasks.length;
  const priMeta   = getPriMeta(task.priority);

  const patch = (subtasks: SubtaskData[]) => onTaskPatch(task.id, { subtasks });

  return (
    <div style={{
      borderTop: "1px solid rgba(255,255,255,0.06)",
      padding: "12px 20px 16px 52px",
      animation: "fadeUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards",
    }}>
      {subsTotal > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "rgba(136,153,187,0.4)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Прогресс подзадач
            </span>
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: subsDone === subsTotal ? "#1ae8a0" : "rgba(136,153,187,0.5)" }}>
              {subsDone}/{subsTotal}
            </span>
          </div>
          <ProgressBar done={subsDone} total={subsTotal} color={priMeta.hex} height={3} />
        </div>
      )}

      {task.subtasks.length === 0 ? (
        <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "rgba(136,153,187,0.3)", paddingBottom: 4 }}>
          // Подзадачи не добавлены
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {task.subtasks.map((sub) => (
            <SubtaskRow
              key={sub.id}
              subtask={sub}
              onDelete={(id) => patch(task.subtasks.filter((s) => s.id !== id))}
              onStatusChange={(id, status: SubtaskStatus) =>
                patch(task.subtasks.map((s) => (s.id === id ? { ...s, status } : s)))
              }
              onContentChange={(id, data) =>
                patch(task.subtasks.map((s) => (s.id === id ? { ...s, ...data } : s)))
              }
            />
          ))}
        </div>
      )}

      <AddSubtaskInput
        taskId={task.id}
        onAdd={(subtask) => patch([...task.subtasks, subtask])}
      />
    </div>
  );
}