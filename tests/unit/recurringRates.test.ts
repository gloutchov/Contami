import { describe, expect, it } from "vitest";
import { applyFinanceCommand, createEmptyFinanceData } from "../../src/domain/finance";
import { createRolloverFinanceData } from "../../src/domain/rollover";
import {
  recurringRateAt,
  recurringRateChangeImpactCount,
  recurringRateChangesFor,
} from "../../src/domain/recurringRates";

function addMonthlyService(amount = 100, nextDueDate = "2026-01-15") {
  let data = createEmptyFinanceData(2026);
  const accountId = crypto.randomUUID();
  data.accounts.push({
    id: accountId, name: "Synthetic bank", kind: "bank", currency: "EUR", openingBalance: 0,
    active: true, openedAt: "2026-01-01", notes: "",
  });
  const recurringId = crypto.randomUUID();
  data = applyFinanceCommand(data, { type: "addRecurringItem", value: {
    id: recurringId,
    name: "Synthetic monthly service",
    kind: "service",
    direction: "expense",
    amount,
    frequency: "monthly",
    categoryId: data.categories.find((item) => item.kind === "expense")!.id,
    paymentMethodId: data.paymentMethods[0]!.id,
    accountId,
    nextDueDate,
    active: true,
    notes: "",
  } });
  return { data, recurringId };
}

