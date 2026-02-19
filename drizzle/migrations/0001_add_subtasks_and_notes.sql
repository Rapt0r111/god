-- drizzle/migrations/0001_add_subtasks_and_notes.sql
-- Добавляем поля описания и примечаний к задачам
ALTER TABLE "tasks"
  ADD COLUMN IF NOT EXISTS "description" text,
  ADD COLUMN IF NOT EXISTS "notes"       text;

-- Создаём таблицу подзадач
CREATE TABLE IF NOT EXISTS "subtasks" (
  "id"           serial PRIMARY KEY,
  "task_id"      integer NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
  "title"        text NOT NULL,
  "description"  text,
  "status"       "status" NOT NULL DEFAULT 'pending',
  "order"        integer NOT NULL DEFAULT 0,
  "completed_at" timestamp,
  "completed_by" text REFERENCES "users"("id"),
  "created_at"   timestamp DEFAULT now() NOT NULL,
  "updated_at"   timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "subtasks_task_idx"  ON "subtasks" ("task_id");
CREATE INDEX IF NOT EXISTS "subtasks_order_idx" ON "subtasks" ("task_id", "order");

-- Переносим строковые подзадачи из старого jsonb-поля в новую таблицу
-- (если поле subtasks ещё существует)
DO $$
DECLARE
  r     record;
  sub   text;
  i     integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'subtasks'
  ) THEN
    FOR r IN SELECT id, subtasks FROM tasks WHERE subtasks IS NOT NULL AND subtasks::text != 'null' LOOP
      i := 0;
      FOR sub IN SELECT jsonb_array_elements_text(r.subtasks::jsonb) LOOP
        INSERT INTO subtasks (task_id, title, "order")
        VALUES (r.id, sub, i)
        ON CONFLICT DO NOTHING;
        i := i + 1;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- Удаляем старое jsonb-поле (раскомментировать после проверки данных)
-- ALTER TABLE "tasks" DROP COLUMN IF EXISTS "subtasks";
