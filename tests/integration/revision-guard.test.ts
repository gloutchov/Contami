import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
});
