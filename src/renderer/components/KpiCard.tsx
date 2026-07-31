import type { LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";

export function KpiCard({ label, value, icon: Icon, tone = "mint", detail, tooltip }: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "mint" | "gold" | "blue" | "coral";
  detail?: string;
  tooltip?: ReactNode;
}) {
  const tooltipId = useId();
  return (
    <article
      className={`kpi-card ${tone}${tooltip ? " has-tooltip" : ""}`}
      tabIndex={tooltip ? 0 : undefined}
      aria-describedby={tooltip ? tooltipId : undefined}
    >
      <div className="kpi-icon"><Icon size={20} /></div>
      <div><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>
      {tooltip && <div className="kpi-tooltip" id={tooltipId} role="tooltip">{tooltip}</div>}
    </article>
  );
}
