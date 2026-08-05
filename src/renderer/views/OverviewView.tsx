import { ArrowDownRight, ArrowUpRight, Banknote, Building2, CalendarClock, Landmark, PiggyBank, ShieldCheck, UsersRound, WalletCards } from "lucide-react";
import { useId } from "react";
import type { FinanceSnapshot } from "../../shared/contracts";
import { HistoryChart } from "../components/HistoryChart";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { useI18n } from "../i18n/I18nContext";
import { formatCurrency, formatDate, todayIso } from "../utils/format";
import { recentRecurringExpensesAsOf, recentTransactionsAsOf } from "../utils/overviewTransactions";

export function OverviewView({ snapshot, onCreate, onOpen }: { snapshot: FinanceSnapshot; onCreate: () => void; onOpen: () => void }) {
  const { t, language } = useI18n();
  const categoryGradientId = useId().replaceAll(":", "");
  const { metrics, data } = snapshot;
  const categoriesMax = metrics.categories[0]?.amount ?? 1;
  const months = metrics.months.map((item) => ({ ...item, label: new Intl.DateTimeFormat(language === "it" ? "it-IT" : "en-GB", { month: "short" }).format(new Date(`${item.month}-01T12:00:00Z`)) }));
  const today = todayIso();
  const recent = recentTransactionsAsOf(data.transactions, today);
  const recentRecurringExpenses = recentRecurringExpensesAsOf(data.transactions, data.recurringItems, today);
  const history = metrics.history.map((item) => ({ ...item, year: String(item.year) }));
  const categoryName = (id: string) => { const item = data.categories.find((candidate) => candidate.id === id); return item ? (language === "it" ? item.nameIt : item.nameEn) : "—"; };
  return <>
    <PageHeader eyebrow={`${data.meta.activeYear}`} title={`${t("hello")} 👋`} subtitle={t("overviewSubtitle")} />
    {!snapshot.workbookConfigured && <section className="setup-banner"><div><h2>{t("setupTitle")}</h2><p>{t("setupBody")}</p></div><div className="actions"><button className="secondary-button" onClick={onOpen}>{t("openWorkbook")}</button><button className="primary-button" onClick={onCreate}>{t("createWorkbook")}</button></div></section>}
    <section className="kpi-grid">
      <KpiCard label={t("netWorth")} value={formatCurrency(metrics.netWorth, language)} icon={PiggyBank} tone="mint" />
      <KpiCard label={t("liquidity")} value={formatCurrency(metrics.liquidBalance, language)} icon={WalletCards} tone="blue" />
      <KpiCard label={t("cashRegisterBalance")} value={formatCurrency(metrics.cashRegisterBalance, language)} icon={Banknote} tone="gold" />
      <KpiCard label={t("propertyValue")} value={formatCurrency(metrics.propertyValue, language)} icon={Building2} tone="gold" detail={`${t("income")}: ${formatCurrency(metrics.propertyIncome, language)} · ${t("expenses")}: ${formatCurrency(metrics.propertyExpenses, language)}`} />
      <KpiCard label={t("investmentValue")} value={formatCurrency(metrics.investmentValue, language)} icon={Landmark} tone="mint" />
      <KpiCard label={t("pensionValue")} value={formatCurrency(metrics.pensionValue, language)} icon={ShieldCheck} tone="gold" />
      <KpiCard label={t("yearIncome")} value={formatCurrency(metrics.yearIncome, language)} icon={ArrowUpRight} tone="mint" />
      <KpiCard label={t("yearExpenses")} value={formatCurrency(metrics.yearExpenses, language)} icon={ArrowDownRight} tone="coral" />
      <KpiCard label={t("monthlyRecurring")} value={formatCurrency(metrics.monthlyRecurring, language)} icon={CalendarClock} tone="gold" />
      <KpiCard label={t("sharedBalance")} value={formatCurrency(metrics.sharedBalance, language)} icon={UsersRound} tone="blue" />
    </section>
    <section className="history-grid">
      <article className="panel history-wide"><div className="panel-header"><h2>{t("wealthHistory")}</h2></div><HistoryChart ariaLabel={t("wealthHistory")} data={history} detail={false} showPoints={false} series={[{ key: "netWorth", label: t("netWorth"), color: "var(--chart-net-worth)", strokeWidth: 3 }, { key: "liquidBalance", label: t("liquidity"), color: "#4e94a7", strokeWidth: 2 }, { key: "propertyValue", label: t("propertyValue"), color: "#ffb842", strokeWidth: 2 }, { key: "investmentValue", label: t("financialAssetsHistory"), color: "#45b98d", strokeWidth: 2 }]} format={(value) => formatCurrency(value, language)} /></article>
      <article className="panel"><div className="panel-header"><h2>{t("incomeExpenseHistory")}</h2></div><HistoryChart ariaLabel={t("incomeExpenseHistory")} data={history} detail={false} type="bar" series={[{ key: "income", label: t("income"), color: "#72d5b0" }, { key: "expenses", label: t("expenses"), color: "#f48572" }]} format={(value) => formatCurrency(value, language)} /></article>
      <article className="panel"><div className="panel-header"><h2>{t("commitmentHistory")}</h2></div><HistoryChart ariaLabel={t("commitmentHistory")} data={history} detail={false} showLegend={false} series={[{ key: "monthlyRecurring", label: t("monthlyRecurring"), color: "#ffb842", strokeWidth: 3 }]} format={(value) => formatCurrency(value, language)} /></article>
    </section>
    <section className="dashboard-grid">
      <article className="panel"><div className="panel-header"><h2>{t("cashFlow")}</h2><div className="legend"><span><i className="legend-dot legend-dot-income" />{t("income")}</span><span><i className="legend-dot legend-dot-expense" />{t("expenses")}</span></div></div><div className="chart-wrap"><HistoryChart ariaLabel={t("cashFlow")} data={months} detail={false} showLegend={false} type="area" xKey="label" series={[{ key: "income", label: t("income"), color: "#45b98d", areaColor: "#72d5b0", areaOpacity: 0.35 }, { key: "expenses", label: t("expenses"), color: "#f48572", areaOpacity: 0.25 }]} format={(value) => formatCurrency(value, language)} /></div></article>
      <article className="panel"><div className="panel-header"><h2>{t("spendingByCategory")}</h2></div>{metrics.categories.length ? <div className="category-bars">{metrics.categories.map((item, index) => { const percentage = categoriesMax > 0 ? Math.min(100, Math.max(5, item.amount / categoriesMax * 100)) : 5; const gradientId = `${categoryGradientId}-category-${index}`; return <div className="category-row" key={item.id}><div><span>{language === "it" ? item.nameIt : item.nameEn}</span><strong>{formatCurrency(item.amount, language)}</strong></div><div className="bar-track"><svg key={`${item.id}-${item.amount}`} viewBox="0 0 100 7" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="var(--mint)" /><stop offset="1" stopColor="var(--navy-2)" /></linearGradient></defs><rect className="category-bar-fill" fill={`url(#${gradientId})`} height="7" rx="3.5" width={percentage} /></svg></div></div>; })}</div> : <p className="empty-state">{t("noData")}</p>}</article>
    </section>
    <section className="panel table-panel section-gap"><div className="panel-header"><h2>{t("recentTransactions")}</h2></div>{recent.length ? <table className="data-table"><thead><tr><th>{t("date")}</th><th>{t("description")}</th><th>{t("category")}</th><th>{t("amount")}</th></tr></thead><tbody>{recent.map((item) => <tr key={item.id}><td>{formatDate(item.date, language)}</td><td>{item.description}</td><td><span className="pill">{categoryName(item.categoryId)}</span></td><td className={item.kind === "income" ? "amount-income" : "amount-expense"}>{item.kind === "income" ? "+" : "−"}{formatCurrency(item.amount, language)}</td></tr>)}</tbody></table> : <p className="empty-inline">{t("noRecentTransactions")}</p>}</section>
    <section className="panel table-panel section-gap"><div className="panel-header"><h2>{t("recentRecurringExpenses")}</h2></div>{recentRecurringExpenses.length ? <table className="data-table"><thead><tr><th>{t("date")}</th><th>{t("description")}</th><th>{t("category")}</th><th>{t("amount")}</th></tr></thead><tbody>{recentRecurringExpenses.map((item) => <tr className="recurring-row" key={item.id}><td>{formatDate(item.date, language)}</td><td>{item.description}<span className="pill recurring-badge">{t("recurringBadge")}</span></td><td><span className="pill">{categoryName(item.categoryId)}</span></td><td className="amount-expense">−{formatCurrency(item.amount, language)}</td></tr>)}</tbody></table> : <p className="empty-inline">{t("noRecentRecurringExpenses")}</p>}</section>
  </>;
}
