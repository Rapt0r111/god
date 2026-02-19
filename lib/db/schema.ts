// src/lib/db/schema.ts
import {
  pgTable, serial, text, integer, boolean,
  timestamp, pgEnum, jsonb, varchar, index
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────
export const priorityEnum = pgEnum("priority", [
  "critical", "high", "normal"
]);

export const statusEnum = pgEnum("status", [
  "pending", "in_progress", "done", "cancelled"
]);

export const categoryEnum = pgEnum("category", [
  "Н", "А", "БП", "ПД", "ВПР", "У", "П",
  "ЗиТ", "ЕМ", "НД", "МГ"
]);

export const frequencyEnum = pgEnum("frequency", [
  "once", "weekly", "monthly", "quarterly", "yearly"
]);

export const roleEnum = pgEnum("role", [
  "КНР", "КВ-1", "КВ-2", "ЗКВ-1", "ЗКВ-2", "ПС", "СР"
]);

// ─── Пользователи ────────────────────────────────
export const users = pgTable("users", {
  id:        text("id").primaryKey(),
  name:      text("name").notNull(),
  email:     text("email").notNull().unique(),
  role:      roleEnum("role").notNull().default("КВ-2"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Задачи ──────────────────────────────────────
export const tasks = pgTable("tasks", {
  id:          serial("id").primaryKey(),
  title:       text("title").notNull(),
  description: text("description"),          // Подробное описание
  notes:       text("notes"),                // Примечания/заметки офицера
  category:    categoryEnum("category").notNull(),
  priority:    priorityEnum("priority").notNull().default("normal"),
  status:      statusEnum("status").notNull().default("pending"),
  responsible: roleEnum("responsible").notNull(),
  month:       integer("month").notNull(),
  dateFrom:    integer("date_from").notNull(),
  dateTo:      integer("date_to").notNull(),
  frequency:   frequencyEnum("frequency").default("once"),
  completedAt: timestamp("completed_at"),
  completedBy: text("completed_by").references(() => users.id),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("tasks_month_idx").on(table.month),
  index("tasks_status_idx").on(table.status),
  index("tasks_priority_idx").on(table.priority),
  index("tasks_responsible_idx").on(table.responsible),
]);

// ─── Подзадачи (отдельная таблица) ───────────────
export const subtasks = pgTable("subtasks", {
  id:          serial("id").primaryKey(),
  taskId:      integer("task_id")
                 .references(() => tasks.id, { onDelete: "cascade" })
                 .notNull(),
  title:       text("title").notNull(),
  description: text("description"),          // Описание подзадачи
  status:      statusEnum("status").notNull().default("pending"),
  order:       integer("order").notNull().default(0),
  completedAt: timestamp("completed_at"),
  completedBy: text("completed_by").references(() => users.id),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("subtasks_task_idx").on(table.taskId),
  index("subtasks_order_idx").on(table.taskId, table.order),
]);

// ─── История изменений ────────────────────────────
export const taskHistory = pgTable("task_history", {
  id:        serial("id").primaryKey(),
  taskId:    integer("task_id")
               .references(() => tasks.id, { onDelete: "cascade" })
               .notNull(),
  userId:    text("user_id").references(() => users.id),
  action:    text("action").notNull(),
  oldValue:  text("old_value"),
  newValue:  text("new_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Экспорт типов ────────────────────────────────
export type Task        = typeof tasks.$inferSelect;
export type NewTask     = typeof tasks.$inferInsert;
export type Subtask     = typeof subtasks.$inferSelect;
export type NewSubtask  = typeof subtasks.$inferInsert;
export type TaskHistory = typeof taskHistory.$inferSelect;
export type User        = typeof users.$inferSelect;

// Задача с подзадачами (для UI)
export type TaskWithSubtasks = Task & {
  subtasksList: Subtask[];
};