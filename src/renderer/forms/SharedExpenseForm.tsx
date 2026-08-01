import { useMemo, useState, type FormEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData, SharedExpense } from "../../domain/models";
import { Field, Modal } from "../components/Modal";
import { PaymentAccountField } from "../components/PaymentAccountField";
import { useI18n } from "../i18n/I18nContext";
import { todayIso } from "../utils/format";
import { saveAndClose } from "../utils/save";

export function SharedExpenseForm({ data, value, onClose, onSave }: { data: FinanceData; value?: SharedExpense; onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n();
  const [date, setDate] = useState(value?.date ?? todayIso()); const [description, setDescription] = useState(value?.description ?? ""); const [amount, setAmount] = useState(value ? String(value.amount) : ""); const [ownerShare, setOwnerShare] = useState(value ? String(value.ownerShare) : ""); const [partnerShare, setPartnerShare] = useState(value ? String(value.partnerShare) : ""); const [notes, setNotes] = useState(value?.notes ?? "");
  const [paidBy, setPaidBy] = useState<SharedExpense["paidBy"]>(value?.paidBy ?? "owner"); const [categoryId, setCategoryId] = useState(value?.categoryId ?? data.categories.find((item) => item.active && item.kind !== "income")?.id ?? ""); const [paymentMethodId, setPaymentMethodId] = useState(value?.paymentMethodId ?? data.paymentMethods.find((item) => item.active)?.id ?? "");
  const [accountId, setAccountId] = useState(value?.accountId ?? "");
  const sharesMatch = useMemo(() => Math.abs(Number(ownerShare || 0) + Number(partnerShare || 0) - Number(amount || 0)) <= 0.01, [amount, ownerShare, partnerShare]);
  const valid = Boolean(description.trim() && Number(amount) > 0 && categoryId && paymentMethodId && accountId && sharesMatch);
  const splitHalf = (next: string) => { setAmount(next); const half = Number(next || 0) / 2; setOwnerShare(half ? half.toFixed(2) : ""); setPartnerShare(half ? (Number(next) - half).toFixed(2) : ""); };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!valid) return;
    const item: SharedExpense = { ...value, id: value?.id ?? crypto.randomUUID(), date, description, categoryId, paymentMethodId, accountId, amount: Number(amount), ownerShare: Number(ownerShare), partnerShare: Number(partnerShare), paidBy, settled: value?.settled ?? false, transactionId: value?.transactionId, notes };
    await saveAndClose(onSave, { type: value ? "updateSharedExpense" : "addSharedExpense", value: item }, onClose);
  };
  return <Modal title={value ? t("editShared") : t("newShared")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("date")}><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
    <Field label={t("paidBy")}><select value={paidBy} onChange={(event) => setPaidBy(event.target.value as SharedExpense["paidBy"])}><option value="owner">{t("you")}</option><option value="partner">{t("partner")}</option></select></Field>
    <Field label={t("description")} wide><input required value={description} maxLength={240} onChange={(event) => setDescription(event.target.value)} autoFocus /></Field>
    <Field label={t("amount")}><input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => splitHalf(event.target.value)} /></Field>
    <Field label={t("category")}><select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{data.categories.filter((item) => item.active && item.kind !== "income").map((item) => <option key={item.id} value={item.id}>{language === "it" ? item.nameIt : item.nameEn}</option>)}</select></Field>
    <Field label={t("yourShare")}><input required type="number" min="0" step="0.01" value={ownerShare} onChange={(event) => setOwnerShare(event.target.value)} /></Field>
    <Field label={t("partnerShare")} hint={!sharesMatch ? t("shareMismatch") : undefined}><input required type="number" min="0" step="0.01" value={partnerShare} onChange={(event) => setPartnerShare(event.target.value)} /></Field>
    <Field label={t("paymentMethod")}><select required value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}>{data.paymentMethods.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <PaymentAccountField data={data} paymentMethodId={paymentMethodId} date={date} value={accountId} onChange={setAccountId} />
    <Field label={t("notes")} wide><textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}
