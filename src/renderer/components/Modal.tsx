import { X } from "lucide-react";
import { useId, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n/I18nContext";
import { useDialogFocus } from "./useDialogFocus";

export function Modal({ title, children, onClose, onSubmit, submitDisabled = false, submitLabel, secondaryActionLabel, onSecondaryAction }: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitDisabled?: boolean;
  submitLabel?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}) {
  const { t } = useI18n();
  const titleId = useId();
  const dialogRef = useDialogFocus(onClose);
  return createPortal(
    <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={(event) => event.stopPropagation()}>
        <header><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label={t("close")}><X size={20} /></button></header>
        <form onSubmit={onSubmit}>
          <div className="modal-body">{children}</div>
          <footer><button type="button" className="secondary-button" onClick={onClose}>{t("cancel")}</button>{secondaryActionLabel && onSecondaryAction && <button type="button" className="secondary-button" onClick={onSecondaryAction} disabled={submitDisabled}>{secondaryActionLabel}</button>}<button type="submit" className="primary-button" disabled={submitDisabled}>{submitLabel ?? t("save")}</button></footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
export function Field({ label, children, wide = false, hint }: { label: string; children: ReactNode; wide?: boolean; hint?: string }) {
  return <label className={wide ? "field wide" : "field"}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
