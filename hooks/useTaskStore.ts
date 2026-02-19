// src/hooks/useTaskStore.ts
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Task } from "@/lib/db/schema";

interface TaskStore {
  tasks:         Task[];
  selectedMonth: number;   // 0 = все
  filterCategory: string;  // "ALL" | category code
  filterPriority: string;  // "ALL" | priority

  // Actions
  setTasks:          (tasks: Task[]) => void;
  optimisticComplete:(id: number)    => void;
  optimisticReopen:  (id: number)    => void;
  setSelectedMonth:  (month: number) => void;
  setFilterCategory: (cat: string)   => void;
  setFilterPriority: (prio: string)  => void;
}

export const useTaskStore = create<TaskStore>()(
  immer((set) => ({
    tasks:          [],
    selectedMonth:  0,
    filterCategory: "ALL",
    filterPriority: "ALL",

    setTasks: (tasks) => set((state) => { state.tasks = tasks; }),

    optimisticComplete: (id) =>
      set((state) => {
        const t = state.tasks.find((t) => t.id === id);
        if (t) { t.status = "done"; t.completedAt = new Date(); }
      }),

    optimisticReopen: (id) =>
      set((state) => {
        const t = state.tasks.find((t) => t.id === id);
        if (t) { t.status = "pending"; t.completedAt = null; }
      }),

    setSelectedMonth:  (month) => set((s) => { s.selectedMonth  = month; }),
    setFilterCategory: (cat)   => set((s) => { s.filterCategory = cat;   }),
    setFilterPriority: (prio)  => set((s) => { s.filterPriority = prio;  }),
  }))
);