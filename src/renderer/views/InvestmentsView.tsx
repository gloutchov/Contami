import { ArrowDownRight, ArrowUpRight, Landmark, Plus } from "lucide-react";
import { useState } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData } from "../../domain/models";
import { EmptyState } from "../components/EmptyState";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { InvestmentEntryForm, InvestmentForm } from "../forms/InvestmentForms";
import { useI18n } from "../i18n/I18nContext";
import { formatCurrency, todayIso } from "../utils/format";
import { runUiAction } from "../utils/save";

export function InvestmentsView({ data, onSave }: { data: FinanceData; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n(); const [newOpen, setNewOpen] = useState(false); const [entryInvestment, setEntryInvestment] = useState<string | undefined>();
  const latestValue = (id: string) => [...data.investmentEntries].filter((item) => item.investmentId === id && item.kind === "valuation").sort((a, b) => b.date.localeCompare(a.date))[0]?.amount ?? 0;
  const totalValue = data.investments.filter((item) => item.active).reduce((sum, item) => sum + latestValue(item.id), 0);
  const currentEntries = data.investmentEntries.filter((item) => item.date.startsWith(String(data.meta.activeYear)));
  const contributions = currentEntries.filter((item) => item.kind === "contribution").reduce((sum, item) => sum + item.amount, 0);
  const withdrawals = currentEntries.filter((item) => item.kind === "withdrawal").reduce((sum, item) => sum + item.amount, 0);
  return <><PageHeader title={t("investments")} subtitle={t("overviewSubtitle")} actionLabel={t("newInvestment")} onAction={() => setNewOpen(true)} secondary={<button className="secondary-button" onClick={() => setEntryInvestment(data.investments.find((item) => item.active)?.id)} disabled={!data.investments.some((item) => item.active)}><Plus size={16}/>{t("newInvestmentEntry")}</button>} />
    <section className="view-kpi-grid"><KpiCard label={t("investmentValue")} value={formatCurrency(totalValue, language)} icon={Landmark} tone="blue"/><KpiCard label={t("totalContributions")} value={formatCurrency(contributions, language)} icon={ArrowUpRight} tone="mint"/><KpiCard label={t("totalWithdrawals")} value={formatCurrency(withdrawals, language)} icon={ArrowDownRight} tone="coral"/></section>
    {data.investments.length ? <section className="entity-grid">{data.investments.map((item) => <article className="panel entity-card" key={item.id}><header><div><h3>{item.name}</h3><p className="meta">{t(item.kind)}{item.provider ? ` · ${item.provider}` : ""}</p></div><span className="pill">{item.active ? t("active") : t("closed")}</span></header><div className="entity-value">{formatCurrency(latestValue(item.id), language, item.currency)}</div><footer><span>{t("currentValue")}</span><div className="entity-actions">{item.active && <button className="text-button" onClick={() => setEntryInvestment(item.id)}>{t("newInvestmentEntry")}</button>}<button className="text-button" onClick={() => runUiAction(() => onSave({ type: "setActive", entity: "investment", id: item.id, active: !item.active, closedAt: item.active ? todayIso() : undefined }))}>{item.active ? t("close") : t("reopen")}</button></div></footer></article>)}</section> : <section className="panel"><EmptyState title={t("noInvestments")} actionLabel={t("addFirst")} onAction={() => setNewOpen(true)} /></section>}
    {newOpen && <InvestmentForm onClose={() => setNewOpen(false)} onSave={onSave} />}{entryInvestment && <InvestmentEntryForm data={data} initialInvestmentId={entryInvestment} onClose={() => setEntryInvestment(undefined)} onSave={onSave} />}
  </>;
}
