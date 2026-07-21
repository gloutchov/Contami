import { X } from "lucide-react";
import { useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n/I18nContext";
import { useDialogFocus } from "./useDialogFocus";

export function DetailDialog({ title, children, actions, onClose }: { title: string; children: ReactNode; actions?: ReactNode; onClose: () => void }) {
  const { t } = useI18n();
  const titleId = useId();
  const dialogRef = useDialogFocus(onClose);
  return createPortal(<div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className="modal detail-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={(event) => event.stopPropagation()}>
      <header><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label={t("close")}><X size={20}/></button></header>
      <div className="detail-body">{children}</div>
      {actions && <footer>{actions}</footer>}
    </section>
  </div>, document.body);
}
