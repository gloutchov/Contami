import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface HistorySeries {
  key: string;
  label: string;
  color: string;
}

export function HistoryChart({
  data,
  series,
  format,
  type = "line",
  ariaLabel,
  xKey = "year",
  xTickFormatter,
}: {
  data: Array<Record<string, number | string>>;
  series: HistorySeries[];
  format: (value: number) => string;
  type?: "line" | "bar";
  ariaLabel: string;
  xKey?: string;
  xTickFormatter?: (value: string | number) => string;
}) {
  if (!data.length || !data.some((item) => series.some((candidate) => Number(item[candidate.key]) !== 0))) return null;
  const common = <>
    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
    <XAxis dataKey={xKey} tick={{ fill: "var(--muted)", fontSize: 10 }} tickFormatter={xTickFormatter} minTickGap={28} interval="preserveStartEnd" />
    <YAxis tick={{ fill: "var(--muted)", fontSize: 9 }} width={58} />
    <Tooltip formatter={(value) => format(Number(value))} contentStyle={{ background: "var(--surface-solid)", border: "1px solid var(--border)", borderRadius: 10 }} />
    <Legend />
  </>;
  return <div className="history-chart detail-history-chart" role="img" aria-label={ariaLabel}>
    <ResponsiveContainer width="100%" height="100%">
      {type === "bar" ? <BarChart data={data}>{common}{series.map((item) => <Bar key={item.key} name={item.label} dataKey={item.key} fill={item.color} radius={[4, 4, 0, 0]} />)}</BarChart>
        : <LineChart data={data}>{common}{series.map((item) => <Line key={item.key} name={item.label} type="monotone" dataKey={item.key} stroke={item.color} strokeWidth={2.5} dot={data.length < 15} />)}</LineChart>}
    </ResponsiveContainer>
  </div>;
}
