import { useMemo, useState, type FormEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData, PropertyEntry } from "../../domain/models";
import { Field, Modal } from "../components/Modal";
import { useI18n } from "../i18n/I18nContext";
import type { TranslationKey } from "../i18n/translations";
import { todayIso } from "../utils/format";
import { saveAndClose } from "../utils/save";

type DetailKind = NonNullable<PropertyEntry["detailKind"]>;
type UtilityKind = Extract<DetailKind, `utility_${string}`>;

const utilityOptions: Array<{ value: UtilityKind; label: TranslationKey; category: string }> = [
  { value: "utility_electricity", label: "electricity", category: "Electricity" },
  { value: "utility_gas", label: "gas", category: "Gas" },
  { value: "utility_water", label: "water", category: "Water" },
  { value: "utility_phone_internet", label: "phoneInternet", category: "Phone / Internet" },
];

export function PropertyExpenseForm({ data, mode, value, initialPropertyId, onClose, onSave }: {
  data: FinanceData;
  mode: "utility" | "tax";
  value?: PropertyEntry;
  initialPropertyId?: string;
  onClose: () => void;
  onSave: (command: FinanceCommand) => Promise<void>;
}) {
  const { t, language } = useI18n();
  const existingTransaction = value
    ? data.transactions.find((item) => item.id === value.transactionId || item.propertyEntryId === value.id)
    : undefined;
  const existingShared = existingTransaction
    ? data.sharedExpenses.find((item) => item.id === existingTransaction.sharedExpenseId || item.transactionId === existingTransaction.id)
    : undefined;
  const fallbackKind = utilityOptions[0].value;
  const initialKind = value?.detailKind && utilityOptions.some((item) => item.value === value.detailKind) ? value.detailKind : fallbackKind;
  const [detailKind, setDetailKind] = useState<DetailKind>(initialKind);
  const [propertyId, setPropertyId] = useState(value?.propertyId ?? initialPropertyId ?? data.properties.find((item) => item.active)?.id ?? "");
  const [taxTypeId, setTaxTypeId] = useState(value?.taxTypeId ?? data.taxTypes.find((item) => item.active)?.id ?? "");
  const [date, setDate] = useState(value?.date ?? todayIso());
  const [description, setDescription] = useState(value?.description ?? "");
  const [amount, setAmount] = useState(value ? String(value.amount) : "");
  const [categoryId, setCategoryId] = useState(value?.categoryId ?? data.categories.find((item) => item.active && item.kind !== "income")?.id ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState(value?.paymentMethodId ?? data.paymentMethods.find((item) => item.active)?.id ?? "");
  const [quantity, setQuantity] = useState(value?.quantity !== undefined ? String(value.quantity) : "");
  const [f1, setF1] = useState(value?.electricityKwhF1 !== undefined ? String(value.electricityKwhF1) : "");
  const [f2, setF2] = useState(value?.electricityKwhF2 !== undefined ? String(value.electricityKwhF2) : "");
  const [f3, setF3] = useState(value?.electricityKwhF3 !== undefined ? String(value.electricityKwhF3) : "");
  const [f23, setF23] = useState(value?.electricityKwhF23 !== undefined ? String(value.electricityKwhF23) : "");
  const [taxInstallmentNumber, setTaxInstallmentNumber] = useState(String(value?.taxInstallmentNumber ?? 1));
  const [commonExpense, setCommonExpense] = useState(value?.isCommonExpense ?? false);
  const [shared, setShared] = useState(Boolean(existingShared));
  const [paidBy, setPaidBy] = useState(existingShared?.paidBy ?? "owner");
  const [ownerShare, setOwnerShare] = useState(existingShared ? String(existingShared.ownerShare) : "");
  const [partnerShare, setPartnerShare] = useState(existingShared ? String(existingShared.partnerShare) : "");
  const [notes, setNotes] = useState(value?.notes ?? "");

  const propertyUsage = data.properties.find((item) => item.id === propertyId)?.usage;
  const taxOptions = useMemo(() => data.taxTypes.filter((item) => (
    (item.active || item.id === value?.taxTypeId)
    && (item.appliesTo === "all" || item.appliesTo === propertyUsage)
  )), [data.taxTypes, propertyUsage, value?.taxTypeId]);
  const selectedTaxTypeId = taxOptions.some((item) => item.id === taxTypeId) ? taxTypeId : (taxOptions[0]?.id ?? "");
  const selectedTaxType = data.taxTypes.find((item) => item.id === selectedTaxTypeId);

  const electricityTotal = Number(f1 || 0) + (Number(f23 || 0) > 0 ? Number(f23) : Number(f2 || 0) + Number(f3 || 0));
  const sharesMatch = useMemo(() => Math.abs(Number(ownerShare || 0) + Number(partnerShare || 0) - Number(amount || 0)) <= 0.01, [amount, ownerShare, partnerShare]);
  const installmentValid = mode !== "tax" || !selectedTaxType || selectedTaxType.installments === 1
    || (Number(taxInstallmentNumber) >= 1 && Number(taxInstallmentNumber) <= selectedTaxType.installments);
  const valid = Boolean(
    propertyId && description.trim() && Number(amount) > 0 && categoryId && paymentMethodId
    && (mode === "utility" || selectedTaxType) && installmentValid && (!shared || sharesMatch),
  );
  const splitHalf = (next: string) => {
    setAmount(next);
    if (!shared) return;
    const half = Math.round(Number(next || 0) * 50) / 100;
    setOwnerShare(half ? half.toFixed(2) : "");
    setPartnerShare(half ? (Number(next) - half).toFixed(2) : "");
  };
  const toggleShared = (checked: boolean) => {
    setShared(checked);
    if (checked && !ownerShare && !partnerShare) {
      const half = Math.round(Number(amount || 0) * 50) / 100;
      setOwnerShare(half ? half.toFixed(2) : "");
      setPartnerShare(half ? (Number(amount) - half).toFixed(2) : "");
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;
    const option = utilityOptions.find((item) => item.value === detailKind) ?? utilityOptions[0];
    const isElectricity = detailKind === "utility_electricity";
    const isMeasuredUtility = detailKind === "utility_gas" || detailKind === "utility_water";
    const entry: PropertyEntry = {
      ...value,
      id: value?.id ?? crypto.randomUUID(),
      propertyId,
      date,
      kind: "expense",
      category: mode === "tax" ? selectedTaxType!.name : option.category,
      categoryId,
      description,
      amount: Number(amount),
      quantity: isElectricity ? electricityTotal : isMeasuredUtility && quantity ? Number(quantity) : undefined,
      unit: isElectricity ? "kWh" : isMeasuredUtility ? "m³" : undefined,
      detailKind: mode === "utility" ? detailKind : undefined,
      taxTypeId: mode === "tax" ? selectedTaxType!.id : undefined,
      taxInstallmentNumber: mode === "tax" && selectedTaxType!.installments > 1 ? Number(taxInstallmentNumber) : undefined,
      electricityKwhF1: isElectricity && f1 ? Number(f1) : undefined,
      electricityKwhF2: isElectricity && f2 ? Number(f2) : undefined,
      electricityKwhF3: isElectricity && f3 ? Number(f3) : undefined,
      electricityKwhF23: isElectricity && f23 ? Number(f23) : undefined,
      paymentMethodId,
      transactionId: value?.transactionId,
      isCommonExpense: mode === "tax" && commonExpense,
      notes,
    };
    const command: FinanceCommand = {
      type: value ? "updatePropertyExpense" : "addPropertyExpense",
      value: {
        entry,
        shared: shared ? {
          id: existingShared?.id ?? crypto.randomUUID(),
          ownerShare: Number(ownerShare),
          partnerShare: Number(partnerShare),
          paidBy,
          settled: existingShared?.settled ?? false,
        } : undefined,
      },
    };
    await saveAndClose(onSave, command, onClose);
  };

  const isElectricity = detailKind === "utility_electricity";
  const isMeasuredUtility = detailKind === "utility_gas" || detailKind === "utility_water";
  return <Modal title={value ? t(mode === "utility" ? "editUtilityExpense" : "editPropertyTax") : t(mode === "utility" ? "newUtilityExpense" : "newPropertyTax")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("property")}><select required value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>{data.properties.filter((item) => item.active || item.id === propertyId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label={t("date")}><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
    {mode === "utility"
      ? <Field label={t("utility")}><select value={detailKind} onChange={(event) => setDetailKind(event.target.value as DetailKind)}>{utilityOptions.map((item) => <option key={item.value} value={item.value}>{t(item.label)}</option>)}</select></Field>
      : <Field label={t("propertyTax")}><select required value={selectedTaxTypeId} onChange={(event) => { setTaxTypeId(event.target.value); setTaxInstallmentNumber("1"); }}>{taxOptions.length === 0 && <option value="">{t("noTaxTypes")}</option>}{taxOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>}
    {mode === "tax" && selectedTaxType && selectedTaxType.installments > 1 && <Field label={t("taxInstallment")}><select value={taxInstallmentNumber} onChange={(event) => setTaxInstallmentNumber(event.target.value)}>{Array.from({ length: selectedTaxType.installments }, (_, index) => <option key={index + 1} value={index + 1}>{t("taxInstallmentOption", { number: index + 1, total: selectedTaxType.installments })}</option>)}</select></Field>}
    <Field label={t("description")} wide><input required value={description} maxLength={240} onChange={(event) => setDescription(event.target.value)} autoFocus /></Field>
    <Field label={t("amount")}><input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => splitHalf(event.target.value)} /></Field>
    <Field label={t("category")}><select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{data.categories.filter((item) => item.active && item.kind !== "income").map((item) => <option key={item.id} value={item.id}>{language === "it" ? item.nameIt : item.nameEn}</option>)}</select></Field>
    <Field label={t("paymentMethod")}><select required value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}>{data.paymentMethods.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    {isElectricity && <><Field label={t("electricityF1")}><input type="number" min="0" step="0.01" value={f1} onChange={(event) => setF1(event.target.value)} /></Field><Field label={t("electricityF2")}><input type="number" min="0" step="0.01" value={f2} onChange={(event) => setF2(event.target.value)} /></Field><Field label={t("electricityF3")}><input type="number" min="0" step="0.01" value={f3} onChange={(event) => setF3(event.target.value)} /></Field><Field label={t("electricityF23")} hint={t("electricityF23Help")}><input type="number" min="0" step="0.01" value={f23} onChange={(event) => setF23(event.target.value)} /></Field><Field label={t("consumptionTotal")}><output>{electricityTotal.toFixed(2)} kWh</output></Field></>}
    {isMeasuredUtility && <Field label={detailKind === "utility_gas" ? t("gasCubicMeters") : t("waterCubicMeters")}><input type="number" min="0" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>}
    {mode === "tax" && <Field label={t("commonExpense")} wide><span className="check-field"><input type="checkbox" checked={commonExpense} onChange={(event) => setCommonExpense(event.target.checked)} />{t("commonExpenseHelp")}</span></Field>}
    <Field label={t("sharedExpense")} wide><span className="check-field"><input type="checkbox" checked={shared} onChange={(event) => toggleShared(event.target.checked)} />{t("addToSharedExpenses")}</span></Field>
    {shared && <><Field label={t("paidBy")}><select value={paidBy} onChange={(event) => setPaidBy(event.target.value as "owner" | "partner")}><option value="owner">{t("you")}</option><option value="partner">{t("partner")}</option></select></Field><Field label={t("yourShare")}><input required type="number" min="0" step="0.01" value={ownerShare} onChange={(event) => setOwnerShare(event.target.value)} /></Field><Field label={t("partnerShare")} hint={!sharesMatch ? t("shareMismatch") : undefined}><input required type="number" min="0" step="0.01" value={partnerShare} onChange={(event) => setPartnerShare(event.target.value)} /></Field></>}
    <Field label={t("notes")} wide><textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}
