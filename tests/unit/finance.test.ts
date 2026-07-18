import { describe, expect, it } from "vitest";
import { applyFinanceCommand, computeDashboard, createEmptyFinanceData } from "../../src/domain/finance";

describe("finance domain", () => {
  it("creates a bilingual, usable empty dataset", () => {
    const data = createEmptyFinanceData(2027);
    expect(data.meta.activeYear).toBe(2027);
    expect(data.categories.length).toBeGreaterThan(5);
    expect(data.categories.every((item) => item.nameIt && item.nameEn)).toBe(true);
    expect(data.paymentMethods.length).toBeGreaterThan(2);
  });

  it("applies transactions immutably and computes the overview", () => {
    const data = createEmptyFinanceData(2026);
    const accountId = crypto.randomUUID();
    const withAccount = applyFinanceCommand(data, { type: "addAccount", value: {
      id: accountId, name: "Main", kind: "bank", currency: "EUR", openingBalance: 1000,
      active: true, openedAt: "2026-01-01", notes: "",
    } });
    const categoryId = withAccount.categories.find((item) => item.kind === "income")!.id;
    const paymentMethodId = withAccount.paymentMethods[0].id;
    const timestamp = new Date().toISOString();
    const next = applyFinanceCommand(withAccount, { type: "addTransaction", value: {
      id: crypto.randomUUID(), date: "2026-03-10", description: "Income", categoryId,
      paymentMethodId, accountId, kind: "income", amount: 250, currency: "EUR", notes: "",
      createdAt: timestamp, updatedAt: timestamp,
    } });
    expect(data.accounts).toHaveLength(0);
    expect(computeDashboard(next)).toMatchObject({ liquidBalance: 1250, yearIncome: 250, yearExpenses: 0 });
  });

  it("calculates unsettled shared balances in both directions", () => {
    const data = createEmptyFinanceData(2026);
    const categoryId = data.categories.find((item) => item.kind === "expense")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
    data.sharedExpenses.push(
      { id: crypto.randomUUID(), date: "2026-01-01", description: "A", categoryId, paymentMethodId, amount: 100, ownerShare: 50, partnerShare: 50, paidBy: "owner", settled: false, notes: "" },
      { id: crypto.randomUUID(), date: "2026-01-02", description: "B", categoryId, paymentMethodId, amount: 40, ownerShare: 20, partnerShare: 20, paidBy: "partner", settled: false, notes: "" },
    );
    expect(computeDashboard(data).sharedBalance).toBe(30);
  });
});
