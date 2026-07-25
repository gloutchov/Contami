import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ExcelJS from "exceljs";
import { afterEach, describe, expect, it } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import { ExcelWorkbookRepository } from "../../src/infrastructure/spreadsheet/ExcelWorkbookRepository";
import { WORKBOOK_TABLES_V3, WORKBOOK_TABLES_V4 } from "../../src/infrastructure/spreadsheet/workbookSchema";

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });

describe("ExcelWorkbookRepository", () => {
  it("round-trips typed finance data and writes human-readable sheets", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-workbook-")); directories.push(directory);
    const filePath = path.join(directory, "ContaMi-2026.xlsx");
    const data = createEmptyFinanceData(2026);
    const timestamp = new Date().toISOString();
    data.transactions.push({
      id: crypto.randomUUID(), date: "2026-05-10", description: "Test entry",
      categoryId: data.categories[0].id, paymentMethodId: data.paymentMethods[0].id,
      kind: "transfer", cashFlowDirection: "outflow", amount: 123.45, currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp,
    });
    const propertyId = crypto.randomUUID();
    data.properties.push({ id: propertyId, name: "Synthetic home", kind: "apartment", usage: "residence", areaSqm: 80, ownershipShare: 1, purchasePrice: 0, active: true, notes: "" });
    data.propertyEntries.push({
      id: crypto.randomUUID(), propertyId, date: "2026-06-01", kind: "valuation", category: "Valutazione",
      description: "Value per square metre", amount: 240_000, valuePerSqm: 3_000, notes: "",
    });
    data.propertyEntries.push({
      id: crypto.randomUUID(), propertyId, date: "2026-06-16", kind: "expense", category: "IMU",
      categoryId: data.categories[3].id, description: "Synthetic property tax", amount: 350,
      taxTypeId: data.taxTypes.find((item) => item.name === "IMU")!.id, taxInstallmentNumber: 2,
      paymentMethodId: data.paymentMethods[0].id, notes: "",
    });
    const repository = new ExcelWorkbookRepository();
    await repository.save(filePath, data);
    const loaded = await repository.load(filePath);
    expect(loaded).toEqual(data);
    const bytes = await readFile(filePath);
    expect(bytes.byteLength).toBeGreaterThan(10_000);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    expect(workbook.getWorksheet("Tax Types")?.getRow(1).values).toContain("installments");
    expect(workbook.getWorksheet("Property Entries")?.getRow(1).values).toContain("taxTypeId");
    expect(workbook.getWorksheet("Property History")?.getRow(1).values).toContain("phoneInternetCost");
  });

  it("rejects unsupported extensions before touching the filesystem", async () => {
    const repository = new ExcelWorkbookRepository();
    await expect(repository.save(path.join(tmpdir(), "bad.csv"), createEmptyFinanceData())).rejects.toThrow("INVALID_WORKBOOK_PATH");
  });

  it("loads a version 3 workbook and migrates hardcoded taxes to schema v5", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-workbook-v3-")); directories.push(directory);
    const filePath = path.join(directory, "ContaMi-legacy.xlsx");
    const data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    data.properties.push({
      id: propertyId, name: "Synthetic legacy home", kind: "apartment", usage: "residence",
      ownershipShare: 1, purchasePrice: 0, active: true, notes: "",
    });
    const repository = new ExcelWorkbookRepository();
    await repository.save(filePath, data);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    workbook.getWorksheet("_Meta")!.getCell("B2").value = 3;
    const taxSheet = workbook.getWorksheet("Tax Types")!;
    workbook.removeWorksheet(taxSheet.id);
    const propertyEntries = workbook.getWorksheet("Property Entries")!;
    workbook.removeWorksheet(propertyEntries.id);
    const legacyDefinition = WORKBOOK_TABLES_V3.find((item) => item.key === "propertyEntries")!;
    const legacySheet = workbook.addWorksheet("Property Entries");
    legacySheet.addRow(legacyDefinition.columns);
    const legacyEntry: Record<string, unknown> = {
      id: crypto.randomUUID(), propertyId, date: new Date("2026-06-16T12:00:00Z"), kind: "expense",
      category: "IMU", categoryId: data.categories[3].id, description: "Legacy second installment",
      amount: 350, paymentMethodId: data.paymentMethods[0].id, detailKind: "tax_imu",
      taxInstallment: "second", notes: "",
    };
    legacySheet.addRow(legacyDefinition.columns.map((column) => legacyEntry[column] ?? null));
    await workbook.xlsx.writeFile(filePath);

    const migrated = await repository.load(filePath);
    const imu = migrated.taxTypes.find((item) => item.name === "IMU")!;
    expect(migrated.meta.schemaVersion).toBe(5);
    expect(migrated.propertyEntries[0]).toMatchObject({ taxTypeId: imu.id, taxInstallmentNumber: 2, amount: 350 });
  });

  it("loads a version 4 workbook and migrates property history to schema v5", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-workbook-v4-")); directories.push(directory);
    const filePath = path.join(directory, "ContaMi-v4.xlsx");
    const data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    data.properties.push({ id: propertyId, name: "Synthetic home", kind: "apartment", usage: "residence", ownershipShare: 1, purchasePrice: 0, active: true, notes: "" });
    data.propertyAnnualSummaries.push({
      propertyId,
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
      phoneInternetCost: 0,
      condominiumCost: 0,
    });
    const repository = new ExcelWorkbookRepository();
    await repository.save(filePath, data);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    workbook.getWorksheet("_Meta")!.getCell("B2").value = 4;
    const history = workbook.getWorksheet("Property History")!;
    workbook.removeWorksheet(history.id);
    const legacyDefinition = WORKBOOK_TABLES_V4.find((item) => item.key === "propertyAnnualSummaries")!;
    const legacySheet = workbook.addWorksheet("Property History");
    legacySheet.addRow(legacyDefinition.columns);
    const legacySummary = data.propertyAnnualSummaries[0] as unknown as Record<string, unknown>;
    legacySheet.addRow(legacyDefinition.columns.map((column) => legacySummary[column] ?? null));
    await workbook.xlsx.writeFile(filePath);

    const migrated = await repository.load(filePath);
    expect(migrated.meta.schemaVersion).toBe(5);
    expect(migrated.propertyAnnualSummaries[0]).toMatchObject({ phoneInternetCost: 0, condominiumCost: 0 });
  });
});
