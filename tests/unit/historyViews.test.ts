import { describe, expect, it } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import { investmentValueHistory, investmentValueTimeline } from "../../src/renderer/utils/investmentHistory";
import { filterPropertyEntries, propertyEntryMonths } from "../../src/renderer/utils/propertyHistory";
import { vehicleCostComparison, vehicleHistory, vehicleLifetimeSummary } from "../../src/renderer/utils/vehicleHistory";

describe("historical view helpers", () => {
  it("filters property entries by month and description", () => {
    const data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    const entries = [
      { id: crypto.randomUUID(), propertyId, date: "2026-01-10", kind: "expense" as const, category: "Luce", description: "Bolletta", amount: 50, categoryId: data.categories[3].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), propertyId, date: "2026-02-10", kind: "expense" as const, category: "Gas", description: "Bolletta", amount: 60, categoryId: data.categories[3].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
    ];
    expect(propertyEntryMonths(entries)).toEqual(["2026-02", "2026-01"]);
    expect(filterPropertyEntries(entries, "2026-02", "gas")).toEqual([entries[1]]);
  });

  it("carries forward compartment values in an aggregated pension history", () => {
    const data = createEmptyFinanceData(2026);
    const pensionType = data.investmentTypes.find((item) => item.code === "pension")!.id;
    const parent = crypto.randomUUID(); const first = crypto.randomUUID(); const second = crypto.randomUUID();
    data.investments.push(
      { id: parent, name: "Synthetic pension", kind: "pension", typeId: pensionType, provider: "", currency: "EUR", active: true, openedAt: "2024-01-01", notes: "" },
      { id: first, name: "First", kind: "pension", typeId: pensionType, parentInvestmentId: parent, provider: "", currency: "EUR", active: true, openedAt: "2024-01-01", notes: "" },
      { id: second, name: "Second", kind: "pension", typeId: pensionType, parentInvestmentId: parent, provider: "", currency: "EUR", active: true, openedAt: "2025-01-01", notes: "" },
    );
    data.investmentAnnualSummaries.push(
      { investmentId: first, year: 2024, closingValue: 110, contributions: 100, withdrawals: 0 },
      { investmentId: second, year: 2025, closingValue: 210, contributions: 200, withdrawals: 0 },
    );

    expect(investmentValueHistory(data, parent)).toEqual([
      { year: 2024, investedValue: 100, closingValue: 110, contributions: 100, withdrawals: 0 },
      { year: 2025, investedValue: 300, closingValue: 320, contributions: 200, withdrawals: 0 },
    ]);
  });

  it("keeps every dated investment valuation in the chart timeline", () => {
    const data = createEmptyFinanceData(2026);
    const investmentId = crypto.randomUUID();
    data.investments.push({ id: investmentId, name: "Synthetic fund", kind: "fund", typeId: data.investmentTypes[1].id, provider: "", currency: "EUR", active: true, openedAt: "2026-01-01", notes: "" });
    data.investmentEntries.push(
      { id: crypto.randomUUID(), investmentId, date: "2026-01-10", kind: "contribution", amount: 100, description: "Contribution", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), investmentId, date: "2026-01-10", kind: "valuation", amount: 110, description: "Value", notes: "" },
      { id: crypto.randomUUID(), investmentId, date: "2026-02-10", kind: "contribution", amount: 50, description: "Contribution", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), investmentId, date: "2026-02-10", kind: "valuation", amount: 170, description: "Value", notes: "" },
    );

    expect(investmentValueTimeline(data, investmentId)).toEqual([
      { date: "2026-01-10", investedValue: 100, closingValue: 110 },
      { date: "2026-02-10", investedValue: 150, closingValue: 170 },
    ]);
  });

  it("shows prior-vehicle lifetime totals even without current-year entries", () => {
    const data = createEmptyFinanceData(2026);
    const vehicleId = crypto.randomUUID();
    data.vehicles.push({ id: vehicleId, name: "Previous car", manufacturer: "", model: "", fuelType: "petrol", active: false, disposalDate: "2020-01-01", notes: "" });
    data.vehicleAnnualSummaries.push(
      { vehicleId, year: 2019, totalCosts: 1_000, fuelCosts: 500, installments: 0, taxes: 100, insurance: 200, tires: 50, maintenance: 100, repairs: 50, fuelLiters: 300, distanceKm: 4_500, closingOdometer: 90_000 },
      { vehicleId, year: 2020, totalCosts: 250, fuelCosts: 100, installments: 0, taxes: 50, insurance: 50, tires: 0, maintenance: 25, repairs: 25, fuelLiters: 60, distanceKm: 900, closingOdometer: 90_900 },
    );

    expect(vehicleHistory(data, vehicleId)).toHaveLength(2);
    expect(vehicleLifetimeSummary(data, vehicleId)).toMatchObject({ totalCosts: 1_250, fuelCosts: 600, distanceKm: 5_400, closingOdometer: 90_900 });
    expect(vehicleCostComparison(data)).toEqual([{ vehicleId, label: "Previous car", costPerKm: 1_250 / 5_400, totalCosts: 1_250, distanceKm: 5_400 }]);
  });
});
