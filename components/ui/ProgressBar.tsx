// components/ui/ProgressBar.tsx

interface ProgressBarProps {
  done: number;
  total: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({
  done, total, color = "oklch(68% 0.18 272)", height = 3, showLabel = false,
}: ProgressBarProps) {
  if (total === 0) return null;

  const pct = Math.round((done / total) * 100);
  const isComplete = pct === 100;
  const fillColor = isComplete ? "oklch(72% 0.17 155)" : color;

  return (
    <div style={{ width: showLabel ? undefined : 56 }}>
      <div style={{ height, borderRadius: height, overflow: "hidden", background: "oklch(100% 0 0 / 0.07)" }}>
        <div
          style={{
            height: "100%", width: `${pct}%`, borderRadius: height,
            background: fillColor,
            boxShadow: isComplete ? `0 0 6px oklch(72% 0.17 155 / 0.5)` : "none",
            transition: "width 0.5s ease",
          }}
        />
      </div>
      {showLabel && (
        <p style={{
          fontSize: 9, fontFamily: "var(--font-mono)", marginTop: 2,
          textAlign: "right", letterSpacing: "0.5px",
          color: isComplete ? "oklch(72% 0.17 155)" : "var(--text-muted)",
        }}>
          {pct}%
        </p>
      )}
    </div>
  );
}