import { describe, expect, it } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import { repairOperationalData } from "../../src/domain/operationalDataRepair";

const timestamp = "2026-07-31T10:00:00.000Z";

describe("operational data repair", () => {
  it("assigns the only compatible active account to cash-affecting transactions", () => {
    const data = createEmptyFinanceData(2026);
    const accountId = crypto.randomUUID();
    data.accounts.push({
      id: accountId, name: "Synthetic account", kind: "bank", currency: "EUR",
      openingBalance: 500, active: true, openedAt: "2026-01-01", notes: "",
    });
    data.transactions.push({
      id: crypto.randomUUID(), date: "2026-03-01", description: "Synthetic expense",
      categoryId: data.categories.find((item) => item.kind === "expense")!.id,
      paymentMethodId: data.paymentMethods[0].id, kind: "expense", amount: 25,
      currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp,
    });

    const repaired = repairOperationalData(data);

    expect(repaired.repairedTransactionAccounts).toBe(1);
    expect(repaired.unresolvedTransactionAccounts).toBe(0);
    expect(repaired.data.transactions[0]?.accountId).toBe(accountId);
  });

  it("does not guess between accounts or assign movements before an account opened", () => {
    const data = createEmptyFinanceData(2026);
    data.accounts.push(
      {
        id: crypto.randomUUID(), name: "Synthetic current account", kind: "bank", currency: "EUR",
        openingBalance: 500, active: true, openedAt: "2026-01-01", notes: "",
      },
      {
        id: crypto.randomUUID(), name: "Synthetic second account", kind: "cash", currency: "EUR",
        openingBalance: 50, active: true, openedAt: "2026-06-01", notes: "",
      },
    );
    data.transactions.push(
      {
        id: crypto.randomUUID(), date: "2025-12-01", description: "Synthetic historical expense",
        categoryId: data.categories.find((item) => item.kind === "expense")!.id,
        paymentMethodId: data.paymentMethods[0].id, kind: "expense", amount: 25,
        currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp,
      },
      {
        id: crypto.randomUUID(), date: "2026-07-01", description: "Synthetic ambiguous expense",
        categoryId: data.categories.find((item) => item.kind === "expense")!.id,
        paymentMethodId: data.paymentMethods[0].id, kind: "expense", amount: 30,
        currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp,
      },
    );

    const repaired = repairOperationalData(data);

    expect(repaired.repairedTransactionAccounts).toBe(0);
    expect(repaired.unresolvedTransactionAccounts).toBe(2);
    expect(repaired.data.transactions.every((item) => !item.accountId)).toBe(true);
  });

  it("closes active installment plans at zero and removes stale planned rows", () => {
    const data = createEmptyFinanceData(2026);
    const recurringId = crypto.randomUUID();
    data.recurringItems.push({
      id: recurringId, name: "Synthetic finished plan", kind: "installment", direction: "expense",
      amount: 50, frequency: "monthly", categoryId: data.categories.find((item) => item.kind === "expense")!.id,
      paymentMethodId: data.paymentMethods[0].id, nextDueDate: "2026-08-01",
      remainingInstallments: 0, active: true, notes: "",
    });
    data.transactions.push({
      id: crypto.randomUUID(), date: "2026-08-01", description: "Synthetic stale installment",
      categoryId: data.categories.find((item) => item.kind === "expense")!.id,
      paymentMethodId: data.paymentMethods[0].id, kind: "expense", amount: 50, currency: "EUR",
      recurringId, planned: true, notes: "", createdAt: timestamp, updatedAt: timestamp,
    });

    const repaired = repairOperationalData(data, { today: "2026-07-31" });

    expect(repaired.closedInstallmentPlans).toBe(1);
    expect(repaired.data.recurringItems[0]).toMatchObject({ active: false, closedAt: "2026-07-31" });
    expect(repaired.data.transactions).toHaveLength(0);
  });
});
