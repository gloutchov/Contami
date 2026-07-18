import { PiggyBank } from "lucide-react";

export function EmptyState({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><PiggyBank size={30} /></div>
      <p>{title}</p>
      {actionLabel && onAction && <button className="text-button" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}
