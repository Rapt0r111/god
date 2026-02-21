// lib/db/seed_full.ts
// ПОЛНЫЙ ГОДОВОЙ ПЛАН — Январь–Декабрь
// Запуск: bun --env-file=.env.local run lib/db/seed_full.ts
//
// Правила разбора PDF:
//  КВ-1,2  → две отдельные задачи (КВ-1 + КВ-2)
//  ЗКВ-1,2 → две отдельные задачи (ЗКВ-1 + ЗКВ-2)
//  КВ      → КВ-1 и КВ-2 (оба) — две задачи
//  КО-2    → КО-2 (значение: "КО-2" в поле responsible)
//  ПС      → все: КНР, КВ-1, КВ-2, ЗКВ-1, ЗКВ-2, СР, КО-2 — семь задач
//  КНР     → КНР
//  СР      → СР

import { db } from "./index";
import { tasks, subtasks } from "./schema";

type Category = "Н" | "А" | "БП" | "ПД" | "ВПР" | "У" | "П" | "ЗиТ" | "ЕМ" | "НД" | "МГ";
type Priority = "critical" | "high" | "normal";
type DbResponsible = "КНР" | "КВ-1" | "КВ-2" | "ЗКВ-1" | "ЗКВ-2" | "СР" | "КО-2";

// 2. Тип для исходных данных (может включать ПС для удобства генерации)
type InputResponsible = DbResponsible | "ПС";

interface SeedTask {
  title: string;
  category: Category;
  priority: Priority;
  responsible: InputResponsible; // Здесь может быть ПС
  month: number;
  dateFrom: number;
  dateTo: number;
  subtasks?: string[];
}

// Хелпер: ПС → задача для каждого из 7 ответственных
function ps(base: Omit<SeedTask, "responsible">): SeedTask[] {
  const responsibles: DbResponsible[] = ["КНР", "КВ-1", "КВ-2", "ЗКВ-1", "ЗКВ-2", "СР", "КО-2"];
  return responsibles.map(r => ({
    ...base,
    responsible: r as InputResponsible // Приводим к типу Input
  }));
}
// ─────────────────────────────────────────────────────────────────────────────
// ЯНВАРЬ (month = 1)
// ─────────────────────────────────────────────────────────────────────────────

