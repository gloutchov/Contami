import { useState, type FormEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData } from "../../domain/models";
import { Field, Modal } from "../components/Modal";
import { useI18n } from "../i18n/I18nContext";
import { todayIso } from "../utils/format";
import { saveAndClose } from "../utils/save";

export function RecurringForm({ data, onClose, onSave }: { data: FinanceData; onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n();
  const [name, setName] = useState(""); const [amount, setAmount] = useState(""); const [nextDueDate, setNextDueDate] = useState(todayIso()); const [endDate, setEndDate] = useState(""); const [remaining, setRemaining] = useState(""); const [notes, setNotes] = useState("");
  const [kind, setKind] = useState<"subscription" | "service" | "installment" | "investment" | "other">("subscription"); const [frequency, setFrequency] = useState<"weekly" | "monthly" | "quarterly" | "yearly">("monthly");
  const [categoryId, setCategoryId] = useState(data.categories.find((item) => item.active && item.kind !== "income")?.id ?? ""); const [paymentMethodId, setPaymentMethodId] = useState(data.paymentMethods.find((item) => item.active)?.id ?? "");
  const valid = name.trim() && Number(amount) > 0 && categoryId && paymentMethodId;
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!valid) return; await saveAndClose(onSave, { type: "addRecurringItem", value: { id: crypto.randomUUID(), name, kind, amount: Number(amount), frequency, categoryId, paymentMethodId, nextDueDate, endDate: endDate || undefined, remainingInstallments: remaining ? Number(remaining) : undefined, active: true, notes } }, onClose); };
  return <Modal title={t("newRecurring")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("name")} wide><input required value={name} maxLength={240} onChange={(event) => setName(event.target.value)} autoFocus /></Field>
    <Field label={t("type")}><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="subscription">{t("subscription")}</option><option value="service">{t("service")}</option><option value="installment">{t("installment")}</option><option value="investment">{t("investmentPlan")}</option><option value="other">{t("other")}</option></select></Field>
    <Field label={t("amount")}><input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>
    <Field label={t("frequency")}><select value={frequency} onChange={(event) => setFrequency(event.target.value as typeof frequency)}>{(["weekly", "monthly", "quarterly", "yearly"] as const).map((value) => <option key={value} value={value}>{t(value)}</option>)}</select></Field>
    <Field label={t("nextDue")}><input required type="date" value={nextDueDate} onChange={(event) => setNextDueDate(event.target.value)} /></Field>
    <Field label={t("category")}><select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{data.categories.filter((item) => item.active && item.kind !== "income").map((item) => <option key={item.id} value={item.id}>{language === "it" ? item.nameIt : item.nameEn}</option>)}</select></Field>
    <Field label={t("paymentMethod")}><select required value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}>{data.paymentMethods.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label={t("endDate")}><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></Field>
    <Field label={t("installmentsLeft")}><input type="number" min="0" step="1" value={remaining} onChange={(event) => setRemaining(event.target.value)} /></Field>
    <Field label={t("notes")} wide><textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}
