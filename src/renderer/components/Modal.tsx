import { X } from "lucide-react";
import { useEffect, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n/I18nContext";

export function Modal({ title, children, onClose, onSubmit, submitDisabled = false }: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitDisabled?: boolean;
}) {
  const { t } = useI18n();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  return createPortal(
    <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}>
        <header><h2 id="modal-title">{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label={t("close")}><X size={20} /></button></header>
        <form onSubmit={onSubmit}>
          <div className="modal-body">{children}</div>
          <footer><button type="button" className="secondary-button" onClick={onClose}>{t("cancel")}</button><button type="submit" className="primary-button" disabled={submitDisabled}>{t("save")}</button></footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
export function Field({ label, children, wide = false, hint }: { label: string; children: ReactNode; wide?: boolean; hint?: string }) {
  return <label className={wide ? "field wide" : "field"}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
