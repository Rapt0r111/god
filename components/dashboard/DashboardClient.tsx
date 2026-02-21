"use client";

import { useState } from "react";
import { getTaskDueInDays } from "@/lib/tasks/critical";

const MONTHS     = ["","ЯНВ","ФЕВ","МАР","АПР","МАЙ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];
const MONTHS_FULL= ["","Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  "Н":   { icon: "⚗",  color: "#1ae8a0" },
  "А":   { icon: "📡", color: "#4f8ef7" },
  "БП":  { icon: "🎯", color: "#ff6b6b" },
  "ПД":  { icon: "⚙",  color: "#f5b942" },
  "ВПР": { icon: "🎖", color: "#9d7afe" },
  "У":   { icon: "🏁", color: "#ff8c42" },
  "П":   { icon: "🔰", color: "#22d4f0" },
  "ЗиТ": { icon: "💻", color: "#8899bb" },
  "ЕМ":  { icon: "📋", color: "#f5b942" },
  "НД":  { icon: "🔬", color: "#1ae8a0" },
  "МГ":  { icon: "⚡", color: "#ff6b6b" },
};

type TaskLike = {
  id: number;
  title: string;
  category: string;
  month: number;
  dateFrom: number;
  dateTo: number;
  responsible: string;
  status: string;
  priority: string;
  description?: string | null;
  notes?: string | null;
};

type MonthStat = { month: number; total: number; done: number; critical: number };

interface Props {
  total: number;
  done: number;
  critical: number;
  thisMonth: number;
  thisMonthDone: number;
  currentMonth: number;
  monthStats: MonthStat[];
  upcomingTasks: TaskLike[];
}

function getUrgency(task: TaskLike) {
  const dueIn = getTaskDueInDays(task);
  if (dueIn <= 2) return { label: "Критично", color: "#ff9999", bg: "rgba(255,107,107,0.12)", border: "rgba(255,107,107,0.3)", pulse: true };
  if (dueIn <= 7) return { label: "Скоро",   color: "#fcd34d", bg: "rgba(245,185,66,0.12)",  border: "rgba(245,185,66,0.3)",  pulse: false };
  return           { label: "Планово",  color: "#93c5fd", bg: "rgba(79,142,247,0.12)",  border: "rgba(79,142,247,0.3)",  pulse: false };
}

// ── KPI Card ──────────────────────────────────────────────────────────

function KpiCard({ label, value, color, sub, progress, index }: {
  label: string; value: number; color: string; colorBg: string; colorBorder: string; sub: string; progress: number; index: number;
}) {
  return (
    <div
      className="rounded-3xl p-6 relative overflow-hidden animate-fade-up"
      style={{
        background: "linear-gradient(145deg, rgba(14,24,46,0.9), rgba(9,16,32,0.85))",
        border: `1px solid ${color}20`,
        backdropFilter: "blur(20px)",
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 40px ${color}08`,
        animationDelay: `${index * 0.07}s`,
        animationFillMode: "both",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
          transform: "translate(30%, -30%)",
        }}
      />

      <p className="text-[10px] font-mono tracking-[0.15em] uppercase mb-4" style={{ color: "rgba(136,153,187,0.6)" }}>
        {label}
      </p>
      <p
        className="text-[48px] font-bold leading-none mb-2 tabular-nums"
        style={{ color, textShadow: `0 0 40px ${color}50`, letterSpacing: "-0.02em" }}
      >
        {value}
      </p>
      <p className="text-[13px] mb-4" style={{ color: "rgba(136,153,187,0.65)" }}>
        {sub}
      </p>
      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 8px ${color}50`,
          }}
        />
      </div>
    </div>
  );
}

// ── Monthly Chart ─────────────────────────────────────────────────────

function MonthlyChart({ monthStats, currentMonth }: { monthStats: MonthStat[]; currentMonth: number }) {
  const maxCount = Math.max(...monthStats.map(m => m.total), 1);

  return (
    <div
      className="rounded-3xl p-6 animate-fade-up stagger-3"
      style={{
        background: "linear-gradient(145deg, rgba(14,24,46,0.9), rgba(9,16,32,0.85))",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset",
        animationFillMode: "both",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] font-mono tracking-[0.15em] uppercase" style={{ color: "rgba(136,153,187,0.6)" }}>
          // Годовой план · нагрузка по месяцам
        </p>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full inline-block" style={{ background: "rgba(79,142,247,0.6)" }} />
            <span style={{ color: "rgba(136,153,187,0.5)" }}>план</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full inline-block" style={{ background: "rgba(255,107,107,0.6)" }} />
            <span style={{ color: "rgba(136,153,187,0.5)" }}>критичные</span>
          </span>
        </div>
      </div>

      {/* Chart — fixed with explicit container height */}
      <div className="flex gap-1.5 items-end" style={{ height: 96 }}>
        {monthStats.map(m => {
          const barH  = Math.round((m.total / maxCount) * 72);
          const isCur = m.month === currentMonth;
          const doneH = m.total > 0 ? Math.round((m.done / m.total) * barH) : 0;

          return (
            <a
              key={m.month}
              href={`/tasks?month=${m.month}`}
              className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer"
              style={{ minWidth: 0 }}
            >
              {/* Bar container */}
              <div className="w-full flex flex-col justify-end" style={{ height: 72 }}>
                {m.total > 0 && (
                  <div
                    className="w-full rounded-t-lg relative overflow-hidden transition-all duration-200 group-hover:brightness-125"
                    style={{
                      height: Math.max(barH, 4),
                      background: isCur
                        ? "linear-gradient(to top, #f5b942, #fcd34d)"
                        : m.critical > 0
                          ? "linear-gradient(to top, rgba(255,107,107,0.55), rgba(255,107,107,0.2))"
                          : "linear-gradient(to top, rgba(79,142,247,0.5), rgba(34,212,240,0.2))",
                      border: isCur
                        ? "1px solid rgba(245,185,66,0.5)"
                        : m.critical > 0
                          ? "1px solid rgba(255,107,107,0.3)"
                          : "1px solid rgba(79,142,247,0.25)",
                      boxShadow: isCur
                        ? "0 0 12px rgba(245,185,66,0.25)"
                        : m.critical > 0
                          ? "0 0 8px rgba(255,107,107,0.15)"
                          : "none",
                    }}
                  >
                    {/* Done overlay */}
                    {doneH > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0"
                        style={{
                          height: doneH,
                          background: "rgba(26,232,160,0.25)",
                          borderTop: "1px solid rgba(26,232,160,0.3)",
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
              {/* Label */}
              <span
                className="text-[9px] tracking-wider font-mono"
                style={{ color: isCur ? "#f5b942" : "rgba(74,90,122,0.8)" }}
              >
                {MONTHS[m.month]}
              </span>
              <span className="text-[9px] tabular-nums font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                {m.total || ""}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ── Task Row (with preview) ───────────────────────────────────────────

function TaskRow({ task, isSelected, onClick }: {
  task: TaskLike;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cat     = CATEGORY_META[task.category] ?? { icon: "•", color: "#8899bb" };
  const urgency = getUrgency(task);
  const date    = task.dateFrom === task.dateTo ? `${task.dateFrom}` : `${task.dateFrom}–${task.dateTo}`;

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group"
      style={{
        background: isSelected
          ? "linear-gradient(135deg, rgba(79,142,247,0.12), rgba(34,212,240,0.06))"
          : "rgba(14,24,46,0.5)",
        border: isSelected
          ? "1px solid rgba(79,142,247,0.35)"
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: isSelected ? "0 4px 16px rgba(79,142,247,0.1)" : "none",
      }}
    >
      {/* Urgency dot */}
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{
          background: urgency.color,
          boxShadow: `0 0 6px ${urgency.color}`,
          animation: urgency.pulse ? "pulseGlow 1.5s ease-in-out infinite" : "none",
        }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium truncate mb-1.5" style={{ color: "#eef2ff" }}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono" style={{ color: "rgba(136,153,187,0.6)" }}>
            {MONTHS[task.month]} {date}
          </span>
          <span
            className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-lg"
            style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}25` }}
          >
            {cat.icon} {task.category}
          </span>
          <span
            className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-lg"
            style={{ background: urgency.bg, color: urgency.color, border: `1px solid ${urgency.border}` }}
          >
            {urgency.label}
          </span>
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded-lg"
            style={{ background: "rgba(136,153,187,0.08)", color: "#8899bb", border: "1px solid rgba(136,153,187,0.15)" }}
          >
            {task.responsible}
          </span>
        </div>
      </div>

      <span
        className="text-[12px] transition-all duration-200"
        style={{
          color: isSelected ? "#4f8ef7" : "rgba(136,153,187,0.3)",
          transform: isSelected ? "rotate(90deg)" : "rotate(0deg)",
        }}
      >
        ›
      </span>
    </button>
  );
}

// ── Task Preview Drawer ───────────────────────────────────────────────

function TaskPreview({ task, onClose }: { task: TaskLike; onClose: () => void }) {
  const cat      = CATEGORY_META[task.category] ?? { icon: "•", color: "#8899bb" };
  const urgency  = getUrgency(task);
  const dur      = task.dateTo - task.dateFrom + 1;
  const dueIn    = getTaskDueInDays(task);

  const PRIORITY_META: Record<string, { label: string; color: string }> = {
    critical: { label: "Критический", color: "#ff6b6b" },
    high:     { label: "Высокий",     color: "#f5b942"  },
    normal:   { label: "Нормальный",  color: "#4f8ef7"  },
  };
  const pri = PRIORITY_META[task.priority] ?? PRIORITY_META.normal;

  return (
    <div
      className="animate-fade-up rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(10,18,36,0.95), rgba(6,11,22,0.98))",
        border: `1px solid ${cat.color}25`,
        backdropFilter: "blur(32px)",
        boxShadow: `0 16px 48px rgba(0,0,0,0.6), 0 0 40px ${cat.color}08`,
        animationFillMode: "both",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-start gap-4"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: `linear-gradient(135deg, ${cat.color}08, transparent)`,
        }}
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-[18px] shrink-0"
          style={{
            background: `${cat.color}18`,
            border: `1px solid ${cat.color}30`,
            boxShadow: `0 0 20px ${cat.color}12`,
          }}
        >
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-mono tracking-[2px] uppercase mb-1" style={{ color: `${cat.color}80` }}>
            // {task.category} · ID #{task.id}
          </p>
          <h3 className="text-[15px] font-semibold leading-snug" style={{ color: "#eef2ff" }}>
            {task.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl shrink-0 text-[16px] transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(136,153,187,0.5)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#eef2ff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "rgba(136,153,187,0.5)"; }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Status + urgency */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[9px] font-mono font-semibold px-2.5 py-1.5 rounded-xl"
            style={{ background: urgency.bg, color: urgency.color, border: `1px solid ${urgency.border}` }}
          >
            {urgency.label}
          </span>
          <span
            className="text-[9px] font-mono font-semibold px-2.5 py-1.5 rounded-xl"
            style={{ background: `${pri.color}12`, color: pri.color, border: `1px solid ${pri.color}28` }}
          >
            {pri.label}
          </span>
          <span
            className="text-[9px] font-mono px-2.5 py-1.5 rounded-xl"
            style={{ background: "rgba(136,153,187,0.08)", color: "#8899bb", border: "1px solid rgba(136,153,187,0.15)" }}
          >
            {task.responsible}
          </span>
        </div>

        {/* Timeline card */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: "linear-gradient(135deg, rgba(79,142,247,0.08), rgba(34,212,240,0.04))",
            border: "1px solid rgba(79,142,247,0.18)",
          }}
        >
          <p className="text-[8px] font-mono tracking-[2px] uppercase mb-3" style={{ color: "rgba(79,142,247,0.5)" }}>
            // Сроки исполнения · {MONTHS_FULL[task.month]}
          </p>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-[26px] font-bold tabular-nums" style={{ color: "#93c5fd", lineHeight: 1 }}>{task.dateFrom}</p>
              <p className="text-[9px] font-mono mt-1" style={{ color: "rgba(136,153,187,0.4)" }}>начало</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <div className="h-px w-8" style={{ background: "rgba(79,142,247,0.35)" }} />
                <span className="text-[9px] font-mono font-semibold" style={{ color: "#60a5fa" }}>
                  {dur} {dur === 1 ? "дн" : dur < 5 ? "дня" : "дней"}
                </span>
                <div className="h-px w-8" style={{ background: "rgba(79,142,247,0.35)" }} />
              </div>
              <p className="text-[9px] font-mono" style={{ color: "rgba(136,153,187,0.3)" }}>
                {dueIn <= 0 ? "просрочено" : `через ${dueIn} дн.`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[26px] font-bold tabular-nums" style={{ color: "#93c5fd", lineHeight: 1 }}>{task.dateTo}</p>
              <p className="text-[9px] font-mono mt-1" style={{ color: "rgba(136,153,187,0.4)" }}>конец</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-[8px] font-mono tracking-[2px] uppercase mb-2" style={{ color: "rgba(136,153,187,0.4)" }}>// Описание</p>
            <p className="text-[12px] leading-relaxed" style={{ color: "rgba(200,216,232,0.8)" }}>{task.description}</p>
          </div>
        )}

        {/* Notes */}
        {task.notes && (
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(245,185,66,0.04)", border: "1px solid rgba(245,185,66,0.14)" }}
          >
            <p className="text-[8px] font-mono tracking-[2px] uppercase mb-2" style={{ color: "rgba(245,185,66,0.45)" }}>// Примечание</p>
            <p className="text-[12px] leading-relaxed font-mono" style={{ color: "rgba(245,185,66,0.75)" }}>{task.notes}</p>
          </div>
        )}

        {/* Open link */}
        <a
          href={`/tasks?month=${task.month}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-[11px] font-mono font-semibold tracking-wider transition-all duration-200"
          style={{
            border: `1px solid ${cat.color}30`,
            background: `${cat.color}08`,
            color: cat.color,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = `${cat.color}15`;
            e.currentTarget.style.borderColor = `${cat.color}50`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = `${cat.color}08`;
            e.currentTarget.style.borderColor = `${cat.color}30`;
          }}
        >
          Открыть журнал задач →
        </a>
      </div>
    </div>
  );
}

// ── Bottom summary strip ──────────────────────────────────────────────

function SummaryStrip({ critical, inProgress, done }: { critical: number; inProgress: number; done: number }) {
  const items = [
    { label: "Критичные", value: critical,    color: "#ff9999"  },
    { label: "В работе",  value: inProgress,  color: "#fcd34d"  },
    { label: "Выполнено", value: done,         color: "#1ae8a0"  },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((row, i) => (
        <div
          key={row.label}
          className="rounded-2xl px-4 py-3 flex items-center justify-between animate-fade-up"
          style={{
            background: "linear-gradient(145deg, rgba(14,24,46,0.7), rgba(9,16,32,0.75))",
            border: `1px solid ${row.color}15`,
            animationDelay: `${0.4 + i * 0.07}s`,
            animationFillMode: "both",
          }}
        >
          <span className="text-[13px]" style={{ color: "rgba(136,153,187,0.6)" }}>{row.label}</span>
          <span
            className="text-[24px] font-bold tabular-nums"
            style={{ color: row.color, textShadow: `0 0 20px ${row.color}40` }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard Client ─────────────────────────────────────────────

export function DashboardClient({
  total, done, critical,
  thisMonth, thisMonthDone,
  currentMonth, monthStats, upcomingTasks,
}: Props) {
  const [selectedTask, setSelectedTask] = useState<TaskLike | null>(null);

  const readiness  = total > 0 ? Math.round((done / total) * 100) : 0;
  const inProgress = Math.max(total - done - critical, 0);

  const handleTaskClick = (task: TaskLike) => {
    setSelectedTask(prev => prev?.id === task.id ? null : task);
  };

  return (
    <div className="space-y-4">
      {/* Critical banner */}
      {critical > 0 && (
        <a
          href="/tasks?criticalOnly=1&autoMonthWindow=0"
          className="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-200 group animate-fade-up"
          style={{
            background: "rgba(255,107,107,0.07)",
            border: "1px solid rgba(255,107,107,0.22)",
            boxShadow: "0 4px 20px rgba(255,107,107,0.08)",
            animationFillMode: "both",
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(255,107,107,0.15)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,107,107,0.08)"; }}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: "#ff6b6b", boxShadow: "0 0 8px #ff6b6b", animation: "pulseGlow 1.5s ease-in-out infinite" }}
          />
          <span className="text-[13px]" style={{ color: "#ffb3b3" }}>
            <span className="font-semibold">ВНИМАНИЕ: </span>
            {critical} критичных задач требуют немедленного исполнения
          </span>
          <span className="ml-auto text-[11px] font-mono transition-transform duration-200 group-hover:translate-x-1" style={{ color: "rgba(255,179,179,0.6)" }}>
            Открыть →
          </span>
        </a>
      )}

      {/* KPI cards */}
      <div className="grid gap-3 xl:grid-cols-3">
        <KpiCard
          label="// Критичных задач"
          value={critical}
          color="#ff6b6b"
          colorBg="rgba(255,107,107,0.05)"
          colorBorder="rgba(255,107,107,0.15)"
          sub="не выполнено · требует решения"
          progress={0}
          index={0}
        />
        <KpiCard
          label={`// Задач в ${MONTHS[currentMonth]}`}
          value={thisMonth}
          color="#f5b942"
          colorBg="rgba(245,185,66,0.05)"
          colorBorder="rgba(245,185,66,0.15)"
          sub={`${thisMonthDone} выполнено`}
          progress={thisMonth > 0 ? (thisMonthDone / thisMonth) * 100 : 0}
          index={1}
        />
        <KpiCard
          label="// Всего выполнено"
          value={done}
          color="#1ae8a0"
          colorBg="rgba(26,232,160,0.05)"
          colorBorder="rgba(26,232,160,0.15)"
          sub={`${readiness}% · из ${total} задач за год`}
          progress={total > 0 ? (done / total) * 100 : 0}
          index={2}
        />
      </div>

      {/* Monthly chart */}
      <MonthlyChart monthStats={monthStats} currentMonth={currentMonth} />

      {/* Upcoming tasks + Preview */}
      <div
        className="rounded-3xl overflow-hidden animate-fade-up"
        style={{
          background: "linear-gradient(145deg, rgba(14,24,46,0.88), rgba(9,16,32,0.85))",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animationDelay: "0.25s",
          animationFillMode: "both",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-[10px] font-mono tracking-[0.15em] uppercase" style={{ color: "rgba(255,107,107,0.65)" }}>
            // Ближайшие задачи · от критичных к плановым
          </p>
          <a
            href="/tasks"
            className="text-[10px] font-mono px-3 py-1.5 rounded-xl transition-all duration-150"
            style={{ color: "rgba(79,142,247,0.65)", border: "1px solid rgba(79,142,247,0.2)", background: "rgba(79,142,247,0.06)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(79,142,247,0.12)"; e.currentTarget.style.color = "#93c5fd"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(79,142,247,0.06)"; e.currentTarget.style.color = "rgba(79,142,247,0.65)"; }}
          >
            Все задачи →
          </a>
        </div>

        <div className="grid xl:grid-cols-2 gap-0">
          {/* Task list */}
          <div className="p-4 space-y-2" style={{ borderRight: upcomingTasks.length > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-10" style={{ color: "rgba(26,232,160,0.4)" }}>
                <div className="text-3xl mb-3 opacity-50">✓</div>
                <p className="text-[13px]">Все задачи выполнены</p>
              </div>
            ) : (
              upcomingTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isSelected={selectedTask?.id === task.id}
                  onClick={() => handleTaskClick(task)}
                />
              ))
            )}
          </div>

          {/* Task preview */}
          <div className="p-4">
            {selectedTask ? (
              <TaskPreview task={selectedTask} onClose={() => setSelectedTask(null)} />
            ) : (
              <div
                className="h-full min-h-48 flex flex-col items-center justify-center rounded-2xl"
                style={{ border: "1px dashed rgba(255,255,255,0.07)", color: "rgba(74,90,122,0.6)" }}
              >
                <div className="text-3xl mb-3 opacity-30">◱</div>
                <p className="text-[12px] font-mono tracking-wider">Выберите задачу</p>
                <p className="text-[10px] mt-1 opacity-70">для просмотра деталей</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <SummaryStrip critical={critical} inProgress={inProgress} done={done} />
    </div>
  );
}