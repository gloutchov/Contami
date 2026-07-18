import { CalendarClock, ListChecks, ReceiptText } from "lucide-react";
import { useState } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData } from "../../domain/models";
import { EmptyState } from "../components/EmptyState";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { RecurringForm } from "../forms/RecurringForm";
import { useI18n } from "../i18n/I18nContext";
import { formatCurrency, formatDate, todayIso } from "../utils/format";
import { runUiAction } from "../utils/save";

const monthly = (amount: number, frequency: "weekly" | "monthly" | "quarterly" | "yearly") => ({ weekly: amount * 52 / 12, monthly: amount, quarterly: amount / 3, yearly: amount / 12 })[frequency];

export function RecurringView({ data, onSave }: { data: FinanceData; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n(); const [open, setOpen] = useState(false);
  const active = data.recurringItems.filter((item) => item.active);
  const monthlyTotal = active.reduce((sum, item) => sum + monthly(item.amount, item.frequency), 0);
  const installments = active.filter((item) => item.kind === "installment").reduce((sum, item) => sum + (item.remainingInstallments ?? 0), 0);
  return <><PageHeader title={t("recurring")} subtitle={t("overviewSubtitle")} actionLabel={t("newRecurring")} onAction={() => setOpen(true)} />
    <section className="view-kpi-grid"><KpiCard label={t("monthlyRecurring")} value={formatCurrency(monthlyTotal, language)} icon={CalendarClock} tone="gold"/><KpiCard label={t("activeItems")} value={String(active.length)} icon={ListChecks} tone="mint"/><KpiCard label={t("installmentsLeft")} value={String(installments)} icon={ReceiptText} tone="blue"/></section>
    <section className="panel list-panel">{data.recurringItems.length ? [...data.recurringItems].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)).map((item) => <div className="list-row" key={item.id}><div><h3>{item.name}</h3><p>{t(item.kind === "investment" ? "investmentPlan" : item.kind)}</p></div><div className="list-cell"><span>{t("amount")}</span><strong>{formatCurrency(item.amount, language)}</strong></div><div className="list-cell"><span>{t("recurringMonthly")}</span><strong>{formatCurrency(monthly(item.amount, item.frequency), language)}</strong></div><div className="list-cell"><span>{t("nextDue")}</span><strong>{formatDate(item.nextDueDate, language)}</strong></div><button className="text-button" onClick={() => runUiAction(() => onSave({ type: "setActive", entity: "recurringItem", id: item.id, active: !item.active, closedAt: item.active ? todayIso() : undefined }))}>{item.active ? t("close") : t("reopen")}</button></div>) : <EmptyState title={t("noRecurring")} actionLabel={t("addFirst")} onAction={() => setOpen(true)} />}</section>
    {open && <RecurringForm data={data} onClose={() => setOpen(false)} onSave={onSave} />}
  </>;
}
