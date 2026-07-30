import { describe, expect, it } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import { reconcileInvestmentTransactions } from "../../src/domain/investmentTransactionSync";
import type { FinanceData, Investment, InvestmentEntry, Transaction } from "../../src/domain/models";

const timestamp = "2026-07-30T10:00:00.000Z";

function addPosition(data: FinanceData, value: Partial<Investment> & Pick<Investment, "id" | "name">): Investment {
  const investment: Investment = {
    kind: "fund",
    typeId: data.investmentTypes.find((item) => item.code === "fund")!.id,
    provider: "Synthetic provider",
    currency: "EUR",
    active: true,
    openedAt: "2026-01-01",
    notes: "",
    ...value,
  };
  data.investments.push(investment);
  return investment;
}

function movement(
  data: FinanceData,
  investmentId: string,
  value: Partial<InvestmentEntry> & Pick<InvestmentEntry, "id" | "kind" | "description" | "amount">,
): InvestmentEntry {
  return {
    investmentId,
    date: "2026-04-15",
    categoryId: data.categories.find((item) => item.nameIt === "Investimenti")!.id,
    paymentMethodId: data.paymentMethods[0]!.id,
    notes: "",
    ...value,
  };
}

function transaction(
  data: FinanceData,
  value: Partial<Transaction> & Pick<Transaction, "id" | "kind" | "description" | "amount">,
): Transaction {
  return {
    date: "2026-04-15",
    categoryId: data.categories.find((item) => item.nameIt === "Investimenti")!.id,
    paymentMethodId: data.paymentMethods[0]!.id,
    currency: "EUR",
    shared: false,
    sharedPaidBy: "owner",
    sharedSettled: false,
    notes: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...value,
  };
}

function sequenceFactory(values: string[]): () => string {
  let index = 0;
  return () => values[index++]!;
}

