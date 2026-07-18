import { useState, type FormEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData } from "../../domain/models";
import { Field, Modal } from "../components/Modal";
import { useI18n } from "../i18n/I18nContext";
import { todayIso } from "../utils/format";
import { saveAndClose } from "../utils/save";

export function PropertyForm({ onClose, onSave }: { onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"apartment" | "house" | "garage" | "land" | "commercial" | "other">("apartment");
  const [ownership, setOwnership] = useState("100");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [notes, setNotes] = useState("");
  const valid = name.trim() && Number(ownership) > 0 && Number(ownership) <= 100 && Number(purchasePrice) >= 0;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!valid) return;
    await saveAndClose(onSave, { type: "addProperty", value: { id: crypto.randomUUID(), name, kind, ownershipShare: Number(ownership) / 100, purchaseDate: purchaseDate || undefined, purchasePrice: Number(purchasePrice), active: true, notes } }, onClose);
  };
  return <Modal title={t("newProperty")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("name")} wide><input required maxLength={240} value={name} onChange={(event) => setName(event.target.value)} autoFocus /></Field>
    <Field label={t("type")}><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>{(["apartment", "house", "garage", "land", "commercial", "other"] as const).map((value) => <option key={value} value={value}>{t(value)}</option>)}</select></Field>
    <Field label={t("ownership")}><input required type="number" min="0.01" max="100" step="0.01" value={ownership} onChange={(event) => setOwnership(event.target.value)} /></Field>
    <Field label={t("date")}><input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} /></Field>
    <Field label={t("purchasePrice")}><input required type="number" min="0" step="0.01" value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} /></Field>
    <Field label={t("notes")} wide><textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}

export function PropertyEntryForm({ data, initialPropertyId, onClose, onSave }: { data: FinanceData; initialPropertyId?: string; onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t } = useI18n();
  const [propertyId, setPropertyId] = useState(initialPropertyId ?? data.properties.find((item) => item.active)?.id ?? "");
  const [date, setDate] = useState(todayIso());
  const [kind, setKind] = useState<"income" | "expense" | "valuation" | "consumption">("expense");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [notes, setNotes] = useState("");
  const requiresPayment = kind === "income" || kind === "expense";
  const valid = propertyId && category.trim() && description.trim() && Number(amount || 0) >= 0 && (!requiresPayment || paymentMethodId) && (kind !== "consumption" || Number(quantity) > 0);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!valid) return;
    await saveAndClose(onSave, { type: "addPropertyEntry", value: { id: crypto.randomUUID(), propertyId, date, kind, category, description, amount: Number(amount || 0), quantity: quantity ? Number(quantity) : undefined, unit: unit || undefined, paymentMethodId: paymentMethodId || undefined, notes } }, onClose);
  };
  return <Modal title={t("newPropertyEntry")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("property")}><select required value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>{data.properties.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label={t("date")}><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
    <Field label={t("type")}><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="income">{t("income")}</option><option value="expense">{t("expense")}</option><option value="valuation">{t("valuation")}</option><option value="consumption">{t("consumption")}</option></select></Field>
    <Field label={t("category")}><input required value={category} maxLength={240} onChange={(event) => setCategory(event.target.value)} /></Field>
    <Field label={t("description")} wide><input required value={description} maxLength={240} onChange={(event) => setDescription(event.target.value)} /></Field>
    <Field label={t("amount")}><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>
    <Field label={t("paymentMethod")}><select required={requiresPayment} value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}><option value="">—</option>{data.paymentMethods.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    {kind === "consumption" && <><Field label={t("quantity")}><input required type="number" min="0" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field><Field label={t("unit")}><input value={unit} maxLength={24} onChange={(event) => setUnit(event.target.value)} /></Field></>}
    <Field label={t("notes")} wide><textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}
