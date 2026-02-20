// src/components/tasks/TaskCard.tsx
"use client";

import { useState, useTransition } from "react";
import { completeTask, reopenTask } from "@/actions/tasks";
import { useTaskStore } from "@/hooks/useTaskStore";
import type { Task } from "@/lib/db/schema";

const PRIORITY_COLORS = {
  critical: "#ef4444",
  high:     "#f59e0b",
  normal:   "#34d399",
} as const;

const CATEGORY_META = {
  "Н":   { icon: "⚗",  label: "Наука",           color: "#34d399" },
  "А":   { icon: "📡", label: "Агитация",         color: "#60a5fa" },
  "БП":  { icon: "🎯", label: "Боевая подготовка",color: "#f87171" },
  "ПД":  { icon: "⚙",  label: "Повседн. деят.",   color: "#f59e0b" },
  "ВПР": { icon: "🎖", label: "ВПР",              color: "#a78bfa" },
  "У":   { icon: "🏁", label: "Увольнение",       color: "#fb923c" },
  "П":   { icon: "🔰", label: "Призыв",           color: "#22d3ee" },
  "ЗиТ": { icon: "💻", label: "Техника",          color: "#94a3b8" },
  "ЕМ":  { icon: "📋", label: "Ежемесячные",      color: "#fbbf24" },
  "НД":  { icon: "🔬", label: "Научная деят.",    color: "#34d399" },
  "МГ":  { icon: "⚡", label: "Мобготовность",    color: "#ef4444" },
} as const;

const MONTHS = ["", "ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН",
                    "ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];

interface TaskCardProps {
  task: Task & { subtasks?: { id: number; title: string }[] };
}

export function TaskCard({ task }: TaskCardProps) {
  const [expanded, setExpanded]   = useState(false);
  const [isPending, startTransition] = useTransition();

  const { optimisticComplete, optimisticReopen } = useTaskStore();

  const cat      = CATEGORY_META[task.category as keyof typeof CATEGORY_META];
  const priColor = PRIORITY_COLORS[task.priority];
  const isDone   = task.status === "done";
  const subs     = (task.subtasks as string[]) ?? [];

  const dateRange = task.dateFrom === task.dateTo
    ? `${task.dateFrom}`
    : `${task.dateFrom}–${task.dateTo}`;

  const handleToggle = () => {
    startTransition(async () => {
      if (isDone) {
        optimisticReopen(task.id);     // Мгновенный UI
        await reopenTask(task.id);     // Сервер
      } else {
        optimisticComplete(task.id);
        await completeTask(task.id);
      }
    });
  };

  return (
    <article
      className={[
        "relative mb-2 border transition-all duration-200",
        "bg-bg-panel border-border",
        "hover:bg-bg-hover hover:border-border-bright",
        "hover:translate-x-0.5",
        isDone && "opacity-40",
        isPending && "opacity-60 pointer-events-none",
      ].filter(Boolean).join(" ")}
    >
      {/* Полоса приоритета слева */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: priColor }}
      />

      {/* Основная строка */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 pl-[18px]"
        onClick={() => subs.length > 0 && setExpanded((e) => !e)}
        role={subs.length > 0 ? "button" : undefined}
      >
        {/* Чекбокс */}
        <button
          onClick={(e) => { e.stopPropagation(); handleToggle(); }}
          className={[
            "w-[18px] h-[18px] min-w-[18px] border flex items-center justify-center",
            "text-[10px] transition-all duration-150",
            isDone
              ? "border-(--color-accent-green) bg-[rgba(52,211,153,0.15)] text-(--color-accent-green)"
              : "border-border-bright hover:border-(--color-accent-green) hover:bg-[rgba(52,211,153,0.1)]",
          ].join(" ")}
          aria-label={isDone ? "Переоткрыть" : "Завершить"}
        >
          {isDone && "✓"}
        </button>

        {/* Информация */}
        <div className="flex-1 min-w-0">
          <p className={[
            "font-body text-[13px] font-medium text-primary truncate mb-0.5",
            isDone && "line-through",
          ].join(" ")}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 font-mono text-[10px] text-dim">
            {/* Дата */}
            <span className="text-secondary">
              {MONTHS[task.month]} {dateRange}
            </span>

            {/* Категория */}
            {cat && (
              <span
                className="px-1.5 py-px text-[9px] tracking-wide"
                style={{
                  backgroundColor: `${cat.color}15`,
                  color: cat.color,
                  border: `1px solid ${cat.color}40`,
                }}
              >
                {cat.icon} {task.category}
              </span>
            )}

            {/* Ответственный */}
            <span
              className="px-1.5 py-px text-[10px]"
              style={{
                backgroundColor: `${priColor}10`,
                color: priColor,
                border: `1px solid ${priColor}30`,
              }}
            >
              {task.responsible}
            </span>

            {/* Количество подзадач */}
            {subs.length > 0 && (
              <span className="text-dim">/{subs.length} задач</span>
            )}
          </div>
        </div>

        {/* Индикатор раскрытия */}
        {subs.length > 0 && (
          <span
            className="text-[10px] text-dim transition-transform duration-200"
            style={{ transform: expanded ? "rotate(90deg)" : "none" }}
          >
            ▶
          </span>
        )}

        {/* Спиннер */}
        {isPending && (
          <span className="text-[10px] text-secondary animate-pulse font-mono">
            ···
          </span>
        )}
      </div>

      {/* Подзадачи */}
      {expanded && subs.length > 0 && (
        <div className="px-4 pb-3 pl-11 flex flex-col gap-1">
          {subs.map((sub, i) => (
            <div
              key={i}
              className="flex items-center gap-2 font-mono text-[11px] text-secondary py-[3px] border-b border-border/50"
            >
              <span className="text-dim w-5 text-right text-[10px]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{sub}</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}