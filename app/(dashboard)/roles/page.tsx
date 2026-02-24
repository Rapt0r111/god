"use client";

// app/(dashboard)/roles/page.tsx — Vision 2026 · Unified design

import { useEffect, useMemo, useState } from "react";
import { getTasksByResponsible } from "@/actions/tasks";

// ── Types ──────────────────────────────────────────────────────────────

type Status = "active" | "on-leave" | "sick" | "detached";
type PersonnelCode = "КВ-1" | "КВ-2" | "СР" | "КНР" | "ЗКВ-1" | "ЗКВ-2" | "КО-2";

interface Person {
  id: string; lastName: string; firstName: string; patronymic: string;
  rank: string; role: string; code: PersonnelCode; status: Status;
  tasks: number; tasksDone: number; specialty?: string;
}

interface AssignedTask {
  id: number; title: string;
  status: "pending" | "in_progress" | "done" | "cancelled";
  month: number; dateFrom: number; dateTo: number;
  priority: "critical" | "high" | "normal";
  category: string;
  subtasks: Array<{ id: number; title: string; description: string | null; status: "pending" | "in_progress" | "done" | "cancelled" }>;
}

// ── Metadata ────────────────────────────────────────────────────────────

const STATUS_META: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  active:     { label: "В СТРОЮ",    color: "oklch(72% 0.17 155)", bg: "oklch(72% 0.17 155 / 0.10)", border: "oklch(72% 0.17 155 / 0.24)" },
  "on-leave": { label: "ОТПУСК",    color: "oklch(68% 0.18 232)", bg: "oklch(68% 0.18 232 / 0.10)", border: "oklch(68% 0.18 232 / 0.24)" },
  sick:       { label: "Б/Л",       color: "oklch(75% 0.18 75)",  bg: "oklch(75% 0.18 75 / 0.10)",  border: "oklch(75% 0.18 75 / 0.24)"  },
  detached:   { label: "ОТКОМАНД.", color: "oklch(66% 0.20 285)", bg: "oklch(66% 0.20 285 / 0.10)", border: "oklch(66% 0.20 285 / 0.24)" },
};

const RANK_META: Record<string, { color: string; short: string }> = {
  "Полковник":         { color: "oklch(75% 0.18 75)",  short: "П-К"  },
  "Подполковник":      { color: "oklch(75% 0.18 75)",  short: "П-Л"  },
  "Майор":             { color: "oklch(72% 0.18 55)",  short: "МАЙ" },
  "Капитан":           { color: "oklch(68% 0.18 232)", short: "КПТ" },
  "Старший лейтенант": { color: "oklch(72% 0.14 210)", short: "СТ-Л" },
  "Лейтенант":         { color: "oklch(68% 0.18 272)", short: "ЛТ"  },
  "Старший прапорщик": { color: "oklch(72% 0.17 155)", short: "СТ-П" },
  "Прапорщик":         { color: "oklch(72% 0.17 155)", short: "ПРП" },
  "Старший сержант":   { color: "oklch(60% 0.05 258)", short: "С-СРЖ" },
  "Сержант":           { color: "oklch(60% 0.05 258)", short: "СРЖ" },
  "Младший сержант":   { color: "oklch(55% 0.04 260)", short: "МЛ-С" },
  "Рядовой":           { color: "oklch(50% 0.04 262)", short: "РДВ" },
};

