// lib/config/constants.ts
// REFACTORED: Phase 1 — canonical source for months, personnel, and status cycle
// Replaces inline arrays declared in TasksPageClient, EditTaskModal, TaskDetailsModal,
// TaskRow, DashboardClient, TasksList, TimelineClient, RolesClient, AddTaskButton

// ── Months ────────────────────────────────────────────────────────────────────
// REFACTORED: Phase 1 — was inlined as MONTHS_FULL / MONTHS_SHORT / MONTHS_FORM in 6+ files
// Index 0 is empty string so month numbers (1–12) map directly: MONTHS_FULL[3] === "Март"

export const MONTHS_FULL = [
  "",
  "Январь", "Февраль", "Март",    "Апрель",
  "Май",    "Июнь",    "Июль",    "Август",
  "Сентябрь","Октябрь","Ноябрь",  "Декабрь",
] as const;

export const MONTHS_SHORT = [
  "",
  "ЯНВ", "ФЕВ", "МАР", "АПР",
  "МАЙ", "ИЮН", "ИЮЛ", "АВГ",
  "СЕН", "ОКТ", "НОЯ", "ДЕК",
] as const;

/**
 * 12-element array (no leading empty) — used by month picker buttons.
 * MONTHS_LIST[0] === "Январь", index + 1 === month number.
 * REFACTORED: Phase 1 — replaces MONTHS_FORM in EditTaskModal.tsx
 */
export const MONTHS_LIST = MONTHS_FULL.slice(1) as readonly string[];

// ── Personnel ─────────────────────────────────────────────────────────────────
// REFACTORED: Phase 1 — was inlined as PERSONNEL in EditTaskModal.tsx, RolesClient.tsx

export const PERSONNEL = [
  "КВ-2", "КВ-1", "ЗКВ-2", "ЗКВ-1", "СР", "КНР", "КО-2",
] as const;

export type PersonnelCode = typeof PERSONNEL[number];

// ── Status cycle ──────────────────────────────────────────────────────────────
// REFACTORED: Phase 1 — was inlined as STATUS_CYCLE in TasksPageClient.tsx

export type TaskStatus = "pending" | "in_progress" | "done" | "cancelled";

export const STATUS_CYCLE: TaskStatus[] = [
  "pending",
  "in_progress",
  "done",
  "cancelled",
];

/** Returns the next status in the cycle */
export function nextStatus(current: TaskStatus): TaskStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}