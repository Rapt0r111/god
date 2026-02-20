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
type PersonnelCode = "КВ-1" | "КВ-2" | "СР" | "КНР" | "ЗКВ-1" | "ЗКВ-2";

interface Person {
  id:         string;
  lastName:   string;
  firstName:  string;
  patronymic: string;
  rank:       Rank;
  role:       string;
  code:       PersonnelCode;
  status:     Status;
  phone?:     string;
  tasks:      number;
  tasksDone:  number;
  specialty?: string;
}

// ── Метаданные ─────────────────────────────────────────────────────────

const STATUS_META: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: "В СТРОЮ",   color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)"  },
  "on-leave":{ label: "ОТПУСК",   color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)"  },
  sick:      { label: "Б/Л",      color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  },
  detached:  { label: "ОТКОМАНД.",color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)" },
};

const RANK_TIER: Record<Rank, { color: string; short: string }> = {
  "Полковник":         { color: "#fbbf24", short: "П-К"  },
  "Подполковник":      { color: "#f59e0b", short: "П-Л"  },
  "Майор":             { color: "#f97316", short: "МАЙ"  },
  "Капитан":           { color: "#60a5fa", short: "КПТ"  },
  "Старший лейтенант": { color: "#93c5fd", short: "СТ-Л" },
  "Лейтенант":         { color: "#bfdbfe", short: "ЛТ"   },
  "Старший прапорщик": { color: "#6ee7b7", short: "СТ-П" },
  "Прапорщик":         { color: "#a7f3d0", short: "ПРП"  },
  "Сержант":           { color: "#94a3b8", short: "СРЖ"  },
  "Младший сержант":   { color: "#94a3b8", short: "МЛ-С" },
  "Рядовой":           { color: "#64748b", short: "РДВ"  },
};

const MOCK_PERSONNEL: Person[] = [
  { id:"1", lastName:"Штатная", firstName:"единица", patronymic:"КВ-2",  rank:"Капитан",           role:"Командир взвода",      code:"КВ-2",  status:"active",   tasks:0, tasksDone:0, specialty:"Должность" },
  { id:"2", lastName:"Штатная", firstName:"единица", patronymic:"КВ-1",  rank:"Старший лейтенант", role:"Командир взвода",      code:"КВ-1",  status:"active",   tasks:0, tasksDone:0, specialty:"Должность" },
  { id:"3", lastName:"Штатная", firstName:"единица", patronymic:"СР",    rank:"Сержант",           role:"Старший расчёта",     code:"СР",    status:"active",   tasks:0, tasksDone:0, specialty:"Должность" },
  { id:"4", lastName:"Штатная", firstName:"единица", patronymic:"КНР",   rank:"Майор",             role:"Командир научной роты", code:"КНР",   status:"active",   tasks:0, tasksDone:0, specialty:"Должность" },
  { id:"5", lastName:"Штатная", firstName:"единица", patronymic:"ЗКВ-1", rank:"Старший лейтенант", role:"Зам. командира",       code:"ЗКВ-1", status:"active",   tasks:0, tasksDone:0, specialty:"Должность" },
  { id:"6", lastName:"Штатная", firstName:"единица", patronymic:"ЗКВ-2", rank:"Старший лейтенант", role:"Зам. командира",       code:"ЗКВ-2", status:"active",   tasks:0, tasksDone:0, specialty:"Должность" },
];

// ── Главный компонент ──────────────────────────────────────────────────

const ALLOWED_PERSONNEL_CODES: PersonnelCode[] = ["КВ-1", "КВ-2", "СР", "КНР", "ЗКВ-1", "ЗКВ-2"];

