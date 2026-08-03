import { ArrowDownRight, ArrowUpRight, CalendarDays, Pencil, RotateCcw, Scale, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { FinanceCommand } from "../../domain/commands";
import { transactionAccountTotals, transactionCashTotals } from "../../domain/finance";
import type { FinanceData, Transaction } from "../../domain/models";
import { transactionHasCashEffect } from "../../domain/operationalDataRepair";
import { EmptyState } from "../components/EmptyState";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { TransactionForm } from "../forms/TransactionForm";
import { useI18n } from "../i18n/I18nContext";
import { formatCurrency, formatDate, todayIso } from "../utils/format";
import { runUiAction } from "../utils/save";

export function TransactionsView({ data, onSave }: { data: FinanceData; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n();
  const [editing, setEditing] = useState<Transaction | null | undefined>();
  const [confirming, setConfirming] = useState(false);
  const [query, setQuery] = useState(""); const [kind, setKind] = useState("all");
  const [categoryId, setCategoryId] = useState("all"); const [paymentMethodId, setPaymentMethodId] = useState("all"); const [month, setMonth] = useState("all");
  const yearPrefix = String(data.meta.activeYear);
  const rows = useMemo(() => [...data.transactions].filter((item) => item.date.startsWith(yearPrefix))
    .filter((item) => kind === "all" || item.kind === kind)
    .filter((item) => categoryId === "all" || item.categoryId === categoryId)
    .filter((item) => paymentMethodId === "all" || item.paymentMethodId === paymentMethodId)
    .filter((item) => month === "all" || item.date.startsWith(month))
    .filter((item) => item.description.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date)), [data.transactions, yearPrefix, kind, categoryId, paymentMethodId, month, query]);
  const accountFiltered = useMemo(() => transactionAccountTotals(data, rows, "account", { includePlanned: true }), [data, rows]);
  const cashRegisterFiltered = useMemo(() => transactionAccountTotals(data, rows, "cashRegister", { includePlanned: true }), [data, rows]);
  const today = todayIso();
  const rowsThroughToday = useMemo(() => rows.filter((item) => item.date <= today && !item.planned), [rows, today]);
  const throughToday = useMemo(() => transactionCashTotals(rowsThroughToday), [rowsThroughToday]);
  const liquidityToday = useMemo(() =>
    transactionAccountTotals(data, rowsThroughToday, "account", { openingThroughDate: today }).balance
      + transactionAccountTotals(data, rowsThroughToday, "cashRegister", { openingThroughDate: today }).balance,
  [data, rowsThroughToday, today]);
  const unassignedTransactions = useMemo(() => data.transactions.filter((item) =>
    item.date.startsWith(yearPrefix) && !item.accountId && transactionHasCashEffect(item)).length, [data.transactions, yearPrefix]);
  const categoryName = (id: string) => { const item = data.categories.find((candidate) => candidate.id === id); return item ? (language === "it" ? item.nameIt : item.nameEn) : "—"; };
  const methodName = (id: string) => data.paymentMethods.find((item) => item.id === id)?.name ?? "—";
  const isRecurring = (item: Transaction) => Boolean(item.recurringId);
  const filtersActive = Boolean(query || kind !== "all" || categoryId !== "all" || paymentMethodId !== "all" || month !== "all");
  const resetFilters = () => {
    setQuery("");
    setKind("all");
    setCategoryId("all");
    setPaymentMethodId("all");
    setMonth("all");
  };
  const remove = (id: string) => { if (window.confirm(t("deleteConfirm"))) runUiAction(() => onSave({ type: "deleteEntity", entity: "transaction", id })); };
  const confirmPlannedTransaction = (item: Transaction) => {
    const recurring = data.recurringItems.find((candidate) => candidate.id === item.recurringId);
    if (recurring?.kind === "rent") {
      setConfirming(true);
      setEditing(item);
      return;
    }
    runUiAction(() => onSave({
      type: "updateTransaction",
      value: { ...item, planned: false, updatedAt: new Date().toISOString() },
    }));
  };
  const months = Array.from({ length: 12 }, (_, index) => `${data.meta.activeYear}-${String(index + 1).padStart(2, "0")}`);
  const monthLabel = (value: string) => new Intl.DateTimeFormat(language === "it" ? "it-IT" : "en-GB", { month: "long", year: "numeric" }).format(new Date(`${value}-01T12:00:00Z`));
  return <><PageHeader eyebrow={`${data.meta.activeYear}`} title={t("transactions")} subtitle={t("transactionsSubtitle")} actionLabel={t("newTransaction")} onAction={() => { setConfirming(false); setEditing(null); }} />
    <section className="view-kpi-grid transaction-kpi-grid"><KpiCard label={t("filteredAccountInflows")} value={formatCurrency(accountFiltered.inflows, language)} icon={ArrowUpRight} tone="mint"/><KpiCard label={t("filteredAccountOutflows")} value={formatCurrency(accountFiltered.outflows, language)} icon={ArrowDownRight} tone="coral"/><KpiCard label={t("filteredAccountBalance")} value={formatCurrency(accountFiltered.balance, language)} icon={Scale} tone="blue" detail={t("openingBalanceIncluded", { amount: formatCurrency(accountFiltered.openingBalance, language) })}/><KpiCard label={t("filteredCashRegisterInflows")} value={formatCurrency(cashRegisterFiltered.inflows, language)} icon={ArrowUpRight} tone="mint"/><KpiCard label={t("filteredCashRegisterOutflows")} value={formatCurrency(cashRegisterFiltered.outflows, language)} icon={ArrowDownRight} tone="coral"/><KpiCard label={t("filteredCashRegisterBalance")} value={formatCurrency(cashRegisterFiltered.balance, language)} icon={Scale} tone="gold" detail={t("openingBalanceIncluded", { amount: formatCurrency(cashRegisterFiltered.openingBalance, language) })}/></section>
    <section className="asof-strip"><CalendarDays size={17}/><span>{t("totalsToday")}</span><strong>{t("cashInflows")}: {formatCurrency(throughToday.inflows, language)}</strong><strong>{t("cashOutflows")}: {formatCurrency(throughToday.outflows, language)}</strong><strong>{t("liquidity")}: {formatCurrency(liquidityToday, language)}</strong></section>
    {unassignedTransactions > 0 && <div className="notice" role="status">{t("unassignedTransactionsWarning", { count: unassignedTransactions })}</div>}
    <div className="data-toolbar filter-toolbar"><div className="search-field filter-search"><Search size={17}/><input aria-label={t("searchByDescription")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("filterPlaceholder")} /></div>
      <div className="filter-row filter-row-four"><select aria-label={t("type")} value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">{t("allTypes")}</option><option value="income">{t("income")}</option><option value="expense">{t("expenses")}</option><option value="transfer">{t("transfer")}</option></select>
      <select aria-label={t("category")} value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="all">{t("allCategories")}</option>{data.categories.map((item) => <option key={item.id} value={item.id}>{language === "it" ? item.nameIt : item.nameEn}</option>)}</select>
      <select aria-label={t("paymentMethod")} value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}><option value="all">{t("allPaymentMethods")}</option>{data.paymentMethods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select aria-label={t("month")} value={month} onChange={(event) => setMonth(event.target.value)}><option value="all">{t("allMonths")}</option>{months.map((item) => <option key={item} value={item}>{monthLabel(item)}</option>)}</select></div>
      <div className="filter-actions"><button type="button" className="secondary-button filter-reset-button" disabled={!filtersActive} onClick={resetFilters}><RotateCcw size={15}/>{t("resetFilters")}</button></div>
    </div>
    <section className="panel table-panel scroll-table">{rows.length ? <table className="data-table"><thead><tr><th>{t("date")}</th><th>{t("description")}</th><th>{t("category")}</th><th>{t("paymentMethod")}</th><th>{t("amount")}</th><th /></tr></thead><tbody>{rows.map((item) => { const inflow = item.kind === "income" || (item.kind === "transfer" && item.cashFlowDirection === "inflow"); const outflow = item.kind === "expense" || (item.kind === "transfer" && item.cashFlowDirection === "outflow"); return <tr key={item.id} className={isRecurring(item) ? "recurring-row" : ""}><td>{formatDate(item.date, language)}{item.dueDate && item.dueDate !== item.date && <small className="transaction-due-date">{t("dueDateShort")}: {formatDate(item.dueDate, language)}</small>}</td><td>{item.description}{isRecurring(item) && <span className="pill recurring-badge">{t("recurringBadge")}</span>}{item.planned && <span className="pill planned-badge">{t("planned")}</span>}</td><td><span className="pill">{categoryName(item.categoryId)}</span></td><td>{methodName(item.paymentMethodId)}</td><td className={inflow ? "amount-income" : outflow ? "amount-expense" : ""}>{inflow ? "+" : outflow ? "−" : ""}{formatCurrency(item.amount, language, item.currency)}</td><td><div className="row-actions">{item.planned && <button className="text-button" onClick={() => confirmPlannedTransaction(item)}>{t("confirm")}</button>}<button className="icon-button" aria-label={t("edit")} onClick={() => { setConfirming(false); setEditing(item); }}><Pencil size={15}/></button><button className="icon-button danger" aria-label={t("delete")} onClick={() => remove(item.id)}><Trash2 size={15}/></button></div></td></tr>; })}</tbody></table> : <EmptyState title={t(data.transactions.length && filtersActive ? "noFilteredEntries" : "noTransactions")} actionLabel={t("addFirst")} onAction={() => { setConfirming(false); setEditing(null); }} />}</section>
    {editing !== undefined && <TransactionForm data={data} value={editing ?? undefined} confirming={confirming} onClose={() => { setEditing(undefined); setConfirming(false); }} onSave={onSave} />}
  </>;
}