describe("recurring rate changes", () => {
  it("updates only planned occurrences from the effective month and preserves UUIDs", () => {
    const initial = addMonthlyService();
    let data = initial.data;
    const recurringId = initial.recurringId;
    for (const date of ["2026-01-15", "2026-02-15"]) {
      const transaction = data.transactions.find((item) => item.recurringId === recurringId && item.dueDate === date)!;
      data = applyFinanceCommand(data, { type: "updateTransaction", value: { ...transaction, planned: false } });
    }
    const idsBefore = new Map(data.transactions
      .filter((item) => item.recurringId === recurringId && item.planned)
      .map((item) => [item.dueDate, item.id]));
    const timestampsBefore = new Map(data.transactions
      .filter((item) => item.recurringId === recurringId && item.planned)
      .map((item) => [item.dueDate, item.updatedAt]));
    const change = { id: crypto.randomUUID(), recurringId, amount: 125, effectiveFrom: "2026-06-01" };

    expect(recurringRateChangeImpactCount(data, recurringId, [change])).toBe(7);
    data = applyFinanceCommand(data, { type: "addRecurringRateChange", value: change });

    expect(data.transactions.filter((item) => item.recurringId === recurringId && !item.planned).map((item) => item.amount)).toEqual([100, 100]);
    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.planned && item.dueDate! < "2026-06-01").every((item) => item.amount === 100)).toBe(true);
    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.planned && item.dueDate! >= "2026-06-01").every((item) => item.amount === 125)).toBe(true);
    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.planned)
      .every((item) => idsBefore.get(item.dueDate) === item.id)).toBe(true);
    expect(data.transactions.find((item) => item.dueDate === "2026-03-15")?.updatedAt).toBe(timestampsBefore.get("2026-03-15"));
    expect(data.recurringItems[0]!.amount).toBe(100);
  });

  it("orders multiple changes and recalculates planned rows after edit and cancellation", () => {
    const initial = addMonthlyService();
    let data = initial.data;
    const recurringId = initial.recurringId;
    const june = { id: crypto.randomUUID(), recurringId, amount: 120, effectiveFrom: "2026-06-01" };
    const september = { id: crypto.randomUUID(), recurringId, amount: 150, effectiveFrom: "2026-09-01" };
    data = applyFinanceCommand(data, { type: "addRecurringRateChange", value: september });
    data = applyFinanceCommand(data, { type: "addRecurringRateChange", value: june });

    expect(recurringRateChangesFor(data, recurringId).map((item) => item.effectiveFrom)).toEqual(["2026-06-01", "2026-09-01"]);
    expect(recurringRateAt(data, data.recurringItems[0]!, "2026-05-31")).toBe(100);
    expect(recurringRateAt(data, data.recurringItems[0]!, "2026-06-30")).toBe(120);
    expect(recurringRateAt(data, data.recurringItems[0]!, "2026-09-30")).toBe(150);

    data = applyFinanceCommand(data, { type: "updateRecurringRateChange", value: { ...september, amount: 140 } });
    expect(data.transactions.find((item) => item.dueDate === "2026-08-15")?.amount).toBe(120);
    expect(data.transactions.find((item) => item.dueDate === "2026-09-15")?.amount).toBe(140);

    data = applyFinanceCommand(data, { type: "deleteRecurringRateChange", id: june.id });
    expect(data.transactions.find((item) => item.dueDate === "2026-08-15")?.amount).toBe(100);
    expect(data.transactions.find((item) => item.dueDate === "2026-09-15")?.amount).toBe(140);
  });

  it("rejects overlaps, invalid month starts and changes that would rewrite confirmed rate history", () => {
    const initial = addMonthlyService();
    let data = initial.data;
    const recurringId = initial.recurringId;
    const change = { id: crypto.randomUUID(), recurringId, amount: 120, effectiveFrom: "2026-03-01" };
    data = applyFinanceCommand(data, { type: "addRecurringRateChange", value: change });
    const march = data.transactions.find((item) => item.recurringId === recurringId && item.dueDate === "2026-03-15")!;
    data = applyFinanceCommand(data, { type: "updateTransaction", value: { ...march, planned: false } });

    expect(() => applyFinanceCommand(data, { type: "updateRecurringRateChange", value: { ...change, amount: 130 } }))
      .toThrow("RATE_CHANGE_CONFIRMED_HISTORY");
    expect(() => applyFinanceCommand(data, { type: "deleteRecurringRateChange", id: change.id }))
      .toThrow("RATE_CHANGE_CONFIRMED_HISTORY");
    expect(() => applyFinanceCommand(data, { type: "addRecurringRateChange", value: {
      id: crypto.randomUUID(), recurringId, amount: 140, effectiveFrom: "2026-03-01",
    } })).toThrow("DUPLICATE_RATE_CHANGE_MONTH");
    expect(() => applyFinanceCommand(data, { type: "addRecurringRateChange", value: {
      id: crypto.randomUUID(), recurringId, amount: 140, effectiveFrom: "2026-04-15",
    } })).toThrow();
    expect(() => applyFinanceCommand(data, { type: "addRecurringRateChange", value: {
      id: crypto.randomUUID(), recurringId, amount: 0, effectiveFrom: "2026-04-01",
    } })).toThrow();
  });

  it("does not change installment state while updating only future installment amounts", () => {
    const initial = addMonthlyService(90, "2026-07-31");
    let data = initial.data;
    const recurringId = initial.recurringId;
    const recurring = data.recurringItems[0]!;
    data = applyFinanceCommand(data, { type: "updateRecurringItem", value: {
      ...recurring, kind: "installment", remainingInstallments: 5, endDate: "2026-11-30",
    } });
    const stateBefore = {
      remainingInstallments: data.recurringItems[0]!.remainingInstallments,
      nextDueDate: data.recurringItems[0]!.nextDueDate,
      endDate: data.recurringItems[0]!.endDate,
    };

    data = applyFinanceCommand(data, { type: "addRecurringRateChange", value: {
      id: crypto.randomUUID(), recurringId, amount: 110, effectiveFrom: "2026-09-01",
    } });

    expect(data.recurringItems[0]).toMatchObject(stateBefore);
    expect(data.transactions.filter((item) => item.recurringId === recurringId).map((item) => [item.dueDate, item.amount])).toEqual([
      ["2026-07-31", 90], ["2026-08-31", 90], ["2026-09-30", 110], ["2026-10-31", 110], ["2026-11-30", 110],
    ]);
  });

  it("propagates a future rate to linked investment and shared planned records", () => {
    let data = createEmptyFinanceData(2026);
    const accountId = crypto.randomUUID();
    data.accounts.push({
      id: accountId, name: "Synthetic bank", kind: "bank", currency: "EUR", openingBalance: 0,
      active: true, openedAt: "2026-01-01", notes: "",
    });
    const investmentId = crypto.randomUUID();
    const categoryId = data.categories.find((item) => item.nameIt === "Investimenti")!.id;
    data = applyFinanceCommand(data, { type: "addInvestment", value: {
      id: investmentId, name: "Synthetic fund", kind: "fund", provider: "", currency: "EUR",
      periodicAmount: 100, periodicFrequency: "monthly", periodicNextDueDate: "2026-09-10",
      periodicCategoryId: categoryId, periodicPaymentMethodId: data.paymentMethods[0]!.id,
      periodicAccountId: accountId,
      active: true, openedAt: "2026-01-01", notes: "",
    } });
    const recurring = data.recurringItems.find((item) => item.investmentId === investmentId)!;
    const september = data.transactions.find((item) => item.recurringId === recurring.id && item.dueDate === "2026-09-10")!;
    const linkedIds = { transaction: september.id, investment: september.investmentEntryId };

    data = applyFinanceCommand(data, { type: "addRecurringRateChange", value: {
      id: crypto.randomUUID(), recurringId: recurring.id, amount: 135, effectiveFrom: "2026-09-01",
    } });
    const updated = data.transactions.find((item) => item.id === linkedIds.transaction)!;

    expect(updated).toMatchObject({ amount: 135, investmentEntryId: linkedIds.investment });
    expect(data.investmentEntries.find((item) => item.id === linkedIds.investment)?.amount).toBe(135);
    expect(data.investments.find((item) => item.id === investmentId)?.periodicAmount).toBe(135);

    const sharedRecurringId = crypto.randomUUID();
    data = applyFinanceCommand(data, { type: "addRecurringItem", value: {
      id: sharedRecurringId, name: "Synthetic shared service", kind: "service", direction: "expense",
      amount: 80, frequency: "monthly", categoryId: data.categories.find((item) => item.kind === "expense")!.id,
      paymentMethodId: data.paymentMethods[0]!.id, accountId, nextDueDate: "2026-09-20", active: true, notes: "",
    } });
    const sharedTransaction = data.transactions.find((item) => item.recurringId === sharedRecurringId && item.dueDate === "2026-09-20")!;
    data = applyFinanceCommand(data, { type: "updateTransaction", value: {
      ...sharedTransaction, shared: true, sharedPaidBy: "owner", sharedSettled: false,
    } });
    const sharedExpenseId = data.transactions.find((item) => item.id === sharedTransaction.id)!.sharedExpenseId!;
    data = applyFinanceCommand(data, { type: "addRecurringRateChange", value: {
      id: crypto.randomUUID(), recurringId: sharedRecurringId, amount: 95, effectiveFrom: "2026-09-01",
    } });
    expect(data.transactions.find((item) => item.id === sharedTransaction.id)).toMatchObject({ amount: 95, sharedExpenseId });
    expect(data.sharedExpenses.find((item) => item.id === sharedExpenseId)?.amount).toBe(95);

    data = applyFinanceCommand(data, { type: "addRecurringRateChange", value: {
      id: crypto.randomUUID(), recurringId: recurring.id, amount: 160, effectiveFrom: "2027-01-01",
    } });
    const next = createRolloverFinanceData(data, 2027);
    expect(next.investments.find((item) => item.id === investmentId)?.periodicAmount).toBe(160);
    expect(next.transactions.find((item) => item.recurringId === recurring.id && item.dueDate === "2027-01-10")?.amount).toBe(160);
  });

  it("updates future rent income and linked property rows without rewriting a confirmed receipt", () => {
    let data = createEmptyFinanceData(2026);
    const accountId = crypto.randomUUID();
    const propertyId = crypto.randomUUID();
    const recurringId = crypto.randomUUID();
    data.accounts.push({
      id: accountId, name: "Synthetic bank", kind: "bank", currency: "EUR", openingBalance: 0,
      active: true, openedAt: "2026-01-01", notes: "",
    });
    data.properties.push({
      id: propertyId, name: "Synthetic rental", kind: "apartment", usage: "rental", areaSqm: 70,
      ownershipShare: 1, purchasePrice: 0, active: true, notes: "",
    });
    data = applyFinanceCommand(data, { type: "addRecurringItem", value: {
      id: recurringId, name: "Synthetic rent", kind: "rent", direction: "income", amount: 900,
      frequency: "monthly", categoryId: data.categories.find((item) => item.nameIt === "Affitti")!.id,
      paymentMethodId: data.paymentMethods[0]!.id, accountId, propertyId,
      nextDueDate: "2026-06-05", active: true, notes: "",
    } });
    const june = data.transactions.find((item) => item.recurringId === recurringId && item.dueDate === "2026-06-05")!;
    const juneEntryId = june.propertyEntryId!;
    data = applyFinanceCommand(data, { type: "updateTransaction", value: {
      ...june, date: "2026-06-07", planned: false,
    } });

    data = applyFinanceCommand(data, { type: "addRecurringRateChange", value: {
      id: crypto.randomUUID(), recurringId, amount: 975, effectiveFrom: "2026-10-01",
    } });

    expect(data.transactions.find((item) => item.id === june.id)).toMatchObject({ amount: 900, planned: false, dueDate: "2026-06-05" });
    expect(data.propertyEntries.find((item) => item.id === juneEntryId)).toMatchObject({ amount: 900, dueDate: "2026-06-05" });
    const october = data.transactions.find((item) => item.recurringId === recurringId && item.dueDate === "2026-10-05")!;
    expect(october).toMatchObject({ amount: 975, planned: true, propertyId });
    expect(data.propertyEntries.find((item) => item.id === october.propertyEntryId)).toMatchObject({ amount: 975, dueDate: "2026-10-05" });
  });

  it("keeps future rate history across close, reopen, regeneration and year rollover", () => {
    const initial = addMonthlyService(100, "2026-12-15");
    let data = initial.data;
    const recurringId = initial.recurringId;
    const change = { id: crypto.randomUUID(), recurringId, amount: 145, effectiveFrom: "2027-01-01" };
    expect(recurringRateChangeImpactCount(data, recurringId, [change])).toBe(0);
    data = applyFinanceCommand(data, { type: "addRecurringRateChange", value: change });
    data = applyFinanceCommand(data, { type: "setActive", entity: "recurringItem", id: recurringId, active: false, closedAt: "2026-12-20" });
    expect(data.transactions.filter((item) => item.recurringId === recurringId && item.planned)).toHaveLength(0);
    data = applyFinanceCommand(data, { type: "setActive", entity: "recurringItem", id: recurringId, active: true });
    expect(data.transactions.find((item) => item.dueDate === "2026-12-15")?.amount).toBe(100);

    const next = createRolloverFinanceData(data, 2027);

    expect(next.recurringRateChanges).toEqual([change]);
    expect(next.transactions.filter((item) => item.recurringId === recurringId && item.planned)).toHaveLength(12);
    expect(next.transactions.filter((item) => item.recurringId === recurringId && item.planned).every((item) => item.amount === 145)).toBe(true);
  });

  it("protects the original base amount after rate history or confirmations exist", () => {
    const initial = addMonthlyService();
    let data = initial.data;
    const recurring = data.recurringItems[0]!;
    data = applyFinanceCommand(data, { type: "addRecurringRateChange", value: {
      id: crypto.randomUUID(), recurringId: recurring.id, amount: 120, effectiveFrom: "2026-06-01",
    } });

    expect(() => applyFinanceCommand(data, { type: "updateRecurringItem", value: { ...recurring, amount: 90 } }))
      .toThrow("RECURRING_BASE_AMOUNT_LOCKED");
  });
});
