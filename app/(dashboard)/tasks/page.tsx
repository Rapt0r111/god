// app/(dashboard)/tasks/page.tsx
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { TasksPageClient } from "@/components/tasks/TasksPageClient";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function TasksPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const allTasks = await db
    .select()
    .from(tasks)
    .orderBy(asc(tasks.month), asc(tasks.dateFrom), asc(tasks.id));

  return <TasksPageClient tasks={allTasks} session={session} />;
}