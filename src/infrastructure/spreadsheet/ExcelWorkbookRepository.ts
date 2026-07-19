import { randomUUID } from "node:crypto";
import { access, copyFile, mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import { APP_CONFIG } from "../../config/appConfig";
import { computeDashboard } from "../../domain/finance";
import { migrateFinanceData } from "../../domain/migrations";
import { financeDataSchema, type FinanceData } from "../../domain/models";
import { WORKBOOK_SCHEMA_VERSION, WORKBOOK_TABLES, WORKBOOK_TABLES_V1, WORKBOOK_TABLES_V2, type WorkbookTableDefinition } from "./workbookSchema";

const HEADER_FILL = "FF073B4C";
const ACCENT_FILL = "FF74D6B1";
const GOLD_FILL = "FFFFBA49";
const LIGHT_FILL = "FFEAF7F2";

function assertWorkbookPath(filePath: string): void {
  if (filePath.length > 4_096 || path.extname(filePath).toLowerCase() !== ".xlsx") throw new Error("INVALID_WORKBOOK_PATH");
  if (!path.isAbsolute(filePath) || filePath.includes("\0")) throw new Error("INVALID_WORKBOOK_PATH");
}

function toExcelDate(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function readTimestampValue(value: ExcelJS.CellValue): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return new Date(excelEpoch + Math.round(value * 86_400_000)).toISOString();
  }
  return readCellValue(value);
}

function readCellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined || value === "") return undefined;
  if (value instanceof Date) return toIsoDate(value);
  if (typeof value === "object") {
    if ("result" in value) return readCellValue(value.result as ExcelJS.CellValue);
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
  }
  return value;
}

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
}

function styleHeader(row: ExcelJS.Row): void {
  row.height = 26;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = { bottom: { style: "thin", color: { argb: ACCENT_FILL } } };
  });
}

function configureDataSheet(sheet: ExcelJS.Worksheet, definition: WorkbookTableDefinition): void {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: { row: 1, column: definition.columns.length } };
  sheet.columns = definition.columns.map((name) => ({
    key: name,
    width: name === "description" || name === "notes" ? 32 : name === "id" || name.endsWith("Id") ? 38 : 16,
  }));
  styleHeader(sheet.getRow(1));
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF6FAF8" } }; });
    }
  });
  for (const column of definition.dateColumns ?? []) sheet.getColumn(column).numFmt = "yyyy-mm-dd";
  for (const column of ["amount", "openingBalance", "purchasePrice", "salePrice", "fuelUnitPrice", "cadastralValue", "expectedMonthlyRent", "periodicAmount", "ownerShare", "partnerShare", "income", "expenses", "netCashFlow", "closingNetWorth", "liquidBalance", "propertyValue", "investmentValue", "pensionValue", "monthlyRecurring", "vehicleCosts", "closingValue", "contributions", "withdrawals", "totalCosts", "fuelCosts", "installments", "taxes", "insurance", "tires", "maintenance", "repairs", "electricityCost", "gasCost", "waterCost"]) {
    if (definition.columns.includes(column)) sheet.getColumn(column).numFmt = '#,##0.00 [$€-it-IT]';
  }
  if (definition.columns.includes("ownershipShare")) sheet.getColumn("ownershipShare").numFmt = "0%";
}

function addOverview(workbook: ExcelJS.Workbook, data: FinanceData): void {
  const metrics = computeDashboard(data);
  const sheet = workbook.addWorksheet("Overview", { properties: { tabColor: { argb: ACCENT_FILL } } });
  sheet.views = [{ showGridLines: false }];
  sheet.columns = [{ width: 28 }, { width: 20 }, { width: 4 }, { width: 28 }, { width: 20 }];
  sheet.mergeCells("A1:E2");
  const title = sheet.getCell("A1");
  title.value = "ContaMì — Financial overview / Panoramica finanziaria";
  title.font = { bold: true, size: 22, color: { argb: "FFFFFFFF" } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  title.alignment = { vertical: "middle", horizontal: "left" };
  const cards: Array<[string, number, string]> = [
    ["Net worth / Patrimonio netto", metrics.netWorth, "A4"],
    ["Liquidity / Liquidità", metrics.liquidBalance, "D4"],
    ["Properties / Immobili", metrics.propertyValue, "A7"],
    ["Investments / Investimenti", metrics.investmentValue, "D7"],
    ["Private pensions / Pensioni integrative", metrics.pensionValue, "A10"],
    ["Monthly commitments / Impegni mensili", metrics.monthlyRecurring, "D10"],
    ["Year income / Entrate anno", metrics.yearIncome, "A13"],
    ["Year expenses / Uscite anno", metrics.yearExpenses, "D13"],
  ];
  for (const [label, value, anchor] of cards) {
    const cell = sheet.getCell(anchor);
    cell.value = label;
    cell.font = { bold: true, color: { argb: HEADER_FILL } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_FILL } };
    const valueCell = sheet.getCell(cell.row + 1, cell.col);
    valueCell.value = value;
    valueCell.numFmt = '#,##0.00 [$€-it-IT]';
    valueCell.font = { bold: true, size: 18, color: { argb: HEADER_FILL } };
  }
  sheet.getCell("A17").value = "This overview is refreshed whenever ContaMì saves the workbook.";
  sheet.getCell("A18").value = "La panoramica viene aggiornata a ogni salvataggio di ContaMì.";
  sheet.getCell("A20").value = "Schema version";
  sheet.getCell("B20").value = WORKBOOK_SCHEMA_VERSION;
  sheet.getCell("D20").value = "Updated";
  sheet.getCell("E20").value = data.meta.updatedAt;
}

function addSchemaSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet("Schema", { properties: { tabColor: { argb: GOLD_FILL } } });
  sheet.columns = [{ width: 24 }, { width: 58 }, { width: 58 }];
  sheet.addRow(["Sheet / Foglio", "Italiano", "English"]);
  const descriptions: Record<string, [string, string]> = {
    Categories: ["Categorie disponibili per classificare le registrazioni.", "Categories available for classifying entries."],
    "Payment Methods": ["Metodi di pagamento selezionabili.", "Selectable payment methods."],
    "Investment Types": ["Tipologie personalizzabili di investimento.", "Customizable investment types."],
    Accounts: ["Conti e saldi iniziali.", "Accounts and opening balances."],
    Transactions: ["Entrate, uscite e trasferimenti quotidiani.", "Daily income, expenses and transfers."],
    Properties: ["Anagrafica degli immobili.", "Property registry."],
    "Property Entries": ["Entrate, spese, valutazioni e consumi degli immobili.", "Property income, expenses, valuations and consumption."],
    Investments: ["Anagrafica di investimenti e pensioni integrative, con pensioni raccoglitore e comparti collegati.", "Investment and private-pension registry, including pension collectors and linked compartments."],
    "Investment Entries": ["Versamenti, liquidazioni e valutazioni di investimenti e comparti pensione.", "Contributions, liquidations, and valuations for investments and pension compartments."],
    "Recurring Items": ["Abbonamenti, servizi, rate e versamenti periodici.", "Subscriptions, services, installments and recurring contributions."],
    "Shared Expenses": ["Spese condivise e relativo saldo.", "Shared expenses and related balance."],
    Vehicles: ["Anagrafica delle automobili attuali e precedenti.", "Registry of current and previous vehicles."],
    "Vehicle Entries": ["Rifornimenti, rate, bollo, assicurazione, pneumatici, manutenzione e riparazioni.", "Fuel, installments, road tax, insurance, tyres, maintenance and repairs."],
    "Annual Summaries": ["Consuntivi degli anni archiviati.", "Archived annual summaries."],
    "Property History": ["Consuntivi annuali per immobile, inclusi consumi, costi delle utenze e valore commerciale.", "Annual property actuals, including utility consumption, utility costs, and commercial value."],
    "Investment History": ["Valori e movimenti annuali per investimento e comparto pensione.", "Annual values and movements for each investment and pension compartment."],
    "Vehicle History": ["Consuntivi annuali per il confronto tra automobili.", "Annual actuals for comparing vehicles."],
  };
  for (const definition of WORKBOOK_TABLES) {
    const description = descriptions[definition.sheet];
    sheet.addRow([definition.sheet, description[0], description[1]]);
  }
  styleHeader(sheet.getRow(1));
  const footerRow = WORKBOOK_TABLES.length + 3;
  sheet.getCell(`A${footerRow}`).value = "Do not rename columns if you want to keep the workbook compatible with ContaMì.";
  sheet.getCell(`A${footerRow + 1}`).value = "Non rinominare le colonne se vuoi mantenere il workbook compatibile con ContaMì.";
}

