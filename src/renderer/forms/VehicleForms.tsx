import { useState, type FormEvent } from "react";
import type { FinanceCommand } from "../../domain/commands";
import type { FinanceData, Vehicle, VehicleEntry } from "../../domain/models";
import { Field, Modal } from "../components/Modal";
import { useI18n } from "../i18n/I18nContext";
import { todayIso } from "../utils/format";
import { saveAndClose } from "../utils/save";

const fuelTypes: Vehicle["fuelType"][] = ["petrol", "diesel", "lpg", "methane", "hybrid", "electric", "other"];
const entryKinds: VehicleEntry["kind"][] = ["fuel", "installment", "tax", "insurance", "tires", "maintenance", "repair", "valuation", "other"];

export function VehicleForm({ value, onClose, onSave }: { value?: Vehicle; onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t } = useI18n();
  const [name, setName] = useState(value?.name ?? "");
  const [manufacturer, setManufacturer] = useState(value?.manufacturer ?? "");
  const [model, setModel] = useState(value?.model ?? "");
  const [fuelType, setFuelType] = useState<Vehicle["fuelType"]>(value?.fuelType ?? "petrol");
  const [purchaseDate, setPurchaseDate] = useState(value?.purchaseDate ?? "");
  const [disposalDate, setDisposalDate] = useState(value?.disposalDate ?? "");
  const [purchasePrice, setPurchasePrice] = useState(value?.purchasePrice !== undefined ? String(value.purchasePrice) : "");
  const [salePrice, setSalePrice] = useState(value?.salePrice !== undefined ? String(value.salePrice) : "");
  const [notes, setNotes] = useState(value?.notes ?? "");
  const valid = Boolean(name.trim());
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!valid) return;
    const vehicle: Vehicle = {
      ...value, id: value?.id ?? crypto.randomUUID(), name: name.trim(), manufacturer: manufacturer.trim(), model: model.trim(), fuelType,
      purchaseDate: purchaseDate || undefined, disposalDate: disposalDate || undefined,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined, salePrice: salePrice ? Number(salePrice) : undefined,
      active: value?.active ?? true, notes,
    };
    await saveAndClose(onSave, { type: value ? "updateVehicle" : "addVehicle", value: vehicle }, onClose);
  };
  return <Modal title={value ? t("editVehicle") : t("newVehicle")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("name")} wide><input required maxLength={240} autoFocus value={name} onChange={(event) => setName(event.target.value)} /></Field>
    <Field label={t("manufacturer")}><input maxLength={120} value={manufacturer} onChange={(event) => setManufacturer(event.target.value)} /></Field>
    <Field label={t("model")}><input maxLength={120} value={model} onChange={(event) => setModel(event.target.value)} /></Field>
    <Field label={t("fuelType")}><select value={fuelType} onChange={(event) => setFuelType(event.target.value as Vehicle["fuelType"])}>{fuelTypes.map((item) => <option key={item} value={item}>{t(item)}</option>)}</select></Field>
    <Field label={t("date")}><input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} /></Field>
    <Field label={t("purchasePrice")}><input type="number" min="0" step="0.01" value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} /></Field>
    <Field label={t("disposalDate")}><input type="date" value={disposalDate} onChange={(event) => setDisposalDate(event.target.value)} /></Field>
    <Field label={t("salePrice")}><input type="number" min="0" step="0.01" value={salePrice} onChange={(event) => setSalePrice(event.target.value)} /></Field>
    <Field label={t("notes")} wide><textarea maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}