describe("investment and transaction reconciliation", () => {
  it("creates one transaction for every orphan contribution and withdrawal, including pension compartments", () => {
    const data = createEmptyFinanceData(2026);
    const investment = addPosition(data, { id: crypto.randomUUID(), name: "Synthetic ETF", kind: "etf" });
    const pensionTypeId = data.investmentTypes.find((item) => item.code === "pension")!.id;
    const pension = addPosition(data, { id: crypto.randomUUID(), name: "Synthetic pension", kind: "pension", typeId: pensionTypeId });
    const compartment = addPosition(data, {
      id: crypto.randomUUID(),
      name: "Synthetic compartment",
      kind: "pension",
      typeId: pensionTypeId,
      parentInvestmentId: pension.id,
    });
    const entries = [
      movement(data, investment.id, { id: crypto.randomUUID(), kind: "contribution", amount: 400, description: "ETF contribution" }),
      movement(data, investment.id, { id: crypto.randomUUID(), kind: "withdrawal", amount: 125, description: "ETF withdrawal" }),
      movement(data, compartment.id, { id: crypto.randomUUID(), kind: "contribution", amount: 300, description: "Pension contribution" }),
      movement(data, compartment.id, { id: crypto.randomUUID(), kind: "withdrawal", amount: 80, description: "Pension withdrawal" }),
    ];
    data.investmentEntries.push(...entries);
    const transactionIds = Array.from({ length: entries.length }, () => crypto.randomUUID());

    const reconciled = reconcileInvestmentTransactions(data, {
      idFactory: sequenceFactory(transactionIds),
      now: () => timestamp,
    });

    expect(reconciled.repairs.map((item) => item.kind)).toEqual(Array(entries.length).fill("create_transaction"));
    expect(reconciled.data.transactions).toHaveLength(entries.length);
    entries.forEach((entry, index) => {
      expect(reconciled.data.investmentEntries.find((item) => item.id === entry.id)?.transactionId).toBe(transactionIds[index]);
      expect(reconciled.data.transactions.find((item) => item.id === transactionIds[index])).toMatchObject({
        investmentId: entry.investmentId,
        investmentEntryId: entry.id,
        kind: "transfer",
        cashFlowDirection: entry.kind === "contribution" ? "outflow" : "inflow",
        amount: entry.amount,
      });
    });

    const secondPass = reconcileInvestmentTransactions(reconciled.data, { now: () => "2026-07-31T10:00:00.000Z" });
    expect(secondPass.repairs).toEqual([]);
    expect(secondPass.data).toEqual(reconciled.data);
  });

  it("links one exact legacy transaction and normalizes it without creating a duplicate", () => {
    const data = createEmptyFinanceData(2026);
    const investment = addPosition(data, { id: crypto.randomUUID(), name: "Synthetic fund" });
    const entry = movement(data, investment.id, {
      id: crypto.randomUUID(),
      kind: "contribution",
      amount: 250,
      description: "Legacy contribution",
    });
    const legacyTransaction = transaction(data, {
      id: crypto.randomUUID(),
      kind: "expense",
      amount: entry.amount,
      description: entry.description,
    });
    data.investmentEntries.push(entry);
    data.transactions.push(legacyTransaction);

    const reconciled = reconcileInvestmentTransactions(data, { now: () => timestamp });

    expect(reconciled.repairs).toEqual([{
      kind: "link_pair",
      investmentEntryId: entry.id,
      transactionId: legacyTransaction.id,
    }]);
    expect(reconciled.data.transactions).toHaveLength(1);
    expect(reconciled.data.transactions[0]).toMatchObject({
      id: legacyTransaction.id,
      kind: "transfer",
      cashFlowDirection: "outflow",
      investmentId: investment.id,
      investmentEntryId: entry.id,
    });
    expect(reconciled.data.investmentEntries[0]?.transactionId).toBe(legacyTransaction.id);
  });

  it("leaves multiple exact candidates untouched instead of guessing", () => {
    const data = createEmptyFinanceData(2026);
    const investment = addPosition(data, { id: crypto.randomUUID(), name: "Synthetic fund" });
    const entry = movement(data, investment.id, {
      id: crypto.randomUUID(),
      kind: "withdrawal",
      amount: 90,
      description: "Ambiguous withdrawal",
    });
    const first = transaction(data, { id: crypto.randomUUID(), kind: "income", amount: entry.amount, description: entry.description });
    const second = transaction(data, { id: crypto.randomUUID(), kind: "income", amount: entry.amount, description: entry.description });
    data.investmentEntries.push(entry);
    data.transactions.push(first, second);

    const reconciled = reconcileInvestmentTransactions(data, { now: () => timestamp });

    expect(reconciled.repairs).toEqual([]);
    expect(reconciled.ambiguousEntries).toBe(1);
    expect(reconciled.data).toEqual(data);
  });

  it("creates missing entries for confirmed and planned investment transactions", () => {
    const data = createEmptyFinanceData(2026);
    const investment = addPosition(data, { id: crypto.randomUUID(), name: "Synthetic plan" });
    const confirmed = transaction(data, {
      id: crypto.randomUUID(),
      investmentId: investment.id,
      kind: "transfer",
      cashFlowDirection: "inflow",
      amount: 75,
      description: "Confirmed liquidation",
    });
    const planned = transaction(data, {
      id: crypto.randomUUID(),
      investmentId: investment.id,
      kind: "transfer",
      cashFlowDirection: "outflow",
      amount: 100,
      description: "Planned contribution",
      planned: true,
      recurringId: crypto.randomUUID(),
    });
    data.transactions.push(confirmed, planned);
    const entryIds = [crypto.randomUUID(), crypto.randomUUID()];

    const reconciled = reconcileInvestmentTransactions(data, {
      idFactory: sequenceFactory(entryIds),
      now: () => timestamp,
    });

    expect(reconciled.repairs.map((item) => item.kind)).toEqual(["create_entry", "create_entry"]);
    expect(reconciled.data.investmentEntries).toEqual([
      expect.objectContaining({ id: entryIds[0], transactionId: confirmed.id, kind: "withdrawal", amount: 75 }),
      expect.objectContaining({ id: entryIds[1], transactionId: planned.id, kind: "contribution", amount: 100 }),
    ]);
    expect(reconciled.data.transactions.map((item) => item.investmentEntryId)).toEqual(entryIds);
  });

  it("does not rewrite conflicting explicit cross-links", () => {
    const data = createEmptyFinanceData(2026);
    const firstInvestment = addPosition(data, { id: crypto.randomUUID(), name: "First" });
    const secondInvestment = addPosition(data, { id: crypto.randomUUID(), name: "Second" });
    const entry = movement(data, firstInvestment.id, {
      id: crypto.randomUUID(),
      transactionId: crypto.randomUUID(),
      kind: "contribution",
      amount: 100,
      description: "Conflicting link",
    });
    const linkedTransaction = transaction(data, {
      id: entry.transactionId!,
      investmentId: secondInvestment.id,
      investmentEntryId: entry.id,
      kind: "transfer",
      cashFlowDirection: "outflow",
      amount: entry.amount,
      description: entry.description,
    });
    data.investmentEntries.push(entry);
    data.transactions.push(linkedTransaction);

    const reconciled = reconcileInvestmentTransactions(data, { now: () => timestamp });

    expect(reconciled.repairs).toEqual([]);
    expect(reconciled.ambiguousEntries).toBe(1);
    expect(reconciled.ambiguousTransactions).toBe(1);
    expect(reconciled.data).toEqual(data);
  });
});
