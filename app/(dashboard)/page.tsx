// app/(dashboard)/page.tsx
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getTaskDueInDays, isTaskDashboardCritical } from "@/lib/tasks/critical";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

const MONTHS = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];

async function getStats() {
  const allTasks = await db.select().from(tasks).orderBy(tasks.month, tasks.dateFrom);

  const total    = allTasks.length;
  const done     = allTasks.filter(t => t.status === "done").length;
  const critical = allTasks.filter(t => isTaskDashboardCritical(t)).length;

  const currentMonth  = new Date().getMonth() + 1;
  const thisMonth     = allTasks.filter(t => t.month === currentMonth);
  const thisMonthDone = thisMonth.filter(t => t.status === "done").length;

  const monthStats = Array.from({ length: 12 }, (_, i) => {
    const m = allTasks.filter(t => t.month === i + 1);
    return {
      month: i + 1,
      total: m.length,
      done: m.filter(t => t.status === "done").length,
      critical: m.filter(t => isTaskDashboardCritical(t)).length,
    };
  });

  const upcomingTasks = allTasks
    .filter(t => t.status !== "done" && t.status !== "cancelled")
    .sort((a, b) => {
      const aIsCritical = isTaskDashboardCritical(a);
      const bIsCritical = isTaskDashboardCritical(b);
      if (aIsCritical !== bIsCritical) return aIsCritical ? -1 : 1;
      const aDue = getTaskDueInDays(a);
      const bDue = getTaskDueInDays(b);
      if (aDue !== bDue) return aDue - bDue;
      if (a.month !== b.month) return a.month - b.month;
      return a.dateFrom - b.dateFrom;
    })
    .slice(0, 7);

  return {
    total, done, critical,
    thisMonth: thisMonth.length, thisMonthDone,
    currentMonth, monthStats, upcomingTasks,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();
  return <DashboardClient {...stats} />;
}