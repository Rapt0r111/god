// src/app/roles/page.tsx
"use client";

import { useState, useMemo } from "react";

// ── Типы ──────────────────────────────────────────────────────────────

type Rank =
  | "Полковник" | "Подполковник" | "Майор"
  | "Капитан" | "Старший лейтенант" | "Лейтенант"
  | "Прапорщик" | "Старший прапорщик"
  | "Сержант" | "Младший сержант" | "Рядовой";

type Status = "active" | "on-leave" | "sick" | "detached";

interface Person {
  id:          string;
  lastName:    string;
  firstName:   string;
  patronymic:  string;
  rank:        Rank;
  role:        string;       // должность
  code:        string;       // краткий код КВ-2, ЗКВ-2, ПС…
  status:      Status;
  phone?:      string;
  tasks:       number;       // кол-во активных задач
  tasksDone:   number;
  specialty?:  string;
}

// ── Константы ─────────────────────────────────────────────────────────

const STATUS_META: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: "В СТРОЮ",    color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.3)"  },
  "on-leave":{ label: "В ОТПУСКЕ", color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.3)"  },
  sick:      { label: "НА Б/Л",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  detached:  { label: "ОТКОМАНД.", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.3)" },
};

const RANK_TIER: Record<Rank, { color: string; short: string }> = {
  "Полковник":          { color: "#fbbf24", short: "П-К"  },
  "Подполковник":       { color: "#f59e0b", short: "П-Л"  },
  "Майор":              { color: "#f97316", short: "МАЙ"  },
  "Капитан":            { color: "#60a5fa", short: "КПТ"  },
  "Старший лейтенант":  { color: "#93c5fd", short: "СТ-Л" },
  "Лейтенант":          { color: "#bfdbfe", short: "ЛТ"   },
  "Старший прапорщик":  { color: "#6ee7b7", short: "СТ-П" },
  "Прапорщик":          { color: "#a7f3d0", short: "ПРП"  },
  "Сержант":            { color: "#94a3b8", short: "СРЖ"  },
  "Младший сержант":    { color: "#94a3b8", short: "МЛ-С" },
  "Рядовой":            { color: "#64748b", short: "РДВ"  },
};

