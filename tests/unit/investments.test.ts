import { describe, expect, it } from "vitest";
import { applyFinanceCommand, computeDashboard, createAnnualSummary, createEmptyFinanceData } from "../../src/domain/finance";
import { investmentMovementEvents, investmentMovementTotals, investmentPositionInvestedCapital, investmentPositionIsLoss, investmentPositionMovementTotals, investmentPositionValue, investmentValuationTrend, pensionCompartments, pensionPlans, portfolioValues, regularInvestments, selectableFinancialPositions } from "../../src/domain/investments";

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

  it("detects losses against net invested capital for positions and collectors", () => {
    const data = createEmptyFinanceData(2026);
    const pensionTypeId = data.investmentTypes.find((item) => item.code === "pension")!.id;
    const pensionId = crypto.randomUUID();
    const compartmentId = crypto.randomUUID();
    data.investments.push(
      { id: pensionId, name: "Synthetic pension", kind: "pension", typeId: pensionTypeId, provider: "", currency: "EUR", active: true, openedAt: "2026-01-01", notes: "" },
      { id: compartmentId, name: "Synthetic compartment", kind: "pension", typeId: pensionTypeId, parentInvestmentId: pensionId, provider: "", currency: "EUR", active: true, openedAt: "2026-01-01", notes: "" },
    );
    data.investmentEntries.push(
      { id: crypto.randomUUID(), investmentId: compartmentId, date: "2026-01-01", kind: "contribution", amount: 1_000, description: "Contribution", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), investmentId: compartmentId, date: "2026-02-01", kind: "withdrawal", amount: 100, description: "Withdrawal", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), investmentId: compartmentId, date: "2026-03-01", kind: "valuation", amount: 850, description: "Loss valuation", notes: "" },
    );

    expect(investmentPositionInvestedCapital(data, data.investments[1])).toBe(900);
    expect(investmentPositionIsLoss(data, data.investments[1])).toBe(true);
    expect(investmentPositionIsLoss(data, data.investments[0])).toBe(true);
  });

  it("separates initial capital, later contributions, liquidations, and balance across annual history", () => {
    const data = createEmptyFinanceData(2026);
    const investmentId = crypto.randomUUID();
    const plannedEntryId = crypto.randomUUID();
    const plannedTransactionId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    data.investments.push({
      id: investmentId, name: "Synthetic lifetime fund", kind: "fund", typeId: data.investmentTypes[1].id,
      provider: "", currency: "EUR", active: true, openedAt: "2024-01-01", notes: "",
    });
    data.investmentAnnualSummaries.push(
      { investmentId, year: 2024, closingValue: 950, contributions: 1_000, withdrawals: 100 },
      { investmentId, year: 2025, closingValue: 1_100, contributions: 200, withdrawals: 50 },
    );
    data.investmentEntries.push(
      { id: crypto.randomUUID(), investmentId, date: "2025-06-01", kind: "contribution", amount: 999, description: "Historical detail already represented by its annual summary", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), investmentId, date: "2026-01-10", kind: "contribution", amount: 300, description: "Current contribution", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), investmentId, date: "2026-02-10", kind: "withdrawal", amount: 80, description: "Current liquidation", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), investmentId, date: "2026-03-10", kind: "valuation", amount: 1_500, description: "Current valuation", notes: "" },
      { id: plannedEntryId, investmentId, date: "2026-12-10", kind: "contribution", amount: 500, description: "Planned contribution", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, transactionId: plannedTransactionId, notes: "" },
    );
    data.transactions.push({
      id: plannedTransactionId, date: "2026-12-10", description: "Planned contribution",
      categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id,
      kind: "transfer", cashFlowDirection: "outflow", amount: 500, currency: "EUR",
      investmentId, investmentEntryId: plannedEntryId, planned: true, notes: "", createdAt: timestamp, updatedAt: timestamp,
    });

    expect(investmentMovementTotals(data, investmentId)).toEqual({
      initialCapital: 1_000,
      subsequentContributions: 500,
      liquidations: 230,
      balance: 1_270,
    });
    expect(investmentMovementEvents(data, investmentId).map((item) => [item.date, item.kind, item.amount])).toEqual([
      ["2024-12-31", "contribution", 1_000],
      ["2024-12-31", "withdrawal", 100],
      ["2025-12-31", "contribution", 200],
      ["2025-12-31", "withdrawal", 50],
      ["2026-01-10", "contribution", 300],
      ["2026-02-10", "withdrawal", 80],
    ]);
    expect(investmentPositionInvestedCapital(data, data.investments[0])).toBe(1_270);
  });

  it("falls back to confirmed historical detail when one annual movement component is zero", () => {
    const data = createEmptyFinanceData(2026);
    const pensionTypeId = data.investmentTypes.find((item) => item.code === "pension")!.id;
    const pensionId = crypto.randomUUID();
    const compartmentId = crypto.randomUUID();
    data.investments.push(
      { id: pensionId, name: "Synthetic pension", kind: "pension", typeId: pensionTypeId, provider: "", currency: "EUR", active: true, openedAt: "2025-01-01", notes: "" },
      { id: compartmentId, name: "Synthetic inherited compartment", kind: "pension", typeId: pensionTypeId, parentInvestmentId: pensionId, provider: "", currency: "EUR", active: true, openedAt: "2025-01-01", notes: "" },
    );
    data.investmentAnnualSummaries.push({
      investmentId: compartmentId, year: 2025, closingValue: 1_300, contributions: 0, withdrawals: 60,
    });
    data.investmentEntries.push(
      { id: crypto.randomUUID(), investmentId: compartmentId, date: "2025-01-10", kind: "contribution", amount: 1_234, description: "Confirmed historical contribution", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), investmentId: compartmentId, date: "2025-03-10", kind: "withdrawal", amount: 999, description: "Historical detail already represented by the withdrawal summary", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
    );

    expect(investmentMovementEvents(data, compartmentId).map((item) => [item.date, item.kind, item.amount])).toEqual([
      ["2025-01-10", "contribution", 1_234],
      ["2025-12-31", "withdrawal", 60],
    ]);
    expect(investmentPositionMovementTotals(data, data.investments[0])).toEqual({
      initialCapital: 1_234,
      subsequentContributions: 0,
      liquidations: 60,
      balance: 1_174,
    });
  });

  it("uses corrections only in contribution and liquidation totals", () => {
    const data = createEmptyFinanceData(2026);
    const investmentId = crypto.randomUUID();
    data.investments.push({
      id: investmentId, name: "Synthetic corrected fund", kind: "fund", provider: "", currency: "EUR",
      active: true, openedAt: "2026-01-01", notes: "",
    });
    data.investmentEntries.push(
      { id: crypto.randomUUID(), investmentId, date: "2026-01-02", kind: "contribution", amount: 1_000, description: "Initial", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), investmentId, date: "2026-02-01", kind: "valuation", amount: 1_050, description: "Observed value", notes: "" },
      { id: crypto.randomUUID(), investmentId, date: "2025-12-15", kind: "contribution_correction", amount: 75, description: "Inherited contribution difference", notes: "" },
      { id: crypto.randomUUID(), investmentId, date: "2025-12-16", kind: "withdrawal_correction", amount: 20, description: "Inherited liquidation difference", notes: "" },
    );

    expect(investmentMovementTotals(data, investmentId)).toEqual({
      initialCapital: 1_000,
      subsequentContributions: 75,
      liquidations: 20,
      balance: 1_055,
    });
    expect(investmentPositionValue(data, data.investments[0])).toBe(1_050);
    expect(portfolioValues(data).investments).toBe(1_050);
  });

  it("compares the latest two valuation observations for the card trend", () => {
    const data = createEmptyFinanceData(2026);
    const investmentId = crypto.randomUUID();
    data.investments.push({
      id: investmentId, name: "Synthetic trend fund", kind: "fund", provider: "", currency: "EUR",
      active: true, openedAt: "2025-01-01", notes: "",
    });
    data.investmentAnnualSummaries.push({ investmentId, year: 2025, closingValue: 1_000, contributions: 1_000, withdrawals: 0 });
    data.investmentEntries.push({ id: crypto.randomUUID(), investmentId, date: "2026-04-01", kind: "valuation", amount: 1_100, description: "Spring value", notes: "" });
    expect(investmentValuationTrend(data, investmentId)).toBe("up");

    data.investmentEntries.push(
      { id: crypto.randomUUID(), investmentId, date: "2026-06-01", kind: "contribution_correction", amount: 500, description: "Correction ignored by trend", notes: "" },
      { id: crypto.randomUUID(), investmentId, date: "2026-07-01", kind: "valuation", amount: 980, description: "Summer value", notes: "" },
    );
    expect(investmentValuationTrend(data, investmentId)).toBe("down");
  });

  it("aggregates movement boxes from active pension compartments without counting the collector", () => {
    const data = createEmptyFinanceData(2026);
    const pensionTypeId = data.investmentTypes.find((item) => item.code === "pension")!.id;
    const pensionId = crypto.randomUUID();
    const firstId = crypto.randomUUID();
    const secondId = crypto.randomUUID();
    data.investments.push(
      { id: pensionId, name: "Synthetic pension", kind: "pension", typeId: pensionTypeId, provider: "", currency: "EUR", active: true, openedAt: "2025-01-01", notes: "" },
      { id: firstId, name: "First compartment", kind: "pension", typeId: pensionTypeId, parentInvestmentId: pensionId, provider: "", currency: "EUR", active: true, openedAt: "2025-01-01", notes: "" },
      { id: secondId, name: "Closed compartment", kind: "pension", typeId: pensionTypeId, parentInvestmentId: pensionId, provider: "", currency: "EUR", active: false, openedAt: "2025-01-01", closedAt: "2025-12-31", notes: "" },
    );
    data.investmentEntries.push(
      { id: crypto.randomUUID(), investmentId: firstId, date: "2026-01-10", kind: "contribution", amount: 500, description: "Initial", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), investmentId: firstId, date: "2026-02-10", kind: "contribution", amount: 100, description: "Later", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), investmentId: firstId, date: "2026-03-10", kind: "withdrawal", amount: 50, description: "Liquidation", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), investmentId: secondId, date: "2025-02-10", kind: "contribution", amount: 9_000, description: "Closed capital", categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
    );

    expect(investmentPositionMovementTotals(data, data.investments[0])).toEqual({
      initialCapital: 500,
      subsequentContributions: 100,
      liquidations: 50,
      balance: 550,
    });
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
