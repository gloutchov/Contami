import { describe, expect, it } from "vitest";
import type { RecurringItem, Transaction } from "../../src/domain/models";
import { recentRecurringExpensesAsOf, recentTransactionsAsOf } from "../../src/renderer/utils/overviewTransactions";

const recurringId = "11111111-1111-4111-8111-111111111111";
const baseTransaction: Transaction = {
  id: "22222222-2222-4222-8222-222222222222",
  date: "2026-07-01",
  description: "Expense",
  categoryId: "33333333-3333-4333-8333-333333333333",
  paymentMethodId: "44444444-4444-4444-8444-444444444444",
  kind: "expense",
  amount: 10,
  currency: "EUR",
  notes: "",
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-01T10:00:00.000Z",
};

const transaction = (id: string, value: Partial<Transaction>): Transaction => ({
  ...baseTransaction,
  id,
  ...value,
});

const recurring: RecurringItem = {
  id: recurringId,
  name: "Internet casa",
  kind: "service",
  direction: "expense",
  amount: 25,
  frequency: "monthly",
  categoryId: baseTransaction.categoryId,
  paymentMethodId: baseTransaction.paymentMethodId,
  nextDueDate: "2026-08-01",
  active: true,
  notes: "",
};

describe("overview transaction lists", () => {
  it("shows only confirmed transactions up to the requested date", () => {
    const rows = [
      transaction("55555555-5555-4555-8555-555555555555", { date: "2026-12-31", description: "Future" }),
      transaction("66666666-6666-4666-8666-666666666666", { date: "2026-07-18", description: "Planned", planned: true }),
      transaction("77777777-7777-4777-8777-777777777777", { date: "2026-07-17", description: "Latest confirmed" }),
      transaction("88888888-8888-4888-8888-888888888888", { date: "2026-06-10", description: "Older confirmed" }),
    ];

    expect(recentTransactionsAsOf(rows, "2026-07-19").map((item) => item.description)).toEqual([
      "Latest confirmed",
      "Older confirmed",
    ]);
  });

  it("keeps only confirmed recurring expenses and supports legacy name matching", () => {
    const rows = [
      transaction("55555555-5555-4555-8555-555555555555", { date: "2026-07-18", description: "Internet casa luglio" }),
      transaction("66666666-6666-4666-8666-666666666666", { date: "2026-07-17", description: "Linked service", recurringId }),
      transaction("77777777-7777-4777-8777-777777777777", { date: "2026-07-16", description: "Recurring income", recurringId, kind: "income" }),
      transaction("88888888-8888-4888-8888-888888888888", { date: "2026-12-31", description: "Future", recurringId }),
      transaction("99999999-9999-4999-8999-999999999999", { date: "2026-07-15", description: "Planned", recurringId, planned: true }),
    ];

    expect(recentRecurringExpensesAsOf(rows, [recurring], "2026-07-19").map((item) => item.description)).toEqual([
      "Internet casa luglio",
      "Linked service",
    ]);
  });
});
