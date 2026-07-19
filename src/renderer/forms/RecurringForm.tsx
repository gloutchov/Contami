import { useMemo, useState, type FormEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import { pensionInvestmentIds, selectableFinancialPositions } from "../../domain/investments";
import type { FinanceData, RecurringItem } from "../../domain/models";
import { Field, Modal } from "../components/Modal";
import { useI18n } from "../i18n/I18nContext";
import { todayIso } from "../utils/format";
import { saveAndClose } from "../utils/save";

export function RecurringForm({ data, value, onClose, onSave }: { data: FinanceData; value?: RecurringItem; onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n();
  const [name, setName] = useState(value?.name ?? ""); const [amount, setAmount] = useState(value ? String(value.amount) : ""); const [nextDueDate, setNextDueDate] = useState(value?.nextDueDate ?? todayIso()); const [endDate, setEndDate] = useState(value?.endDate ?? ""); const [remaining, setRemaining] = useState(value?.remainingInstallments !== undefined ? String(value.remainingInstallments) : ""); const [notes, setNotes] = useState(value?.notes ?? "");
  const [kind, setKind] = useState<RecurringItem["kind"]>(value?.kind ?? "subscription"); const [direction, setDirection] = useState<NonNullable<RecurringItem["direction"]>>(value?.direction ?? "expense"); const [frequency, setFrequency] = useState<RecurringItem["frequency"]>(value?.frequency ?? "monthly");
  const [categoryId, setCategoryId] = useState(value?.categoryId ?? data.categories.find((item) => item.active && item.kind !== "income")?.id ?? ""); const [paymentMethodId, setPaymentMethodId] = useState(value?.paymentMethodId ?? data.paymentMethods.find((item) => item.active)?.id ?? "");
  const [investmentId, setInvestmentId] = useState(value?.investmentId ?? ""); const [propertyId, setPropertyId] = useState(value?.propertyId ?? ""); const [vehicleId, setVehicleId] = useState(value?.vehicleId ?? "");
  const categories = useMemo(() => data.categories.filter((item) => item.active && (item.kind === direction || item.kind === "both")), [data.categories, direction]);
  const pensionIds = pensionInvestmentIds(data);
  const positions = selectableFinancialPositions(data);
  const selectedLegacyPosition = value?.investmentId && !positions.some((item) => item.id === value.investmentId) ? data.investments.find((item) => item.id === value.investmentId) : undefined;
  const regularPositions = [...positions.filter((item) => !pensionIds.has(item.id)), ...(selectedLegacyPosition && !pensionIds.has(selectedLegacyPosition.id) ? [selectedLegacyPosition] : [])];
  const pensionPositions = [...positions.filter((item) => pensionIds.has(item.id)), ...(selectedLegacyPosition && pensionIds.has(selectedLegacyPosition.id) ? [selectedLegacyPosition] : [])];
  const valid = Boolean(name.trim() && Number(amount) > 0 && categoryId && paymentMethodId && (kind !== "investment" || investmentId) && (kind !== "rent" || propertyId));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!valid) return;
    const item: RecurringItem = {
      ...value, id: value?.id ?? crypto.randomUUID(), name, kind, direction, amount: Number(amount), frequency,
      categoryId, paymentMethodId, investmentId: kind === "investment" ? investmentId : undefined,
      propertyId: kind === "rent" ? propertyId : undefined, nextDueDate, endDate: endDate || undefined,
      vehicleId: kind === "installment" && vehicleId ? vehicleId : undefined,
      remainingInstallments: remaining ? Number(remaining) : undefined, active: value?.active ?? true, closedAt: value?.closedAt, notes,
    };
    await saveAndClose(onSave, { type: value ? "updateRecurringItem" : "addRecurringItem", value: item }, onClose);
  };
  return <Modal title={value ? t("editRecurring") : t("newRecurring")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("name")} wide><input required value={name} maxLength={240} onChange={(event) => setName(event.target.value)} autoFocus /></Field>
    <Field label={t("type")}><select value={kind} onChange={(event) => { const next = event.target.value as RecurringItem["kind"]; setKind(next); if (next === "rent") setDirection("income"); if (next === "investment") setDirection("expense"); }}><option value="subscription">{t("subscription")}</option><option value="service">{t("service")}</option><option value="installment">{t("installment")}</option><option value="investment">{t("investmentPlan")}</option><option value="rent">{t("rent")}</option><option value="other">{t("other")}</option></select></Field>
    <Field label={t("direction")}><select value={direction} onChange={(event) => { setDirection(event.target.value as NonNullable<RecurringItem["direction"]>); setCategoryId(""); }}><option value="expense">{t("expense")}</option><option value="income">{t("income")}</option></select></Field>
    <Field label={t("amount")}><input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>
    <Field label={t("frequency")}><select value={frequency} onChange={(event) => setFrequency(event.target.value as RecurringItem["frequency"])}>{(["weekly", "monthly", "quarterly", "yearly"] as const).map((item) => <option key={item} value={item}>{t(item)}</option>)}</select></Field>
    <Field label={t("nextDue")}><input required type="date" value={nextDueDate} onChange={(event) => setNextDueDate(event.target.value)} /></Field>
    <Field label={t("category")}><select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">—</option>{categories.map((item) => <option key={item.id} value={item.id}>{language === "it" ? item.nameIt : item.nameEn}</option>)}</select></Field>
    <Field label={t("paymentMethod")}><select required value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}>{data.paymentMethods.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    {kind === "investment" && <Field label={t("investmentOrCompartment")}><select required value={investmentId} onChange={(event) => setInvestmentId(event.target.value)}><option value="">—</option>{regularPositions.length > 0 && <optgroup label={t("investments")}>{regularPositions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>}{pensionPositions.length > 0 && <optgroup label={t("pensionCompartments")}>{pensionPositions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>}</select></Field>}
    {kind === "rent" && <Field label={t("property")}><select required value={propertyId} onChange={(event) => setPropertyId(event.target.value)}><option value="">—</option>{data.properties.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>}
    {kind === "installment" && data.vehicles.length > 0 && <Field label={t("vehicle")}><select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}><option value="">—</option>{data.vehicles.filter((item) => item.active || item.id === vehicleId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>}
    <Field label={t("endDate")}><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></Field>
    {kind === "installment" && <Field label={t("installmentsLeft")}><input type="number" min="0" step="1" value={remaining} onChange={(event) => setRemaining(event.target.value)} /></Field>}
    <Field label={t("notes")} wide><textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}
