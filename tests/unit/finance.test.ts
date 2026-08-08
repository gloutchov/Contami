import { describe, expect, it } from "vitest";
import { accountOpeningBalance, applyFinanceCommand, computeDashboard, createEmptyFinanceData, transactionAccountTotals, transactionCashTotals } from "../../src/domain/finance";

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

  it("counts directed transfers in cash totals while keeping them outside income and expenses", () => {
    const data = createEmptyFinanceData(2026);
    const timestamp = new Date().toISOString();
    const categoryId = data.categories.find((item) => item.nameIt === "Investimenti")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
    data.transactions.push(
      {
        id: crypto.randomUUID(), date: "2026-02-01", description: "Synthetic contribution",
        categoryId, paymentMethodId, kind: "transfer", cashFlowDirection: "outflow",
        amount: 250, currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp,
      },
      {
        id: crypto.randomUUID(), date: "2026-03-01", description: "Synthetic liquidation",
        categoryId, paymentMethodId, kind: "transfer", cashFlowDirection: "inflow",
        amount: 100, currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp,
      },
    );

    expect(transactionCashTotals(data.transactions)).toEqual({ inflows: 100, outflows: 250, net: -150 });
    expect(computeDashboard(data)).toMatchObject({ yearIncome: 0, yearExpenses: 0 });
  });

  it("does not apply planned transactions to current liquidity or actuals", () => {
    const data = createEmptyFinanceData(2026);
    const accountId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    data.accounts.push({
      id: accountId, name: "Synthetic account", kind: "bank", currency: "EUR",
      openingBalance: 1_000, active: true, openedAt: "2026-01-01", notes: "",
    });
    data.transactions.push({
      id: crypto.randomUUID(), date: "2026-12-01", description: "Planned contribution",
      categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id,
      accountId, kind: "transfer", cashFlowDirection: "outflow", amount: 250, currency: "EUR",
      planned: true, notes: "", createdAt: timestamp, updatedAt: timestamp,
    });

    expect(computeDashboard(data)).toMatchObject({ liquidBalance: 1_000, yearIncome: 0, yearExpenses: 0 });
  });

  it("separates filtered account and cash-register totals, balances, and internal transfers", () => {
    const data = createEmptyFinanceData(2026);
    const bankId = crypto.randomUUID();
    const cashId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const incomeCategoryId = data.categories.find((item) => item.kind === "income")!.id;
    const expenseCategoryId = data.categories.find((item) => item.kind === "expense")!.id;
    const transferCategoryId = data.categories.find((item) => item.kind === "both")!.id;
    const accountMethodId = data.paymentMethods.find((item) => item.kind !== "cash")!.id;
    const cashMethodId = data.paymentMethods.find((item) => item.kind === "cash")!.id;
    data.accounts.push(
      { id: bankId, name: "Synthetic bank", kind: "bank", currency: "EUR", openingBalance: 1_000, active: true, openedAt: "2026-01-01", notes: "" },
      { id: cashId, name: "Synthetic cash", kind: "cash", defaultFundingAccountId: bankId, currency: "EUR", openingBalance: 50, active: true, openedAt: "2026-01-01", notes: "" },
    );
    data.transactions.push(
      { id: crypto.randomUUID(), date: "2026-02-01", description: "Synthetic account income", categoryId: incomeCategoryId, paymentMethodId: accountMethodId, accountId: bankId, kind: "income", amount: 200, currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp },
      { id: crypto.randomUUID(), date: "2026-02-02", description: "Synthetic ATM withdrawal", categoryId: transferCategoryId, paymentMethodId: accountMethodId, accountId: bankId, destinationAccountId: cashId, kind: "transfer", cashFlowDirection: "neutral", amount: 100, currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp },
      { id: crypto.randomUUID(), date: "2026-02-03", description: "Synthetic cash expense", categoryId: expenseCategoryId, paymentMethodId: cashMethodId, accountId: cashId, kind: "expense", amount: 20, currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp },
      { id: crypto.randomUUID(), date: "2026-12-01", description: "Synthetic planned account expense", categoryId: expenseCategoryId, paymentMethodId: accountMethodId, accountId: bankId, kind: "expense", amount: 40, currency: "EUR", planned: true, notes: "", createdAt: timestamp, updatedAt: timestamp },
    );

    const cashOnly = data.transactions.filter((item) => item.paymentMethodId === cashMethodId);
    expect(transactionAccountTotals(data, cashOnly, "account", { includePlanned: true })).toEqual({
      inflows: 0, outflows: 0, net: 0, openingBalance: 1_000, balance: 1_000,
    });
    expect(transactionAccountTotals(data, cashOnly, "cashRegister", { includePlanned: true })).toEqual({
      inflows: 0, outflows: 20, net: -20, openingBalance: 50, balance: 30,
    });
    expect(transactionAccountTotals(data, cashOnly, "cashRegister", {
      includePlanned: true, includeOpeningBalance: false,
    })).toEqual({
      inflows: 0, outflows: 20, net: -20, openingBalance: 50, balance: -20,
    });
    expect(transactionAccountTotals(data, data.transactions, "account", { includePlanned: true })).toEqual({
      inflows: 200, outflows: 140, net: 60, openingBalance: 1_000, balance: 1_060,
    });
    expect(transactionAccountTotals(data, data.transactions, "cashRegister", { includePlanned: true })).toEqual({
      inflows: 100, outflows: 20, net: 80, openingBalance: 50, balance: 130,
    });
    expect(computeDashboard(data)).toMatchObject({ liquidBalance: 1_230, cashRegisterBalance: 130, yearIncome: 200, yearExpenses: 20 });
  });

  it("ignores account movements before opening and exposes opening cash separately", () => {
    const data = createEmptyFinanceData(2026);
    const accountId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    data.accounts.push({
      id: accountId, name: "Synthetic account", kind: "bank", currency: "EUR",
      openingBalance: 1_000, active: true, openedAt: "2026-01-01", notes: "",
    });
    data.transactions.push(
      {
        id: crypto.randomUUID(), date: "2025-12-01", description: "Historical outflow",
        categoryId: data.categories[8].id, paymentMethodId: data.paymentMethods[0].id,
        accountId, kind: "transfer", cashFlowDirection: "outflow", amount: 5_000, currency: "EUR",
        notes: "", createdAt: timestamp, updatedAt: timestamp,
      },
      {
        id: crypto.randomUUID(), date: "2026-02-01", description: "Current inflow",
        categoryId: data.categories[0].id, paymentMethodId: data.paymentMethods[0].id,
        accountId, kind: "income", amount: 250, currency: "EUR",
        notes: "", createdAt: timestamp, updatedAt: timestamp,
      },
    );

    expect(accountOpeningBalance(data)).toBe(1_000);
    expect(accountOpeningBalance(data, "2025-12-31")).toBe(0);
    expect(computeDashboard(data).liquidBalance).toBe(1_250);
  });
});
