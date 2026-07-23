import { app, ipcMain, nativeTheme, type BrowserWindow, type IpcMainInvokeEvent } from "electron";
import type { z } from "zod";
import type { SystemCapabilities } from "../../shared/contracts";
import { IPC } from "../../shared/ipc";
import {
  financeExecuteIpcArgumentsSchema,
  noIpcArgumentsSchema,
  settingsUpdateIpcArgumentsSchema,
  workbookCreateIpcArgumentsSchema,
} from "../../shared/ipcValidation";
import type { SettingsService } from "../../infrastructure/settings/SettingsService";
import type { FinanceFileService } from "../services/FinanceFileService";

function safeError(error: unknown): Error {
  const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const allowed = new Set([
    "DUPLICATE_ID", "DUPLICATE_TAX_NAME", "PROPERTY_NOT_FOUND", "INVESTMENT_NOT_FOUND", "ENTITY_NOT_FOUND", "ENTITY_IN_USE", "SHARED_EXPENSE_NOT_FOUND",
    "TAX_TYPE_NOT_FOUND", "TAX_TYPE_INACTIVE", "TAX_TYPE_NOT_APPLICABLE", "INVALID_TAX_INSTALLMENT",
    "INVALID_WORKBOOK_PATH", "INVALID_WORKBOOK_SCHEMA", "WORKBOOK_TOO_LARGE", "WORKBOOK_VERIFICATION_FAILED",
    "NUMBERS_NOT_AVAILABLE", "NUMBERS_MIRROR_FAILED", "WORKBOOK_NOT_CONFIGURED", "WORKBOOK_CHANGED_EXTERNALLY",
  ]);
  return new Error(allowed.has(code) ? code : "OPERATION_FAILED");
}

export function registerIpc(window: BrowserWindow, settings: SettingsService, finance: FinanceFileService): void {
  for (const channel of Object.values(IPC)) ipcMain.removeHandler(channel);
  const trusted = (event: IpcMainInvokeEvent): void => {
    const expectedUrl = window.webContents.getURL();
    if (event.sender.id !== window.webContents.id
      || event.senderFrame !== window.webContents.mainFrame
      || event.senderFrame.url !== expectedUrl) throw new Error("UNTRUSTED_RENDERER");
  };
  const handle = <TArgs extends unknown[], TResult>(channel: string, schema: z.ZodType<TArgs>, fn: (args: TArgs) => Promise<TResult> | TResult) => {
    ipcMain.handle(channel, async (event, ...args: unknown[]) => {
      try {
        trusted(event);
        return await fn(schema.parse(args));
      } catch (error) {
        throw safeError(error);
      }
    });
  };

  handle(IPC.settingsGet, noIpcArgumentsSchema, () => settings.get());
  handle(IPC.settingsUpdate, settingsUpdateIpcArgumentsSchema, ([patch]) => settings.update(patch));
  handle(IPC.capabilitiesGet, noIpcArgumentsSchema, async (): Promise<SystemCapabilities> => ({
    platform: process.platform,
    systemLanguage: app.getLocale().toLowerCase().startsWith("it") ? "it" : "en",
    systemTheme: nativeTheme.shouldUseDarkColors ? "dark" : "light",
    numbersAvailable: await finance.numbersAvailable(),
  }));
  handle(IPC.financeSnapshot, noIpcArgumentsSchema, () => finance.snapshot());
  handle(IPC.financeCreateWorkbook, workbookCreateIpcArgumentsSchema, ([format]) => finance.createWorkbook(format));
  handle(IPC.financeOpenWorkbook, noIpcArgumentsSchema, () => finance.openWorkbook());
  handle(IPC.financeExecute, financeExecuteIpcArgumentsSchema, ([command]) => finance.execute(command));
  handle(IPC.financeRollover, noIpcArgumentsSchema, () => finance.rollover());
  handle(IPC.financeRevealWorkbook, noIpcArgumentsSchema, () => finance.revealWorkbook());
}