const JANUARY: SeedTask[] = [
  // 10-15 А  КВ-2
  {
    title: "Отправить заявки на удостоверения в ГОМУ",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 10, dateTo: 15,
  },

  // 15-20 ПД  КВ-2
  {
    title: "Квартальная проверка ВНК ГУС за 4 квартал",
    category: "ПД", priority: "high", responsible: "КВ-2",
    month: 1, dateFrom: 15, dateTo: 20,
    subtasks: [
      "Проверить реализацию рекомендаций за 3 квартал",
      "Подготовить проект Акта",
      "Подготовить справку-доклад с полученными указаниями и рекомендациями по результатам проверки",
    ],
  },

  // 10-30 ПД  КВ-2
  {
    title: "Подготовка к итоговой проверке деятельности",
    category: "ПД", priority: "critical", responsible: "КВ-2",
    month: 1, dateFrom: 10, dateTo: 30,
    subtasks: [
      "Ознакомление с тг СС-ЗМОРФ через ВНК ГУС",
      "Отправка табличных сведений о деятельности научной роты",
      "Подготовка презентации для доклада",
      "Подготовка слайдов об офицерах и сотрудниках ВАС из числа операторов",
      "Подготовка сведений о трудоустройстве по операторам (4 призыва)",
      "Подготовка подписанных Соглашений",
      "Подготовка выписки из приказа о закреплении научных руководителей",
      "Подготовка удостоверений (аппроб.) ПО и рац. предложений, выписок о статьях",
      "Подготовка культурной программы для комиссии",
      "Подготовка приказа о закреплении научных руководителей",
      "Подготовка индивидуальных планов (старших и младших)",
      "Подготовка к демонстрации проектов роты (проект, презентация, доклад, плакат)",
      "Запросить у организаций инновационные экспонаты",
      "Предварительное заслушивание докладов на точках развёртывания",
      "Подготовить предложения на МВТФ «Армия»",
      "Провести проверку внутреннего порядка в роте",
      "Подготовить документы по учёту личного состава",
      "Подготовить личные документы операторов (ВБ, дипломы)",
      "Провести инвентаризацию документов в канцелярии",
      "Подготовить план мероприятий по агитации, заверенный у НВАС",
      "Подготовить план реализации рекомендаций предыдущей проверки",
    ],
  },

  // 10-15 Н  КНР
  {
    title: "Отправить перечень направлений подготовки (специальностей) и профили НИР в ГУС",
    category: "Н", priority: "normal", responsible: "КНР",
    month: 1, dateFrom: 10, dateTo: 15,
  },
  {
    title: "Подготовить заверенные профили НИР в соответствии с Положением",
    category: "Н", priority: "normal", responsible: "КНР",
    month: 1, dateFrom: 10, dateTo: 15,
  },

  // 10-20 БП  КВ-1, КВ-2
  {
    title: "Подготовка индивидуальных заданий и личных планов по ПДП на 2 семестр",
    category: "БП", priority: "normal", responsible: "КВ-1",
    month: 1, dateFrom: 10, dateTo: 20,
  },
  {
    title: "Подготовка индивидуальных заданий и личных планов по ПДП на 2 семестр",
    category: "БП", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 10, dateTo: 20,
  },

  // 10-15 Н  КВ (оба)
  {
    title: "Проведение собеседований с ННИЦ для распределения м/п",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 1, dateFrom: 10, dateTo: 15,
  },
  {
    title: "Проведение собеседований с ННИЦ для распределения м/п",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 10, dateTo: 15,
  },

  // 15-20 Н  КВ (оба)
  {
    title: "Проведение собеседований с сотрудниками НИЦ для закрепления м/п",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 1, dateFrom: 15, dateTo: 20,
  },
  {
    title: "Проведение собеседований с сотрудниками НИЦ для закрепления м/п",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 15, dateTo: 20,
  },

  // 10-20 Н  КВ-1
  {
    title: "Приказ о закреплении научных руководителей",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 1, dateFrom: 10, dateTo: 20,
  },
  {
    title: "Подготовка перечня направлений научной деятельности операторов для ГУС",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 1, dateFrom: 10, dateTo: 20,
  },

  // 10-20 БП  КВ-2
  {
    title: "Приказ на проведение Присяги",
    category: "БП", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 10, dateTo: 20,
  },

  // 10-25 БП  КВ-1, КВ-2
  {
    title: "Приказ на проведение стрельб",
    category: "БП", priority: "normal", responsible: "КВ-1",
    month: 1, dateFrom: 10, dateTo: 25,
  },
  {
    title: "Приказ на проведение стрельб",
    category: "БП", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 10, dateTo: 25,
  },

  // 10-27 БП  КВ-1, КВ-2
  {
    title: "Подготовка к стрельбам",
    category: "БП", priority: "high", responsible: "КВ-1",
    month: 1, dateFrom: 10, dateTo: 27,
    subtasks: [
      "Подготовить 7 выписок из приказа (123, 6, 5 каф., НР-2)",
      "Изучение материальной части",
      "Изучение требований безопасности",
      "Изучение упражнений и нормативов",
      "Практическая тренировка в выполнении нормативов",
      "Зачёт на допуск к практическим стрельбам",
      "Получить имущество по накладным согласно приказу",
    ],
  },
  {
    title: "Подготовка к стрельбам",
    category: "БП", priority: "high", responsible: "КВ-2",
    month: 1, dateFrom: 10, dateTo: 27,
    subtasks: [
      "Подготовить 7 выписок из приказа (123, 6, 5 каф., НР-2)",
      "Изучение материальной части",
      "Изучение требований безопасности",
      "Изучение упражнений и нормативов",
      "Практическая тренировка в выполнении нормативов",
      "Зачёт на допуск к практическим стрельбам",
      "Получить имущество по накладным согласно приказу",
    ],
  },

  // 20 МГ  КНР (мобилизационная тренировка — глава роты отвечает)
  {
    title: "Мобилизационная тренировка (январь)",
    category: "МГ", priority: "normal", responsible: "КНР",
    month: 1, dateFrom: 20, dateTo: 20,
  },

  // 20 ЕМ  КВ-2
  {
    title: "Сверка личных планов постоянного состава",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 20, dateTo: 20,
  },

  // 20  Мобилизационная неделя  КНР
  {
    title: "Мобилизационная неделя",
    category: "МГ", priority: "normal", responsible: "КНР",
    month: 1, dateFrom: 20, dateTo: 20,
    subtasks: [
      "Расписаться в ГрОМР",
      "Подготовить рапорт (сдать в ГрОМР в четверг)",
    ],
  },

  // 20  ЗКВ-2
  {
    title: "Сверка служебных карточек",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 1, dateFrom: 20, dateTo: 20,
  },
  {
    title: "Сверка листов бесед",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 1, dateFrom: 20, dateTo: 20,
  },

  // 20  КВ-2
  {
    title: "Уточнение плана публикаций на следующий месяц и проверка статей",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 20, dateTo: 20,
  },
  {
    title: "Подготовка ИРС",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 20, dateTo: 20,
  },

  // 20  КВ (оба)
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-1",
    month: 1, dateFrom: 20, dateTo: 20,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 20, dateTo: 20,
  },

  // 25  ЗКВ-1, ЗКВ-2
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-1",
    month: 1, dateFrom: 25, dateTo: 25,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // 25  КВ-2
  {
    title: "Уточнение тетрадей ПДП",
    category: "БП", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // 25  КВ-2, ЗКВ-2
  {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },
  {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "ЗКВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // 25  ЗКВ-2
  {
    title: "Дисциплинарная практика за месяц",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // 25  ПС → все
  ...ps({
    title: "Проведение подведения итогов роты за месяц",
    category: "ЕМ", priority: "normal",
    month: 1, dateFrom: 25, dateTo: 25,
  }),

  // 25  КВ-2, ЗКВ-2
  {
    title: "Подготовка материала для публикации новостей на сайте ВАС, МО РФ",
    category: "ВПР", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },
  {
    title: "Подготовка материала для публикации новостей на сайте ВАС, МО РФ",
    category: "ВПР", priority: "normal", responsible: "ЗКВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // 25  КВ-2
  {
    title: "Актуализация списка ВУЗов",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },
  {
    title: "Подготовка соглашений",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // 25  ЗКВ-1
  {
    title: "Сверка ПЭК, УПК, ВБ",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-1",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // 25  КНР
  {
    title: "Ежемесячная ведомость получения денежного довольствия",
    category: "ЕМ", priority: "normal", responsible: "КНР",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // 25  ЗКВ-2
  {
    title: "Утверждение графика ответственных",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // 20.01 Н  КВ-2
  {
    title: "Проведение занятия по требованиям руководящих документов, оформлению отчётов, научных статей и свидетельств о регистрации",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 20, dateTo: 20,
  },

  // 27.01 БП  КВ-1, КВ-2
  {
    title: "Организация стрельб (во взаимодействии с 10 каф.)",
    category: "БП", priority: "high", responsible: "КВ-1",
    month: 1, dateFrom: 27, dateTo: 27,
  },
  {
    title: "Организация стрельб (во взаимодействии с 10 каф.)",
    category: "БП", priority: "high", responsible: "КВ-2",
    month: 1, dateFrom: 27, dateTo: 27,
  },

  // 28-30 ВПР  КВ-2
  {
    title: "Подготовка к проведению Присяги",
    category: "ВПР", priority: "high", responsible: "КВ-2",
    month: 1, dateFrom: 28, dateTo: 30,
    subtasks: [
      "Выписка из приказа о проведении Присяги",
      "Сценарий",
      "Списки посетителей",
      "Списки и расписки для суточного увольнения",
      "Справки о прохождении службы",
      "Подготовка к встрече родителей (порядок, чай, презентация)",
      "Практическая подготовка МП",
      "Тренировка",
      "Генеральная репетиция",
    ],
  },

  // 31 ВПР  КНР
  {
    title: "Проведение торжественной церемонии приведения к Присяге (январь)",
    category: "ВПР", priority: "critical", responsible: "КНР",
    month: 1, dateFrom: 31, dateTo: 31,
  },

  // 31 ПД  СР, КВ-2
  {
    title: "Подготовка к передаче нарядов и ротных обязанностей между призывами",
    category: "ПД", priority: "normal", responsible: "СР",
    month: 1, dateFrom: 31, dateTo: 31,
    subtasks: [
      "Составление графика стажировок в наряде",
      "Актуализация и уточнение ротных обязанностей",
    ],
  },
  {
    title: "Подготовка к передаче нарядов и ротных обязанностей между призывами",
    category: "ПД", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 31, dateTo: 31,
    subtasks: [
      "Составление графика стажировок в наряде",
      "Актуализация и уточнение ротных обязанностей",
    ],
  },

  // 31 ЗиТ  КВ-2
  {
    title: "Выдача по учёту в журнале МНИ с составлением актов (USB, пропуска)",
    category: "ЗиТ", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 31, dateTo: 31,
    subtasks: ["USB-носители", "Электронные пропуска"],
  },

  // 31 ЗиТ  КВ-1
  {
    title: "Активация пропусков в ЦОИ",
    category: "ЗиТ", priority: "normal", responsible: "КВ-1",
    month: 1, dateFrom: 31, dateTo: 31,
  },

  // 31 Н  КВ-2
  {
    title: "Проведение беседы по трудоустройству",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 31, dateTo: 31,
  },

  // Еженедельные / постоянные  ЗКВ-2
  {
    title: "Еженедельный рапорт в ЗГТ",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 1, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Еженедельная проверка САВЗ (с записью в журнал)",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 1, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Еженедельный рапорт о ГДП",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 1, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Анализ электронной почты",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 1, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Ежемесячное доведение приказа № 85дсп",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 1, dateFrom: 1, dateTo: 31,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ФЕВРАЛЬ (month = 2)
// ─────────────────────────────────────────────────────────────────────────────

const FEBRUARY: SeedTask[] = [
  // 03-16 ПС → все
  ...ps({
    title: "Итоговая проверка деятельности МО РФ",
    category: "ПД", priority: "critical",
    month: 2, dateFrom: 3, dateTo: 16,
    subtasks: [
      "Мероприятия в соответствии с планом подготовки",
      "Мероприятия в соответствии с перечнем вопросов проверки",
      "Мероприятия в соответствии с планом реализации рекомендаций",
    ],
  }),

  // 1-15 Н  КВ-1
  {
    title: "Приказ на конкурс ГУС",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 2, dateFrom: 1, dateTo: 15,
  },

  // 01-20 А  КВ-2
  {
    title: "Подготовка командировочных документов на агитацию (февраль)",
    category: "А", priority: "high", responsible: "КВ-2",
    month: 2, dateFrom: 1, dateTo: 20,
    subtasks: [
      "Командировочные удостоверения",
      "Удостоверения на право ознакомления",
      "Проекты соглашений",
      "Перечень ВУЗов субъектов",
      "Письма в ВУЗы для взаимодействия",
      "Печать памяток и агитационных материалов (×200)",
      "Взаимодействие с УМО по ВПО ВАС",
    ],
  },

  // 15-30 Н  КВ-1
  {
    title: "Проведение 1 этапа конкурса ГУС",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 2, dateFrom: 15, dateTo: 28,
  },

  // КВ-1
  {
    title: "Назначение ответственного в состав комиссии по ЗГТ (по согласованию с НС ЗГТ)",
    category: "ПД", priority: "normal", responsible: "КВ-1",
    month: 2, dateFrom: 1, dateTo: 28,
  },

  // КНР (ответственный не указан в PDF → КНР)
  {
    title: "Подготовка к праздничным дням (февраль)",
    category: "ПД", priority: "normal", responsible: "КНР",
    month: 2, dateFrom: 1, dateTo: 20,
    subtasks: [
      "Осмотр помещений",
      "Рапорт о готовности",
      "График ответственных",
    ],
  },

  // 20.02 А  КНР, КВ-2
  {
    title: "Проведение инструктажа убывающих в командировку (агитация, февраль)",
    category: "А", priority: "high", responsible: "КНР",
    month: 2, dateFrom: 20, dateTo: 20,
    subtasks: [
      "Командировочное удостоверение",
      "Удостоверение ГОМУ",
      "Листы собеседования",
      "Соглашения о ПД",
      "Образец заявления",
      "Проект соглашения",
      "Перечень ВУЗов",
      "Таблица кандидатов",
      "Форма еженедельного доклада",
      "Брошюры НР ВАС",
      "Плакаты НР ВАС",
      "Визитки НР ВАС",
    ],
  },
  {
    title: "Проведение инструктажа убывающих в командировку (агитация, февраль)",
    category: "А", priority: "high", responsible: "КВ-2",
    month: 2, dateFrom: 20, dateTo: 20,
    subtasks: [
      "Командировочное удостоверение",
      "Удостоверение ГОМУ",
      "Листы собеседования",
      "Соглашения о ПД",
      "Образец заявления",
      "Проект соглашения",
      "Перечень ВУЗов",
      "Таблица кандидатов",
      "Форма еженедельного доклада",
      "Брошюры НР ВАС",
      "Плакаты НР ВАС",
      "Визитки НР ВАС",
    ],
  },

  // 25.02 А  КНР
  {
    title: "Убытие в командировку на агитацию и ВПО",
    category: "А", priority: "high", responsible: "КНР",
    month: 2, dateFrom: 25, dateTo: 25,
  },

  // ЕМ (февраль)
  {
    title: "Сверка личных планов постоянного состава",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title: "Сверка служебных карточек",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title: "Сверка листов бесед",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title: "Уточнение плана публикаций на следующий месяц и проверка статей",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title: "Подготовка ИРС",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-1",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-1",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "КНР",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title: "Дисциплинарная практика за месяц",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  ...ps({
    title: "Проведение подведения итогов роты за месяц",
    category: "ЕМ", priority: "normal",
    month: 2, dateFrom: 20, dateTo: 28,
  }),
  {
    title: "Подготовка материала для публикации новостей на сайте ВАС",
    category: "ВПР", priority: "normal", responsible: "КВ-1",
    month: 2, dateFrom: 20, dateTo: 28,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// МАРТ (month = 3)
// ─────────────────────────────────────────────────────────────────────────────

const MARCH: SeedTask[] = [
  // 25.02–25.03 А  КВ-2
  {
    title: "Еженедельный доклад в ГУС о результатах проведения агитации (по четвергам)",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 3, dateFrom: 1, dateTo: 25,
  },

  // А  КВ-2
  {
    title: "Формирование базы анкет кандидатов",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 3, dateFrom: 1, dateTo: 25,
    subtasks: [
      "Сбор сведений по результатам агитации",
      "Обработка писем на почте",
      "Обработка новых заявок",
      "Опрос кандидатов с предыдущего призыва",
      "Мониторинг Telegram",
    ],
  },

  // 20-25 А  КВ-2
  {
    title: "Личное ознакомление с анкетами кандидатов, проведение собеседования по телефону",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 3, dateFrom: 20, dateTo: 25,
  },

  // 25.03 А  КВ-2
  {
    title: "Формирование документов для ВНК и ДИМК",
    category: "А", priority: "high", responsible: "КВ-2",
    month: 3, dateFrom: 25, dateTo: 25,
    subtasks: [
      "Рейтинговый список",
      "Протокол",
      "Оценочная ведомость",
    ],
  },

  // 25-28 А  КВ-2
  {
    title: "Согласование документов и отправка в ВНК и ДИМК",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 3, dateFrom: 25, dateTo: 28,
  },

  // ЗиТ  КВ-1 (ответственный не указан явно → КВ-1 по аналогии с таблицей ответственных)
  {
    title: "Квартальная проверка в ЗГТ",
    category: "ЗиТ", priority: "normal", responsible: "КВ-1",
    month: 3, dateFrom: 1, dateTo: 31,
  },

  // 1-10 У  КВ-1
  {
    title: "Отправка плана увольнения в запас в ОМУ ЛВО",
    category: "У", priority: "normal", responsible: "КВ-1",
    month: 3, dateFrom: 1, dateTo: 10,
  },

  // 1-15 Н  КВ-1
  {
    title: "Проведение II этапа конкурса ГУС",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 3, dateFrom: 1, dateTo: 15,
  },

  // ЕМ (март)
  {
    title: "Сверка личных планов постоянного состава",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Мобилизационная неделя",
    category: "МГ", priority: "normal", responsible: "КНР",
    month: 3, dateFrom: 20, dateTo: 31,
    subtasks: [
      "Расписаться в ГрОМР",
      "Подготовить рапорт (сдать в ГрОМР в четверг)",
    ],
  },
  {
    title: "Сверка служебных карточек",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Сверка листов бесед",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Уточнение плана публикаций на следующий месяц и проверка статей",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Подготовка ИРС",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-1",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-1",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "КНР",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Дисциплинарная практика за месяц",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  ...ps({
    title: "Проведение подведения итогов роты за месяц",
    category: "ЕМ", priority: "normal",
    month: 3, dateFrom: 20, dateTo: 31,
  }),
  {
    title: "Подготовка материала для публикации новостей на сайте ВАС",
    category: "ВПР", priority: "normal", responsible: "КВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },

  // 28.02 ПД  ПС → все (передача обязанностей — общая для всех)
  ...ps({
    title: "Передача ротных обязанностей и нарядов младшему призыву",
    category: "ПД", priority: "normal",
    month: 3, dateFrom: 1, dateTo: 1,
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// АПРЕЛЬ (month = 4)
// ─────────────────────────────────────────────────────────────────────────────

const APRIL: SeedTask[] = [
  // 7-09 ПД  КНР
  {
    title: "Квартальная проверка ВНК ГУС за 1 квартал",
    category: "ПД", priority: "high", responsible: "КНР",
    month: 4, dateFrom: 7, dateTo: 9,
    subtasks: [
      "Проверить реализацию рекомендаций за 4 квартал",
      "Подготовить проект Акта",
      "Подготовить справку-доклад с полученными указаниями и рекомендациями по результатам проверки",
    ],
  },

  // КВ-1
  {
    title: "Участие в конкурсе НЦУО",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 4, dateFrom: 1, dateTo: 30,
  },

  // 15.04  КВ-2
  {
    title: "Публикация рейтингового списка первого этапа отбора",
    category: "П", priority: "normal", responsible: "КВ-2",
    month: 4, dateFrom: 15, dateTo: 15,
  },

  // ЕМ (апрель) — 20.04
  {
    title: "Сверка личных планов постоянного состава",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 4, dateFrom: 20, dateTo: 20,
  },
  {
    title: "Сверка служебных карточек",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 4, dateFrom: 20, dateTo: 20,
  },
  {
    title: "Сверка листов бесед",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 4, dateFrom: 20, dateTo: 20,
  },

  // 18.04  КВ-1
  {
    title: "Уточнение плана публикаций на следующий месяц и проверка статей",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Подготовка ИРС",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 4, dateFrom: 18, dateTo: 18,
  },

  // КВ-1, КВ-2
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-1",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 4, dateFrom: 18, dateTo: 18,
  },

  // ЗКВ-1, ЗКВ-2
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-1",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 4, dateFrom: 18, dateTo: 18,
  },

  // КНР
  {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "КНР",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Дисциплинарная практика за месяц",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 4, dateFrom: 18, dateTo: 18,
  },

  // ПС → все
  ...ps({
    title: "Проведение подведения итогов роты за месяц",
    category: "ЕМ", priority: "normal",
    month: 4, dateFrom: 18, dateTo: 18,
  }),

  // КВ-1
  {
    title: "Подготовка материала для публикации новостей на сайте ВАС",
    category: "ВПР", priority: "normal", responsible: "КВ-1",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Подведение итогов конкурса ГУС",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 4, dateFrom: 18, dateTo: 18,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// МАЙ (month = 5)
// ─────────────────────────────────────────────────────────────────────────────

const MAY: SeedTask[] = [
  // 1-5  КВ-1
  {
    title: "Планирование и организация майских праздников",
    category: "ПД", priority: "normal", responsible: "КВ-1",
    month: 5, dateFrom: 1, dateTo: 5,
    subtasks: [
      "Определение ответственности",
      "Организация увольнений",
      "Шашлыки (по призывно)",
    ],
  },

  // 1-15  КВ-1, ЗКВ-1
  {
    title: "Указания по МВТФ «Армия» — подготовка частного плана мероприятий",
    category: "НД", priority: "normal", responsible: "КВ-1",
    month: 5, dateFrom: 1, dateTo: 15,
  },
  {
    title: "Указания по МВТФ «Армия» — подготовка частного плана мероприятий",
    category: "НД", priority: "normal", responsible: "ЗКВ-1",
    month: 5, dateFrom: 1, dateTo: 15,
  },

  // ЕМ (май) — ответственные из аналогичных блоков
  {
    title: "Сверка личных планов постоянного состава",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 5, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Сверка служебных карточек",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 5, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Сверка листов бесед",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 5, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Уточнение плана публикаций на следующий месяц и проверка статей",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 5, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Подготовка ИРС",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 5, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-1",
    month: 5, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 5, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-1",
    month: 5, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 5, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "КНР",
    month: 5, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Дисциплинарная практика за месяц",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 5, dateFrom: 20, dateTo: 31,
  },
  ...ps({
    title: "Проведение подведения итогов роты за месяц",
    category: "ЕМ", priority: "normal",
    month: 5, dateFrom: 20, dateTo: 31,
  }),
  {
    title: "Подготовка материала для публикации новостей на сайте ВАС",
    category: "ВПР", priority: "normal", responsible: "КВ-1",
    month: 5, dateFrom: 25, dateTo: 25,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ИЮНЬ (month = 6)
// ─────────────────────────────────────────────────────────────────────────────

const JUNE: SeedTask[] = [
  // Квартальные проверки — КВ-1 (ЗГТ), КНР (моб. группа)
  {
    title: "Квартальная проверка в ЗГТ",
    category: "ЗиТ", priority: "normal", responsible: "КВ-1",
    month: 6, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Квартальная проверка в моб. группе",
    category: "МГ", priority: "normal", responsible: "КНР",
    month: 6, dateFrom: 1, dateTo: 30,
  },

  // Мероприятия по частному плану МВТФ «Армия»  КВ-1, ЗКВ-1
  {
    title: "Мероприятия по частному плану подготовки к МВТФ «Армия» (июнь)",
    category: "НД", priority: "normal", responsible: "КВ-1",
    month: 6, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Мероприятия по частному плану подготовки к МВТФ «Армия» (июнь)",
    category: "НД", priority: "normal", responsible: "ЗКВ-1",
    month: 6, dateFrom: 1, dateTo: 30,
  },

  // ЕМ (июнь)
  {
    title: "Сверка личных планов постоянного состава",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 6, dateFrom: 20, dateTo: 30,
  },
  {
    title: "Мобилизационная неделя",
    category: "МГ", priority: "normal", responsible: "КНР",
    month: 6, dateFrom: 20, dateTo: 30,
    subtasks: [
      "Расписаться в ГрОМР",
      "Подготовить рапорт (сдать в ГрОМР в четверг)",
    ],
  },
  {
    title: "Сверка служебных карточек",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 6, dateFrom: 20, dateTo: 30,
  },
  {
    title: "Сверка листов бесед",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 6, dateFrom: 20, dateTo: 30,
  },
  {
    title: "Уточнение плана публикаций на следующий месяц и проверка статей",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 6, dateFrom: 20, dateTo: 30,
  },
  {
    title: "Подготовка ИРС",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 6, dateFrom: 20, dateTo: 30,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-1",
    month: 6, dateFrom: 20, dateTo: 30,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 6, dateFrom: 20, dateTo: 30,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-1",
    month: 6, dateFrom: 20, dateTo: 30,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 6, dateFrom: 20, dateTo: 30,
  },
  {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "КНР",
    month: 6, dateFrom: 20, dateTo: 30,
  },
  {
    title: "Дисциплинарная практика за месяц",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 6, dateFrom: 20, dateTo: 30,
  },
  ...ps({
    title: "Проведение подведения итогов роты за месяц",
    category: "ЕМ", priority: "normal",
    month: 6, dateFrom: 20, dateTo: 30,
  }),
  {
    title: "Подготовка материала для публикации новостей на сайте ВАС",
    category: "ВПР", priority: "normal", responsible: "КВ-2",
    month: 6, dateFrom: 20, dateTo: 30,
  },

  // 25-30 ЗиТ  ЗКВ-2
  {
    title: "Сдача по учёту в журнале МНИ с составлением актов (ПЭВМ, USB, пропуска) — июнь",
    category: "ЗиТ", priority: "normal", responsible: "ЗКВ-2",
    month: 6, dateFrom: 25, dateTo: 30,
    subtasks: [
      "ПЭВМ (в комплекте: сумка, мышь, ЗУ)",
      "USB-носители",
      "Электронные пропуска",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ИЮЛЬ (month = 7)
// ─────────────────────────────────────────────────────────────────────────────

const JULY: SeedTask[] = [
  // 07-09 ПД  (квартальная проверка ВНК ГУС за 2 квартал) — ответственный в PDF не указан → КНР
  {
    title: "Квартальная проверка ВНК ГУС за 2 квартал",
    category: "ПД", priority: "high", responsible: "КНР",
    month: 7, dateFrom: 7, dateTo: 9,
    subtasks: [
      "Проверить реализацию рекомендаций за 1 квартал",
      "Подготовить проект Акта",
      "Подготовить справку-доклад с полученными указаниями и рекомендациями по результатам проверки",
    ],
  },

  // МВТФ  КВ-1 (Н)
  {
    title: "Мероприятия по частному плану подготовки к МВТФ «Армия» (июль)",
    category: "НД", priority: "normal", responsible: "КВ-1",
    month: 7, dateFrom: 1, dateTo: 31,
  },

  // 01-10 У  КВ-1
  {
    title: "Снять с довольствия увольняемых в запас (июль)",
    category: "У", priority: "high", responsible: "КВ-1",
    month: 7, dateFrom: 1, dateTo: 10,
    subtasks: [
      "Сдать рапорта и выписки в СО",
      "Сдать 3 выписки об исключении (в ФЭС, прод. службу и в дело)",
    ],
  },

  // ЗиТ  ЗКВ-2
  {
    title: "Сдача по учёту в журнале МНИ с составлением актов (ПЭВМ, USB, пропуска) — июль",
    category: "ЗиТ", priority: "normal", responsible: "ЗКВ-2",
    month: 7, dateFrom: 1, dateTo: 31,
    subtasks: [
      "ПЭВМ (в комплекте: сумка, мышь, ЗУ)",
      "USB-носители",
      "Электронные пропуска",
    ],
  },

  // Приём молодого пополнения  КНР (общая ответственность)
  {
    title: "Приём молодого пополнения (июль)",
    category: "П", priority: "critical", responsible: "КНР",
    month: 7, dateFrom: 1, dateTo: 31,
    subtasks: [
      "Рапорт на автомобильный транспорт",
      "Фотографирование воинской команды",
      "Медицинский осмотр",
      "Сделать копии паспорта и военного билета",
      "Собрать и подготовить военные билеты и паспорта (бирки, жетоны)",
      "Собрать ВУ, загран. паспорта, дипломы (копии), ПЭК, УПК, карты МО, карты ПО, именные списки, маршрутные листы, акты проверки воинских команд, билеты",
      "Занести ПЭК в журнал учёта",
      "Подготовить рапорт на сдачу документов",
      "Проверить вещевое имущество (раздаточная ведомость, вещевой аттестат, акт приёма)",
      "Проверить наличие банковских карт у прибывших",
      "Заполнить заявления для Алушты и сдать в отдел кадров",
      "Сдать в строевой отдел рапорт на все виды довольствия, копии УПК и ВБ",
      "Сдать в продовольственную службу 2 рапорта на котловое довольствие и продовольственные аттестаты",
      "Подготовить 4 выписки о включении в ВАС (ОК, прод.сл., вещ.сл., в дело)",
      "Определить место хранения личных вещей и спальные места",
      "Выдать постельное бельё",
      "Провести инструктаж",
      "Организовать питание и помывку",
      "Спланировать мероприятия (эссе, анкеты, ОВУ)",
      "Провести первичную беседу с заполнением сведений для углублённого собеседования",
      "Установить связь с родителями (создать родительский чат)",
      "Составить рапорт о назначении на должность",
      "Сделать и заверить записи о включении в списки ВАС и должности",
      "Получить в лазарете профилактические лекарства",
    ],
  },

  // ПМП  ЗКВ-2
  {
    title: "Назначить дату барьерного осмотра",
    category: "ПД", priority: "normal", responsible: "ЗКВ-2",
    month: 7, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Начать дезинфекцию помещений (июль)",
    category: "ПД", priority: "normal", responsible: "ЗКВ-2",
    month: 7, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Отправить 2-е экз. именных списков в ВК субъектов (июль)",
    category: "П", priority: "normal", responsible: "ЗКВ-2",
    month: 7, dateFrom: 1, dateTo: 31,
  },

  // Доклад в ГУС и ГОМУ о результатах набора  КНР
  {
    title: "Подготовить доклад в ГУС и ГОМУ о результатах набора МП (июль)",
    category: "П", priority: "high", responsible: "КНР",
    month: 7, dateFrom: 1, dateTo: 31,
    subtasks: [
      "Телеграмма в ГОМУ",
      "Данные в ГОМУ",
      "Данные для ВНК ГУС",
      "Письмо-доклад для НГУС",
    ],
  },

  // УЛС  КВ-2
  {
    title: "Внести данные по увольнению и призыву в документацию УЛС (июль)",
    category: "У", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 1, dateTo: 31,
    subtasks: [
      "Книга алфавитного учёта",
      "Книга УЛС (Форма № 1)",
      "Именные списки взводов (Форма №1-а)",
      "Книга ШДУ (Форма № 4)",
      "ШДК",
      "ШДС",
    ],
  },

  // Донесение  КВ-1
  {
    title: "Донесение 47 ОМУ о составе численности л/с (июль)",
    category: "ПД", priority: "normal", responsible: "КВ-1",
    month: 7, dateFrom: 1, dateTo: 31,
  },

  // Организация 2 этапа ПМП  КНР
  {
    title: "Организация 2 этапа ПМП (июль)",
    category: "ПД", priority: "high", responsible: "КНР",
    month: 7, dateFrom: 1, dateTo: 31,
    subtasks: [
      "Провести барьерный медицинский осмотр",
      "Провести проф-псих тестирование",
      "Провести КПЗ по БВС во взаимодействии с 4 кафедрой",
      "Спланировать изоляцию (на решение командира роты)",
      "Подготовить расписание",
      "Подготовить материалы занятий",
      "Подготовить доклады и презентации по науке старших",
      "Провести проф. собеседования (16)",
      "Предварительное распределение научных руководителей и направлений",
      "Разработка Боевого листа на призыв",
      "Подготовить ведомость допуска в бассейн",
      "Фотографирование личного состава",
      "Подготовка анкет на оформление 3 формы допуска",
      "Подготовка подписок о неразглашении",
      "Подать рапорт о назначении на должности",
      "Подать данные приказов об назначении в ДП ЗГТ",
      "Заполнить электронную книгу алфавитного учёта",
      "Оформить служебные карточки",
      "Согласовать выдачу банковских карт",
    ],
  },

  // Рассылка в ВУЗы  КВ-1
  {
    title: "Рассылка в ВУЗы (89 субъектов) — июль",
    category: "А", priority: "normal", responsible: "КВ-1",
    month: 7, dateFrom: 1, dateTo: 31,
  },

  // 1-15 А  КВ-2
  {
    title: "Подготовить приказ на агитацию НР",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 1, dateTo: 15,
  },
  {
    title: "Подготовить план мероприятий по агитации, заверенный у НВАС",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 1, dateTo: 15,
  },
  {
    title: "Подготовить и направить в ДиД предложения в состав комиссии в ТП ЭРА",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 1, dateTo: 15,
  },
  {
    title: "Отправить заявку на выдачу удостоверений в ГУС (pdf, doc)",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 1, dateTo: 15,
  },
  {
    title: "Отправить план отбора в ГУС (pdf, doc)",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 1, dateTo: 15,
  },

  // 1-15 ВПР  КВ-1
  {
    title: "Приказ на присягу прикомандированных",
    category: "ВПР", priority: "normal", responsible: "КВ-1",
    month: 7, dateFrom: 1, dateTo: 15,
  },

  // 14-20 МГ  КНР
  {
    title: "Мобилизационная тренировка (июль)",
    category: "МГ", priority: "normal", responsible: "КНР",
    month: 7, dateFrom: 14, dateTo: 20,
    subtasks: [
      "Составить частный план мероприятий",
      "Рапорт на уточнение списков оповещения",
      "Уточнение документации ПУ",
      "Смена суточного наряда",
    ],
  },

  // 1-31 БП  КВ-1, КВ-2
  {
    title: "Подготовка индивидуальных заданий и личных планов по ПДП на 2 семестр (июль)",
    category: "БП", priority: "normal", responsible: "КВ-1",
    month: 7, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Подготовка индивидуальных заданий и личных планов по ПДП на 2 семестр (июль)",
    category: "БП", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 1, dateTo: 31,
  },

  // ЕМ (июль) — стандартный блок
  {
    title: "Сверка личных планов постоянного состава",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Мобилизационная неделя",
    category: "МГ", priority: "normal", responsible: "КНР",
    month: 7, dateFrom: 20, dateTo: 31,
    subtasks: [
      "Расписаться в ГрОМР",
      "Подготовить рапорт (сдать в ГрОМР в четверг)",
    ],
  },
  {
    title: "Сверка служебных карточек",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 7, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Сверка листов бесед",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 7, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Уточнение плана публикаций на следующий месяц и проверка статей",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Подготовка ИРС",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-1",
    month: 7, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-1",
    month: 7, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 7, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Дисциплинарная практика за месяц",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 7, dateFrom: 20, dateTo: 31,
  },
  ...ps({
    title: "Проведение подведения итогов роты за месяц",
    category: "ЕМ", priority: "normal",
    month: 7, dateFrom: 20, dateTo: 31,
  }),
  {
    title: "Подготовка материала для публикации новостей на сайте ВАС",
    category: "ВПР", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Ежемесячное доведение приказа № 85дсп",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 7, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Еженедельный рапорт в ЗГТ",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 7, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Еженедельная проверка САВЗ (с записью в журнал)",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 7, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Еженедельный рапорт о ГДП",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 7, dateFrom: 1, dateTo: 31,
  },

  // Приказ по ОВП  КВ-1
  {
    title: "Подготовить приказ о проведении общевойсковой подготовки",
    category: "БП", priority: "normal", responsible: "КВ-1",
    month: 7, dateFrom: 1, dateTo: 31,
  },

  // 20.07 БП  ЗКВ-2
  {
    title: "Подготовка к проведению ОВП на 6 в/г",
    category: "БП", priority: "high", responsible: "ЗКВ-2",
    month: 7, dateFrom: 20, dateTo: 20,
    subtasks: [
      "Расписание",
      "Оружие",
      "Размещение",
      "Экипировка",
    ],
  },

  // Н  КВ (оба) — собеседования
  {
    title: "Проведение собеседований с ННИЦ для распределения м/п (июль)",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 7, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Проведение собеседований с ННИЦ для распределения м/п (июль)",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Проведение собеседований с сотрудниками НИЦ для закрепления м/п (июль)",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 7, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Проведение собеседований с сотрудниками НИЦ для закрепления м/п (июль)",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 7, dateFrom: 1, dateTo: 31,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// АВГУСТ (month = 8)
// ─────────────────────────────────────────────────────────────────────────────

const AUGUST: SeedTask[] = [
  // 1-5 Н  МВТФ «Армия»  КВ-2
  {
    title: "МВТФ «Армия» — подготовка командировочных документов",
    category: "Н", priority: "high", responsible: "КВ-2",
    month: 8, dateFrom: 1, dateTo: 5,
  },

  // 1-30 БП  общевойсковая подготовка  ЗКВ-2
  {
    title: "Мероприятия по плану общевойсковой подготовки (август)",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 8, dateFrom: 1, dateTo: 30,
  },

  // 1-20 Н  КВ-2
  {
    title: "Приказ о закреплении научных руководителей (август)",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 8, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Подготовка перечня направлений научной деятельности операторов для ГУС (.doc)",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 8, dateFrom: 1, dateTo: 20,
  },

  // 1-10 ПД  КВ-2
  {
    title: "Подготовка индивидуальных заданий и личных планов по ПДП на 1 семестр",
    category: "БП", priority: "normal", responsible: "КВ-2",
    month: 8, dateFrom: 1, dateTo: 10,
  },

  // 1-10 БП  ЗКВ-2
  {
    title: "Приказ на проведение стрельб (август)",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 8, dateFrom: 1, dateTo: 10,
  },

  // 1-20 БП  ЗКВ-2
  {
    title: "Подготовка к стрельбам (август)",
    category: "БП", priority: "high", responsible: "ЗКВ-2",
    month: 8, dateFrom: 1, dateTo: 20,
    subtasks: [
      "Подготовить 7 выписок из приказа (123, 6, 5 каф., НР-2)",
      "Изучение материальной части",
      "Изучение требований безопасности",
      "Изучение упражнений и нормативов",
      "Практическая тренировка в выполнении нормативов",
      "Зачёт на допуск к практическим стрельбам",
      "Получить имущество по накладным согласно приказу",
      "Заявка на оружие и б/п (по рапорту)",
      "Расчёт-обоснование",
      "Ведомости закрепления (передачи) оружия",
      "Предписание",
      "Транспорт",
      "Приём пищи",
    ],
  },

  // 20 БП  ЗКВ-2
  {
    title: "Организация стрельб (август, во взаимодействии с 10 каф.)",
    category: "БП", priority: "high", responsible: "ЗКВ-2",
    month: 8, dateFrom: 20, dateTo: 20,
    subtasks: [
      "Оружие, магазины, подсумки",
      "Учебные ПМ и учебные б/п (ПМ, АК)",
      "Ком. ящик (КЯ-83)",
      "Станок прицельный (ПС-51)",
      "Шлема, бронежилеты",
      "Ящик для б/п с замком и печатью",
      "Ведомости ТБ",
      "Форма 9а (раздатка), форма 4/арт",
      "Ведомость допуска л/с к стрельбам с АК и ПМ",
      "Ведомости учёта результатов стрельб",
      "Ведомости сдачи нормативов (1,2,13,14,16)",
      "Маркеры, степлер со скобами",
      "Повязки, флажки, манишки (2 комплекта)",
      "Секундомеры, противогазы, ремни, планшеты",
      "Таблички (1,2,13,14,16)",
      "Плащ-палатки",
      "Учебно-тренировочная карта и план-конспекты (1,2,13,14,16)",
      "Наблюдатели",
    ],
  },

  // 20 БП  ЗКВ-2
  {
    title: "Занятия по метанию гранаты (БХ танков, упражнение 6, 7)",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 8, dateFrom: 20, dateTo: 20,
  },

  // 25-28 Н  КВ-1
  {
    title: "Направить в ГУС перечень направлений научных исследований на молодое пополнение",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 8, dateFrom: 25, dateTo: 28,
  },

  // 1-20 Н  КВ-1
  {
    title: "Рассылка в ВУЗы (89 субъектов) — август",
    category: "А", priority: "normal", responsible: "КВ-1",
    month: 8, dateFrom: 1, dateTo: 20,
  },

  // 1-20 А  КНР
  {
    title: "Подготовка командировочных документов на агитацию (август)",
    category: "А", priority: "high", responsible: "КНР",
    month: 8, dateFrom: 1, dateTo: 20,
    subtasks: [
      "Командировочные удостоверения (рапорта согласовать с НФЭС)",
      "Удостоверения на право ознакомления",
      "Проекты соглашений",
      "Перечень ВУЗов субъектов",
      "Письма в ВУЗы для взаимодействия",
      "Печать памяток и агитационных материалов (×200) по рапорту",
      "Взаимодействие с УМО по ВПО ВАС",
    ],
  },

  // 20 А  КНР, КВ-2
  {
    title: "Проведение инструктажа убывающих в командировку (агитация, август)",
    category: "А", priority: "high", responsible: "КНР",
    month: 8, dateFrom: 20, dateTo: 20,
    subtasks: [
      "Командировочное удостоверение",
      "Удостоверение ГОМУ",
      "Листы собеседования",
      "Соглашения о ПД",
      "Образец заявления",
      "Проект соглашения",
      "Перечень ВУЗов",
      "Таблица кандидатов",
      "Форма еженедельного доклада",
      "Брошюры НР ВАС",
      "Плакаты НР ВАС",
      "Визитки НР ВАС",
    ],
  },
  {
    title: "Проведение инструктажа убывающих в командировку (агитация, август)",
    category: "А", priority: "high", responsible: "КВ-2",
    month: 8, dateFrom: 20, dateTo: 20,
    subtasks: [
      "Командировочное удостоверение",
      "Удостоверение ГОМУ",
      "Листы собеседования",
      "Соглашения о ПД",
      "Образец заявления",
      "Проект соглашения",
      "Перечень ВУЗов",
      "Таблица кандидатов",
      "Форма еженедельного доклада",
      "Брошюры НР ВАС",
      "Плакаты НР ВАС",
      "Визитки НР ВАС",
    ],
  },

  // 20 А  КНР
  {
    title: "Убытие в командировку на агитацию и ВПО (август)",
    category: "А", priority: "high", responsible: "КНР",
    month: 8, dateFrom: 20, dateTo: 20,
  },

  // 20-31 А  КНР
  {
    title: "Еженедельный доклад в ГУС о результатах проведения агитации (август)",
    category: "А", priority: "normal", responsible: "КНР",
    month: 8, dateFrom: 20, dateTo: 31,
  },

  // ЕМ (август)
  {
    title: "Сверка личных планов постоянного состава",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 8, dateFrom: 20, dateTo: 20,
  },
  {
    title: "Мобилизационная неделя",
    category: "МГ", priority: "normal", responsible: "КНР",
    month: 8, dateFrom: 20, dateTo: 31,
    subtasks: [
      "Расписаться в ГрОМР",
      "Подготовить рапорт (сдать в ГрОМР в четверг)",
    ],
  },
  {
    title: "Сверка служебных карточек",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 8, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Сверка листов бесед",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 8, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Уточнение плана публикаций на следующий месяц и проверка статей",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 8, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Подготовка ИРС",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 8, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-1",
    month: 8, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 8, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-1",
    month: 8, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 8, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "КВ-2",
    month: 8, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Дисциплинарная практика за месяц",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 8, dateFrom: 20, dateTo: 31,
  },
  ...ps({
    title: "Проведение подведения итогов роты за месяц",
    category: "ЕМ", priority: "normal",
    month: 8, dateFrom: 20, dateTo: 31,
  }),
  {
    title: "Подготовка материала для публикации новостей на сайте ВАС",
    category: "ВПР", priority: "normal", responsible: "ЗКВ-2",
    month: 8, dateFrom: 20, dateTo: 31,
  },
  {
    title: "Ежемесячное доведение приказа № 85дсп",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 8, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Еженедельный рапорт в ЗГТ",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 8, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Еженедельная проверка САВЗ (с записью в журнал)",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 8, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Еженедельный рапорт о ГДП",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 8, dateFrom: 1, dateTo: 31,
  },

  // 1-31 ПД  ПС → все
  ...ps({
    title: "Подготовка к передаче нарядов и ротных обязанностей между призывами (август)",
    category: "ПД", priority: "normal",
    month: 8, dateFrom: 1, dateTo: 31,
    subtasks: [
      "Составление графика стажировок в наряде",
      "Актуализация и уточнение ротных обязанностей",
    ],
  }),

  // 1-30 ЗиТ  ЗКВ-2
  {
    title: "Активация пропусков в ЦОИ (август)",
    category: "ЗиТ", priority: "normal", responsible: "ЗКВ-2",
    month: 8, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Выдача по учёту в журнале МНИ с составлением актов (ПЭВМ, USB, пропуска) — август",
    category: "ЗиТ", priority: "normal", responsible: "ЗКВ-2",
    month: 8, dateFrom: 1, dateTo: 30,
    subtasks: [
      "ПЭВМ (в комплекте: сумка, мышь, ЗУ)",
      "USB-носители",
      "Электронные пропуска",
    ],
  },

  // 1-20 ВПР  ЗКВ-2, ЗКВ-1
  {
    title: "Подготовка к проведению Присяги (август)",
    category: "ВПР", priority: "high", responsible: "ЗКВ-2",
    month: 8, dateFrom: 1, dateTo: 20,
    subtasks: [
      "Выписка из приказа о проведении Присяги",
      "Рапорт на получение оружия на тренировки и церемонию",
      "Сценарий",
      "Списки посетителей",
      "Списки и расписки для суточного увольнения",
      "Справки о прохождении службы",
      "Подготовка к встрече родителей (порядок, чай, презентация)",
      "Практическая подготовка МП",
      "Тренировка",
      "Генеральная репетиция",
    ],
  },
  {
    title: "Подготовка к проведению Присяги (август)",
    category: "ВПР", priority: "high", responsible: "ЗКВ-1",
    month: 8, dateFrom: 1, dateTo: 20,
    subtasks: [
      "Выписка из приказа о проведении Присяги",
      "Рапорт на получение оружия на тренировки и церемонию",
      "Сценарий",
      "Списки посетителей",
      "Списки и расписки для суточного увольнения",
      "Справки о прохождении службы",
      "Подготовка к встрече родителей (порядок, чай, презентация)",
      "Практическая подготовка МП",
      "Тренировка",
      "Генеральная репетиция",
    ],
  },

  // 25-5 ВПР  КНР
  {
    title: "Проведение торжественной церемонии приведения к Присяге (август/сентябрь)",
    category: "ВПР", priority: "critical", responsible: "КНР",
    month: 8, dateFrom: 25, dateTo: 31,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// СЕНТЯБРЬ (month = 9)
// ─────────────────────────────────────────────────────────────────────────────

const SEPTEMBER: SeedTask[] = [
  // 1-30 ЗиТ  КВ-1
  {
    title: "Квартальная проверка ЗГТ (сентябрь)",
    category: "ЗиТ", priority: "normal", responsible: "КВ-1",
    month: 9, dateFrom: 1, dateTo: 30,
  },

  // 1-30 МГ  КНР
  {
    title: "Квартальная проверка в моб. группе (сентябрь)",
    category: "МГ", priority: "normal", responsible: "КНР",
    month: 9, dateFrom: 1, dateTo: 30,
  },

  // 1-25 А  КНР
  {
    title: "Еженедельный доклад в ГУС о результатах проведения агитации (сентябрь)",
    category: "А", priority: "normal", responsible: "КНР",
    month: 9, dateFrom: 1, dateTo: 25,
  },
  {
    title: "Формирование базы анкет кандидатов (сентябрь)",
    category: "А", priority: "normal", responsible: "КНР",
    month: 9, dateFrom: 1, dateTo: 25,
    subtasks: [
      "Сбор сведений по результатам агитации",
      "Обработка писем на почте",
      "Обработка новых заявок",
      "Опрос кандидатов с предыдущего призыва",
      "Мониторинг Telegram",
      "Ежедневная публикация новостей (в соответствии с Планом публикации канала)",
    ],
  },

  // А  КНР
  {
    title: "Личное ознакомление с анкетами кандидатов, собеседование по телефону (сентябрь)",
    category: "А", priority: "normal", responsible: "КНР",
    month: 9, dateFrom: 1, dateTo: 25,
  },

  // 20-25 А  КНР
  {
    title: "Формирование документов для ВНК и ДИМК (сентябрь)",
    category: "А", priority: "high", responsible: "КНР",
    month: 9, dateFrom: 20, dateTo: 25,
    subtasks: [
      "Рейтинговый список",
      "Протокол",
      "Оценочная ведомость",
    ],
  },

  // 25-28 А  КНР
  {
    title: "Согласование документов и отправка в ВНК и ДИМК (сентябрь)",
    category: "А", priority: "normal", responsible: "КНР",
    month: 9, dateFrom: 25, dateTo: 28,
  },

  // 1-30 ПД  ПС → все
  ...ps({
    title: "Передача ротных обязанностей и нарядов младшему призыву (сентябрь)",
    category: "ПД", priority: "normal",
    month: 9, dateFrom: 1, dateTo: 30,
  }),

  // 1-15 У  ЗКВ-1
  {
    title: "Отправка плана увольнения в запас в ОМУ ЛВО (сентябрь)",
    category: "У", priority: "normal", responsible: "ЗКВ-1",
    month: 9, dateFrom: 1, dateTo: 15,
  },
  {
    title: "Подготовка документов на увольнение (сентябрь)",
    category: "У", priority: "high", responsible: "ЗКВ-1",
    month: 9, dateFrom: 1, dateTo: 30,
    subtasks: [
      "Таблица очерёдности увольнения",
      "Маршруты следования",
      "Предписания",
      "Список допусков",
      "Инструктаж о неразглашении в ЗГТ",
      "Заключения в ЗГ",
      "Список с приказами об исключении в ДП ЗГТ",
      "Таблица очерёдности увольнения в СО",
      "Рапорта на исключение из ВАС в СО",
      "Рапорта на снятие с довольствия в СО",
      "Выписки из приказа в СО",
      "Ведомость выдачи ВПД с маршрутами",
      "Ведомость инструктажа л/с",
      "Журнал инструктажа л/с",
      "Журнал выдачи ПЭК",
      "Записи в ВБ, УПК",
      "Согласовать виды транспорта в отделе ВПД",
      "Рапорт на ВПД с таблицей увольнения",
      "Справки о прохождении службы",
      "Фото, грамоты, письма",
      "Дембельский альбом",
      "Таблица трудоустройства",
    ],
  },

  // 1-10 Н  КВ-2
  {
    title: "Проведение занятия по требованиям РД, оформлению отчётов, научных статей и свидетельств о регистрации (сентябрь)",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 9, dateFrom: 1, dateTo: 10,
  },

  // 1-30 Н  КНР
  {
    title: "Проведение беседы по трудоустройству (сентябрь)",
    category: "Н", priority: "normal", responsible: "КНР",
    month: 9, dateFrom: 1, dateTo: 30,
  },

  // ЕМ (сентябрь)
  {
    title: "Сверка личных планов постоянного состава",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 9, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Мобилизационная неделя",
    category: "МГ", priority: "normal", responsible: "КНР",
    month: 9, dateFrom: 1, dateTo: 20,
    subtasks: [
      "Расписаться в ГрОМР",
      "Подготовить рапорт (сдать в ГрОМР в четверг)",
    ],
  },
  {
    title: "Сверка служебных карточек",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 9, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Сверка листов бесед",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 9, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Уточнение плана публикаций на следующий месяц и проверка статей",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 9, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Подготовка ИРС",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 9, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-1",
    month: 9, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 9, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-1",
    month: 9, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 9, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "КВ-2",
    month: 9, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Дисциплинарная практика за месяц",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 9, dateFrom: 1, dateTo: 20,
  },
  ...ps({
    title: "Проведение подведения итогов роты за месяц",
    category: "ЕМ", priority: "normal",
    month: 9, dateFrom: 1, dateTo: 20,
  }),
  {
    title: "Подготовка материала для публикации новостей на сайте ВАС",
    category: "ВПР", priority: "normal", responsible: "КВ-2",
    month: 9, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Ежемесячное доведение приказа № 85дсп",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 9, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Еженедельный рапорт в ЗГТ",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 9, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Еженедельная проверка САВЗ (с записью в журнал)",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 9, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Еженедельный рапорт о ГДП",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 9, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Анализ электронной почты",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 9, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Актуализация списка ВУЗов",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 9, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Подготовка соглашений",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 9, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Сверка ПЭК, УПК, ВБ",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-1",
    month: 9, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Ежемесячная ведомость получения денежного довольствия",
    category: "ЕМ", priority: "normal", responsible: "КНР",
    month: 9, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Утверждение графика ответственных",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 9, dateFrom: 1, dateTo: 30,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ОКТЯБРЬ (month = 10)
// ─────────────────────────────────────────────────────────────────────────────

const OCTOBER: SeedTask[] = [
  // 06-08 ПД  (квартальная проверка ВНК ГУС за 3 квартал) — ответственный явно не указан → КНР
  {
    title: "Квартальная проверка ВНК ГУС за 3 квартал",
    category: "ПД", priority: "high", responsible: "КНР",
    month: 10, dateFrom: 6, dateTo: 8,
    subtasks: [
      "Проверить реализацию рекомендаций за 2 квартал",
      "Подготовить проект Акта",
      "Подготовить справку-доклад с полученными указаниями и рекомендациями по результатам проверки",
    ],
  },

  // 1-25 П  ЗКВ-1
  {
    title: "Отправка писем в ВК на кандидатов 1 этапа",
    category: "П", priority: "normal", responsible: "ЗКВ-1",
    month: 10, dateFrom: 1, dateTo: 25,
  },

  // ЕМ (октябрь)
  {
    title: "Сверка личных планов постоянного состава",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 10, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Мобилизационная неделя",
    category: "МГ", priority: "normal", responsible: "КНР",
    month: 10, dateFrom: 1, dateTo: 20,
    subtasks: [
      "Расписаться в ГрОМР",
      "Подготовить рапорт (сдать в ГрОМР в четверг)",
    ],
  },
  {
    title: "Сверка служебных карточек",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 10, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Сверка листов бесед",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 10, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Уточнение плана публикаций на следующий месяц и проверка статей",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 10, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Подготовка ИРС",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 10, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-1",
    month: 10, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 10, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-1",
    month: 10, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 10, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Уточнение тетрадей ПДП",
    category: "БП", priority: "normal", responsible: "КВ-2",
    month: 10, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "КВ-2",
    month: 10, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "ЗКВ-2",
    month: 10, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Дисциплинарная практика за месяц",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 10, dateFrom: 1, dateTo: 20,
  },
  ...ps({
    title: "Проведение подведения итогов роты за месяц",
    category: "ЕМ", priority: "normal",
    month: 10, dateFrom: 1, dateTo: 20,
  }),
  {
    title: "Подготовка материала для публикации новостей на сайте ВАС, МО РФ",
    category: "ВПР", priority: "normal", responsible: "КВ-2",
    month: 10, dateFrom: 1, dateTo: 20,
  },
  {
    title: "Ежемесячное доведение приказа № 85дсп",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 10, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Еженедельный рапорт в ЗГТ",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 10, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Еженедельная проверка САВЗ (с записью в журнал)",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 10, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Еженедельный рапорт о ГДП",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 10, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Анализ электронной почты",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 10, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Актуализация списка ВУЗов",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 10, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Подготовка соглашений",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 10, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Сверка ПЭК, УПК, ВБ",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-1",
    month: 10, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Ежемесячная ведомость получения денежного довольствия",
    category: "ЕМ", priority: "normal", responsible: "КНР",
    month: 10, dateFrom: 1, dateTo: 31,
  },
  {
    title: "Утверждение графика ответственных",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 10, dateFrom: 1, dateTo: 31,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// НОЯБРЬ (month = 11)
// ─────────────────────────────────────────────────────────────────────────────

const NOVEMBER: SeedTask[] = [
  // 01.11 У  КО-2
  {
    title: "Приказ об увольнении в запас (последняя суббота ноября)",
    category: "У", priority: "critical", responsible: "КО-2",
    month: 11, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Приказ на звания (по рапорту)",
    category: "У", priority: "normal", responsible: "КО-2",
    month: 11, dateFrom: 1, dateTo: 1,
  },
  {
    title: "Сценарий торжественного увольнения в запас",
    category: "У", priority: "normal", responsible: "КО-2",
    month: 11, dateFrom: 1, dateTo: 1,
  },
  {
    title: "Печать и оформление грамот, писем, фото, фотоальбома",
    category: "У", priority: "normal", responsible: "КО-2",
    month: 11, dateFrom: 1, dateTo: 1,
  },
  {
    title: "Оформление документов на увольнение (ноябрь)",
    category: "У", priority: "high", responsible: "КВ-1",
    month: 11, dateFrom: 1, dateTo: 30,
    subtasks: [
      "Рапорт на выдачу ВПД",
      "Таблица очерёдности увольнения для ВПД",
      "ВПД (по рапорту)",
      "Выдать ВПД под подпись в ведомости",
      "Организовать покупку билетов",
      "Снять копии с билетов, сдать в отдел ВПД",
      "Список военных комиссариатов",
      "Таблица очерёдности фактического убытия",
      "План защиты годовых отчётов",
      "Данные о допусках",
      "Предписания",
      "Ведомость инструктажа",
      "Журнал инструктажа",
      "Справки о прохождении службы для увольняемых",
      "Рапорта о снятии с довольствия",
      "Рапорта об исключении из ВАС",
      "Выписки из приказов",
      "Ведомость о неразглашении ССГТ",
      "Заключения об осведомлённости",
      "Заполнить и заверить записи в ВБ и УПК (согласовать ВУС с НСО)",
      "Подготовить квитки об отсутствии задолженностей в библиотеке",
      "Акты о сдаче ПЭВМ, USB и пропусков",
      "Рапорта о приёме документов",
      "Подготовить к выдаче личные документы",
      "Осмотр сумок перед убытием",
      "Подать данные приказов об исключении из ВАС в ДП ЗГТ",
    ],
  },

  // 01.11 П  КВ-2
  {
    title: "Обзвон кандидатов на предмет прохождения призыва",
    category: "П", priority: "normal", responsible: "КВ-2",
    month: 11, dateFrom: 1, dateTo: 1,
  },
  {
    title: "Уточнение списков второго этапа с ГОМУ",
    category: "П", priority: "normal", responsible: "КВ-2",
    month: 11, dateFrom: 1, dateTo: 1,
  },
  {
    title: "Приказ о приёме молодого пополнения (учесть ВПО ВАС и ФЭС)",
    category: "П", priority: "high", responsible: "КВ-1",
    month: 11, dateFrom: 1, dateTo: 1,
  },
  {
    title: "Сбор сведений старших воинских команд с кафедр",
    category: "П", priority: "normal", responsible: "ЗКВ-1",
    month: 11, dateFrom: 1, dateTo: 1,
  },

  // 10.11 НД  КВ-1
  {
    title: "Подготовка к круглому столу (ноябрь)",
    category: "НД", priority: "high", responsible: "КВ-1",
    month: 11, dateFrom: 10, dateTo: 10,
    subtasks: [
      "Подготовка информационного письма",
      "Сбор материалов выступающих",
      "Рапорт на пропуск посетителей",
      "Список участников",
      "Подготовка сценария",
      "Рапорт на помещение (ЗУС)",
      "Подготовка грамот и дипломов",
      "Подготовка раздаточных материалов",
      "Подготовка бейджей",
      "Подготовка помещений (гардероб, туалет)",
      "Подготовка чайной зоны",
    ],
  },

  // 15.11 П  КВ-2
  {
    title: "Публикация результатов 2-го этапа отбора",
    category: "П", priority: "normal", responsible: "КВ-2",
    month: 11, dateFrom: 15, dateTo: 15,
  },
  {
    title: "Подготовка командировочных документов (ноябрь)",
    category: "П", priority: "normal", responsible: "ЗКВ-1",
    month: 11, dateFrom: 15, dateTo: 15,
    subtasks: [
      "Командировочные удостоверения",
      "Доверенности",
      "Письма о сокращении сопровождения",
      "Печать памяток и агитационных материалов",
      "ВПД",
    ],
  },

  // 15.11 НД  КВ-1
  {
    title: "Подготовка к защите годовых отчётов (ноябрь)",
    category: "НД", priority: "high", responsible: "КВ-1",
    month: 11, dateFrom: 15, dateTo: 15,
    subtasks: [
      "Проверка годовых отчётов",
      "Проверка презентаций",
      "Предварительное заслушивание",
      "Сбор электронных версий годовых отчётов и презентаций",
    ],
  },

  // 20.11 П  ЗКВ-1
  {
    title: "Уточнение информации с СП о ходе призыва кандидатов",
    category: "П", priority: "normal", responsible: "ЗКВ-1",
    month: 11, dateFrom: 20, dateTo: 20,
    subtasks: [
      "Адреса",
      "Сроки отправки",
      "Сокращение команды (по письмам)",
    ],
  },

  // ЕМ (ноябрь)
  {
    title: "Сверка личных планов постоянного состава",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 11, dateFrom: 20, dateTo: 20,
  },
  {
    title: "Мобилизационная неделя",
    category: "МГ", priority: "normal", responsible: "КНР",
    month: 11, dateFrom: 20, dateTo: 20,
    subtasks: [
      "Расписаться в ГрОМР",
      "Подготовить рапорт (сдать в ГрОМР в четверг)",
    ],
  },
  {
    title: "Сверка служебных карточек",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 11, dateFrom: 20, dateTo: 20,
  },
  {
    title: "Сверка листов бесед",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 11, dateFrom: 20, dateTo: 20,
  },
  {
    title: "Уточнение плана публикаций на следующий месяц и проверка статей",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 11, dateFrom: 20, dateTo: 20,
  },
  {
    title: "Подготовка ИРС",
    category: "Н", priority: "normal", responsible: "КВ-2",
    month: 11, dateFrom: 20, dateTo: 20,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-1",
    month: 11, dateFrom: 20, dateTo: 20,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 11, dateFrom: 20, dateTo: 20,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-1",
    month: 11, dateFrom: 25, dateTo: 25,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 11, dateFrom: 25, dateTo: 25,
  },
  {
    title: "Уточнение тетрадей ПДП",
    category: "БП", priority: "normal", responsible: "КВ-2",
    month: 11, dateFrom: 25, dateTo: 25,
  },
  {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "КВ-2",
    month: 11, dateFrom: 25, dateTo: 25,
  },
    {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "ЗКВ-2",
    month: 11, dateFrom: 25, dateTo: 25,
  },
  {
    title: "Дисциплинарная практика за месяц",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 11, dateFrom: 25, dateTo: 25,
  },
  ...ps({
    title: "Проведение подведения итогов роты за месяц",
    category: "ЕМ", priority: "normal",
    month: 11, dateFrom: 25, dateTo: 25,
  }),
  {
    title: "Подготовка материала для публикации новостей на сайте ВАС, МО РФ",
    category: "ВПР", priority: "normal", responsible: "КВ-2",
    month: 11, dateFrom: 25, dateTo: 25,
  },
  {
    title: "Ежемесячное доведение приказа № 85дсп",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 11, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Еженедельный рапорт в ЗГТ",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 11, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Еженедельная проверка САВЗ (с записью в журнал)",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 11, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Еженедельный рапорт о ГДП",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 11, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Анализ электронной почты",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 11, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Актуализация списка ВУЗов",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 11, dateFrom: 25, dateTo: 25,
  },
  {
    title: "Подготовка соглашений",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 11, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Сверка ПЭК, УПК, ВБ",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-1",
    month: 11, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Ежемесячная ведомость получения денежного довольствия",
    category: "ЕМ", priority: "normal", responsible: "КНР",
    month: 11, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Утверждение графика ответственных",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 11, dateFrom: 1, dateTo: 30,
  },

  // 28.11 НД  КВ-1
  {
    title: "Организация мероприятий по проведению круглого стола (ноябрь)",
    category: "НД", priority: "high", responsible: "КВ-1",
    month: 11, dateFrom: 28, dateTo: 28,
    subtasks: [
      "Пропуск по спискам и встреча посетителей",
      "Организация кофе-брейка",
      "Подготовка мультимедиа",
      "Подготовка грамот и дипломов",
      "Пригласить сотрудников НИЦ",
    ],
  },

  // 29.11 У  КВ-1, КО-2
  {
    title: "Проведение тренировки торжественного увольнения",
    category: "У", priority: "normal", responsible: "КВ-1",
    month: 11, dateFrom: 29, dateTo: 29,
    subtasks: [
      "Подготовка стола (со скатертью)",
      "Организация музыкального сопровождения",
      "Подготовка выписок из приказов, погон, значков, грамот, писем, фотографий",
      "Согласовать список посетителей (с паспортными данными)",
    ],
  },
  {
    title: "Проведение тренировки торжественного увольнения",
    category: "У", priority: "normal", responsible: "КО-2",
    month: 11, dateFrom: 29, dateTo: 29,
    subtasks: [
      "Подготовка стола (со скатертью)",
      "Организация музыкального сопровождения",
      "Подготовка выписок из приказов, погон, значков, грамот, писем, фотографий",
      "Согласовать список посетителей (с паспортными данными)",
    ],
  },

  // 30.11 У  КВ-1, СР
  {
    title: "Проведение торжественного увольнения",
    category: "У", priority: "critical", responsible: "КВ-1",
    month: 11, dateFrom: 30, dateTo: 30,
    subtasks: [
      "Пропуск по спискам и встреча посетителей",
      "Организация экскурсии для посетителей",
      "Организация чайной зоны",
    ],
  },
  {
    title: "Проведение торжественного увольнения",
    category: "У", priority: "critical", responsible: "СР",
    month: 11, dateFrom: 30, dateTo: 30,
    subtasks: [
      "Пропуск по спискам и встреча посетителей",
      "Организация экскурсии для посетителей",
      "Организация чайной зоны",
    ],
  },

  // 30.11 П  КНР, КВ
  {
    title: "Инструктаж старших воинских команд (ноябрь)",
    category: "П", priority: "high", responsible: "КНР",
    month: 11, dateFrom: 30, dateTo: 30,
    subtasks: [
      "Подготовка командировочных документов",
      "Подготовка памяток",
      "Ведомость инструктажа",
    ],
  },
  {
    title: "Инструктаж старших воинских команд (ноябрь)",
    category: "П", priority: "high", responsible: "КВ-1",
    month: 11, dateFrom: 30, dateTo: 30,
    subtasks: [
      "Подготовка командировочных документов",
      "Подготовка памяток",
      "Ведомость инструктажа",
    ],
  },
  {
    title: "Инструктаж старших воинских команд (ноябрь)",
    category: "П", priority: "high", responsible: "КВ-2",
    month: 11, dateFrom: 30, dateTo: 30,
    subtasks: [
      "Подготовка командировочных документов",
      "Подготовка памяток",
      "Ведомость инструктажа",
    ],
  },

  // 30.11  КНР
  {
    title: "Отправка в командировку (ноябрь)",
    category: "П", priority: "normal", responsible: "КНР",
    month: 11, dateFrom: 30, dateTo: 30,
  },
  {
    title: "Сбор данных о билетах (в обе стороны) для ДА и ННИЦ",
    category: "П", priority: "normal", responsible: "КНР",
    month: 11, dateFrom: 1, dateTo: 30,
  },
  {
    title: "Доклад в ГОМУ о проведении инструктажа (ноябрь)",
    category: "П", priority: "normal", responsible: "КНР",
    month: 11, dateFrom: 30, dateTo: 30,
    subtasks: [
      "Подготовить именной список",
      "Подготовить ведомость инструктажа",
      "Подготовить телеграмму",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ДЕКАБРЬ (month = 12)
// ─────────────────────────────────────────────────────────────────────────────

const DECEMBER: SeedTask[] = [
  // 01-05  КНР
  {
    title: "Подготовка графика отпусков на следующий год",
    category: "ПД", priority: "normal", responsible: "КНР",
    month: 12, dateFrom: 1, dateTo: 5,
  },
  {
    title: "Распределение ответственности на праздники (декабрь)",
    category: "ПД", priority: "normal", responsible: "КНР",
    month: 12, dateFrom: 1, dateTo: 10,
  },

  // 01-10  КВ-2
  {
    title: "Снять с довольствия увольняемых в запас (декабрь)",
    category: "У", priority: "high", responsible: "КВ-2",
    month: 12, dateFrom: 1, dateTo: 10,
    subtasks: [
      "Сдать рапорта и выписки в СО и прод. службу",
      "Сдать 4 выписки об исключении (в ФЭС, в ОК, прод. службу и в дело)",
    ],
  },

  // ЗКВ-2
  {
    title: "Сдача по учёту в журнале МНИ с составлением актов (ПЭВМ, USB, пропуска) — декабрь",
    category: "ЗиТ", priority: "normal", responsible: "ЗКВ-2",
    month: 12, dateFrom: 1, dateTo: 10,
    subtasks: [
      "ПЭВМ (в комплекте: сумка, мышь, ЗУ)",
      "USB-носители",
      "Электронные пропуска",
    ],
  },

  // 01-10  КНР, СР
  {
    title: "Подготовка к инвентаризации (декабрь)",
    category: "ПД", priority: "normal", responsible: "КНР",
    month: 12, dateFrom: 1, dateTo: 10,
    subtasks: [
      "Техника",
      "КЭС",
      "ЗГТ",
    ],
  },
  {
    title: "Подготовка к инвентаризации (декабрь)",
    category: "ПД", priority: "normal", responsible: "СР",
    month: 12, dateFrom: 1, dateTo: 10,
    subtasks: [
      "Техника",
      "КЭС",
      "ЗГТ",
    ],
  },

  // 12.12  КНР, КВ
  {
    title: "Ознакомление с 2С (кабинет 5125б)",
    category: "ПД", priority: "normal", responsible: "КНР",
    month: 12, dateFrom: 12, dateTo: 12,
  },
  {
    title: "Ознакомление с 2С (кабинет 5125б)",
    category: "ПД", priority: "normal", responsible: "КВ-1",
    month: 12, dateFrom: 12, dateTo: 12,
  },
  {
    title: "Ознакомление с 2С (кабинет 5125б)",
    category: "ПД", priority: "normal", responsible: "КВ-2",
    month: 12, dateFrom: 12, dateTo: 12,
  },

  // 1-10  разные
  {
    title: "Подготовка к сдаче на классность",
    category: "ПД", priority: "normal", responsible: "КНР",
    month: 12, dateFrom: 1, dateTo: 10,
  },
  {
    title: "Рапорт на выплату за командование личным составом",
    category: "ПД", priority: "normal", responsible: "КНР",
    month: 12, dateFrom: 1, dateTo: 10,
  },
  {
    title: "Рапорт на выплату за работу с ССГТ",
    category: "ПД", priority: "normal", responsible: "КНР",
    month: 12, dateFrom: 1, dateTo: 10,
  },
  {
    title: "Рапорт на ежемесячную премию",
    category: "ПД", priority: "normal", responsible: "КНР",
    month: 12, dateFrom: 1, dateTo: 10,
  },
  {
    title: "Рапорт на годовую премию (1010)",
    category: "ПД", priority: "normal", responsible: "КНР",
    month: 12, dateFrom: 1, dateTo: 10,
  },

  // 1-10 ЗКВ, КО  — документы по ФП
  {
    title: "Подготовка документов по физической подготовке (рапорта, копии книжек)",
    category: "БП", priority: "normal", responsible: "ЗКВ-1",
    month: 12, dateFrom: 1, dateTo: 10,
  },
  {
    title: "Подготовка документов по физической подготовке (рапорта, копии книжек)",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 12, dateFrom: 1, dateTo: 10,
  },
  {
    title: "Подготовка документов по физической подготовке (рапорта, копии книжек)",
    category: "БП", priority: "normal", responsible: "КО-2",
    month: 12, dateFrom: 1, dateTo: 10,
  },

  // 1-10  КНР
  {
    title: "Квартальная проверка в моб. группе (декабрь)",
    category: "МГ", priority: "normal", responsible: "КНР",
    month: 12, dateFrom: 1, dateTo: 10,
  },
  {
    title: "Квартальная проверка службе ЗГТ (декабрь)",
    category: "ЗиТ", priority: "normal", responsible: "КНР",
    month: 12, dateFrom: 1, dateTo: 10,
  },

  // 1-15 П  КНР, СР — приём молодого пополнения
  {
    title: "Приём молодого пополнения (декабрь)",
    category: "П", priority: "critical", responsible: "КНР",
    month: 12, dateFrom: 1, dateTo: 15,
    subtasks: [
      "Рапорт на автомобильный транспорт",
      "Фотографирование воинской команды",
      "Медицинский осмотр",
      "Сделать копии паспорта и военного билета",
      "Собрать и подготовить военные билеты и паспорта (бирки, жетоны)",
      "Собрать ВУ, загран. паспорта, дипломы (копии), ПЭК, УПК, карты МО, карты ПО, именные списки, маршрутные листы, акты проверки воинских команд, билеты",
      "Занести ПЭК в журнал учёта",
      "Подготовить рапорт на сдачу документов",
      "Проверить вещевое имущество (раздаточная ведомость, вещевой аттестат, акт приёма)",
      "Проверить наличие банковских карт у прибывших",
      "Заполнить заявления для Алушты и сдать в отдел кадров",
      "Сдать в строевой отдел рапорт на все виды довольствия, копии УПК и ВБ",
      "Сдать в продовольственную службу 2 рапорта на котловое довольствие и продовольственные аттестаты",
      "Подготовить 4 выписки о включении в ВАС (ОК, прод.сл., вещ.сл., в дело)",
      "Определить место хранения личных вещей и спальные места",
      "Выдать постельное бельё",
      "Провести инструктаж",
      "Организовать питание и помывку",
      "Спланировать мероприятия (эссе, анкеты, ОВУ)",
      "Провести первичную беседу",
      "Установить связь с родителями",
      "Составить рапорт о назначении на должность",
      "Сделать и заверить записи о включении в списки ВАС и должности",
      "Получить в лазарете профилактические лекарства",
    ],
  },
  {
    title: "Приём молодого пополнения (декабрь)",
    category: "П", priority: "critical", responsible: "СР",
    month: 12, dateFrom: 1, dateTo: 15,
  },

  // 15.12  КВ-2
  {
    title: "Отправить 2-е экз. именных списков в ВК субъектов (декабрь)",
    category: "П", priority: "normal", responsible: "КВ-2",
    month: 12, dateFrom: 15, dateTo: 15,
  },
  {
    title: "Подготовить доклад в ГУС и ГОМУ о результатах набора МП (декабрь)",
    category: "П", priority: "high", responsible: "КВ-2",
    month: 12, dateFrom: 15, dateTo: 15,
    subtasks: [
      "Телеграмма в ГОМУ",
      "Данные в ГОМУ",
      "Данные для ВНК ГУС",
      "Письмо-доклад для НГУС",
    ],
  },

  // 15.12  КВ-2
  {
    title: "Внести данные по увольнению и призыву в документацию УЛС (декабрь)",
    category: "У", priority: "normal", responsible: "КВ-2",
    month: 12, dateFrom: 15, dateTo: 15,
    subtasks: [
      "Книга алфавитного учёта",
      "Книга УЛС (Форма № 1)",
      "Именные списки взводов (Форма №1-а)",
      "Книга ШДУ (Форма № 4)",
      "ШДК",
      "ШДС",
    ],
  },

  // 15.12  КВ-1
  {
    title: "Донесение 47 ОМУ о составе численности л/с (декабрь)",
    category: "ПД", priority: "normal", responsible: "КВ-1",
    month: 12, dateFrom: 15, dateTo: 15,
  },

  // 15.12  КВ-2
  {
    title: "Подготовить приказ на агитацию НР и ВПО ВАС (декабрь)",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 12, dateFrom: 15, dateTo: 15,
  },
  {
    title: "Подготовить план мероприятий по агитации, заверенный у НВАС (декабрь)",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 12, dateFrom: 15, dateTo: 15,
  },
  {
    title: "Подготовить предложения в состав комиссии в Технополис ЭРА",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 12, dateFrom: 15, dateTo: 15,
  },
  {
    title: "Отправить заявку на выдачу удостоверений в ГУС (pdf, doc) — декабрь",
    category: "А", priority: "normal", responsible: "КВ-2",
    month: 12, dateFrom: 15, dateTo: 15,
  },

  // ЕМ (декабрь) — 18.12
  {
    title: "Сверка личных планов постоянного состава",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 12, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Сверка служебных карточек",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 12, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Сверка листов бесед",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 12, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Уточнение плана публикаций на следующий месяц и проверка статей",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 12, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Подготовка ИРС",
    category: "Н", priority: "normal", responsible: "КВ-1",
    month: 12, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-1",
    month: 12, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Проверка индивидуальных планов",
    category: "ЕМ", priority: "normal", responsible: "КВ-2",
    month: 12, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-1",
    month: 12, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Проверка боевой подготовки",
    category: "БП", priority: "normal", responsible: "ЗКВ-2",
    month: 12, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Проверка стенной печати",
    category: "ВПР", priority: "normal", responsible: "КНР",
    month: 12, dateFrom: 18, dateTo: 18,
  },
  {
    title: "Дисциплинарная практика за месяц",
    category: "ЕМ", priority: "normal", responsible: "ЗКВ-2",
    month: 12, dateFrom: 18, dateTo: 18,
  },
  ...ps({
    title: "Проведение подведения итогов роты за месяц",
    category: "ЕМ", priority: "normal",
    month: 12, dateFrom: 18, dateTo: 18,
  }),
  {
    title: "Подготовка материала для публикации новостей на сайте ВАС",
    category: "ВПР", priority: "normal", responsible: "КВ-1",
    month: 12, dateFrom: 18, dateTo: 18,
  },

  // 15-30  ПС → все — 2 этап ПМП
  ...ps({
    title: "Организация 2 этапа ПМП (декабрь)",
    category: "ПД", priority: "high",
    month: 12, dateFrom: 15, dateTo: 30,
    subtasks: [
      "Провести барьерный медицинский осмотр",
      "Провести проф-псих тестирование",
      "Провести КПЗ по БВС во взаимодействии с 4 кафедрой",
      "Спланировать изоляцию (на решение командира роты)",
      "Подготовить расписание",
      "Подготовить материалы занятий",
      "Подготовить доклады и презентации по науке старших",
      "Провести проф. собеседования (16)",
      "Предварительное распределение научных руководителей и направлений",
      "Разработка Боевого листа на призыв",
      "Подготовить ведомость допуска в бассейн",
      "Фотографирование личного состава",
      "Подготовка анкет на оформление 3 формы допуска",
      "Подготовка подписок о неразглашении",
      "Подать рапорт о назначении на должности",
      "Подать данные приказов об назначении в ДП ЗГТ",
      "Заполнить электронную книгу алфавитного учёта",
      "Оформить служебные карточки",
      "Согласовать выдачу банковских карт",
    ],
  }),

  // Приказ по ОВП  КВ-2
  {
    title: "Подготовить приказ о проведении общевойсковой подготовки (декабрь)",
    category: "БП", priority: "normal", responsible: "КВ-2",
    month: 12, dateFrom: 1, dateTo: 31,
  },

  // 30.12 ЗиТ  КВ-1
  {
    title: "Выдача по учёту в журнале МНИ с составлением актов (ПЭВМ, USB, пропуска) — 30.12",
    category: "ЗиТ", priority: "normal", responsible: "КВ-1",
    month: 12, dateFrom: 30, dateTo: 30,
    subtasks: [
      "ПЭВМ (в комплекте: сумка, мышь, ЗУ)",
      "USB-носители",
      "Электронные пропуска",
    ],
  },

  // 15-30  ПС → все — организация Нового года
  ...ps({
    title: "Организация Нового года",
    category: "ПД", priority: "normal",
    month: 12, dateFrom: 15, dateTo: 30,
    subtasks: [
      "Ёлка",
      "Стол (во взаимодействии со столовой)",
      "Сценарий программы",
      "Наряды",
      "Увольнения",
      "Культурный досуг",
    ],
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// ИТОГОВЫЙ МАССИВ И ЗАПИСЬ В БД
// ─────────────────────────────────────────────────────────────────────────────

const ALL_TASKS: SeedTask[] = [
  ...JANUARY,
  ...FEBRUARY,
  ...MARCH,
  ...APRIL,
  ...MAY,
  ...JUNE,
  ...JULY,
  ...AUGUST,
  ...SEPTEMBER,
  ...OCTOBER,
  ...NOVEMBER,
  ...DECEMBER,
];

async function seed() {
  console.log("🌱 ПОЛНЫЙ ГОДОВОЙ ПЛАН: Январь–Декабрь");
  console.log(`📋 Задач к вставке: ${ALL_TASKS.length}`);

  try {
    // Полная очистка
    await db.delete(subtasks);
    await db.delete(tasks);
    console.log("🗑️  Старые данные очищены");

    // Вставка задач батчами по 20
    const inserted: { id: number }[] = [];
    for (let i = 0; i < ALL_TASKS.length; i += 20) {
      // Создаем типизированный батч, который гарантированно подходит для вставки в tasks
      const batch: (typeof tasks.$inferInsert)[] = ALL_TASKS.slice(i, i + 20).map(t => ({
        title: t.title,
        category: t.category,
        priority: t.priority,
        // Используем as any только если уверены, что строки совпадают с enum в БД
        // Это поможет обойти чрезмерно строгую проверку TS на пересечение типов
        responsible: t.responsible as any,
        month: t.month,
        dateFrom: t.dateFrom,
        dateTo: t.dateTo,
      }));
      const rows = await db.insert(tasks).values(batch).returning();


      inserted.push(...rows);

    }
    console.log(`✅ Вставлено задач: ${inserted.length}`);

    // Вставка подзадач
    let subtaskCount = 0;
    for (let i = 0; i < ALL_TASKS.length; i++) {
      const subs = ALL_TASKS[i].subtasks ?? [];
      if (!subs.length) continue;
      const taskId = inserted[i].id;
      await db.insert(subtasks).values(
        subs.map((title, order) => ({ taskId, title, order }))
      );
      subtaskCount += subs.length;
    }
    console.log(`✅ Вставлено подзадач: ${subtaskCount}`);
    console.log("🎉 Полный годовой план загружен успешно!");

  } catch (error) {
    console.error("❌ Ошибка:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();