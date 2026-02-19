// src/actions/tasks.ts
"use server";

import { db }             from "@/lib/db";
import { tasks, subtasks, taskHistory } from "@/lib/db/schema";
import { eq, asc }        from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { TaskWithSubtasks, NewSubtask } from "@/lib/db/schema";

const REVALIDATE_PATHS = ["/", "/tasks", "/timeline", "/roles"];
function revalidateAll() {
  REVALIDATE_PATHS.forEach(revalidatePath);
}

// ─── Задачи ──────────────────────────────────────

export async function getTasks(): Promise<TaskWithSubtasks[]> {
  const allTasks    = await db.select().from(tasks).orderBy(tasks.month, tasks.dateFrom);
  const allSubtasks = await db.select().from(subtasks).orderBy(asc(subtasks.order));

  return allTasks.map(task => ({
    ...task,
    subtasksList: allSubtasks.filter(s => s.taskId === task.id),
  }));
}

export async function getTaskWithSubtasks(taskId: number): Promise<TaskWithSubtasks | null> {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!task) return null;

  const subs = await db
    .select()
    .from(subtasks)
    .where(eq(subtasks.taskId, taskId))
    .orderBy(asc(subtasks.order));

  return { ...task, subtasksList: subs };
}

export async function completeTask(taskId: number) {
  const [updated] = await db
    .update(tasks)
    .set({ status: "done", completedAt: new Date(), updatedAt: new Date() })
    .where(eq(tasks.id, taskId))
    .returning();

  if (!updated) throw new Error(`Задача ${taskId} не найдена`);

  // Завершить все незакрытые подзадачи
  await db
    .update(subtasks)
    .set({ status: "done", completedAt: new Date(), updatedAt: new Date() })
    .where(eq(subtasks.taskId, taskId));

  revalidateAll();
  return { success: true as const, task: updated };
}

export async function reopenTask(taskId: number) {
  const [updated] = await db
    .update(tasks)
    .set({ status: "pending", completedAt: null, completedBy: null, updatedAt: new Date() })
    .where(eq(tasks.id, taskId))
    .returning();

  if (!updated) throw new Error(`Задача ${taskId} не найдена`);
  revalidateAll();
  return { success: true as const, task: updated };
}

export async function updateTaskNotes(
  taskId: number,
  data: { description?: string; notes?: string }
) {
  const [updated] = await db
    .update(tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tasks.id, taskId))
    .returning();

  if (!updated) throw new Error(`Задача ${taskId} не найдена`);
  revalidateAll();
  return { success: true as const, task: updated };
}

// ─── Подзадачи ───────────────────────────────────

export async function addSubtask(
  taskId: number,
  data: { title: string; description?: string }
): Promise<{ success: true; subtask: typeof subtasks.$inferSelect }> {
  // Определяем следующий order
  const existing = await db
    .select()
    .from(subtasks)
    .where(eq(subtasks.taskId, taskId));

  const maxOrder = existing.length > 0
    ? Math.max(...existing.map(s => s.order))
    : -1;

  const [subtask] = await db
    .insert(subtasks)
    .values({
      taskId,
      title:       data.title,
      description: data.description ?? null,
      order:       maxOrder + 1,
    })
    .returning();

  revalidateAll();
  return { success: true, subtask };
}

export async function completeSubtask(subtaskId: number) {
  const [updated] = await db
    .update(subtasks)
    .set({ status: "done", completedAt: new Date(), updatedAt: new Date() })
    .where(eq(subtasks.id, subtaskId))
    .returning();

  if (!updated) throw new Error(`Подзадача ${subtaskId} не найдена`);

  // Проверяем — все ли подзадачи выполнены → автозакрытие задачи
  const siblings = await db
    .select()
    .from(subtasks)
    .where(eq(subtasks.taskId, updated.taskId));

  const allDone = siblings.every(s => s.status === "done");
  if (allDone) {
    await db
      .update(tasks)
      .set({ status: "done", completedAt: new Date(), updatedAt: new Date() })
      .where(eq(tasks.id, updated.taskId));
  }

  revalidateAll();
  return { success: true as const, subtask: updated };
}

export async function reopenSubtask(subtaskId: number) {
  const [updated] = await db
    .update(subtasks)
    .set({ status: "pending", completedAt: null, completedBy: null, updatedAt: new Date() })
    .where(eq(subtasks.id, subtaskId))
    .returning();

  if (!updated) throw new Error(`Подзадача ${subtaskId} не найдена`);

  // Если задача была закрыта — переоткрываем
  await db
    .update(tasks)
    .set({ status: "pending", completedAt: null, completedBy: null, updatedAt: new Date() })
    .where(eq(tasks.id, updated.taskId));

  revalidateAll();
  return { success: true as const, subtask: updated };
}

export async function updateSubtask(
  subtaskId: number,
  data: { title?: string; description?: string }
) {
  const [updated] = await db
    .update(subtasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subtasks.id, subtaskId))
    .returning();

  if (!updated) throw new Error(`Подзадача ${subtaskId} не найдена`);
  revalidateAll();
  return { success: true as const, subtask: updated };
}

export async function deleteSubtask(subtaskId: number) {
  await db.delete(subtasks).where(eq(subtasks.id, subtaskId));
  revalidateAll();
  return { success: true as const };
}

// ─── Статистика ───────────────────────────────────
export async function getDashboardStats() {
  const allTasks    = await db.select().from(tasks);
  const allSubtasks = await db.select().from(subtasks);

  const total    = allTasks.length;
  const done     = allTasks.filter(t => t.status === "done").length;
  const critical = allTasks.filter(t => t.priority === "critical" && t.status !== "done").length;

  const monthStats = Array.from({ length: 12 }, (_, i) => {
    const m = allTasks.filter(t => t.month === i + 1);
    return {
      month:    i + 1,
      total:    m.length,
      done:     m.filter(t => t.status === "done").length,
      critical: m.filter(t => t.priority === "critical").length,
    };
  });

  const subtaskStats = {
    total: allSubtasks.length,
    done:  allSubtasks.filter(s => s.status === "done").length,
  };

  return { total, done, critical, monthStats, subtaskStats };
}