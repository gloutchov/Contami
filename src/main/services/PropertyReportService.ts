import { lstat, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { BrowserWindow, dialog } from "electron";
import { createPropertyReport } from "../../domain/propertyReport";
import { buildPropertyReportHtml, propertyReportFileName } from "../../infrastructure/pdf/PropertyReportDocument";
import { propertyReportTranslations, type PropertyReportRequest, type PropertyReportResult } from "../../shared/propertyReportContracts";
import type { FinanceFileService } from "./FinanceFileService";

const MAX_PDF_BYTES = 50 * 1024 * 1024;

function localTodayIso(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function validPdf(buffer: Buffer): boolean {
  if (buffer.length < 16 || buffer.length > MAX_PDF_BYTES) return false;
  return buffer.subarray(0, 5).toString("ascii") === "%PDF-"
    && buffer.subarray(Math.max(0, buffer.length - 1_024)).toString("ascii").includes("%%EOF");
}

async function savePdfAtomically(filePath: string, pdf: Buffer): Promise<void> {
  if (!path.isAbsolute(filePath) || filePath.length > 4_096 || path.extname(filePath).toLowerCase() !== ".pdf" || !validPdf(pdf)) {
    throw new Error("PROPERTY_REPORT_FAILED");
  }
  const temporaryPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${randomUUID()}.tmp`);
  const rollbackPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${randomUUID()}.rollback`);
  let movedExisting = false;
  try {
    await writeFile(temporaryPath, pdf, { flag: "wx", mode: 0o600 });
    const reread = await readFile(temporaryPath);
    if (!reread.equals(pdf) || !validPdf(reread)) throw new Error("PROPERTY_REPORT_FAILED");
    try {
      const target = await lstat(filePath);
      if (!target.isFile() || target.isSymbolicLink()) throw new Error("PROPERTY_REPORT_FAILED");
      await rename(filePath, rollbackPath);
      movedExisting = true;
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT")) throw error;
    }
    try {
      await rename(temporaryPath, filePath);
    } catch (error) {
      if (movedExisting) await rename(rollbackPath, filePath).catch(() => undefined);
      throw error;
    }
    if (movedExisting) await rm(rollbackPath, { force: true }).catch(() => undefined);
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
  }
}

function footerTemplate(language: "it" | "en"): string {
  const labels = propertyReportTranslations[language];
  return `<div style="box-sizing:border-box;width:100%;padding:0 12mm;color:#64777c;font-family:Arial,sans-serif;font-size:8px;display:flex;justify-content:space-between"><span>ContaMì · ${labels.propertyReportConfidential}</span><span>${labels.propertyReportPage} <span class="pageNumber"></span> ${labels.propertyReportOf} <span class="totalPages"></span></span></div>`;
}

export class PropertyReportService {
  constructor(
    private readonly parentWindow: BrowserWindow,
    private readonly finance: FinanceFileService,
  ) {}

  async generate(request: PropertyReportRequest): Promise<PropertyReportResult> {
    const data = await this.finance.dataForReport();
    const report = createPropertyReport(
      data,
      request.propertyId,
      request.scope,
      [request.ownerName, request.coOwnerName],
      localTodayIso(),
    );
    let filePath: string | undefined;
    if (request.action === "save-pdf") {
      const labels = propertyReportTranslations[request.language];
      const selection = await dialog.showSaveDialog(this.parentWindow, {
        title: labels.propertyReportSavePdf,
        defaultPath: propertyReportFileName(report),
        filters: [{ name: "PDF", extensions: ["pdf"] }],
        properties: ["createDirectory", "showOverwriteConfirmation"],
      });
      if (selection.canceled || !selection.filePath) return { canceled: true };
      filePath = path.extname(selection.filePath).toLowerCase() === ".pdf" ? selection.filePath : `${selection.filePath}.pdf`;
    }

    const reportWindow = new BrowserWindow({
      parent: this.parentWindow,
      show: false,
      width: 900,
      height: 1_200,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        webviewTag: false,
        navigateOnDragDrop: false,
        devTools: false,
        javascript: false,
      },
    });
    reportWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    reportWindow.webContents.on("will-attach-webview", (event) => event.preventDefault());
    reportWindow.webContents.on("will-navigate", (event, url) => {
      if (!url.startsWith("data:text/html")) event.preventDefault();
    });
    try {
      const html = buildPropertyReportHtml(report, request.language);
      await reportWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      if (request.action === "print") {
        const printed = await new Promise<boolean>((resolve) => {
          reportWindow.webContents.print({ silent: false, printBackground: true }, (success) => resolve(success));
        });
        return { canceled: !printed };
      }
      const pdf = await reportWindow.webContents.printToPDF({
        displayHeaderFooter: true,
        footerTemplate: footerTemplate(request.language),
        headerTemplate: "<span></span>",
        pageSize: "A4",
        preferCSSPageSize: true,
        printBackground: true,
      });
      await savePdfAtomically(filePath!, pdf);
      return { canceled: false, fileName: path.basename(filePath!) };
    } finally {
      if (!reportWindow.isDestroyed()) reportWindow.destroy();
    }
  }
}

export const propertyReportInternals = { localTodayIso, validPdf, savePdfAtomically };
