import { LockKeyhole, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData, RecurringItem, RecurringRateChange } from "../../domain/models";
import {
  recurringOccurrenceDate,
  recurringRateAt,
  recurringRateChangeImpactCount,
  recurringRateChangeIsMutable,
  recurringRateChangesFor,
} from "../../domain/recurringRates";
import { useI18n } from "../i18n/I18nContext";
import { formatCurrency, formatDate } from "../utils/format";

export function RecurringRateChangesEditor({ data, recurring, onSave }: {
  data: FinanceData;
  recurring: RecurringItem;
  onSave: (command: FinanceCommand) => Promise<void>;
}) {
  const { t, language } = useI18n();
  const changes = useMemo(() => recurringRateChangesFor(data, recurring.id), [data, recurring.id]);
  const [editing, setEditing] = useState<RecurringRateChange | null | undefined>();
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [saving, setSaving] = useState(false);
  const firstPlannedMonth = useMemo(() => data.transactions
    .filter((item) => item.recurringId === recurring.id && item.planned)
    .map(recurringOccurrenceDate)
    .sort()[0]?.slice(0, 7) ?? recurring.nextDueDate.slice(0, 7), [data.transactions, recurring.id, recurring.nextDueDate]);

  const begin = (change?: RecurringRateChange) => {
    setEditing(change ?? null);
    setAmount(String(change?.amount ?? recurringRateAt(data, recurring, recurring.nextDueDate)));
    setMonth(change?.effectiveFrom.slice(0, 7) ?? firstPlannedMonth);
  };
  const closeEditor = () => { setEditing(undefined); setAmount(""); setMonth(""); };
  const duplicateMonth = changes.some((item) => item.id !== editing?.id && item.effectiveFrom === `${month}-01`);
  const valid = Number.isFinite(Number(amount)) && Number(amount) > 0 && /^\d{4}-\d{2}$/.test(month) && !duplicateMonth;
  const candidateChange: RecurringRateChange | undefined = valid ? {
    id: editing?.id ?? crypto.randomUUID(),
    recurringId: recurring.id,
    amount: Number(amount),
    effectiveFrom: `${month}-01`,
  } : undefined;
  const candidateChanges = candidateChange
    ? [...changes.filter((item) => item.id !== editing?.id), candidateChange]
      .sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom))
    : changes;
  const impactCount = recurringRateChangeImpactCount(data, recurring.id, candidateChanges);

  const saveRate = async () => {
    if (!candidateChange || saving) return;
    if (!window.confirm(t("rateChangeConfirm", { count: impactCount }))) return;
    setSaving(true);
    try {
      await onSave({
        type: editing ? "updateRecurringRateChange" : "addRecurringRateChange",
        value: candidateChange,
      });
      closeEditor();
    } catch {
      // The global notice reports the localized error; keep the editor open.
    } finally {
      setSaving(false);
    }
  };

  const deleteRate = async (change: RecurringRateChange) => {
    const candidate = changes.filter((item) => item.id !== change.id);
    const count = recurringRateChangeImpactCount(data, recurring.id, candidate);
    if (!window.confirm(t("deleteRateChangeConfirm", { count }))) return;
    try {
      await onSave({ type: "deleteRecurringRateChange", id: change.id });
      if (editing?.id === change.id) closeEditor();
    } catch {
      // The global notice reports the localized error and the workbook is unchanged.
    }
  };

  const confirmWithKeyboard = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void saveRate();
  };

  return <section className="recurring-rate-editor wide" aria-labelledby={`rate-history-${recurring.id}`}>
    <div className="recurring-rate-heading">
      <div><h3 id={`rate-history-${recurring.id}`}>{t("rateHistory")}</h3><p>{t("rateHistoryHelp")}</p></div>
      {editing === undefined && <button type="button" className="secondary-button" onClick={() => begin()}>{t("changeRate")}</button>}
    </div>
    <div className="rate-history-list">
      <div className="rate-history-row base-rate-row"><span>{t("baseRate")}</span><strong>{formatCurrency(recurring.amount, language)}</strong></div>
      {changes.map((change) => {
        const mutable = recurringRateChangeIsMutable(data, change);
        return <div className="rate-history-row" key={change.id}>
          <span>{t("fromDate", { date: formatDate(change.effectiveFrom, language) })}</span>
          <strong>{formatCurrency(change.amount, language)}</strong>
          <div className="row-actions">
            {mutable ? <><button type="button" className="icon-button" onClick={() => begin(change)} aria-label={t("editRateChange")}><Pencil size={15}/></button><button type="button" className="icon-button danger" onClick={() => void deleteRate(change)} aria-label={t("deleteRateChange")}><Trash2 size={15}/></button></> : <span className="rate-locked" title={t("historicalRateLocked")}><LockKeyhole size={14}/>{t("historical")}</span>}
          </div>
        </div>;
      })}
    </div>
    {editing !== undefined && <div className="rate-change-fields">
      <label className="field"><span>{t("newRateAmount")}</span><input aria-label={t("newRateAmount")} required type="number" min="0.01" max="1000000000000" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} onKeyDown={confirmWithKeyboard} autoFocus /></label>
      <label className="field"><span>{t("effectiveMonth")}</span><input aria-label={t("effectiveMonth")} required type="month" value={month} onChange={(event) => setMonth(event.target.value)} onKeyDown={confirmWithKeyboard} /></label>
      <p className={duplicateMonth ? "rate-change-warning" : "rate-change-preview"}>{duplicateMonth ? t("duplicateRateMonth") : t("rateChangePreview", { count: impactCount })}</p>
      <div className="rate-change-actions"><button type="button" className="secondary-button" onClick={closeEditor}>{t("cancel")}</button><button type="button" className="primary-button" disabled={!valid || saving} onClick={() => void saveRate()}>{editing ? t("updateRate") : t("confirmRateChange")}</button></div>
    </div>}
  </section>;
}
