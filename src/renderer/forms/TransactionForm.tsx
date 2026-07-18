import { useMemo, useState, type FormEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData } from "../../domain/models";
import { useI18n } from "../i18n/I18nContext";
import { Field, Modal } from "../components/Modal";
import { todayIso } from "../utils/format";
import { saveAndClose } from "../utils/save";

export function TransactionForm({ data, onClose, onSave }: { data: FinanceData; onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n();
  const [kind, setKind] = useState<"income" | "expense" | "transfer">("expense");
  const [date, setDate] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(data.paymentMethods.find((item) => item.active)?.id ?? "");
  const [accountId, setAccountId] = useState(data.accounts.find((item) => item.active)?.id ?? "");
  const [notes, setNotes] = useState("");
  const categories = useMemo(() => data.categories.filter((item) => item.active && (item.kind === kind || item.kind === "both")), [data.categories, kind]);
  const valid = description.trim() && Number(amount) > 0 && categoryId && paymentMethodId;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;
    const timestamp = new Date().toISOString();
    await saveAndClose(onSave, { type: "addTransaction", value: {
      id: crypto.randomUUID(), date, description, categoryId, paymentMethodId,
      accountId: accountId || undefined, kind, amount: Number(amount), currency: "EUR", notes,
      createdAt: timestamp, updatedAt: timestamp,
    } }, onClose);
  };
  return (
    <Modal title={t("newTransaction")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
      <Field label={t("type")}><select value={kind} onChange={(event) => { setKind(event.target.value as typeof kind); setCategoryId(""); }}><option value="expense">{t("expense")}</option><option value="income">{t("income")}</option><option value="transfer">{t("transfer")}</option></select></Field>
      <Field label={t("date")}><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
      <Field label={t("description")} wide><input required maxLength={240} value={description} onChange={(event) => setDescription(event.target.value)} autoFocus /></Field>
      <Field label={t("category")}><select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">—</option>{categories.map((item) => <option key={item.id} value={item.id}>{language === "it" ? item.nameIt : item.nameEn}</option>)}</select></Field>
      <Field label={t("paymentMethod")}><select required value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}>{data.paymentMethods.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
      <Field label={t("account")}><select value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="">—</option>{data.accounts.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
      <Field label={t("amount")}><input required min="0.01" step="0.01" inputMode="decimal" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>
      <Field label={t("notes")} wide><textarea maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
    </Modal>
  );
}
