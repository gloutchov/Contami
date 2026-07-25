import { describe, expect, it } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import { assertUniqueRecordIds, repairDuplicateRecordIds } from "../../src/domain/uuidRepair";

const replacementIds = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
];

function uuidFactory(): () => string {
  let index = 0;
  return () => replacementIds[index++]!;
}

describe("duplicate UUID repair", () => {
  it("assigns new UUIDs without changing duplicate valuation records", () => {
    const data = createEmptyFinanceData(2026);
    const investmentId = crypto.randomUUID();
    const duplicateId = crypto.randomUUID();
    data.investments.push({
      id: investmentId,
      name: "Synthetic fund",
      kind: "fund",
      provider: "",
      currency: "EUR",
      active: true,
      openedAt: "2026-01-01",
      notes: "",
    });
    data.investmentEntries.push(
      {
        id: duplicateId,
        investmentId,
        date: "2026-01-31",
        kind: "valuation",
        amount: 35_000,
        description: "January valuation",
        notes: "",
      },
      {
        id: duplicateId,
        investmentId,
        date: "2026-02-28",
        kind: "valuation",
        amount: 36_000,
        description: "February valuation",
        notes: "",
      },
    );

    const repaired = repairDuplicateRecordIds(data, uuidFactory());

    expect(repaired.repairs).toEqual([{
      collection: "investmentEntries",
      index: 1,
      previousId: duplicateId,
      nextId: replacementIds[0],
    }]);
    expect(repaired.repairedLinks).toBe(0);
    expect(repaired.data.investmentEntries).toEqual([
      data.investmentEntries[0],
      { ...data.investmentEntries[1], id: replacementIds[0] },
    ]);
    expect(() => assertUniqueRecordIds(repaired.data)).not.toThrow();
  });

  it("realigns an unambiguous transaction back-reference", () => {
    const data = createEmptyFinanceData(2026);
    const investmentId = crypto.randomUUID();
    const duplicateEntryId = crypto.randomUUID();
    const firstTransactionId = crypto.randomUUID();
    const secondTransactionId = crypto.randomUUID();
    const categoryId = data.categories.find((category) => category.kind === "both")!.id;
    const paymentMethodId = data.paymentMethods[0]!.id;
    const timestamp = new Date().toISOString();
    data.investments.push({
      id: investmentId,
      name: "Synthetic fund",
      kind: "fund",
      provider: "",
      currency: "EUR",
      active: true,
      openedAt: "2026-01-01",
      notes: "",
    });
    data.investmentEntries.push(
      {
        id: duplicateEntryId,
        investmentId,
        date: "2026-01-10",
        kind: "contribution",
        amount: 100,
        description: "First contribution",
        categoryId,
        paymentMethodId,
        transactionId: firstTransactionId,
        notes: "",
      },
      {
        id: duplicateEntryId,
        investmentId,
        date: "2026-02-10",
        kind: "contribution",
        amount: 200,
        description: "Second contribution",
        categoryId,
        paymentMethodId,
        transactionId: secondTransactionId,
        notes: "",
      },
    );
    data.transactions.push(
      {
        id: firstTransactionId,
        date: "2026-01-10",
        description: "First contribution",
        categoryId,
        paymentMethodId,
        kind: "transfer",
        cashFlowDirection: "outflow",
        amount: 100,
        currency: "EUR",
        investmentId,
        investmentEntryId: duplicateEntryId,
        notes: "",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: secondTransactionId,
        date: "2026-02-10",
        description: "Second contribution",
        categoryId,
        paymentMethodId,
        kind: "transfer",
        cashFlowDirection: "outflow",
        amount: 200,
        currency: "EUR",
        investmentId,
        investmentEntryId: crypto.randomUUID(),
        notes: "",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    );

    const repaired = repairDuplicateRecordIds(data, uuidFactory());

    expect(repaired.data.investmentEntries[1]?.id).toBe(replacementIds[0]);
    expect(repaired.data.investmentEntries[1]?.transactionId).toBe(secondTransactionId);
    expect(repaired.data.transactions[0]?.investmentEntryId).toBe(duplicateEntryId);
    expect(repaired.data.transactions[1]?.investmentEntryId).toBe(replacementIds[0]);
    expect(repaired.repairedLinks).toBe(1);
  });

  it("repairs duplicated transaction IDs while preserving both transactions", () => {
    const data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    const duplicateTransactionId = crypto.randomUUID();
    const firstEntryId = crypto.randomUUID();
    const secondEntryId = crypto.randomUUID();
    const categoryId = data.categories.find((category) => category.kind === "expense")!.id;
    const paymentMethodId = data.paymentMethods[0]!.id;
    const timestamp = new Date().toISOString();
    data.properties.push({
      id: propertyId,
      name: "Synthetic home",
      kind: "apartment",
      usage: "residence",
      ownershipShare: 1,
      purchasePrice: 0,
      active: true,
      notes: "",
    });
    data.propertyEntries.push(
      {
        id: firstEntryId,
        propertyId,
        date: "2026-01-10",
        kind: "expense",
        category: "Electricity",
        categoryId,
        description: "January bill",
        amount: 100,
        paymentMethodId,
        transactionId: duplicateTransactionId,
        notes: "",
      },
      {
        id: secondEntryId,
        propertyId,
        date: "2026-02-10",
        kind: "expense",
        category: "Electricity",
        categoryId,
        description: "February bill",
        amount: 120,
        paymentMethodId,
        transactionId: duplicateTransactionId,
        notes: "",
      },
    );
    data.transactions.push(
      {
        id: duplicateTransactionId,
        date: "2026-01-10",
        description: "January bill",
        categoryId,
        paymentMethodId,
        kind: "expense",
        amount: 100,
        currency: "EUR",
        propertyId,
        propertyEntryId: firstEntryId,
        notes: "",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: duplicateTransactionId,
        date: "2026-02-10",
        description: "February bill",
        categoryId,
        paymentMethodId,
        kind: "expense",
        amount: 120,
        currency: "EUR",
        propertyId,
        propertyEntryId: secondEntryId,
        notes: "",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    );

    const repaired = repairDuplicateRecordIds(data, uuidFactory());

    expect(repaired.data.transactions).toHaveLength(2);
    expect(repaired.data.transactions[1]?.id).toBe(replacementIds[0]);
    expect(repaired.data.propertyEntries[1]?.transactionId).toBe(replacementIds[0]);
    expect(repaired.data.transactions[1]?.propertyEntryId).toBe(secondEntryId);
  });
});
