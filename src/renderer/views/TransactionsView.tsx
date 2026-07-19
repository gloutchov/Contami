import { ArrowDownRight, ArrowUpRight, CalendarDays, Pencil, Scale, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData, Transaction } from "../../domain/models";
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
  const [query, setQuery] = useState(""); const [kind, setKind] = useState("all");
  const [categoryId, setCategoryId] = useState("all"); const [paymentMethodId, setPaymentMethodId] = useState("all"); const [month, setMonth] = useState("all");
  const yearPrefix = String(data.meta.activeYear);
  const recurringNames = useMemo(() => data.recurringItems.map((item) => item.name.toLocaleLowerCase()), [data.recurringItems]);
  const rows = useMemo(() => [...data.transactions].filter((item) => item.date.startsWith(yearPrefix))
    .filter((item) => kind === "all" || item.kind === kind)
    .filter((item) => categoryId === "all" || item.categoryId === categoryId)
    .filter((item) => paymentMethodId === "all" || item.paymentMethodId === paymentMethodId)
    .filter((item) => month === "all" || item.date.startsWith(month))
    .filter((item) => item.description.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date)), [data.transactions, yearPrefix, kind, categoryId, paymentMethodId, month, query]);
  const total = (items: Transaction[]) => {
    const income = items.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount, 0);
    const expenses = items.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount, 0);
    return { income, expenses, net: income - expenses };
  };
  const filtered = useMemo(() => total(rows), [rows]);
  const throughToday = useMemo(() => total(rows.filter((item) => item.date <= todayIso() && !item.planned)), [rows]);
  const categoryName = (id: string) => { const item = data.categories.find((candidate) => candidate.id === id); return item ? (language === "it" ? item.nameIt : item.nameEn) : "—"; };
  const methodName = (id: string) => data.paymentMethods.find((item) => item.id === id)?.name ?? "—";
  const isRecurring = (item: Transaction) => Boolean(item.recurringId) || recurringNames.some((name) => item.description.toLocaleLowerCase().includes(name));
  const remove = (id: string) => { if (window.confirm(t("deleteConfirm"))) runUiAction(() => onSave({ type: "deleteEntity", entity: "transaction", id })); };
  const months = Array.from({ length: 12 }, (_, index) => `${data.meta.activeYear}-${String(index + 1).padStart(2, "0")}`);
  const monthLabel = (value: string) => new Intl.DateTimeFormat(language === "it" ? "it-IT" : "en-GB", { month: "long", year: "numeric" }).format(new Date(`${value}-01T12:00:00Z`));
  return <><PageHeader eyebrow={`${data.meta.activeYear}`} title={t("transactions")} subtitle={t("transactionsSubtitle")} actionLabel={t("newTransaction")} onAction={() => setEditing(null)} />
    <section className="view-kpi-grid"><KpiCard label={month === "all" ? t("filteredIncome") : t("monthIncome")} value={formatCurrency(filtered.income, language)} icon={ArrowUpRight} tone="mint"/><KpiCard label={month === "all" ? t("filteredExpenses") : t("monthExpenses")} value={formatCurrency(filtered.expenses, language)} icon={ArrowDownRight} tone="coral"/><KpiCard label={t("filteredNet")} value={formatCurrency(filtered.net, language)} icon={Scale} tone="blue"/></section>
    <section className="asof-strip"><CalendarDays size={17}/><span>{t("totalsToday")}</span><strong>{t("income")}: {formatCurrency(throughToday.income, language)}</strong><strong>{t("expenses")}: {formatCurrency(throughToday.expenses, language)}</strong><strong>{t("netCashFlow")}: {formatCurrency(throughToday.net, language)}</strong></section>
    <div className="data-toolbar filter-toolbar"><div className="search-field filter-search"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("filterPlaceholder")} /></div>
      <div className="filter-row filter-row-four"><select aria-label={t("type")} value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">{t("allTypes")}</option><option value="income">{t("income")}</option><option value="expense">{t("expenses")}</option><option value="transfer">{t("transfer")}</option></select>
      <select aria-label={t("category")} value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="all">{t("allCategories")}</option>{data.categories.map((item) => <option key={item.id} value={item.id}>{language === "it" ? item.nameIt : item.nameEn}</option>)}</select>
      <select aria-label={t("paymentMethod")} value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}><option value="all">{t("allPaymentMethods")}</option>{data.paymentMethods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select aria-label={t("month")} value={month} onChange={(event) => setMonth(event.target.value)}><option value="all">{t("allMonths")}</option>{months.map((item) => <option key={item} value={item}>{monthLabel(item)}</option>)}</select></div>
    </div>
    <section className="panel table-panel scroll-table">{rows.length ? <table className="data-table"><thead><tr><th>{t("date")}</th><th>{t("description")}</th><th>{t("category")}</th><th>{t("paymentMethod")}</th><th>{t("amount")}</th><th /></tr></thead><tbody>{rows.map((item) => { const inflow = item.kind === "income" || (item.kind === "transfer" && item.cashFlowDirection === "inflow"); const outflow = item.kind === "expense" || (item.kind === "transfer" && item.cashFlowDirection === "outflow"); return <tr key={item.id} className={isRecurring(item) ? "recurring-row" : ""}><td>{formatDate(item.date, language)}</td><td>{item.description}{isRecurring(item) && <span className="pill recurring-badge">{t("recurringBadge")}</span>}{item.planned && <span className="pill planned-badge">{t("planned")}</span>}</td><td><span className="pill">{categoryName(item.categoryId)}</span></td><td>{methodName(item.paymentMethodId)}</td><td className={inflow ? "amount-income" : outflow ? "amount-expense" : ""}>{inflow ? "+" : outflow ? "−" : ""}{formatCurrency(item.amount, language, item.currency)}</td><td><div className="row-actions">{item.planned && <button className="text-button" onClick={() => runUiAction(() => onSave({ type: "updateTransaction", value: { ...item, planned: false, updatedAt: new Date().toISOString() } }))}>{t("confirm")}</button>}<button className="icon-button" aria-label={t("edit")} onClick={() => setEditing(item)}><Pencil size={15}/></button><button className="icon-button danger" aria-label={t("delete")} onClick={() => remove(item.id)}><Trash2 size={15}/></button></div></td></tr>; })}</tbody></table> : <EmptyState title={t("noTransactions")} actionLabel={t("addFirst")} onAction={() => setEditing(null)} />}</section>
    {editing !== undefined && <TransactionForm data={data} value={editing ?? undefined} onClose={() => setEditing(undefined)} onSave={onSave} />}
  </>;
}
