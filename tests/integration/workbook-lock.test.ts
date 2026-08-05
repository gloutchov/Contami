import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { WorkbookLockManager, workbookLockPath } from "../../src/infrastructure/spreadsheet/WorkbookLockManager";

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });

describe("WorkbookLockManager", () => {
  it("allows only one active cooperative writer", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-lock-active-")); directories.push(directory);
    const filePath = path.join(directory, "finance.xlsx");
    const first = new WorkbookLockManager();
    const second = new WorkbookLockManager();
    const lease = await first.acquire(filePath);

    await expect(second.acquire(filePath)).rejects.toThrow("WORKBOOK_LOCKED");
    await expect(second.recoverStale(filePath)).rejects.toThrow("WORKBOOK_LOCKED");
    await lease.assertOwned();
    await lease.release();
    await expect(second.acquire(filePath)).resolves.toBeDefined();
  });

  it("requires explicit recovery after a crashed writer lease expires", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-lock-stale-")); directories.push(directory);
    const filePath = path.join(directory, "finance.xlsx");
    let now = 1_000_000;
    const first = new WorkbookLockManager({ leaseMs: 1_000, now: () => now });
    const second = new WorkbookLockManager({ leaseMs: 1_000, now: () => now });
    await first.acquire(filePath);
    now += 2_000;

    await expect(second.acquire(filePath)).rejects.toThrow("WORKBOOK_LOCK_STALE");
    await expect(second.recoverStale(filePath)).resolves.toBe(true);
    const recoveredLease = await second.acquire(filePath);
    await recoveredLease.assertOwned();
    await recoveredLease.release();
  });

  it("bounds malformed lock files and recovers them only after the lease window", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-lock-malformed-")); directories.push(directory);
    const filePath = path.join(directory, "finance.xlsx");
    let now = Date.now();
    const manager = new WorkbookLockManager({ leaseMs: 1_000, maxBytes: 256, now: () => now });
    await writeFile(workbookLockPath(filePath), "x".repeat(300));

    await expect(manager.acquire(filePath)).rejects.toThrow("WORKBOOK_LOCKED");
    now += 2_000;
    await expect(manager.acquire(filePath)).rejects.toThrow("WORKBOOK_LOCK_STALE");
    await expect(manager.recoverStale(filePath)).resolves.toBe(true);
  });
});
