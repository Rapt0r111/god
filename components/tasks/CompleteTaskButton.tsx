// src/components/tasks/CompleteTaskButton.tsx
"use client";

import { useTransition } from "react";
import { completeTask, reopenTask } from "@/actions/tasks";

interface Props {
  taskId: number;
  isDone: boolean;
}

export function CompleteTaskButton({ taskId, isDone }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      if (isDone) {
        await reopenTask(taskId);
      } else {
        await completeTask(taskId);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={[
        "w-[18px] h-[18px] min-w-[18px] border flex items-center justify-center",
        "text-[10px] transition-all duration-150 shrink-0",
        isPending
          ? "opacity-50 cursor-wait border-[#1e3a5f]"
          : isDone
            ? "border-[#34d399] bg-[rgba(52,211,153,0.15)] text-[#34d399] hover:bg-[rgba(52,211,153,0.25)]"
            : "border-[#1e3a5f] hover:border-[#34d399] hover:bg-[rgba(52,211,153,0.1)]",
      ].join(" ")}
      aria-label={isDone ? "Переоткрыть задачу" : "Завершить задачу"}
      title={isDone ? "Переоткрыть" : "Завершить"}
    >
      {isPending ? "·" : isDone ? "✓" : ""}
    </button>
  );
}