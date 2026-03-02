// lib/tasks/filters.ts
// Бизнес-логика фильтрации и сортировки задач, ранее встроенная в tasks/page.tsx.

import { getTaskDueInDays, isTaskDashboardCritical } from "@/lib/tasks/critical";

interface SortableTask {
  status: string;
  priority: string;
  month: number;
  dateFrom: number;
  dateTo: number;
}

interface FilterableTask extends SortableTask {
  category: string;
  responsible: string;
  title: string;
  description: string | null;
}

export interface ActiveFilters {
  category: string;
  priority: string;
  status: string;
  month: number;
  search: string;
  responsible: string;
  criticalOnly: boolean;
  monthWindowAuto: boolean;
  currentMonth: number;
}

const PRIORITY_WEIGHT: Record<string, number> = { critical: 0, high: 1, normal: 2 };

export function sortTasks<T extends SortableTask>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const aDone = a.status === "done";
    const bDone = b.status === "done";
    if (aDone !== bDone) return aDone ? 1 : -1;

    if (!aDone && !bDone) {
      const aDue = getTaskDueInDays(a as Parameters<typeof getTaskDueInDays>[0]);
      const bDue = getTaskDueInDays(b as Parameters<typeof getTaskDueInDays>[0]);
      const aNear = aDue <= 7;
      const bNear = bDue <= 7;
      if (aNear !== bNear) return aNear ? -1 : 1;
      if (aNear && bNear && aDue !== bDue) return aDue - bDue;
    }

    const pa = PRIORITY_WEIGHT[a.priority] ?? 99;
    const pb = PRIORITY_WEIGHT[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    if (a.month !== b.month) return a.month - b.month;
    if (a.dateTo !== b.dateTo) return a.dateTo - b.dateTo;
    return a.dateFrom - b.dateFrom;
  });
}

export function applyFilters<T extends FilterableTask>(
  tasks: T[],
  filters: ActiveFilters,
): T[] {
  let result = [...tasks];

  if (filters.monthWindowAuto && !filters.month) {
    const prev = filters.currentMonth === 1 ? 12 : filters.currentMonth - 1;
    const next = filters.currentMonth === 12 ? 1 : filters.currentMonth + 1;
    const allowed = new Set([prev, filters.currentMonth, next]);
    result = result.filter((t) => allowed.has(t.month));
  }

  if (filters.criticalOnly) result = result.filter((t) => isTaskDashboardCritical(t));
  if (filters.category)     result = result.filter((t) => t.category === filters.category);
  if (filters.priority)     result = result.filter((t) => t.priority === filters.priority);
  if (filters.status)       result = result.filter((t) => t.status === filters.status);
  if (filters.responsible)  result = result.filter((t) => t.responsible === filters.responsible);
  if (filters.month)        result = result.filter((t) => t.month === filters.month);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q),
    );
  }

  return sortTasks(result);
}