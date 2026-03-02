// lib/config/constants.ts

export const MONTHS_SHORT = [
  "", "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН",
  "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК",
] as const;

export const MONTHS_FULL = [
  "", "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
] as const;

export const MONTHS_FORM = MONTHS_FULL.slice(1) as readonly string[];

/** Все допустимые коды ответственных */
export const PERSONNEL = ["КВ-2", "КВ-1", "ЗКВ-2", "ЗКВ-1", "СР", "КНР", "КО-2"] as const;

/** Коды, отображаемые на страницах Timeline и Roles */
export const ALLOWED_PERSONNEL = ["КВ-1", "КВ-2", "СР", "КНР", "ЗКВ-1", "ЗКВ-2", "КО-2"] as const;

export const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/** Список категорий для форм и фильтров */
export const CATEGORIES_LIST = [
  { code: "Н",   icon: "⚗",  label: "Наука"         },
  { code: "А",   icon: "📡", label: "Агитация"       },
  { code: "БП",  icon: "🎯", label: "Боевая подг."   },
  { code: "ПД",  icon: "⚙",  label: "Повседн. деят." },
  { code: "ВПР", icon: "🎖", label: "ВПР"            },
  { code: "У",   icon: "🏁", label: "Увольнение"     },
  { code: "П",   icon: "🔰", label: "Призыв"         },
  { code: "ЗиТ", icon: "💻", label: "Техника"        },
  { code: "ЕМ",  icon: "📋", label: "Ежемесячные"    },
  { code: "НД",  icon: "🔬", label: "Научная деят."  },
  { code: "МГ",  icon: "⚡", label: "Мобготовность"  },
] as const;

export const PRIORITIES_LIST = [
  { value: "normal",   label: "Нормальный"  },
  { value: "high",     label: "Высокий"     },
  { value: "critical", label: "Критический" },
] as const;

export const STATUSES_LIST = [
  { value: "pending",     label: "Ожидает"    },
  { value: "in_progress", label: "В работе"   },
  { value: "done",        label: "Выполнено"  },
  { value: "cancelled",   label: "Отменено"   },
] as const;