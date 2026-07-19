import { CheckCheck, CircleCheckBig, Clock3, Pencil, Printer, Trash2, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData, SharedExpense } from "../../domain/models";
import { EmptyState } from "../components/EmptyState";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { SharedExpenseForm } from "../forms/SharedExpenseForm";
import { useI18n } from "../i18n/I18nContext";
import { formatCurrency, formatDate } from "../utils/format";
import { runUiAction } from "../utils/save";

export function SharedExpensesView({ data, onSave }: { data: FinanceData; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n(); const [editing, setEditing] = useState<SharedExpense | null | undefined>(); const [month, setMonth] = useState(`${data.meta.activeYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
  const rows = useMemo(() => [...data.sharedExpenses].filter((item) => month === "all" || item.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date)), [data.sharedExpenses, month]);
  const pending = rows.filter((item) => !item.settled);
  const balance = pending.reduce((sum, item) => item.paidBy === "owner" ? sum + item.partnerShare : sum - item.ownerShare, 0);
  const total = rows.reduce((sum, item) => sum + item.amount, 0);
  const months = Array.from({ length: 12 }, (_, index) => `${data.meta.activeYear}-${String(index + 1).padStart(2, "0")}`);
  const monthLabel = (value: string) => new Intl.DateTimeFormat(language === "it" ? "it-IT" : "en-GB", { month: "long", year: "numeric" }).format(new Date(`${value}-01T12:00:00Z`));
  const remove = (id: string) => { if (window.confirm(t("deleteConfirm"))) runUiAction(() => onSave({ type: "deleteEntity", entity: "sharedExpense", id })); };
  const settleMonth = () => { if (month !== "all" && window.confirm(t("settleMonthConfirm"))) runUiAction(() => onSave({ type: "settleSharedExpenseMonth", month, settled: true })); };
  return <><PageHeader title={t("shared")} subtitle={t("sharedSubtitle")} actionLabel={t("newShared")} onAction={() => setEditing(null)} />
    <section className="view-kpi-grid"><KpiCard label={t("sharedBalance")} value={formatCurrency(balance, language)} icon={UsersRound} tone="blue"/><KpiCard label={t("monthTotal")} value={formatCurrency(total, language)} icon={Clock3} tone="gold"/><KpiCard label={t("settledExpenses")} value={String(rows.length - pending.length)} icon={CircleCheckBig} tone="mint"/></section>
    <div className="data-toolbar filter-toolbar"><div className="filter-row filter-row-three"><select aria-label={t("month")} value={month} onChange={(event) => setMonth(event.target.value)}><option value="all">{t("allMonths")}</option>{months.map((item) => <option key={item} value={item}>{monthLabel(item)}</option>)}</select><button className="secondary-button" disabled={month === "all" || !pending.length} onClick={settleMonth}><CheckCheck size={16}/>{t("settleWholeMonth")}</button><button className="secondary-button" disabled={month === "all" || !pending.length} onClick={() => window.print()}><Printer size={16}/>{t("printPending")}</button></div></div>
    <section className="panel table-panel scroll-table">{rows.length ? <table className="data-table"><thead><tr><th>{t("date")}</th><th>{t("description")}</th><th>{t("paidBy")}</th><th>{t("yourShare")}</th><th>{t("partnerShare")}</th><th>{t("status")}</th><th /></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td>{formatDate(item.date, language)}</td><td>{item.description}</td><td>{item.paidBy === "owner" ? t("you") : t("partner")}</td><td>{formatCurrency(item.ownerShare, language)}</td><td>{formatCurrency(item.partnerShare, language)}</td><td><span className={`pill ${item.settled ? "kind-income" : "kind-expense"}`}>{item.settled ? t("settled") : t("pending")}</span></td><td><div className="row-actions"><button className="text-button" onClick={() => runUiAction(() => onSave({ type: "setSharedExpenseSettled", id: item.id, settled: !item.settled }))}>{item.settled ? t("markPending") : t("markSettled")}</button><button className="icon-button" onClick={() => setEditing(item)} aria-label={t("edit")}><Pencil size={15}/></button><button className="icon-button danger" onClick={() => remove(item.id)} aria-label={t("delete")}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table> : <EmptyState title={t("noShared")} actionLabel={t("addFirst")} onAction={() => setEditing(null)} />}</section>
    <section className="print-report"><h1>ContaMì — {t("pendingExpenses")}</h1><h2>{month === "all" ? "" : monthLabel(month)}</h2><table><thead><tr><th>{t("date")}</th><th>{t("description")}</th><th>{t("paidBy")}</th><th>{t("amount")}</th><th>{t("partnerShare")}</th></tr></thead><tbody>{pending.map((item) => <tr key={item.id}><td>{formatDate(item.date, language)}</td><td>{item.description}</td><td>{item.paidBy === "owner" ? t("you") : t("partner")}</td><td>{formatCurrency(item.amount, language)}</td><td>{formatCurrency(item.partnerShare, language)}</td></tr>)}</tbody></table><p>{t("sharedBalance")}: <strong>{formatCurrency(balance, language)}</strong></p></section>
    {editing !== undefined && <SharedExpenseForm data={data} value={editing ?? undefined} onClose={() => setEditing(undefined)} onSave={onSave} />}
  </>;
}
