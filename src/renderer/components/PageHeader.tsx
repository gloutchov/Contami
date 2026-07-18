import { Plus } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, subtitle, actionLabel, onAction, secondary }: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondary?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      <div className="page-actions">
        {secondary}
        {actionLabel && onAction && <button className="primary-button" onClick={onAction}><Plus size={17} />{actionLabel}</button>}
      </div>
    </div>
  );
}
