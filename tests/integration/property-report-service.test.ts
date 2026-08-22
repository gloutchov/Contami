import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import { PropertyReportService, propertyReportInternals } from "../../src/main/services/PropertyReportService";

const electronMocks = vi.hoisted(() => {
  const webContents = {
    setWindowOpenHandler: vi.fn(),
    on: vi.fn(),
    printToPDF: vi.fn(),
    print: vi.fn(),
  };
  const reportWindow = {
    webContents,
    loadURL: vi.fn(),
    isDestroyed: vi.fn(() => false),
    destroy: vi.fn(),
  };
  return {
    showSaveDialog: vi.fn(),
    BrowserWindow: vi.fn(function MockBrowserWindow() { return reportWindow; }),
    webContents,
    reportWindow,
  };
});

vi.mock("electron", () => ({
  BrowserWindow: electronMocks.BrowserWindow,
  dialog: { showSaveDialog: electronMocks.showSaveDialog },
}));

const directories: string[] = [];
afterEach(async () => Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))));

function reportData() {
  const data = createEmptyFinanceData(2026);
  const propertyId = crypto.randomUUID();
  data.properties.push({
    id: propertyId, name: "Synthetic property", kind: "apartment", usage: "residence",
    ownershipShare: 0.5, purchasePrice: 200_000, active: true, notes: "",
  });
  return { data, propertyId };
}

describe("PropertyReportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    electronMocks.reportWindow.loadURL.mockResolvedValue(undefined);
    electronMocks.reportWindow.isDestroyed.mockReturnValue(false);
    electronMocks.webContents.printToPDF.mockResolvedValue(Buffer.from("%PDF-1.7\nsynthetic\n%%EOF", "ascii"));
    electronMocks.webContents.print.mockImplementation((_options, callback) => callback(true));
  });

  it("saves a verified PDF selected by a native dialog and returns only its base name", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-property-report-"));
    directories.push(directory);
    const destination = path.join(directory, "owner-statement");
    electronMocks.showSaveDialog.mockResolvedValue({ canceled: false, filePath: destination });
    const { data, propertyId } = reportData();
    const finance = { dataForReport: vi.fn().mockResolvedValue(data) };
    const service = new PropertyReportService({} as never, finance as never);

    const result = await service.generate({
      propertyId, scope: "current-year", language: "it", action: "save-pdf",
      ownerName: "Owner", coOwnerName: "Co-owner",
    });

    expect(result).toEqual({ canceled: false, fileName: "owner-statement.pdf" });
    expect(result).not.toHaveProperty("path");
    expect(await readFile(`${destination}.pdf`, "ascii")).toContain("%PDF-1.7");
    expect(electronMocks.showSaveDialog).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      title: "Salva PDF",
      properties: expect.arrayContaining(["showOverwriteConfirmation"]),
    }));
    expect(electronMocks.reportWindow.loadURL).toHaveBeenCalledWith(expect.stringMatching(/^data:text\/html;charset=utf-8,/));
    expect(electronMocks.webContents.printToPDF).toHaveBeenCalledWith(expect.objectContaining({ pageSize: "A4", printBackground: true }));
    expect(electronMocks.reportWindow.destroy).toHaveBeenCalledOnce();
  });

  it("uses the system print dialog without asking for or returning a path", async () => {
    const { data, propertyId } = reportData();
    const service = new PropertyReportService({} as never, { dataForReport: vi.fn().mockResolvedValue(data) } as never);

    const result = await service.generate({
      propertyId, scope: "lifetime", language: "en", action: "print",
      ownerName: "Owner", coOwnerName: "Co-owner",
    });

    expect(result).toEqual({ canceled: false });
    expect(electronMocks.showSaveDialog).not.toHaveBeenCalled();
    expect(electronMocks.webContents.print).toHaveBeenCalledWith(
      { silent: false, printBackground: true },
      expect.any(Function),
    );
    expect(electronMocks.webContents.printToPDF).not.toHaveBeenCalled();
  });

  it("does not create a report window when PDF destination selection is canceled", async () => {
    electronMocks.showSaveDialog.mockResolvedValue({ canceled: true });
    const { data, propertyId } = reportData();
    const service = new PropertyReportService({} as never, { dataForReport: vi.fn().mockResolvedValue(data) } as never);

    await expect(service.generate({
      propertyId, scope: "current-year", language: "en", action: "save-pdf",
      ownerName: "Owner", coOwnerName: "Co-owner",
    })).resolves.toEqual({ canceled: true });
    expect(electronMocks.BrowserWindow).not.toHaveBeenCalled();
  });

  it("rejects an invalid PDF before replacing an existing report", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-property-report-invalid-"));
    directories.push(directory);
    const destination = path.join(directory, "statement.pdf");
    await writeFile(destination, "existing report", "utf8");

    await expect(propertyReportInternals.savePdfAtomically(destination, Buffer.from("not a pdf"))).rejects.toThrow("PROPERTY_REPORT_FAILED");
    await expect(readFile(destination, "utf8")).resolves.toBe("existing report");
  });
});
