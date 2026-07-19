import { describe, expect, it } from "vitest";
import { applyFinanceCommand, createEmptyFinanceData } from "../../src/domain/finance";

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