const MOCK_PERSONNEL: Person[] = [
  {
    id: "1", lastName: "Алексеев", firstName: "Сергей", patronymic: "Павлович",
    rank: "Капитан", role: "Командир взвода", code: "КВ-2",
    status: "active", phone: "+7-900-101-00-01", tasks: 3, tasksDone: 10, specialty: "Куратор КВ-1",
  },
  {
    id: "2", lastName: "Белов", firstName: "Игорь", patronymic: "Иванович",
    rank: "Старший лейтенант", role: "Командир взвода", code: "КВ-1",
    status: "active", phone: "+7-900-101-00-02", tasks: 5, tasksDone: 12, specialty: "Работает с ЗКВ-2",
  },
  {
    id: "3", lastName: "Воронов", firstName: "Павел", patronymic: "Андреевич",
    rank: "Старший лейтенант", role: "Зам. командира", code: "ЗКВ-2",
    status: "active", phone: "+7-900-101-00-03", tasks: 4, tasksDone: 11, specialty: "Работает с КВ-1",
  },
  {
    id: "4", lastName: "Громов", firstName: "Роман", patronymic: "Васильевич",
    rank: "Старший лейтенант", role: "Командир взвода", code: "КВ-1",
    status: "active", phone: "+7-900-101-00-04", tasks: 4, tasksDone: 9, specialty: "Работает с ЗКВ-2",
  },
  {
    id: "5", lastName: "Данилов", firstName: "Антон", patronymic: "Львович",
    rank: "Старший лейтенант", role: "Командир взвода", code: "КВ-1",
    status: "active", phone: "+7-900-101-00-05", tasks: 3, tasksDone: 8, specialty: "Работает с ЗКВ-2",
  },
  {
    id: "6", lastName: "Елисеев", firstName: "Дмитрий", patronymic: "Олегович",
    rank: "Сержант", role: "Старший расчёта", code: "СР",
    status: "active", phone: "+7-900-101-00-06", tasks: 2, tasksDone: 6, specialty: "Работает с ЗКВ-1",
  },
  {
    id: "7", lastName: "Жуков", firstName: "Кирилл", patronymic: "Максимович",
    rank: "Старший лейтенант", role: "Командир взвода", code: "КВ-1",
    status: "active", phone: "+7-900-101-00-07", tasks: 4, tasksDone: 10, specialty: "Работает с ЗКВ-1",
  },
  {
    id: "8", lastName: "Зимин", firstName: "Олег", patronymic: "Юрьевич",
    rank: "Майор", role: "Командир научной роты", code: "КНР",
    status: "active", phone: "+7-900-101-00-08", tasks: 1, tasksDone: 5, specialty: "Общий контроль",
  },
  {
    id: "9", lastName: "Иванов", firstName: "Максим", patronymic: "Георгиевич",
    rank: "Старший лейтенант", role: "Зам. командира", code: "ЗКВ-1",
    status: "active", phone: "+7-900-101-00-09", tasks: 4, tasksDone: 10, specialty: "Работает с КВ-1",
  },
  {
    id: "10", lastName: "Калинин", firstName: "Андрей", patronymic: "Степанович",
    rank: "Старший лейтенант", role: "Зам. командира", code: "ЗКВ-1",
    status: "active", phone: "+7-900-101-00-10", tasks: 3, tasksDone: 7, specialty: "Работает с ЗКВ-2",
  },
  {
    id: "11", lastName: "Ларионов", firstName: "Илья", patronymic: "Сергеевич",
    rank: "Старший лейтенант", role: "Командир взвода", code: "КВ-1",
    status: "active", phone: "+7-900-101-00-11", tasks: 4, tasksDone: 9, specialty: "Работает с ЗКВ-2",
  },
  {
    id: "12", lastName: "Мельник", firstName: "Артём", patronymic: "Петрович",
    rank: "Сержант", role: "Старший расчёта", code: "СР",
    status: "active", phone: "+7-900-101-00-12", tasks: 2, tasksDone: 5, specialty: "Работает с ЗКВ-1",
  },
  {
    id: "13", lastName: "Никитин", firstName: "Вадим", patronymic: "Денисович",
    rank: "Старший лейтенант", role: "Зам. командира", code: "ЗКВ-1",
    status: "active", phone: "+7-900-101-00-13", tasks: 3, tasksDone: 8, specialty: "Работает с СР",
  },
  {
    id: "14", lastName: "Орлов", firstName: "Тимур", patronymic: "Анатольевич",
    rank: "Старший лейтенант", role: "Зам. командира", code: "ЗКВ-1",
    status: "active", phone: "+7-900-101-00-14", tasks: 3, tasksDone: 8, specialty: "Работает с СР",
  },
  {
    id: "15", lastName: "Панин", firstName: "Даниил", patronymic: "Михайлович",
    rank: "Старший лейтенант", role: "Зам. командира", code: "ЗКВ-2",
    status: "active", phone: "+7-900-101-00-15", tasks: 3, tasksDone: 9, specialty: "Работает с ЗКВ-1",
  },
];

// ── Главный компонент ──────────────────────────────────────────────────

