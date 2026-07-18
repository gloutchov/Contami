import { ArrowDownRight, ArrowUpRight, Building2, Plus } from "lucide-react";
import { useState } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData } from "../../domain/models";
import { EmptyState } from "../components/EmptyState";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { PropertyEntryForm, PropertyForm } from "../forms/PropertyForms";
import { useI18n } from "../i18n/I18nContext";
import { formatCurrency } from "../utils/format";
import { todayIso } from "../utils/format";
import { runUiAction } from "../utils/save";

export function PropertiesView({ data, onSave }: { data: FinanceData; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n(); const [newOpen, setNewOpen] = useState(false); const [entryProperty, setEntryProperty] = useState<string | undefined>();
  const latestValue = (id: string) => [...data.propertyEntries].filter((item) => item.propertyId === id && item.kind === "valuation").sort((a, b) => b.date.localeCompare(a.date))[0]?.amount;
  const currentEntries = data.propertyEntries.filter((item) => item.date.startsWith(String(data.meta.activeYear)));
  const totalValue = data.properties.filter((item) => item.active).reduce((sum, item) => sum + (latestValue(item.id) ?? item.purchasePrice) * item.ownershipShare, 0);
  const income = currentEntries.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount, 0);
  const costs = currentEntries.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount, 0);
  return <><PageHeader title={t("properties")} subtitle={t("overviewSubtitle")} actionLabel={t("newProperty")} onAction={() => setNewOpen(true)} secondary={<button className="secondary-button" onClick={() => setEntryProperty(data.properties.find((item) => item.active)?.id)} disabled={!data.properties.some((item) => item.active)}><Plus size={16}/>{t("newPropertyEntry")}</button>} />
    <section className="view-kpi-grid"><KpiCard label={t("propertyValue")} value={formatCurrency(totalValue, language)} icon={Building2} tone="gold"/><KpiCard label={t("propertyIncome")} value={formatCurrency(income, language)} icon={ArrowUpRight} tone="mint"/><KpiCard label={t("propertyCosts")} value={formatCurrency(costs, language)} icon={ArrowDownRight} tone="coral"/></section>
    {data.properties.length ? <section className="entity-grid">{data.properties.map((item) => <article className="panel entity-card" key={item.id}><header><div><h3>{item.name}</h3><p className="meta">{t(item.kind)} · {Math.round(item.ownershipShare * 100)}%</p></div><span className="pill">{item.active ? t("active") : t("closed")}</span></header><div className="entity-value">{formatCurrency((latestValue(item.id) ?? item.purchasePrice) * item.ownershipShare, language)}</div><footer><span>{t("currentValue")}</span><div className="entity-actions">{item.active && <button className="text-button" onClick={() => setEntryProperty(item.id)}>{t("newPropertyEntry")}</button>}<button className="text-button" onClick={() => runUiAction(() => onSave({ type: "setActive", entity: "property", id: item.id, active: !item.active, closedAt: item.active ? todayIso() : undefined }))}>{item.active ? t("close") : t("reopen")}</button></div></footer></article>)}</section> : <section className="panel"><EmptyState title={t("noProperties")} actionLabel={t("addFirst")} onAction={() => setNewOpen(true)} /></section>}
    {newOpen && <PropertyForm onClose={() => setNewOpen(false)} onSave={onSave} />}{entryProperty && <PropertyEntryForm data={data} initialPropertyId={entryProperty} onClose={() => setEntryProperty(undefined)} onSave={onSave} />}
  </>;
}
