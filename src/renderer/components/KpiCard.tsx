import type { LucideIcon } from "lucide-react";

export function KpiCard({ label, value, icon: Icon, tone = "mint", detail }: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "mint" | "gold" | "blue" | "coral";
  detail?: string;
}) {
  return (
    <article className={`kpi-card ${tone}`}>
      <div className="kpi-icon"><Icon size={20} /></div>
      <div><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>
    </article>
  );
}
