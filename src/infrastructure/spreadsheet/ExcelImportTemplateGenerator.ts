import { randomUUID } from "node:crypto";
import { access, mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import { APP_CONFIG } from "../../config/appConfig";
import {
  IMPORT_TEMPLATE_CONTRACTS,
  IMPORT_TEMPLATE_DATA_SHEET,
  IMPORT_TEMPLATE_LISTS_SHEET,
  IMPORT_TEMPLATE_META_SHEET,
  IMPORT_TEMPLATE_STATIC_LISTS,
  IMPORT_TEMPLATE_VERSION,
  type ImportTemplateContract,
  type ImportTemplateField,
  type ImportTemplateListKey,
  type ImportTemplateType,
} from "../../domain/importTemplates";
import type { FinanceData } from "../../domain/models";

const HEADER_ROW = 5;
const DATA_START_ROW = 6;
const TECHNICAL_SHEET_PASSWORD = "contami-template-v1";
const TITLE_FILL = "FF073B4C";
const REQUIRED_FILL = "FFF4B942";
const CONDITIONAL_FILL = "FFDDF5EC";
const OPTIONAL_FILL = "FFE8EFED";
const INPUT_FONT = "FF0000FF";
const BORDER_COLOR = "FFB7C8C3";

export interface ImportTemplateCatalogContext {
  data: FinanceData;
  workbookConfigured: boolean;
}

export interface ImportTemplateGenerator {
  save(filePath: string, type: ImportTemplateType, context: ImportTemplateCatalogContext): Promise<void>;
}

function assertTemplatePath(filePath: string): void {
  if (!path.isAbsolute(filePath) || filePath.length > 4_096 || filePath.includes("\0") || path.extname(filePath).toLowerCase() !== ".xlsx") {
    throw new Error("INVALID_WORKBOOK_PATH");
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
}

function catalogLabel(label: string, id: string, configured: boolean): string {
  return configured ? `${label} [${id}]` : label;
}

function localizedName(nameIt: string, nameEn: string): string {
  return nameIt === nameEn ? nameIt : `${nameIt} / ${nameEn}`;
}

function catalogLists(type: ImportTemplateType, context: ImportTemplateCatalogContext): Partial<Record<ImportTemplateListKey, string[]>> {
  const { data, workbookConfigured } = context;
  const categoryValues = (kind?: "income" | "expense") => unique(data.categories
    .filter((item) => item.active && (!kind || item.kind === kind || item.kind === "both"))
    .map((item) => catalogLabel(localizedName(item.nameIt, item.nameEn), item.id, workbookConfigured)));
  const propertyUsage = type === "residence" ? "residence" : type === "rental_properties" ? "rental" : undefined;
  return {
    categories: categoryValues(),
    income_categories: categoryValues("income"),
    expense_categories: categoryValues("expense"),
    payment_methods: unique(data.paymentMethods.filter((item) => item.active).map((item) => catalogLabel(item.name, item.id, workbookConfigured))),
    accounts: unique(data.accounts.filter((item) => item.active).map((item) => catalogLabel(item.name, item.id, workbookConfigured))),
    investment_types: unique(data.investmentTypes
      .filter((item) => item.active && item.code !== "pension")
      .map((item) => catalogLabel(`${localizedName(item.nameIt, item.nameEn)} · ${item.code}`, item.id, workbookConfigured))),
    tax_types: unique(data.taxTypes
      .filter((item) => item.active && (!propertyUsage || item.appliesTo === "all" || item.appliesTo === propertyUsage))
      .map((item) => catalogLabel(`${item.name} · ${item.installments} rate / instalments`, item.id, workbookConfigured))),
    properties: unique(data.properties.filter((item) => item.active).map((item) => catalogLabel(item.name, item.id, workbookConfigured))),
    investments: unique(data.investments.filter((item) => item.active).map((item) => catalogLabel(item.name, item.id, workbookConfigured))),
    vehicles: unique(data.vehicles.filter((item) => item.active).map((item) => catalogLabel(item.name, item.id, workbookConfigured))),
  };
}

function requiredKind(field: ImportTemplateField): "required" | "conditional" | "optional" {
  if (field.required || field.requiredFor?.includes("all")) return "required";
  return field.requiredFor?.length ? "conditional" : "optional";
}

function description(field: ImportTemplateField): string {
  const condition = field.requiredFor?.length && !field.requiredFor.includes("all")
    ? `\nObbligatorio per / Required for: ${field.requiredFor.join(", ")}.`
    : "";
  return `${field.labelIt} / ${field.labelEn}\n${field.helpIt} / ${field.helpEn}${condition}`;
}

function columnWidth(field: ImportTemplateField): number {
  if (field.key === "notes" || field.key === "address" || field.key === "description") return 34;
  if (field.kind === "catalog") return 34;
  if (field.kind === "date") return 15;
  if (field.kind === "money" || field.kind === "decimal" || field.kind === "integer") return 16;
  return Math.min(28, Math.max(15, field.key.length + 3));
}

function columnLetter(column: number): string {
  let value = column;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function applyCellValidation(cell: ExcelJS.Cell, field: ImportTemplateField, listRange?: string): void {
  cell.font = { name: "Arial", size: 10, color: { argb: INPUT_FONT } };
  cell.alignment = { vertical: "top", wrapText: false };
  if (listRange) {
    cell.dataValidation = {
      type: "list",
      allowBlank: !field.required && !field.requiredFor?.includes("all"),
      formulae: [listRange],
      showErrorMessage: true,
      errorTitle: "Valore non valido / Invalid value",
      error: "Scegli un valore dall’elenco. / Choose a value from the list.",
    };
    return;
  }
  if (field.kind === "date") {
    cell.numFmt = "yyyy-mm-dd";
    cell.dataValidation = {
      type: "date",
      operator: "between",
      allowBlank: !field.required && !field.requiredFor?.includes("all"),
      formulae: [new Date("1900-01-01T00:00:00.000Z"), new Date("9999-12-31T00:00:00.000Z")],
      showErrorMessage: true,
      errorTitle: "Data non valida / Invalid date",
      error: "Inserisci una data valida. / Enter a valid date.",
    };
    return;
  }
  if (field.kind === "money" || field.kind === "decimal") {
    cell.numFmt = field.kind === "money" ? "#,##0.00" : "#,##0.00";
    cell.dataValidation = {
      type: "decimal",
      operator: "between",
      allowBlank: !field.required && !field.requiredFor?.includes("all"),
      formulae: [0, 1_000_000_000_000],
      showErrorMessage: true,
      errorTitle: "Numero non valido / Invalid number",
      error: "Inserisci un numero non negativo. / Enter a non-negative number.",
    };
    return;
  }
  if (field.kind === "integer") {
    cell.numFmt = "0";
    cell.dataValidation = {
      type: "whole",
      operator: "between",
      allowBlank: !field.required && !field.requiredFor?.includes("all"),
      formulae: [0, 10_000],
      showErrorMessage: true,
      errorTitle: "Intero non valido / Invalid integer",
      error: "Inserisci un numero intero valido. / Enter a valid whole number.",
    };
    return;
  }
  cell.numFmt = "@";
}

function addMetadataSheet(workbook: ExcelJS.Workbook, contract: ImportTemplateContract, context: ImportTemplateCatalogContext, maxRows: number): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(IMPORT_TEMPLATE_META_SHEET, { state: "veryHidden" });
  sheet.addRows([
    ["key", "value"],
    ["signature", "ContaMi Import Template"],
    ["templateVersion", IMPORT_TEMPLATE_VERSION],
    ["templateType", contract.type],
    ["applicationSchemaVersion", context.data.meta.schemaVersion],
    ["headerRow", HEADER_ROW],
    ["dataStartRow", DATA_START_ROW],
    ["maxDataRows", maxRows],
    ["catalogMode", context.workbookConfigured ? "workbook_snapshot" : "system_defaults"],
    ["languageMode", "it-en"],
  ]);
  sheet.addRow([]);
  sheet.addRow(["field", "kind", "required", "requiredFor", "list"]);
  for (const item of contract.fields) {
    sheet.addRow([item.key, item.kind, requiredKind(item), item.requiredFor?.join(",") ?? "", item.list ?? ""]);
  }
  sheet.columns = [{ width: 28 }, { width: 48 }, { width: 18 }, { width: 36 }, { width: 28 }];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(12).font = { bold: true };
  return sheet;
}

function addListsSheet(
  workbook: ExcelJS.Workbook,
  contract: ImportTemplateContract,
  context: ImportTemplateCatalogContext,
): { sheet: ExcelJS.Worksheet; ranges: Map<ImportTemplateListKey, string> } {
  const sheet = workbook.addWorksheet(IMPORT_TEMPLATE_LISTS_SHEET, { state: "veryHidden" });
  const dynamicLists = catalogLists(contract.type, context);
  const usedKeys = unique(contract.fields.flatMap((item) => item.list ? [item.list] : [])) as ImportTemplateListKey[];
  const ranges = new Map<ImportTemplateListKey, string>();
  usedKeys.forEach((key, index) => {
    const values = unique([...(IMPORT_TEMPLATE_STATIC_LISTS[key] ?? []), ...(dynamicLists[key] ?? [])]);
    const column = index + 1;
    sheet.getCell(1, column).value = key;
    sheet.getCell(1, column).font = { bold: true };
    values.forEach((value, valueIndex) => { sheet.getCell(valueIndex + 2, column).value = value; });
    sheet.getColumn(column).width = Math.min(70, Math.max(22, ...values.map((value) => value.length + 2)));
    if (values.length) {
      const letter = columnLetter(column);
      const definedName = `contami_list_${key}`;
      workbook.definedNames.add(`'${IMPORT_TEMPLATE_LISTS_SHEET}'!$${letter}$2:$${letter}$${values.length + 1}`, definedName);
      ranges.set(key, `=${definedName}`);
    }
  });
  return { sheet, ranges };
}

function addDataSheet(
  workbook: ExcelJS.Workbook,
  contract: ImportTemplateContract,
  context: ImportTemplateCatalogContext,
  listRanges: Map<ImportTemplateListKey, string>,
  maxRows: number,
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(IMPORT_TEMPLATE_DATA_SHEET, { properties: { defaultRowHeight: 18 } });
  const lastColumn = columnLetter(contract.fields.length);
  sheet.mergeCells(`A1:${lastColumn}1`);
  sheet.getCell("A1").value = `${contract.titleIt} / ${contract.titleEn}`;
  sheet.getCell("A1").font = { name: "Arial", size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: TITLE_FILL } };
  sheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 34;

  sheet.mergeCells(`A2:${lastColumn}2`);
  sheet.getCell("A2").value = `${contract.purposeIt}\n${contract.purposeEn}`;
  sheet.getCell("A2").alignment = { vertical: "middle", wrapText: true };
  sheet.getCell("A2").font = { name: "Arial", size: 10, color: { argb: "FF334B53" } };
  sheet.getRow(2).height = 38;

  sheet.mergeCells(`A3:${lastColumn}3`);
  sheet.getCell("A3").value = context.workbookConfigured
    ? "Gli elenchi includono un’istantanea dei cataloghi attivi del workbook; gli UUID tra parentesi garantiscono riferimenti non ambigui. / Lists contain a snapshot of active workbook catalogs; bracketed UUIDs provide unambiguous references."
    : "Nessun workbook configurato: sono disponibili i valori di sistema; i riferimenti mancanti saranno risolti durante l’importazione. / No workbook is configured: system values are available; missing references will be resolved during import.";
  sheet.getCell("A3").alignment = { vertical: "middle", wrapText: true };
  sheet.getCell("A3").font = { name: "Arial", size: 9, italic: true, color: { argb: "FF5E6E73" } };
  sheet.getRow(3).height = 34;

  contract.fields.forEach((item, index) => {
    const column = index + 1;
    const required = requiredKind(item);
    const fill = required === "required" ? REQUIRED_FILL : required === "conditional" ? CONDITIONAL_FILL : OPTIONAL_FILL;
    const descriptionCell = sheet.getCell(4, column);
    descriptionCell.value = description(item);
    descriptionCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
    descriptionCell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF18353E" } };
    descriptionCell.alignment = { vertical: "top", wrapText: true };
    descriptionCell.border = { bottom: { style: "thin", color: { argb: BORDER_COLOR } } };

    const headerCell = sheet.getCell(HEADER_ROW, column);
    headerCell.value = item.key;
    headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
    headerCell.font = { name: "Consolas", size: 9, bold: true, color: { argb: "FF18353E" } };
    headerCell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    headerCell.border = { bottom: { style: "medium", color: { argb: TITLE_FILL } } };
    sheet.getColumn(column).width = columnWidth(item);

    const listRange = item.list ? listRanges.get(item.list) : undefined;
    for (let row = DATA_START_ROW; row < DATA_START_ROW + maxRows; row += 1) {
      applyCellValidation(sheet.getCell(row, column), item, listRange);
    }
  });
  sheet.getRow(4).height = 92;
  sheet.getRow(HEADER_ROW).height = 28;
  sheet.autoFilter = { from: { row: HEADER_ROW, column: 1 }, to: { row: HEADER_ROW, column: contract.fields.length } };
  sheet.views = [{ state: "frozen", ySplit: HEADER_ROW, topLeftCell: `A${DATA_START_ROW}`, showGridLines: false }];
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  return sheet;
}

function hasCellFormulas(workbook: ExcelJS.Workbook): boolean {
  return workbook.worksheets.some((sheet) => {
    let found = false;
    sheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        const value = cell.value;
        if (typeof value === "object" && value !== null && "formula" in value) found = true;
      });
    });
    return found;
  });
}

