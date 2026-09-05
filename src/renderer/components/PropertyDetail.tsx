import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { rentalPropertyReturnSeries } from "../../domain/assetReturns";
import type { FinanceData, Property, PropertyEntry } from "../../domain/models";
import { rentInstallmentsForProperty, type RentInstallmentStatus } from "../../domain/rent";
import { formatCurrency, formatDate, todayIso } from "../utils/format";
import { filterPropertyEntries, propertyCashFlowTimeline, propertyHistory, propertyValueTimeline } from "../utils/propertyHistory";
import { summarizeResidenceEntries } from "../utils/propertyIndicators";
import { useI18n } from "../i18n/I18nContext";
import { EntryFilters } from "./EntryFilters";
import { HistoryChart } from "./HistoryChart";
import { ReturnChart } from "./ReturnChart";
import { TrendBars } from "./TrendBars";

export function PropertyDetail({
  data,
  property,
  onEditEntry,
  onDeleteEntry,
}: {
  data: FinanceData;
  property: Property;
  onEditEntry: (entry: PropertyEntry) => void;
  onDeleteEntry: (id: string) => void;
}) {
  const { t, language } = useI18n();
  const [month, setMonth] = useState("");
  const [search, setSearch] = useState("");
  const entries = useMemo(() => data.propertyEntries
    .filter((item) => item.propertyId === property.id
      && !data.transactions.find((transaction) => transaction.id === item.transactionId)?.planned)
    .sort((a, b) => b.date.localeCompare(a.date)), [data.propertyEntries, data.transactions, property.id]);
  const filtered = useMemo(() => filterPropertyEntries(entries, month, search), [entries, month, search]);
  const rentInstallments = useMemo(() => rentInstallmentsForProperty(data, property.id, todayIso()), [data, property.id]);
  const history = useMemo(() => propertyHistory(data, property.id), [data, property.id]);
  const valueTimeline = useMemo(() => propertyValueTimeline(data, property.id), [data, property.id]);
  const cashFlowTimeline = useMemo(() => propertyCashFlowTimeline(data, property.id), [data, property.id]);
  const returns = useMemo(() => rentalPropertyReturnSeries(data, property.id, todayIso()), [data, property.id]);
  const currentIndicators = summarizeResidenceEntries(entries, data.meta.activeYear);
  const filteredIncome = filtered.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount, 0);
  const filteredExpenses = filtered.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount, 0);
  const current = history.find((item) => item.year === data.meta.activeYear);
  const commercialValue = valueTimeline.at(-1)?.commercialValue ?? property.purchasePrice;
  const rentStatusLabel = (status: RentInstallmentStatus) => t(status === "paid" ? "rentPaid"
    : status === "paidLate" ? "rentPaidLate"
      : status === "overdue" ? "rentInstallmentOverdue"
        : status === "scheduled" ? "rentScheduled"
          : "rentCompetenceUnassigned");
  const filterControls = <EntryFilters
    activeYear={data.meta.activeYear}
    search={search}
    month={month}
    onSearchChange={setSearch}
    onMonthChange={setMonth}
    summary={<><span>{t("filteredIncome")} <strong>{formatCurrency(filteredIncome, language)}</strong></span><span>{t("filteredExpenses")} <strong>{formatCurrency(filteredExpenses, language)}</strong></span></>}
  />;
  const entriesTable = <div className="detail-table"><table className="data-table"><thead><tr><th>{t("date")}</th><th>{t("type")}</th><th>{t("description")}</th><th>{t("amount")}</th><th /></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td>{formatDate(item.date, language)}</td><td><span className="pill">{t(item.kind)}</span></td><td>{item.description}</td><td>{formatCurrency(item.amount, language)}</td><td><div className="row-actions"><button className="icon-button" aria-label={t("edit")} onClick={() => onEditEntry(item)}><Pencil size={14}/></button><button className="icon-button danger" aria-label={t("delete")} onClick={() => onDeleteEntry(item.id)}><Trash2 size={14}/></button></div></td></tr>)}</tbody></table>{!filtered.length && <p className="empty-inline">{t("noFilteredPropertyEntries")}</p>}</div>;
  const charts = <>
    {property.usage === "residence" && <>
      <section className="utility-history"><h3>{t("utilityHistory")}</h3>{history.some((item) => item.electricityKwh || item.gasCubicMeters || item.waterCubicMeters) ? <div className="utility-charts"><article><strong>{t("electricityKwh")}</strong><TrendBars points={history.map((item) => ({ year: item.year, value: item.electricityKwh }))} format={(value) => `${Math.round(value)} kWh`} /></article><article><strong>{t("gasCubicMeters")}</strong><TrendBars points={history.map((item) => ({ year: item.year, value: item.gasCubicMeters }))} format={(value) => `${Math.round(value)} m³`} /></article><article><strong>{t("waterCubicMeters")}</strong><TrendBars points={history.map((item) => ({ year: item.year, value: item.waterCubicMeters }))} format={(value) => `${Math.round(value)} m³`} /></article></div> : <p className="empty-inline">{t("noConsumptionHistory")}</p>}</section>
      <section className="detail-history-section"><h3>{t("utilityCostHistory")}</h3><div className="utility-charts utility-cost-charts"><article><strong>{t("electricityCost")}</strong><TrendBars points={history.map((item) => ({ year: item.year, value: item.electricityCost }))} format={(value) => formatCurrency(value, language)} /></article><article><strong>{t("gasCost")}</strong><TrendBars points={history.map((item) => ({ year: item.year, value: item.gasCost }))} format={(value) => formatCurrency(value, language)} /></article><article><strong>{t("waterCost")}</strong><TrendBars points={history.map((item) => ({ year: item.year, value: item.waterCost }))} format={(value) => formatCurrency(value, language)} /></article><article><strong>{t("phoneInternet")}</strong><TrendBars points={history.map((item) => ({ year: item.year, value: item.phoneInternetCost }))} format={(value) => formatCurrency(value, language)} /></article><article><strong>{t("condominium")}</strong><TrendBars points={history.map((item) => ({ year: item.year, value: item.condominiumCost }))} format={(value) => formatCurrency(value, language)} /></article></div></section>
    </>}

    {property.usage === "rental" && <>
      <section className="detail-history-section"><h3>{t("propertyIncomeExpenseHistory")}</h3><HistoryChart ariaLabel={t("propertyIncomeExpenseHistory")} type="bar" data={cashFlowTimeline} xKey="date" xTickFormatter={(value) => formatDate(String(value), language)} series={[{ key: "income", label: t("income"), color: "#72d5b0" }, { key: "expenses", label: t("expenses"), color: "#f48572" }]} format={(value) => formatCurrency(value, language)} /></section>
    </>}

    <section className="detail-history-section"><h3>{t("commercialValueHistory")}</h3><HistoryChart ariaLabel={t("commercialValueHistory")} data={valueTimeline.map((item) => ({ ...item, commercialValue: item.commercialValue * property.ownershipShare }))} xKey="date" xTickFormatter={(value) => formatDate(String(value), language)} series={[{ key: "commercialValue", label: t("commercialValue"), color: "#ffb842" }]} format={(value) => formatCurrency(value, language)} /></section>
    {property.usage === "rental" && <section className="detail-history-section"><h3>{t("monthlyReturnHistory")}</h3><ReturnChart period="monthly" series={returns} /></section>}
  </>;

  return <>
    {charts}

    <div className="detail-facts"><span><small>{t("address")}</small><strong>{property.address || "—"}</strong></span><span><small>{t("areaSqm")}</small><strong>{property.areaSqm ? `${property.areaSqm} m²` : "—"}</strong></span><span><small>{t("cadastralValue")}</small><strong>{property.cadastralValue !== undefined ? formatCurrency(property.cadastralValue, language) : "—"}</strong></span><span><small>{t("ownership")}</small><strong>{Math.round(property.ownershipShare * 100)}%</strong></span></div>

    {property.usage === "residence" && <>
      <div className="consumption-grid residence-summary-grid">
        <span>{t("electricityKwh")}<strong>{Math.round(currentIndicators.electricity).toLocaleString(language)}</strong></span>
        <span>{t("electricityCost")}<strong>{formatCurrency(currentIndicators.electricityCost, language)}</strong></span>
        <span>{t("gasCubicMeters")}<strong>{Math.round(currentIndicators.gas).toLocaleString(language)}</strong></span>
        <span>{t("gasCost")}<strong>{formatCurrency(currentIndicators.gasCost, language)}</strong></span>
        <span>{t("waterCubicMeters")}<strong>{Math.round(currentIndicators.water).toLocaleString(language)}</strong></span>
        <span>{t("waterCost")}<strong>{formatCurrency(currentIndicators.waterCost, language)}</strong></span>
        <span>{t("condominium")}<strong>{formatCurrency(currentIndicators.condominium, language)}</strong></span>
        <span>{t("phoneInternet")}<strong>{formatCurrency(currentIndicators.phoneInternet, language)}</strong></span>
        <span>{t("tvLicence")}<strong>{formatCurrency(currentIndicators.tvLicence, language)}</strong></span>
      </div>
    </>}

    {property.usage === "rental" && <>
      <div className="type-totals property-detail-totals"><span><small>{t("commercialValue")}</small><strong>{formatCurrency(commercialValue * property.ownershipShare, language)}</strong></span><span><small>{t("income")}</small><strong>{formatCurrency(current?.income ?? 0, language)}</strong></span><span><small>{t("expenses")}</small><strong>{formatCurrency(current?.expenses ?? 0, language)}</strong></span></div>
      <section className="rent-installments-section"><h3>{t("rentInstallments")}</h3>{rentInstallments.length ? <div className="detail-table"><table className="data-table"><thead><tr><th>{t("dueDate")}</th><th>{t("rentInstallmentStatus")}</th><th>{t("rentPaidAt")}</th><th>{t("amount")}</th></tr></thead><tbody>{rentInstallments.map((item) => <tr key={item.transactionId}><td>{item.dueDate ? formatDate(item.dueDate, language) : "—"}</td><td><span className={`pill rent-status rent-status-${item.status}`}>{rentStatusLabel(item.status)}</span></td><td>{item.paidAt ? formatDate(item.paidAt, language) : "—"}</td><td>{formatCurrency(item.amount, language)}</td></tr>)}</tbody></table></div> : <p className="empty-inline">{t("noRentInstallments")}</p>}</section>
    </>}

    {filterControls}
    {entriesTable}
  </>;
}
