import path from "node:path";
import { dialog, type BrowserWindow } from "electron";
import { IMPORT_TEMPLATE_CONTRACTS, type ImportTemplateType } from "../../domain/importTemplates";
import type { ImportTemplateGenerator } from "../../infrastructure/spreadsheet/ExcelImportTemplateGenerator";
import type { ImportTemplateResult } from "../../shared/contracts";
import type { FinanceFileService } from "./FinanceFileService";

export class ImportTemplateService {
  constructor(
    private readonly window: BrowserWindow,
    private readonly finance: FinanceFileService,
    private readonly generator: ImportTemplateGenerator,
  ) {}

  async generate(type: ImportTemplateType, language: "it" | "en"): Promise<ImportTemplateResult> {
    const contract = IMPORT_TEMPLATE_CONTRACTS[type];
    const result = await dialog.showSaveDialog(this.window, {
      title: language === "it" ? "Salva template Excel per importazione" : "Save Excel import template",
      defaultPath: contract.fileName,
      filters: [{ name: language === "it" ? "Modello Excel" : "Excel template", extensions: ["xlsx"] }],
      properties: ["createDirectory", "showOverwriteConfirmation"],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    const filePath = path.extname(result.filePath).toLowerCase() === ".xlsx" ? result.filePath : `${result.filePath}.xlsx`;
    const snapshot = await this.finance.snapshot();
    await this.generator.save(filePath, type, {
      data: snapshot.data,
      workbookConfigured: snapshot.workbookConfigured,
    });
    return { canceled: false, fileName: path.basename(filePath) };
  }
}