async function verifyTemplate(filePath: string, contract: ImportTemplateContract): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const visibleSheets = workbook.worksheets.filter((sheet) => sheet.state === "visible");
  const meta = workbook.getWorksheet(IMPORT_TEMPLATE_META_SHEET);
  const lists = workbook.getWorksheet(IMPORT_TEMPLATE_LISTS_SHEET);
  const data = workbook.getWorksheet(IMPORT_TEMPLATE_DATA_SHEET);
  const metaValues = new Map<string, unknown>();
  meta?.eachRow((row, index) => { if (index > 1) metaValues.set(String(row.getCell(1).value ?? ""), row.getCell(2).value); });
  const headers = data?.getRow(HEADER_ROW).values;
  const expectedHeaders = contract.fields.map((item) => item.key);
  const actualHeaders = Array.isArray(headers) ? headers.slice(1, expectedHeaders.length + 1) : [];
  const externalLinks = (workbook.model as unknown as { externalLinks?: unknown[] }).externalLinks ?? [];
  if (
    workbook.worksheets.length !== 3
    || visibleSheets.length !== 1
    || visibleSheets[0]?.name !== IMPORT_TEMPLATE_DATA_SHEET
    || meta?.state !== "veryHidden"
    || lists?.state !== "veryHidden"
    || metaValues.get("signature") !== "ContaMi Import Template"
    || Number(metaValues.get("templateVersion")) !== IMPORT_TEMPLATE_VERSION
    || metaValues.get("templateType") !== contract.type
    || JSON.stringify(actualHeaders) !== JSON.stringify(expectedHeaders)
    || hasCellFormulas(workbook)
    || externalLinks.length > 0
  ) {
    throw new Error("IMPORT_TEMPLATE_VERIFICATION_FAILED");
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function replaceVerifiedTemplate(filePath: string, temporaryPath: string): Promise<void> {
  if (!(await pathExists(filePath))) {
    await rename(temporaryPath, filePath);
    return;
  }
  const rollback = `${filePath}.rollback-${randomUUID()}`;
  await rename(filePath, rollback);
  try {
    await rename(temporaryPath, filePath);
    await rm(rollback, { force: true });
  } catch (error) {
    await rename(rollback, filePath);
    throw error;
  }
}

export class ExcelImportTemplateGenerator implements ImportTemplateGenerator {
  constructor(private readonly maxRows = APP_CONFIG.importTemplates.maxRows) {}

  async save(filePath: string, type: ImportTemplateType, context: ImportTemplateCatalogContext): Promise<void> {
    assertTemplatePath(filePath);
    const contract = IMPORT_TEMPLATE_CONTRACTS[type];
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ContaMì";
    workbook.company = "ContaMì";
    workbook.subject = `ContaMì import template v${IMPORT_TEMPLATE_VERSION}`;
    workbook.title = `${contract.titleIt} / ${contract.titleEn}`;
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.calcProperties.fullCalcOnLoad = false;
    const meta = addMetadataSheet(workbook, contract, context, this.maxRows);
    const { sheet: lists, ranges } = addListsSheet(workbook, contract, context);
    addDataSheet(workbook, contract, context, ranges, this.maxRows);
    await meta.protect(TECHNICAL_SHEET_PASSWORD, { selectLockedCells: true, selectUnlockedCells: false });
    await lists.protect(TECHNICAL_SHEET_PASSWORD, { selectLockedCells: true, selectUnlockedCells: false });

    await mkdir(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.tmp-${randomUUID()}.xlsx`;
    try {
      await workbook.xlsx.writeFile(temporaryPath);
      await verifyTemplate(temporaryPath, contract);
      await replaceVerifiedTemplate(filePath, temporaryPath);
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw error;
    }
  }
}
