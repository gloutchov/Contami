import { describe, expect, it } from "vitest";
import { applyFinanceCommand, computeDashboard, createEmptyFinanceData as createBaseFinanceData } from "../../src/domain/finance";
import { portfolioValues } from "../../src/domain/investments";

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
});
