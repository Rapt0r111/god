// components/ui/CheckBox.tsx
// Военный чекбокс — единый компонент вместо 4 дублирующихся реализаций.

interface CheckBoxProps {
  done: boolean;
  pending?: boolean;
  onToggle: (e: React.MouseEvent) => void;
  size?: number;
}

export function CheckBox({ done, pending = false, onToggle, size = 22 }: CheckBoxProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(e); }}
      disabled={pending}
      className={`checkbox-military${done ? " checked" : ""}`}
      aria-label={done ? "Переоткрыть задачу" : "Завершить задачу"}
      style={{ width: size, height: size, minWidth: size, opacity: pending ? 0.5 : 1, cursor: pending ? "wait" : "pointer" }}
    >
      {pending
        ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--text-muted)" }}>···</span>
        : done
          ? <span style={{ fontSize: size * 0.5 }}>✓</span>
          : null}
    </button>
  );
}