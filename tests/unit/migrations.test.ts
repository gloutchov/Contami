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

    expect(migrated.meta.schemaVersion).toBe(5);
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

    expect(migrated.meta.schemaVersion).toBe(5);
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

    expect(migrated.meta.schemaVersion).toBe(5);
    expect(migrated.propertyAnnualSummaries[0]).toMatchObject({
      phoneInternetCost: 0,
      condominiumCost: 0,
    });
  });
});
