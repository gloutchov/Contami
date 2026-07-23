import { contextBridge, ipcRenderer } from "electron";
import type { AppSettings, ContaMiApi } from "../shared/contracts";
import type { FinanceCommand } from "../domain/commands";
import type { ImportTemplateType } from "../domain/importTemplates";
import { IPC } from "../shared/ipc";

const api: ContaMiApi = Object.freeze({
  getSettings: () => ipcRenderer.invoke(IPC.settingsGet),
  updateSettings: (patch: Pick<Partial<AppSettings>, "language" | "theme" | "workbookFormat">) => ipcRenderer.invoke(IPC.settingsUpdate, patch),
  getCapabilities: () => ipcRenderer.invoke(IPC.capabilitiesGet),
  getSnapshot: () => ipcRenderer.invoke(IPC.financeSnapshot),
  createWorkbook: (format: AppSettings["workbookFormat"]) => ipcRenderer.invoke(IPC.financeCreateWorkbook, format),
  openWorkbook: () => ipcRenderer.invoke(IPC.financeOpenWorkbook),
  execute: (command: FinanceCommand) => ipcRenderer.invoke(IPC.financeExecute, command),
  rolloverYear: () => ipcRenderer.invoke(IPC.financeRollover),
  revealWorkbook: () => ipcRenderer.invoke(IPC.financeRevealWorkbook),
  generateImportTemplate: (type: ImportTemplateType, language: "it" | "en") => ipcRenderer.invoke(IPC.importTemplateGenerate, type, language),
});

contextBridge.exposeInMainWorld("contami", api);
