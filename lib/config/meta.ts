// lib/config/meta.ts
// Единственный источник истины для всех визуальных метаданных.
// Ранее эти объекты дублировались в 6+ файлах.

export const CATEGORY_META = {
  "Н":   { icon: "⚗",  label: "Наука",          color: "oklch(72% 0.17 155)", hex: "#1ae8a0" },
  "А":   { icon: "📡", label: "Агитация",        color: "oklch(68% 0.18 232)", hex: "#4f8ef7" },
  "БП":  { icon: "🎯", label: "Боевая подг.",    color: "oklch(68% 0.22 25)",  hex: "#ff6b6b" },
  "ПД":  { icon: "⚙",  label: "Повседн. деят.", color: "oklch(75% 0.18 75)",  hex: "#f5b942" },
  "ВПР": { icon: "🎖", label: "ВПР",             color: "oklch(66% 0.20 285)", hex: "#9d7afe" },
  "У":   { icon: "🏁", label: "Увольнение",      color: "oklch(72% 0.18 55)",  hex: "#ff8c42" },
  "П":   { icon: "🔰", label: "Призыв",          color: "oklch(72% 0.14 210)", hex: "#22d4f0" },
  "ЗиТ": { icon: "💻", label: "Техника",         color: "oklch(60% 0.06 255)", hex: "#8899bb" },
  "ЕМ":  { icon: "📋", label: "Ежемесячные",     color: "oklch(75% 0.18 75)",  hex: "#f5b942" },
  "НД":  { icon: "🔬", label: "Научная деят.",   color: "oklch(72% 0.17 155)", hex: "#1ae8a0" },
  "МГ":  { icon: "⚡", label: "Мобготовность",   color: "oklch(68% 0.22 25)",  hex: "#ff6b6b" },
} as const;

export const PRIORITY_META = {
  critical: { color: "oklch(68% 0.22 25)",  hex: "#ff6b6b", label: "Критический", labelUpper: "КРИТИЧЕСКИЙ", abbr: "КРТ", glow: "oklch(68% 0.22 25 / 0.40)"  },
  high:     { color: "oklch(75% 0.18 75)",  hex: "#f5b942", label: "Высокий",     labelUpper: "ВЫСОКИЙ",     abbr: "ВЫС", glow: "oklch(75% 0.18 75 / 0.35)"  },
  normal:   { color: "oklch(68% 0.18 272)", hex: "#4f8ef7", label: "Нормальный",  labelUpper: "НОРМАЛЬНЫЙ",  abbr: "НОР", glow: "oklch(68% 0.18 272 / 0.30)" },
} as const;

export const STATUS_META = {
  pending:     { label: "Ожидает",   labelUpper: "ОЖИДАЕТ",   color: "oklch(60% 0.05 260)", hex: "#8899bb", bg: "oklch(100% 0 0 / 0.05)",     border: "oklch(100% 0 0 / 0.12)"     },
  in_progress: { label: "В работе",  labelUpper: "В РАБОТЕ",  color: "oklch(75% 0.18 75)",  hex: "#f5b942", bg: "oklch(75% 0.18 75 / 0.10)",  border: "oklch(75% 0.18 75 / 0.25)"  },
  done:        { label: "Выполнено", labelUpper: "ВЫПОЛНЕНО", color: "oklch(72% 0.17 155)", hex: "#1ae8a0", bg: "oklch(72% 0.17 155 / 0.10)", border: "oklch(72% 0.17 155 / 0.25)" },
  cancelled:   { label: "Отменено",  labelUpper: "ОТМЕНЕНО",  color: "oklch(68% 0.22 25)",  hex: "#ff6b6b", bg: "oklch(68% 0.22 25 / 0.10)",  border: "oklch(68% 0.22 25 / 0.25)"  },
} as const;

export const RANK_META: Record<string, { color: string; short: string }> = {
  "Полковник":         { color: "oklch(75% 0.18 75)",  short: "П-К"   },
  "Подполковник":      { color: "oklch(75% 0.18 75)",  short: "П-Л"   },
  "Майор":             { color: "oklch(72% 0.18 55)",  short: "МАЙ"  },
  "Капитан":           { color: "oklch(68% 0.18 232)", short: "КПТ"  },
  "Старший лейтенант": { color: "oklch(72% 0.14 210)", short: "СТ-Л" },
  "Лейтенант":         { color: "oklch(68% 0.18 272)", short: "ЛТ"   },
  "Старший прапорщик": { color: "oklch(72% 0.17 155)", short: "СТ-П" },
  "Прапорщик":         { color: "oklch(72% 0.17 155)", short: "ПРП"  },
  "Старший сержант":   { color: "oklch(60% 0.05 258)", short: "С-СРЖ"},
  "Сержант":           { color: "oklch(60% 0.05 258)", short: "СРЖ"  },
  "Младший сержант":   { color: "oklch(55% 0.04 260)", short: "МЛ-С" },
  "Рядовой":           { color: "oklch(50% 0.04 262)", short: "РДВ"  },
};

/** Получить метаданные категории с fallback */
export const getCatMeta = (code: string) =>
  CATEGORY_META[code as keyof typeof CATEGORY_META] ??
  { icon: "•", color: "oklch(60% 0.05 255)", label: code, hex: "#8899bb" };

/** Получить метаданные приоритета с fallback */
export const getPriMeta = (priority: string) =>
  PRIORITY_META[priority as keyof typeof PRIORITY_META] ?? PRIORITY_META.normal;

/** Получить метаданные статуса с fallback */
export const getStatusMeta = (status: string) =>
  STATUS_META[status as keyof typeof STATUS_META] ?? STATUS_META.pending;