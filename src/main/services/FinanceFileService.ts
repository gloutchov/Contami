import path from "node:path";
import { dialog, shell, type BrowserWindow } from "electron";
import type { FinanceCommand } from "../../domain/commands";
import { applyFinanceCommand, applyFinanceCommands, computeDashboard, createEmptyFinanceData } from "../../domain/finance";
import { createRolloverFinanceData } from "../../domain/rollover";
import type { FinanceData } from "../../domain/models";
import type { AppSettings, FinanceSnapshot, RolloverResult, WorkbookChoiceResult } from "../../shared/contracts";
import { SettingsService } from "../../infrastructure/settings/SettingsService";
import { ExcelWorkbookRepository } from "../../infrastructure/spreadsheet/ExcelWorkbookRepository";
import { NumbersMirrorService } from "../../infrastructure/spreadsheet/NumbersMirrorService";
import { WorkbookRevisionGuard, type WorkbookRevision } from "../../infrastructure/spreadsheet/WorkbookRevisionGuard";

function displayPath(settings: AppSettings): string | undefined {
  return settings.workbookFormat === "numbers" ? (settings.numbersMirrorPath ?? settings.workbookPath) : settings.workbookPath;
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function workbookLoadWarning(error: unknown): string | undefined {
  const code = error instanceof Error ? error.message : "";
  if (code === "WORKBOOK_RESOURCE_LIMIT" || code === "WORKBOOK_TOO_LARGE") return "WORKBOOK_RESOURCE_LIMIT";
  if (code === "WORKBOOK_UNSAFE" || code === "INVALID_WORKBOOK_SCHEMA") return "WORKBOOK_UNSAFE";
  if (code === "WORKBOOK_CHANGED_EXTERNALLY") return code;
  if (code === "WORKBOOK_LOCK_LOST") return "WORKBOOK_LOCKED";
  if (code === "WORKBOOK_LOCKED" || code === "WORKBOOK_LOCK_STALE" || code === "WORKBOOK_LOCK_UNAVAILABLE") return code;
  return undefined;
}

export class FinanceFileService {
  private data?: FinanceData;
  private warningCode?: string;
  private revision?: WorkbookRevision;

  constructor(
    private readonly window: BrowserWindow,
    private readonly settingsService: SettingsService,
    private readonly repository: ExcelWorkbookRepository,
    private readonly numbersMirror: NumbersMirrorService,
    private readonly revisions = new WorkbookRevisionGuard(),
  ) {}

  async snapshot(): Promise<FinanceSnapshot> {
    let settings = await this.settingsService.get();
    if (!this.data) {
      if (settings.workbookPath) {
        try {
          this.data = await this.loadWorkbook(settings.workbookPath);
        } catch (error) {
          if (isMissingFile(error)) {
            this.data = createEmptyFinanceData();
            this.revision = undefined;
            this.warningCode = "WORKBOOK_MISSING";
            settings = await this.settingsService.update({ workbookPath: undefined, numbersMirrorPath: undefined });
          } else {
            const warning = workbookLoadWarning(error);
            if (!warning) throw error;
            this.data = undefined;
            this.revision = undefined;
            this.warningCode = warning;
          }
        }
      }
      else this.data = createEmptyFinanceData();
    }
    const snapshotData = this.data ?? createEmptyFinanceData();
    const workbookConfigured = Boolean(settings.workbookPath && this.data);
    const shownPath = workbookConfigured ? displayPath(settings) : undefined;
    return {
      data: structuredClone(snapshotData),
      metrics: computeDashboard(snapshotData),
      workbookConfigured,
      workbookDisplayName: shownPath ? path.basename(shownPath) : undefined,
      lastSavedAt: workbookConfigured ? snapshotData.meta.updatedAt : undefined,
      warningCode: this.warningCode,
    };
  }

  async numbersAvailable(): Promise<boolean> {
    return this.numbersMirror.isAvailable();
  }

  async dataForReport(): Promise<FinanceData> {
    const settings = await this.settingsService.get();
    if (!settings.workbookPath) throw new Error("WORKBOOK_NOT_CONFIGURED");
    if (!this.data) this.data = await this.loadWorkbook(settings.workbookPath);
    await this.revisions.assertUnchanged(this.revision, settings.workbookPath);
    return structuredClone(this.data);
  }

  async createWorkbook(format: AppSettings["workbookFormat"]): Promise<WorkbookChoiceResult> {
    if (format === "numbers" && !(await this.numbersMirror.isAvailable())) throw new Error("NUMBERS_NOT_AVAILABLE");
    const extension = format === "numbers" ? "numbers" : "xlsx";
    const result = await dialog.showSaveDialog(this.window, {
      title: format === "numbers" ? "Create ContaMì Numbers workbook" : "Create ContaMì Excel workbook",
      defaultPath: `ContaMi-${new Date().getFullYear()}.${extension}`,
      filters: [{ name: format === "numbers" ? "Apple Numbers" : "Excel Workbook", extensions: [extension] }],
      properties: ["createDirectory", "showOverwriteConfirmation"],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    const chosenPath = result.filePath.endsWith(`.${extension}`) ? result.filePath : `${result.filePath}.${extension}`;
    const workbookPath = format === "numbers"
      ? path.join(path.dirname(chosenPath), `${path.basename(chosenPath, ".numbers")}.contami.xlsx`)
      : chosenPath;
    const next = createEmptyFinanceData();
    const nextRevision = await this.repository.save(workbookPath, next);
    const mirrorPath = format === "numbers" ? chosenPath : undefined;
    const nextSettings = await this.settingsService.update({ workbookFormat: format, workbookPath, numbersMirrorPath: mirrorPath });
    this.data = next;
    this.revision = nextRevision;
    this.warningCode = undefined;
    await this.updateMirror(nextSettings, true);
    return { canceled: false, path: workbookPath, mirrorPath };
  }

  async openWorkbook(): Promise<WorkbookChoiceResult> {
    const result = await dialog.showOpenDialog(this.window, {
      title: "Open ContaMì workbook",
      filters: [{ name: "Excel Workbook", extensions: ["xlsx"] }],
      properties: ["openFile"],
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const workbookPath = result.filePaths[0];
    const loaded = await this.loadWorkbook(workbookPath);
    this.data = loaded;
    await this.settingsService.update({ workbookFormat: "excel", workbookPath, numbersMirrorPath: undefined });
    return { canceled: false, path: workbookPath };
  }

  async execute(command: FinanceCommand): Promise<FinanceSnapshot> {
    const settings = await this.settingsService.get();
    if (!settings.workbookPath) throw new Error("WORKBOOK_NOT_CONFIGURED");
    if (!this.data) {
      this.data = await this.loadWorkbook(settings.workbookPath);
    }
    await this.revisions.assertUnchanged(this.revision, settings.workbookPath);
    const next = applyFinanceCommand(this.data, command);
    this.revision = await this.repository.save(settings.workbookPath, next, this.revision);
    this.data = next;
    await this.updateMirror(settings, false);
    return this.snapshot();
  }

  async applyImport(commands: readonly FinanceCommand[]): Promise<FinanceSnapshot> {
    if (commands.length < 1 || commands.length > 15_000) throw new Error("IMPORT_PLAN_INVALID");
    const settings = await this.settingsService.get();
    if (!settings.workbookPath) throw new Error("WORKBOOK_NOT_CONFIGURED");
    if (!this.data) {
      this.data = await this.loadWorkbook(settings.workbookPath);
    }
    await this.revisions.assertUnchanged(this.revision, settings.workbookPath);
    const next = applyFinanceCommands(this.data, commands);
    this.revision = await this.repository.save(settings.workbookPath, next, this.revision);
    this.data = next;
    await this.updateMirror(settings, false);
    return this.snapshot();
  }

  async rollover(): Promise<RolloverResult> {
    const settings = await this.settingsService.get();
    if (!settings.workbookPath) throw new Error("WORKBOOK_NOT_CONFIGURED");
    if (!this.data) {
      this.data = await this.loadWorkbook(settings.workbookPath);
    }
    const nextYear = this.data.meta.activeYear + 1;
    const extension = settings.workbookFormat === "numbers" ? "numbers" : "xlsx";
    const result = await dialog.showSaveDialog(this.window, {
      title: `Create workbook for ${nextYear}`,
      defaultPath: `ContaMi-${nextYear}.${extension}`,
      filters: [{ name: settings.workbookFormat === "numbers" ? "Apple Numbers" : "Excel Workbook", extensions: [extension] }],
      properties: ["createDirectory", "showOverwriteConfirmation"],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    const selected = result.filePath.endsWith(`.${extension}`) ? result.filePath : `${result.filePath}.${extension}`;
    const newWorkbookPath = settings.workbookFormat === "numbers"
      ? path.join(path.dirname(selected), `${path.basename(selected, ".numbers")}.contami.xlsx`)
      : selected;
    await this.revisions.assertUnchanged(this.revision, settings.workbookPath);
    const next = createRolloverFinanceData(this.data, nextYear);
    const nextRevision = await this.repository.save(newWorkbookPath, next);
    const oldDisplayPath = displayPath(settings) ?? settings.workbookPath;
    const mirrorPath = settings.workbookFormat === "numbers" ? selected : undefined;
    const nextSettings = await this.settingsService.update({ workbookPath: newWorkbookPath, numbersMirrorPath: mirrorPath });
    this.data = next;
    this.revision = nextRevision;
    await this.updateMirror(nextSettings, true);
    return { canceled: false, archivedPath: oldDisplayPath, newWorkbookPath: displayPath(nextSettings), year: nextYear };
  }

  async revealWorkbook(): Promise<boolean> {
    const settings = await this.settingsService.get();
    const filePath = displayPath(settings);
    if (!filePath) return false;
    shell.showItemInFolder(filePath);
    return true;
  }

  async recoverStaleLock(): Promise<boolean> {
    const settings = await this.settingsService.get();
    if (!settings.workbookPath) throw new Error("WORKBOOK_NOT_CONFIGURED");
    const recovered = await this.repository.recoverStaleLock(settings.workbookPath);
    this.data = undefined;
    this.revision = undefined;
    this.warningCode = undefined;
    return recovered;
  }

  private async loadWorkbook(filePath: string): Promise<FinanceData> {
    const loaded = await this.repository.loadWithUuidRepair(filePath);
    this.revision = loaded.revision;
    this.warningCode = loaded.ambiguousInvestmentLinks > 0
      ? "INVESTMENT_TRANSACTION_LINKS_AMBIGUOUS"
      : loaded.repairedInvestmentLinks > 0
        ? "INVESTMENT_TRANSACTIONS_REPAIRED"
        : loaded.repairedIds > 0
          ? "DUPLICATE_UUIDS_REPAIRED"
          : loaded.unresolvedTransactionAccounts > 0
            ? "TRANSACTIONS_WITHOUT_ACCOUNT"
            : loaded.repairedTransactionAccounts > 0
              ? "TRANSACTION_ACCOUNTS_REPAIRED"
              : loaded.closedInstallmentPlans > 0
                ? "FINISHED_INSTALLMENTS_CLOSED"
                : loaded.migratedSchema
                  ? "WORKBOOK_SCHEMA_UPGRADED"
                  : undefined;
    return loaded.data;
  }

  private async updateMirror(settings: AppSettings, failHard: boolean): Promise<void> {
    if (settings.workbookFormat !== "numbers" || !settings.workbookPath || !settings.numbersMirrorPath) return;
    try {
      await this.numbersMirror.mirror(settings.workbookPath, settings.numbersMirrorPath);
      this.warningCode = undefined;
    } catch {
      this.warningCode = "NUMBERS_MIRROR_FAILED";
      if (failHard) throw new Error("NUMBERS_MIRROR_FAILED");
    }
  }
}
