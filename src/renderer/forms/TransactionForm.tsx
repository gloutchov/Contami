import { useMemo, useState, type FormEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import { pensionInvestmentIds, selectableFinancialPositions } from "../../domain/investments";
import type { FinanceData, Transaction } from "../../domain/models";
import { Field, Modal } from "../components/Modal";
import { useI18n } from "../i18n/I18nContext";
import { todayIso } from "../utils/format";
import { saveAndClose } from "../utils/save";

export function TransactionForm({ data, value, onClose, onSave }: { data: FinanceData; value?: Transaction; onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n();
  const [kind, setKind] = useState<Transaction["kind"]>(value?.kind ?? "expense");
  const [cashFlowDirection, setCashFlowDirection] = useState<NonNullable<Transaction["cashFlowDirection"]>>(value?.cashFlowDirection ?? "neutral");
  const [date, setDate] = useState(value?.date ?? todayIso());
  const [description, setDescription] = useState(value?.description ?? "");
  const [amount, setAmount] = useState(value ? String(value.amount) : "");
  const [categoryId, setCategoryId] = useState(value?.categoryId ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState(value?.paymentMethodId ?? data.paymentMethods.find((item) => item.active)?.id ?? "");
  const [accountId, setAccountId] = useState(value?.accountId ?? data.accounts.find((item) => item.active)?.id ?? "");
  const [propertyId, setPropertyId] = useState(value?.propertyId ?? "");
  const [investmentId, setInvestmentId] = useState(value?.investmentId ?? "");
  const [recurringId, setRecurringId] = useState(value?.recurringId ?? "");
  const [shared, setShared] = useState(value?.shared ?? Boolean(value?.sharedExpenseId));
  const [sharedPaidBy, setSharedPaidBy] = useState<"owner" | "partner">(value?.sharedPaidBy ?? "owner");
  const [notes, setNotes] = useState(value?.notes ?? "");
  const categories = useMemo(() => data.categories.filter((item) => item.active && (item.kind === kind || item.kind === "both")), [data.categories, kind]);
  const recurringItems = data.recurringItems.filter((item) => item.active && (item.direction ?? "expense") === (kind === "income" ? "income" : "expense"));
  const pensionIds = pensionInvestmentIds(data);
  const positions = selectableFinancialPositions(data);
  const selectedLegacyPosition = value?.investmentId && !positions.some((item) => item.id === value.investmentId) ? data.investments.find((item) => item.id === value.investmentId) : undefined;
  const regularPositions = [...positions.filter((item) => !pensionIds.has(item.id)), ...(selectedLegacyPosition && !pensionIds.has(selectedLegacyPosition.id) ? [selectedLegacyPosition] : [])];
  const pensionPositions = [...positions.filter((item) => pensionIds.has(item.id)), ...(selectedLegacyPosition && pensionIds.has(selectedLegacyPosition.id) ? [selectedLegacyPosition] : [])];
  const requiresAccount = kind !== "transfer" || cashFlowDirection !== "neutral";
  const selectedAccount = data.accounts.find((item) => item.id === accountId);
  const accountValid = !requiresAccount || Boolean(selectedAccount
    && date >= selectedAccount.openedAt
    && (!selectedAccount.closedAt || date <= selectedAccount.closedAt));
  const valid = Boolean(description.trim() && Number(amount) > 0 && categoryId && paymentMethodId && accountValid);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!valid) return;
    const timestamp = new Date().toISOString();
    const item: Transaction = {
      ...value, id: value?.id ?? crypto.randomUUID(), date, description, categoryId, paymentMethodId,
      accountId: accountId || undefined, kind, amount: Number(amount), currency: value?.currency ?? "EUR",
      cashFlowDirection: kind === "transfer" ? cashFlowDirection : undefined,
      recurringId: recurringId || undefined, propertyId: propertyId || undefined, propertyEntryId: value?.propertyEntryId,
      investmentId: investmentId || undefined, investmentEntryId: value?.investmentEntryId,
      sharedExpenseId: value?.sharedExpenseId, shared: kind === "expense" && shared,
      sharedPaidBy, sharedSettled: value?.sharedSettled ?? false, notes,
      createdAt: value?.createdAt ?? timestamp, updatedAt: timestamp,
    };
    await saveAndClose(onSave, { type: value ? "updateTransaction" : "addTransaction", value: item }, onClose);
  };
  return <Modal title={value ? t("editTransaction") : t("newTransaction")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("type")}><select value={kind} onChange={(event) => { setKind(event.target.value as Transaction["kind"]); setCategoryId(""); if (event.target.value !== "expense") setShared(false); }}><option value="expense">{t("expense")}</option><option value="income">{t("income")}</option><option value="transfer">{t("transfer")}</option></select></Field>
    {kind === "transfer" && <Field label={t("cashFlowDirection")}><select value={cashFlowDirection} onChange={(event) => setCashFlowDirection(event.target.value as NonNullable<Transaction["cashFlowDirection"]>)}><option value="outflow">{t("cashOutflow")}</option><option value="inflow">{t("cashInflow")}</option><option value="neutral">{t("cashNeutral")}</option></select></Field>}
    <Field label={t("date")}><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
    <Field label={t("description")} wide><input required maxLength={240} value={description} onChange={(event) => setDescription(event.target.value)} autoFocus /></Field>
    <Field label={t("category")}><select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">—</option>{categories.map((item) => <option key={item.id} value={item.id}>{language === "it" ? item.nameIt : item.nameEn}</option>)}</select></Field>
    <Field label={t("paymentMethod")}><select required value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}>{data.paymentMethods.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label={t("account")}><select required={requiresAccount} value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="">—</option>{data.accounts.filter((item) => item.active || item.id === accountId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label={t("amount")}><input required min="0.01" step="0.01" inputMode="decimal" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>
    <Field label={t("property")}><select value={propertyId} onChange={(event) => setPropertyId(event.target.value)}><option value="">—</option>{data.properties.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label={t("investmentOrCompartment")}><select value={investmentId} onChange={(event) => setInvestmentId(event.target.value)}><option value="">—</option>{regularPositions.length > 0 && <optgroup label={t("investments")}>{regularPositions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>}{pensionPositions.length > 0 && <optgroup label={t("pensionCompartments")}>{pensionPositions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>}</select></Field>
    <Field label={t("recurring")}><select value={recurringId} onChange={(event) => setRecurringId(event.target.value)}><option value="">—</option>{recurringItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    {kind === "expense" && <><Field label={t("sharedExpense")}><span className="check-field"><input type="checkbox" checked={shared} onChange={(event) => setShared(event.target.checked)} />{t("splitHalf")}</span></Field>{shared && <Field label={t("paidBy")}><select value={sharedPaidBy} onChange={(event) => setSharedPaidBy(event.target.value as "owner" | "partner")}><option value="owner">{t("you")}</option><option value="partner">{t("partner")}</option></select></Field>}</>}
    <Field label={t("notes")} wide><textarea maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}
