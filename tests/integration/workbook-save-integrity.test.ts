import { mkdtemp, readFile, readdir, rm, stat, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import { ExcelWorkbookRepository } from "../../src/infrastructure/spreadsheet/ExcelWorkbookRepository";
import { WorkbookRevisionGuard, type WorkbookRevisionState } from "../../src/infrastructure/spreadsheet/WorkbookRevisionGuard";

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });

function createSyntheticData() {
  const data = createEmptyFinanceData(2026);
  data.accounts.push({
    id: "00000000-0000-4000-8000-0000000000a1",
    name: "Synthetic bank",
    kind: "bank",
    currency: "EUR",
    openingBalance: 0,
    active: true,
    openedAt: "2026-01-01",
    notes: "",
  });
  return data;
}

class InterferingRevisionGuard extends WorkbookRevisionGuard {
  private injected = false;

  constructor(
    private readonly targetPath: string,
    private readonly replacement: Buffer,
    private readonly originalAtime: Date,
    private readonly originalMtime: Date,
  ) {
    super();
  }

  override async assertState(expected: WorkbookRevisionState, filePath: string): Promise<void> {
    await super.assertState(expected, filePath);
    if (!this.injected && filePath === this.targetPath) {
      this.injected = true;
      await writeFile(filePath, this.replacement);
      await utimes(filePath, this.originalAtime, this.originalMtime);
    }
  }
}

describe("workbook save integrity", () => {
  it("allows only one of two overlapping writers to commit the same loaded revision", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-overlapping-writers-")); directories.push(directory);
    const filePath = path.join(directory, "finance.xlsx");
    const initialRepository = new ExcelWorkbookRepository();
    const initial = createSyntheticData();
    const revision = await initialRepository.save(filePath, initial);
    const first = structuredClone(initial);
    const second = structuredClone(initial);
    first.meta.updatedAt = new Date(Date.now() + 1_000).toISOString();
    second.meta.updatedAt = new Date(Date.now() + 2_000).toISOString();
    first.accounts[0]!.notes = "Synthetic writer A";
    second.accounts[0]!.notes = "Synthetic writer B";

    const results = await Promise.allSettled([
      new ExcelWorkbookRepository().save(filePath, first, revision),
      new ExcelWorkbookRepository().save(filePath, second, revision),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toBeDefined();
    expect((rejected as PromiseRejectedResult).reason).toEqual(expect.objectContaining({
      message: expect.stringMatching(/WORKBOOK_(LOCKED|CHANGED_EXTERNALLY)/),
    }));
    const stored = await initialRepository.load(filePath);
    expect(["Synthetic writer A", "Synthetic writer B"]).toContain(stored.accounts[0]!.notes);
  }, 30_000);

  it("preserves a same-size external edit made during the commit window", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-commit-window-")); directories.push(directory);
    const filePath = path.join(directory, "finance.xlsx");
    const initialRepository = new ExcelWorkbookRepository();
    const initial = createSyntheticData();
    const revision = await initialRepository.save(filePath, initial);
    const original = await readFile(filePath);
    const external = Buffer.from(original);
    external[Math.max(0, external.length - 32)] ^= 0x01;
    const originalStat = await stat(filePath);
    const guard = new InterferingRevisionGuard(filePath, external, originalStat.atime, originalStat.mtime);
    const repository = new ExcelWorkbookRepository(guard);
    const next = structuredClone(initial);
    next.accounts[0]!.notes = "ContaMì writer";

    await expect(repository.save(filePath, next, revision)).rejects.toThrow("WORKBOOK_CHANGED_EXTERNALLY");

    expect(await readFile(filePath)).toEqual(external);
    expect(await readdir(path.join(directory, ".contami-backups"))).toEqual([]);
  }, 30_000);
});
