export type TrendPoint = { value: number } & ({ label: string; year?: never } | { year: number; label?: never });

export function TrendBars({ points, format }: { points: TrendPoint[]; format: (value: number) => string }) {
  const maximum = Math.max(0, ...points.map((point) => point.value));
  if (!points.length || maximum === 0) return null;
  return <div className="trend-bars" role="img">
    {points.map((point) => { const label = "label" in point ? point.label : point.year; return <div className="trend-column" key={label} title={`${label}: ${format(point.value)}`}>
      <span className="trend-value">{format(point.value)}</span>
      <span className="trend-track"><i style={{ height: `${Math.max(3, point.value / maximum * 100)}%` }} /></span>
      <small>{label}</small>
    </div>; })}
  </div>;
}
