import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ExcelJS from "exceljs";
import { afterEach, describe, expect, it } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import { ExcelWorkbookRepository } from "../../src/infrastructure/spreadsheet/ExcelWorkbookRepository";
import { WORKBOOK_TABLES_V3, WORKBOOK_TABLES_V4 } from "../../src/infrastructure/spreadsheet/workbookSchema";

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });

function withoutId(value: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "id"));
}

describe("ExcelWorkbookRepository", () => {
  it("round-trips typed finance data and writes human-readable sheets", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-workbook-")); directories.push(directory);
    const filePath = path.join(directory, "ContaMi-2026.xlsx");
    const data = createEmptyFinanceData(2026);
    const bankId = crypto.randomUUID();
    const cashId = crypto.randomUUID();
    data.accounts.push(
      { id: bankId, name: "Synthetic bank", kind: "bank", currency: "EUR", openingBalance: 1_000, active: true, openedAt: "2026-01-01", notes: "" },
      { id: cashId, name: "Synthetic cash", kind: "cash", defaultFundingAccountId: bankId, currency: "EUR", openingBalance: 25, active: true, openedAt: "2026-01-01", notes: "" },
    );
    const timestamp = new Date().toISOString();
    data.transactions.push({
      id: crypto.randomUUID(), date: "2026-05-10", description: "Test entry",
      categoryId: data.categories[0].id, paymentMethodId: data.paymentMethods[0].id, accountId: bankId, destinationAccountId: cashId,
      kind: "transfer", cashFlowDirection: "neutral", amount: 123.45, currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp,
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
      paymentMethodId: data.paymentMethods[0].id, accountId: bankId, notes: "",
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
    expect(workbook.getWorksheet("Accounts")?.getRow(1).values).toContain("defaultFundingAccountId");
    expect(workbook.getWorksheet("Transactions")?.getRow(1).values).toContain("destinationAccountId");
    expect(workbook.getWorksheet("Property Entries")?.getRow(1).values).toContain("accountId");
  });

  it("repairs manually duplicated UUIDs in place and keeps a recoverable backup", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-workbook-uuid-repair-")); directories.push(directory);
    const filePath = path.join(directory, "ContaMi-2026.xlsx");
    const data = createEmptyFinanceData(2026);
    const investmentId = crypto.randomUUID();
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
        id: crypto.randomUUID(),
        investmentId,
        date: "2026-01-31",
        kind: "valuation",
        amount: 35_000,
        description: "January valuation",
        notes: "",
      },
      {
        id: crypto.randomUUID(),
        investmentId,
        date: "2026-02-28",
        kind: "valuation",
        amount: 36_000,
        description: "February valuation",
        notes: "",
      },
    );
    const repository = new ExcelWorkbookRepository();
    await repository.save(filePath, data);

    const manuallyEdited = new ExcelJS.Workbook();
    await manuallyEdited.xlsx.readFile(filePath);
    const entries = manuallyEdited.getWorksheet("Investment Entries")!;
    entries.getCell("A3").value = entries.getCell("A2").value;
    const sheetCount = manuallyEdited.worksheets.length;
    const preservedStyle = JSON.stringify(entries.getCell("A3").style);
    await manuallyEdited.xlsx.writeFile(filePath);

    const loaded = await repository.loadWithUuidRepair(filePath);

    expect(loaded.repairedIds).toBe(1);
    expect(loaded.repairedLinks).toBe(0);
    expect(loaded.data.investmentEntries).toHaveLength(2);
    expect(new Set(loaded.data.investmentEntries.map((entry) => entry.id)).size).toBe(2);
    expect(loaded.data.investmentEntries.map(withoutId)).toEqual(data.investmentEntries.map(withoutId));
    expect(await readdir(path.join(directory, ".contami-backups"))).toHaveLength(1);

    const repairedWorkbook = new ExcelJS.Workbook();
    await repairedWorkbook.xlsx.readFile(filePath);
    expect(repairedWorkbook.worksheets).toHaveLength(sheetCount);
    expect(repairedWorkbook.getWorksheet("Investment Entries")?.getColumn(1).values.slice(2)).toEqual(
      loaded.data.investmentEntries.map((entry) => entry.id),
    );
    expect(JSON.stringify(repairedWorkbook.getWorksheet("Investment Entries")?.getCell("A3").style)).toBe(preservedStyle);

    await expect(repository.loadWithUuidRepair(filePath)).resolves.toMatchObject({ repairedIds: 0 });
    expect(await readdir(path.join(directory, ".contami-backups"))).toHaveLength(1);
  });

  it("reconciles orphan investment movements once and preserves a recoverable backup", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-workbook-investment-repair-")); directories.push(directory);
    const filePath = path.join(directory, "ContaMi-2026.xlsx");
    const data = createEmptyFinanceData(2026);
    const investmentId = crypto.randomUUID();
    const entryId = crypto.randomUUID();
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
    data.investmentEntries.push({
      id: entryId,
      investmentId,
      date: "2026-05-10",
      kind: "withdrawal",
      amount: 150,
      description: "Synthetic orphan liquidation",
      categoryId: data.categories.find((item) => item.nameIt === "Investimenti")!.id,
      paymentMethodId: data.paymentMethods[0].id,
      notes: "",
    });
    const repository = new ExcelWorkbookRepository();
    await repository.save(filePath, data);

    const loaded = await repository.loadWithUuidRepair(filePath);

    expect(loaded.repairedInvestmentLinks).toBe(1);
    expect(loaded.ambiguousInvestmentLinks).toBe(0);
    expect(loaded.data.transactions).toHaveLength(1);
    expect(loaded.data.transactions[0]).toMatchObject({
      investmentId,
      investmentEntryId: entryId,
      kind: "transfer",
      cashFlowDirection: "inflow",
      amount: 150,
    });
    expect(loaded.data.investmentEntries[0]?.transactionId).toBe(loaded.data.transactions[0]?.id);
    expect(await readdir(path.join(directory, ".contami-backups"))).toHaveLength(1);

    const secondLoad = await repository.loadWithUuidRepair(filePath);
    expect(secondLoad.repairedInvestmentLinks).toBe(0);
    expect(secondLoad.data).toEqual(loaded.data);
    expect(await readdir(path.join(directory, ".contami-backups"))).toHaveLength(1);
  });

  it("repairs unambiguous transaction accounts and closes finished installment plans once", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-workbook-operational-repair-")); directories.push(directory);
    const filePath = path.join(directory, "ContaMi-2026.xlsx");
    const data = createEmptyFinanceData(2026);
    const accountId = crypto.randomUUID();
    const recurringId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    data.accounts.push({
      id: accountId, name: "Synthetic account", kind: "bank", currency: "EUR",
      openingBalance: 1_000, active: true, openedAt: "2026-01-01", notes: "",
    });
    data.transactions.push({
      id: crypto.randomUUID(), date: "2026-05-10", description: "Synthetic account-less expense",
      categoryId: data.categories.find((item) => item.kind === "expense")!.id,
      paymentMethodId: data.paymentMethods[0].id, kind: "expense", amount: 25,
      currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp,
    });
    data.recurringItems.push({
      id: recurringId, name: "Synthetic finished plan", kind: "installment", direction: "expense",
      amount: 25, frequency: "monthly", categoryId: data.categories.find((item) => item.kind === "expense")!.id,
      paymentMethodId: data.paymentMethods[0].id, nextDueDate: "2026-06-10",
      remainingInstallments: 0, active: true, notes: "",
    });
    const repository = new ExcelWorkbookRepository();
    await repository.save(filePath, data);

    const loaded = await repository.loadWithUuidRepair(filePath);

    expect(loaded.repairedTransactionAccounts).toBe(1);
    expect(loaded.unresolvedTransactionAccounts).toBe(0);
    expect(loaded.closedInstallmentPlans).toBe(1);
    expect(loaded.data.transactions[0]?.accountId).toBe(accountId);
    expect(loaded.data.recurringItems[0]).toMatchObject({ active: false });
    expect(await readdir(path.join(directory, ".contami-backups"))).toHaveLength(1);

    const secondLoad = await repository.loadWithUuidRepair(filePath);
    expect(secondLoad).toMatchObject({
      repairedTransactionAccounts: 0,
      unresolvedTransactionAccounts: 0,
      closedInstallmentPlans: 0,
    });
    expect(secondLoad.data).toEqual(loaded.data);
    expect(await readdir(path.join(directory, ".contami-backups"))).toHaveLength(1);
  });

  it("reports ambiguous legacy matches without changing the workbook", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-workbook-investment-ambiguous-")); directories.push(directory);
    const filePath = path.join(directory, "ContaMi-2026.xlsx");
    const data = createEmptyFinanceData(2026);
    const investmentId = crypto.randomUUID();
    const entryId = crypto.randomUUID();
    const categoryId = data.categories.find((item) => item.nameIt === "Investimenti")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
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
    data.investmentEntries.push({
      id: entryId,
      investmentId,
      date: "2026-05-10",
      kind: "contribution",
      amount: 150,
      description: "Ambiguous contribution",
      categoryId,
      paymentMethodId,
      notes: "",
    });
    data.transactions.push(...[crypto.randomUUID(), crypto.randomUUID()].map((id) => ({
      id,
      date: "2026-05-10",
      description: "Ambiguous contribution",
      categoryId,
      paymentMethodId,
      kind: "expense" as const,
      amount: 150,
      currency: "EUR",
      notes: "",
      createdAt: timestamp,
      updatedAt: timestamp,
    })));
    const repository = new ExcelWorkbookRepository();
    await repository.save(filePath, data);

    const loaded = await repository.loadWithUuidRepair(filePath);

    expect(loaded.repairedInvestmentLinks).toBe(0);
    expect(loaded.ambiguousInvestmentLinks).toBe(1);
    expect(loaded.data).toEqual(data);
    await expect(readdir(path.join(directory, ".contami-backups"))).rejects.toThrow();
  });

  it("rejects unsupported extensions before touching the filesystem", async () => {
    const repository = new ExcelWorkbookRepository();
    await expect(repository.save(path.join(tmpdir(), "bad.csv"), createEmptyFinanceData())).rejects.toThrow("INVALID_WORKBOOK_PATH");
  });

  it("loads a version 3 workbook and migrates hardcoded taxes to the current schema", async () => {
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
    expect(migrated.meta.schemaVersion).toBe(7);
    expect(migrated.propertyEntries[0]).toMatchObject({ taxTypeId: imu.id, taxInstallmentNumber: 2, amount: 350 });
  });

  it("loads a version 4 workbook and migrates property history to the current schema", async () => {
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
    expect(migrated.meta.schemaVersion).toBe(7);
    expect(migrated.propertyAnnualSummaries[0]).toMatchObject({ phoneInternetCost: 0, condominiumCost: 0 });
  });
});
