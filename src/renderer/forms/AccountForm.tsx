import { useState, type FormEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData } from "../../domain/models";
import { Field, Modal } from "../components/Modal";
import { useI18n } from "../i18n/I18nContext";
import { todayIso } from "../utils/format";
import { saveAndClose } from "../utils/save";

export function AccountForm({ onClose, onSave }: { onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t } = useI18n(); const [name, setName] = useState(""); const [openingBalance, setOpeningBalance] = useState("0"); const [openedAt, setOpenedAt] = useState(todayIso()); const [notes, setNotes] = useState(""); const [kind, setKind] = useState<"bank" | "card" | "digital_wallet" | "other">("bank");
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!name.trim()) return; await saveAndClose(onSave, { type: "addAccount", value: { id: crypto.randomUUID(), name, kind, currency: "EUR", openingBalance: Number(openingBalance), active: true, openedAt, notes } }, onClose); };
  return <Modal title={t("newAccount")} onClose={onClose} onSubmit={submit} submitDisabled={!name.trim()}>
    <Field label={t("name")} wide><input required value={name} maxLength={240} onChange={(event) => setName(event.target.value)} autoFocus /></Field>
    <Field label={t("type")}><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="bank">{t("bank")}</option><option value="card">{t("card")}</option><option value="digital_wallet">{t("digitalWallet")}</option><option value="other">{t("other")}</option></select></Field>
    <Field label={t("openingBalance")}><input required type="number" step="0.01" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} /></Field>
    <Field label={t("date")}><input required type="date" value={openedAt} onChange={(event) => setOpenedAt(event.target.value)} /></Field>
    <Field label={t("notes")} wide><textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}

export function CashRegisterForm({ data, onClose, onSave }: { data: FinanceData; onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [openedAt, setOpenedAt] = useState(todayIso());
  const [defaultFundingAccountId, setDefaultFundingAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    await saveAndClose(onSave, {
      type: "addAccount",
      value: {
        id: crypto.randomUUID(), name, kind: "cash", defaultFundingAccountId: defaultFundingAccountId || undefined,
        currency: "EUR", openingBalance: Number(openingBalance), active: true, openedAt, notes,
      },
    }, onClose);
  };
  return <Modal title={t("newCashRegister")} onClose={onClose} onSubmit={submit} submitDisabled={!name.trim()}>
    <Field label={t("name")} wide><input required value={name} maxLength={240} onChange={(event) => setName(event.target.value)} autoFocus /></Field>
    <Field label={t("defaultFundingAccount")}><select value={defaultFundingAccountId} onChange={(event) => setDefaultFundingAccountId(event.target.value)}><option value="">—</option>{data.accounts.filter((item) => item.active && item.kind !== "cash").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label={t("openingBalance")}><input required type="number" step="0.01" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} /></Field>
    <Field label={t("date")}><input required type="date" value={openedAt} onChange={(event) => setOpenedAt(event.target.value)} /></Field>
    <Field label={t("notes")} wide><textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}
