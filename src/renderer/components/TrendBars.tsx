import { useId } from "react";

export type TrendPoint = { value: number } & ({ label: string; year?: never } | { year: number; label?: never });

export function TrendBars({ points, format }: { points: TrendPoint[]; format: (value: number) => string }) {
  const chartId = useId().replaceAll(":", "");
  const maximum = Math.max(0, ...points.map((point) => point.value));
  if (!points.length || maximum === 0) return null;
  const accessibleLabel = points.map((point) => {
    const label = "label" in point ? point.label : point.year;
    return `${label}: ${format(point.value)}`;
  }).join("; ");
  return <div className="trend-bars" role="img" aria-label={accessibleLabel}>
    {points.map((point, index) => {
      const label = "label" in point ? point.label : point.year;
      const height = Math.max(3, point.value / maximum * 100);
      return <div className="trend-column" key={label} title={`${label}: ${format(point.value)}`}>
        <span className="trend-value">{format(point.value)}</span>
        <svg className="trend-track" key={`${label}-${point.value}`} viewBox="0 0 20 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${chartId}-trend-${index}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--mint)" />
              <stop offset="1" stopColor="var(--navy-2)" />
            </linearGradient>
          </defs>
          <rect className="trend-fill" fill={`url(#${chartId}-trend-${index})`} height={height} rx="3" width="14" x="3" y={100 - height} />
        </svg>
        <small>{label}</small>
      </div>;
    })}
  </div>;
}
