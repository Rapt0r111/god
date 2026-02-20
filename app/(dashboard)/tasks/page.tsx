import { db } from "@/lib/db";
import { TasksPageClient } from "@/components/tasks/TasksPageClient";
import type { Task } from "@/lib/db/schema";

export default async function TasksPage() {
  const tasks = await db.query.tasks.findMany();

  return <TasksPageClient tasks={tasks as Task[]} />;
}
