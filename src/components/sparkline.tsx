import type { StarHistoryPoint } from "@/lib/types";

export function Sparkline({
  points,
  className = "",
}: {
  points: StarHistoryPoint[];
  className?: string;
}) {
  if (points.length < 2) {
    return (
      <p className="text-xs text-muted-foreground">快照不足，暂无趋势图</p>
    );
  }

  const width = 320;
  const height = 72;
  const values = points.map((point) => point.stars);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const coords = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / span) * (height - 8) - 4;
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full max-w-md text-emerald-800 ${className}`}
      role="img"
      aria-label="星标趋势"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={coords.join(" ")}
      />
    </svg>
  );
}
