import { PiggyBank, type LucideIcon } from "lucide-react";

export function EmptyState({ title, actionLabel, onAction, icon: Icon = PiggyBank }: { title: string; actionLabel?: string; onAction?: () => void; icon?: LucideIcon }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={30} /></div>
      <p>{title}</p>
      {actionLabel && onAction && <button className="text-button" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}
