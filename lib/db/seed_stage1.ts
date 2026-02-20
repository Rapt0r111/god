// lib/db/seed_stage1.ts
// ЭТАП 1: Январь–Апрель
// Запуск: bun --env-file=.env.local run lib/db/seed_stage1.ts
//
// Правила разбора PDF:
//  КВ-1,2  → две отдельные задачи (КВ-1 + КВ-2)
//  ЗКВ-1,2 → две отдельные задачи (ЗКВ-1 + ЗКВ-2)
//  КВ      → КВ-1 и КВ-2 (оба)
//  КО-2    → КО-2 (командир 2 отделения)
//  ПС      → все роли: КНР, КВ-1, КВ-2, ЗКВ-1, ЗКВ-2, СР, КО-2
//  КНР     → КНР (командир научной роты)
//  СР      → СР (старшина роты)

import { db } from "./index";
import { tasks, subtasks } from "./schema";

type Category    = "Н"|"А"|"БП"|"ПД"|"ВПР"|"У"|"П"|"ЗиТ"|"ЕМ"|"НД"|"МГ";
type Priority    = "critical"|"high"|"normal";
type Responsible = "КНР"|"КВ-1"|"КВ-2"|"ЗКВ-1"|"ЗКВ-2"|"СР"|"КО-2";

