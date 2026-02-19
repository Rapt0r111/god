// src/components/layout/Sidebar.tsx
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/",         icon: "◈", label: "Дашборд"      },
  { href: "/tasks",    icon: "≡", label: "Задачи"        },
  { href: "/timeline", icon: "◫", label: "Хронология"   },
  { href: "/roles",    icon: "◉", label: "Личный состав" },
] as const;

const CATEGORIES = [
  { code: "Н",  icon: "⚗",  label: "Наука",           color: "#10b981" },
  { code: "А",  icon: "📡", label: "Агитация",         color: "#3b82f6" },
  { code: "БП", icon: "🎯", label: "Боевая подготовка",color: "#ef4444" },
  { code: "ПД", icon: "⚙",  label: "Повседн. деят.",   color: "#f59e0b" },
  { code: "У",  icon: "🏁", label: "Увольнение",       color: "#f97316" },
  { code: "П",  icon: "🔰", label: "Призыв",           color: "#06b6d4" },
] as const;

export async function Sidebar() {
  return (
    <nav className="w-[220px] min-w-[220px] glass-elevated flex flex-col relative z-10 border-r border-white/10">
      {/* Логотип */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <p className="text-[10px] text-blue-400/70 tracking-[3px] uppercase mb-2 font-mono">
          // СИСТЕМА УПРАВЛЕНИЯ
        </p>
        <h1 className="text-[20px] font-bold text-white tracking-wide leading-tight">
          ЦСУ ПД
        </h1>
        <p className="text-[11px] text-amber-400/80 mt-1 tracking-wide font-mono">
          НАУЧНАЯ РОТА · В/Ч
        </p>
      </div>

      {/* Навигация */}
      <div className="flex-1 py-4 overflow-y-auto">
        <p className="text-[9px] text-white/30 tracking-[2px] px-5 py-2 uppercase font-mono">
          Навигация
        </p>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center gap-3 px-5 py-2.5",
              "text-[13px] font-medium text-white/60",
              "transition-all duration-150 rounded-lg mx-2",
              "hover:bg-white/8 hover:text-white",
            ].join(" ")}
          >
            <span className="text-[15px] w-5 text-center opacity-70">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <p className="text-[9px] text-white/30 tracking-[2px] px-5 pt-5 pb-2 uppercase font-mono">
          Категории
        </p>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.code}
            href={`/tasks?category=${cat.code}`}
            className="flex items-center gap-2.5 px-5 py-2 mx-2 rounded-lg transition-all hover:bg-white/8"
          >
            <span className="text-[12px]">{cat.icon}</span>
            <span
              className="text-[10px] tracking-wide font-mono font-medium"
              style={{ color: cat.color }}
            >
              {cat.code}
            </span>
            <span className="text-[11px] text-white/50">{cat.label}</span>
          </Link>
        ))}
      </div>

      {/* Статус */}
      <div className="px-5 py-4 border-t border-white/10 space-y-2">
        <StatusRow color="#10b981" label="СИСТЕМА АКТИВНА"      delay="0s" />
        <StatusRow color="#f59e0b" label="LOCAL-FIRST · OFFLINE OK" delay="1s" />
      </div>
    </nav>
  );
}

function StatusRow({ color, label, delay }: {
  color: string; label: string; delay: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono">
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
        style={{ backgroundColor: color, animationDelay: delay }}
      />
      {label}
    </div>
  );
}