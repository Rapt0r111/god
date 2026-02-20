"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "@/actions/tasks";

const CATEGORIES = [
  { code: "Н",   icon: "⚗",  label: "Наука",         color: "#10b981" },
  { code: "А",   icon: "📡", label: "Агитация",       color: "#3b82f6" },
  { code: "БП",  icon: "🎯", label: "Боевая подг.",   color: "#ef4444" },
  { code: "ПД",  icon: "⚙",  label: "Повседн. деят.", color: "#f59e0b" },
  { code: "ВПР", icon: "🎖", label: "ВПР",            color: "#a78bfa" },
  { code: "У",   icon: "🏁", label: "Увольнение",     color: "#f97316" },
  { code: "П",   icon: "🔰", label: "Призыв",         color: "#06b6d4" },
  { code: "ЗиТ", icon: "💻", label: "Техника",        color: "#94a3b8" },
  { code: "ЕМ",  icon: "📋", label: "Ежемесячные",   color: "#fbbf24" },
  { code: "НД",  icon: "🔬", label: "Научная деят.", color: "#10b981" },
  { code: "МГ",  icon: "⚡", label: "Мобготовность", color: "#ef4444" },
] as const;

const PERSONNEL = ["КВ-2","КВ-1","ЗКВ-2","ЗКВ-1","СР","КНР", "КО-2"] as const;

const PRIORITIES = [
  { value: "normal",   label: "Нормальный",  color: "#10b981" },
  { value: "high",     label: "Высокий",     color: "#f59e0b" },
  { value: "critical", label: "Критический", color: "#ef4444" },
] as const;

const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"] as const;

// ── label style helper ────────────────────────────────────────────────
const labelCls = "text-[9px] font-mono tracking-[2px] uppercase block mb-1.5";
const labelStyle = { color: "rgba(255,255,255,0.3)" };

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  fontSize: 13,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#e8f0fe",
  outline: "none",
  transition: "border-color 0.15s",
  fontFamily: "inherit",
};

// ── AddTaskButton ─────────────────────────────────────────────────────

export function AddTaskButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold tracking-wide transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.18))",
          border: "1px solid rgba(59,130,246,0.4)",
          color: "#93c5fd",
          boxShadow: "0 4px 16px rgba(59,130,246,0.15)",
          letterSpacing: "0.04em",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(59,130,246,0.35), rgba(99,102,241,0.28))"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(59,130,246,0.25)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.18))"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(59,130,246,0.15)"; }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
        Новая задача
      </button>

      {open && <AddTaskModal onClose={() => setOpen(false)} />}
    </>
  );
}

// ── AddTaskModal ──────────────────────────────────────────────────────

function AddTaskModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const currentMonth = new Date().getMonth() + 1;

  const [form, setForm] = useState({
    title:       "",
    category:    "ПД" as typeof CATEGORIES[number]["code"],
    priority:    "normal" as "normal" | "high" | "critical",
    responsible: "ЗКВ-2" as typeof PERSONNEL[number],
    month:       currentMonth,
    dateFrom:    1,
    dateTo:      1,
    description: "",
    notes:       "",
  });

  const set = (key: keyof typeof form, value: string | number) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const selectedCat = CATEGORIES.find(c => c.code === form.category);

  const handleSubmit = () => {
    if (!form.title.trim()) { setError("Введите название задачи"); return; }
    if (form.dateFrom > form.dateTo) { setError("Дата начала не может быть позже даты конца"); return; }
    setError("");

    startTransition(async () => {
      const result = await createTask({
        title:       form.title.trim(),
        category:    form.category,
        priority:    form.priority,
        responsible: form.responsible,
        month:       form.month,
        dateFrom:    form.dateFrom,
        dateTo:      form.dateTo,
        description: form.description || null,
        notes:       form.notes || null,
        status:      "pending",
      });
      if (result.success) {
        onClose();
        router.refresh();
      } else {
        setError(result.error ?? "Ошибка при создании задачи");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(145deg, rgba(13,24,41,0.99), rgba(7,13,26,0.97))",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05) inset",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "linear-gradient(135deg, rgba(59,130,246,0.05), transparent)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.15))", border: "1px solid rgba(59,130,246,0.35)" }}>
              <span style={{ fontSize: 14 }}>+</span>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold" style={{ color: "#e8f0fe" }}>Новая задача</h3>
              <p className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>// ЦСУ ПД · Научная рота</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[18px] transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Title */}
          <label className="block">
            <span className={labelCls} style={labelStyle}>// Название задачи *</span>
            <input
              autoFocus
              value={form.title}
              onChange={e => set("title", e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="Наименование мероприятия..."
              style={inputStyle}
            />
          </label>

          {/* Category */}
          <div>
            <span className={labelCls} style={labelStyle}>// Категория</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => {
                const active = form.category === cat.code;
                return (
                  <button key={cat.code} type="button" onClick={() => set("category", cat.code)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold transition-all"
                    style={active ? {
                      background: `${cat.color}20`,
                      border: `1px solid ${cat.color}50`,
                      color: cat.color,
                      boxShadow: `0 2px 10px ${cat.color}15`,
                    } : {
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.3)",
                    }}>
                    <span className="text-[11px]">{cat.icon}</span> {cat.code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority + Responsible */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={labelCls} style={labelStyle}>// Приоритет</span>
              <div className="flex gap-1.5">
                {PRIORITIES.map(p => {
                  const active = form.priority === p.value;
                  return (
                    <button key={p.value} type="button" onClick={() => set("priority", p.value)}
                      className="flex-1 py-2 rounded-lg text-[9px] font-mono font-semibold tracking-wide transition-all"
                      style={active ? {
                        background: `${p.color}18`,
                        border: `1px solid ${p.color}50`,
                        color: p.color,
                        boxShadow: `0 2px 10px ${p.color}12`,
                      } : {
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.28)",
                      }}>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <span className={labelCls} style={labelStyle}>// Ответственный</span>
              <div className="grid grid-cols-3 gap-1">
                {PERSONNEL.map(p => {
                  const active = form.responsible === p;
                  return (
                    <button key={p} type="button" onClick={() => set("responsible", p)}
                      className="py-2 rounded-lg text-[10px] font-mono font-bold tracking-wide transition-all"
                      style={active ? {
                        background: "rgba(59,130,246,0.18)",
                        border: "1px solid rgba(59,130,246,0.5)",
                        color: "#93c5fd",
                      } : {
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.3)",
                      }}>
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Month + Date range */}
          <div>
            <span className={labelCls} style={labelStyle}>// Месяц исполнения</span>
            <div className="flex gap-1 flex-wrap">
              {MONTHS.map((m, i) => {
                const monthNum = i + 1;
                const active = form.month === monthNum;
                return (
                  <button key={monthNum} type="button" onClick={() => set("month", monthNum)}
                    className="px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-semibold transition-all"
                    style={active ? {
                      background: "rgba(59,130,246,0.2)",
                      border: "1px solid rgba(59,130,246,0.5)",
                      color: "#93c5fd",
                    } : {
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "rgba(255,255,255,0.25)",
                    }}>
                    {m.substring(0, 3).toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range */}
          <div>
            <span className={labelCls} style={labelStyle}>// Сроки · {MONTHS[form.month - 1]}</span>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[9px] font-mono mb-1" style={{ color: "rgba(255,255,255,0.2)" }}>С числа</p>
                <input type="number" min={1} max={31} value={form.dateFrom}
                  onChange={e => set("dateFrom", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{ ...inputStyle, textAlign: "center", fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#93c5fd" }}
                />
              </div>
              <div className="flex flex-col items-center gap-1 pt-4">
                <div className="h-px w-8" style={{ background: "rgba(59,130,246,0.35)" }} />
                <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>→</span>
                <div className="h-px w-8" style={{ background: "rgba(59,130,246,0.35)" }} />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-mono mb-1" style={{ color: "rgba(255,255,255,0.2)" }}>По число</p>
                <input type="number" min={1} max={31} value={form.dateTo}
                  onChange={e => set("dateTo", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{ ...inputStyle, textAlign: "center", fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#93c5fd" }}
                />
              </div>
              <div className="flex-1 pt-4">
                <p className="text-[9px] font-mono text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {form.dateTo >= form.dateFrom ? `${form.dateTo - form.dateFrom + 1} дн.` : "❌"}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <label className="block">
            <span className={labelCls} style={labelStyle}>// Описание (необязательно)</span>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Детали, контекст, требования..." rows={2}
              style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
          </label>

          {/* Notes */}
          <label className="block">
            <span className={labelCls} style={{ color: "rgba(245,158,11,0.4)" }}>// Примечания офицера</span>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Ремарки, уточнения..." rows={2}
              style={{ ...inputStyle, resize: "none", lineHeight: 1.6, color: "rgba(245,158,11,0.75)", fontFamily: "var(--font-mono)", fontSize: 12 }} />
          </label>

          {/* Error */}
          {error && (
            <div className="px-3 py-2.5 rounded-xl text-[11px] font-mono"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Preview pill */}
          <div className="flex items-center gap-2 min-w-0">
            {selectedCat && (
              <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded-lg shrink-0"
                style={{ background: `${selectedCat.color}18`, border: `1px solid ${selectedCat.color}40`, color: selectedCat.color }}>
                {selectedCat.icon} {form.category}
              </span>
            )}
            <span className="text-[11px] font-mono truncate" style={{ color: "rgba(255,255,255,0.25)" }}>
              {form.responsible} · {MONTHS[form.month - 1].substring(0, 3)} {form.dateFrom === form.dateTo ? form.dateFrom : `${form.dateFrom}–${form.dateTo}`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-[12px] font-mono tracking-wide transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
              Отмена
            </button>
            <button type="button" onClick={handleSubmit} disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-[12px] font-semibold tracking-wide transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.35), rgba(99,102,241,0.25))",
                border: "1px solid rgba(59,130,246,0.5)",
                color: "#93c5fd",
                boxShadow: "0 4px 16px rgba(59,130,246,0.18)",
                letterSpacing: "0.04em",
              }}
              onMouseEnter={e => { if (!isPending) e.currentTarget.style.boxShadow = "0 4px 22px rgba(59,130,246,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(59,130,246,0.18)"; }}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-pulse">···</span> Создание
                </span>
              ) : (
                <>
                  <span style={{ fontSize: 14 }}>+</span>
                  Создать задачу
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}