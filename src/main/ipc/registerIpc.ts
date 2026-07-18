import { app, ipcMain, nativeTheme, type BrowserWindow, type IpcMainInvokeEvent } from "electron";
import { z } from "zod";
import { financeCommandSchema } from "../../domain/commands";
import { appSettingsSchema, type SystemCapabilities } from "../../shared/contracts";
import { IPC } from "../../shared/ipc";
import type { SettingsService } from "../../infrastructure/settings/SettingsService";
import type { FinanceFileService } from "../services/FinanceFileService";

const preferencePatchSchema = appSettingsSchema.pick({ language: true, theme: true, workbookFormat: true }).partial().strict();
const workbookFormatSchema = z.enum(["excel", "numbers"]);

function safeError(error: unknown): Error {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const allowed = new Set([
    "DUPLICATE_ID", "PROPERTY_NOT_FOUND", "INVESTMENT_NOT_FOUND", "ENTITY_NOT_FOUND", "SHARED_EXPENSE_NOT_FOUND",
    "INVALID_WORKBOOK_PATH", "INVALID_WORKBOOK_SCHEMA", "WORKBOOK_TOO_LARGE", "WORKBOOK_VERIFICATION_FAILED",
    "NUMBERS_NOT_AVAILABLE", "NUMBERS_MIRROR_FAILED", "WORKBOOK_NOT_CONFIGURED", "WORKBOOK_CHANGED_EXTERNALLY",
  ]);
  return new Error(allowed.has(code) ? code : "OPERATION_FAILED");
}

export function registerIpc(window: BrowserWindow, settings: SettingsService, finance: FinanceFileService): void {
  for (const channel of Object.values(IPC)) ipcMain.removeHandler(channel);
  const trusted = (event: IpcMainInvokeEvent): void => {
    if (event.sender.id !== window.webContents.id) throw new Error("UNTRUSTED_RENDERER");
  };
  const handle = <TArgs extends unknown[], TResult>(channel: string, fn: (...args: TArgs) => Promise<TResult> | TResult) => {
    ipcMain.handle(channel, async (event, ...args: TArgs) => {
      trusted(event);
      try { return await fn(...args); } catch (error) { throw safeError(error); }
    });
  };

  handle(IPC.settingsGet, () => settings.get());
  handle(IPC.settingsUpdate, (patch: unknown) => settings.update(preferencePatchSchema.parse(patch)));
  handle(IPC.capabilitiesGet, async (): Promise<SystemCapabilities> => ({
    platform: process.platform,
    systemLanguage: app.getLocale().toLowerCase().startsWith("it") ? "it" : "en",
    systemTheme: nativeTheme.shouldUseDarkColors ? "dark" : "light",
    numbersAvailable: await finance.numbersAvailable(),
  }));
  handle(IPC.financeSnapshot, () => finance.snapshot());
  handle(IPC.financeCreateWorkbook, (format: unknown) => finance.createWorkbook(workbookFormatSchema.parse(format)));
  handle(IPC.financeOpenWorkbook, () => finance.openWorkbook());
  handle(IPC.financeExecute, (command: unknown) => finance.execute(financeCommandSchema.parse(command)));
  handle(IPC.financeRollover, () => finance.rollover());
  handle(IPC.financeRevealWorkbook, () => finance.revealWorkbook());
}
