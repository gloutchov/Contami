import { CircleCheckBig, Clock3, UsersRound } from "lucide-react";
import { useState } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData } from "../../domain/models";
import { EmptyState } from "../components/EmptyState";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { SharedExpenseForm } from "../forms/SharedExpenseForm";
import { useI18n } from "../i18n/I18nContext";
import { formatCurrency, formatDate } from "../utils/format";
import { runUiAction } from "../utils/save";

export function SharedExpensesView({ data, onSave }: { data: FinanceData; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n(); const [open, setOpen] = useState(false);
  const pending = data.sharedExpenses.filter((item) => !item.settled);
  const balance = pending.reduce((sum, item) => item.paidBy === "owner" ? sum + item.partnerShare : sum - item.ownerShare, 0);
  return <><PageHeader title={t("shared")} subtitle={t("overviewSubtitle")} actionLabel={t("newShared")} onAction={() => setOpen(true)} />
    <section className="view-kpi-grid"><KpiCard label={t("sharedBalance")} value={formatCurrency(balance, language)} icon={UsersRound} tone="blue"/><KpiCard label={t("pendingExpenses")} value={String(pending.length)} icon={Clock3} tone="gold"/><KpiCard label={t("settledExpenses")} value={String(data.sharedExpenses.length - pending.length)} icon={CircleCheckBig} tone="mint"/></section>
    <section className="panel table-panel">{data.sharedExpenses.length ? <table className="data-table"><thead><tr><th>{t("date")}</th><th>{t("description")}</th><th>{t("paidBy")}</th><th>{t("yourShare")}</th><th>{t("partnerShare")}</th><th>{t("status")}</th><th /></tr></thead><tbody>{[...data.sharedExpenses].sort((a, b) => b.date.localeCompare(a.date)).map((item) => <tr key={item.id}><td>{formatDate(item.date, language)}</td><td>{item.description}</td><td>{item.paidBy === "owner" ? t("you") : t("partner")}</td><td>{formatCurrency(item.ownerShare, language)}</td><td>{formatCurrency(item.partnerShare, language)}</td><td><span className="pill">{item.settled ? t("settled") : t("pending")}</span></td><td><button className="text-button" onClick={() => runUiAction(() => onSave({ type: "setSharedExpenseSettled", id: item.id, settled: !item.settled }))}>{item.settled ? t("markPending") : t("markSettled")}</button></td></tr>)}</tbody></table> : <EmptyState title={t("noShared")} actionLabel={t("addFirst")} onAction={() => setOpen(true)} />}</section>
    {open && <SharedExpenseForm data={data} onClose={() => setOpen(false)} onSave={onSave} />}
  </>;
}
