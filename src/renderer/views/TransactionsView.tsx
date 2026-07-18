import { ArrowDownRight, ArrowUpRight, Scale, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData } from "../../domain/models";
import { EmptyState } from "../components/EmptyState";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { TransactionForm } from "../forms/TransactionForm";
import { useI18n } from "../i18n/I18nContext";
import { formatCurrency, formatDate } from "../utils/format";

export function TransactionsView({ data, onSave }: { data: FinanceData; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n(); const [open, setOpen] = useState(false); const [query, setQuery] = useState(""); const [kind, setKind] = useState("all");
  const rows = useMemo(() => [...data.transactions].filter((item) => (kind === "all" || item.kind === kind) && item.description.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date)), [data.transactions, kind, query]);
  const summary = useMemo(() => {
    const current = data.transactions.filter((item) => item.date.startsWith(String(data.meta.activeYear)));
    const income = current.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount, 0);
    const expenses = current.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount, 0);
    return { income, expenses, net: income - expenses };
  }, [data.meta.activeYear, data.transactions]);
  const categoryName = (id: string) => { const item = data.categories.find((candidate) => candidate.id === id); return item ? (language === "it" ? item.nameIt : item.nameEn) : "—"; };
  const methodName = (id: string) => data.paymentMethods.find((item) => item.id === id)?.name ?? "—";
  return <><PageHeader eyebrow={`${data.meta.activeYear}`} title={t("transactions")} subtitle={t("overviewSubtitle")} actionLabel={t("newTransaction")} onAction={() => setOpen(true)} />
    <section className="view-kpi-grid"><KpiCard label={t("yearIncome")} value={formatCurrency(summary.income, language)} icon={ArrowUpRight} tone="mint"/><KpiCard label={t("yearExpenses")} value={formatCurrency(summary.expenses, language)} icon={ArrowDownRight} tone="coral"/><KpiCard label={t("netCashFlow")} value={formatCurrency(summary.net, language)} icon={Scale} tone="blue"/></section>
    <div className="data-toolbar"><div className="search-field"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("filterPlaceholder")} /></div><select style={{ width: 150 }} value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">{t("all")}</option><option value="income">{t("income")}</option><option value="expense">{t("expenses")}</option><option value="transfer">{t("transfer")}</option></select></div>
    <section className="panel table-panel">{rows.length ? <table className="data-table"><thead><tr><th>{t("date")}</th><th>{t("description")}</th><th>{t("category")}</th><th>{t("paymentMethod")}</th><th>{t("amount")}</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td>{formatDate(item.date, language)}</td><td>{item.description}</td><td><span className="pill">{categoryName(item.categoryId)}</span></td><td>{methodName(item.paymentMethodId)}</td><td className={item.kind === "income" ? "amount-income" : item.kind === "expense" ? "amount-expense" : ""}>{item.kind === "income" ? "+" : item.kind === "expense" ? "−" : ""}{formatCurrency(item.amount, language, item.currency)}</td></tr>)}</tbody></table> : <EmptyState title={t("noTransactions")} actionLabel={t("addFirst")} onAction={() => setOpen(true)} />}</section>
    {open && <TransactionForm data={data} onClose={() => setOpen(false)} onSave={onSave} />}
  </>;
}
