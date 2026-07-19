import { CarFront, Fuel, Gauge, Pencil, Plus, ReceiptText, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData, Vehicle, VehicleEntry } from "../../domain/models";
import { DetailDialog } from "../components/DetailDialog";
import { EmptyState } from "../components/EmptyState";
import { KpiCard } from "../components/KpiCard";
import { PageHeader } from "../components/PageHeader";
import { TrendBars } from "../components/TrendBars";
import { VehicleEntryForm, VehicleForm } from "../forms/VehicleForms";
import { useI18n } from "../i18n/I18nContext";
import { formatCurrency, formatDate, todayIso } from "../utils/format";
import { runUiAction } from "../utils/save";
import { vehicleCostComparison, vehicleLifetimeSummary } from "../utils/vehicleHistory";

export function VehiclesView({ data, onSave }: { data: FinanceData; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n();
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null | undefined>();
  const [editingEntry, setEditingEntry] = useState<VehicleEntry | null | undefined>();
  const [entryVehicleId, setEntryVehicleId] = useState<string>();
  const [selected, setSelected] = useState<Vehicle>();
  const currentYear = String(data.meta.activeYear);
  const yearEntries = data.vehicleEntries.filter((item) => item.date.startsWith(currentYear));
  const totalCosts = yearEntries.filter((item) => item.kind !== "valuation").reduce((sum, item) => sum + item.amount, 0);
  const fuelCosts = yearEntries.filter((item) => item.kind === "fuel").reduce((sum, item) => sum + item.amount, 0);
  const distance = yearEntries.reduce((sum, item) => sum + (item.distanceKm ?? 0), 0);
  const remove = (entity: "vehicle" | "vehicleEntry", id: string) => { if (window.confirm(t("deleteConfirm"))) runUiAction(() => onSave({ type: "deleteEntity", entity, id })); };
  const entries = useMemo(() => selected ? data.vehicleEntries.filter((item) => item.vehicleId === selected.id).sort((a, b) => b.date.localeCompare(a.date)) : [], [data.vehicleEntries, selected]);
  const summary = selected ? vehicleLifetimeSummary(data, selected.id) : undefined;
  const comparison = useMemo(() => vehicleCostComparison(data), [data]);
  const openEntry = (id: string) => { setEntryVehicleId(id); setEditingEntry(null); };
  return <><PageHeader title={t("vehicles")} subtitle={t("vehiclesSubtitle")} actionLabel={t("newVehicle")} onAction={() => setEditingVehicle(null)} secondary={<button className="secondary-button" onClick={() => openEntry(data.vehicles.find((item) => item.active)?.id ?? "")} disabled={!data.vehicles.some((item) => item.active)}><Plus size={16}/>{t("newVehicleEntry")}</button>} />
    <section className="view-kpi-grid"><KpiCard label={t("vehicleCosts")} value={formatCurrency(totalCosts, language)} icon={ReceiptText} tone="coral"/><KpiCard label={t("fuel")} value={formatCurrency(fuelCosts, language)} icon={Fuel} tone="gold"/><KpiCard label={t("distanceKm")} value={`${Math.round(distance).toLocaleString(language)} km`} icon={Gauge} tone="mint"/></section>
    {data.vehicles.length ? <section className="entity-grid">{data.vehicles.map((vehicle) => {
      const item = vehicleLifetimeSummary(data, vehicle.id); const odometer = item.closingOdometer;
      return <article className="panel entity-card clickable" key={vehicle.id} onClick={() => setSelected(vehicle)}><header><div><h3>{vehicle.name}</h3><p className="meta">{[vehicle.manufacturer, vehicle.model, t(vehicle.fuelType)].filter(Boolean).join(" · ")}</p></div><span className="pill">{vehicle.active ? t("active") : t("closed")}</span></header><small className="entity-value-label">{t("lifetimeCosts")}</small><div className="entity-value">{formatCurrency(item.totalCosts, language)}</div><div className="mini-totals"><span>{t("fuel")} <strong>{formatCurrency(item.fuelCosts, language)}</strong></span><span>{t("odometerKm")} <strong>{odometer === undefined ? "—" : `${Math.round(odometer).toLocaleString(language)} km`}</strong></span></div><footer><span>{t("openDetails")}</span><div className="entity-actions" onClick={(event) => event.stopPropagation()}>{vehicle.active && <button className="text-button" onClick={() => openEntry(vehicle.id)}>{t("newVehicleEntry")}</button>}<button className="text-button" onClick={() => runUiAction(() => onSave({ type: "setActive", entity: "vehicle", id: vehicle.id, active: !vehicle.active, closedAt: vehicle.active ? todayIso() : undefined }))}>{vehicle.active ? t("close") : t("reopen")}</button><button className="icon-button" aria-label={t("edit")} onClick={() => setEditingVehicle(vehicle)}><Pencil size={15}/></button><button className="icon-button danger" aria-label={t("delete")} onClick={() => remove("vehicle", vehicle.id)}><Trash2 size={15}/></button></div></footer></article>;
    })}</section> : <section className="panel"><EmptyState title={t("noVehicles")} actionLabel={t("addFirst")} onAction={() => setEditingVehicle(null)} icon={CarFront} /></section>}
    {selected && <DetailDialog title={selected.name} onClose={() => setSelected(undefined)} actions={<><button className="secondary-button" onClick={() => { setEditingVehicle(selected); setSelected(undefined); }}>{t("editVehicle")}</button><button className="primary-button" onClick={() => { openEntry(selected.id); setSelected(undefined); }}>{t("newVehicleEntry")}</button></>}>
      <div className="detail-facts"><span><small>{t("manufacturer")}</small><strong>{selected.manufacturer || "—"}</strong></span><span><small>{t("model")}</small><strong>{selected.model || "—"}</strong></span><span><small>{t("fuelType")}</small><strong>{t(selected.fuelType)}</strong></span><span><small>{t("purchasePrice")}</small><strong>{selected.purchasePrice === undefined ? "—" : formatCurrency(selected.purchasePrice, language)}</strong></span></div>
      <section className="vehicle-history"><h3>{t("vehicleComparison")}</h3><TrendBars points={comparison.map((item) => ({ label: item.label, value: item.costPerKm }))} format={(value) => `${formatCurrency(value, language)}/km`} /></section>
      {summary && <div className="type-totals"><span><small>{t("fuel")}</small><strong>{formatCurrency(summary.fuelCosts, language)}</strong></span><span><small>{t("installment")}</small><strong>{formatCurrency(summary.installments, language)}</strong></span><span><small>{t("insurance")}</small><strong>{formatCurrency(summary.insurance, language)}</strong></span><span><small>{t("tax")}</small><strong>{formatCurrency(summary.taxes, language)}</strong></span><span><small>{t("tires")}</small><strong>{formatCurrency(summary.tires, language)}</strong></span><span><small>{t("maintenance")}</small><strong>{formatCurrency(summary.maintenance + summary.repairs, language)}</strong></span></div>}
      <div className="detail-table"><table className="data-table"><thead><tr><th>{t("date")}</th><th>{t("type")}</th><th>{t("description")}</th><th>{t("amount")}</th><th /></tr></thead><tbody>{entries.map((item) => <tr key={item.id}><td>{formatDate(item.date, language)}</td><td><span className="pill">{t(item.kind)}</span></td><td>{item.description}</td><td>{formatCurrency(item.amount, language)}</td><td><div className="row-actions"><button className="icon-button" aria-label={t("edit")} onClick={() => { setEditingEntry(item); setEntryVehicleId(item.vehicleId); setSelected(undefined); }}><Pencil size={14}/></button><button className="icon-button danger" aria-label={t("delete")} onClick={() => remove("vehicleEntry", item.id)}><Trash2 size={14}/></button></div></td></tr>)}</tbody></table></div>
    </DetailDialog>}
    {editingVehicle !== undefined && <VehicleForm value={editingVehicle ?? undefined} onClose={() => setEditingVehicle(undefined)} onSave={onSave} />}
    {editingEntry !== undefined && <VehicleEntryForm data={data} value={editingEntry ?? undefined} initialVehicleId={entryVehicleId} onClose={() => { setEditingEntry(undefined); setEntryVehicleId(undefined); }} onSave={onSave} />}
  </>;
}