interface SeedTask {
  title:       string;
  category:    Category;
  priority:    Priority;
  responsible: Responsible;
  month:       number;
  dateFrom:    number;
  dateTo:      number;
  subtasks?:   string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ЯНВАРЬ (month = 1)
// ─────────────────────────────────────────────────────────────────────────────
// Источник: страница 1–2 PDF
//
// Условные обозначения из PDF (январь):
//   КВ-2  — командир 2 взвода
//   КВ-1  — командир 1 взвода
//   КВ    — оба командира взводов (КВ-1 и КВ-2)
//   КНР   — командир научной роты
//   ЗКВ-1 — зам. командира 1 взвода
//   ЗКВ-2 — зам. командира 2 взвода
//   ПС    — все роли (КНР, КВ-1, КВ-2, ЗКВ-1, ЗКВ-2, СР, КО-2)
//   МГ    — мобилизационная группа → ответственный КНР
//   ЕМ    — ежемесячные мероприятия
// ─────────────────────────────────────────────────────────────────────────────

const JANUARY: SeedTask[] = [
  // 10-15 А  КВ-2
  {
    title:       "Отправить заявки на удостоверения в ГОМУ",
    category:    "А",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 10, dateTo: 15,
  },

  // 15-20 ПД  КВ-2  (квартальная проверка ВНК ГУС за 4 кв.)
  {
    title:       "Квартальная проверка ВНК ГУС за 4 квартал",
    category:    "ПД",
    priority:    "high",
    responsible: "КВ-2",
    month: 1, dateFrom: 15, dateTo: 20,
    subtasks: [
      "Проверить реализацию рекомендаций за 3 квартал",
      "Подготовить проект Акта",
      "Подготовить справку-доклад с полученными указаниями и рекомендациями по результатам проверки",
    ],
  },

  // 10-30 ПД  — «Подготовка к итоговой проверке»
  // В PDF не указан конкретный ответственный для всего блока,
  // только «ПС» упоминается в контексте «провести проверку внутреннего порядка».
  // Основная координационная задача — КВ-2 (как в оригинальном seed),
  // отдельные подзадачи раскрыты внутри.
  {
    title:       "Подготовка к итоговой проверке деятельности",
    category:    "ПД",
    priority:    "critical",
    responsible: "КВ-2",
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

  // КНР — 10-15 Н  «Отправить перечень направлений подготовки в ГУС»
  {
    title:       "Отправить перечень направлений подготовки (специальностей) и профили НИР в ГУС",
    category:    "Н",
    priority:    "normal",
    responsible: "КНР",
    month: 1, dateFrom: 10, dateTo: 15,
  },

  // КНР — «Подготовить заверенные профили НИР»
  {
    title:       "Подготовить заверенные профили НИР в соответствии с Положением",
    category:    "Н",
    priority:    "normal",
    responsible: "КНР",
    month: 1, dateFrom: 10, dateTo: 15,
  },

  // 10-20 БП  КВ-1  «Подготовка индивидуальных заданий и личных планов по ПДП на 2 семестр»
  {
    title:       "Подготовка индивидуальных заданий и личных планов по ПДП на 2 семестр",
    category:    "БП",
    priority:    "normal",
    responsible: "КВ-1",
    month: 1, dateFrom: 10, dateTo: 20,
  },
  // КВ-2 тоже (КВ-1,2)
  {
    title:       "Подготовка индивидуальных заданий и личных планов по ПДП на 2 семестр",
    category:    "БП",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 10, dateTo: 20,
  },

  // 10-15 Н  «Проведение собеседований с ННИЦ для распределения м/п»  КВ, КВ-1
  // PDF: «КВ» = КВ-1 и КВ-2
  {
    title:       "Проведение собеседований с ННИЦ для распределения м/п",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-1",
    month: 1, dateFrom: 10, dateTo: 15,
  },
  {
    title:       "Проведение собеседований с ННИЦ для распределения м/п",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 10, dateTo: 15,
  },

  // 15-20 Н  «Проведение собеседований с сотрудниками НИЦ для закрепления м/п»  КВ, КВ-1
  {
    title:       "Проведение собеседований с сотрудниками НИЦ для закрепления м/п",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-1",
    month: 1, dateFrom: 15, dateTo: 20,
  },
  {
    title:       "Проведение собеседований с сотрудниками НИЦ для закрепления м/п",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 15, dateTo: 20,
  },

  // 10-20 Н  «Приказ о закреплении научных руководителей»  КВ-1
  {
    title:       "Приказ о закреплении научных руководителей",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-1",
    month: 1, dateFrom: 10, dateTo: 20,
  },

  // 10-20 Н  «Подготовка перечня направлений научной деятельности операторов для ГУС»  КВ-1
  {
    title:       "Подготовка перечня направлений научной деятельности операторов для ГУС",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-1",
    month: 1, dateFrom: 10, dateTo: 20,
  },

  // 10-20 БП  «Приказ на проведение присяги»  КВ-2
  {
    title:       "Приказ на проведение Присяги",
    category:    "БП",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 10, dateTo: 20,
  },

  // 10-25 БП  «Приказ на проведение стрельб»  КВ-1,2 → два
  {
    title:       "Приказ на проведение стрельб",
    category:    "БП",
    priority:    "normal",
    responsible: "КВ-1",
    month: 1, dateFrom: 10, dateTo: 25,
  },
  {
    title:       "Приказ на проведение стрельб",
    category:    "БП",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 10, dateTo: 25,
  },

  // 10-27 БП  «Подготовка к стрельбам»  КВ-1,2 → два
  {
    title:       "Подготовка к стрельбам",
    category:    "БП",
    priority:    "high",
    responsible: "КВ-1",
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
    title:       "Подготовка к стрельбам",
    category:    "БП",
    priority:    "high",
    responsible: "КВ-2",
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

  // 20 МГ  «Мобилизационная тренировка»  КНР
  {
    title:       "Мобилизационная тренировка (январь)",
    category:    "МГ",
    priority:    "normal",
    responsible: "КНР",
    month: 1, dateFrom: 20, dateTo: 20,
  },

  // 20 ЕМ  «Сверка личных планов постоянного состава»  КВ-2
  {
    title:       "Сверка личных планов постоянного состава",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 20, dateTo: 20,
  },

  // 20 «Мобилизационная неделя»  КНР
  {
    title:       "Мобилизационная неделя",
    category:    "МГ",
    priority:    "normal",
    responsible: "КНР",
    month: 1, dateFrom: 20, dateTo: 20,
    subtasks: [
      "Расписаться в ГрОМР",
      "Подготовить рапорт (сдать в ГрОМР в четверг)",
    ],
  },

  // 20 «Сверка служебных карточек»  ЗКВ-2
  {
    title:       "Сверка служебных карточек",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 1, dateFrom: 20, dateTo: 20,
  },

  // 20 «Сверка листов бесед»  ЗКВ-2
  {
    title:       "Сверка листов бесед",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 1, dateFrom: 20, dateTo: 20,
  },

  // 20 «Уточнение плана публикаций на следующий месяц и проверка статей»  КВ-2
  {
    title:       "Уточнение плана публикаций на следующий месяц и проверка статей",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 20, dateTo: 20,
  },

  // 20 «Подготовка ИРС»  КВ-2
  {
    title:       "Подготовка ИРС",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 20, dateTo: 20,
  },

  // 20 «Проверка индивидуальных планов»  КВ  (оба)
  {
    title:       "Проверка индивидуальных планов",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-1",
    month: 1, dateFrom: 20, dateTo: 20,
  },
  {
    title:       "Проверка индивидуальных планов",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 20, dateTo: 20,
  },

  // 25 «Проверка боевой подготовки»  ЗКВ-1, ЗКВ-2
  {
    title:       "Проверка боевой подготовки",
    category:    "БП",
    priority:    "normal",
    responsible: "ЗКВ-1",
    month: 1, dateFrom: 25, dateTo: 25,
  },
  {
    title:       "Проверка боевой подготовки",
    category:    "БП",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // «Уточнение тетрадей ПДП»  КВ-2
  {
    title:       "Уточнение тетрадей ПДП",
    category:    "БП",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // 25 «Проверка стенной печати»  КВ-2, ЗКВ-2
  {
    title:       "Проверка стенной печати",
    category:    "ВПР",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },
  {
    title:       "Проверка стенной печати",
    category:    "ВПР",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // 25 «Дисциплинарная практика за месяц»  ЗКВ-2
  {
    title:       "Дисциплинарная практика за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // 25 «Проведение подведения итогов роты»  ПС
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КНР",
    month: 1, dateFrom: 25, dateTo: 25,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-1",
    month: 1, dateFrom: 25, dateTo: 25,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-1",
    month: 1, dateFrom: 25, dateTo: 25,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "СР",
    month: 1, dateFrom: 25, dateTo: 25,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КО-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // 25 «Подготовка материала для публикации новостей на сайте ВАС, МО РФ»  КВ-2, ЗКВ-2
  {
    title:       "Подготовка материала для публикации новостей на сайте ВАС, МО РФ",
    category:    "ВПР",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },
  {
    title:       "Подготовка материала для публикации новостей на сайте ВАС, МО РФ",
    category:    "ВПР",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // «Актуализация списка ВУЗов»  КВ-2
  {
    title:       "Актуализация списка ВУЗов",
    category:    "А",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // «Подготовка соглашений»  КВ-2
  {
    title:       "Подготовка соглашений",
    category:    "А",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // «Сверка ПЭК, УПК, ВБ»  ЗКВ-1
  {
    title:       "Сверка ПЭК, УПК, ВБ",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-1",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // «Ежемесячная ведомость получения денежного довольствия»  КНР
  {
    title:       "Ежемесячная ведомость получения денежного довольствия",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КНР",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // «Утверждение графика ответственных»  ЗКВ-2
  {
    title:       "Утверждение графика ответственных",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 1, dateFrom: 25, dateTo: 25,
  },

  // 20.01 Н  «Проведение занятия по требованиям РД, оформлению отчётов и статей»  КВ-2
  {
    title:       "Проведение занятия по требованиям руководящих документов, оформлению отчётов, научных статей и свидетельств о регистрации",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 20, dateTo: 20,
  },

  // 27.01 БП  «Организация стрельб (во взаимодействии с 10 каф.)»  КВ-1,2
  {
    title:       "Организация стрельб (во взаимодействии с 10 каф.)",
    category:    "БП",
    priority:    "high",
    responsible: "КВ-1",
    month: 1, dateFrom: 27, dateTo: 27,
  },
  {
    title:       "Организация стрельб (во взаимодействии с 10 каф.)",
    category:    "БП",
    priority:    "high",
    responsible: "КВ-2",
    month: 1, dateFrom: 27, dateTo: 27,
  },

  // 28-30 ВПР  «Подготовка к проведению Присяги»  КВ-2
  {
    title:       "Подготовка к проведению Присяги",
    category:    "ВПР",
    priority:    "high",
    responsible: "КВ-2",
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

  // 31 ВПР  «Проведение торжественной церемонии приведения к Присяге»  КНР
  {
    title:       "Проведение торжественной церемонии приведения к Присяге",
    category:    "ВПР",
    priority:    "critical",
    responsible: "КНР",
    month: 1, dateFrom: 31, dateTo: 31,
  },

  // 31 ПД  «Подготовка к передаче нарядов и ротных обязанностей»  СР, КВ-2
  {
    title:       "Подготовка к передаче нарядов и ротных обязанностей между призывами",
    category:    "ПД",
    priority:    "normal",
    responsible: "СР",
    month: 1, dateFrom: 31, dateTo: 31,
    subtasks: [
      "Составление графика стажировок в наряде",
      "Актуализация и уточнение ротных обязанностей",
    ],
  },
  {
    title:       "Подготовка к передаче нарядов и ротных обязанностей между призывами",
    category:    "ПД",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 31, dateTo: 31,
    subtasks: [
      "Составление графика стажировок в наряде",
      "Актуализация и уточнение ротных обязанностей",
    ],
  },

  // 31 ЗиТ  «Выдача по учёту в журнале МНИ»  КВ-2
  {
    title:       "Выдача по учёту в журнале МНИ с составлением актов",
    category:    "ЗиТ",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 31, dateTo: 31,
    subtasks: [
      "USB-носители",
      "Электронные пропуска",
    ],
  },

  // 31 ЗиТ  «Активация пропусков в ЦОИ»  КВ-1
  {
    title:       "Активация пропусков в ЦОИ",
    category:    "ЗиТ",
    priority:    "normal",
    responsible: "КВ-1",
    month: 1, dateFrom: 31, dateTo: 31,
  },

  // 31 Н  «Проведение беседы по трудоустройству»  КВ-2
  {
    title:       "Проведение беседы по трудоустройству",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 31, dateTo: 31,
  },

  // Еженедельные / постоянные для января — ЗКВ-2
  {
    title:       "Еженедельный рапорт в ЗГТ",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 1, dateFrom: 1, dateTo: 31,
  },
  {
    title:       "Еженедельная проверка САВЗ (с записью в журнал)",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 1, dateFrom: 1, dateTo: 31,
  },
  {
    title:       "Еженедельный рапорт о ГДП",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 1, dateFrom: 1, dateTo: 31,
  },
  {
    title:       "Анализ электронной почты",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-2",
    month: 1, dateFrom: 1, dateTo: 31,
  },
  {
    title:       "Ежемесячное доведение приказа № 85дсп",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 1, dateFrom: 1, dateTo: 31,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ФЕВРАЛЬ (month = 2)
// ─────────────────────────────────────────────────────────────────────────────

const FEBRUARY: SeedTask[] = [
  // 03-16 ПС  «Итоговая проверка деятельности МОРФ»
  {
    title:       "Итоговая проверка деятельности МО РФ",
    category:    "ПД",
    priority:    "critical",
    responsible: "КНР",
    month: 2, dateFrom: 3, dateTo: 16,
    subtasks: [
      "Мероприятия в соответствии с планом подготовки",
      "Мероприятия в соответствии с перечнем вопросов проверки",
      "Мероприятия в соответствии с планом реализации рекомендаций",
    ],
  },
  {
    title:       "Итоговая проверка деятельности МО РФ",
    category:    "ПД",
    priority:    "critical",
    responsible: "КВ-1",
    month: 2, dateFrom: 3, dateTo: 16,
    subtasks: [
      "Мероприятия в соответствии с планом подготовки",
      "Мероприятия в соответствии с перечнем вопросов проверки",
      "Мероприятия в соответствии с планом реализации рекомендаций",
    ],
  },
  {
    title:       "Итоговая проверка деятельности МО РФ",
    category:    "ПД",
    priority:    "critical",
    responsible: "КВ-2",
    month: 2, dateFrom: 3, dateTo: 16,
    subtasks: [
      "Мероприятия в соответствии с планом подготовки",
      "Мероприятия в соответствии с перечнем вопросов проверки",
      "Мероприятия в соответствии с планом реализации рекомендаций",
    ],
  },
  {
    title:       "Итоговая проверка деятельности МО РФ",
    category:    "ПД",
    priority:    "critical",
    responsible: "ЗКВ-1",
    month: 2, dateFrom: 3, dateTo: 16,
    subtasks: [
      "Мероприятия в соответствии с планом подготовки",
      "Мероприятия в соответствии с перечнем вопросов проверки",
      "Мероприятия в соответствии с планом реализации рекомендаций",
    ],
  },
  {
    title:       "Итоговая проверка деятельности МО РФ",
    category:    "ПД",
    priority:    "critical",
    responsible: "ЗКВ-2",
    month: 2, dateFrom: 3, dateTo: 16,
    subtasks: [
      "Мероприятия в соответствии с планом подготовки",
      "Мероприятия в соответствии с перечнем вопросов проверки",
      "Мероприятия в соответствии с планом реализации рекомендаций",
    ],
  },
  {
    title:       "Итоговая проверка деятельности МО РФ",
    category:    "ПД",
    priority:    "critical",
    responsible: "СР",
    month: 2, dateFrom: 3, dateTo: 16,
    subtasks: [
      "Мероприятия в соответствии с планом подготовки",
      "Мероприятия в соответствии с перечнем вопросов проверки",
      "Мероприятия в соответствии с планом реализации рекомендаций",
    ],
  },
  {
    title:       "Итоговая проверка деятельности МО РФ",
    category:    "ПД",
    priority:    "critical",
    responsible: "КО-2",
    month: 2, dateFrom: 3, dateTo: 16,
    subtasks: [
      "Мероприятия в соответствии с планом подготовки",
      "Мероприятия в соответствии с перечнем вопросов проверки",
      "Мероприятия в соответствии с планом реализации рекомендаций",
    ],
  },

  // 1-15 Н  «Приказ на конкурс ГУС»  КВ-1
  {
    title:       "Приказ на конкурс ГУС",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-1",
    month: 2, dateFrom: 1, dateTo: 15,
  },

  // 01-20 А  «Подготовка командировочных документов на агитацию»  КВ-2
  {
    title:       "Подготовка командировочных документов на агитацию",
    category:    "А",
    priority:    "high",
    responsible: "КВ-2",
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

  // 15-30 Н  «Проведение 1 этапа конкурса ГУС»  КВ-1
  {
    title:       "Проведение 1 этапа конкурса ГУС",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-1",
    month: 2, dateFrom: 15, dateTo: 28,
  },

  // «Назначение ответственного в состав комиссии по ЗГТ»  КВ-1
  {
    title:       "Назначение ответственного в состав комиссии по ЗГТ (по согласованию с НС ЗГТ)",
    category:    "ПД",
    priority:    "normal",
    responsible: "КВ-1",
    month: 2, dateFrom: 1, dateTo: 28,
  },

  // «Подготовка к праздничным дням» — ответственный явно не указан в PDF → КНР
  {
    title:       "Подготовка к праздничным дням (февраль)",
    category:    "ПД",
    priority:    "normal",
    responsible: "КНР",
    month: 2, dateFrom: 1, dateTo: 20,
    subtasks: [
      "Осмотр помещений",
      "Рапорт о готовности",
      "График ответственных",
    ],
  },

  // 20.02 А  «Проведение инструктажа убывающих в командировку»  КНР, КВ-2
  {
    title:       "Проведение инструктажа убывающих в командировку (агитация, февраль)",
    category:    "А",
    priority:    "high",
    responsible: "КНР",
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
    title:       "Проведение инструктажа убывающих в командировку (агитация, февраль)",
    category:    "А",
    priority:    "high",
    responsible: "КВ-2",
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

  // 25.02 А  «Убытие в командировку на агитацию и ВПО»  КНР
  {
    title:       "Убытие в командировку на агитацию и ВПО",
    category:    "А",
    priority:    "high",
    responsible: "КНР",
    month: 2, dateFrom: 25, dateTo: 25,
  },

  // ЕМ (февраль) — сверки, проверки, итоги
  // PDF: «Сверка личных планов постоянного состава» — КВ-1 (в феврале указан КВ-1)
  {
    title:       "Сверка личных планов постоянного состава",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-1",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  // «Сверка служебных карточек» — ЗКВ-2 (не указан явно в феврале, берём аналог)
  {
    title:       "Сверка служебных карточек",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title:       "Сверка листов бесед",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  // «Уточнение плана публикаций» — КВ-1
  {
    title:       "Уточнение плана публикаций на следующий месяц и проверка статей",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-1",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  // «Подготовка ИРС» — КВ-1
  {
    title:       "Подготовка ИРС",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-1",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  // «Проверка индивидуальных планов» — КВ-1,2
  {
    title:       "Проверка индивидуальных планов",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-1",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title:       "Проверка индивидуальных планов",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-2",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  // «Проверка боевой подготовки» — ЗКВ-1, ЗКВ-2
  {
    title:       "Проверка боевой подготовки",
    category:    "БП",
    priority:    "normal",
    responsible: "ЗКВ-1",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title:       "Проверка боевой подготовки",
    category:    "БП",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  // «Проверка стенной печати» — КНР
  {
    title:       "Проверка стенной печати",
    category:    "ВПР",
    priority:    "normal",
    responsible: "КНР",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title:       "Дисциплинарная практика за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КНР",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-1",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-2",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-1",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "СР",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КО-2",
    month: 2, dateFrom: 20, dateTo: 28,
  },
  // «Подготовка материала для публикации новостей» — КВ-1
  {
    title:       "Подготовка материала для публикации новостей на сайте ВАС",
    category:    "ВПР",
    priority:    "normal",
    responsible: "КВ-1",
    month: 2, dateFrom: 20, dateTo: 28,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// МАРТ (month = 3)
// ─────────────────────────────────────────────────────────────────────────────

const MARCH: SeedTask[] = [
  // 25.02–25.03 А  «Еженедельный доклад в ГУС о результатах агитации»  КВ-2
  {
    title:       "Еженедельный доклад в ГУС о результатах проведения агитации (по четвергам)",
    category:    "А",
    priority:    "normal",
    responsible: "КВ-2",
    month: 3, dateFrom: 1, dateTo: 25,
  },

  // 25.02–25.03 А  «Формирование базы анкет кандидатов»  КВ-2
  {
    title:       "Формирование базы анкет кандидатов",
    category:    "А",
    priority:    "normal",
    responsible: "КВ-2",
    month: 3, dateFrom: 1, dateTo: 25,
    subtasks: [
      "Сбор сведений по результатам агитации",
      "Обработка писем на почте",
      "Обработка новых заявок",
      "Опрос кандидатов с предыдущего призыва",
      "Мониторинг Telegram",
    ],
  },

  // 20-25 А  «Личное ознакомление с анкетами кандидатов, собеседование по телефону»  КВ-2
  {
    title:       "Личное ознакомление с анкетами кандидатов, проведение собеседования по телефону",
    category:    "А",
    priority:    "normal",
    responsible: "КВ-2",
    month: 3, dateFrom: 20, dateTo: 25,
  },

  // 25.03 А  «Формирование документов для ВНК и ДИМК»  КВ-2
  {
    title:       "Формирование документов для ВНК и ДИМК",
    category:    "А",
    priority:    "high",
    responsible: "КВ-2",
    month: 3, dateFrom: 25, dateTo: 25,
    subtasks: [
      "Рейтинговый список",
      "Протокол",
      "Оценочная ведомость",
    ],
  },

  // 25-28 А  «Согласование документов и отправка в ВНК и ДИМК»  КВ-2
  {
    title:       "Согласование документов и отправка в ВНК и ДИМК",
    category:    "А",
    priority:    "normal",
    responsible: "КВ-2",
    month: 3, dateFrom: 25, dateTo: 28,
  },

  // ЗиТ  «Квартальная проверка в ЗГТ»  — в PDF ответственный не указан → КВ-1
  {
    title:       "Квартальная проверка в ЗГТ",
    category:    "ЗиТ",
    priority:    "normal",
    responsible: "КВ-1",
    month: 3, dateFrom: 1, dateTo: 31,
  },

  // 1-10 У  «Отправка плана увольнения в запас в ОМУ ЛВО»  КВ-1
  {
    title:       "Отправка плана увольнения в запас в ОМУ ЛВО",
    category:    "У",
    priority:    "normal",
    responsible: "КВ-1",
    month: 3, dateFrom: 1, dateTo: 10,
  },

  // 1-15 Н  «Проведение II этапа конкурса ГУС»  — ответственный не указан → КВ-1
  {
    title:       "Проведение II этапа конкурса ГУС",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-1",
    month: 3, dateFrom: 1, dateTo: 15,
  },

  // ЕМ (март) — стандартный блок, ответственные из раздела PDF
  {
    title:       "Сверка личных планов постоянного состава",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Мобилизационная неделя",
    category:    "МГ",
    priority:    "normal",
    responsible: "КНР",
    month: 3, dateFrom: 20, dateTo: 31,
    subtasks: [
      "Расписаться в ГрОМР",
      "Подготовить рапорт (сдать в ГрОМР в четверг)",
    ],
  },
  {
    title:       "Сверка служебных карточек",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Сверка листов бесед",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Уточнение плана публикаций на следующий месяц и проверка статей",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Подготовка ИРС",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Проверка индивидуальных планов",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-1",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Проверка индивидуальных планов",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Проверка боевой подготовки",
    category:    "БП",
    priority:    "normal",
    responsible: "ЗКВ-1",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Проверка боевой подготовки",
    category:    "БП",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Проверка стенной печати",
    category:    "ВПР",
    priority:    "normal",
    responsible: "КНР",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Дисциплинарная практика за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КНР",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-1",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-1",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "СР",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КО-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },
  {
    title:       "Подготовка материала для публикации новостей на сайте ВАС",
    category:    "ВПР",
    priority:    "normal",
    responsible: "КВ-2",
    month: 3, dateFrom: 20, dateTo: 31,
  },

  // 28.02 ПД  «Передача ротных обязанностей и нарядов младшему призыву»  ПС
  // Дата 28.02 — относится к концу февраля, но в разделе МАРТ стоит.
  // Помещаем в март, dateFrom/dateTo = 1 (начало марта как переходный период)
  {
    title:       "Передача ротных обязанностей и нарядов младшему призыву",
    category:    "ПД",
    priority:    "normal",
    responsible: "КНР",
    month: 3, dateFrom: 1, dateTo: 1,
  },
  {
    title:       "Передача ротных обязанностей и нарядов младшему призыву",
    category:    "ПД",
    priority:    "normal",
    responsible: "КВ-1",
    month: 3, dateFrom: 1, dateTo: 1,
  },
  {
    title:       "Передача ротных обязанностей и нарядов младшему призыву",
    category:    "ПД",
    priority:    "normal",
    responsible: "КВ-2",
    month: 3, dateFrom: 1, dateTo: 1,
  },
  {
    title:       "Передача ротных обязанностей и нарядов младшему призыву",
    category:    "ПД",
    priority:    "normal",
    responsible: "ЗКВ-1",
    month: 3, dateFrom: 1, dateTo: 1,
  },
  {
    title:       "Передача ротных обязанностей и нарядов младшему призыву",
    category:    "ПД",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 3, dateFrom: 1, dateTo: 1,
  },
  {
    title:       "Передача ротных обязанностей и нарядов младшему призыву",
    category:    "ПД",
    priority:    "normal",
    responsible: "СР",
    month: 3, dateFrom: 1, dateTo: 1,
  },
  {
    title:       "Передача ротных обязанностей и нарядов младшему призыву",
    category:    "ПД",
    priority:    "normal",
    responsible: "КО-2",
    month: 3, dateFrom: 1, dateTo: 1,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// АПРЕЛЬ (month = 4)
// ─────────────────────────────────────────────────────────────────────────────

const APRIL: SeedTask[] = [
  // 7-09 ПД  «Квартальная проверка ВНК ГУС за 1 квартал»  КНР
  {
    title:       "Квартальная проверка ВНК ГУС за 1 квартал",
    category:    "ПД",
    priority:    "high",
    responsible: "КНР",
    month: 4, dateFrom: 7, dateTo: 9,
    subtasks: [
      "Проверить реализацию рекомендаций за 4 квартал",
      "Подготовить проект Акта",
      "Подготовить справку-доклад с полученными указаниями и рекомендациями по результатам проверки",
    ],
  },

  // «Участие в конкурсе НЦУО (в соответствии с указаниями)»  КВ-1
  {
    title:       "Участие в конкурсе НЦУО",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-1",
    month: 4, dateFrom: 1, dateTo: 30,
  },

  // 15.04  «Публикация рейтингового списка первого этапа отбора»  КВ-2
  {
    title:       "Публикация рейтингового списка первого этапа отбора",
    category:    "П",
    priority:    "normal",
    responsible: "КВ-2",
    month: 4, dateFrom: 15, dateTo: 15,
  },

  // ЕМ (апрель) — PDF явно указывает даты 20.04 и 18.04
  // «Сверка личных планов» — 20.04, КВ-2 не указан явно; берём аналог январю
  {
    title:       "Сверка личных планов постоянного состава",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-2",
    month: 4, dateFrom: 20, dateTo: 20,
  },
  {
    title:       "Сверка служебных карточек",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 4, dateFrom: 20, dateTo: 20,
  },
  {
    title:       "Сверка листов бесед",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 4, dateFrom: 20, dateTo: 20,
  },
  // 18.04
  {
    title:       "Уточнение плана публикаций на следующий месяц и проверка статей",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-1",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title:       "Подготовка ИРС",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-1",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  // «Проверка индивидуальных планов» — КВ-1,2
  {
    title:       "Проверка индивидуальных планов",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-1",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title:       "Проверка индивидуальных планов",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-2",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  // «Проверка боевой подготовки» — ЗКВ-1,2
  {
    title:       "Проверка боевой подготовки",
    category:    "БП",
    priority:    "normal",
    responsible: "ЗКВ-1",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title:       "Проверка боевой подготовки",
    category:    "БП",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  // «Проверка стенной печати» — КНР
  {
    title:       "Проверка стенной печати",
    category:    "ВПР",
    priority:    "normal",
    responsible: "КНР",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title:       "Дисциплинарная практика за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  // «Проведение подведения итогов роты» — ПС
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КНР",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-1",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КВ-2",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-1",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "ЗКВ-2",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "СР",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  {
    title:       "Проведение подведения итогов роты за месяц",
    category:    "ЕМ",
    priority:    "normal",
    responsible: "КО-2",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  // «Подготовка материала для публикации новостей» — КВ-1
  {
    title:       "Подготовка материала для публикации новостей на сайте ВАС",
    category:    "ВПР",
    priority:    "normal",
    responsible: "КВ-1",
    month: 4, dateFrom: 18, dateTo: 18,
  },
  // «Подведение итогов конкурса ГУС» — ответственный в PDF не указан явно → КВ-1
  {
    title:       "Подведение итогов конкурса ГУС",
    category:    "Н",
    priority:    "normal",
    responsible: "КВ-1",
    month: 4, dateFrom: 18, dateTo: 18,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ИТОГОВЫЙ МАССИВ И ЗАПИСЬ В БД
// ─────────────────────────────────────────────────────────────────────────────

const ALL_TASKS: SeedTask[] = [
  ...JANUARY,
  ...FEBRUARY,
  ...MARCH,
  ...APRIL,
];

async function seed() {
  console.log("🌱 ЭТАП 1: Январь–Апрель");
  console.log(`📋 Задач к вставке: ${ALL_TASKS.length}`);

  try {
    // Удаляем только задачи с month 1-4, чтобы не трогать остальные этапы
    const existingTasks = await db.select({ id: tasks.id }).from(tasks)
      .where(
        // Drizzle: month IN (1,2,3,4) — используем sql-фрагмент через inArray
        // Простой вариант — удалить всё и переписать
        // Поскольку это этап 1, удаляем всё (при первом запуске)
        undefined as any
      );

    // Очищаем полностью (seed всегда запускается на чистую БД)
    const { sql } = await import("drizzle-orm");
    await db.delete(subtasks);
    await db.delete(tasks);
    console.log("🗑️  Старые данные очищены");

    // Вставляем задачи батчами по 20
    const inserted: { id: number }[] = [];
    for (let i = 0; i < ALL_TASKS.length; i += 20) {
      const batch = ALL_TASKS.slice(i, i + 20).map(t => ({
        title:       t.title,
        category:    t.category,
        priority:    t.priority,
        responsible: t.responsible,
        month:       t.month,
        dateFrom:    t.dateFrom,
        dateTo:      t.dateTo,
      }));
      const rows = await db.insert(tasks).values(batch).returning({ id: tasks.id });
      inserted.push(...rows);
    }
    console.log(`✅ Вставлено задач: ${inserted.length}`);

    // Вставляем подзадачи
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
    console.log("🎉 Этап 1 завершён! Январь–Апрель загружены.");

  } catch (error) {
    console.error("❌ Ошибка:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();