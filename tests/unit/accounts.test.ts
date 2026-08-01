import { describe, expect, it } from "vitest";
import { accountBalance } from "../../src/domain/accounts";
import { applyFinanceCommand, computeDashboard, createEmptyFinanceData } from "../../src/domain/finance";

describe("cash registers and internal transfers", () => {
  function setup() {
    const data = createEmptyFinanceData(2026);
    const bankId = crypto.randomUUID();
    const cashId = crypto.randomUUID();
    data.accounts.push(
      { id: bankId, name: "Synthetic bank", kind: "bank", currency: "EUR", openingBalance: 1_000, active: true, openedAt: "2026-01-01", notes: "" },
      { id: cashId, name: "Synthetic cash", kind: "cash", defaultFundingAccountId: bankId, currency: "EUR", openingBalance: 50, active: true, openedAt: "2026-01-01", notes: "" },
    );
    return { data, bankId, cashId };
  }

  it("charges cash expenses only to the selected cash register", () => {
    const { data, bankId, cashId } = setup();
    const timestamp = new Date().toISOString();
    const next = applyFinanceCommand(data, { type: "addTransaction", value: {
      id: crypto.randomUUID(), date: "2026-03-01", description: "Synthetic cash expense",
      categoryId: data.categories.find((item) => item.kind === "expense")!.id,
      paymentMethodId: data.paymentMethods.find((item) => item.kind === "cash")!.id,
      accountId: cashId, kind: "expense", amount: 20, currency: "EUR", notes: "",
      createdAt: timestamp, updatedAt: timestamp,
    } });

    expect(accountBalance(next, bankId)).toBe(1_000);
    expect(accountBalance(next, cashId)).toBe(30);
    expect(computeDashboard(next)).toMatchObject({ liquidBalance: 1_030, cashRegisterBalance: 30 });
  });

  it("moves a withdrawal between bank and cash without changing total liquidity", () => {
    const { data, bankId, cashId } = setup();
    const timestamp = new Date().toISOString();
    const next = applyFinanceCommand(data, { type: "addTransaction", value: {
      id: crypto.randomUUID(), date: "2026-03-02", description: "Synthetic ATM withdrawal",
      categoryId: data.categories.find((item) => item.kind === "both")!.id,
      paymentMethodId: data.paymentMethods.find((item) => item.kind === "card")!.id,
      accountId: bankId, destinationAccountId: cashId, kind: "transfer", cashFlowDirection: "neutral",
      amount: 100, currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp,
    } });

    expect(accountBalance(next, bankId)).toBe(900);
    expect(accountBalance(next, cashId)).toBe(150);
    expect(computeDashboard(next)).toMatchObject({ liquidBalance: 1_050, cashRegisterBalance: 150, yearIncome: 0, yearExpenses: 0 });
  });

  it("rejects a cash payment assigned to a bank account", () => {
    const { data, bankId } = setup();
    const timestamp = new Date().toISOString();
    expect(() => applyFinanceCommand(data, { type: "addTransaction", value: {
      id: crypto.randomUUID(), date: "2026-03-01", description: "Invalid cash expense",
      categoryId: data.categories.find((item) => item.kind === "expense")!.id,
      paymentMethodId: data.paymentMethods.find((item) => item.kind === "cash")!.id,
      accountId: bankId, kind: "expense", amount: 20, currency: "EUR", notes: "",
      createdAt: timestamp, updatedAt: timestamp,
    } })).toThrow("ACCOUNT_PAYMENT_METHOD_MISMATCH");
  });

  it("rejects internal transfers between different currencies", () => {
    const { data, bankId, cashId } = setup();
    data.accounts.find((item) => item.id === cashId)!.currency = "USD";
    const timestamp = new Date().toISOString();
    expect(() => applyFinanceCommand(data, { type: "addTransaction", value: {
      id: crypto.randomUUID(), date: "2026-03-02", description: "Invalid currency transfer",
      categoryId: data.categories.find((item) => item.kind === "both")!.id,
      paymentMethodId: data.paymentMethods.find((item) => item.kind === "card")!.id,
      accountId: bankId, destinationAccountId: cashId, kind: "transfer", cashFlowDirection: "neutral",
      amount: 100, currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp,
    } })).toThrow("INVALID_INTERNAL_TRANSFER");
  });
});
