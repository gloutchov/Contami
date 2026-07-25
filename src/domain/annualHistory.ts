import type {
  FinanceData,
  InvestmentAnnualSummary,
  PropertyAnnualSummary,
  VehicleAnnualSummary,
} from "./models";
import { confirmedInvestmentEntries, latestInvestmentValue } from "./investments";
import { isCondominiumCost, isPropertyUtilityCost, propertyConsumptionQuantity } from "./propertyMetrics";

const total = (values: number[]) => values.reduce((sum, value) => sum + value, 0);

export function createPropertyAnnualSummaries(data: FinanceData): PropertyAnnualSummary[] {
  const year = data.meta.activeYear;
  return data.properties.map((property) => {
    const entries = data.propertyEntries.filter((entry) => entry.propertyId === property.id && entry.date.startsWith(String(year)));
    const latestValuation = entries.filter((entry) => entry.kind === "valuation").sort((a, b) => b.date.localeCompare(a.date))[0];
    const consumption = (kind: "electricity" | "gas" | "water") => total(entries
      .filter((entry) => entry.kind === "consumption" || entry.detailKind?.startsWith("utility_"))
      .map((entry) => propertyConsumptionQuantity(entry, kind)));
    const utilityCost = (kind: "electricity" | "gas" | "water" | "phoneInternet") => total(entries
      .filter((entry) => isPropertyUtilityCost(entry, kind))
      .map((entry) => entry.amount));
    return {
      propertyId: property.id,
      year,
      income: total(entries.filter((entry) => entry.kind === "income").map((entry) => entry.amount)),
      expenses: total(entries.filter((entry) => entry.kind === "expense").map((entry) => entry.amount)),
      closingValue: latestValuation?.amount ?? property.purchasePrice,
      electricityKwh: consumption("electricity"),
      gasCubicMeters: consumption("gas"),
      waterCubicMeters: consumption("water"),
      electricityCost: utilityCost("electricity"),
      gasCost: utilityCost("gas"),
      waterCost: utilityCost("water"),
      phoneInternetCost: utilityCost("phoneInternet"),
      condominiumCost: total(entries.filter((entry) => isCondominiumCost(entry)).map((entry) => entry.amount)),
    };
  });
}

export function createInvestmentAnnualSummaries(data: FinanceData): InvestmentAnnualSummary[] {
  const year = data.meta.activeYear;
  return data.investments.map((investment) => {
    const entries = confirmedInvestmentEntries(data, investment.id).filter((entry) => entry.date.startsWith(String(year)));
    return {
      investmentId: investment.id,
      year,
      closingValue: latestInvestmentValue(data, investment.id),
      contributions: total(entries.filter((entry) => entry.kind === "contribution").map((entry) => entry.amount)),
      withdrawals: total(entries.filter((entry) => entry.kind === "withdrawal").map((entry) => entry.amount)),
    };
  });
}

export function createVehicleAnnualSummaries(data: FinanceData): VehicleAnnualSummary[] {
  const year = data.meta.activeYear;
  return data.vehicles.map((vehicle) => {
    const entries = data.vehicleEntries.filter((entry) => entry.vehicleId === vehicle.id && entry.date.startsWith(String(year)));
    const costs = entries.filter((entry) => entry.kind !== "valuation");
    const byKind = (kind: typeof costs[number]["kind"]) => total(costs.filter((entry) => entry.kind === kind).map((entry) => entry.amount));
    const fuelLiters = total(entries.map((entry) => entry.fuelLiters ?? 0));
    const distanceKm = total(entries.map((entry) => entry.distanceKm ?? 0));
    const closingOdometer = entries.map((entry) => entry.odometerKm).filter((value): value is number => value !== undefined).sort((a, b) => b - a)[0];
    return {
      vehicleId: vehicle.id,
      year,
      totalCosts: total(costs.map((entry) => entry.amount)),
      fuelCosts: byKind("fuel"),
      installments: byKind("installment"),
      taxes: byKind("tax"),
      insurance: byKind("insurance"),
      tires: byKind("tires"),
      maintenance: byKind("maintenance"),
      repairs: byKind("repair"),
      fuelLiters,
      distanceKm,
      averageKmPerLiter: fuelLiters > 0 ? distanceKm / fuelLiters : undefined,
      closingOdometer,
    };
  });
}
