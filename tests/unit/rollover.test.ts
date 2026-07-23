import { describe, expect, it } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import { createRolloverFinanceData } from "../../src/domain/rollover";

describe("createRolloverFinanceData", () => {
  it("carries only active positions, closing balances and prior-year totals", () => {
    const current = createEmptyFinanceData(2026);
    const now = new Date().toISOString();
    const accountId = crypto.randomUUID();
    const propertyId = crypto.randomUUID();
    const investmentId = crypto.randomUUID();
    const vehicleId = crypto.randomUUID();
    current.taxTypes[0] = { ...current.taxTypes[0], name: "Legacy TV levy", active: false };
    current.accounts.push({ id: accountId, name: "Main", kind: "bank", currency: "EUR", openingBalance: 1_000, active: true, openedAt: "2020-01-01", notes: "" });
    current.transactions.push(
      { id: crypto.randomUUID(), date: "2026-02-01", description: "Income", categoryId: current.categories[0].id, paymentMethodId: current.paymentMethods[0].id, accountId, kind: "income", amount: 500, currency: "EUR", notes: "", createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), date: "2026-02-02", description: "Expense", categoryId: current.categories[2].id, paymentMethodId: current.paymentMethods[0].id, accountId, kind: "expense", amount: 125, currency: "EUR", notes: "", createdAt: now, updatedAt: now },
    );
    current.properties.push({ id: propertyId, name: "Home", kind: "house", ownershipShare: 1, purchasePrice: 200_000, active: true, notes: "" });
    current.propertyEntries.push(
      { id: crypto.randomUUID(), propertyId, date: "2026-12-15", kind: "valuation", category: "Value", description: "Year end", amount: 230_000, notes: "" },
      { id: crypto.randomUUID(), propertyId, date: "2026-11-15", kind: "consumption", category: "Electricity", description: "Reading", amount: 0, quantity: 1250, unit: "kWh", notes: "" },
    );
    current.investments.push({ id: investmentId, name: "Fund", kind: "fund", provider: "", currency: "EUR", active: true, openedAt: "2024-01-01", notes: "" });
    current.investmentEntries.push({ id: crypto.randomUUID(), investmentId, date: "2026-12-20", kind: "valuation", amount: 20_000, description: "Year end", notes: "" });
    current.vehicles.push({ id: vehicleId, name: "Synthetic car", manufacturer: "Example", model: "One", fuelType: "hybrid", active: true, notes: "" });
    current.vehicleEntries.push({ id: crypto.randomUUID(), vehicleId, date: "2026-05-10", kind: "fuel", description: "Fuel", amount: 60, distanceKm: 700, fuelLiters: 35, odometerKm: 15_000, notes: "" });
    current.recurringItems.push(
      { id: crypto.randomUUID(), name: "Active", kind: "subscription", amount: 10, frequency: "monthly", categoryId: current.categories[7].id, paymentMethodId: current.paymentMethods[0].id, nextDueDate: "2026-12-10", active: true, notes: "" },
      { id: crypto.randomUUID(), name: "Finished", kind: "installment", amount: 10, frequency: "monthly", categoryId: current.categories[7].id, paymentMethodId: current.paymentMethods[0].id, nextDueDate: "2026-12-10", remainingInstallments: 0, active: true, notes: "" },
    );
    current.sharedExpenses.push(
      { id: crypto.randomUUID(), date: "2026-12-01", description: "Pending", categoryId: current.categories[2].id, paymentMethodId: current.paymentMethods[0].id, amount: 40, ownerShare: 20, partnerShare: 20, paidBy: "owner", settled: false, notes: "" },
      { id: crypto.randomUUID(), date: "2026-12-02", description: "Settled", categoryId: current.categories[2].id, paymentMethodId: current.paymentMethods[0].id, amount: 40, ownerShare: 20, partnerShare: 20, paidBy: "owner", settled: true, notes: "" },
    );

    const next = createRolloverFinanceData(current, 2027);

    expect(next.meta.activeYear).toBe(2027);
    expect(next.transactions).toEqual([]);
    expect(next.accounts[0].openingBalance).toBe(1_375);
    expect(next.accounts[0].openedAt).toBe("2020-01-01");
    expect(next.propertyEntries).toMatchObject([{ propertyId, date: "2027-01-01", amount: 230_000 }]);
    expect(next.investmentEntries).toMatchObject([{ investmentId, date: "2027-01-01", amount: 20_000 }]);
    expect(next.vehicles.map((item) => item.id)).toEqual([vehicleId]);
    expect(next.vehicleEntries).toEqual([]);
    expect(next.recurringItems).toHaveLength(1);
    expect(next.recurringItems[0].nextDueDate.startsWith("2027-")).toBe(true);
    expect(next.sharedExpenses.map((item) => item.description)).toEqual(["Pending"]);
    expect(next.taxTypes[0]).toMatchObject({ name: "Legacy TV levy", active: false });
    expect(next.annualSummaries).toMatchObject([{ year: 2026, income: 500, expenses: 125, netCashFlow: 375 }]);
    expect(next.propertyAnnualSummaries).toMatchObject([{ propertyId, year: 2026, electricityKwh: 1250 }]);
    expect(next.investmentAnnualSummaries).toMatchObject([{ investmentId, year: 2026, closingValue: 20_000 }]);
    expect(next.vehicleAnnualSummaries).toMatchObject([{ vehicleId, year: 2026, totalCosts: 60, fuelCosts: 60, distanceKm: 700, fuelLiters: 35, averageKmPerLiter: 20 }]);
  });
});
