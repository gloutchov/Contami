import { useState, type FormEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { Category, InvestmentType, PaymentMethod, TaxType } from "../../domain/models";
import { Field, Modal } from "../components/Modal";
import { useI18n } from "../i18n/I18nContext";
import { saveAndClose } from "../utils/save";

type Save = (command: FinanceCommand) => Promise<void>;

export function CategoryForm({ value, onClose, onSave }: { value?: Category; onClose: () => void; onSave: Save }) {
  const { t } = useI18n();
  const [nameIt, setNameIt] = useState(value?.nameIt ?? "");
  const [nameEn, setNameEn] = useState(value?.nameEn ?? "");
  const [kind, setKind] = useState<Category["kind"]>(value?.kind ?? "expense");
  const valid = Boolean(nameIt.trim() && nameEn.trim());
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!valid) return;
    const item: Category = { id: value?.id ?? crypto.randomUUID(), nameIt, nameEn, kind, active: value?.active ?? true };
    await saveAndClose(onSave, { type: value ? "updateCategory" : "addCategory", value: item }, onClose);
  };
  return <Modal title={value ? t("editCategory") : t("newCategory")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("categoryNameIt")}><input required maxLength={240} value={nameIt} onChange={(event) => setNameIt(event.target.value)} autoFocus /></Field>
    <Field label={t("categoryNameEn")}><input required maxLength={240} value={nameEn} onChange={(event) => setNameEn(event.target.value)} /></Field>
    <Field label={t("type")}><select value={kind} onChange={(event) => setKind(event.target.value as Category["kind"])}><option value="expense">{t("expense")}</option><option value="income">{t("income")}</option><option value="both">{t("both")}</option></select></Field>
  </Modal>;
}

export function PaymentMethodForm({ value, onClose, onSave }: { value?: PaymentMethod; onClose: () => void; onSave: Save }) {
  const { t } = useI18n();
  const [name, setName] = useState(value?.name ?? "");
  const [kind, setKind] = useState<PaymentMethod["kind"]>(value?.kind ?? "card");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!name.trim()) return;
    const item: PaymentMethod = { id: value?.id ?? crypto.randomUUID(), name, kind, active: value?.active ?? true };
    await saveAndClose(onSave, { type: value ? "updatePaymentMethod" : "addPaymentMethod", value: item }, onClose);
  };
  return <Modal title={value ? t("editPaymentMethod") : t("newPaymentMethod")} onClose={onClose} onSubmit={submit} submitDisabled={!name.trim()}>
    <Field label={t("name")} wide><input required maxLength={240} value={name} onChange={(event) => setName(event.target.value)} autoFocus /></Field>
    <Field label={t("type")}><select value={kind} onChange={(event) => setKind(event.target.value as PaymentMethod["kind"])}><option value="cash">{t("cash")}</option><option value="card">{t("card")}</option><option value="bank_transfer">{t("bankTransfer")}</option><option value="direct_debit">{t("directDebit")}</option><option value="digital_wallet">{t("digitalWallet")}</option><option value="other">{t("other")}</option></select></Field>
  </Modal>;
}

export function InvestmentTypeForm({ value, onClose, onSave }: { value?: InvestmentType; onClose: () => void; onSave: Save }) {
  const { t } = useI18n();
  const [nameIt, setNameIt] = useState(value?.nameIt ?? "");
  const [nameEn, setNameEn] = useState(value?.nameEn ?? "");
  const [code, setCode] = useState(value?.code ?? "other");
  const valid = Boolean(nameIt.trim() && nameEn.trim() && code !== "pension" && /^[a-z0-9_-]+$/.test(code));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!valid) return;
    const item: InvestmentType = { id: value?.id ?? crypto.randomUUID(), nameIt, nameEn, code, active: value?.active ?? true };
    await saveAndClose(onSave, { type: value ? "updateInvestmentType" : "addInvestmentType", value: item }, onClose);
  };
  return <Modal title={value ? t("editInvestmentType") : t("newInvestmentType")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("categoryNameIt")}><input required value={nameIt} onChange={(event) => setNameIt(event.target.value)} autoFocus /></Field>
    <Field label={t("categoryNameEn")}><input required value={nameEn} onChange={(event) => setNameEn(event.target.value)} /></Field>
    <Field label={t("code")}><input required pattern="[a-z0-9_-]+" value={code} onChange={(event) => setCode(event.target.value.toLowerCase().replace(/\s+/g, "_"))} /></Field>
    {code === "pension" && <p className="form-error field wide">{t("pensionCodeReserved")}</p>}
  </Modal>;
}

export function TaxTypeForm({ value, onClose, onSave }: { value?: TaxType; onClose: () => void; onSave: Save }) {
  const { t } = useI18n();
  const [name, setName] = useState(value?.name ?? "");
  const [appliesTo, setAppliesTo] = useState<TaxType["appliesTo"]>(value?.appliesTo ?? "all");
  const [installments, setInstallments] = useState(String(value?.installments ?? 1));
  const installmentCount = Number(installments);
  const valid = Boolean(name.trim() && Number.isInteger(installmentCount) && installmentCount >= 1 && installmentCount <= 24);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!valid) return;
    const item: TaxType = {
      id: value?.id ?? crypto.randomUUID(),
      name,
      appliesTo,
      installments: installmentCount,
      active: value?.active ?? true,
    };
    await saveAndClose(onSave, { type: value ? "updateTaxType" : "addTaxType", value: item }, onClose);
  };
  return <Modal title={value ? t("editTaxType") : t("newTaxType")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("taxName")} wide><input required maxLength={240} value={name} onChange={(event) => setName(event.target.value)} autoFocus /></Field>
    <Field label={t("taxAppliesTo")}><select value={appliesTo} onChange={(event) => setAppliesTo(event.target.value as TaxType["appliesTo"])}><option value="all">{t("allProperties")}</option><option value="residence">{t("residence")}</option><option value="rental">{t("rental")}</option></select></Field>
    <Field label={t("taxInstallmentCount")} hint={t("taxInstallmentCountHelp")}><input required type="number" min="1" max="24" step="1" value={installments} onChange={(event) => setInstallments(event.target.value)} /></Field>
  </Modal>;
}
