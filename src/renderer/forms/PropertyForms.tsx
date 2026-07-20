import { useMemo, useState, type FormEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData, Property, PropertyEntry } from "../../domain/models";
import { Field, Modal } from "../components/Modal";
import { useI18n } from "../i18n/I18nContext";
import { todayIso } from "../utils/format";
import { calculatePropertyValuation } from "../utils/propertyHistory";
import { saveAndClose } from "../utils/save";

export function PropertyForm({ value, onClose, onSave }: { value?: Property; onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t } = useI18n();
  const [name, setName] = useState(value?.name ?? "");
  const [kind, setKind] = useState<Property["kind"]>(value?.kind ?? "apartment");
  const [usage, setUsage] = useState<NonNullable<Property["usage"]>>(value?.usage ?? "other");
  const [address, setAddress] = useState(value?.address ?? "");
  const [areaSqm, setAreaSqm] = useState(value?.areaSqm ? String(value.areaSqm) : "");
  const [ownership, setOwnership] = useState(String((value?.ownershipShare ?? 1) * 100));
  const [cadastralValue, setCadastralValue] = useState(value?.cadastralValue !== undefined ? String(value.cadastralValue) : "");
  const [expectedRent, setExpectedRent] = useState(value?.expectedMonthlyRent !== undefined ? String(value.expectedMonthlyRent) : "");
  const [rentDueDay, setRentDueDay] = useState(value?.rentDueDay ? String(value.rentDueDay) : "5");
  const [purchaseDate, setPurchaseDate] = useState(value?.purchaseDate ?? "");
  const [purchasePrice, setPurchasePrice] = useState(String(value?.purchasePrice ?? ""));
  const [notes, setNotes] = useState(value?.notes ?? "");
  const valid = Boolean(name.trim() && Number(ownership) > 0 && Number(ownership) <= 100 && Number(purchasePrice || 0) >= 0 && (usage !== "rental" || (!expectedRent || (Number(rentDueDay) >= 1 && Number(rentDueDay) <= 31))));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!valid) return;
    const item: Property = {
      ...value, id: value?.id ?? crypto.randomUUID(), name, kind, usage, address,
      areaSqm: areaSqm ? Number(areaSqm) : undefined, ownershipShare: Number(ownership) / 100,
      cadastralValue: cadastralValue ? Number(cadastralValue) : undefined,
      expectedMonthlyRent: usage === "rental" && expectedRent ? Number(expectedRent) : undefined,
      rentDueDay: usage === "rental" && expectedRent ? Number(rentDueDay) : undefined,
      purchaseDate: purchaseDate || undefined, purchasePrice: Number(purchasePrice || 0),
      active: value?.active ?? true, closedAt: value?.closedAt, notes,
    };
    await saveAndClose(onSave, { type: value ? "updateProperty" : "addProperty", value: item }, onClose);
  };
  return <Modal title={value ? t("editProperty") : t("newProperty")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("name")} wide><input required maxLength={240} value={name} onChange={(event) => setName(event.target.value)} autoFocus /></Field>
    <Field label={t("type")}><select value={kind} onChange={(event) => setKind(event.target.value as Property["kind"])}>{(["apartment", "house", "garage", "land", "commercial", "other"] as const).map((item) => <option key={item} value={item}>{t(item)}</option>)}</select></Field>
    <Field label={t("propertyUsage")}><select value={usage} onChange={(event) => setUsage(event.target.value as NonNullable<Property["usage"]>)}><option value="residence">{t("residence")}</option><option value="rental">{t("rental")}</option><option value="other">{t("other")}</option></select></Field>
    <Field label={t("address")} wide><input maxLength={320} value={address} onChange={(event) => setAddress(event.target.value)} /></Field>
    <Field label={t("areaSqm")}><input type="number" min="0.01" step="0.01" value={areaSqm} onChange={(event) => setAreaSqm(event.target.value)} /></Field>
    <Field label={t("ownership")}><input required type="number" min="0.01" max="100" step="0.01" value={ownership} onChange={(event) => setOwnership(event.target.value)} /></Field>
    <Field label={t("cadastralValue")}><input type="number" min="0" step="0.01" value={cadastralValue} onChange={(event) => setCadastralValue(event.target.value)} /></Field>
    <Field label={t("purchasePrice")}><input required type="number" min="0" step="0.01" value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} /></Field>
    <Field label={t("date")}><input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} /></Field>
    {usage === "rental" && <><Field label={t("expectedMonthlyRent")}><input type="number" min="0" step="0.01" value={expectedRent} onChange={(event) => setExpectedRent(event.target.value)} /></Field><Field label={t("rentDueDay")}><input type="number" min="1" max="31" step="1" value={rentDueDay} onChange={(event) => setRentDueDay(event.target.value)} /></Field></>}
    <Field label={t("notes")} wide><textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}

