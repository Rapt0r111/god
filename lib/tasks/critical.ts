const CRITICAL_DUE_SOON_DAYS = 2;

type CriticalTaskLike = {
  month: number;
  dateTo: number;
  status: string;
};

export function getTaskDueInDays(task: Pick<CriticalTaskLike, "month" | "dateTo">, now = new Date()) {
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const dueYear = task.month < currentMonth - 1 ? currentYear + 1 : currentYear;
  const dueDate = new Date(dueYear, task.month - 1, task.dateTo, 23, 59, 59, 999);

  return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isTaskDashboardCritical(task: CriticalTaskLike, now = new Date()) {
  if (task.status === "done" || task.status === "cancelled") return false;
  return getTaskDueInDays(task, now) <= CRITICAL_DUE_SOON_DAYS;
}

