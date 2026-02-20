"use server";

import { db }       from "@/lib/db";
import { tasks, subtasks } from "@/lib/db/schema";
import { eq }       from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Types ─────────────────────────────────────────────────────────────

export type TaskInsert = {
  title:       string;
  category:    string;
  priority:    string;
  responsible: string;
  month:       number;
  dateFrom:    number;
  dateTo:      number;
  description: string | null;
  notes:       string | null;
  status:      string;
};

export type SubtaskInsert = {
  title:       string;
  description?: string;
};

// ── Dashboard ─────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const all = await db.select().from(tasks);
  const critical = all.filter(t => t.priority === "critical" && t.status !== "done").length;
  const done     = all.filter(t => t.status === "done").length;
  const total    = all.length;
  return { critical, done, total };
}

// ── Task CRUD ─────────────────────────────────────────────────────────

export async function createTask(data: TaskInsert) {
  try {
    const [created] = await db.insert(tasks).values({
      title:       data.title,
      category:    data.category,
      priority:    data.priority,
      responsible: data.responsible,
      month:       data.month,
      dateFrom:    data.dateFrom,
      dateTo:      data.dateTo,
      description: data.description,
      notes:       data.notes,
      status:      data.status ?? "pending",
    }).returning();
    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, task: created };
  } catch (error) {
    console.error("createTask error:", error);
    return { success: false, error: "Ошибка создания задачи" };
  }
}

export async function completeTask(id: number) {
  await db.update(tasks)
    .set({ status: "done" })
    .where(eq(tasks.id, id));
  await db.update(subtasks)
    .set({ status: "done" })
    .where(eq(subtasks.taskId, id));
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

export async function reopenTask(id: number) {
  await db.update(tasks)
    .set({ status: "pending" })
    .where(eq(tasks.id, id));
  await db.update(subtasks)
    .set({ status: "pending" })
    .where(eq(subtasks.taskId, id));
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

export async function updateTaskNotes(
  id: number,
  data: { description?: string; notes?: string }
) {
  await db.update(tasks)
    .set(data)
    .where(eq(tasks.id, id));
  revalidatePath("/tasks");
}

export async function deleteTask(id: number) {
  await db.delete(subtasks).where(eq(subtasks.taskId, id));
  await db.delete(tasks).where(eq(tasks.id, id));
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { success: true };
}

// ── Subtask CRUD ──────────────────────────────────────────────────────

export async function addSubtask(taskId: number, data: SubtaskInsert) {
  try {
    const [created] = await db.insert(subtasks).values({
      taskId,
      title:       data.title,
      description: data.description ?? null,
      status:      "pending",
    }).returning();
    revalidatePath("/tasks");
    return { success: true, subtask: created };
  } catch (error) {
    console.error("addSubtask error:", error);
    return { success: false, subtask: null as any };
  }
}

export async function completeSubtask(id: number) {
  await db.update(subtasks)
    .set({ status: "done" })
    .where(eq(subtasks.id, id));
  revalidatePath("/tasks");
}

export async function reopenSubtask(id: number) {
  await db.update(subtasks)
    .set({ status: "pending" })
    .where(eq(subtasks.id, id));
  revalidatePath("/tasks");
}

export async function updateSubtask(
  id: number,
  data: { title?: string; description?: string }
) {
  await db.update(subtasks)
    .set(data)
    .where(eq(subtasks.id, id));
  revalidatePath("/tasks");
}

export async function deleteSubtask(id: number) {
  await db.delete(subtasks).where(eq(subtasks.id, id));
  revalidatePath("/tasks");
}