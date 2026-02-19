// src/components/layout/Sidebar.tsx
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/",         icon: "◈", label: "Дашборд"      },
  { href: "/tasks",    icon: "≡", label: "Задачи"        },
  { href: "/timeline", icon: "◫", label: "Хронология"   },
  { href: "/roles",    icon: "◉", label: "Личный состав" },
] as const;

const CATEGORIES = [
  { code: "Н",  icon: "⚗",  label: "Наука",           color: "#34d399" },
  { code: "А",  icon: "📡", label: "Агитация",         color: "#60a5fa" },
  { code: "БП", icon: "🎯", label: "Боевая подготовка",color: "#f87171" },
  { code: "ПД", icon: "⚙",  label: "Повседн. деят.",   color: "#f59e0b" },
  { code: "У",  icon: "🏁", label: "Увольнение",       color: "#fb923c" },
  { code: "П",  icon: "🔰", label: "Призыв",           color: "#22d3ee" },
] as const;

export async function Sidebar() {
  return (
    <nav className="w-[220px] min-w-[220px] bg-panel border-r border-default flex flex-col relative z-10">
      {/* Логотип */}
      <div className="px-4 pt-5 pb-4 border-b border-default">
        <p className="font-mono text-[9px] text-accent-blue tracking-[3px] uppercase mb-1.5 opacity-70">
          // СИСТЕМА УПРАВЛЕНИЯ
        </p>
        <h1 className="font-display text-[18px] font-bold text-primary tracking-wide leading-tight">
          ЦСУ ПД
        </h1>
        <p className="font-mono text-[10px] text-(--color-accent-amber) mt-1 tracking-wide">
          НАУЧНАЯ РОТА · В/Ч
        </p>
      </div>

      {/* Навигация */}
      <div className="flex-1 py-3 overflow-y-auto">
        <p className="font-mono text-[9px] text-dim tracking-[2px] px-4 py-2 uppercase">
          Навигация
        </p>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center gap-2.5 px-4 py-[9px] border-l-2 border-transparent",
              "font-body text-[13px] font-medium text-secondary",
              "transition-all duration-150",
              "hover:bg-bg-hover hover:text-primary",
            ].join(" ")}
          >
            <span className="text-[15px] w-5 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <p className="font-mono text-[9px] text-dim tracking-[2px] px-4 pt-4 pb-2 uppercase">
          Категории
        </p>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.code}
            href={`/tasks?category=${cat.code}`}
            className="flex items-center gap-2.5 px-4 py-2 transition-all hover:bg-bg-hover"
          >
            <span className="text-[12px]">{cat.icon}</span>
            <span
              className="font-mono text-[10px] tracking-wide"
              style={{ color: cat.color }}
            >
              {cat.code}
            </span>
            <span className="font-body text-[11px] text-secondary">{cat.label}</span>
          </Link>
        ))}
      </div>

      {/* Статус */}
      <div className="px-4 py-3 border-t border-default space-y-1.5">
        <StatusRow color="#34d399" label="СИСТЕМА АКТИВНА"      delay="0s" />
        <StatusRow color="#f59e0b" label="LOCAL-FIRST · OFFLINE OK" delay="1s" />
      </div>
    </nav>
  );
}

function StatusRow({ color, label, delay }: {
  color: string; label: string; delay: string;
}) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] text-dim">
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: color, animationDelay: delay }}
      />
      {label}
    </div>
  );
}