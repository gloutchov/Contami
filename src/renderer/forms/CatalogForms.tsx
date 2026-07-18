import { useState, type FormEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import { Field, Modal } from "../components/Modal";
import { useI18n } from "../i18n/I18nContext";
import { saveAndClose } from "../utils/save";

type Save = (command: FinanceCommand) => Promise<void>;

export function CategoryForm({ onClose, onSave }: { onClose: () => void; onSave: Save }) {
  const { t } = useI18n();
  const [nameIt, setNameIt] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [kind, setKind] = useState<"income" | "expense" | "both">("expense");
  const valid = Boolean(nameIt.trim() && nameEn.trim());
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;
    await saveAndClose(onSave, {
      type: "addCategory",
      value: { id: crypto.randomUUID(), nameIt, nameEn, kind, active: true },
    }, onClose);
  };
  return <Modal title={t("newCategory")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("categoryNameIt")}><input required maxLength={240} value={nameIt} onChange={(event) => setNameIt(event.target.value)} autoFocus /></Field>
    <Field label={t("categoryNameEn")}><input required maxLength={240} value={nameEn} onChange={(event) => setNameEn(event.target.value)} /></Field>
    <Field label={t("type")}><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="expense">{t("expense")}</option><option value="income">{t("income")}</option><option value="both">{t("both")}</option></select></Field>
  </Modal>;
}

export function PaymentMethodForm({ onClose, onSave }: { onClose: () => void; onSave: Save }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"cash" | "card" | "bank_transfer" | "direct_debit" | "digital_wallet" | "other">("card");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    await saveAndClose(onSave, {
      type: "addPaymentMethod",
      value: { id: crypto.randomUUID(), name, kind, active: true },
    }, onClose);
  };
  return <Modal title={t("newPaymentMethod")} onClose={onClose} onSubmit={submit} submitDisabled={!name.trim()}>
    <Field label={t("name")} wide><input required maxLength={240} value={name} onChange={(event) => setName(event.target.value)} autoFocus /></Field>
    <Field label={t("type")}><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="cash">{t("cash")}</option><option value="card">{t("card")}</option><option value="bank_transfer">{t("bankTransfer")}</option><option value="direct_debit">{t("directDebit")}</option><option value="digital_wallet">{t("digitalWallet")}</option><option value="other">{t("other")}</option></select></Field>
  </Modal>;
}
