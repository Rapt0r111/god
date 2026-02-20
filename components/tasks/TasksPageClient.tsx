"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, CircleDashed, ClipboardList, Flag, User, BookText } from "lucide-react";
import { AddTaskButton } from "@/components/tasks/AddTaskButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

function getPriorityBadgeVariant(priority: Task["priority"]) {
  if (priority === "critical") return "destructive" as const;
  if (priority === "high") return "secondary" as const;
  return "outline" as const;
}

function getStatusBadgeVariant(status: Task["status"]) {
  if (status === "done") return "default" as const;
  if (status === "cancelled") return "destructive" as const;
  if (status === "in_progress") return "secondary" as const;
  return "outline" as const;
}

function isDoneStatus(status: string) {
  return status === "done" || status === "completed";
}

function daysUntil(task: Pick<Task, "month" | "dateTo">) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const dueDate = new Date(currentYear, task.month - 1, task.dateTo);
  const diff = dueDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function TasksPageClient({ tasks }: { tasks: Task[] }) {
  const [filters, setFilters] = useState({ search: "", status: "all", priority: "all" });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const criticalOpenTasks = useMemo(
    () => tasks.filter((task) => !isDoneStatus(task.status) && task.priority === "critical").length,
    [tasks],
  );

  const filteredAndSortedTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const searchMatch =
        filters.search.trim().length === 0 ||
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (task.description ?? "").toLowerCase().includes(filters.search.toLowerCase());

      const statusMatch = filters.status === "all" || task.status === filters.status;
      const priorityMatch = filters.priority === "all" || task.priority === filters.priority;

      return searchMatch && statusMatch && priorityMatch;
    });

    return [...filtered].sort((a, b) => {
      const aDone = isDoneStatus(a.status);
      const bDone = isDoneStatus(b.status);

      if (aDone !== bDone) return aDone ? 1 : -1;

      if (!aDone && !bDone) {
        if (PRIORITY_WEIGHT[a.priority] !== PRIORITY_WEIGHT[b.priority]) {
          return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        }

        const daysA = daysUntil(a);
        const daysB = daysUntil(b);
        if (daysA !== daysB) return daysA - daysB;
      }

      return a.id - b.id;
    });
  }, [filters, tasks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Журнал задач</h1>
          <p className="text-sm text-muted-foreground">Всего: {filteredAndSortedTasks.length}</p>
        </div>
        <AddTaskButton />
      </div>

      {criticalOpenTasks > 0 && (
        <Alert
          variant="destructive"
          onClick={() => setFilters({ search: "", status: "pending", priority: "critical" })}
          className="tactical-pulse cursor-pointer border-destructive/40 bg-destructive/10 transition-colors hover:bg-destructive/20"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Обнаружены критические задачи</AlertTitle>
          <AlertDescription>Нажмите, чтобы показать только невыполненные критичные задачи ({criticalOpenTasks}).</AlertDescription>
        </Alert>
      )}

      <GlassCard className="p-4" hover={false}>
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Поиск по названию или описанию..."
            className="bg-background/50"
          />

          <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-full bg-background/50">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="pending">Ожидает</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="done">Выполнено</SelectItem>
              <SelectItem value="cancelled">Отменено</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.priority} onValueChange={(value) => setFilters((prev) => ({ ...prev, priority: value }))}>
            <SelectTrigger className="w-full bg-background/50">
              <SelectValue placeholder="Приоритет" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все приоритеты</SelectItem>
              <SelectItem value="critical">Критичный</SelectItem>
              <SelectItem value="high">Нормальный</SelectItem>
              <SelectItem value="normal">Низкий</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      <GlassCard className="p-0" hover={false}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Задача</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Срок</TableHead>
              <TableHead>Ответственный</TableHead>
              <TableHead>Приоритет</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTasks.map((task) => (
              <TableRow
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="group cursor-pointer transition-colors hover:bg-white/5"
              >
                <TableCell className="max-w-80 truncate font-medium">{task.title}</TableCell>
                <TableCell>{task.category}</TableCell>
                <TableCell>{`${task.dateFrom}-${task.dateTo}.${String(task.month).padStart(2, "0")}`}</TableCell>
                <TableCell>{task.responsible}</TableCell>
                <TableCell>
                  <Badge variant={getPriorityBadgeVariant(task.priority)}>{PRIORITY_LABELS[task.priority]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(task.status)}>{STATUS_LABELS[task.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCard>

      <Dialog open={Boolean(selectedTask)} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  {selectedTask.title}
                </DialogTitle>
                <DialogDescription>Детали задачи и текущий статус выполнения.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Flag className="h-3.5 w-3.5" /> Приоритет</p>
                  <Badge variant={getPriorityBadgeVariant(selectedTask.priority)}>{PRIORITY_LABELS[selectedTask.priority]}</Badge>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><CircleDashed className="h-3.5 w-3.5" /> Статус</p>
                  <Badge variant={getStatusBadgeVariant(selectedTask.status)}>{STATUS_LABELS[selectedTask.status]}</Badge>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> Период</p>
                  <p className="text-sm">{`${selectedTask.dateFrom}-${selectedTask.dateTo}.${String(selectedTask.month).padStart(2, "0")}`}</p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><User className="h-3.5 w-3.5" /> Ответственный</p>
                  <p className="text-sm">{selectedTask.responsible}</p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:col-span-2">
                  <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><BookText className="h-3.5 w-3.5" /> Описание</p>
                  <p className="text-sm text-foreground/90">{selectedTask.description || "Описание не добавлено"}</p>
                </div>

                {selectedTask.notes && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:col-span-2">
                    <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5" /> Примечания</p>
                    <p className="text-sm text-foreground/90">{selectedTask.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