export function PropertyEntryForm({ data, value, initialPropertyId, onClose, onSave }: { data: FinanceData; value?: PropertyEntry; initialPropertyId?: string; onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n();
  const [propertyId, setPropertyId] = useState(value?.propertyId ?? initialPropertyId ?? data.properties.find((item) => item.active)?.id ?? "");
  const [date, setDate] = useState(value?.date ?? todayIso());
  const [kind, setKind] = useState<PropertyEntry["kind"]>(value?.kind ?? "expense");
  const [categoryId, setCategoryId] = useState(value?.categoryId ?? "");
  const [utility, setUtility] = useState(value?.kind === "consumption" ? value.category : "electricity");
  const [description, setDescription] = useState(value?.description ?? "");
  const [amount, setAmount] = useState(value ? String(value.amount) : "");
  const [valuationMode, setValuationMode] = useState<"total" | "sqm">(value?.valuePerSqm !== undefined ? "sqm" : "total");
  const [valuePerSqm, setValuePerSqm] = useState(value?.valuePerSqm !== undefined ? String(value.valuePerSqm) : "");
  const [quantity, setQuantity] = useState(value?.quantity !== undefined ? String(value.quantity) : "");
  const [unit, setUnit] = useState(value?.unit ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState(value?.paymentMethodId ?? "");
  const [isCommonExpense, setIsCommonExpense] = useState(value?.isCommonExpense ?? false);
  const [notes, setNotes] = useState(value?.notes ?? "");
  const monetary = kind === "income" || kind === "expense";
  const selectedProperty = data.properties.find((item) => item.id === propertyId);
  const computedValuation = calculatePropertyValuation(selectedProperty, valuationMode, Number(amount || 0), Number(valuePerSqm || 0));
  const categories = useMemo(() => data.categories.filter((item) => item.active && (item.kind === kind || item.kind === "both")), [data.categories, kind]);
  const valid = Boolean(propertyId && description.trim() && Number(amount || 0) >= 0
    && (!monetary || (paymentMethodId && categoryId))
    && (kind !== "consumption" || Number(quantity) > 0)
    && (kind !== "valuation" || (valuationMode === "total" ? Number(amount) > 0 : Boolean(selectedProperty?.areaSqm && Number(valuePerSqm) > 0))));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!valid) return;
    const category = monetary ? (data.categories.find((item) => item.id === categoryId)?.nameIt ?? "Altro") : kind === "consumption" ? utility : "Valutazione";
    const item: PropertyEntry = {
      ...value, id: value?.id ?? crypto.randomUUID(), propertyId, date, kind, category,
      categoryId: monetary ? categoryId : undefined, description, amount: kind === "valuation" ? computedValuation : Number(amount || 0),
      quantity: quantity ? Number(quantity) : undefined, unit: unit || undefined,
      valuePerSqm: kind === "valuation" && valuationMode === "sqm" ? Number(valuePerSqm) : undefined,
      paymentMethodId: monetary ? paymentMethodId : undefined, transactionId: value?.transactionId,
      isCommonExpense: kind === "expense" && isCommonExpense, notes,
    };
    await saveAndClose(onSave, { type: value ? "updatePropertyEntry" : "addPropertyEntry", value: item }, onClose);
  };
  return <Modal title={value ? t("editPropertyEntry") : t("newPropertyEntry")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("property")}><select required value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>{data.properties.filter((item) => item.active || item.id === propertyId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label={t("date")}><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
    <Field label={t("type")}><select value={kind} onChange={(event) => { setKind(event.target.value as PropertyEntry["kind"]); setCategoryId(""); }}><option value="income">{t("income")}</option><option value="expense">{t("expense")}</option><option value="valuation">{t("valuation")}</option><option value="consumption">{t("consumption")}</option></select></Field>
    {monetary && <Field label={t("category")}><select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">—</option>{categories.map((item) => <option key={item.id} value={item.id}>{language === "it" ? item.nameIt : item.nameEn}</option>)}</select></Field>}
    {kind === "consumption" && <Field label={t("utility")}><select value={utility} onChange={(event) => setUtility(event.target.value)}><option value="electricity">{t("electricity")}</option><option value="gas">{t("gas")}</option><option value="water">{t("water")}</option><option value="condominium">{t("condominium")}</option></select></Field>}
    <Field label={t("description")} wide><input required value={description} maxLength={240} onChange={(event) => setDescription(event.target.value)} /></Field>
    {kind === "valuation" && <Field label={t("valuationMethod")}><select value={valuationMode} onChange={(event) => setValuationMode(event.target.value as "total" | "sqm")}><option value="total">{t("valuationByTotal")}</option><option value="sqm">{t("valuationBySqm")}</option></select></Field>}
    {kind === "valuation" && valuationMode === "sqm" ? <><Field label={t("valuePerSqm")} hint={selectedProperty?.areaSqm ? `${t("areaSqm")}: ${selectedProperty.areaSqm} m²` : t("areaRequiredForValuation")}><input required type="number" min="0.01" step="0.01" value={valuePerSqm} onChange={(event) => setValuePerSqm(event.target.value)} /></Field><Field label={t("computedTotal")}><output>{computedValuation.toFixed(2)}</output></Field></> : <Field label={kind === "valuation" ? t("totalPropertyValue") : t("amount")}><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>}
    {monetary && <Field label={t("paymentMethod")}><select required value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}><option value="">—</option>{data.paymentMethods.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>}
    {kind === "expense" && <Field label={t("commonExpense")}><span className="check-field"><input type="checkbox" checked={isCommonExpense} onChange={(event) => setIsCommonExpense(event.target.checked)} />{t("commonExpenseHelp")}</span></Field>}
    {kind === "consumption" && <><Field label={t("quantity")}><input required type="number" min="0" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field><Field label={t("unit")}><input value={unit} maxLength={24} onChange={(event) => setUnit(event.target.value)} /></Field></>}
    <Field label={t("notes")} wide><textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}
