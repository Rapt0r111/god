// lib/config/meta.ts
// REFACTORED: Phase 1 — canonical source for all task metadata
// Replaces inline CAT_META / PRI_META / ST_META / CATEGORIES_LIST / PRIORITIES_LIST
// declared separately in TasksPageClient, EditTaskModal, TaskDetailsModal, TaskRow,
// DashboardClient, TasksList, TimelineClient, RolesClient, AddTaskButton

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CategoryMeta {
  icon:  string;
  /** oklch color string, e.g. "oklch(72% 0.17 152)" */
  color: string;
  label: string;
}

export interface PriorityMeta {
  icon:  string;
  color: string;
  label: string;
}

export interface StatusMeta {
  icon:  string;
  label: string;
  color: string;
  /** Transparent fill for badge backgrounds */
  bg:    string;
  /** Border color for badges */
  bd:    string;
}

// ── Category metadata ─────────────────────────────────────────────────────────
// REFACTORED: Phase 1 — was inlined in 6+ files under names CAT_META / CATEGORIES_META / CATEGORIES_LIST

export const CATEGORY_META: Record<string, CategoryMeta> = {
  "Н":   { icon: "⚗",  color: "oklch(72% 0.17 152)", label: "Наука"            },
  "А":   { icon: "📡", color: "oklch(70% 0.15 230)", label: "Агитация"         },
  "БП":  { icon: "🎯", color: "oklch(67% 0.21 22)",  label: "Боевая подготовка" },
  "ПД":  { icon: "⚙",  color: "oklch(74% 0.18 68)",  label: "Повседн. деят."   },
  "ВПР": { icon: "🎖", color: "oklch(68% 0.18 288)", label: "ВПР"              },
  "У":   { icon: "🏁", color: "oklch(74% 0.17 60)",  label: "Увольнение"       },
  "П":   { icon: "🔰", color: "oklch(70% 0.15 210)", label: "Призыв"           },
  "ЗиТ": { icon: "💻", color: "oklch(62% 0.06 258)", label: "Техника"          },
  "ЕМ":  { icon: "📋", color: "oklch(74% 0.18 68)",  label: "Ежемесячные"      },
  "НД":  { icon: "🔬", color: "oklch(72% 0.17 152)", label: "Научная деят."    },
  "МГ":  { icon: "⚡", color: "oklch(67% 0.21 22)",  label: "Мобготовность"    },
} as const;

/**
 * Array form of CATEGORY_META — used by forms that render category picker buttons.
 * REFACTORED: Phase 1 — replaces CATEGORIES_LIST in EditTaskModal.tsx
 */
export const CATEGORY_LIST = Object.entries(CATEGORY_META).map(([code, meta]) => ({
  code,
  ...meta,
}));

// ── Priority metadata ─────────────────────────────────────────────────────────
// REFACTORED: Phase 1 — was inlined in 6+ files under names PRI_META / PRIORITY_META / PRIORITIES_LIST

export const PRIORITY_META: Record<string, PriorityMeta> = {
  critical: { icon: "⚡", color: "oklch(67% 0.21 22)",  label: "Критический" },
  high:     { icon: "▲", color: "oklch(74% 0.18 68)",  label: "Высокий"     },
  normal:   { icon: "◆", color: "oklch(68% 0.18 288)", label: "Нормальный"  },
} as const;

/**
 * Array form of PRIORITY_META — used by forms that render priority picker buttons.
 * REFACTORED: Phase 1 — replaces PRIORITIES_LIST in EditTaskModal.tsx
 */
export const PRIORITY_LIST = Object.entries(PRIORITY_META).map(([value, meta]) => ({
  value,
  ...meta,
}));

// ── Status metadata ───────────────────────────────────────────────────────────
// REFACTORED: Phase 1 — was inlined in 6+ files under names ST_META / STATUS_META

export const STATUS_META: Record<string, StatusMeta> = {
  pending: {
    icon:  "○",
    label: "Ожидает",
    color: "var(--tx-3)",
    bg:    "oklch(100% 0 0 / 0.04)",
    bd:    "var(--bd-1)",
  },
  in_progress: {
    icon:  "◐",
    label: "В работе",
    color: "oklch(74% 0.18 68)",
    bg:    "oklch(74% 0.18 68 / 0.10)",
    bd:    "oklch(74% 0.18 68 / 0.24)",
  },
  done: {
    icon:  "●",
    label: "Выполнено",
    color: "oklch(72% 0.17 152)",
    bg:    "oklch(72% 0.17 152 / 0.10)",
    bd:    "oklch(72% 0.17 152 / 0.24)",
  },
  cancelled: {
    icon:  "✕",
    label: "Отменено",
    color: "oklch(50% 0.06 258)",
    bg:    "oklch(50% 0.06 258 / 0.10)",
    bd:    "oklch(50% 0.06 258 / 0.20)",
  },
} as const;

// ── Fallback helpers ──────────────────────────────────────────────────────────

/** Safe lookup with fallback to avoid undefined crashes */
export function getCategoryMeta(code: string): CategoryMeta {
  return CATEGORY_META[code] ?? { icon: "•", color: "var(--tx-3)", label: code };
}

export function getPriorityMeta(priority: string): PriorityMeta {
  return PRIORITY_META[priority] ?? PRIORITY_META.normal;
}

export function getStatusMeta(status: string): StatusMeta {
  return STATUS_META[status] ?? STATUS_META.pending;
}