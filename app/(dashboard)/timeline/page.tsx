"use client";

import { completeTask, getTimelineTasks } from "@/actions/tasks";
import { useEffect, useMemo, useState, useTransition } from "react";

type Priority = "critical" | "high" | "medium";
type Status = "pending" | "in-progress" | "done" | "cancelled";

type TimelineTask = {
  id: number;
  title: string;
  category: string;
  month: number;
  dateFrom: number;
  dateTo: number;
  responsible: string;
  status: Status;
  priority: Priority;
};

const MONTHS = ["", "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН", "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК"];
const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const ALLOWED_PERSONNEL = ["КВ-1", "КВ-2", "СР", "КНР", "ЗКВ-1", "ЗКВ-2"] as const;

const PRIORITY_COLOR: Record<Priority, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#3b82f6",
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "ОЖИДАЕТ",
  "in-progress": "В РАБОТЕ",
  done: "ВЫПОЛНЕНО",
  cancelled: "ОТМЕНЕНО",
};

export default function TimelinePage() {
  const currentMonth = new Date().getMonth() + 1;
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isPending, startTransition] = useTransition();

  const loadTasks = async () => {
    const rows = await getTimelineTasks();
    const normalized: TimelineTask[] = rows
      .filter((t) => ALLOWED_PERSONNEL.includes(t.responsible as (typeof ALLOWED_PERSONNEL)[number]))
      .map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        month: t.month,
        dateFrom: t.dateFrom,
        dateTo: t.dateTo,
        responsible: t.responsible,
        status: t.status === "in_progress" ? "in-progress" : t.status,
        priority: t.priority === "normal" ? "medium" : t.priority,
      }));
    setTasks(normalized);
  };

  useEffect(() => {
    void loadTasks();
  }, []);

  const monthTasks = useMemo(
    () => tasks.filter((t) => t.month === selectedMonth).sort((a, b) => a.dateFrom - b.dateFrom),
    [tasks, selectedMonth],
  );

  const doneCount = monthTasks.filter((t) => t.status === "done").length;

  const markDone = (id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "done" } : t)));
    startTransition(async () => {
      await completeTask(id);
      await loadTasks();
    });
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold" style={{ color: "#e8f0fe" }}>
          Годовой план · нагрузка по месяцам
        </h2>
        <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>
          {monthTasks.length} задач · {doneCount} выполнено
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {MONTHS.slice(1).map((m, i) => {
          const month = i + 1;
          const hasTasks = tasks.some((t) => t.month === month);
          const active = month === selectedMonth;
          return (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className="rounded-lg px-2.5 py-1 text-[10px] font-mono"
              style={{
                border: active ? "1px solid rgba(59,130,246,0.55)" : "1px solid rgba(255,255,255,0.12)",
                background: active ? "rgba(59,130,246,0.16)" : "rgba(255,255,255,0.03)",
                color: hasTasks ? "#e8f0fe" : "rgba(255,255,255,0.35)",
              }}
            >
              {m}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto rounded-xl p-3" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        {monthTasks.length === 0 ? (
          <div className="py-12 text-center text-[12px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
            На выбранный месяц задач нет
          </div>
        ) : (
          <div className="space-y-2">
            {monthTasks.map((task) => {
              const left = ((task.dateFrom - 1) / DAYS_IN_MONTH[selectedMonth]) * 100;
              const width = ((task.dateTo - task.dateFrom + 1) / DAYS_IN_MONTH[selectedMonth]) * 100;
              const color = PRIORITY_COLOR[task.priority];
              return (
                <div key={task.id} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="mb-1 flex items-center gap-2 text-[11px]">
                    <span style={{ color }}>{task.category}</span>
                    <span style={{ color: "#e8f0fe" }}>{task.title}</span>
                    <span className="ml-auto font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {task.responsible} · {STATUS_LABEL[task.status]}
                    </span>
                  </div>
                  <div className="relative h-5 rounded" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div
                      className="absolute top-0.5 h-4 rounded"
                      style={{ left: `${left}%`, width: `${width}%`, background: `${color}66` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      disabled={task.status === "done" || isPending}
                      onClick={() => markDone(task.id)}
                      className="rounded px-2 py-1 text-[10px] font-mono"
                      style={{
                        border: "1px solid rgba(16,185,129,0.35)",
                        color: task.status === "done" ? "rgba(255,255,255,0.35)" : "#34d399",
                        background: "rgba(16,185,129,0.08)",
                      }}
                    >
                      {task.status === "done" ? "Выполнено" : "✓ Выполнить"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
