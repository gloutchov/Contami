import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ExcelJS from "exceljs";
import { afterEach, describe, expect, it } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import { ExcelWorkbookRepository } from "../../src/infrastructure/spreadsheet/ExcelWorkbookRepository";
import {
  WORKBOOK_SCHEMA_VERSION,
  WORKBOOK_TABLES,
  WORKBOOK_TABLES_V1,
  WORKBOOK_TABLES_V2,
  type WorkbookTableDefinition,
} from "../../src/infrastructure/spreadsheet/workbookSchema";
import { buildSyntheticZip, REQUIRED_XLSX_ENTRIES, type SyntheticZipEntry } from "../helpers/syntheticZip";

const directories: string[] = [];
const MIB = 1024 * 1024;
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function hostileWorkbook(name: string, extra: SyntheticZipEntry): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "contami-workbook-preflight-"));
  directories.push(directory);
  const filePath = path.join(directory, name);
  await writeFile(filePath, buildSyntheticZip([...REQUIRED_XLSX_ENTRIES, extra]));
  return filePath;
}

async function legacyWorkbook(version: 1 | 2, definitions: WorkbookTableDefinition[]): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), `contami-workbook-v${version}-preflight-`));
  directories.push(directory);
  const filePath = path.join(directory, `ContaMi-v${version}.xlsx`);
  const data = createEmptyFinanceData(2026);
  const repository = new ExcelWorkbookRepository();
  await repository.save(filePath, data);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  workbook.getWorksheet("_Meta")!.getCell("B2").value = version;
  for (const definition of WORKBOOK_TABLES) {
    const current = workbook.getWorksheet(definition.sheet);
    if (current) workbook.removeWorksheet(current.id);
  }
  for (const definition of definitions) {
    const sheet = workbook.addWorksheet(definition.sheet);
    sheet.addRow(definition.columns);
    sheet.addRows(data[definition.key].map((item) => definition.columns.map((column) => (
      item as unknown as Record<string, unknown>
    )[column] ?? null)));
  }
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

describe("ExcelWorkbookRepository ZIP preflight", () => {
  it("maps hostile expansion to a safe resource error before ExcelJS parsing", async () => {
    const filePath = await hostileWorkbook("ratio.xlsx", {
      name: "xl/worksheets/sheet1.xml",
      data: Buffer.alloc(2 * MIB, 0x41),
      compression: "deflate",
    });
    await expect(new ExcelWorkbookRepository().load(filePath)).rejects.toThrow("WORKBOOK_RESOURCE_LIMIT");
  });

  it("rejects nested archives with a safe structural error", async () => {
    const filePath = await hostileWorkbook("nested.xlsx", {
      name: "xl/media/nested.xlsx",
      data: Buffer.from("synthetic"),
    });
    await expect(new ExcelWorkbookRepository().load(filePath)).rejects.toThrow("WORKBOOK_UNSAFE");
  });

  it.each([
    [1, WORKBOOK_TABLES_V1],
    [2, WORKBOOK_TABLES_V2],
  ] as const)("keeps a valid version %i workbook migratable", async (version, definitions) => {
    const filePath = await legacyWorkbook(version, [...definitions]);

    const loaded = await new ExcelWorkbookRepository().load(filePath);

    expect(loaded.meta.schemaVersion).toBe(WORKBOOK_SCHEMA_VERSION);
    expect(loaded.categories.length).toBeGreaterThan(0);
    expect(loaded.paymentMethods.length).toBeGreaterThan(0);
  });
});
