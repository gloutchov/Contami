import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsService } from "../../src/infrastructure/settings/SettingsService";
import { ExcelWorkbookRepository } from "../../src/infrastructure/spreadsheet/ExcelWorkbookRepository";
import { NumbersMirrorService } from "../../src/infrastructure/spreadsheet/NumbersMirrorService";
import { FinanceFileService } from "../../src/main/services/FinanceFileService";
import { createEmptyFinanceData } from "../../src/domain/finance";

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

  it("saves an import batch atomically with one recoverable backup", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-atomic-import-"));
    directories.push(directory);
    const workbookPath = path.join(directory, "finance.xlsx");
    const settings = new SettingsService(directory);
    const repository = new ExcelWorkbookRepository();
    const data = createEmptyFinanceData(2026);
    await repository.save(workbookPath, data);
    await settings.update({ workbookFormat: "excel", workbookPath });
    const service = new FinanceFileService(
      {} as never,
      settings,
      repository,
      new NumbersMirrorService(path.join(directory, "numbers-mirror.applescript")),
    );
    await service.snapshot();
    const category = data.categories.find((item) => item.kind === "income")!;
    const payment = data.paymentMethods[0]!;
    const timestamp = new Date().toISOString();
    const value = {
      id: crypto.randomUUID(), date: "2026-01-01", description: "Synthetic import", categoryId: category.id,
      paymentMethodId: payment.id, kind: "income" as const, amount: 10, currency: "EUR",
      planned: false, shared: false, notes: "", createdAt: timestamp, updatedAt: timestamp,
    };

    await service.applyImport([{ type: "addTransaction", value }]);

    await expect(repository.load(workbookPath)).resolves.toMatchObject({ transactions: [expect.objectContaining({ id: value.id })] });
    expect(await readdir(path.join(directory, ".contami-backups"))).toHaveLength(1);

    const duplicateBatch = [
      { type: "addTransaction" as const, value: { ...value, id: crypto.randomUUID(), description: "First synthetic" } },
      { type: "addTransaction" as const, value: { ...value, id: crypto.randomUUID(), description: "Second synthetic" } },
    ];
    duplicateBatch[1]!.value.id = duplicateBatch[0]!.value.id;
    await expect(service.applyImport(duplicateBatch)).rejects.toThrow("DUPLICATE_ID");
    const unchanged = await repository.load(workbookPath);
    expect(unchanged.transactions).toHaveLength(1);
    expect(await readdir(path.join(directory, ".contami-backups"))).toHaveLength(1);
  }, 30_000);

  it("rejects an import confirmation when another process changed the workbook after preview", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-import-conflict-"));
    directories.push(directory);
    const workbookPath = path.join(directory, "finance.xlsx");
    const settings = new SettingsService(directory);
    const repository = new ExcelWorkbookRepository();
    const data = createEmptyFinanceData(2026);
    await repository.save(workbookPath, data);
    await settings.update({ workbookFormat: "excel", workbookPath });
    const service = new FinanceFileService(
      {} as never,
      settings,
      repository,
      new NumbersMirrorService(path.join(directory, "numbers-mirror.applescript")),
    );
    await service.snapshot();
    const externallyChanged = structuredClone(data);
    externallyChanged.accounts.push({
      id: crypto.randomUUID(), name: "Synthetic external account", kind: "bank", currency: "EUR",
      openingBalance: 0, active: true, openedAt: "2026-01-01", notes: "",
    });
    await repository.save(workbookPath, externallyChanged);
    const category = data.categories.find((item) => item.kind === "income")!;
    const payment = data.paymentMethods[0]!;
    const timestamp = new Date().toISOString();

    await expect(service.applyImport([{
      type: "addTransaction",
      value: {
        id: crypto.randomUUID(), date: "2026-01-01", description: "Synthetic import", categoryId: category.id,
        paymentMethodId: payment.id, kind: "income", amount: 10, currency: "EUR", notes: "",
        createdAt: timestamp, updatedAt: timestamp,
      },
    }])).rejects.toThrow("WORKBOOK_CHANGED_EXTERNALLY");

    const stored = await repository.load(workbookPath);
    expect(stored.accounts).toHaveLength(1);
    expect(stored.transactions).toEqual([]);
  }, 30_000);
});