const MOCK_PERSONNEL: Person[] = [
  { id: "1", lastName: "Трепалин",  firstName: "Павел Викторович",    patronymic: "КВ-2", rank: "Старший лейтенант", role: "Командир 2 взвода",         code: "КВ-2",  status: "active", tasks: 0, tasksDone: 0, specialty: "Должность" },
  { id: "2", lastName: "Халупа",    firstName: "Алексей Иванович",    patronymic: "КВ-1", rank: "Лейтенант",          role: "Командир 1 взвода",         code: "КВ-1",  status: "active", tasks: 0, tasksDone: 0, specialty: "Должность" },
  { id: "3", lastName: "Долгополов",firstName: "Андрей Андреевич",   patronymic: "СР",   rank: "Прапорщик",          role: "Старшина роты",              code: "СР",    status: "active", tasks: 0, tasksDone: 0, specialty: "Должность" },
  { id: "4", lastName: "Тарасенко", firstName: "Станислав Евгеньевич",patronymic: "КНР",  rank: "Капитан",            role: "Командир научной роты",      code: "КНР",   status: "active", tasks: 0, tasksDone: 0, specialty: "Должность" },
  { id: "5", lastName: "Антипов",   firstName: "Егор Викторович",    patronymic: "ЗКВ-1",rank: "Сержант",            role: "Зам. командира 1 взвода",    code: "ЗКВ-1", status: "active", tasks: 0, tasksDone: 0, specialty: "Должность" },
  { id: "6", lastName: "Ермаков",   firstName: "Владимир Александрович",patronymic: "ЗКВ-2",rank: "Старший сержант", role: "Зам. командира 2 взвода",    code: "ЗКВ-2", status: "active", tasks: 0, tasksDone: 0, specialty: "Должность" },
  { id: "7", lastName: "Арсёнов",   firstName: "Алексей Владимирович",patronymic: "КО-2", rank: "Сержант",            role: "Командир 2 отделения",       code: "КО-2",  status: "active", tasks: 0, tasksDone: 0, specialty: "Должность" },
];

const ALLOWED_CODES: PersonnelCode[] = ["КВ-1","КВ-2","СР","КНР","ЗКВ-1","ЗКВ-2","КО-2"];

const STATUS_LABEL: Record<AssignedTask["status"], string> = {
  pending: "Ожидает", in_progress: "В работе", done: "Выполнено", cancelled: "Отменено",
};
const PRIORITY_LABEL: Record<AssignedTask["priority"], string> = {
  critical: "Критический", high: "Высокий", normal: "Нормальный",
};

// ── Root Component ─────────────────────────────────────────────────────

