import { useState, type FormEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData } from "../../domain/models";
import { Field, Modal } from "../components/Modal";
import { useI18n } from "../i18n/I18nContext";
import { todayIso } from "../utils/format";
import { saveAndClose } from "../utils/save";

export function InvestmentForm({ onClose, onSave }: { onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t } = useI18n();
  const [name, setName] = useState(""); const [provider, setProvider] = useState(""); const [openedAt, setOpenedAt] = useState(todayIso()); const [notes, setNotes] = useState("");
  const [kind, setKind] = useState<"fund" | "stock" | "bond" | "pension" | "savings" | "etf" | "other">("fund");
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!name.trim()) return; await saveAndClose(onSave, { type: "addInvestment", value: { id: crypto.randomUUID(), name, provider, kind, currency: "EUR", active: true, openedAt, notes } }, onClose); };
  return <Modal title={t("newInvestment")} onClose={onClose} onSubmit={submit} submitDisabled={!name.trim()}>
    <Field label={t("name")} wide><input required value={name} maxLength={240} onChange={(event) => setName(event.target.value)} autoFocus /></Field>
    <Field label={t("type")}><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>{(["fund", "stock", "bond", "pension", "savings", "etf", "other"] as const).map((value) => <option value={value} key={value}>{t(value)}</option>)}</select></Field>
    <Field label={t("provider")}><input value={provider} maxLength={120} onChange={(event) => setProvider(event.target.value)} /></Field>
    <Field label={t("date")}><input required type="date" value={openedAt} onChange={(event) => setOpenedAt(event.target.value)} /></Field>
    <Field label={t("notes")} wide><textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}

export function InvestmentEntryForm({ data, initialInvestmentId, onClose, onSave }: { data: FinanceData; initialInvestmentId?: string; onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t } = useI18n();
  const [investmentId, setInvestmentId] = useState(initialInvestmentId ?? data.investments.find((item) => item.active)?.id ?? "");
  const [date, setDate] = useState(todayIso()); const [description, setDescription] = useState(""); const [amount, setAmount] = useState(""); const [notes, setNotes] = useState(""); const [paymentMethodId, setPaymentMethodId] = useState("");
  const [kind, setKind] = useState<"contribution" | "withdrawal" | "valuation" | "income" | "fee">("contribution");
  const requiresPayment = kind !== "valuation";
  const valid = investmentId && description.trim() && Number(amount) >= 0 && (!requiresPayment || paymentMethodId);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!valid) return; await saveAndClose(onSave, { type: "addInvestmentEntry", value: { id: crypto.randomUUID(), investmentId, date, kind, amount: Number(amount), description, paymentMethodId: paymentMethodId || undefined, notes } }, onClose); };
  return <Modal title={t("newInvestmentEntry")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("investment")}><select required value={investmentId} onChange={(event) => setInvestmentId(event.target.value)}>{data.investments.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label={t("date")}><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
    <Field label={t("type")}><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>{(["contribution", "withdrawal", "valuation", "income", "fee"] as const).map((value) => <option key={value} value={value}>{t(value)}</option>)}</select></Field>
    <Field label={t("amount")}><input required type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>
    <Field label={t("description")} wide><input required value={description} maxLength={240} onChange={(event) => setDescription(event.target.value)} /></Field>
    <Field label={t("paymentMethod")}><select required={requiresPayment} value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}><option value="">—</option>{data.paymentMethods.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label={t("notes")} wide><textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}
