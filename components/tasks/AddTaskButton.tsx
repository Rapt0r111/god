"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "@/actions/tasks";

const CATEGORIES = [
  { code: "Н",   icon: "⚗",  label: "Наука",         color: "#1ae8a0" },
  { code: "А",   icon: "📡", label: "Агитация",       color: "#4f8ef7" },
  { code: "БП",  icon: "🎯", label: "Боевая подг.",   color: "#ff6b6b" },
  { code: "ПД",  icon: "⚙",  label: "Повседн. деят.", color: "#f5b942" },
  { code: "ВПР", icon: "🎖", label: "ВПР",            color: "#9d7afe" },
  { code: "У",   icon: "🏁", label: "Увольнение",     color: "#ff8c42" },
  { code: "П",   icon: "🔰", label: "Призыв",         color: "#22d4f0" },
  { code: "ЗиТ", icon: "💻", label: "Техника",        color: "#8899bb" },
  { code: "ЕМ",  icon: "📋", label: "Ежемесячные",   color: "#f5b942" },
  { code: "НД",  icon: "🔬", label: "Научная деят.", color: "#1ae8a0" },
  { code: "МГ",  icon: "⚡", label: "Мобготовность", color: "#ff6b6b" },
] as const;

const PERSONNEL = ["КВ-2","КВ-1","ЗКВ-2","ЗКВ-1","СР","КНР","КО-2"] as const;

const PRIORITIES = [
  { value: "normal",   label: "Нормальный",  color: "#4f8ef7" },
  { value: "high",     label: "Высокий",     color: "#f5b942" },
  { value: "critical", label: "Критический", color: "#ff6b6b" },
] as const;

const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"] as const;

const inputStyle = {
  width: "100%", padding: "9px 14px", borderRadius: 12, fontSize: 13,
  background: "rgba(8,15,28,0.9)", border: "1px solid rgba(255,255,255,0.08)",
  color: "#eef2ff", outline: "none", fontFamily: "inherit",
};

export function AddTaskButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-semibold tracking-wide transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, rgba(79,142,247,0.28), rgba(34,212,240,0.15))",
          border: "1px solid rgba(79,142,247,0.35)",
          color: "#c7d8ff",
          boxShadow: "0 4px 16px rgba(79,142,247,0.15)",
          letterSpacing: "0.04em",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "linear-gradient(135deg, rgba(79,142,247,0.38), rgba(34,212,240,0.22))";
          e.currentTarget.style.boxShadow = "0 4px 24px rgba(79,142,247,0.28)";
          e.currentTarget.style.borderColor = "rgba(79,142,247,0.55)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "linear-gradient(135deg, rgba(79,142,247,0.28), rgba(34,212,240,0.15))";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(79,142,247,0.15)";
          e.currentTarget.style.borderColor = "rgba(79,142,247,0.35)";
        }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
        Новая задача
      </button>
      {open && <AddTaskModal onClose={() => setOpen(false)} />}
    </>
  );
}

function AddTaskModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const currentMonth = new Date().getMonth() + 1;

  const [form, setForm] = useState({
    title: "", category: "ПД" as typeof CATEGORIES[number]["code"],
    priority: "normal" as "normal" | "high" | "critical",
    responsible: "ЗКВ-2" as typeof PERSONNEL[number],
    month: currentMonth, dateFrom: 1, dateTo: 1,
    description: "", notes: "",
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
        title: form.title.trim(), category: form.category, priority: form.priority,
        responsible: form.responsible, month: form.month, dateFrom: form.dateFrom,
        dateTo: form.dateTo, description: form.description || null,
        notes: form.notes || null, status: "pending",
      });
      if (result.success) { onClose(); router.refresh(); }
      else setError(result.error ?? "Ошибка при создании задачи");
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(2,5,16,0.78)", backdropFilter: "blur(16px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl animate-scale-in"
        style={{
          background: "linear-gradient(145deg, rgba(10,18,34,0.99), rgba(6,11,22,0.97))",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.07) inset",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(135deg, rgba(79,142,247,0.04), transparent)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(79,142,247,0.22), rgba(34,212,240,0.12))", border: "1px solid rgba(79,142,247,0.3)" }}>
              <span style={{ fontSize: 14 }}>+</span>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold" style={{ color: "#eef2ff" }}>Новая задача</h3>
              <p className="text-[10px] font-mono" style={{ color: "rgba(136,153,187,0.5)" }}>// ЦСУ ПД · Научная рота</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[18px] transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(136,153,187,0.5)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#eef2ff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "rgba(136,153,187,0.5)"; }}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <label className="block">
            <span className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5" style={{ color: "rgba(136,153,187,0.6)" }}>// Название задачи *</span>
            <input autoFocus value={form.title} onChange={e => set("title", e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="Наименование мероприятия..." style={inputStyle} />
          </label>

          <div>
            <span className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5" style={{ color: "rgba(136,153,187,0.6)" }}>// Категория</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => {
                const active = form.category === cat.code;
                return (
                  <button key={cat.code} type="button" onClick={() => set("category", cat.code)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-semibold transition-all"
                    style={active ? {
                      background: `${cat.color}18`, border: `1px solid ${cat.color}45`, color: cat.color,
                    } : { background: "rgba(8,15,28,0.8)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(136,153,187,0.5)" }}>
                    <span className="text-[11px]">{cat.icon}</span> {cat.code}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5" style={{ color: "rgba(136,153,187,0.6)" }}>// Приоритет</span>
              <div className="flex gap-1.5">
                {PRIORITIES.map(p => {
                  const active = form.priority === p.value;
                  return (
                    <button key={p.value} type="button" onClick={() => set("priority", p.value)}
                      className="flex-1 py-2 rounded-xl text-[9px] font-mono font-semibold tracking-wide transition-all"
                      style={active ? {
                        background: `${p.color}15`, border: `1px solid ${p.color}45`, color: p.color,
                      } : { background: "rgba(8,15,28,0.8)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(136,153,187,0.4)" }}>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <span className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5" style={{ color: "rgba(136,153,187,0.6)" }}>// Ответственный</span>
              <div className="grid grid-cols-3 gap-1">
                {PERSONNEL.map(p => {
                  const active = form.responsible === p;
                  return (
                    <button key={p} type="button" onClick={() => set("responsible", p)}
                      className="py-2 rounded-xl text-[10px] font-mono font-bold tracking-wide transition-all"
                      style={active ? {
                        background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.4)", color: "#c7d8ff",
                      } : { background: "rgba(8,15,28,0.8)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(136,153,187,0.45)" }}>
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <span className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5" style={{ color: "rgba(136,153,187,0.6)" }}>// Месяц исполнения</span>
            <div className="flex gap-1 flex-wrap">
              {MONTHS.map((m, i) => {
                const monthNum = i + 1;
                const active = form.month === monthNum;
                return (
                  <button key={monthNum} type="button" onClick={() => set("month", monthNum)}
                    className="px-2.5 py-1.5 rounded-xl text-[9px] font-mono font-semibold transition-all"
                    style={active ? {
                      background: "rgba(79,142,247,0.18)", border: "1px solid rgba(79,142,247,0.45)", color: "#c7d8ff",
                    } : { background: "rgba(8,15,28,0.8)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(136,153,187,0.45)" }}>
                    {m.substring(0, 3).toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5" style={{ color: "rgba(136,153,187,0.6)" }}>// Сроки · {MONTHS[form.month - 1]}</span>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[9px] font-mono mb-1" style={{ color: "rgba(136,153,187,0.3)" }}>С числа</p>
                <input type="number" min={1} max={31} value={form.dateFrom}
                  onChange={e => set("dateFrom", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{ ...inputStyle, textAlign: "center", fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#c7d8ff" }} />
              </div>
              <div className="flex flex-col items-center gap-1 pt-5">
                <div className="h-px w-8" style={{ background: "rgba(79,142,247,0.3)" }} />
                <span className="text-[10px] font-mono" style={{ color: "rgba(136,153,187,0.25)" }}>→</span>
                <div className="h-px w-8" style={{ background: "rgba(79,142,247,0.3)" }} />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-mono mb-1" style={{ color: "rgba(136,153,187,0.3)" }}>По число</p>
                <input type="number" min={1} max={31} value={form.dateTo}
                  onChange={e => set("dateTo", Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{ ...inputStyle, textAlign: "center", fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#c7d8ff" }} />
              </div>
              <div className="flex-1 pt-5">
                <p className="text-[9px] font-mono text-center" style={{ color: "rgba(136,153,187,0.35)" }}>
                  {form.dateTo >= form.dateFrom ? `${form.dateTo - form.dateFrom + 1} дн.` : "❌"}
                </p>
              </div>
            </div>
          </div>

          <label className="block">
            <span className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5" style={{ color: "rgba(136,153,187,0.6)" }}>// Описание (необязательно)</span>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Детали, контекст, требования..." rows={2}
              style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
          </label>

          <label className="block">
            <span className="text-[9px] font-mono tracking-[2px] uppercase block mb-1.5" style={{ color: "rgba(245,185,66,0.4)" }}>// Примечания офицера</span>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Ремарки, уточнения..." rows={2}
              style={{ ...inputStyle, resize: "none", lineHeight: 1.6, color: "rgba(245,185,66,0.75)", fontFamily: "var(--font-mono)", fontSize: 12 }} />
          </label>

          {error && (
            <div className="px-3 py-2.5 rounded-2xl text-[11px] font-mono"
              style={{ background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.25)", color: "#ff9999" }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {selectedCat && (
            <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-xl"
              style={{ background: `${selectedCat.color}15`, border: `1px solid ${selectedCat.color}35`, color: selectedCat.color }}>
              {selectedCat.icon} {form.category} · {form.responsible} · {form.dateFrom}–{form.dateTo}
            </span>
          )}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-2xl text-[12px] font-mono tracking-wide transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(136,153,187,0.5)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
              Отмена
            </button>
            <button type="button" onClick={handleSubmit} disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-2xl text-[12px] font-semibold tracking-wide transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, rgba(79,142,247,0.3), rgba(34,212,240,0.18))",
                border: "1px solid rgba(79,142,247,0.45)",
                color: "#c7d8ff",
                boxShadow: "0 4px 16px rgba(79,142,247,0.15)",
              }}>
              {isPending ? <span className="animate-pulse">···</span> : <><span style={{ fontSize: 14 }}>+</span> Создать задачу</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}