export default function RolesPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [selected, setSelected] = useState<Person | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [personnelData, setPersonnelData] = useState<Person[]>(() =>
    MOCK_PERSONNEL.filter(p => ALLOWED_CODES.includes(p.code))
  );

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const rows = await Promise.all(
        MOCK_PERSONNEL.filter(p => ALLOWED_CODES.includes(p.code)).map(async person => {
          const tasks = await getTasksByResponsible(person.code);
          return {
            ...person,
            tasksDone: tasks.filter(t => t.status === "done").length,
            tasks: Math.max(tasks.length - tasks.filter(t => t.status === "done").length, 0),
          };
        })
      );
      if (alive) setPersonnelData(rows);
    };
    void load();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!selected) return;
    const updated = personnelData.find(p => p.id === selected.id);
    if (updated) setSelected(updated);
  }, [personnelData, selected]);

  const personnel = useMemo(() => {
    let list = [...personnelData];
    if (filterStatus !== "all") list = list.filter(p => p.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.lastName.toLowerCase().includes(q) || p.firstName.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
      );
    }
    return list;
  }, [personnelData, search, filterStatus]);

  const stats = useMemo(() => ({
    total: personnelData.length,
    active: personnelData.filter(p => p.status === "active").length,
    onLeave: personnelData.filter(p => p.status === "on-leave").length,
    sick: personnelData.filter(p => p.status === "sick").length,
    detached: personnelData.filter(p => p.status === "detached").length,
    tasksBusy: personnelData.filter(p => p.tasks + p.tasksDone > 0).length,
  }), [personnelData]);

  const STAT_ITEMS = [
    { label: "ВСЕГО Л/С",   value: stats.total,     color: "oklch(68% 0.18 272)" },
    { label: "В СТРОЮ",     value: stats.active,    color: "oklch(72% 0.17 155)" },
    { label: "ОТПУСК",      value: stats.onLeave,   color: "oklch(68% 0.18 232)" },
    { label: "Б/Л",         value: stats.sick,      color: "oklch(75% 0.18 75)"  },
    { label: "ОТКОМАНД.",   value: stats.detached,  color: "oklch(66% 0.20 285)" },
    { label: "ПРИ ЗАДАЧАХ", value: stats.tasksBusy, color: "oklch(72% 0.18 55)"  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── HEADER ── */}
      <div style={{ padding: "0 0 16px", flexShrink: 0 }}>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 14 }}>
          {STAT_ITEMS.map(s => (
            <div key={s.label} style={{
              borderRadius: 18, padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 12,
              background: `${s.color.replace(")", " / 0.07)")}`,
              border: `1px solid ${s.color.replace(")", " / 0.16)")}`,
              backdropFilter: "blur(20px)",
            }}>
              <span style={{
                fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums", lineHeight: 1,
                color: s.color,
                textShadow: `0 0 24px ${s.color.replace(")", " / 0.4)")}`,
              }}>{s.value}</span>
              <span style={{
                fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: "1.5px",
                textTransform: "uppercase", lineHeight: 1.4,
                color: "oklch(100% 0 0 / 0.30)",
              }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filter row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              fontSize: 14, color: "oklch(100% 0 0 / 0.25)",
            }}>⌕</span>
            <input
              type="text" placeholder="Поиск по л/с..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                paddingLeft: 34, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                borderRadius: 12, fontSize: 12, outline: "none", width: 200,
                background: "oklch(100% 0 0 / 0.04)",
                border: "1px solid oklch(100% 0 0 / 0.10)",
                color: "oklch(88% 0.04 258)",
                transition: "border-color 0.15s ease",
              }}
              onFocus={e => { e.target.style.borderColor = "oklch(68% 0.18 272 / 0.45)"; e.target.style.background = "oklch(100% 0 0 / 0.06)"; }}
              onBlur={e => { e.target.style.borderColor = "oklch(100% 0 0 / 0.10)"; e.target.style.background = "oklch(100% 0 0 / 0.04)"; }}
            />
          </div>

          {/* Status filters */}
          <div style={{ display: "flex", gap: 4 }}>
            {([["all","ВСЕ"], ["active","В СТРОЮ"], ["on-leave","ОТПУСК"], ["sick","Б/Л"], ["detached","ОТКОМАНД."]] as const).map(([val, label]) => {
              const isActive = filterStatus === val;
              const meta = val !== "all" ? STATUS_META[val as Status] : null;
              return (
                <button key={val} onClick={() => setFilterStatus(val as Status | "all")}
                  style={{
                    padding: "6px 12px", borderRadius: 10, fontSize: 10,
                    fontFamily: "var(--font-mono)", letterSpacing: "0.5px", cursor: "pointer",
                    transition: "all 0.15s ease",
                    ...(isActive ? {
                      background: meta ? meta.bg : "oklch(68% 0.18 272 / 0.14)",
                      border: `1px solid ${meta ? meta.border : "oklch(68% 0.18 272 / 0.30)"}`,
                      color: meta ? meta.color : "oklch(88% 0.08 272)",
                    } : {
                      background: "transparent", border: "1px solid transparent",
                      color: "oklch(50% 0.04 260)",
                    }),
                  }}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* View toggle */}
          <div style={{
            display: "flex", gap: 3, marginLeft: "auto",
            padding: 4, borderRadius: 12,
            background: "oklch(100% 0 0 / 0.04)",
            border: "1px solid oklch(100% 0 0 / 0.09)",
          }}>
            {(["grid","list"] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                style={{
                  padding: "5px 12px", borderRadius: 9, fontSize: 10,
                  fontFamily: "var(--font-mono)", letterSpacing: "0.5px", cursor: "pointer",
                  transition: "all 0.15s ease",
                  ...(viewMode === v ? {
                    background: "oklch(68% 0.18 272 / 0.18)",
                    border: "1px solid oklch(68% 0.18 272 / 0.35)",
                    color: "oklch(88% 0.08 272)",
                  } : {
                    background: "transparent", border: "1px solid transparent",
                    color: "oklch(50% 0.04 260)",
                  }),
                }}>
                {v === "grid" ? "⊞ КАРТОЧКИ" : "≡ ТАБЛИЦА"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {viewMode === "grid"
          ? <GridView personnel={personnel} onSelect={setSelected} selected={selected} />
          : <ListView personnel={personnel} onSelect={setSelected} selected={selected} />
        }
      </div>

      {/* ── MODAL ── */}
      {selected && <PersonModal person={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ── Grid View ──────────────────────────────────────────────────────────

function GridView({ personnel, onSelect, selected }: { personnel: Person[]; onSelect: (p: Person) => void; selected: Person | null }) {
  if (!personnel.length) return <EmptyState />;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
      {personnel.map(person => {
        const st       = STATUS_META[person.status];
        const rank     = RANK_META[person.rank] ?? { color: "oklch(60% 0.05 258)", short: "???" };
        const initials = person.lastName[0] + person.firstName[0];
        const total    = person.tasksDone + person.tasks;
        const progress = total > 0 ? (person.tasksDone / total) * 100 : 0;
        const isSelected = selected?.id === person.id;
        const isActive   = person.status === "active";

        return (
          <div
            key={person.id}
            onClick={() => onSelect(person)}
            style={{
              borderRadius: 22, padding: "18px 20px", cursor: "pointer",
              transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
              position: "relative", overflow: "hidden",
              opacity: isActive ? 1 : 0.65,
              background: isSelected
                ? "linear-gradient(135deg, oklch(68% 0.18 272 / 0.14), oklch(68% 0.18 272 / 0.06))"
                : "linear-gradient(135deg, oklch(100% 0 0 / 0.05), oklch(100% 0 0 / 0.025))",
              border: isSelected
                ? "1px solid oklch(68% 0.18 272 / 0.40)"
                : isActive
                  ? "1px solid oklch(100% 0 0 / 0.10)"
                  : "1px solid oklch(100% 0 0 / 0.06)",
              backdropFilter: "blur(20px)",
              boxShadow: isSelected
                ? "0 6px 28px oklch(68% 0.18 272 / 0.14), 0 1px 0 oklch(100% 0 0 / 0.07) inset"
                : "0 4px 16px oklch(0% 0 0 / 0.30), 0 1px 0 oklch(100% 0 0 / 0.05) inset",
              transform: isSelected ? "translateY(-1px)" : "none",
            }}
          >
            {/* Rank color glow in top right */}
            <div style={{
              position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%",
              background: `${rank.color.replace(")", " / 0.08)")}`,
              filter: "blur(20px)", pointerEvents: "none",
            }} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17, fontWeight: 700,
                  background: `linear-gradient(135deg, ${rank.color.replace(")", " / 0.22)")}, ${rank.color.replace(")", " / 0.08)")})`,
                  border: `1px solid ${rank.color.replace(")", " / 0.25)")}`,
                  color: "oklch(96% 0.008 255)",
                  boxShadow: `0 4px 14px ${rank.color.replace(")", " / 0.14)")}`,
                }}>
                  {initials}
                </div>
                <span style={{
                  position: "absolute", bottom: -2, right: -2,
                  width: 12, height: 12, borderRadius: "50%",
                  background: st.color,
                  border: "2px solid oklch(26% 0.045 268)",
                  boxShadow: `0 0 6px ${st.color.replace(")", " / 0.7)")}`,
                }} />
              </div>

              <span style={{
                fontSize: 8, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "1.5px",
                padding: "4px 9px", borderRadius: 9,
                color: st.color, background: st.bg, border: `1px solid ${st.border}`,
              }}>
                {st.label}
              </span>
            </div>

            {/* Name */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "oklch(96% 0.008 255)", marginBottom: 2 }}>{person.lastName}</p>
              <p style={{ fontSize: 11, color: "oklch(55% 0.04 258)" }}>{person.firstName}</p>
            </div>

            {/* Rank + role */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  fontSize: 8, fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 6px", borderRadius: 6,
                  color: rank.color,
                  background: `${rank.color.replace(")", " / 0.14)")}`,
                  border: `1px solid ${rank.color.replace(")", " / 0.24)")}`,
                }}>
                  {rank.short}
                </span>
                <span style={{ fontSize: 11, color: "oklch(50% 0.04 258)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {person.rank}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "oklch(65% 0.04 258)", lineHeight: 1.35 }}>{person.role}</p>
            </div>

            {/* Progress */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 8, fontFamily: "var(--font-mono)", color: "oklch(100% 0 0 / 0.30)", letterSpacing: "1px" }}>ЗАДАЧИ</span>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "oklch(60% 0.04 258)" }}>{person.tasksDone} / {total}</span>
              </div>
              <div style={{ height: 3, borderRadius: 3, overflow: "hidden", background: "oklch(100% 0 0 / 0.07)" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${progress}%`,
                  background: progress === 100
                    ? "oklch(72% 0.17 155)"
                    : progress > 50 ? "oklch(68% 0.18 272)" : "oklch(75% 0.18 75)",
                  boxShadow: progress === 100 ? "0 0 6px oklch(72% 0.17 155 / 0.5)" : "none",
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── List View ──────────────────────────────────────────────────────────

function ListView({ personnel, onSelect, selected }: { personnel: Person[]; onSelect: (p: Person) => void; selected: Person | null }) {
  if (!personnel.length) return <EmptyState />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{
        display: "grid", gap: 12, padding: "6px 16px",
        gridTemplateColumns: "2fr 1fr 1fr 1fr 100px 80px",
        fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: "1.5px", textTransform: "uppercase",
        color: "oklch(100% 0 0 / 0.25)",
      }}>
        <span>ФИО / ДОЛЖНОСТЬ</span><span>ЗВАНИЕ</span><span>КОД</span>
        <span>СПЕЦИАЛИЗАЦИЯ</span><span>СТАТУС</span><span>ЗАДАЧИ</span>
      </div>

      {personnel.map(person => {
        const st       = STATUS_META[person.status];
        const rank     = RANK_META[person.rank] ?? { color: "oklch(60% 0.05 258)", short: "???" };
        const isSelected = selected?.id === person.id;
        const isActive   = person.status === "active";

        return (
          <div
            key={person.id}
            onClick={() => onSelect(person)}
            style={{
              display: "grid", gap: 12, padding: "12px 16px",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 100px 80px",
              borderRadius: 16, cursor: "pointer", alignItems: "center",
              transition: "all 0.18s ease",
              opacity: isActive ? 1 : 0.65,
              background: isSelected
                ? "linear-gradient(135deg, oklch(68% 0.18 272 / 0.12), oklch(68% 0.18 272 / 0.05))"
                : "oklch(100% 0 0 / 0.025)",
              border: isSelected
                ? "1px solid oklch(68% 0.18 272 / 0.35)"
                : "1px solid oklch(100% 0 0 / 0.08)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "oklch(96% 0.008 255)", marginBottom: 2 }}>
                {person.lastName} {person.firstName[0]}. {person.code}
              </p>
              <p style={{ fontSize: 11, color: "oklch(50% 0.04 258)" }}>{person.role}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                fontSize: 8, fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 6px", borderRadius: 6,
                color: rank.color, background: `${rank.color.replace(")", " / 0.14)")}`, border: `1px solid ${rank.color.replace(")", " / 0.24)")}`,
              }}>{rank.short}</span>
              <span style={{ fontSize: 11, color: "oklch(50% 0.04 258)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{person.rank}</span>
            </div>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700, color: "oklch(78% 0.10 272)" }}>{person.code}</span>
            <span style={{ fontSize: 11, color: "oklch(45% 0.04 258)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {person.specialty ?? "—"}
            </span>
            <span style={{
              fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.5px",
              padding: "4px 9px", borderRadius: 9, width: "fit-content",
              color: st.color, background: st.bg, border: `1px solid ${st.border}`,
            }}>{st.label}</span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ color: "oklch(72% 0.17 155)" }}>{person.tasksDone}</span>
              <span style={{ color: "oklch(100% 0 0 / 0.20)" }}> / </span>
              <span style={{ color: "oklch(55% 0.04 258)" }}>{person.tasksDone + person.tasks}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Person Modal ───────────────────────────────────────────────────────

function PersonModal({ person, onClose }: { person: Person; onClose: () => void }) {
  const st       = STATUS_META[person.status];
  const rank     = RANK_META[person.rank] ?? { color: "oklch(60% 0.05 258)", short: "???" };
  const initials = person.lastName[0] + person.firstName[0];
  const total    = person.tasksDone + person.tasks;
  const progress = total > 0 ? (person.tasksDone / total) * 100 : 0;

  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      const rows = await getTasksByResponsible(person.code);
      if (!alive) return;
      setTasks(rows as AssignedTask[]);
      setSelectedTaskId(rows[0]?.id ?? null);
      setLoading(false);
    };
    void load();
    return () => { alive = false; };
  }, [person.code]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  const loadedTotal  = tasks.length;
  const loadedDone   = tasks.filter(t => t.status === "done").length;
  const loadedProgress = loadedTotal > 0 ? Math.round((loadedDone / loadedTotal) * 100) : 0;
  const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null;
  const selectedSubtask = selectedTask?.subtasks.find(s => s.id === selectedSubtaskId) ?? null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        background: "oklch(10% 0.03 265 / 0.70)",
        backdropFilter: "blur(16px)",
        animation: "fadeIn 0.18s ease forwards",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%", maxWidth: 920, maxHeight: "88vh",
          borderRadius: 28, overflow: "hidden",
          display: "flex", flexDirection: "column",
          background: "linear-gradient(145deg, oklch(22% 0.04 266 / 0.98), oklch(18% 0.035 268 / 0.97))",
          backdropFilter: "blur(40px)",
          border: "1px solid oklch(100% 0 0 / 0.12)",
          boxShadow: "0 32px 80px oklch(0% 0 0 / 0.70), 0 1px 0 oklch(100% 0 0 / 0.07) inset",
          animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          padding: 20,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16, flexShrink: 0 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 20, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 700,
            background: `linear-gradient(135deg, ${rank.color.replace(")", " / 0.28)")}, ${rank.color.replace(")", " / 0.10)")})`,
            border: `1px solid ${rank.color.replace(")", " / 0.30)")}`,
            color: "oklch(96% 0.008 255)",
            boxShadow: `0 4px 20px ${rank.color.replace(")", " / 0.18)")}`,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "2.5px", textTransform: "uppercase", color: "oklch(100% 0 0 / 0.25)", marginBottom: 6 }}>
              // ЛИЧНАЯ КАРТОЧКА И ЗАДАЧИ
            </p>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "oklch(96% 0.008 255)", marginBottom: 2, letterSpacing: "-0.01em" }}>{person.lastName}</h3>
            <p style={{ fontSize: 13, color: "oklch(55% 0.04 258)" }}>{person.firstName} · {person.code}</p>
          </div>
          <button onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 12, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, lineHeight: 1, cursor: "pointer",
              border: "1px solid oklch(100% 0 0 / 0.12)",
              background: "oklch(100% 0 0 / 0.05)",
              color: "oklch(55% 0.04 258)", transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.10)"; e.currentTarget.style.color = "oklch(96% 0.008 255)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "oklch(100% 0 0 / 0.05)"; e.currentTarget.style.color = "oklch(55% 0.04 258)"; }}
          >×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, flex: 1, minHeight: 0, overflow: "hidden" }}>
          {/* Left panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
            {/* Status */}
            <div style={{ padding: 12, borderRadius: 16, background: st.bg, border: `1px solid ${st.border}` }}>
              <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: st.color }}>{st.label}</p>
              <p style={{ fontSize: 12, marginTop: 4, color: "oklch(60% 0.04 258)" }}>{person.role}</p>
            </div>

            {/* Progress */}
            <div style={{ padding: 12, borderRadius: 16, background: "oklch(100% 0 0 / 0.03)", border: "1px solid oklch(100% 0 0 / 0.09)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "oklch(100% 0 0 / 0.35)", letterSpacing: "1px", textTransform: "uppercase" }}>Прогресс</span>
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: "oklch(88% 0.08 272)" }}>
                  {loadedTotal > 0 ? loadedProgress : Math.round(progress)}%
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 6, background: "oklch(100% 0 0 / 0.08)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 6,
                  width: `${loadedTotal > 0 ? loadedProgress : Math.round(progress)}%`,
                  background: "linear-gradient(90deg, oklch(68% 0.18 272), oklch(72% 0.14 210))",
                  transition: "width 0.7s ease",
                }} />
              </div>
            </div>

            {/* Task list */}
            <div style={{ padding: 12, borderRadius: 16, background: "oklch(100% 0 0 / 0.03)", border: "1px solid oklch(100% 0 0 / 0.09)", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 }}>
                <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "oklch(100% 0 0 / 0.35)", letterSpacing: "1px", textTransform: "uppercase" }}>Задачи</p>
                <a href={`/tasks?responsible=${person.code}`}
                  style={{
                    fontSize: 9, fontFamily: "var(--font-mono)", padding: "3px 9px", borderRadius: 8,
                    color: "oklch(88% 0.08 272)", border: "1px solid oklch(68% 0.18 272 / 0.35)",
                    background: "oklch(68% 0.18 272 / 0.09)", textDecoration: "none",
                  }}>
                  в журнал
                </a>
              </div>

              {loading ? (
                <p style={{ fontSize: 11, color: "oklch(50% 0.04 258)" }}>Загрузка...</p>
              ) : tasks.length === 0 ? (
                <p style={{ fontSize: 11, color: "oklch(50% 0.04 258)" }}>Нет задач</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, overflowY: "auto" }}>
                  {tasks.map(task => {
                    const doneSubs = task.subtasks.filter(s => s.status === "done").length;
                    const cardActive = selectedTaskId === task.id;
                    return (
                      <button key={task.id} onClick={() => { setSelectedTaskId(task.id); setSelectedSubtaskId(null); }}
                        style={{
                          width: "100%", textAlign: "left", padding: 9, borderRadius: 12, cursor: "pointer",
                          transition: "all 0.15s ease",
                          background: cardActive ? "oklch(68% 0.18 272 / 0.12)" : "oklch(100% 0 0 / 0.02)",
                          border: cardActive ? "1px solid oklch(68% 0.18 272 / 0.40)" : "1px solid oklch(100% 0 0 / 0.09)",
                        }}>
                        <p style={{ fontSize: 11, color: "oklch(88% 0.04 258)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</p>
                        <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", marginTop: 3, color: "oklch(50% 0.04 258)" }}>
                          {task.dateFrom}-{task.dateTo}/{task.month} · {STATUS_LABEL[task.status]} · {doneSubs}/{task.subtasks.length} подз.
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel — task details */}
          <div style={{ padding: 16, borderRadius: 20, background: "oklch(100% 0 0 / 0.03)", border: "1px solid oklch(100% 0 0 / 0.09)", minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {!selectedTask ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontFamily: "var(--font-mono)", color: "oklch(40% 0.04 260)" }}>
                Выберите задачу слева
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: "oklch(96% 0.008 255)" }}>{selectedTask.title}</h4>
                  <span style={{
                    fontSize: 10, fontFamily: "var(--font-mono)", padding: "4px 10px", borderRadius: 9, flexShrink: 0,
                    color: "oklch(88% 0.08 272)", border: "1px solid oklch(68% 0.18 272 / 0.30)", background: "oklch(68% 0.18 272 / 0.09)",
                  }}>
                    {selectedTask.category} · {PRIORITY_LABEL[selectedTask.priority]}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Статус",    value: STATUS_LABEL[selectedTask.status]                        },
                    { label: "Срок",      value: `${selectedTask.dateFrom}-${selectedTask.dateTo}/${selectedTask.month}` },
                    { label: "Подзадачи", value: `${selectedTask.subtasks.filter(s => s.status === "done").length}/${selectedTask.subtasks.length}` },
                  ].map(row => (
                    <div key={row.label} style={{ padding: "10px 12px", borderRadius: 12, background: "oklch(100% 0 0 / 0.03)", border: "1px solid oklch(100% 0 0 / 0.09)" }}>
                      <p style={{ fontSize: 8, fontFamily: "var(--font-mono)", color: "oklch(100% 0 0 / 0.25)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px" }}>{row.label}</p>
                      <p style={{ fontSize: 12, color: "oklch(88% 0.04 258)" }}>{row.value}</p>
                    </div>
                  ))}
                </div>

                {/* Subtasks progress */}
                {(() => {
                  const done = selectedTask.subtasks.filter(s => s.status === "done").length;
                  const tot  = selectedTask.subtasks.length;
                  const pct  = tot > 0 ? Math.round((done / tot) * 100) : 0;
                  return (
                    <div style={{ padding: "12px 14px", borderRadius: 14, background: "oklch(100% 0 0 / 0.03)", border: "1px solid oklch(100% 0 0 / 0.09)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "oklch(100% 0 0 / 0.30)", textTransform: "uppercase", letterSpacing: "1px" }}>Прогресс подзадач</span>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: pct === 100 ? "oklch(72% 0.17 155)" : "oklch(88% 0.08 272)" }}>{pct}%</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 5, overflow: "hidden", background: "oklch(100% 0 0 / 0.08)" }}>
                        <div style={{ height: "100%", borderRadius: 5, width: `${pct}%`, background: pct === 100 ? "oklch(72% 0.17 155)" : "linear-gradient(90deg, oklch(68% 0.18 272), oklch(72% 0.14 210))", transition: "width 0.7s ease" }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Subtask list */}
                {selectedTask.subtasks.length > 0 && (
                  <div>
                    <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "oklch(100% 0 0 / 0.30)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Детализация</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 280, overflowY: "auto" }}>
                      {selectedTask.subtasks.map(sub => (
                        <button key={sub.id}
                          onClick={() => setSelectedSubtaskId(sub.id === selectedSubtaskId ? null : sub.id)}
                          style={{
                            width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 12, cursor: "pointer",
                            transition: "all 0.15s ease",
                            background: selectedSubtaskId === sub.id ? "oklch(68% 0.18 272 / 0.10)" : "oklch(100% 0 0 / 0.02)",
                            border: selectedSubtaskId === sub.id ? "1px solid oklch(68% 0.18 272 / 0.35)" : "1px solid oklch(100% 0 0 / 0.09)",
                          }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <span style={{ fontSize: 11, color: "oklch(88% 0.04 258)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.title}</span>
                            <span style={{
                              fontSize: 9, fontFamily: "var(--font-mono)", flexShrink: 0,
                              color: sub.status === "done" ? "oklch(72% 0.17 155)" : "oklch(50% 0.04 258)",
                            }}>{STATUS_LABEL[sub.status]}</span>
                          </div>
                          {sub.description && (
                            <p style={{ fontSize: 10, marginTop: 4, color: "oklch(50% 0.04 258)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "oklch(100% 0 0 / 0.20)" }}>
      <div style={{ fontSize: 48, opacity: 0.2, marginBottom: 16 }}>◉</div>
      <p style={{ fontSize: 13, fontFamily: "var(--font-mono)", letterSpacing: "2px" }}>// ЛИЧНЫЙ СОСТАВ НЕ НАЙДЕН</p>
      <p style={{ fontSize: 11, marginTop: 8, opacity: 0.7 }}>Попробуйте изменить фильтры</p>
    </div>
  );
}