import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsService } from "../../src/infrastructure/settings/SettingsService";
import { ExcelWorkbookRepository } from "../../src/infrastructure/spreadsheet/ExcelWorkbookRepository";
import { NumbersMirrorService } from "../../src/infrastructure/spreadsheet/NumbersMirrorService";
import { FinanceFileService } from "../../src/main/services/FinanceFileService";

vi.mock("electron", () => ({
  dialog: { showOpenDialog: vi.fn(), showSaveDialog: vi.fn() },
  shell: { showItemInFolder: vi.fn() },
}));

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });

describe("FinanceFileService startup recovery", () => {
  it("starts unconfigured when the remembered workbook no longer exists", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-missing-workbook-"));
    directories.push(directory);
    const settings = new SettingsService(directory);
    await settings.update({
      workbookFormat: "excel",
      workbookPath: path.join(directory, "deleted.xlsx"),
      numbersMirrorPath: path.join(directory, "deleted.numbers"),
    });
    const service = new FinanceFileService(
      {} as never,
      settings,
      new ExcelWorkbookRepository(),
      new NumbersMirrorService(path.join(directory, "numbers-mirror.applescript")),
    );

    const snapshot = await service.snapshot();

    expect(snapshot.workbookConfigured).toBe(false);
    expect(snapshot.workbookDisplayName).toBeUndefined();
    expect(snapshot.warningCode).toBe("WORKBOOK_MISSING");
    expect(snapshot.data.transactions).toEqual([]);
    const recoveredSettings = await settings.get();
    expect(recoveredSettings.workbookPath).toBeUndefined();
    expect(recoveredSettings.numbersMirrorPath).toBeUndefined();
  });

  it("does not mistake an existing invalid workbook for a missing file", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-invalid-workbook-"));
    directories.push(directory);
    const invalidPath = path.join(directory, "invalid.xlsx");
    await writeFile(invalidPath, "not a workbook", "utf8");
    const settings = new SettingsService(directory);
    await settings.update({ workbookFormat: "excel", workbookPath: invalidPath });
    const service = new FinanceFileService(
      {} as never,
      settings,
      new ExcelWorkbookRepository(),
      new NumbersMirrorService(path.join(directory, "numbers-mirror.applescript")),
    );

    await expect(service.snapshot()).rejects.toThrow();
    await expect(settings.get()).resolves.toMatchObject({ workbookPath: invalidPath });
  });
});
