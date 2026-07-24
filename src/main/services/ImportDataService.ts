import { randomUUID } from "node:crypto";
import path from "node:path";
import { dialog, type BrowserWindow } from "electron";
import type { ImportDuplicateStrategy, ImportCommitResult, ImportPreview, PreparedImport } from "../../domain/imports";
import type { ImportTemplateParser } from "../../infrastructure/spreadsheet/ExcelImportTemplateParser";
import type { FinanceFileService } from "./FinanceFileService";

const PREVIEW_TTL_MS = 15 * 60 * 1_000;

interface StoredPreview {
  expiresAt: number;
  prepared: PreparedImport;
}

export class ImportDataService {
  private readonly previews = new Map<string, StoredPreview>();

  constructor(
    private readonly window: BrowserWindow,
    private readonly finance: FinanceFileService,
    private readonly parser: ImportTemplateParser,
  ) {}

  async preview(strategy: ImportDuplicateStrategy, language: "it" | "en"): Promise<ImportPreview> {
    const snapshot = await this.finance.snapshot();
    if (!snapshot.workbookConfigured) throw new Error("WORKBOOK_NOT_CONFIGURED");
    const result = await dialog.showOpenDialog(this.window, {
      title: language === "it" ? "Seleziona un template Excel compilato" : "Select a completed Excel template",
      filters: [{ name: language === "it" ? "Template Excel ContaMì" : "ContaMì Excel template", extensions: ["xlsx"] }],
      properties: ["openFile", "dontAddToRecent"],
    });
    if (result.canceled || !result.filePaths[0]) {
      return {
        canceled: true, validRows: 0, rejectedRows: 0, conflictRows: 0, totalRows: 0, amountTotal: 0,
        actions: { create: 0, update: 0, skip: 0 }, errors: [], errorsTruncated: false,
      };
    }
    const prepared = await this.parser.parse(result.filePaths[0], snapshot.data, strategy);
    this.cleanup();
    const previewId = randomUUID();
    this.previews.set(previewId, { expiresAt: Date.now() + PREVIEW_TTL_MS, prepared });
    return { canceled: false, previewId, ...prepared.preview };
  }

  async confirm(previewId: string): Promise<ImportCommitResult> {
    this.cleanup();
    const stored = this.previews.get(previewId);
    if (!stored) throw new Error("IMPORT_PREVIEW_EXPIRED");
    this.previews.delete(previewId);
    if (stored.prepared.commands.length === 0) throw new Error("IMPORT_NO_VALID_ROWS");
    await this.finance.applyImport(stored.prepared.commands);
    const { preview, templateType, fileName } = stored.prepared;
    return {
      snapshotUpdated: true,
      templateType,
      fileName: path.basename(fileName),
      validRows: preview.validRows,
      rejectedRows: preview.rejectedRows,
      amountTotal: preview.amountTotal,
      actions: preview.actions,
    };
  }

  discard(previewId: string): boolean {
    return this.previews.delete(previewId);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, preview] of this.previews) {
      if (preview.expiresAt <= now) this.previews.delete(id);
    }
  }
}
