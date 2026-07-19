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

    expect(migrated.meta.schemaVersion).toBe(3);
    expect(migrated.investmentTypes).toHaveLength(7);
    expect(migrated.annualSummaries[0]).toMatchObject({
      year: 2025, liquidBalance: 0, propertyValue: 0, investmentValue: 50_000, pensionValue: 0, monthlyRecurring: 0, vehicleCosts: 0,
    });
    expect(migrated).toMatchObject({ vehicles: [], vehicleEntries: [], propertyAnnualSummaries: [], investmentAnnualSummaries: [], vehicleAnnualSummaries: [] });
  });
});
