"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CalendarDays, ClipboardList, Flag, User, BookText } from "lucide-react";
import { AddTaskButton } from "@/components/tasks/AddTaskButton";

type Task = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  priority: "critical" | "high" | "normal";
  status: "pending" | "in_progress" | "done" | "cancelled";
  responsible: string;
  month: number;
  dateFrom: number;
  dateTo: number;
  notes: string | null;
};

const PRIORITY_LABELS: Record<Task["priority"], string> = {
  critical: "Критичный",
  high: "Нормальный",
  normal: "Низкий",
};

const PRIORITY_WEIGHT: Record<Task["priority"], number> = {
  critical: 0,
  high: 1,
  normal: 2,
};

const STATUS_LABELS: Record<Task["status"], string> = {
  pending: "Ожидает",
  in_progress: "В работе",
  done: "Выполнено",
  cancelled: "Отменено",
};

function isDoneStatus(status: string) {
  return status === "done" || status === "completed";
}

function daysUntil(task: Pick<Task, "month" | "dateTo">) {
  const now = new Date();
  const dueDate = new Date(now.getFullYear(), task.month - 1, task.dateTo);
  return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function TasksPageClient({ tasks }: { tasks: Task[] }) {
  const [filters, setFilters] = useState({ search: "", status: "all", priority: "all" });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const criticalOpenTasks = useMemo(
    () => tasks.filter((task) => !isDoneStatus(task.status) && task.priority === "critical").length,
    [tasks],
  );

  const filteredAndSortedTasks = useMemo(() => {
    const search = filters.search.toLowerCase().trim();
    const filtered = tasks.filter((task) => {
      const searchMatch =
        !search ||
        task.title.toLowerCase().includes(search) ||
        (task.description ?? "").toLowerCase().includes(search);
      const statusMatch = filters.status === "all" || task.status === filters.status;
      const priorityMatch = filters.priority === "all" || task.priority === filters.priority;
      return searchMatch && statusMatch && priorityMatch;
    });

    return [...filtered].sort((a, b) => {
      const aDone = isDoneStatus(a.status);
      const bDone = isDoneStatus(b.status);
      if (aDone !== bDone) return aDone ? 1 : -1;

      if (!aDone) {
        const byPriority = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        if (byPriority !== 0) return byPriority;

        const byDueDate = daysUntil(a) - daysUntil(b);
        if (byDueDate !== 0) return byDueDate;
      }

      return a.id - b.id;
    });
  }, [tasks, filters]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold tracking-wide" style={{ color: "#e8f0fe" }}>
            Журнал задач
          </h2>
          <p className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
            Показано: {filteredAndSortedTasks.length}
          </p>
        </div>
        <AddTaskButton />
      </div>

      {criticalOpenTasks > 0 && (
        <button
          type="button"
          onClick={() => setFilters({ search: "", status: "pending", priority: "critical" })}
          className="tactical-pulse w-full rounded-xl border px-4 py-3 text-left transition-colors cursor-pointer"
          style={{
            borderColor: "rgba(239,68,68,0.4)",
            background: "rgba(239,68,68,0.08)",
            color: "#fecaca",
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <div>
              <p className="text-sm font-semibold">Обнаружены критические задачи</p>
              <p className="text-xs opacity-90">
                Нажмите, чтобы показать только невыполненные критичные задачи ({criticalOpenTasks}).
              </p>
            </div>
          </div>
        </button>
      )}

      <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>
        <div className="grid gap-2 md:grid-cols-3">
          <input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Поиск по названию или описанию..."
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)", color: "#e8f0fe" }}
          />

          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)", color: "#e8f0fe" }}
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="in_progress">В работе</option>
            <option value="done">Выполнено</option>
            <option value="cancelled">Отменено</option>
          </select>

          <select
            value={filters.priority}
            onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)", color: "#e8f0fe" }}
          >
            <option value="all">Все приоритеты</option>
            <option value="critical">Критичный</option>
            <option value="high">Нормальный</option>
            <option value="normal">Низкий</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <th className="p-3 text-left">Задача</th>
              <th className="p-3 text-left">Категория</th>
              <th className="p-3 text-left">Срок</th>
              <th className="p-3 text-left">Ответственный</th>
              <th className="p-3 text-left">Приоритет</th>
              <th className="p-3 text-left">Статус</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedTasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="group cursor-pointer border-b transition-colors hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <td className="p-3">{task.title}</td>
                <td className="p-3">{task.category}</td>
                <td className="p-3">{`${task.dateFrom}-${task.dateTo}.${String(task.month).padStart(2, "0")}`}</td>
                <td className="p-3">{task.responsible}</td>
                <td className="p-3">{PRIORITY_LABELS[task.priority]}</td>
                <td className="p-3">{STATUS_LABELS[task.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="w-full max-w-2xl rounded-xl border p-5"
            style={{ borderColor: "rgba(255,255,255,0.14)", background: "rgba(15,23,42,0.92)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <ClipboardList className="h-5 w-5" />
                {selectedTask.title}
              </h3>
              <button type="button" onClick={() => setSelectedTask(null)} className="text-sm text-white/70 hover:text-white">
                Закрыть
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="mb-1 flex items-center gap-2 text-xs text-white/60"><Flag className="h-3.5 w-3.5" /> Приоритет</p>
                <p className="text-sm text-white">{PRIORITY_LABELS[selectedTask.priority]}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="mb-1 text-xs text-white/60">Статус</p>
                <p className="text-sm text-white">{STATUS_LABELS[selectedTask.status]}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="mb-1 flex items-center gap-2 text-xs text-white/60"><CalendarDays className="h-3.5 w-3.5" /> Период</p>
                <p className="text-sm text-white">{`${selectedTask.dateFrom}-${selectedTask.dateTo}.${String(selectedTask.month).padStart(2, "0")}`}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="mb-1 flex items-center gap-2 text-xs text-white/60"><User className="h-3.5 w-3.5" /> Ответственный</p>
                <p className="text-sm text-white">{selectedTask.responsible}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:col-span-2">
                <p className="mb-1 flex items-center gap-2 text-xs text-white/60"><BookText className="h-3.5 w-3.5" /> Описание</p>
                <p className="text-sm text-white/90">{selectedTask.description || "Описание не добавлено"}</p>
              </div>
              {selectedTask.notes && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:col-span-2">
                  <p className="mb-1 text-xs text-white/60">Примечания</p>
                  <p className="text-sm text-white/90">{selectedTask.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