export class ExcelWorkbookRepository {
  async load(filePath: string): Promise<FinanceData> {
    assertWorkbookPath(filePath);
    const info = await stat(filePath);
    if (info.size > APP_CONFIG.workbook.maxBytes) throw new Error("WORKBOOK_TOO_LARGE");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const metaSheet = workbook.getWorksheet("_Meta");
    if (!metaSheet) throw new Error("INVALID_WORKBOOK_SCHEMA");
    const metaValues: Record<string, unknown> = {};
    metaSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const key = readCellValue(row.getCell(1).value);
      if (typeof key === "string") {
        metaValues[key] = key === "createdAt" || key === "updatedAt"
          ? readTimestampValue(row.getCell(2).value)
          : readCellValue(row.getCell(2).value);
      }
    });
    const raw: Record<string, unknown> = {
      meta: {
        schemaVersion: Number(metaValues.schemaVersion),
        activeYear: Number(metaValues.activeYear),
        createdAt: metaValues.createdAt,
        updatedAt: metaValues.updatedAt,
      },
    };
    const schemaVersion = Number(metaValues.schemaVersion);
    const definitions = schemaVersion === 1 ? WORKBOOK_TABLES_V1 : schemaVersion === 2 ? WORKBOOK_TABLES_V2 : WORKBOOK_TABLES;
    for (const definition of definitions) {
      const sheet = workbook.getWorksheet(definition.sheet);
      if (!sheet) throw new Error("INVALID_WORKBOOK_SCHEMA");
      const rows: Record<string, unknown>[] = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const record: Record<string, unknown> = {};
        let hasValue = false;
        definition.columns.forEach((column, index) => {
          const cellValue = row.getCell(index + 1).value;
          const value = column === "createdAt" || column === "updatedAt"
            ? readTimestampValue(cellValue)
            : readCellValue(cellValue);
          if (value !== undefined) {
            record[column] = value;
            hasValue = true;
          }
        });
        if (hasValue) rows.push(normalizeRow(record));
      });
      raw[definition.key] = rows;
    }
    return migrateFinanceData(raw);
  }

  async save(filePath: string, data: FinanceData): Promise<void> {
    assertWorkbookPath(filePath);
    const validated = financeDataSchema.parse(data);
    await mkdir(path.dirname(filePath), { recursive: true });
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ContaMì";
    workbook.company = "ContaMì";
    workbook.created = new Date(validated.meta.createdAt);
    workbook.modified = new Date(validated.meta.updatedAt);
    workbook.calcProperties.fullCalcOnLoad = true;
    addOverview(workbook, validated);
    addSchemaSheet(workbook);
    const meta = workbook.addWorksheet("_Meta", { state: "veryHidden" });
    meta.addRow(["key", "value"]);
    meta.addRows([
      ["schemaVersion", validated.meta.schemaVersion],
      ["activeYear", validated.meta.activeYear],
      ["createdAt", validated.meta.createdAt],
      ["updatedAt", validated.meta.updatedAt],
    ]);
    for (const definition of WORKBOOK_TABLES) {
      const sheet = workbook.addWorksheet(definition.sheet);
      sheet.addRow(definition.columns);
      const rows = validated[definition.key] as Array<Record<string, unknown>>;
      for (const value of rows) {
        sheet.addRow(definition.columns.map((column) => {
          const cell = value[column];
          if (cell === undefined || cell === "") return null;
          return definition.dateColumns?.includes(column) && typeof cell === "string" ? toExcelDate(cell) : cell;
        }));
      }
      configureDataSheet(sheet, definition);
    }
    const temporary = `${filePath}.tmp-${randomUUID()}.xlsx`;
    await workbook.xlsx.writeFile(temporary);
    const verification = new ExcelJS.Workbook();
    await verification.xlsx.readFile(temporary);
    if (!verification.getWorksheet("_Meta") || !verification.getWorksheet("Transactions")) {
      await rm(temporary, { force: true });
      throw new Error("WORKBOOK_VERIFICATION_FAILED");
    }
    await this.createBackup(filePath);
    await this.replace(filePath, temporary);
  }

  private async createBackup(filePath: string): Promise<void> {
    try {
      await access(filePath);
    } catch {
      return;
    }
    const backupDirectory = path.join(path.dirname(filePath), ".contami-backups");
    await mkdir(backupDirectory, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await copyFile(filePath, path.join(backupDirectory, `${path.basename(filePath, ".xlsx")}-${stamp}.xlsx`));
    const files = (await readdir(backupDirectory)).filter((file) => file.endsWith(".xlsx")).sort().reverse();
    for (const old of files.slice(APP_CONFIG.workbook.backupLimit)) await rm(path.join(backupDirectory, old), { force: true });
  }

  private async replace(filePath: string, temporary: string): Promise<void> {
    try {
      await rename(temporary, filePath);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST" && code !== "EPERM") throw error;
    }
    const rollback = `${filePath}.rollback-${randomUUID()}`;
    await rename(filePath, rollback);
    try {
      await rename(temporary, filePath);
      await rm(rollback, { force: true });
    } catch (error) {
      await rename(rollback, filePath);
      throw error;
    }
  }
}
