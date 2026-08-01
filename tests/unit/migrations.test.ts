import { describe, expect, it } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import { migrateFinanceData } from "../../src/domain/migrations";

describe("finance data migrations", () => {
  it("upgrades a version 1 workbook with investment types and historical comparison fields", () => {
    const current = createEmptyFinanceData(2026);
    const legacy = structuredClone(current) as unknown as {
      meta: { schemaVersion: number };
      investmentTypes?: unknown;
      annualSummaries: Array<Record<string, unknown>>;
    };
    legacy.meta.schemaVersion = 1;
    delete legacy.investmentTypes;
    legacy.annualSummaries = [{
      year: 2025, income: 10_000, expenses: 7_000, netCashFlow: 3_000, closingNetWorth: 50_000,
    }];

    const migrated = migrateFinanceData(legacy);

    expect(migrated.meta.schemaVersion).toBe(8);
    expect(migrated.investmentTypes).toHaveLength(7);
    expect(migrated.taxTypes.map((item) => item.name)).toEqual(["Canone TV", "IMU", "TARI"]);
    expect(migrated.annualSummaries[0]).toMatchObject({
      year: 2025, liquidBalance: 0, propertyValue: 0, investmentValue: 50_000, pensionValue: 0, monthlyRecurring: 0, vehicleCosts: 0,
    });
    expect(migrated).toMatchObject({ vehicles: [], vehicleEntries: [], propertyAnnualSummaries: [], investmentAnnualSummaries: [], vehicleAnnualSummaries: [] });
  });

  it("upgrades version 3 hardcoded property taxes to the configurable catalog", () => {
    const legacy = structuredClone(createEmptyFinanceData(2026)) as unknown as {
      meta: { schemaVersion: number };
      taxTypes?: unknown;
      properties: Array<Record<string, unknown>>;
      propertyEntries: Array<Record<string, unknown>>;
      categories: Array<{ id: string }>;
      paymentMethods: Array<{ id: string }>;
    };
    legacy.meta.schemaVersion = 3;
    delete legacy.taxTypes;
    const propertyId = crypto.randomUUID();
    legacy.properties.push({
      id: propertyId, name: "Synthetic home", kind: "apartment", usage: "residence",
      ownershipShare: 1, purchasePrice: 0, active: true, notes: "",
    });
    legacy.propertyEntries.push({
      id: crypto.randomUUID(), propertyId, date: "2026-06-16", kind: "expense",
      category: "IMU", categoryId: legacy.categories[3].id, description: "Second installment",
      amount: 350, paymentMethodId: legacy.paymentMethods[0].id,
      detailKind: "tax_imu", taxInstallment: "second", notes: "",
    });

    const migrated = migrateFinanceData(legacy);
    const imu = migrated.taxTypes.find((item) => item.name === "IMU")!;

    expect(migrated.meta.schemaVersion).toBe(8);
    expect(migrated.propertyEntries[0]).toMatchObject({
      taxTypeId: imu.id,
      taxInstallmentNumber: 2,
      category: "IMU",
      amount: 350,
    });
    expect(migrated.propertyEntries[0].detailKind).toBeUndefined();
  });

  it("upgrades version 4 property history with phone internet and condominium fields", () => {
    const legacy = structuredClone(createEmptyFinanceData(2026)) as unknown as {
      meta: { schemaVersion: number };
      propertyAnnualSummaries: Array<Record<string, unknown>>;
    };
    legacy.meta.schemaVersion = 4;
    legacy.propertyAnnualSummaries = [{
      propertyId: crypto.randomUUID(),
      year: 2025,
      income: 0,
      expenses: 1_000,
      closingValue: 200_000,
      electricityKwh: 100,
      gasCubicMeters: 50,
      waterCubicMeters: 20,
      electricityCost: 70,
      gasCost: 80,
      waterCost: 30,
    }];

    const migrated = migrateFinanceData(legacy);

    expect(migrated.meta.schemaVersion).toBe(8);
    expect(migrated.propertyAnnualSummaries[0]).toMatchObject({
      phoneInternetCost: 0,
      condominiumCost: 0,
    });
  });

  it("upgrades version 5 investment cash movements when the active account is unambiguous", () => {
    const legacy = structuredClone(createEmptyFinanceData(2026));
    const accountId = crypto.randomUUID();
    const investmentId = crypto.randomUUID();
    const entryId = crypto.randomUUID();
    const transactionId = crypto.randomUUID();
    const recurringId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    legacy.meta.schemaVersion = 5 as 6;
    legacy.accounts.push({
      id: accountId, name: "Synthetic account", kind: "bank", currency: "EUR",
      openingBalance: 1_000, active: true, openedAt: "2026-01-01", notes: "",
    });
    legacy.investments.push({
      id: investmentId, name: "Synthetic investment", kind: "fund", provider: "", currency: "EUR",
      periodicAmount: 100, periodicFrequency: "monthly", periodicNextDueDate: "2026-08-01",
      periodicCategoryId: legacy.categories[8].id, periodicPaymentMethodId: legacy.paymentMethods[0].id,
      active: true, openedAt: "2026-01-01", notes: "",
    });
    legacy.investmentEntries.push({
      id: entryId, investmentId, date: "2026-02-01", kind: "contribution", amount: 250,
      description: "Synthetic contribution", categoryId: legacy.categories[8].id,
      paymentMethodId: legacy.paymentMethods[0].id, transactionId, notes: "",
    });
    legacy.transactions.push({
      id: transactionId, date: "2026-02-01", description: "Synthetic contribution",
      categoryId: legacy.categories[8].id, paymentMethodId: legacy.paymentMethods[0].id,
      kind: "transfer", cashFlowDirection: "outflow", amount: 250, currency: "EUR",
      investmentId, investmentEntryId: entryId, notes: "", createdAt: timestamp, updatedAt: timestamp,
    });
    legacy.recurringItems.push({
      id: recurringId, name: "Synthetic plan", kind: "investment", direction: "expense",
      amount: 100, frequency: "monthly", categoryId: legacy.categories[8].id,
      paymentMethodId: legacy.paymentMethods[0].id, investmentId, nextDueDate: "2026-08-01",
      active: true, notes: "",
    });

    const migrated = migrateFinanceData(legacy);

    expect(migrated.meta.schemaVersion).toBe(8);
    expect(migrated.investmentEntries[0]?.accountId).toBe(accountId);
    expect(migrated.transactions[0]?.accountId).toBe(accountId);
    expect(migrated.investments[0]?.periodicAccountId).toBe(accountId);
    expect(migrated.recurringItems[0]?.accountId).toBe(accountId);
  });

  it("upgrades version 6 linked records without guessing historical cash movements", () => {
    const legacy = structuredClone(createEmptyFinanceData(2026));
    const accountId = crypto.randomUUID();
    const propertyId = crypto.randomUUID();
    const entryId = crypto.randomUUID();
    const transactionId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    legacy.meta.schemaVersion = 6 as 7;
    legacy.accounts.push({
      id: accountId, name: "Synthetic bank", kind: "bank", currency: "EUR",
      openingBalance: 0, active: true, openedAt: "2026-01-01", notes: "",
    });
    legacy.properties.push({
      id: propertyId, name: "Synthetic property", kind: "apartment", usage: "residence",
      ownershipShare: 1, purchasePrice: 0, active: true, notes: "",
    });
    legacy.propertyEntries.push({
      id: entryId, propertyId, date: "2026-02-01", kind: "expense", category: "Home",
      categoryId: legacy.categories[3].id, description: "Synthetic expense", amount: 25,
      paymentMethodId: legacy.paymentMethods[0].id, transactionId, notes: "",
    });
    legacy.transactions.push({
      id: transactionId, date: "2026-02-01", description: "Synthetic expense",
      categoryId: legacy.categories[3].id, paymentMethodId: legacy.paymentMethods[0].id,
      accountId, kind: "expense", amount: 25, currency: "EUR", propertyId, propertyEntryId: entryId,
      notes: "", createdAt: timestamp, updatedAt: timestamp,
    });

    const migrated = migrateFinanceData(legacy);

    expect(migrated.meta.schemaVersion).toBe(8);
    expect(migrated.propertyEntries[0].accountId).toBe(accountId);
    expect(migrated.transactions[0].destinationAccountId).toBeUndefined();
    expect(migrated.accounts[0].defaultFundingAccountId).toBeUndefined();
  });

  it("does not guess an investment cash account when multiple accounts are active", () => {
    const legacy = structuredClone(createEmptyFinanceData(2026));
    const investmentId = crypto.randomUUID();
    const entryId = crypto.randomUUID();
    const transactionId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    legacy.meta.schemaVersion = 5 as 6;
    legacy.accounts.push(
      {
        id: crypto.randomUUID(), name: "Synthetic account A", kind: "bank", currency: "EUR",
        openingBalance: 1_000, active: true, openedAt: "2026-01-01", notes: "",
      },
      {
        id: crypto.randomUUID(), name: "Synthetic account B", kind: "bank", currency: "EUR",
        openingBalance: 2_000, active: true, openedAt: "2026-01-01", notes: "",
      },
    );
    legacy.investments.push({
      id: investmentId, name: "Synthetic investment", kind: "fund", provider: "", currency: "EUR",
      active: true, openedAt: "2026-01-01", notes: "",
    });
    legacy.investmentEntries.push({
      id: entryId, investmentId, date: "2026-02-01", kind: "contribution", amount: 250,
      description: "Synthetic contribution", categoryId: legacy.categories[8].id,
      paymentMethodId: legacy.paymentMethods[0].id, transactionId, notes: "",
    });
    legacy.transactions.push({
      id: transactionId, date: "2026-02-01", description: "Synthetic contribution",
      categoryId: legacy.categories[8].id, paymentMethodId: legacy.paymentMethods[0].id,
      kind: "transfer", cashFlowDirection: "outflow", amount: 250, currency: "EUR",
      investmentId, investmentEntryId: entryId, notes: "", createdAt: timestamp, updatedAt: timestamp,
    });

    const migrated = migrateFinanceData(legacy);

    expect(migrated.investmentEntries[0]?.accountId).toBeUndefined();
    expect(migrated.transactions[0]?.accountId).toBeUndefined();
  });

  it("upgrades version 7 planned occurrences without guessing a late rent's competence", () => {
    const legacy = structuredClone(createEmptyFinanceData(2026));
    legacy.meta.schemaVersion = 7 as 8;
    const propertyId = crypto.randomUUID();
    const recurringId = crypto.randomUUID();
    const plannedTransactionId = crypto.randomUUID();
    const plannedEntryId = crypto.randomUUID();
    const confirmedTransactionId = crypto.randomUUID();
    const confirmedEntryId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const categoryId = legacy.categories.find((item) => item.nameIt === "Affitti")!.id;
    const paymentMethodId = legacy.paymentMethods[0].id;
    legacy.properties.push({
      id: propertyId, name: "Synthetic rental", kind: "apartment", usage: "rental",
      ownershipShare: 1, purchasePrice: 0, active: true, notes: "",
    });
    legacy.recurringItems.push({
      id: recurringId, name: "Synthetic rent", kind: "rent", direction: "income", amount: 800,
      frequency: "monthly", categoryId, paymentMethodId, propertyId, nextDueDate: "2026-08-15",
      active: true, notes: "",
    });
    legacy.transactions.push(
      {
        id: confirmedTransactionId, date: "2026-07-04", description: "Synthetic rent", categoryId,
        paymentMethodId, kind: "income", amount: 800, currency: "EUR", recurringId, propertyId,
        propertyEntryId: confirmedEntryId, planned: false, notes: "", createdAt: timestamp, updatedAt: timestamp,
      },
      {
        id: plannedTransactionId, date: "2026-08-15", description: "Synthetic rent", categoryId,
        paymentMethodId, kind: "income", amount: 800, currency: "EUR", recurringId, propertyId,
        propertyEntryId: plannedEntryId, planned: true, notes: "", createdAt: timestamp, updatedAt: timestamp,
      },
    );
    legacy.propertyEntries.push(
      {
        id: confirmedEntryId, propertyId, date: "2026-07-04", kind: "income", category: "Affitti",
        categoryId, description: "Synthetic rent", amount: 800, paymentMethodId,
        transactionId: confirmedTransactionId, notes: "",
      },
      {
        id: plannedEntryId, propertyId, date: "2026-08-15", kind: "income", category: "Affitti",
        categoryId, description: "Synthetic rent", amount: 800, paymentMethodId,
        transactionId: plannedTransactionId, notes: "",
      },
    );

    const migrated = migrateFinanceData(legacy);

    expect(migrated.meta.schemaVersion).toBe(8);
    expect(migrated.transactions.find((item) => item.id === plannedTransactionId)?.dueDate).toBe("2026-08-15");
    expect(migrated.propertyEntries.find((item) => item.id === plannedEntryId)?.dueDate).toBe("2026-08-15");
    expect(migrated.transactions.find((item) => item.id === confirmedTransactionId)?.dueDate).toBeUndefined();
    expect(migrated.propertyEntries.find((item) => item.id === confirmedEntryId)?.dueDate).toBeUndefined();
  });
});
