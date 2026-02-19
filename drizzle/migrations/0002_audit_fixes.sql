-- ═══════════════════════════════════════════════════════
-- МИГРАЦИЯ 0002: Исправления по результатам аудита
-- ═══════════════════════════════════════════════════════

-- ─── 1. Добавить роль КО-2 в enum ───────────────────────
ALTER TYPE "public"."role" ADD VALUE IF NOT EXISTS 'КО-2';

-- ─── 2. Добавить поле года к задачам ────────────────────
ALTER TABLE "tasks"
  ADD COLUMN IF NOT EXISTS "year" integer NOT NULL DEFAULT 2025;

-- ─── 3. Удалить устаревшее jsonb-поле subtasks ──────────
-- (данные уже перенесены в таблицу subtasks через миграцию 0001)
ALTER TABLE "tasks"
  DROP COLUMN IF EXISTS "subtasks";

-- ─── 4. Добавить description и notes если ещё нет ───────
ALTER TABLE "tasks"
  ADD COLUMN IF NOT EXISTS "description" text,
  ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE "subtasks"
  ADD COLUMN IF NOT EXISTS "description" text,
  ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- ─── 5. Таблица зависимостей задач ──────────────────────
CREATE TABLE IF NOT EXISTS "task_dependencies" (
  "task_id"       integer NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
  "depends_on_id" integer NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
  "created_at"    timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("task_id", "depends_on_id"),
  CHECK ("task_id" != "depends_on_id")
);

CREATE INDEX IF NOT EXISTS "task_deps_task_idx"
  ON "task_dependencies" ("task_id");
CREATE INDEX IF NOT EXISTS "task_deps_depends_idx"
  ON "task_dependencies" ("depends_on_id");

