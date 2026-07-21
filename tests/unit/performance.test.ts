import { describe, expect, it } from "vitest";
import { computeDashboard, createEmptyFinanceData } from "../../src/domain/finance";

describe("large synthetic datasets", () => {
  it("computes the dashboard within the M6 performance budget", () => {
    const data = createEmptyFinanceData(2026);
    const timestamp = new Date().toISOString();
    const accountId = crypto.randomUUID();
    data.accounts.push({ id: accountId, name: "Synthetic account", kind: "bank", currency: "EUR", openingBalance: 0, active: true, openedAt: "2026-01-01", notes: "" });

    for (let index = 0; index < 25_000; index += 1) {
      const kind = index % 2 === 0 ? "income" : "expense";
      data.transactions.push({
        id: crypto.randomUUID(), date: `2026-${String(index % 12 + 1).padStart(2, "0")}-15`, description: `Synthetic ${index}`,
        categoryId: data.categories[kind === "income" ? 0 : 2].id, paymentMethodId: data.paymentMethods[0].id,
        accountId, kind, amount: 1, currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp,
      });
    }

    for (let index = 0; index < 1_200; index += 1) {
      const propertyId = crypto.randomUUID();
      data.properties.push({ id: propertyId, name: `Synthetic home ${index}`, kind: "apartment", usage: "residence", ownershipShare: 1, purchasePrice: 100_000, active: true, notes: "" });
      data.propertyEntries.push({ id: crypto.randomUUID(), propertyId, date: "2026-06-01", kind: "valuation", category: "Synthetic", description: "Synthetic valuation", amount: 120_000, notes: "" });

      const investmentId = crypto.randomUUID();
      data.investments.push({ id: investmentId, name: `Synthetic fund ${index}`, kind: "fund", typeId: data.investmentTypes[1].id, provider: "Synthetic", currency: "EUR", active: true, openedAt: "2026-01-01", notes: "" });
      data.investmentEntries.push(
        { id: crypto.randomUUID(), investmentId, date: "2026-01-01", kind: "contribution", amount: 100, description: "Synthetic contribution", notes: "" },
        { id: crypto.randomUUID(), investmentId, date: "2026-06-01", kind: "valuation", amount: 120, description: "Synthetic valuation", notes: "" },
        { id: crypto.randomUUID(), investmentId, date: "2026-07-01", kind: "contribution", amount: 10, description: "Synthetic contribution", notes: "" },
      );
    }

    const startedAt = performance.now();
    const metrics = computeDashboard(data);
    const elapsedMs = performance.now() - startedAt;

    expect(metrics).toMatchObject({
      yearIncome: 12_500,
      yearExpenses: 12_500,
      liquidBalance: 0,
      propertyValue: 144_000_000,
      investmentValue: 156_000,
    });
    expect(elapsedMs).toBeLessThan(2_500);
  }, 15_000);
});
