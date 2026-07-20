import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import { ExcelWorkbookRepository } from "../../src/infrastructure/spreadsheet/ExcelWorkbookRepository";

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
    const repository = new ExcelWorkbookRepository();
    await repository.save(filePath, data);
    const loaded = await repository.load(filePath);
    expect(loaded).toEqual(data);
    const bytes = await readFile(filePath);
    expect(bytes.byteLength).toBeGreaterThan(10_000);
  });

  it("rejects unsupported extensions before touching the filesystem", async () => {
    const repository = new ExcelWorkbookRepository();
    await expect(repository.save(path.join(tmpdir(), "bad.csv"), createEmptyFinanceData())).rejects.toThrow("INVALID_WORKBOOK_PATH");
  });
});
