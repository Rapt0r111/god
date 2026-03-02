// lib/types/index.ts

export type SubtaskStatus = "pending" | "in_progress" | "done" | "cancelled";
export type TaskStatus    = "pending" | "in_progress" | "done" | "cancelled";
export type Priority      = "critical" | "high" | "normal";
export type CategoryCode  = "Н" | "А" | "БП" | "ПД" | "ВПР" | "У" | "П" | "ЗиТ" | "ЕМ" | "НД" | "МГ";
export type PersonnelCode = "КВ-1" | "КВ-2" | "СР" | "КНР" | "ЗКВ-1" | "ЗКВ-2" | "КО-2";

export interface SubtaskData {
  id: number;
  taskId: number;
  title: string;
  description: string | null;
  status: SubtaskStatus;
  order: number;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

export interface TaskData {
  id: number;
  title: string;
  category: string;
  priority: Priority;
  status: TaskStatus;
  responsible: string;
  month: number;
  dateFrom: number;
  dateTo: number;
  description: string | null;
  notes: string | null;
  subtasks: SubtaskData[];
}

export interface MonthStat {
  month: number;
  total: number;
  done: number;
  critical: number;
}