-- ─── 6. Таблица личного состава ─────────────────────────
CREATE TABLE IF NOT EXISTS "personnel" (
  "id"              serial PRIMARY KEY,
  "full_name"       text NOT NULL,
  "call_number"     integer NOT NULL,          -- номер призыва (1, 2, 3...)
  "role_position"   text,                      -- должность в роте
  "vb_number"       text,                      -- номер военного билета
  "upk_number"      text,                      -- номер УПК
  "pek_number"      text,                      -- номер ПЭК
  "diploma"         text,                      -- диплом/специальность
  "university"      text,                      -- ВУЗ
  "status"          text NOT NULL DEFAULT 'active', -- active / discharged / incoming
  "допуск_form"     text,                      -- форма допуска (1/2/3)
  "bank_card"       boolean DEFAULT false,
  "joined_at"       date,
  "discharged_at"   date,
  "employment_info" text,                      -- сведения о трудоустройстве
  "notes"           text,
  "created_at"      timestamp DEFAULT now() NOT NULL,
  "updated_at"      timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "personnel_status_idx"    ON "personnel" ("status");
CREATE INDEX IF NOT EXISTS "personnel_call_idx"      ON "personnel" ("call_number");

-- ─── 7. Таблица журнала МНИ (инвентарный учёт) ──────────
CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id"            serial PRIMARY KEY,
  "type"          text NOT NULL,           -- ПЭВМ / USB / ЭП (электронный пропуск)
  "serial_number" text,
  "inventory_num" text,
  "status"        text NOT NULL DEFAULT 'stored', -- stored / issued / returned / written_off
  "assigned_to"   integer REFERENCES "personnel"("id"),
  "issued_at"     date,
  "returned_at"   date,
  "act_number"    text,                    -- номер акта приема/передачи
  "notes"         text,
  "created_at"    timestamp DEFAULT now() NOT NULL,
  "updated_at"    timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "inventory_status_idx" ON "inventory_items" ("status");
CREATE INDEX IF NOT EXISTS "inventory_type_idx"   ON "inventory_items" ("type");

-- ─── 8. Таблица шаблонов задач ──────────────────────────
-- (для ПМП, Присяга, Стрельбы — повторяющихся блоков)
CREATE TABLE IF NOT EXISTS "task_templates" (
  "id"          serial PRIMARY KEY,
  "name"        text NOT NULL,
  "description" text,
  "category"    "category" NOT NULL,
  "priority"    "priority" NOT NULL DEFAULT 'normal',
  "responsible" "role" NOT NULL,
  "subtasks"    jsonb NOT NULL DEFAULT '[]',   -- массив строк-подзадач
  "created_at"  timestamp DEFAULT now() NOT NULL
);

-- Вставляем базовые шаблоны
INSERT INTO "task_templates" ("name", "category", "priority", "responsible", "subtasks") VALUES
(
  'Подготовка к Присяге',
  'ВПР', 'high', 'ЗКВ-2',
  '[
    "Выписка из приказа о проведении Присяги",
    "Рапорт на получение оружия на тренировки и церемонию",
    "Сценарий",
    "Списки посетителей",
    "Списки и расписки для суточного увольнения",
    "Справки о прохождении службы",
    "Подготовка к встрече родителей (порядок, чай, презентация)",
    "Практическая подготовка МП",
    "Тренировка",
    "Генеральная репетиция"
  ]'
),
(
  'Организация ПМП (2 этап)',
  'ПД', 'high', 'ПС',
  '[
    "Барьерный медицинский осмотр",
    "Профессионально-психологическое тестирование",
    "КПЗ по БВС (вводный, первичный, 12 тем ТБ, фотоотчет)",
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
    "Подать данные приказов об назначении на должность в ДП ЗГТ",
    "Заполнить электронную книгу алфавитного учета",
    "Оформить служебные карточки",
    "Согласовать выдачу банковских карт"
  ]'
),
(
  'Прием молодого пополнения',
  'П', 'critical', 'ПС',
  '[
    "Рапорт на автомобильный транспорт",
    "Фотографирование воинской команды",
    "Медицинский осмотр",
    "Копии паспорта и военного билета",
    "Подготовить военные билеты и паспорта (бирки, жетоны)",
    "Собрать ВУ, загран. паспорта, дипломы (копии), ПЭК, УПК",
    "Занести ПЭК в журнал учета",
    "Подготовить рапорт на сдачу документов",
    "Проверить вещевое имущество",
    "Проверить наличие банковских карт у прибывших",
    "Заполнить заявления для Алушты и сдать в отдел кадров",
    "Сдать в строевой отдел рапорт на все виды довольствия",
    "Сдать в прод. службу 2 рапорта на котловое довольствие",
    "Подготовить 4 выписки о включении в ВАС",
    "Определить место хранения личных вещей и спальные места",
    "Выдать постельное белье",
    "Провести инструктаж",
    "Организовать питание и помывку",
    "Провести первичную беседу",
    "Установить связь с родителями (создать родительский чат)",
    "Составить рапорт о назначении на должность",
    "Получить в лазарете профилактические лекарства"
  ]'
),
(
  'Подготовка к стрельбам',
  'БП', 'high', 'КВ-1',
  '[
    "Подготовить 7 выписок из приказа (123, 6, 5 каф., НР-2)",
    "Изучение материальной части",
    "Изучение требований безопасности",
    "Изучение упражнений и нормативов",
    "Практическая тренировка в выполнении нормативов",
    "Зачет на допуск к практическим стрельбам",
    "Получить имущество по накладным согласно приказу",
    "Заявка на оружие и б/п (по рапорту)",
    "Расчет-обоснование",
    "Ведомости закрепления (передачи) оружия"
  ]'
),
(
  'Подготовка командировочных документов на агитацию',
  'А', 'high', 'КВ-2',
  '[
    "Командировочные удостоверения",
    "Удостоверения на право ознакомления",
    "Проекты соглашений",
    "Перечень ВУЗов субъектов",
    "Письма в ВУЗы для взаимодействия",
    "Печать памяток и агитационных материалов (×200)",
    "Взаимодействие с УМО по ВПО ВАС"
  ]'
)
ON CONFLICT DO NOTHING;

-- ─── 9. Добавить недостающие ежемесячные/еженедельные задачи ─
-- Эти задачи отсутствовали в seed, добавляем через frequency
-- (будут реализованы через генератор повторяющихся задач)

-- Обновляем frequency для существующих повторяющихся задач
UPDATE "tasks"
SET "frequency" = 'weekly'
WHERE "title" LIKE '%Еженедельный рапорт%'
   OR "title" LIKE '%Еженедельная проверка САВЗ%'
   OR "title" LIKE '%Рапорт о ГДП%'
   OR "title" LIKE '%Анализ электронной почты%'
   OR "title" LIKE '%Еженедельный доклад в ГУС%';

UPDATE "tasks"
SET "frequency" = 'monthly'
WHERE "title" LIKE '%Сверка личных планов%'
   OR "title" LIKE '%Сверка служебных карточек%'
   OR "title" LIKE '%Сверка листов бесед%'
   OR "title" LIKE '%Дисциплинарная практика за месяц%'
   OR "title" LIKE '%Проведение подведения итогов роты%'
   OR "title" LIKE '%Подготовка ИРС%'
   OR "title" LIKE '%Уточнение плана публикаций%'
   OR "title" LIKE '%Проверка индивидуальных планов%'
   OR "title" LIKE '%Проверка боевой подготовки%'
   OR "title" LIKE '%Проверка стенной печати%'
   OR "title" LIKE '%Подготовка материала для публикации новостей%'
   OR "title" LIKE '%Ежемесячное доведение приказа%';

UPDATE "tasks"
SET "frequency" = 'quarterly'
WHERE "title" LIKE '%Квартальная проверка%';