export function VehicleEntryForm({ data, value, initialVehicleId, onClose, onSave }: { data: FinanceData; value?: VehicleEntry; initialVehicleId?: string; onClose: () => void; onSave: (command: FinanceCommand) => Promise<void> }) {
  const { t, language } = useI18n();
  const [vehicleId, setVehicleId] = useState(value?.vehicleId ?? initialVehicleId ?? data.vehicles.find((item) => item.active)?.id ?? "");
  const [date, setDate] = useState(value?.date ?? todayIso());
  const [kind, setKind] = useState<VehicleEntry["kind"]>(value?.kind ?? "fuel");
  const [description, setDescription] = useState(value?.description ?? "");
  const [amount, setAmount] = useState(value ? String(value.amount) : "");
  const [odometerKm, setOdometerKm] = useState(value?.odometerKm !== undefined ? String(value.odometerKm) : "");
  const [distanceKm, setDistanceKm] = useState(value?.distanceKm !== undefined ? String(value.distanceKm) : "");
  const [fuelLiters, setFuelLiters] = useState(value?.fuelLiters !== undefined ? String(value.fuelLiters) : "");
  const [fuelUnitPrice, setFuelUnitPrice] = useState(value?.fuelUnitPrice !== undefined ? String(value.fuelUnitPrice) : "");
  const [fuelType, setFuelType] = useState(value?.fuelType ?? "");
  const [vendor, setVendor] = useState(value?.vendor ?? "");
  const [categoryId, setCategoryId] = useState(value?.categoryId ?? data.categories.find((item) => item.active && (item.nameIt.toLocaleLowerCase().includes("auto") || item.nameEn.toLocaleLowerCase().includes("car")))?.id ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState(value?.paymentMethodId ?? data.paymentMethods.find((item) => item.active)?.id ?? "");
  const [notes, setNotes] = useState(value?.notes ?? "");
  const valid = Boolean(vehicleId && description.trim() && Number(amount || 0) >= 0 && (kind === "valuation" || (categoryId && paymentMethodId)) && (kind !== "fuel" || Number(fuelLiters) > 0));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!valid) return;
    const entry: VehicleEntry = {
      ...value, id: value?.id ?? crypto.randomUUID(), vehicleId, date, kind, description: description.trim(), amount: Number(amount || 0),
      odometerKm: odometerKm ? Number(odometerKm) : undefined, distanceKm: distanceKm ? Number(distanceKm) : undefined,
      fuelLiters: kind === "fuel" && fuelLiters ? Number(fuelLiters) : undefined,
      fuelUnitPrice: kind === "fuel" && fuelUnitPrice ? Number(fuelUnitPrice) : undefined,
      fuelType: kind === "fuel" && fuelType ? fuelType : undefined, vendor: vendor || undefined,
      categoryId: kind === "valuation" ? undefined : categoryId, paymentMethodId: kind === "valuation" ? undefined : paymentMethodId, transactionId: value?.transactionId, notes,
    };
    await saveAndClose(onSave, { type: value ? "updateVehicleEntry" : "addVehicleEntry", value: entry }, onClose);
  };
  return <Modal title={value ? t("editVehicleEntry") : t("newVehicleEntry")} onClose={onClose} onSubmit={submit} submitDisabled={!valid}>
    <Field label={t("vehicle")}><select required value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>{data.vehicles.filter((item) => item.active || item.id === vehicleId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label={t("date")}><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
    <Field label={t("type")}><select value={kind} onChange={(event) => setKind(event.target.value as VehicleEntry["kind"])}>{entryKinds.map((item) => <option key={item} value={item}>{t(item)}</option>)}</select></Field>
    <Field label={t("amount")}><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>
    <Field label={t("description")} wide><input required maxLength={240} value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
    {kind !== "valuation" && <><Field label={t("category")}><select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">—</option>{data.categories.filter((item) => item.active && (item.kind === "expense" || item.kind === "both")).map((item) => <option key={item.id} value={item.id}>{language === "it" ? item.nameIt : item.nameEn}</option>)}</select></Field><Field label={t("paymentMethod")}><select required value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}><option value="">—</option>{data.paymentMethods.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field></>}
    <Field label={t("odometerKm")}><input type="number" min="0" step="1" value={odometerKm} onChange={(event) => setOdometerKm(event.target.value)} /></Field>
    <Field label={t("distanceKm")}><input type="number" min="0" step="1" value={distanceKm} onChange={(event) => setDistanceKm(event.target.value)} /></Field>
    {kind === "fuel" && <><Field label={t("fuelLiters")}><input required type="number" min="0.001" step="0.001" value={fuelLiters} onChange={(event) => setFuelLiters(event.target.value)} /></Field><Field label={t("fuelUnitPrice")}><input type="number" min="0" step="0.001" value={fuelUnitPrice} onChange={(event) => setFuelUnitPrice(event.target.value)} /></Field><Field label={t("fuelType")}><input maxLength={80} value={fuelType} onChange={(event) => setFuelType(event.target.value)} /></Field></>}
    <Field label={t("vendor")}><input maxLength={160} value={vendor} onChange={(event) => setVendor(event.target.value)} /></Field>
    <Field label={t("notes")} wide><textarea maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
  </Modal>;
}
