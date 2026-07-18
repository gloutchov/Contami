import { ArrowDownRight, ArrowUpRight, Building2, CalendarClock, Landmark, PiggyBank, UsersRound, WalletCards } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FinanceSnapshot } from "../../shared/contracts";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { useI18n } from "../i18n/I18nContext";
import { formatCurrency, formatDate } from "../utils/format";

export function OverviewView({ snapshot, onCreate, onOpen }: { snapshot: FinanceSnapshot; onCreate: () => void; onOpen: () => void }) {
  const { t, language } = useI18n();
  const { metrics, data } = snapshot;
  const categoriesMax = metrics.categories[0]?.amount ?? 1;
  const months = metrics.months.map((item) => ({ ...item, label: new Intl.DateTimeFormat(language === "it" ? "it-IT" : "en-GB", { month: "short" }).format(new Date(`${item.month}-01T12:00:00Z`)) }));
  const recent = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const categoryName = (id: string) => { const item = data.categories.find((candidate) => candidate.id === id); return item ? (language === "it" ? item.nameIt : item.nameEn) : "—"; };
  return <>
    <PageHeader eyebrow={`${data.meta.activeYear}`} title={`${t("hello")} 👋`} subtitle={t("overviewSubtitle")} />
    {!snapshot.workbookConfigured && <section className="setup-banner"><div><h2>{t("setupTitle")}</h2><p>{t("setupBody")}</p></div><div className="actions"><button className="secondary-button" onClick={onOpen}>{t("openWorkbook")}</button><button className="primary-button" onClick={onCreate}>{t("createWorkbook")}</button></div></section>}
    <section className="kpi-grid">
      <KpiCard label={t("netWorth")} value={formatCurrency(metrics.netWorth, language)} icon={PiggyBank} tone="mint" />
      <KpiCard label={t("liquidity")} value={formatCurrency(metrics.liquidBalance, language)} icon={WalletCards} tone="blue" />
      <KpiCard label={t("propertyValue")} value={formatCurrency(metrics.propertyValue, language)} icon={Building2} tone="gold" />
      <KpiCard label={t("investmentValue")} value={formatCurrency(metrics.investmentValue, language)} icon={Landmark} tone="mint" />
      <KpiCard label={t("yearIncome")} value={formatCurrency(metrics.yearIncome, language)} icon={ArrowUpRight} tone="mint" />
      <KpiCard label={t("yearExpenses")} value={formatCurrency(metrics.yearExpenses, language)} icon={ArrowDownRight} tone="coral" />
      <KpiCard label={t("monthlyRecurring")} value={formatCurrency(metrics.monthlyRecurring, language)} icon={CalendarClock} tone="gold" />
      <KpiCard label={t("sharedBalance")} value={formatCurrency(metrics.sharedBalance, language)} icon={UsersRound} tone="blue" />
    </section>
    <section className="dashboard-grid">
      <article className="panel"><div className="panel-header"><h2>{t("cashFlow")}</h2><div className="legend"><span><i style={{ background: "#72d5b0" }} />{t("income")}</span><span><i style={{ background: "#f48572" }} />{t("expenses")}</span></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={months} margin={{ top: 15, right: 15, bottom: 0, left: 0 }}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#72d5b0" stopOpacity={0.35}/><stop offset="95%" stopColor="#72d5b0" stopOpacity={0}/></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f48572" stopOpacity={0.25}/><stop offset="95%" stopColor="#f48572" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)"/><XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 10 }} axisLine={false} tickLine={false}/><YAxis tick={{ fill: "var(--muted)", fontSize: 9 }} axisLine={false} tickLine={false} width={45}/><Tooltip formatter={(value) => formatCurrency(Number(value), language)} contentStyle={{ background: "var(--surface-solid)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 11 }}/><Area type="monotone" dataKey="income" stroke="#45b98d" fill="url(#incomeFill)" strokeWidth={2.5}/><Area type="monotone" dataKey="expenses" stroke="#f48572" fill="url(#expenseFill)" strokeWidth={2.5}/></AreaChart></ResponsiveContainer></div></article>
      <article className="panel"><div className="panel-header"><h2>{t("spendingByCategory")}</h2></div>{metrics.categories.length ? <div className="category-bars">{metrics.categories.map((item) => <div className="category-row" key={item.id}><div><span>{language === "it" ? item.nameIt : item.nameEn}</span><strong>{formatCurrency(item.amount, language)}</strong></div><div className="bar-track"><span style={{ width: `${Math.max(5, item.amount / categoriesMax * 100)}%` }} /></div></div>)}</div> : <p className="empty-state">{t("noData")}</p>}</article>
    </section>
    {recent.length > 0 && <section className="panel table-panel" style={{ marginTop: 18 }}><div className="panel-header"><h2>{t("recentTransactions")}</h2></div><table className="data-table"><thead><tr><th>{t("date")}</th><th>{t("description")}</th><th>{t("category")}</th><th>{t("amount")}</th></tr></thead><tbody>{recent.map((item) => <tr key={item.id}><td>{formatDate(item.date, language)}</td><td>{item.description}</td><td><span className="pill">{categoryName(item.categoryId)}</span></td><td className={item.kind === "income" ? "amount-income" : "amount-expense"}>{item.kind === "income" ? "+" : "−"}{formatCurrency(item.amount, language)}</td></tr>)}</tbody></table></section>}
  </>;
}
