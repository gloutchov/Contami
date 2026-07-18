import { useMemo, useState, type FormEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData } from "../../domain/models";
import { Field, Modal } from "../components/Modal";
import { useI18n } from "../i18n/I18nContext";
import { todayIso } from "../utils/format";
import { saveAndClose } from "../utils/save";

export function SharedExpenseForm({ data, onClose, onSave }: { data: FinanceData; onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n();
  const [date, setDate] = useState(todayIso()); const [description, setDescription] = useState(""); const [amount, setAmount] = useState(""); const [ownerShare, setOwnerShare] = useState(""); const [partnerShare, setPartnerShare] = useState(""); const [notes, setNotes] = useState("");
  const [paidBy, setPaidBy] = useState<"owner" | "partner">("owner"); const [categoryId, setCategoryId] = useState(data.categories.find((item) => item.active && item.kind !== "income")?.id ?? ""); const [paymentMethodId, setPaymentMethodId] = useState(data.paymentMethods.find((item) => item.active)?.id ?? "");
  const sharesMatch = useMemo(() => Math.abs(Number(ownerShare || 0) + Number(partnerShare || 0) - Number(amount || 0)) <= 0.01, [amount, ownerShare, partnerShare]);
  const valid = description.trim() && Number(amount) > 0 && categoryId && paymentMethodId && sharesMatch;
  const splitHalf = (value: string) => { setAmount(value); const half = Number(value || 0) / 2; setOwnerShare(half ? half.toFixed(2) : ""); setPartnerShare(half ? half.toFixed(2) : ""); };
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!valid) return; await saveAndClose(onSave, { type: "addSharedExpense", value: { id: crypto.randomUUID(), date, description, categoryId, paymentMethodId, amount: Number(amount), ownerShare: Number(ownerShare), partnerShare: Number(partnerShare), paidBy, settled: false, notes } }, onClose); };
  return <Modal title={t("newShared")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("date")}><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
    <Field label={t("paidBy")}><select value={paidBy} onChange={(event) => setPaidBy(event.target.value as typeof paidBy)}><option value="owner">{t("you")}</option><option value="partner">{t("partner")}</option></select></Field>
    <Field label={t("description")} wide><input required value={description} maxLength={240} onChange={(event) => setDescription(event.target.value)} autoFocus /></Field>
    <Field label={t("amount")}><input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => splitHalf(event.target.value)} /></Field>
    <Field label={t("category")}><select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{data.categories.filter((item) => item.active && item.kind !== "income").map((item) => <option key={item.id} value={item.id}>{language === "it" ? item.nameIt : item.nameEn}</option>)}</select></Field>
    <Field label={t("yourShare")}><input required type="number" min="0" step="0.01" value={ownerShare} onChange={(event) => setOwnerShare(event.target.value)} /></Field>
    <Field label={t("partnerShare")} hint={!sharesMatch ? t("shareMismatch") : undefined}><input required type="number" min="0" step="0.01" value={partnerShare} onChange={(event) => setPartnerShare(event.target.value)} /></Field>
    <Field label={t("paymentMethod")}><select required value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}>{data.paymentMethods.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label={t("notes")} wide><textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}
