import { getTasks } from "@/actions/tasks";
import { TasksList } from "@/components/tasks/TasksList";

const MONTHS = ["", "ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН", "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК"];

interface TasksPageProps {
  searchParams: Promise<{ month?: string; category?: string; responsible?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const month = params.month ? Number(params.month) : null;
  const category = params.category ?? null;
  const responsible = params.responsible ?? null;

  const allTasks = await getTasks();

  const filteredTasks = allTasks.filter((task) => {
    if (month && task.month !== month) return false;
    if (category && task.category !== category) return false;
    if (responsible && task.responsible !== responsible) return false;
    return true;
  });

  const done = filteredTasks.filter((task) => task.status === "done").length;
  const overdue = filteredTasks.filter((task) => task.status === "cancelled").length;

  return (
    <section className="space-y-4">
      <div className="glass rounded-xl border border-white/10 px-4 py-3 flex items-center gap-4 text-xs font-mono text-white/60">
        <span>ВСЕГО: <b className="text-white">{filteredTasks.length}</b></span>
        <span>ВЫПОЛНЕНО: <b className="text-emerald-400">{done}</b></span>
        <span>ПРОСРОЧЕНО: <b className="text-red-400">{overdue}</b></span>
        {month && <span>МЕСЯЦ: <b className="text-amber-400">{MONTHS[month]}</b></span>}
        {category && <span>КАТ: <b className="text-blue-400">{category}</b></span>}
        {responsible && <span>ОТВ: <b className="text-cyan-400">{responsible}</b></span>}
      </div>

      <TasksList tasks={filteredTasks} />
    </section>
  );
}
