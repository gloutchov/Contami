import { AlertTriangle, ArrowDownRight, ArrowUpRight, Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData, Property, PropertyEntry } from "../../domain/models";
import { DetailDialog } from "../components/DetailDialog";
import { EmptyState } from "../components/EmptyState";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { PropertyDetail } from "../components/PropertyDetail";
import { PropertyEntryForm, PropertyForm } from "../forms/PropertyForms";
import { useI18n } from "../i18n/I18nContext";
import { formatCurrency, formatDate, todayIso } from "../utils/format";
import { runUiAction } from "../utils/save";

export function PropertiesView({ data, onSave }: { data: FinanceData; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n();
  const [editingProperty, setEditingProperty] = useState<Property | null | undefined>();
  const [editingEntry, setEditingEntry] = useState<PropertyEntry | null | undefined>();
  const [entryPropertyId, setEntryPropertyId] = useState<string>();
  const [selected, setSelected] = useState<Property>();
  const latestValue = (id: string) => [...data.propertyEntries].filter((item) => item.propertyId === id && item.kind === "valuation").sort((a, b) => b.date.localeCompare(a.date))[0]?.amount;
  const currentEntries = data.propertyEntries.filter((item) => item.date.startsWith(String(data.meta.activeYear)));
  const totalValue = data.properties.filter((item) => item.active).reduce((sum, item) => sum + (latestValue(item.id) ?? item.purchasePrice) * item.ownershipShare, 0);
  const income = currentEntries.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount, 0);
  const costs = currentEntries.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount, 0);
  const today = new Date(); const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const rentOverdue = (property: Property) => property.active && property.usage === "rental" && Boolean(property.expectedMonthlyRent) && today.getDate() >= (property.rentDueDay ?? 1) && !data.propertyEntries.some((entry) => entry.propertyId === property.id && entry.kind === "income" && entry.date.startsWith(currentMonth) && !data.transactions.find((transaction) => transaction.id === entry.transactionId)?.planned);
  const commonExpenses = currentEntries.filter((item) => item.kind === "expense" && item.isCommonExpense);
  const remove = (entity: "property" | "propertyEntry", id: string) => { if (window.confirm(t("deleteConfirm"))) runUiAction(() => onSave({ type: "deleteEntity", entity, id })); };
  const openNewEntry = (id: string) => { setEntryPropertyId(id); setEditingEntry(null); };
  return <><PageHeader title={t("properties")} subtitle={t("propertiesSubtitle")} actionLabel={t("newProperty")} onAction={() => setEditingProperty(null)} secondary={<button className="secondary-button" onClick={() => openNewEntry(data.properties.find((item) => item.active)?.id ?? "")} disabled={!data.properties.some((item) => item.active)}><Plus size={16}/>{t("newPropertyEntry")}</button>} />
    <section className="view-kpi-grid"><KpiCard label={t("propertyValue")} value={formatCurrency(totalValue, language)} icon={Building2} tone="gold"/><KpiCard label={t("propertyIncome")} value={formatCurrency(income, language)} icon={ArrowUpRight} tone="mint"/><KpiCard label={t("propertyCosts")} value={formatCurrency(costs, language)} icon={ArrowDownRight} tone="coral"/></section>
    {data.properties.length ? <section className="entity-grid">{data.properties.map((item) => {
      const entries = currentEntries.filter((entry) => entry.propertyId === item.id); const itemIncome = entries.filter((entry) => entry.kind === "income").reduce((sum, entry) => sum + entry.amount, 0); const itemCosts = entries.filter((entry) => entry.kind === "expense").reduce((sum, entry) => sum + entry.amount, 0);
      return <article className="panel entity-card clickable" key={item.id} onClick={() => setSelected(item)}><header><div><h3>{item.name}</h3><p className="meta">{t(item.kind)} · {t(item.usage ?? "other")} · {Math.round(item.ownershipShare * 100)}%</p></div><span className="pill">{item.active ? t("active") : t("closed")}</span></header>{rentOverdue(item) && <div className="warning-line"><AlertTriangle size={15}/>{t("rentOverdue")}</div>}<div className="entity-value">{formatCurrency((latestValue(item.id) ?? item.purchasePrice) * item.ownershipShare, language)}</div><div className="mini-totals"><span>{t("income")} <strong className="amount-income">{formatCurrency(itemIncome, language)}</strong></span><span>{t("expenses")} <strong className="amount-expense">{formatCurrency(itemCosts, language)}</strong></span></div><footer><span>{t("openDetails")}</span><div className="entity-actions" onClick={(event) => event.stopPropagation()}>{item.active && <button className="text-button" onClick={() => openNewEntry(item.id)}>{t("newPropertyEntry")}</button>}<button className="text-button" onClick={() => runUiAction(() => onSave({ type: "setActive", entity: "property", id: item.id, active: !item.active, closedAt: item.active ? todayIso() : undefined }))}>{item.active ? t("close") : t("reopen")}</button><button className="icon-button" aria-label={t("edit")} onClick={() => setEditingProperty(item)}><Pencil size={15}/></button><button className="icon-button danger" aria-label={t("delete")} onClick={() => remove("property", item.id)}><Trash2 size={15}/></button></div></footer></article>;
    })}</section> : <section className="panel"><EmptyState title={t("noProperties")} actionLabel={t("addFirst")} onAction={() => setEditingProperty(null)} /></section>}
    <section className="panel table-panel section-gap"><div className="panel-header"><h2>{t("commonExpenses")}</h2><strong>{formatCurrency(commonExpenses.reduce((sum, item) => sum + item.amount, 0), language)}</strong></div>{commonExpenses.length ? <table className="data-table"><thead><tr><th>{t("date")}</th><th>{t("property")}</th><th>{t("description")}</th><th>{t("amount")}</th></tr></thead><tbody>{commonExpenses.map((item) => <tr key={item.id}><td>{formatDate(item.date, language)}</td><td>{data.properties.find((property) => property.id === item.propertyId)?.name}</td><td>{item.description}</td><td>{formatCurrency(item.amount, language)}</td></tr>)}</tbody></table> : <p className="empty-inline">{t("noCommonExpenses")}</p>}</section>
    {selected && <DetailDialog title={selected.name} onClose={() => setSelected(undefined)} actions={<><button className="secondary-button" onClick={() => { setEditingProperty(selected); setSelected(undefined); }}>{t("editProperty")}</button><button className="primary-button" onClick={() => { openNewEntry(selected.id); setSelected(undefined); }}>{t("newPropertyEntry")}</button></>}>
      <PropertyDetail data={data} property={selected} onEditEntry={(item) => { setEditingEntry(item); setEntryPropertyId(item.propertyId); setSelected(undefined); }} onDeleteEntry={(id) => remove("propertyEntry", id)} />
    </DetailDialog>}
    {editingProperty !== undefined && <PropertyForm value={editingProperty ?? undefined} onClose={() => setEditingProperty(undefined)} onSave={onSave} />}
    {editingEntry !== undefined && <PropertyEntryForm data={data} value={editingEntry ?? undefined} initialPropertyId={entryPropertyId} onClose={() => { setEditingEntry(undefined); setEntryPropertyId(undefined); }} onSave={onSave} />}
  </>;
}
