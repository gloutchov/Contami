import { describe, expect, it } from "vitest";
import { accountBalance } from "../../src/domain/accounts";
import { applyFinanceCommand, computeDashboard, createEmptyFinanceData as createBaseFinanceData } from "../../src/domain/finance";
import { investmentInvestedCapital, investmentMovementTotals, investmentPositionValue, portfolioValues } from "../../src/domain/investments";
import { rentInstallmentsForProperty } from "../../src/domain/rent";

function createEmptyFinanceData(year: number) {
  const data = createBaseFinanceData(year);
  data.accounts.push({ id: "00000000-0000-4000-8000-0000000000a1", name: "Synthetic bank", kind: "bank", currency: "EUR", openingBalance: 0, active: true, openedAt: `${year}-01-01`, notes: "" });
  return data;
}

describe("linked finance records", () => {
  it("keeps a property transaction and a shared expense synchronized", () => {
    let data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addProperty", value: {
      id: propertyId, name: "Casa", kind: "apartment", usage: "residence",
      ownershipShare: 1, purchasePrice: 200_000, active: true, notes: "",
    } });
    const timestamp = new Date().toISOString();
    const transactionId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addTransaction", value: {
      id: transactionId, date: "2026-03-10", description: "Condominio",
      categoryId: data.categories.find((item) => item.kind === "expense")!.id,
      paymentMethodId: data.paymentMethods[0].id, kind: "expense", amount: 100,
      currency: "EUR", propertyId, shared: true, sharedPaidBy: "owner",
      sharedSettled: false, notes: "", createdAt: timestamp, updatedAt: timestamp,
    } });

    expect(data.propertyEntries).toHaveLength(1);
    expect(data.propertyEntries[0]).toMatchObject({ transactionId, propertyId, amount: 100 });
    expect(data.sharedExpenses).toHaveLength(1);
    expect(data.sharedExpenses[0]).toMatchObject({ transactionId, ownerShare: 50, partnerShare: 50 });

    data = applyFinanceCommand(data, {
      type: "updateTransaction",
      value: { ...data.transactions[0], amount: 120 },
    });
    expect(data.propertyEntries[0].amount).toBe(120);
    expect(data.sharedExpenses[0]).toMatchObject({ amount: 120, ownerShare: 60, partnerShare: 60 });

    data = applyFinanceCommand(data, { type: "deleteEntity", entity: "transaction", id: transactionId });
    expect(data.transactions).toHaveLength(0);
    expect(data.propertyEntries).toHaveLength(0);
    expect(data.sharedExpenses).toHaveLength(0);
  });

  it("creates a transaction when an investment movement is entered", () => {
    let data = createEmptyFinanceData(2026);
    const investmentId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addInvestment", value: {
      id: investmentId, name: "ETF", kind: "etf", typeId: data.investmentTypes[4].id,
      provider: "", currency: "EUR", active: true, openedAt: "2026-01-01", notes: "",
    } });
    const entryId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addInvestmentEntry", value: {
      id: entryId, investmentId, date: "2026-04-02", kind: "contribution", amount: 250,
      description: "Versamento ETF", categoryId: data.categories.find((item) => item.nameIt === "Investimenti")!.id,
      paymentMethodId: data.paymentMethods[0].id, notes: "",
    } });

    expect(data.transactions).toHaveLength(1);
    expect(data.transactions[0]).toMatchObject({ kind: "transfer", cashFlowDirection: "outflow", investmentId, investmentEntryId: entryId, amount: 250 });
    expect(data.investmentEntries[0].transactionId).toBe(data.transactions[0].id);
  });

  it("keeps manual investment corrections outside Transactions and liquidity", () => {
    let data = createEmptyFinanceData(2026);
    data.accounts[0].openingBalance = 1_000;
    const investmentId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addInvestment", value: {
      id: investmentId, name: "Synthetic inherited fund", kind: "fund", typeId: data.investmentTypes[1].id,
      provider: "", currency: "EUR", active: true, openedAt: "2026-01-01", notes: "",
    } });
    data = applyFinanceCommand(data, { type: "addInvestmentEntry", value: {
      id: crypto.randomUUID(), investmentId, date: "2026-01-10", kind: "contribution", amount: 250,
      description: "Actual contribution", categoryId: data.categories[8].id,
      paymentMethodId: data.paymentMethods[0].id, accountId: data.accounts[0].id, notes: "",
    } });
    const correctionId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addInvestmentCorrection", value: {
      id: correctionId, investmentId, date: "2025-12-31", kind: "contribution_correction", amount: 40,
      description: "Inherited contribution difference", notes: "",
    } });
    data = applyFinanceCommand(data, { type: "addInvestmentCorrection", value: {
      id: crypto.randomUUID(), investmentId, date: "2025-12-31", kind: "withdrawal_correction", amount: 10,
      description: "Inherited liquidation difference", notes: "",
    } });

    expect(data.transactions).toHaveLength(1);
    expect(accountBalance(data, data.accounts[0].id)).toBe(750);
    expect(investmentPositionValue(data, data.investments[0])).toBe(250);
    expect(investmentMovementTotals(data, investmentId)).toEqual({
      initialCapital: 250, subsequentContributions: 40, liquidations: 10, balance: 280,
    });

    data = applyFinanceCommand(data, { type: "updateInvestmentCorrection", value: {
      ...data.investmentEntries.find((item) => item.id === correctionId)!, amount: 55,
    } });
    expect(data.transactions).toHaveLength(1);
    expect(accountBalance(data, data.accounts[0].id)).toBe(750);
    expect(investmentMovementTotals(data, investmentId).subsequentContributions).toBe(55);
  });

  it("replaces repeated current-year corrections and reverses the linked cash-flow direction", () => {
    let data = createEmptyFinanceData(2026);
    data.accounts[0].openingBalance = 1_000;
    const investmentId = crypto.randomUUID();
    const entryId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addInvestment", value: {
      id: investmentId, name: "Synthetic corrected fund", kind: "fund", typeId: data.investmentTypes[1].id,
      provider: "", currency: "EUR", active: true, openedAt: "2026-01-01", notes: "",
    } });
    data = applyFinanceCommand(data, { type: "addInvestmentEntry", value: {
      id: entryId, investmentId, date: "2026-04-02", kind: "contribution", amount: 250,
      description: "Synthetic contribution", categoryId: data.categories.find((item) => item.nameIt === "Investimenti")!.id,
      paymentMethodId: data.paymentMethods[0].id, accountId: data.accounts[0].id, notes: "",
    } });
    const transactionId = data.investmentEntries[0].transactionId;

    data = applyFinanceCommand(data, { type: "updateInvestmentEntry", value: {
      ...data.investmentEntries[0], amount: 275,
    } });
    data = applyFinanceCommand(data, { type: "updateInvestmentEntry", value: {
      ...data.investmentEntries[0], amount: 100, kind: "withdrawal", description: "Synthetic liquidation",
    } });

    expect(data.investmentEntries).toHaveLength(1);
    expect(data.transactions).toHaveLength(1);
    expect(data.investmentEntries[0]).toMatchObject({ id: entryId, transactionId, amount: 100, kind: "withdrawal" });
    expect(data.transactions[0]).toMatchObject({
      id: transactionId, investmentEntryId: entryId, amount: 100, cashFlowDirection: "inflow",
    });
    expect(investmentInvestedCapital(data, investmentId)).toBe(0);
    expect(accountBalance(data, data.accounts[0].id)).toBe(1_100);
  });

  it("keeps contributions and withdrawals bidirectional for investments and pension compartments", () => {
    let data = createEmptyFinanceData(2026);
    const investmentId = crypto.randomUUID();
    const pensionId = crypto.randomUUID();
    const compartmentId = crypto.randomUUID();
    const pensionTypeId = data.investmentTypes.find((item) => item.code === "pension")!.id;
    const categoryId = data.categories.find((item) => item.nameIt === "Investimenti")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
    data = applyFinanceCommand(data, { type: "addInvestment", value: {
      id: investmentId, name: "Synthetic ETF", kind: "etf", typeId: data.investmentTypes.find((item) => item.code === "etf")!.id,
      provider: "", currency: "EUR", active: true, openedAt: "2026-01-01", notes: "",
    } });
    data = applyFinanceCommand(data, { type: "addInvestment", value: {
      id: pensionId, name: "Synthetic pension", kind: "pension", typeId: pensionTypeId,
      provider: "", currency: "EUR", active: true, openedAt: "2026-01-01", notes: "",
    } });
    data = applyFinanceCommand(data, { type: "addInvestment", value: {
      id: compartmentId, name: "Synthetic compartment", kind: "pension", typeId: pensionTypeId, parentInvestmentId: pensionId,
      provider: "", currency: "EUR", active: true, openedAt: "2026-01-01", notes: "",
    } });
    const inputs = [
      { investmentId, kind: "contribution" as const, direction: "outflow" as const, amount: 300 },
      { investmentId, kind: "withdrawal" as const, direction: "inflow" as const, amount: 90 },
      { investmentId: compartmentId, kind: "contribution" as const, direction: "outflow" as const, amount: 200 },
      { investmentId: compartmentId, kind: "withdrawal" as const, direction: "inflow" as const, amount: 50 },
    ];

    for (const [index, input] of inputs.entries()) {
      data = applyFinanceCommand(data, { type: "addInvestmentEntry", value: {
        id: crypto.randomUUID(), investmentId: input.investmentId, date: `2026-0${index + 1}-15`,
        kind: input.kind, amount: input.amount, description: `Synthetic movement ${index + 1}`,
        categoryId, paymentMethodId, notes: "",
      } });
    }

    expect(data.transactions).toHaveLength(4);
    inputs.forEach((input, index) => {
      const entry = data.investmentEntries[index]!;
      const linked = data.transactions.find((item) => item.id === entry.transactionId);
      expect(linked).toMatchObject({
        investmentId: input.investmentId,
        investmentEntryId: entry.id,
        kind: "transfer",
        cashFlowDirection: input.direction,
        amount: input.amount,
      });
    });

    const withdrawal = data.investmentEntries[1]!;
    data = applyFinanceCommand(data, { type: "updateInvestmentEntry", value: {
      ...withdrawal, amount: 110, description: "Updated liquidation",
    } });
    expect(data.transactions.find((item) => item.id === withdrawal.transactionId)).toMatchObject({
      amount: 110,
      description: "Updated liquidation",
      cashFlowDirection: "inflow",
    });

    data = applyFinanceCommand(data, { type: "deleteEntity", entity: "investmentEntry", id: withdrawal.id });
    expect(data.investmentEntries.some((item) => item.id === withdrawal.id)).toBe(false);
    expect(data.transactions.some((item) => item.id === withdrawal.transactionId)).toBe(false);
  });

  it("updates a legacy historical investment movement in place without moving it into current cash flows", () => {
    let data = createEmptyFinanceData(2026);
    data.accounts[0].openingBalance = 1_000;
    const investmentId = crypto.randomUUID();
    const entryId = crypto.randomUUID();
    const transactionId = crypto.randomUUID();
    const categoryId = data.categories.find((item) => item.nameIt === "Investimenti")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
    const accountId = data.accounts[0].id;
    const timestamp = new Date().toISOString();
    data.investments.push({
      id: investmentId, name: "Synthetic legacy fund", kind: "fund", typeId: data.investmentTypes[1].id,
      provider: "", currency: "EUR", active: true, openedAt: "2025-01-01", notes: "",
    });
    data.investmentEntries.push({
      id: entryId, investmentId, date: "2025-06-10", kind: "contribution", amount: 500,
      description: "Synthetic historical contribution", categoryId, paymentMethodId, accountId, transactionId, notes: "",
    });
    data.transactions.push({
      id: transactionId, date: "2025-06-10", description: "Synthetic historical contribution",
      categoryId, paymentMethodId, accountId, kind: "transfer", cashFlowDirection: "outflow", amount: 500,
      currency: "EUR", investmentId, investmentEntryId: entryId, shared: false, planned: false,
      sharedPaidBy: "owner", sharedSettled: false, notes: "", createdAt: timestamp, updatedAt: timestamp,
    });
    data.investmentAnnualSummaries.push({
      investmentId, year: 2025, closingValue: 525, contributions: 500, withdrawals: 0,
      closingValueObservedAt: "2025-12-31", returnRate: 0.05,
      returnMethod: "original_dietz_estimate", returnCoverage: "estimated", returnPartialPeriod: false,
    });

    expect(accountBalance(data, accountId)).toBe(1_000);
    data = applyFinanceCommand(data, { type: "updateInvestmentEntry", value: {
      ...data.investmentEntries[0], amount: 450, description: "Corrected synthetic contribution",
    } });
    data = applyFinanceCommand(data, { type: "updateInvestmentEntry", value: {
      ...data.investmentEntries[0], amount: 475,
    } });
    data = applyFinanceCommand(data, { type: "updateTransaction", value: {
      ...data.transactions[0], amount: 480, description: "Corrected from Transactions",
    } });

    expect(data.investmentEntries).toHaveLength(1);
    expect(data.transactions).toHaveLength(1);
    expect(data.investmentEntries[0]).toMatchObject({ id: entryId, transactionId, amount: 480, description: "Corrected from Transactions" });
    expect(data.transactions[0]).toMatchObject({ id: transactionId, investmentEntryId: entryId, amount: 480, cashFlowDirection: "outflow" });
    expect(data.investmentAnnualSummaries[0]).toMatchObject({ contributions: 480, withdrawals: 0 });
    expect(data.investmentAnnualSummaries[0].returnRate).toBeUndefined();
    expect(data.investmentAnnualSummaries[0].returnMethod).toBeUndefined();
    expect(investmentInvestedCapital(data, investmentId)).toBe(480);
    expect(accountBalance(data, accountId)).toBe(1_000);
  });

  it("invalidates persisted returns for an edited valuation and its collector", () => {
    let data = createEmptyFinanceData(2026);
    const parentId = crypto.randomUUID();
    const investmentId = crypto.randomUUID();
    const valuationId = crypto.randomUUID();
    data.investments.push(
      { id: parentId, name: "Synthetic collector", kind: "pension", provider: "", currency: "EUR", active: true, openedAt: "2025-01-01", notes: "" },
      { id: investmentId, parentInvestmentId: parentId, name: "Synthetic compartment", kind: "pension", provider: "", currency: "EUR", active: true, openedAt: "2025-01-01", notes: "" },
    );
    data.investmentEntries.push({
      id: valuationId, investmentId, date: "2025-12-31", kind: "valuation", amount: 105,
      description: "Synthetic historical valuation", notes: "",
    });
    data.investmentAnnualSummaries.push(
      {
        investmentId, year: 2025, closingValue: 105, contributions: 100, withdrawals: 0,
        closingValueObservedAt: "2025-12-31", returnRate: 0.05,
        returnMethod: "original_dietz_estimate", returnCoverage: "estimated", returnPartialPeriod: false,
      },
      {
        investmentId: parentId, year: 2025, closingValue: 0, contributions: 0, withdrawals: 0,
        closingValueObservedAt: "2025-12-31", returnRate: 0.05,
        returnMethod: "original_dietz_estimate", returnCoverage: "estimated", returnPartialPeriod: false,
      },
    );

    data = applyFinanceCommand(data, { type: "updateInvestmentEntry", value: {
      ...data.investmentEntries[0], amount: 106,
    } });

    expect(data.investmentAnnualSummaries.map((summary) => summary.returnRate)).toEqual([undefined, undefined]);
    expect(data.investmentAnnualSummaries[0]).toMatchObject({ contributions: 100, withdrawals: 0 });
  });

  it("does not allow a legacy movement to acquire a new invalid historical account date", () => {
    const data = createEmptyFinanceData(2026);
    const investmentId = crypto.randomUUID();
    const entryId = crypto.randomUUID();
    const transactionId = crypto.randomUUID();
    const categoryId = data.categories.find((item) => item.nameIt === "Investimenti")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
    const accountId = data.accounts[0].id;
    const timestamp = new Date().toISOString();
    data.investments.push({
      id: investmentId, name: "Synthetic legacy fund", kind: "fund", typeId: data.investmentTypes[1].id,
      provider: "", currency: "EUR", active: true, openedAt: "2025-01-01", notes: "",
    });
    data.investmentEntries.push({
      id: entryId, investmentId, date: "2025-06-10", kind: "contribution", amount: 500,
      description: "Synthetic historical contribution", categoryId, paymentMethodId, accountId, transactionId, notes: "",
    });
    data.transactions.push({
      id: transactionId, date: "2025-06-10", description: "Synthetic historical contribution",
      categoryId, paymentMethodId, accountId, kind: "transfer", cashFlowDirection: "outflow", amount: 500,
      currency: "EUR", investmentId, investmentEntryId: entryId, shared: false, planned: false,
      sharedPaidBy: "owner", sharedSettled: false, notes: "", createdAt: timestamp, updatedAt: timestamp,
    });

    expect(() => applyFinanceCommand(data, { type: "updateInvestmentEntry", value: {
      ...data.investmentEntries[0], date: "2025-07-10", amount: 450,
    } })).toThrow("ACCOUNT_REQUIRED");
  });

  it("confirms a periodic contribution in place without duplicating its movement", () => {
    let data = createEmptyFinanceData(2026);
    const categoryId = data.categories.find((item) => item.nameIt === "Investimenti")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
    const accountId = crypto.randomUUID();
    const investmentId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addAccount", value: {
      id: accountId, name: "Synthetic account", kind: "bank", currency: "EUR",
      openingBalance: 1_000, active: true, openedAt: "2026-01-01", notes: "",
    } });
    data = applyFinanceCommand(data, { type: "addInvestment", value: {
      id: investmentId, name: "Synthetic recurring ETF", kind: "etf", typeId: data.investmentTypes.find((item) => item.code === "etf")!.id,
      provider: "", currency: "EUR", periodicAmount: 100, periodicFrequency: "monthly",
      periodicNextDueDate: "2026-09-01", periodicCategoryId: categoryId,
      periodicPaymentMethodId: paymentMethodId, periodicAccountId: accountId,
      active: true, openedAt: "2026-01-01", notes: "",
    } });
    const planned = data.transactions.find((item) => item.investmentId === investmentId && item.planned)!;
    const plannedEntryId = planned.investmentEntryId!;

    data = applyFinanceCommand(data, { type: "updateTransaction", value: {
      ...planned,
      planned: false,
      updatedAt: new Date().toISOString(),
    } });

    expect(data.transactions.filter((item) => item.id === planned.id)).toHaveLength(1);
    expect(data.investmentEntries.filter((item) => item.id === plannedEntryId)).toHaveLength(1);
    expect(data.transactions.find((item) => item.id === planned.id)).toMatchObject({
      planned: false,
      recurringId: planned.recurringId,
      investmentEntryId: plannedEntryId,
      accountId,
    });
    expect(data.investmentEntries.find((item) => item.id === plannedEntryId)).toMatchObject({
      transactionId: planned.id,
      kind: "contribution",
      amount: 100,
      accountId,
    });
  });

  it("creates and updates a pension movement from a cash-affecting transaction", () => {
    let data = createEmptyFinanceData(2026);
    const accountId = crypto.randomUUID();
    const pensionId = crypto.randomUUID();
    const compartmentId = crypto.randomUUID();
    const pensionTypeId = data.investmentTypes.find((item) => item.code === "pension")!.id;
    const categoryId = data.categories.find((item) => item.nameIt === "Investimenti")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
    const timestamp = new Date().toISOString();
    data = applyFinanceCommand(data, { type: "addAccount", value: {
      id: accountId, name: "Synthetic account", kind: "bank", currency: "EUR",
      openingBalance: 1_000, active: true, openedAt: "2026-01-01", notes: "",
    } });
    data = applyFinanceCommand(data, { type: "addInvestment", value: {
      id: pensionId, name: "Synthetic pension", kind: "pension", typeId: pensionTypeId,
      provider: "", currency: "EUR", active: true, openedAt: "2026-01-01", notes: "",
    } });
    data = applyFinanceCommand(data, { type: "addInvestment", value: {
      id: compartmentId, name: "Synthetic compartment", kind: "pension", typeId: pensionTypeId, parentInvestmentId: pensionId,
      provider: "", currency: "EUR", active: true, openedAt: "2026-01-01", notes: "",
    } });
    const transactionId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addTransaction", value: {
      id: transactionId, date: "2026-08-10", description: "Synthetic pension contribution",
      categoryId, paymentMethodId, accountId, kind: "transfer", cashFlowDirection: "outflow",
      amount: 200, currency: "EUR", investmentId: compartmentId, notes: "",
      createdAt: timestamp, updatedAt: timestamp,
    } });

    expect(data.investmentEntries).toHaveLength(1);
    const entryId = data.transactions[0]!.investmentEntryId!;
    expect(data.investmentEntries[0]).toMatchObject({
      id: entryId,
      transactionId,
      investmentId: compartmentId,
      kind: "contribution",
      amount: 200,
    });
    expect(data.transactions[0]).toMatchObject({ accountId, investmentEntryId: entryId });
    expect(computeDashboard(data)).toMatchObject({ liquidBalance: 800, yearIncome: 0, yearExpenses: 0 });

    data = applyFinanceCommand(data, { type: "updateTransaction", value: {
      ...data.transactions[0]!,
      description: "Synthetic pension liquidation",
      cashFlowDirection: "inflow",
      amount: 75,
    } });
    expect(data.investmentEntries[0]).toMatchObject({
      id: entryId,
      kind: "withdrawal",
      description: "Synthetic pension liquidation",
      amount: 75,
    });
    expect(data.transactions).toHaveLength(1);
    expect(data.investmentEntries).toHaveLength(1);
    expect(computeDashboard(data)).toMatchObject({ liquidBalance: 1_075, yearIncome: 0, yearExpenses: 0 });
  });

  it("creates an investment with an initial countervalue and a non-recurring transaction", () => {
    const data = createEmptyFinanceData(2026);
    const investmentId = crypto.randomUUID();
    const entryId = crypto.randomUUID();
    const categoryId = data.categories.find((item) => item.nameIt === "Investimenti")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
    const next = applyFinanceCommand(data, { type: "addInvestmentWithInitialContribution", value: {
      investment: {
        id: investmentId, name: "Synthetic fund", kind: "fund", typeId: data.investmentTypes[1].id,
        provider: "", currency: "EUR", periodicAmount: 100, periodicFrequency: "monthly",
        periodicNextDueDate: "2026-09-01", periodicCategoryId: categoryId, periodicPaymentMethodId: paymentMethodId,
        active: true, openedAt: "2026-07-20", notes: "",
      },
      initialContribution: {
        id: entryId, investmentId, date: "2026-07-20", kind: "contribution", amount: 2_500,
        description: "Initial contribution", categoryId, paymentMethodId, notes: "",
      },
    } });

    const initialTransaction = next.transactions.find((item) => item.investmentEntryId === entryId)!;
    expect(initialTransaction).toMatchObject({ amount: 2_500, kind: "transfer", cashFlowDirection: "outflow" });
    expect(initialTransaction.recurringId).toBeUndefined();
    expect(initialTransaction.planned).toBeUndefined();
    expect(next.investmentEntries.find((item) => item.id === entryId)?.transactionId).toBe(initialTransaction.id);
    expect(portfolioValues(next).investments).toBe(2_500);
  });

  it("creates one linked property expense and an optional shared split", () => {
    let data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addProperty", value: {
      id: propertyId, name: "Home", kind: "apartment", usage: "residence", areaSqm: 100,
      ownershipShare: 1, purchasePrice: 200_000, active: true, notes: "",
    } });
    const entryId = crypto.randomUUID();
    const sharedId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addPropertyExpense", value: {
      entry: {
        id: entryId, propertyId, date: "2026-06-30", kind: "expense", category: "Electricity",
        categoryId: data.categories[3].id, description: "Electricity bill", amount: 180,
        quantity: 310, unit: "kWh", detailKind: "utility_electricity",
        electricityKwhF1: 100, electricityKwhF2: 80, electricityKwhF3: 130,
        paymentMethodId: data.paymentMethods[0].id, isCommonExpense: false, notes: "",
      },
      shared: { id: sharedId, ownerShare: 120, partnerShare: 60, paidBy: "owner", settled: false },
    } });

    expect(data.transactions).toHaveLength(1);
    expect(data.transactions[0]).toMatchObject({ propertyId, propertyEntryId: entryId, sharedExpenseId: sharedId, amount: 180 });
    expect(data.sharedExpenses[0]).toMatchObject({ id: sharedId, transactionId: data.transactions[0].id, ownerShare: 120, partnerShare: 60 });
    expect(data.propertyEntries[0]).toMatchObject({ transactionId: data.transactions[0].id, quantity: 310, detailKind: "utility_electricity" });

    data = applyFinanceCommand(data, { type: "updatePropertyExpense", value: { entry: { ...data.propertyEntries[0], amount: 200 } } });
    expect(data.transactions[0]).toMatchObject({ amount: 200, shared: false });
    expect(data.sharedExpenses).toHaveLength(0);

    data = applyFinanceCommand(data, { type: "updatePropertyExpense", value: {
      entry: data.propertyEntries[0],
      shared: { id: crypto.randomUUID(), ownerShare: 100, partnerShare: 100, paidBy: "owner", settled: false },
    } });
    data = applyFinanceCommand(data, { type: "deleteEntity", entity: "propertyEntry", id: entryId });
    expect(data.propertyEntries).toHaveLength(0);
    expect(data.transactions).toHaveLength(0);
    expect(data.sharedExpenses).toHaveLength(0);
  });

  it("automatically splits a generic property expense and removes the link when disabled", () => {
    let data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    const entryId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addProperty", value: {
      id: propertyId, name: "Synthetic home", kind: "apartment", usage: "residence",
      ownershipShare: 1, purchasePrice: 200_000, active: true, notes: "",
    } });

    data = applyFinanceCommand(data, { type: "addPropertyEntryWithSharedExpense", value: {
      entry: {
        id: entryId, propertyId, date: "2026-07-10", kind: "expense", category: "Home",
        categoryId: data.categories[3].id, description: "Synthetic shared property expense", amount: 101.01,
        paymentMethodId: data.paymentMethods[0].id, accountId: data.accounts[0].id, notes: "",
      },
      shared: { paidBy: "partner", settled: false },
    } });

    expect(data.transactions).toHaveLength(1);
    expect(data.transactions[0]).toMatchObject({ propertyId, propertyEntryId: entryId, shared: true, sharedPaidBy: "partner" });
    expect(data.sharedExpenses).toHaveLength(1);
    expect(data.sharedExpenses[0]).toMatchObject({ amount: 101.01, ownerShare: 50.51, partnerShare: 50.5, paidBy: "partner" });

    data = applyFinanceCommand(data, { type: "updatePropertyEntryWithSharedExpense", value: {
      entry: { ...data.propertyEntries[0], description: "Private property expense" },
    } });
    expect(data.transactions[0]).toMatchObject({ description: "Private property expense", shared: false });
    expect(data.transactions[0].sharedExpenseId).toBeUndefined();
    expect(data.sharedExpenses).toHaveLength(0);

    data = applyFinanceCommand(data, { type: "updatePropertyEntryWithSharedExpense", value: {
      entry: data.propertyEntries[0],
      shared: { paidBy: "owner", settled: false },
    } });
    data = applyFinanceCommand(data, { type: "updatePropertyEntryWithSharedExpense", value: {
      entry: {
        ...data.propertyEntries[0], kind: "valuation", amount: 250_000,
        categoryId: undefined, paymentMethodId: undefined, accountId: undefined,
      },
    } });
    expect(data.propertyEntries[0]).toMatchObject({ kind: "valuation", amount: 250_000 });
    expect(data.propertyEntries[0].transactionId).toBeUndefined();
    expect(data.transactions).toHaveLength(0);
    expect(data.sharedExpenses).toHaveLength(0);
  });

  it("turns a periodic investment into one recurrence and planned yearly transactions", () => {
    let data = createEmptyFinanceData(2026);
    const categoryId = data.categories.find((item) => item.nameIt === "Investimenti")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
    const investmentId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addInvestment", value: {
      id: investmentId, name: "Pensione", kind: "pension", typeId: data.investmentTypes[0].id,
      provider: "", currency: "EUR", periodicAmount: 100, periodicFrequency: "monthly",
      periodicNextDueDate: "2026-09-01", periodicCategoryId: categoryId,
      periodicPaymentMethodId: paymentMethodId, active: true, openedAt: "2026-01-01", notes: "",
    } });

    expect(data.recurringItems).toHaveLength(1);
    expect(data.recurringItems[0]).toMatchObject({ investmentId, kind: "investment", amount: 100 });
    expect(data.transactions.filter((item) => item.planned)).toHaveLength(4);
    expect(data.investmentEntries).toHaveLength(4);
    expect(data.transactions.every((item) => item.recurringId === data.recurringItems[0].id)).toBe(true);
  });

  it("creates a rental property income together with its rent recurrence", () => {
    let data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    const entryId = crypto.randomUUID();
    const recurringId = crypto.randomUUID();
    const categoryId = data.categories.find((item) => item.nameIt === "Affitti")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
    data = applyFinanceCommand(data, { type: "addProperty", value: {
      id: propertyId, name: "Rental home", kind: "apartment", usage: "rental", ownershipShare: 1,
      purchasePrice: 200_000, active: true, notes: "",
    } });

    data = applyFinanceCommand(data, { type: "addPropertyRentRecurring", value: {
      entry: {
        id: entryId, propertyId, date: "2026-03-05", kind: "income", category: "Affitti",
        categoryId, description: "Affitto marzo", amount: 750, paymentMethodId, notes: "",
      },
      recurring: {
        id: recurringId, name: "Affitto Rental home", kind: "rent", direction: "income",
        amount: 750, frequency: "monthly", categoryId, paymentMethodId, propertyId,
        nextDueDate: "2026-03-05", active: true, notes: "",
      },
    } });

    expect(data.recurringItems).toHaveLength(1);
    expect(data.recurringItems[0]).toMatchObject({ id: recurringId, kind: "rent", direction: "income", propertyId, amount: 750 });
    expect(data.properties[0]).toMatchObject({ expectedMonthlyRent: 750, rentDueDay: 5 });
    expect(data.propertyEntries.find((item) => item.id === entryId)).toMatchObject({ transactionId: expect.any(String) });
    expect(data.transactions.find((item) => item.propertyEntryId === entryId)).toMatchObject({ recurringId, planned: undefined });
    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.planned)).toHaveLength(9);
    expect(data.propertyEntries.filter((item) => item.propertyId === propertyId && item.kind === "income")).toHaveLength(10);
  });

  it("keeps the rent due date when a June installment is received in July", () => {
    let data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    const recurringId = crypto.randomUUID();
    const categoryId = data.categories.find((item) => item.nameIt === "Affitti")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
    data = applyFinanceCommand(data, { type: "addProperty", value: {
      id: propertyId, name: "Synthetic rental", kind: "apartment", usage: "rental", ownershipShare: 1,
      purchasePrice: 100_000, active: true, notes: "",
    } });
    data = applyFinanceCommand(data, { type: "addPropertyRentRecurring", value: {
      entry: {
        id: crypto.randomUUID(), propertyId, date: "2026-03-15", kind: "income", category: "Affitti",
        categoryId, description: "Synthetic rent", amount: 800, paymentMethodId, notes: "",
      },
      recurring: {
        id: recurringId, name: "Synthetic rent", kind: "rent", direction: "income", amount: 800,
        frequency: "monthly", categoryId, paymentMethodId, propertyId, nextDueDate: "2026-03-15",
        active: true, notes: "",
      },
    } });

    for (const [dueDate, paidAt] of [["2026-04-15", "2026-04-12"], ["2026-05-15", "2026-05-15"], ["2026-06-15", "2026-07-04"]] as const) {
      const planned = data.transactions.find((item) => item.recurringId === recurringId && item.dueDate === dueDate && item.planned)!;
      data = applyFinanceCommand(data, { type: "updateTransaction", value: {
        ...planned, date: paidAt, planned: false, updatedAt: new Date().toISOString(),
      } });
    }

    expect(data.transactions.find((item) => item.recurringId === recurringId && item.dueDate === "2026-06-15")).toMatchObject({
      date: "2026-07-04", planned: false,
    });
    expect(data.propertyEntries.find((item) => item.dueDate === "2026-06-15")).toMatchObject({ date: "2026-07-04" });
    expect(data.recurringItems.find((item) => item.id === recurringId)?.nextDueDate).toBe("2026-07-15");
    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.dueDate === "2026-07-15")).toHaveLength(1);
    expect(rentInstallmentsForProperty(data, propertyId, "2026-08-01").map((item) => [item.dueDate, item.status])).toEqual([
      ["2026-03-15", "paid"],
      ["2026-04-15", "paid"],
      ["2026-05-15", "paid"],
      ["2026-06-15", "paidLate"],
      ["2026-07-15", "overdue"],
      ["2026-08-15", "scheduled"],
      ["2026-09-15", "scheduled"],
      ["2026-10-15", "scheduled"],
      ["2026-11-15", "scheduled"],
      ["2026-12-15", "scheduled"],
    ]);

    const juneReceipt = data.transactions.find((item) => item.recurringId === recurringId && item.dueDate === "2026-06-15")!;
    data = applyFinanceCommand(data, { type: "updateTransaction", value: {
      ...juneReceipt, dueDate: "2026-07-15", updatedAt: new Date().toISOString(),
    } });
    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.dueDate === "2026-07-15")).toHaveLength(1);
    expect(rentInstallmentsForProperty(data, propertyId, "2026-08-01").filter((item) => item.dueDate === "2026-06-15"))
      .toMatchObject([{ status: "overdue", paidAt: undefined }]);

    const reassignedReceipt = data.transactions.find((item) => item.id === juneReceipt.id)!;
    data = applyFinanceCommand(data, { type: "updateTransaction", value: {
      ...reassignedReceipt, dueDate: "2026-06-15", updatedAt: new Date().toISOString(),
    } });
    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.dueDate === "2026-06-15")).toHaveLength(1);
    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.dueDate === "2026-07-15")).toHaveLength(1);
    expect(data.recurringItems.find((item) => item.id === recurringId)?.nextDueDate).toBe("2026-07-15");
  });

  it("keeps a month-end recurrence anchored after February", () => {
    let data = createEmptyFinanceData(2026);
    const recurringId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addRecurringItem", value: {
      id: recurringId, name: "Synthetic month-end service", kind: "service", direction: "expense",
      amount: 40, frequency: "monthly", categoryId: data.categories.find((item) => item.kind === "expense")!.id,
      paymentMethodId: data.paymentMethods[0].id, nextDueDate: "2026-01-31", active: true, notes: "",
    } });

    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.planned).slice(0, 4).map((item) => item.dueDate))
      .toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
    const january = data.transactions.find((item) => item.recurringId === recurringId && item.dueDate === "2026-01-31")!;
    data = applyFinanceCommand(data, { type: "updateTransaction", value: { ...january, planned: false } });

    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.planned).slice(0, 3).map((item) => item.dueDate))
      .toEqual(["2026-02-28", "2026-03-31", "2026-04-30"]);
  });

  it("keeps a confirmed annual occurrence on its due date and advances the recurrence by one year", () => {
    let data = createEmptyFinanceData(2026);
    const recurringId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addRecurringItem", value: {
      id: recurringId, name: "Synthetic annual service", kind: "subscription", direction: "expense",
      amount: 120, frequency: "yearly", categoryId: data.categories.find((item) => item.kind === "expense")!.id,
      paymentMethodId: data.paymentMethods[0].id, nextDueDate: "2026-12-20", active: true, notes: "",
    } });

    const planned = data.transactions.find((item) => item.recurringId === recurringId && item.planned)!;
    data = applyFinanceCommand(data, { type: "updateTransaction", value: {
      ...planned, planned: false, updatedAt: new Date().toISOString(),
    } });

    expect(data.transactions.find((item) => item.id === planned.id)).toMatchObject({
      date: "2026-12-20", dueDate: "2026-12-20", planned: false,
    });
    expect(data.recurringItems.find((item) => item.id === recurringId)?.nextDueDate).toBe("2027-12-20");
    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.planned)).toHaveLength(0);
  });

  it("limits installment plans and closes them after the final confirmation", () => {
    let data = createEmptyFinanceData(2026);
    const recurringId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addRecurringItem", value: {
      id: recurringId, name: "Synthetic five-installment payment", kind: "installment", direction: "expense",
      amount: 100, frequency: "monthly", categoryId: data.categories.find((item) => item.kind === "expense")!.id,
      paymentMethodId: data.paymentMethods[0].id, nextDueDate: "2026-01-15",
      remainingInstallments: 5, active: true, notes: "",
    } });

    const dates = ["2026-01-15", "2026-02-15", "2026-03-15", "2026-04-15", "2026-05-15"];
    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.planned).map((item) => item.date)).toEqual(dates);

    for (const [index, date] of dates.entries()) {
      const transaction = data.transactions.find((item) => item.recurringId === recurringId && item.date === date && item.planned)!;
      data = applyFinanceCommand(data, { type: "updateTransaction", value: { ...transaction, planned: false } });
      expect(data.recurringItems[0].remainingInstallments).toBe(4 - index);
      expect(data.transactions.filter((item) => item.recurringId === recurringId && item.planned)).toHaveLength(4 - index);
    }

    expect(data.recurringItems[0]).toMatchObject({
      id: recurringId, remainingInstallments: 0, active: false, closedAt: "2026-05-15",
    });
    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.planned)).toHaveLength(0);
    expect(data.transactions.filter((item) => item.recurringId === recurringId && !item.planned)).toHaveLength(5);
  });

  it("does not plan recurring transactions after their end date", () => {
    let data = createEmptyFinanceData(2026);
    const recurringId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addRecurringItem", value: {
      id: recurringId, name: "Synthetic limited service", kind: "service", direction: "expense",
      amount: 25, frequency: "monthly", categoryId: data.categories.find((item) => item.kind === "expense")!.id,
      paymentMethodId: data.paymentMethods[0].id, nextDueDate: "2026-01-20", endDate: "2026-03-20",
      active: true, notes: "",
    } });

    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.planned).map((item) => item.date))
      .toEqual(["2026-01-20", "2026-02-20", "2026-03-20"]);
  });

  it("creates and updates the linked transaction for a vehicle cost", () => {
    let data = createEmptyFinanceData(2026);
    const vehicleId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addVehicle", value: { id: vehicleId, name: "Synthetic car", manufacturer: "Example", model: "One", fuelType: "petrol", active: true, notes: "" } });
    const entryId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addVehicleEntry", value: {
      id: entryId, vehicleId, date: "2026-05-12", kind: "fuel", description: "Synthetic fuel",
      amount: 55, odometerKm: 10_000, distanceKm: 600, fuelLiters: 30, fuelUnitPrice: undefined, fuelType: undefined, vendor: undefined,
      categoryId: data.categories.find((item) => item.kind === "expense")!.id,
      paymentMethodId: data.paymentMethods[0].id, notes: "",
    } });

    expect(data.transactions).toHaveLength(1);
    expect(data.transactions[0]).toMatchObject({ vehicleId, vehicleEntryId: entryId, kind: "expense", amount: 55 });
    expect(data.vehicleEntries[0].transactionId).toBe(data.transactions[0].id);

    data = applyFinanceCommand(data, { type: "updateVehicleEntry", value: { ...data.vehicleEntries[0], amount: 60 } });
    expect(data.transactions[0].amount).toBe(60);
  });

  it("automatically splits a vehicle cost and keeps all three records linked", () => {
    let data = createEmptyFinanceData(2026);
    const vehicleId = crypto.randomUUID();
    const entryId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addVehicle", value: {
      id: vehicleId, name: "Synthetic car", manufacturer: "Example", model: "Two", fuelType: "hybrid", active: true, notes: "",
    } });

    data = applyFinanceCommand(data, { type: "addVehicleEntryWithSharedExpense", value: {
      entry: {
        id: entryId, vehicleId, date: "2026-07-11", kind: "insurance", description: "Synthetic shared insurance",
        amount: 80, categoryId: data.categories.find((item) => item.nameEn === "Transport")!.id,
        paymentMethodId: data.paymentMethods[0].id, accountId: data.accounts[0].id, notes: "",
      },
      shared: { paidBy: "owner", settled: false },
    } });

    const transactionId = data.vehicleEntries[0].transactionId!;
    const sharedExpenseId = data.transactions[0].sharedExpenseId!;
    expect(data.transactions[0]).toMatchObject({ id: transactionId, vehicleId, vehicleEntryId: entryId, shared: true, sharedExpenseId });
    expect(data.sharedExpenses[0]).toMatchObject({ id: sharedExpenseId, transactionId, ownerShare: 40, partnerShare: 40 });

    data = applyFinanceCommand(data, { type: "updateVehicleEntryWithSharedExpense", value: {
      entry: { ...data.vehicleEntries[0], amount: 100 },
      shared: { paidBy: "partner", settled: false },
    } });
    expect(data.sharedExpenses[0]).toMatchObject({ id: sharedExpenseId, amount: 100, ownerShare: 50, partnerShare: 50, paidBy: "partner" });
    expect(data.transactions[0]).toMatchObject({ sharedPaidBy: "partner" });

    data = applyFinanceCommand(data, { type: "updateVehicleEntryWithSharedExpense", value: {
      entry: data.vehicleEntries[0],
    } });
    expect(data.sharedExpenses).toHaveLength(0);
    expect(data.transactions[0]).toMatchObject({ shared: false });
    expect(data.transactions[0].sharedExpenseId).toBeUndefined();
  });
});
