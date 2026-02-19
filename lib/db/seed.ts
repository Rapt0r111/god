// src/lib/db/seed.ts
// Запуск: bun --env-file=.env.local run src/lib/db/seed.ts

import { db }    from "./index";
import { tasks } from "./schema";

const SEED_TASKS = [
  // ── ЯНВАРЬ ──────────────────────────────────────
  {
    title:       "Заявки на удостоверения в ГОМУ",
    category:    "А"  as const,
    priority:    "normal" as const,
    responsible: "КВ-2" as const,
    month: 1, dateFrom: 10, dateTo: 15,
    subtasks: [] as string[],
  },
  {
    title:       "Подготовка к итоговой проверке",
    category:    "ПД" as const,
    priority:    "critical" as const,
    responsible: "КВ-2" as const,
    month: 1, dateFrom: 10, dateTo: 30,
    subtasks: [
      "Ознакомление с тг СС-ЗМОРФ",
      "Отправка табличных сведений",
      "Подготовка презентации для доклада",
      "Подготовка слайдов об офицерах",
      "Подготовка сведений о трудоустройстве",
      "Подготовка подписанных Соглашений",
      "Подготовка выписки из приказа",
      "Подготовка удостоверений ПО",
      "Подготовка культурной программы",
      "Предложения на МВТФ «Армия»",
      "Проверка внутреннего порядка",
      "Инвентаризация документов",
    ],
  },
  {
    title:       "Подготовка к стрельбам",
    category:    "БП" as const,
    priority:    "high" as const,
    responsible: "КВ-1" as const,
    month: 1, dateFrom: 10, dateTo: 20,
    subtasks: [
      "Подготовить 7 выписок из приказа",
      "Изучение материальной части",
      "Изучение требований безопасности",
      "Практическая тренировка нормативов",
      "Зачет на допуск к стрельбам",
      "Получить имущество по накладным",
    ],
  },
  {
    title:       "Приказ о закреплении научных руководителей",
    category:    "Н"  as const,
    priority:    "normal" as const,
    responsible: "КВ-1" as const,
    month: 1, dateFrom: 10, dateTo: 20,
    subtasks: [] as string[],
  },
  {
    title:       "Мобилизационная неделя",
    category:    "ЕМ" as const,
    priority:    "normal" as const,
    responsible: "КНР" as const,
    month: 1, dateFrom: 20, dateTo: 20,
    subtasks: [
      "Расписаться в ГрОМР",
      "Подготовить рапорт (сдать в ГрОМР в четверг)",
    ],
  },
  {
    title:       "Организация стрельб (10 каф.)",
    category:    "БП" as const,
    priority:    "high" as const,
    responsible: "КВ-1" as const,
    month: 1, dateFrom: 27, dateTo: 27,
    subtasks: [] as string[],
  },
  {
    title:       "Подготовка к проведению Присяги",
    category:    "ВПР" as const,
    priority:    "high" as const,
    responsible: "КВ-2" as const,
    month: 1, dateFrom: 28, dateTo: 30,
    subtasks: [
      "Выписка из приказа о проведении Присяги",
      "Сценарий",
      "Списки посетителей",
      "Расписки для суточного увольнения",
      "Практическая подготовка МП",
      "Генеральная репетиция",
    ],
  },
  {
    title:       "Торжественная церемония Присяги",
    category:    "ВПР" as const,
    priority:    "critical" as const,
    responsible: "КНР" as const,
    month: 1, dateFrom: 31, dateTo: 31,
    subtasks: [] as string[],
  },

  // ── ФЕВРАЛЬ ─────────────────────────────────────
  {
    title:       "Итоговая проверка деятельности МОРФ",
    category:    "ПД" as const,
    priority:    "critical" as const,
    responsible: "ПС" as const,
    month: 2, dateFrom: 3, dateTo: 16,
    subtasks: [
      "По плану подготовки",
      "По перечню вопросов проверки",
      "По плану реализации рекомендаций",
    ],
  },
  {
    title:       "Приказ на конкурс ГУС",
    category:    "Н"  as const,
    priority:    "normal" as const,
    responsible: "КВ-1" as const,
    month: 2, dateFrom: 1, dateTo: 15,
    subtasks: [] as string[],
  },
  {
    title:       "Подготовка командировочных документов на агитацию",
    category:    "А"  as const,
    priority:    "high" as const,
    responsible: "КВ-2" as const,
    month: 2, dateFrom: 1, dateTo: 20,
    subtasks: [
      "Командировочные удостоверения",
      "Удостоверения на право ознакомления",
      "Проекты соглашений",
      "Перечень ВУЗов субъектов",
      "Письма в ВУЗы",
      "Печать памяток и материалов (×200)",
    ],
  },
  {
    title:       "Убытие в командировку на агитацию и ВПО",
    category:    "А"  as const,
    priority:    "high" as const,
    responsible: "КНР" as const,
    month: 2, dateFrom: 25, dateTo: 25,
    subtasks: [] as string[],
  },

  // ── МАРТ ────────────────────────────────────────
  {
    title:       "Еженедельный доклад в ГУС об агитации (по четвергам)",
    category:    "А"  as const,
    priority:    "normal" as const,
    responsible: "КВ-2" as const,
    month: 3, dateFrom: 1, dateTo: 31,
    subtasks: [] as string[],
  },
  {
    title:       "Отправка плана увольнения в запас в ОМУ ЛВО",
    category:    "У"  as const,
    priority:    "normal" as const,
    responsible: "КВ-1" as const,
    month: 3, dateFrom: 1, dateTo: 10,
    subtasks: [] as string[],
  },
  {
    title:       "Формирование документов для ВНК и ДИМК",
    category:    "А"  as const,
    priority:    "high" as const,
    responsible: "КВ-2" as const,
    month: 3, dateFrom: 25, dateTo: 25,
    subtasks: ["Рейтинговый список", "Протокол", "Оценочная ведомость"],
  },
  {
    title:       "Передача ротных обязанностей младшему призыву",
    category:    "ПД" as const,
    priority:    "normal" as const,
    responsible: "ПС" as const,
    month: 3, dateFrom: 28, dateTo: 28,
    subtasks: [] as string[],
  },

  // ── АПРЕЛЬ ──────────────────────────────────────
  {
    title:       "Квартальная проверка ВНК ГУС за 1 квартал",
    category:    "ПД" as const,
    priority:    "high" as const,
    responsible: "КНР" as const,
    month: 4, dateFrom: 7, dateTo: 9,
    subtasks: [
      "Проверить реализацию рекомендаций за 4 кв.",
      "Подготовить проект Акта",
      "Подготовить справку-доклад",
    ],
  },
  {
    title:       "Публикация рейтингового списка 1-го этапа отбора",
    category:    "П"  as const,
    priority:    "normal" as const,
    responsible: "КВ-2" as const,
    month: 4, dateFrom: 15, dateTo: 15,
    subtasks: [] as string[],
  },

  // ── МАЙ ─────────────────────────────────────────
  {
    title:       "Указания по МВТФ «Армия»",
    category:    "ПД" as const,
    priority:    "critical" as const,
    responsible: "КВ-1" as const,
    month: 5, dateFrom: 1, dateTo: 15,
    subtasks: ["Подготовка частного плана мероприятий"],
  },

  // ── ИЮЛЬ ────────────────────────────────────────
  {
    title:       "Квартальная проверка ВНК ГУС за 2 квартал",
    category:    "ПД" as const,
    priority:    "high" as const,
    responsible: "КНР" as const,
    month: 7, dateFrom: 7, dateTo: 9,
    subtasks: [] as string[],
  },
  {
    title:       "Прием молодого пополнения",
    category:    "П"  as const,
    priority:    "critical" as const,
    responsible: "ПС" as const,
    month: 7, dateFrom: 1, dateTo: 31,
    subtasks: [
      "Медицинский осмотр",
      "Копии паспорта и военного билета",
      "Занести ПЭК в журнал учёта",
      "Постановка на довольствие",
      "Инструктаж личного состава",
      "Первичная беседа",
      "Установить связь с родителями",
    ],
  },
  {
    title:       "Мобилизационная тренировка",
    category:    "МГ" as const,
    priority:    "high" as const,
    responsible: "КНР" as const,
    month: 7, dateFrom: 14, dateTo: 20,
    subtasks: [
      "Составить частный план мероприятий",
      "Рапорт на уточнение списков оповещения",
      "Уточнение документации ПУ",
    ],
  },

  // ── АВГУСТ ──────────────────────────────────────
  {
    title:       "МВТФ «Армия»",
    category:    "Н"  as const,
    priority:    "critical" as const,
    responsible: "КВ-2" as const,
    month: 8, dateFrom: 1, dateTo: 5,
    subtasks: ["Подготовка командировочных документов"],
  },
  {
    title:       "Подготовка к стрельбам (2 семестр)",
    category:    "БП" as const,
    priority:    "high" as const,
    responsible: "ЗКВ-2" as const,
    month: 8, dateFrom: 1, dateTo: 20,
    subtasks: [
      "7 выписок из приказа",
      "Изучение материальной части",
      "Заявка на оружие и б/п",
      "Расчет-обоснование",
      "Ведомости закрепления оружия",
    ],
  },
  {
    title:       "Торжественная церемония Присяги (авг/сент)",
    category:    "ВПР" as const,
    priority:    "critical" as const,
    responsible: "КНР" as const,
    month: 8, dateFrom: 25, dateTo: 25,
    subtasks: [] as string[],
  },

  // ── СЕНТЯБРЬ ────────────────────────────────────
  {
    title:       "Подготовка документов на увольнение",
    category:    "У"  as const,
    priority:    "critical" as const,
    responsible: "ЗКВ-1" as const,
    month: 9, dateFrom: 1, dateTo: 15,
    subtasks: [
      "Таблица очередности увольнения",
      "Маршруты следования",
      "Предписания",
      "Список допусков",
      "Инструктаж о неразглашении",
      "Грамоты, письма, фото",
    ],
  },

  // ── НОЯБРЬ ──────────────────────────────────────
  {
    title:       "Приказ об увольнении (последняя суббота)",
    category:    "У"  as const,
    priority:    "critical" as const,
    responsible: "КВ-1" as const,
    month: 11, dateFrom: 1, dateTo: 1,
    subtasks: [
      "Приказ на звания",
      "Сценарий торжественного увольнения",
      "Оформление ВПД",
      "Грамоты, письма, фотоальбом",
    ],
  },
  {
    title:       "Подготовка к круглому столу",
    category:    "НД" as const,
    priority:    "high" as const,
    responsible: "КВ-1" as const,
    month: 11, dateFrom: 10, dateTo: 10,
    subtasks: [
      "Информационное письмо",
      "Сбор материалов выступающих",
      "Рапорт на пропуск посетителей",
      "Подготовка помещений",
      "Чайная зона",
    ],
  },
  {
    title:       "Торжественное увольнение в запас",
    category:    "У"  as const,
    priority:    "critical" as const,
    responsible: "КВ-1" as const,
    month: 11, dateFrom: 30, dateTo: 30,
    subtasks: [] as string[],
  },

  // ── ДЕКАБРЬ ─────────────────────────────────────
  {
    title:       "Прием молодого пополнения (декабрь)",
    category:    "П"  as const,
    priority:    "critical" as const,
    responsible: "КНР" as const,
    month: 12, dateFrom: 1, dateTo: 15,
    subtasks: [
      "Медицинский осмотр",
      "Копии паспорта и военного билета",
      "Постановка на довольствие до 12:00",
    ],
  },
  {
    title:       "Организация 2 этапа ПМП",
    category:    "ПД" as const,
    priority:    "high" as const,
    responsible: "ПС" as const,
    month: 12, dateFrom: 15, dateTo: 30,
    subtasks: [
      "Барьерный медицинский осмотр",
      "Проф-психологическое тестирование",
      "КПЗ по БВС",
      "Профессиональные собеседования (16)",
      "Анкеты на оформление 3 формы допуска",
    ],
  },
  {
    title:       "Подготовка к инвентаризации",
    category:    "ПД" as const,
    priority:    "normal" as const,
    responsible: "КНР" as const,
    month: 12, dateFrom: 1, dateTo: 10,
    subtasks: ["Техника", "КЭС", "ЗГТ"],
  },
] satisfies Array<{
  title:       string;
  category:    "Н"|"А"|"БП"|"ПД"|"ВПР"|"У"|"П"|"ЗиТ"|"ЕМ"|"НД"|"МГ";
  priority:    "critical"|"high"|"normal";
  responsible: "КНР"|"КВ-1"|"КВ-2"|"ЗКВ-1"|"ЗКВ-2"|"ПС"|"СР";
  month:       number;
  dateFrom:    number;
  dateTo:      number;
  subtasks:    string[];
}>;

async function seed() {
  console.log("🌱 Заполнение БД...");

  try {
    const result = await db
      .insert(tasks)
      .values(SEED_TASKS)
      .onConflictDoNothing()
      .returning({ id: tasks.id });

    console.log(`✅ Добавлено ${result.length} задач из ${SEED_TASKS.length}`);
  } catch (error) {
    console.error("❌ Ошибка при вставке:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();