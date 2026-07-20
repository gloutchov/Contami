import { describe, expect, it } from "vitest";
import { applyFinanceCommand, computeDashboard, createAnnualSummary, createEmptyFinanceData } from "../../src/domain/finance";
import { investmentPositionValue, pensionCompartments, pensionPlans, portfolioValues, regularInvestments, selectableFinancialPositions } from "../../src/domain/investments";

describe("investment and private-pension classification", () => {
  it("applies investment transfers to liquidity without treating them as income or expenses", () => {
    const data = createEmptyFinanceData(2026);
    const accountId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    data.accounts.push({ id: accountId, name: "Synthetic account", kind: "bank", currency: "EUR", openingBalance: 1_000, active: true, openedAt: "2026-01-01", notes: "" });
    data.transactions.push(
      { id: crypto.randomUUID(), date: "2026-02-01", description: "Investment contribution", categoryId: data.categories.find((item) => item.nameIt === "Investimenti")!.id, paymentMethodId: data.paymentMethods[0].id, accountId, kind: "transfer", cashFlowDirection: "outflow", amount: 250, currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp },
      { id: crypto.randomUUID(), date: "2026-03-01", description: "Investment liquidation", categoryId: data.categories.find((item) => item.nameIt === "Investimenti")!.id, paymentMethodId: data.paymentMethods[0].id, accountId, kind: "transfer", cashFlowDirection: "inflow", amount: 100, currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp },
    );

    expect(computeDashboard(data)).toMatchObject({ liquidBalance: 850, yearIncome: 0, yearExpenses: 0 });
  });

  it("separates pension collectors and compartments without double counting", () => {
    const data = createEmptyFinanceData(2026);
    const pensionTypeId = data.investmentTypes.find((item) => item.code === "pension")!.id;
    const fundTypeId = data.investmentTypes.find((item) => item.code === "fund")!.id;
    const pensionId = crypto.randomUUID();
    const compartmentA = crypto.randomUUID();
    const compartmentB = crypto.randomUUID();
    const fundId = crypto.randomUUID();
    data.investments.push(
      { id: pensionId, name: "Pension", kind: "pension", typeId: pensionTypeId, provider: "Provider", currency: "EUR", active: true, openedAt: "2020-01-01", notes: "" },
      { id: compartmentA, name: "A", kind: "pension", typeId: pensionTypeId, parentInvestmentId: pensionId, provider: "Provider", currency: "EUR", active: true, openedAt: "2020-01-01", notes: "" },
      { id: compartmentB, name: "B", kind: "pension", typeId: pensionTypeId, parentInvestmentId: pensionId, provider: "Provider", currency: "EUR", active: true, openedAt: "2020-01-01", notes: "" },
      { id: fundId, name: "Fund", kind: "fund", typeId: fundTypeId, provider: "Provider", currency: "EUR", active: true, openedAt: "2020-01-01", notes: "" },
    );
    data.investmentEntries.push(
      { id: crypto.randomUUID(), investmentId: compartmentA, date: "2026-06-01", kind: "valuation", amount: 12_000, description: "Value", notes: "" },
      { id: crypto.randomUUID(), investmentId: compartmentB, date: "2026-06-01", kind: "valuation", amount: 8_000, description: "Value", notes: "" },
      { id: crypto.randomUUID(), investmentId: fundId, date: "2026-06-01", kind: "valuation", amount: 30_000, description: "Value", notes: "" },
    );

    expect(pensionPlans(data).map((item) => item.id)).toEqual([pensionId]);
    expect(pensionCompartments(data, pensionId).map((item) => item.id)).toEqual([compartmentA, compartmentB]);
    expect(regularInvestments(data).map((item) => item.id)).toEqual([fundId]);
    expect(selectableFinancialPositions(data).map((item) => item.id)).toEqual([compartmentA, compartmentB, fundId]);
    expect(portfolioValues(data)).toEqual({ investments: 30_000, pensions: 20_000, combined: 50_000 });
    expect(computeDashboard(data)).toMatchObject({ investmentValue: 30_000, pensionValue: 20_000, netWorth: 50_000 });
    expect(createAnnualSummary(data)).toMatchObject({ investmentValue: 30_000, pensionValue: 20_000 });
  });

  it("updates investment and pension countervalues with movements around valuations", () => {
    const data = createEmptyFinanceData(2026);
    const pensionTypeId = data.investmentTypes.find((item) => item.code === "pension")!.id;
    const pensionId = crypto.randomUUID();
    const compartmentId = crypto.randomUUID();
    data.investments.push(
      { id: pensionId, name: "Pension", kind: "pension", typeId: pensionTypeId, provider: "", currency: "EUR", active: true, openedAt: "2026-01-01", notes: "" },
      { id: compartmentId, name: "Compartment", kind: "pension", typeId: pensionTypeId, parentInvestmentId: pensionId, provider: "", currency: "EUR", active: true, openedAt: "2026-01-01", notes: "" },
    );
    data.investmentEntries.push(
      { id: crypto.randomUUID(), investmentId: compartmentId, date: "2026-01-10", kind: "contribution", amount: 1_000, description: "Initial", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), investmentId: compartmentId, date: "2026-02-10", kind: "valuation", amount: 1_080, description: "Value", notes: "" },
      { id: crypto.randomUUID(), investmentId: compartmentId, date: "2026-03-10", kind: "contribution", amount: 200, description: "Extra", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), investmentId: compartmentId, date: "2026-04-10", kind: "withdrawal", amount: 80, description: "Withdrawal", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
    );

    expect(investmentPositionValue(data, data.investments.find((item) => item.id === compartmentId)!)).toBe(1_200);
    expect(investmentPositionValue(data, data.investments[0])).toBe(1_200);
    expect(portfolioValues(data).pensions).toBe(1_200);
  });

  it("closes a pension collector together with its compartments", () => {
    const data = createEmptyFinanceData(2026);
    const pensionTypeId = data.investmentTypes.find((item) => item.code === "pension")!.id;
    const pensionId = crypto.randomUUID();
    const compartmentId = crypto.randomUUID();
    data.investments.push(
      { id: pensionId, name: "Pension", kind: "pension", typeId: pensionTypeId, provider: "", currency: "EUR", active: true, openedAt: "2020-01-01", notes: "" },
      { id: compartmentId, name: "Compartment", kind: "pension", typeId: pensionTypeId, parentInvestmentId: pensionId, provider: "", currency: "EUR", active: true, openedAt: "2020-01-01", notes: "" },
    );

    const closed = applyFinanceCommand(data, { type: "setActive", entity: "investment", id: pensionId, active: false, closedAt: "2026-07-19" });

    expect(closed.investments.filter((item) => item.id === pensionId || item.id === compartmentId).every((item) => !item.active && item.closedAt === "2026-07-19")).toBe(true);
  });

  it("keeps collectors out of values and movement targets when every compartment is closed", () => {
    const data = createEmptyFinanceData(2026);
    const pensionTypeId = data.investmentTypes.find((item) => item.code === "pension")!.id;
    const pensionId = crypto.randomUUID();
    const compartmentId = crypto.randomUUID();
    data.investments.push(
      { id: pensionId, name: "Pension", kind: "pension", typeId: pensionTypeId, provider: "", currency: "EUR", active: true, openedAt: "2020-01-01", notes: "" },
      { id: compartmentId, name: "Closed compartment", kind: "pension", typeId: pensionTypeId, parentInvestmentId: pensionId, provider: "", currency: "EUR", active: false, openedAt: "2020-01-01", closedAt: "2025-12-31", notes: "" },
    );
    data.investmentEntries.push(
      { id: crypto.randomUUID(), investmentId: pensionId, date: "2025-12-31", kind: "valuation", amount: 20_000, description: "Legacy collector total", notes: "" },
      { id: crypto.randomUUID(), investmentId: compartmentId, date: "2025-12-31", kind: "valuation", amount: 20_000, description: "Closed value", notes: "" },
    );

    expect(selectableFinancialPositions(data)).toEqual([]);
    expect(portfolioValues(data).pensions).toBe(0);
  });

  it("protects the reserved pension type from catalog changes", () => {
    const data = createEmptyFinanceData(2026);
    const pensionType = data.investmentTypes.find((item) => item.code === "pension")!;

    expect(() => applyFinanceCommand(data, { type: "updateInvestmentType", value: { ...pensionType, nameIt: "Modificato" } })).toThrow("RESERVED_INVESTMENT_TYPE");
    expect(() => applyFinanceCommand(data, { type: "deleteEntity", entity: "investmentType", id: pensionType.id })).toThrow("RESERVED_INVESTMENT_TYPE");
  });
});
