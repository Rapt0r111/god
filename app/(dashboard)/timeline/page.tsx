// app/(dashboard)/timeline/page.tsx
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { TimelineClient } from "@/components/timeline/TimelineClient";

export default async function TimelinePage() {
  const allTasks = await db
    .select()
    .from(tasks)
    .orderBy(asc(tasks.month), asc(tasks.dateFrom), asc(tasks.id));

  return <TimelineClient tasks={allTasks} />;
}