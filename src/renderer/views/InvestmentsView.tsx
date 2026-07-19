import { ArrowDownRight, ArrowUpRight, Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { FinanceCommand } from "../../domain/commands";
import { investmentChildren, investmentPositionValue, latestInvestmentValue, regularInvestments } from "../../domain/investments";
import type { FinanceData, Investment, InvestmentEntry } from "../../domain/models";
import { DetailDialog } from "../components/DetailDialog";
import { EmptyState } from "../components/EmptyState";
import { HistoryChart } from "../components/HistoryChart";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { InvestmentEntryForm, InvestmentForm } from "../forms/InvestmentForms";
import { useI18n } from "../i18n/I18nContext";
import { formatCurrency, formatDate, todayIso } from "../utils/format";
import { investmentValueTimeline } from "../utils/investmentHistory";
import { runUiAction } from "../utils/save";

export function InvestmentsView({ data, onSave }: { data: FinanceData; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n();
  const [editingInvestment, setEditingInvestment] = useState<Investment | null | undefined>();
  const [editingEntry, setEditingEntry] = useState<InvestmentEntry | null | undefined>();
  const [entryInvestmentId, setEntryInvestmentId] = useState<string>(); const [entryKind, setEntryKind] = useState<InvestmentEntry["kind"]>("contribution");
  const [selected, setSelected] = useState<Investment>();
  const regular = regularInvestments(data);
  const regularIds = new Set(regular.map((item) => item.id));
  const childrenOf = (item: Investment) => investmentChildren(data, item.id).filter((child) => regularIds.has(child.id));
  const valueOf = (item: Investment) => investmentPositionValue(data, item);
  const leaves = regular.filter((item) => item.active && !childrenOf(item).length);
  const totalValue = leaves.reduce((sum, item) => sum + latestInvestmentValue(data, item.id), 0);
  const currentEntries = data.investmentEntries.filter((item) => regularIds.has(item.investmentId) && item.date.startsWith(String(data.meta.activeYear)));
  const contributions = currentEntries.filter((item) => item.kind === "contribution").reduce((sum, item) => sum + item.amount, 0);
  const withdrawals = currentEntries.filter((item) => item.kind === "withdrawal").reduce((sum, item) => sum + item.amount, 0);
  const typeName = (item: Investment) => { const type = data.investmentTypes.find((candidate) => candidate.id === item.typeId); return type ? (language === "it" ? type.nameIt : type.nameEn) : t(item.kind); };
  const groups = data.investmentTypes.map((type) => ({ type, items: regular.filter((item) => item.typeId === type.id && !item.parentInvestmentId) })).filter((group) => group.items.length);
  const untyped = regular.filter((item) => !item.parentInvestmentId && !data.investmentTypes.some((type) => type.id === item.typeId));
  if (untyped.length) groups.push({ type: { id: "00000000-0000-4000-8000-000000000000", nameIt: "Altro", nameEn: "Other", code: "other", active: true }, items: untyped });
  const remove = (entity: "investment" | "investmentEntry", id: string) => { if (window.confirm(t("deleteConfirm"))) runUiAction(() => onSave({ type: "deleteEntity", entity, id })); };
  const openEntry = (id: string, kind: InvestmentEntry["kind"] = "contribution") => { setEntryInvestmentId(id); setEntryKind(kind); setEditingEntry(null); };
  const selectedEntries = useMemo(() => selected ? data.investmentEntries.filter((item) => item.investmentId === selected.id).sort((a, b) => b.date.localeCompare(a.date)) : [], [data.investmentEntries, selected]);
  const selectedHistory = useMemo(() => selected ? investmentValueTimeline(data, selected.id) : [], [data, selected]);
  const selectedHasChildren = Boolean(selected && childrenOf(selected).length);
  const firstActiveLeafId = leaves[0]?.id ?? "";
  const investmentCard = (item: Investment, parent?: Investment) => {
    const children = childrenOf(item);
    return <article className={`panel entity-card clickable${parent ? " component-card" : ""}`} key={item.id} onClick={() => setSelected(item)}><header><div><h3>{item.name}</h3><p className="meta">{typeName(item)}{parent ? ` · ${t("investmentGroup")}: ${parent.name}` : item.provider ? ` · ${item.provider}` : ""}</p></div><span className="pill">{item.active ? t("active") : t("closed")}</span></header><div className="entity-value">{formatCurrency(valueOf(item), language, item.currency)}</div><footer><span>{children.length ? t("groupTotal") : t("openDetails")}</span><div className="entity-actions" onClick={(event) => event.stopPropagation()}>{item.active && !children.length && <button className="text-button" onClick={() => openEntry(item.id)}>{t("newInvestmentEntry")}</button>}<button className="text-button" onClick={() => runUiAction(() => onSave({ type: "setActive", entity: "investment", id: item.id, active: !item.active, closedAt: item.active ? todayIso() : undefined }))}>{item.active ? t("close") : t("reopen")}</button><button className="icon-button" aria-label={t("edit")} onClick={() => setEditingInvestment(item)}><Pencil size={15}/></button><button className="icon-button danger" aria-label={t("delete")} onClick={() => remove("investment", item.id)}><Trash2 size={15}/></button></div></footer></article>;
  };
  return <><PageHeader title={t("investments")} subtitle={t("investmentsSubtitle")} actionLabel={t("newInvestment")} onAction={() => setEditingInvestment(null)} secondary={<div className="page-actions"><button className="secondary-button" onClick={() => openEntry(firstActiveLeafId)} disabled={!firstActiveLeafId}><Plus size={16}/>{t("newInvestmentEntry")}</button><button className="secondary-button" onClick={() => openEntry(firstActiveLeafId, "valuation")} disabled={!firstActiveLeafId}>{t("newValuation")}</button></div>} />
    <section className="view-kpi-grid"><KpiCard label={t("investmentValue")} value={formatCurrency(totalValue, language)} icon={Landmark} tone="blue"/><KpiCard label={t("totalContributions")} value={formatCurrency(contributions, language)} icon={ArrowUpRight} tone="mint"/><KpiCard label={t("totalWithdrawals")} value={formatCurrency(withdrawals, language)} icon={ArrowDownRight} tone="coral"/></section>
    <section className="type-totals">{groups.map((group) => <span key={group.type.id}><small>{language === "it" ? group.type.nameIt : group.type.nameEn}</small><strong>{formatCurrency(group.items.reduce((sum, item) => sum + valueOf(item), 0), language)}</strong></span>)}</section>
    {regular.length ? groups.map((group) => <section className="investment-group" key={group.type.id}><div className="section-heading"><h2>{language === "it" ? group.type.nameIt : group.type.nameEn}</h2><strong>{formatCurrency(group.items.reduce((sum, item) => sum + valueOf(item), 0), language)}</strong></div><div className="entity-grid">{group.items.flatMap((item) => [item, ...childrenOf(item)]).map((item) => investmentCard(item, item.parentInvestmentId ? regular.find((parent) => parent.id === item.parentInvestmentId) : undefined))}</div></section>) : <section className="panel"><EmptyState title={t("noInvestments")} actionLabel={t("addFirst")} onAction={() => setEditingInvestment(null)} /></section>}
    {selected && <DetailDialog title={selected.name} onClose={() => setSelected(undefined)} actions={<><button className="secondary-button" onClick={() => { setEditingInvestment(selected); setSelected(undefined); }}>{t("editInvestment")}</button>{!selectedHasChildren && <button className="primary-button" onClick={() => { openEntry(selected.id); setSelected(undefined); }}>{t("newInvestmentEntry")}</button>}</>}><div className="detail-facts"><span><small>{t("type")}</small><strong>{typeName(selected)}</strong></span><span><small>{t("provider")}</small><strong>{selected.provider || "—"}</strong></span><span><small>{t("currentValue")}</small><strong>{formatCurrency(valueOf(selected), language)}</strong></span><span><small>{t("periodicContribution")}</small><strong>{selected.periodicAmount ? formatCurrency(selected.periodicAmount, language) : "—"}</strong></span></div><section className="detail-history-section"><h3>{t("investmentValueHistory")}</h3><HistoryChart ariaLabel={t("investmentValueHistory")} data={selectedHistory.map((item) => ({ date: item.date, investedValue: item.investedValue, closingValue: item.closingValue }))} xKey="date" xTickFormatter={(value) => formatDate(String(value), language)} series={[{ key: "investedValue", label: t("investedAmount"), color: "#4e94a7" }, { key: "closingValue", label: t("countervalue"), color: "#72d5b0" }]} format={(value) => formatCurrency(value, language)} />{!selectedHistory.length && <p className="empty-inline">{t("noInvestmentHistory")}</p>}</section><div className="detail-table"><table className="data-table"><thead><tr><th>{t("date")}</th><th>{t("type")}</th><th>{t("description")}</th><th>{t("amount")}</th><th /></tr></thead><tbody>{selectedEntries.map((item) => <tr key={item.id}><td>{formatDate(item.date, language)}</td><td><span className="pill">{item.kind === "withdrawal" ? t("liquidation") : t(item.kind)}</span></td><td>{item.description}</td><td>{formatCurrency(item.amount, language)}</td><td><div className="row-actions"><button className="icon-button" onClick={() => { setEditingEntry(item); setEntryInvestmentId(item.investmentId); setSelected(undefined); }} aria-label={t("edit")}><Pencil size={14}/></button><button className="icon-button danger" onClick={() => remove("investmentEntry", item.id)} aria-label={t("delete")}><Trash2 size={14}/></button></div></td></tr>)}</tbody></table></div></DetailDialog>}
    {editingInvestment !== undefined && <InvestmentForm data={data} value={editingInvestment ?? undefined} onClose={() => setEditingInvestment(undefined)} onSave={onSave} />}
    {editingEntry !== undefined && <InvestmentEntryForm data={data} value={editingEntry ?? undefined} initialInvestmentId={entryInvestmentId} initialKind={entryKind} allowedInvestmentIds={leaves.map((item) => item.id)} onClose={() => { setEditingEntry(undefined); setEntryInvestmentId(undefined); }} onSave={onSave} />}
  </>;
}
