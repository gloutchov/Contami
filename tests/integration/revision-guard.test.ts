import { mkdtemp, rm, stat, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { WorkbookRevisionGuard } from "../../src/infrastructure/spreadsheet/WorkbookRevisionGuard";

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });

describe("WorkbookRevisionGuard", () => {
  it("blocks a save after another application changes the workbook", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-revision-")); directories.push(directory);
    const filePath = path.join(directory, "finance.xlsx");
    await writeFile(filePath, "original");
    const guard = new WorkbookRevisionGuard();
    const revision = await guard.capture(filePath);
    await writeFile(filePath, "externally changed");
    await expect(guard.assertUnchanged(revision, filePath)).rejects.toThrow("WORKBOOK_CHANGED_EXTERNALLY");
  });

  it("detects changed content even when size and modification time are preserved", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-revision-hash-")); directories.push(directory);
    const filePath = path.join(directory, "finance.xlsx");
    await writeFile(filePath, "original-content");
    const guard = new WorkbookRevisionGuard();
    const revision = await guard.capture(filePath);
    const originalStat = await stat(filePath);

    await writeFile(filePath, "modified-content");
    await utimes(filePath, originalStat.atime, originalStat.mtime);

    const changedStat = await stat(filePath);
    expect(changedStat.size).toBe(revision.size);
    expect(changedStat.mtimeMs).toBeCloseTo(revision.modifiedAtMs, 0);
    await expect(guard.assertUnchanged(revision, filePath)).rejects.toThrow("WORKBOOK_CHANGED_EXTERNALLY");
  });

  it("guards an expected missing destination against a concurrent file creation", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-revision-missing-")); directories.push(directory);
    const filePath = path.join(directory, "finance.xlsx");
    const guard = new WorkbookRevisionGuard();
    const missing = await guard.captureState(filePath);
    expect(missing).toMatchObject({ missing: true });

    await writeFile(filePath, "created elsewhere");

    await expect(guard.assertState(missing, filePath)).rejects.toThrow("WORKBOOK_CHANGED_EXTERNALLY");
  });

  it("reports a loaded workbook moved before save as an external change", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-revision-moved-")); directories.push(directory);
    const filePath = path.join(directory, "finance.xlsx");
    await writeFile(filePath, "original");
    const guard = new WorkbookRevisionGuard();
    const revision = await guard.capture(filePath);

    await rm(filePath);

    await expect(guard.assertUnchanged(revision, filePath)).rejects.toThrow("WORKBOOK_CHANGED_EXTERNALLY");
  });
});
