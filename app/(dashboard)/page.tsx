// app/(dashboard)/page.tsx
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getTaskDueInDays, isTaskDashboardCritical } from "@/lib/tasks/critical";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

async function getStats() {
  const all = await db.select().from(tasks).orderBy(tasks.month, tasks.dateFrom);

  const total    = all.length;
  const done     = all.filter(t => t.status === "done").length;
  const critical = all.filter(t => isTaskDashboardCritical(t)).length;
  const pending  = all.filter(t => t.status === "pending" || t.status === "in_progress").length;

  const cur    = new Date().getMonth() + 1;
  const curMonth  = all.filter(t => t.month === cur);
  const curDone   = curMonth.filter(t => t.status === "done").length;

  const monthStats = Array.from({ length: 12 }, (_, i) => {
    const m = all.filter(t => t.month === i + 1);
    return {
      month:    i + 1,
      total:    m.length,
      done:     m.filter(t => t.status === "done").length,
      critical: m.filter(t => isTaskDashboardCritical(t)).length,
    };
  });

  const upcoming = all
    .filter(t => t.status !== "done" && t.status !== "cancelled")
    .sort((a, b) => {
      const ac = isTaskDashboardCritical(a);
      const bc = isTaskDashboardCritical(b);
      if (ac !== bc) return ac ? -1 : 1;
      return getTaskDueInDays(a) - getTaskDueInDays(b);
    })
    .slice(0, 8);

  return {
    total, done, critical, pending,
    curMonth: curMonth.length, curDone, currentMonth: cur,
    monthStats, upcoming,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();
  return <DashboardClient {...stats} />;
}