export default function RolesPage() {
  const [search,       setSearch      ] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [selected,     setSelected    ] = useState<Person | null>(null);
  const [viewMode,     setViewMode    ] = useState<"grid" | "list">("grid");

  const basePersonnel = useMemo(
    () => MOCK_PERSONNEL.filter((p) => ALLOWED_PERSONNEL_CODES.includes(p.code)),
    [],
  );

  const personnel = useMemo(() => {
    let list = [...basePersonnel];
    if (filterStatus !== "all") list = list.filter(p => p.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.lastName.toLowerCase().includes(q)       ||
        p.firstName.toLowerCase().includes(q)      ||
        p.role.toLowerCase().includes(q)           ||
        p.code.toLowerCase().includes(q)           ||
        (p.specialty ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [basePersonnel, search, filterStatus]);

  const stats = useMemo(() => ({
    total:    basePersonnel.length,
    active:   basePersonnel.filter(p => p.status === "active").length,
    onLeave:  basePersonnel.filter(p => p.status === "on-leave").length,
    sick:     basePersonnel.filter(p => p.status === "sick").length,
    detached: basePersonnel.filter(p => p.status === "detached").length,
    tasksBusy:basePersonnel.filter(p => p.tasks > 0).length,
  }), [basePersonnel]);

  const STAT_ITEMS = [
    { label: "ВСЕГО Л/С",  value: stats.total,    color: "#93c5fd" },
    { label: "В СТРОЮ",    value: stats.active,   color: "#10b981" },
    { label: "ОТПУСК",     value: stats.onLeave,  color: "#3b82f6" },
    { label: "Б/Л",        value: stats.sick,     color: "#f59e0b" },
    { label: "ОТКОМАНД.",  value: stats.detached, color: "#a78bfa" },
    { label: "ПРИ ЗАДАЧАХ",value: stats.tasksBusy,color: "#f97316" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── HEADER ── */}
      <div
        className="px-5 pt-4 pb-3 space-y-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Статистика */}
        <div className="grid grid-cols-6 gap-2.5">
          {STAT_ITEMS.map(s => (
            <div
              key={s.label}
              className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
              style={{
                background: `${s.color}08`,
                border: `1px solid ${s.color}18`,
                backdropFilter: "blur(12px)",
              }}
            >
              <span
                className="text-[26px] font-bold font-mono tabular-nums leading-none"
                style={{
                  color: s.color,
                  textShadow: `0 0 20px ${s.color}40`,
                }}
              >
                {s.value}
              </span>
              <span
                className="text-[8px] font-mono tracking-[1.5px] uppercase leading-tight"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Фильтры */}
        <div className="flex items-center gap-3">
          {/* Поиск */}
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              ⌕
            </span>
            <input
              type="text"
              placeholder="Поиск по л/с..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg text-[12px] outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e8f0fe",
                width: 200,
              }}
            />
          </div>

          {/* Фильтры статуса */}
          <div className="flex gap-1">
            {([
              ["all",       "ВСЕ"],
              ["active",    "В СТРОЮ"],
              ["on-leave",  "ОТПУСК"],
              ["sick",      "Б/Л"],
              ["detached",  "ОТКОМАНД."],
            ] as const).map(([val, label]) => {
              const isActive = filterStatus === val;
              const meta = val !== "all" ? STATUS_META[val as Status] : null;
              return (
                <button
                  key={val}
                  onClick={() => setFilterStatus(val as Status | "all")}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono tracking-wide transition-all"
                  style={isActive ? {
                    background: meta ? meta.bg : "rgba(59,130,246,0.15)",
                    border: `1px solid ${meta ? meta.border : "rgba(59,130,246,0.35)"}`,
                    color: meta ? meta.color : "#93c5fd",
                  } : {
                    border: "1px solid transparent",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Переключатель вида */}
          <div
            className="flex gap-1 ml-auto p-1 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {(["grid", "list"] as const).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className="px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wide transition-all"
                style={viewMode === v ? {
                  background: "rgba(59,130,246,0.2)",
                  color: "#93c5fd",
                  border: "1px solid rgba(59,130,246,0.3)",
                } : {
                  color: "rgba(255,255,255,0.3)",
                  border: "1px solid transparent",
                }}
              >
                {v === "grid" ? "⊞ КАРТОЧКИ" : "≡ ТАБЛИЦА"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto p-5">
        {viewMode === "grid"
          ? <GridView   personnel={personnel} onSelect={setSelected} selected={selected} />
          : <ListView   personnel={personnel} onSelect={setSelected} selected={selected} />
        }
      </div>

      {/* ── MODAL ── */}
      {selected && (
        <PersonModal person={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ── GridView ───────────────────────────────────────────────────────────

function GridView({
  personnel,
  onSelect,
  selected,
}: {
  personnel: Person[];
  onSelect:  (p: Person) => void;
  selected:  Person | null;
}) {
  if (personnel.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
      {personnel.map(person => {
        const st       = STATUS_META[person.status];
        const rank     = RANK_TIER[person.rank];
        const initials = person.lastName[0] + person.firstName[0];
        const total    = person.tasksDone + person.tasks;
        const progress = total > 0 ? (person.tasksDone / total) * 100 : 0;
        const isSelected = selected?.id === person.id;
        const isActive   = person.status === "active";

        return (
          <div
            key={person.id}
            onClick={() => onSelect(person)}
            className="rounded-2xl p-4.5 cursor-pointer transition-all duration-200 relative overflow-hidden"
            style={{
              background: isSelected
                ? "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.06))"
                : "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              border: isSelected
                ? "1px solid rgba(59,130,246,0.4)"
                : isActive
                  ? "1px solid rgba(255,255,255,0.09)"
                  : "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(20px)",
              boxShadow: isSelected
                ? "0 4px 24px rgba(59,130,246,0.15), 0 1px 0 rgba(255,255,255,0.06) inset"
                : "0 2px 12px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.05) inset",
              opacity: isActive ? 1 : 0.7,
              padding: "18px 20px",
            }}
          >
            {/* Шапка карточки */}
            <div className="flex items-start justify-between mb-4">
              <div className="relative">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-[17px] font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${rank.color}25, ${rank.color}10)`,
                    border: `1px solid ${rank.color}25`,
                    color: "#e8f0fe",
                    boxShadow: `0 4px 12px ${rank.color}15`,
                  }}
                >
                  {initials}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
                  style={{
                    background: st.color,
                    border: "2px solid rgba(7,13,26,0.9)",
                    boxShadow: `0 0 6px ${st.color}60`,
                  }}
                />
              </div>

              <span
                className="text-[8px] font-mono font-semibold tracking-wider px-2 py-1 rounded-lg"
                style={{
                  color: st.color,
                  background: st.bg,
                  border: `1px solid ${st.border}`,
                }}
              >
                {st.label}
              </span>
            </div>

            {/* Имя */}
            <div className="mb-3">
              <p
                className="text-[15px] font-bold leading-tight mb-0.5"
                style={{ color: "#e8f0fe" }}
              >
                {person.lastName}
              </p>
              <p
                className="text-[11px]"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {person.firstName} {person.patronymic}
              </p>
            </div>

            {/* Звание + должность */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    color: rank.color,
                    background: `${rank.color}15`,
                    border: `1px solid ${rank.color}25`,
                  }}
                >
                  {rank.short}
                </span>
                <span
                  className="text-[11px] truncate"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {person.rank}
                </span>
              </div>
              <p
                className="text-[11px] leading-snug"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {person.role}
              </p>
              {person.specialty && (
                <p
                  className="text-[10px] font-mono"
                  style={{ color: "rgba(59,130,246,0.6)" }}
                >
                  {person.specialty}
                </p>
              )}
            </div>

            {/* Прогресс задач */}
            <div>
              <div className="flex justify-between text-[9px] font-mono mb-1.5">
                <span style={{ color: "rgba(255,255,255,0.3)" }}>ЗАДАЧИ</span>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>
                  {person.tasksDone} / {total}
                </span>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    background: progress === 100
                      ? "#10b981"
                      : progress > 50
                        ? "#3b82f6"
                        : "#f59e0b",
                    boxShadow: progress === 100 ? "0 0 6px rgba(16,185,129,0.4)" : "none",
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

function ListView({
  personnel,
  onSelect,
  selected,
}: {
  personnel: Person[];
  onSelect:  (p: Person) => void;
  selected:  Person | null;
}) {
  if (personnel.length === 0) return <EmptyState />;

  return (
    <div className="space-y-1">
      {/* Заголовок таблицы */}
      <div
        className="grid gap-3 px-4 py-2 text-[9px] font-mono tracking-[1.5px] uppercase"
        style={{
          gridTemplateColumns: "2fr 1fr 1fr 1fr 100px 80px",
          color: "rgba(255,255,255,0.25)",
        }}
      >
        <span>ФИО / ДОЛЖНОСТЬ</span>
        <span>ЗВАНИЕ</span>
        <span>КОД</span>
        <span>СПЕЦИАЛИЗАЦИЯ</span>
        <span>СТАТУС</span>
        <span>ЗАДАЧИ</span>
      </div>

      {personnel.map(person => {
        const st         = STATUS_META[person.status];
        const rank       = RANK_TIER[person.rank];
        const isSelected = selected?.id === person.id;
        const isActive   = person.status === "active";

        return (
          <div
            key={person.id}
            onClick={() => onSelect(person)}
            className="grid gap-3 px-4 py-3 rounded-xl cursor-pointer items-center transition-all duration-150"
            style={{
              gridTemplateColumns: "2fr 1fr 1fr 1fr 100px 80px",
              background: isSelected
                ? "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.05))"
                : "rgba(255,255,255,0.025)",
              border: isSelected
                ? "1px solid rgba(59,130,246,0.3)"
                : "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(12px)",
              opacity: isActive ? 1 : 0.65,
            }}
          >
            {/* ФИО */}
            <div>
              <p
                className="text-[13px] font-semibold mb-0.5"
                style={{ color: "#e8f0fe" }}
              >
                {person.lastName} {person.firstName[0]}. {person.patronymic[0]}.
              </p>
              <p
                className="text-[11px]"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {person.role}
              </p>
            </div>

            {/* Звание */}
            <div className="flex items-center gap-1.5">
              <span
                className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0"
                style={{
                  color: rank.color,
                  background: `${rank.color}15`,
                  border: `1px solid ${rank.color}25`,
                }}
              >
                {rank.short}
              </span>
              <span
                className="text-[11px] truncate"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {person.rank}
              </span>
            </div>

            {/* Код */}
            <span
              className="text-[12px] font-mono font-semibold"
              style={{ color: "#93c5fd" }}
            >
              {person.code}
            </span>

            {/* Специализация */}
            <span
              className="text-[11px] truncate"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {person.specialty ?? "—"}
            </span>

            {/* Статус */}
            <span
              className="text-[9px] font-mono font-semibold px-2 py-1 rounded-lg w-fit"
              style={{
                color: st.color,
                background: st.bg,
                border: `1px solid ${st.border}`,
              }}
            >
              {st.label}
            </span>

            {/* Задачи */}
            <span className="text-[12px] font-mono tabular-nums">
              <span style={{ color: "#34d399" }}>{person.tasksDone}</span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}> / </span>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>
                {person.tasksDone + person.tasks}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── PersonModal ────────────────────────────────────────────────────────

function PersonModal({
  person,
  onClose,
}: {
  person:  Person;
  onClose: () => void;
}) {
  const st       = STATUS_META[person.status];
  const rank     = RANK_TIER[person.rank];
  const initials = person.lastName[0] + person.firstName[0];
  const total    = person.tasksDone + person.tasks;
  const progress = total > 0 ? (person.tasksDone / total) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl animate-scale-in"
        style={{
          background: "linear-gradient(145deg, rgba(13,24,41,0.98), rgba(7,13,26,0.95))",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.08) inset",
          padding: "24px",
        }}
      >
        {/* Шапка */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-[24px] font-bold shrink-0"
            style={{
              background: `linear-gradient(135deg, ${rank.color}30, ${rank.color}10)`,
              border: `1px solid ${rank.color}30`,
              color: "#e8f0fe",
              boxShadow: `0 8px 24px ${rank.color}15`,
            }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="text-[9px] font-mono tracking-[2.5px] uppercase mb-1.5"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              // ЛИЧНАЯ КАРТОЧКА
            </p>
            <h3
              className="text-[20px] font-bold leading-tight mb-0.5"
              style={{ color: "#e8f0fe" }}
            >
              {person.lastName}
            </h3>
            <p
              className="text-[13px]"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {person.firstName} {person.patronymic}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[18px] transition-all shrink-0"
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.4)",
            }}
            title="Закрыть"
          >
            ×
          </button>
        </div>

        {/* Статус */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
          style={{
            background: st.bg,
            border: `1px solid ${st.border}`,
          }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
            style={{ background: st.color, boxShadow: `0 0 8px ${st.color}60` }}
          />
          <span
            className="text-[12px] font-mono font-semibold tracking-wider"
            style={{ color: st.color }}
          >
            {st.label}
          </span>
        </div>

        {/* Детали */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {[
            { label: "ЗВАНИЕ",        value: person.rank,        color: rank.color  },
            { label: "ДОЛЖНОСТЬ",     value: person.role,        color: "#e8f0fe"   },
            { label: "КОД",           value: person.code,        color: "#93c5fd"   },
            { label: "СПЕЦИАЛИЗАЦИЯ", value: person.specialty ?? "—", color: "#93c5fd" },
            ...(person.phone ? [{ label: "ТЕЛЕФОН", value: person.phone, color: "#e8f0fe" }] : []),
          ].map(row => (
            <div
              key={row.label}
              className="rounded-xl p-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p
                className="text-[8px] font-mono tracking-[1.5px] uppercase mb-1.5"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                {row.label}
              </p>
              <p
                className="text-[12px] font-semibold font-mono truncate"
                style={{ color: row.color }}
              >
                {row.value}
              </p>
            </div>
          ))}
        </div>

        {/* Прогресс задач */}
        <div
          className="rounded-xl p-4 mb-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex justify-between text-[9px] font-mono mb-2">
            <span style={{ color: "rgba(255,255,255,0.3)" }}>// ВЫПОЛНЕНИЕ ЗАДАЧ</span>
            <span>
              <span style={{ color: "#34d399" }}>{person.tasksDone}</span>
              <span style={{ color: "rgba(255,255,255,0.25)" }}> из </span>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>{total}</span>
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden mb-1.5"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: progress === 100
                  ? "linear-gradient(90deg, #10b981, #34d399)"
                  : "linear-gradient(90deg, #3b82f6, #60a5fa)",
                boxShadow: progress === 100 ? "0 0 8px rgba(16,185,129,0.4)" : "none",
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono">
            <span style={{ color: "rgba(255,255,255,0.25)" }}>{Math.round(progress)}% завершено</span>
            {person.tasks > 0 && (
              <span style={{ color: "#f59e0b" }}>{person.tasks} активных</span>
            )}
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-2.5">
          <button
            className="flex-1 py-2.5 rounded-xl text-[11px] font-mono tracking-wider transition-all"
            style={{
              border: "1px solid rgba(59,130,246,0.3)",
              background: "rgba(59,130,246,0.08)",
              color: "#93c5fd",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(59,130,246,0.15)";
              e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(59,130,246,0.08)";
              e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
            }}
          >
            ◫ ЗАДАЧИ Л/С
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-[11px] font-mono transition-all"
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20"
      style={{ color: "rgba(255,255,255,0.2)" }}
    >
      <div className="text-5xl mb-4 opacity-30">◉</div>
      <p className="text-[13px] font-mono tracking-wider">// ЛИЧНЫЙ СОСТАВ НЕ НАЙДЕН</p>
      <p className="text-[11px] mt-2 opacity-70">Попробуйте изменить фильтры</p>
    </div>
  );
}