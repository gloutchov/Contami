import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n/I18nContext";

export function DetailDialog({ title, children, actions, onClose }: { title: string; children: ReactNode; actions?: ReactNode; onClose: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return createPortal(<div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={(event) => event.stopPropagation()}>
      <header><h2 id="detail-title">{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label={t("close")}><X size={20}/></button></header>
      <div className="detail-body">{children}</div>
      {actions && <footer>{actions}</footer>}
    </section>
  </div>, document.body);
}