export default function RolesPage() {
  const [search,       setSearch      ] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [selected,     setSelected    ] = useState<Person | null>(null);
  const [viewMode,     setViewMode    ] = useState<"grid" | "list">("grid");

  const personnel = useMemo(() => {
    let list = [...MOCK_PERSONNEL];
    if (filterStatus !== "all") list = list.filter(p => p.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.lastName.toLowerCase().includes(q)   ||
        p.firstName.toLowerCase().includes(q)  ||
        p.role.toLowerCase().includes(q)       ||
        p.code.toLowerCase().includes(q)       ||
        (p.specialty ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, filterStatus]);

  const stats = useMemo(() => ({
    total:     MOCK_PERSONNEL.length,
    active:    MOCK_PERSONNEL.filter(p => p.status === "active").length,
    onLeave:   MOCK_PERSONNEL.filter(p => p.status === "on-leave").length,
    sick:      MOCK_PERSONNEL.filter(p => p.status === "sick").length,
    detached:  MOCK_PERSONNEL.filter(p => p.status === "detached").length,
    tasksBusy: MOCK_PERSONNEL.filter(p => p.tasks > 0).length,
  }), []);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── HEADER ──────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 border-b border-white/10 space-y-4">

        {/* Статистика */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: "ВСЕГО Л/С",  value: stats.total,    color: "#60a5fa" },
            { label: "В СТРОЮ",    value: stats.active,   color: "#10b981" },
            { label: "В ОТПУСКЕ", value: stats.onLeave,  color: "#3b82f6" },
            { label: "НА Б/Л",    value: stats.sick,     color: "#f59e0b" },
            { label: "ОТКОМАНД.", value: stats.detached, color: "#a78bfa" },
            { label: "ПРИ ЗАДАЧ", value: stats.tasksBusy,color: "#f97316" },
          ].map(s => (
            <div key={s.label}
              className="glass rounded-xl px-4 py-3 border border-white/8 flex items-center gap-3"
            >
              <span className="text-[26px] font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[9px] text-white/35 tracking-[1.5px] uppercase font-mono leading-tight">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Фильтры */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">⌕</span>
            <input
              type="text"
              placeholder="Поиск по л/с..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 w-[220px]"
            />
          </div>

          <div className="flex gap-1">
            {([["all","ВСЕ"], ["active","В СТРОЮ"], ["on-leave","ОТПУСК"], ["sick","Б/Л"], ["detached","ОТКОМАНД."]] as const).map(([val, label]) => (
              <button key={val}
                onClick={() => setFilterStatus(val as Status | "all")}
                className={[
                  "px-3 py-1.5 rounded-lg text-[11px] font-mono tracking-wide transition-all",
                  filterStatus === val
                    ? val === "all"
                      ? "bg-blue-500/20 border border-blue-500/40 text-blue-400"
                      : `border text-white`
                    : "text-white/40 hover:text-white/70 hover:bg-white/8 border border-transparent",
                ].join(" ")}
                style={filterStatus === val && val !== "all" ? {
                  background: STATUS_META[val as Status].bg,
                  borderColor: STATUS_META[val as Status].border,
                  color: STATUS_META[val as Status].color,
                } : {}}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 ml-auto">
            {(["grid","list"] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={[
                  "px-3 py-1.5 rounded-lg text-[11px] font-mono tracking-wide transition-all",
                  viewMode === v
                    ? "bg-blue-500/20 border border-blue-500/40 text-blue-400"
                    : "text-white/40 hover:text-white/70 hover:bg-white/8",
                ].join(" ")}
              >
                {v === "grid" ? "⊞ КАРТОЧКИ" : "≡ ТАБЛИЦА"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === "grid"
          ? <GridView   personnel={personnel} onSelect={setSelected} selected={selected} />
          : <ListView   personnel={personnel} onSelect={setSelected} selected={selected} />
        }
      </div>

      {/* ── PERSON MODAL ─────────────────────────────────── */}
      {selected && (
        <PersonModal person={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ── GridView ───────────────────────────────────────────────────────────

function GridView({ personnel, onSelect, selected }: {
  personnel: Person[]; onSelect: (p: Person) => void; selected: Person | null;
}) {
  if (personnel.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {personnel.map(person => {
        const st   = STATUS_META[person.status];
        const rank = RANK_TIER[person.rank];
        const initials = person.lastName[0] + person.firstName[0];
        const progress = person.tasksDone + person.tasks > 0
          ? (person.tasksDone / (person.tasksDone + person.tasks)) * 100
          : 0;
        const isSelected = selected?.id === person.id;

        return (
          <div key={person.id}
            onClick={() => onSelect(person)}
            className={[
              "glass-elevated rounded-2xl p-5 border cursor-pointer transition-all hover:scale-[1.01]",
              isSelected
                ? "border-blue-500/50 shadow-lg shadow-blue-500/10"
                : person.status !== "active"
                  ? "border-white/8 opacity-75"
                  : "border-white/10 hover:border-white/20",
            ].join(" ")}
          >
            {/* Аватар + статус */}
            <div className="flex items-start justify-between mb-4">
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-[18px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${rank.color}25, ${rank.color}10)`, border: `1px solid ${rank.color}30` }}
                >
                  {initials}
                </div>
                <span
                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-800"
                  style={{ background: st.color }}
                />
              </div>
              <span
                className="text-[9px] px-2 py-1 rounded-lg font-mono tracking-wide"
                style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
              >
                {st.label}
              </span>
            </div>

            {/* Имя */}
            <div className="mb-3">
              <p className="text-[15px] font-bold text-white leading-tight">
                {person.lastName}
              </p>
              <p className="text-[12px] text-white/60">
                {person.firstName} {person.patronymic}
              </p>
            </div>

            {/* Звание + должность */}
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                  style={{ color: rank.color, background: `${rank.color}15`, border: `1px solid ${rank.color}25` }}
                >
                  {rank.short}
                </span>
                <span className="text-[11px] text-white/50">{person.rank}</span>
              </div>
              <p className="text-[11px] text-white/70 leading-tight">{person.role}</p>
              {person.specialty && (
                <p className="text-[10px] text-blue-400/60 font-mono">{person.specialty}</p>
              )}
            </div>

            {/* Задачи прогресс */}
            <div>
              <div className="flex justify-between text-[10px] text-white/40 font-mono mb-1.5">
                <span>ЗАДАЧИ</span>
                <span className="text-white/60">{person.tasksDone} / {person.tasksDone + person.tasks}</span>
              </div>
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    background: progress === 100
                      ? "#10b981"
                      : progress > 50
                        ? "#3b82f6"
                        : "#f59e0b",
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── ListView ───────────────────────────────────────────────────────────

function ListView({ personnel, onSelect, selected }: {
  personnel: Person[]; onSelect: (p: Person) => void; selected: Person | null;
}) {
  if (personnel.length === 0) return <EmptyState />;

  return (
    <div className="space-y-1">
      {/* Заголовок */}
      <div className="grid gap-3 px-4 py-2 text-[10px] text-white/30 tracking-[1.5px] uppercase font-mono"
        style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 100px 80px" }}
      >
        <span>ФИО / ДОЛЖНОСТЬ</span>
        <span>ЗВАНИЕ</span>
        <span>КОД</span>
        <span>СПЕЦИАЛИЗАЦИЯ</span>
        <span>СТАТУС</span>
        <span>ЗАДАЧИ</span>
      </div>

      {personnel.map(person => {
        const st     = STATUS_META[person.status];
        const rank   = RANK_TIER[person.rank];
        const isSelected = selected?.id === person.id;

        return (
          <div key={person.id}
            onClick={() => onSelect(person)}
            className={[
              "grid gap-3 px-4 py-3 rounded-xl border cursor-pointer items-center transition-all",
              isSelected
                ? "border-blue-500/30 bg-blue-500/8"
                : "border-white/8 glass hover:bg-white/5",
              person.status !== "active" ? "opacity-70" : "",
            ].join(" ")}
            style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 100px 80px" }}
          >
            {/* ФИО */}
            <div>
              <p className="text-[13px] font-semibold text-white">
                {person.lastName} {person.firstName[0]}. {person.patronymic[0]}.
              </p>
              <p className="text-[11px] text-white/50">{person.role}</p>
            </div>

            {/* Звание */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                style={{ color: rank.color, background: `${rank.color}15`, border: `1px solid ${rank.color}25` }}
              >
                {rank.short}
              </span>
              <span className="text-[11px] text-white/50 truncate">{person.rank}</span>
            </div>

            {/* Код */}
            <span className="text-[12px] font-mono text-blue-400/80">{person.code}</span>

            {/* Специализация */}
            <span className="text-[11px] text-white/40 truncate">{person.specialty ?? "—"}</span>

            {/* Статус */}
            <span className="text-[10px] px-2 py-1 rounded-lg font-mono w-fit"
              style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
            >
              {st.label}
            </span>

            {/* Задачи */}
            <span className="text-[12px] font-mono">
              <span className="text-emerald-400">{person.tasksDone}</span>
              <span className="text-white/25"> / </span>
              <span className="text-white/60">{person.tasksDone + person.tasks}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── PersonModal ────────────────────────────────────────────────────────

function PersonModal({ person, onClose }: { person: Person; onClose: () => void }) {
  const st     = STATUS_META[person.status];
  const rank   = RANK_TIER[person.rank];
  const initials = person.lastName[0] + person.firstName[0];
  const progress = person.tasksDone + person.tasks > 0
    ? (person.tasksDone / (person.tasksDone + person.tasks)) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-elevated rounded-2xl border border-white/15 w-full max-w-md p-6 shadow-2xl">

        {/* Шапка */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-[24px] font-bold text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${rank.color}30, ${rank.color}10)`, border: `1px solid ${rank.color}35` }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/30 tracking-[2px] uppercase font-mono mb-1">// ЛИЧНАЯ КАРТОЧКА</p>
            <h3 className="text-[20px] font-bold text-white leading-tight">
              {person.lastName}
            </h3>
            <p className="text-[14px] text-white/60">
              {person.firstName} {person.patronymic}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/15 text-white/50 hover:text-white hover:bg-white/8 transition-all text-[18px] shrink-0"
          >
            ×
          </button>
        </div>

        {/* Статус */}
        <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl"
          style={{ background: st.bg, border: `1px solid ${st.border}` }}
        >
          <span className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" style={{ background: st.color }} />
          <span className="text-[12px] font-semibold font-mono" style={{ color: st.color }}>{st.label}</span>
        </div>

        {/* Детали */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "ЗВАНИЕ",       value: person.rank,        color: rank.color },
            { label: "ДОЛЖНОСТЬ",    value: person.role,        color: "#e2e8f0"  },
            { label: "КОД",          value: person.code,        color: "#60a5fa"  },
            { label: "СПЕЦИАЛИЗАЦИЯ",value: person.specialty ?? "—", color: "#93c5fd" },
            ...(person.phone
              ? [{ label: "ТЕЛЕФОН", value: person.phone, color: "#e2e8f0" }]
              : []
            ),
          ].map(row => (
            <div key={row.label} className="glass rounded-xl p-3 border border-white/8">
              <p className="text-[9px] text-white/30 tracking-[1.5px] uppercase mb-1 font-mono">{row.label}</p>
              <p className="text-[12px] font-semibold font-mono truncate" style={{ color: row.color }}>{row.value}</p>
            </div>
          ))}
        </div>

        {/* Задачи прогресс */}
        <div className="glass rounded-xl p-4 border border-white/8 mb-5">
          <div className="flex justify-between text-[10px] font-mono mb-2">
            <span className="text-white/30 tracking-wide">// ВЫПОЛНЕНИЕ ЗАДАЧ</span>
            <span className="text-white/70">
              <span className="text-emerald-400">{person.tasksDone}</span>
              <span className="text-white/30"> из </span>
              <span>{person.tasksDone + person.tasks}</span>
            </span>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: progress === 100
                  ? "#10b981"
                  : `linear-gradient(to right, #3b82f6, #60a5fa)`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/30 font-mono mt-1.5">
            <span>{Math.round(progress)}% завершено</span>
            {person.tasks > 0 && (
              <span className="text-amber-400">{person.tasks} активных</span>
            )}
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-2">
          <button className="flex-1 py-2 rounded-xl border border-blue-500/35 text-blue-400 bg-blue-500/10 text-[12px] font-medium tracking-wide hover:bg-blue-500/20 transition-all font-mono">
            ◫ ЗАДАЧИ Л/С
          </button>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/15 text-white/50 text-[12px] hover:bg-white/8 transition-all"
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Пустое состояние ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-white/30">
      <span className="text-5xl mb-4 opacity-40">◉</span>
      <p className="text-[13px] font-mono tracking-wide">// ЛИЧНЫЙ СОСТАВ НЕ НАЙДЕН</p>
      <p className="text-[11px] mt-1">Попробуйте изменить фильтры</p>
    </div>
  );
}
