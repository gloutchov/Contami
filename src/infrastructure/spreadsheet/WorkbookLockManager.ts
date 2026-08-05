import { randomUUID } from "node:crypto";
import { open, rm } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { APP_CONFIG } from "../../config/appConfig";

const workbookLockSchema = z.object({
  version: z.literal(1),
  ownerId: z.string().uuid(),
  token: z.string().uuid(),
  acquiredAtMs: z.number().int().nonnegative(),
  expiresAtMs: z.number().int().positive(),
}).strict();

type WorkbookLockRecord = z.infer<typeof workbookLockSchema>;
type LockStatus = "absent" | "active" | "stale";

interface LockInspection {
  status: LockStatus;
  record?: WorkbookLockRecord;
  identity?: string;
}

export interface WorkbookLockLease {
  assertOwned(): Promise<void>;
  release(): Promise<void>;
}

export interface WorkbookLockOptions {
  leaseMs?: number;
  maxBytes?: number;
  now?: () => number;
  ownerId?: string;
}

const unavailableCodes = new Set(["EACCES", "EPERM", "EROFS", "ENOSYS", "ENOTSUP", "EOPNOTSUPP", "ENAMETOOLONG", "EINVAL"]);

function errorCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
}

export function workbookLockPath(filePath: string): string {
  return path.join(path.dirname(filePath), `.${path.basename(filePath)}.contami.lock`);
}

export class WorkbookLockManager {
  private readonly leaseMs: number;
  private readonly maxBytes: number;
  private readonly now: () => number;
  private readonly ownerId: string;

  constructor(options: WorkbookLockOptions = {}) {
    this.leaseMs = options.leaseMs ?? APP_CONFIG.workbook.lockLeaseMs;
    this.maxBytes = options.maxBytes ?? APP_CONFIG.workbook.lockMaxBytes;
    this.now = options.now ?? Date.now;
    this.ownerId = options.ownerId ?? randomUUID();
    if (!Number.isSafeInteger(this.leaseMs) || this.leaseMs < 1_000 || this.leaseMs > 60 * 60 * 1_000) {
      throw new Error("INVALID_WORKBOOK_LOCK_CONFIG");
    }
    if (!Number.isSafeInteger(this.maxBytes) || this.maxBytes < 256 || this.maxBytes > 64 * 1_024) {
      throw new Error("INVALID_WORKBOOK_LOCK_CONFIG");
    }
  }

  async acquire(filePath: string): Promise<WorkbookLockLease> {
    const lockPath = workbookLockPath(filePath);
    const acquiredAtMs = this.now();
    const record: WorkbookLockRecord = {
      version: 1,
      ownerId: this.ownerId,
      token: randomUUID(),
      acquiredAtMs,
      expiresAtMs: acquiredAtMs + this.leaseMs,
    };
    let handle;
    try {
      handle = await open(lockPath, "wx", 0o600);
      await handle.writeFile(`${JSON.stringify(record)}\n`, "utf8");
      await handle.sync();
    } catch (error) {
      await handle?.close().catch(() => undefined);
      const code = errorCode(error);
      if (code === "EEXIST") {
        const inspection = await this.inspect(lockPath);
        throw new Error(inspection.status === "stale" ? "WORKBOOK_LOCK_STALE" : "WORKBOOK_LOCKED", { cause: error });
      }
      if (handle) await rm(lockPath, { force: true }).catch(() => undefined);
      if (code && unavailableCodes.has(code)) throw new Error("WORKBOOK_LOCK_UNAVAILABLE", { cause: error });
      throw error;
    }
    await handle.close();

    return {
      assertOwned: () => this.assertOwned(lockPath, record),
      release: () => this.release(lockPath, record),
    };
  }

  async recoverStale(filePath: string): Promise<boolean> {
    const lockPath = workbookLockPath(filePath);
    const first = await this.inspect(lockPath);
    if (first.status === "absent") return false;
    if (first.status !== "stale") throw new Error("WORKBOOK_LOCKED");
    const second = await this.inspect(lockPath);
    if (second.status === "absent") return false;
    if (second.status !== "stale"
      || second.identity !== first.identity
      || second.record?.token !== first.record?.token
      || second.record?.ownerId !== first.record?.ownerId) {
      throw new Error("WORKBOOK_LOCKED");
    }
    try {
      await rm(lockPath);
      return true;
    } catch (error) {
      if (errorCode(error) === "ENOENT") return false;
      if (unavailableCodes.has(errorCode(error) ?? "")) throw new Error("WORKBOOK_LOCK_UNAVAILABLE", { cause: error });
      throw error;
    }
  }

  private async assertOwned(lockPath: string, expected: WorkbookLockRecord): Promise<void> {
    const inspection = await this.inspect(lockPath);
    if (inspection.status !== "active"
      || inspection.record?.ownerId !== expected.ownerId
      || inspection.record.token !== expected.token) {
      throw new Error("WORKBOOK_LOCK_LOST");
    }
  }

  private async release(lockPath: string, expected: WorkbookLockRecord): Promise<void> {
    try {
      const inspection = await this.inspect(lockPath);
      if (inspection.record?.ownerId === expected.ownerId && inspection.record.token === expected.token) {
        await rm(lockPath, { force: true });
      }
    } catch {
      // A failed cleanup leaves a bounded lease that can be recovered explicitly after expiry.
    }
  }

  private async inspect(lockPath: string): Promise<LockInspection> {
    let handle;
    try {
      handle = await open(lockPath, "r");
      const info = await handle.stat();
      const identity = `${info.dev}:${info.ino}:${info.size}:${info.mtimeMs}:${info.ctimeMs}`;
      if (info.size < 1 || info.size > this.maxBytes) {
        return { status: info.mtimeMs + this.leaseMs <= this.now() ? "stale" : "active", identity };
      }
      const buffer = Buffer.alloc(info.size);
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
      if (bytesRead !== info.size) return { status: "active", identity };
      let value: unknown;
      try {
        value = JSON.parse(buffer.toString("utf8"));
      } catch {
        return { status: info.mtimeMs + this.leaseMs <= this.now() ? "stale" : "active", identity };
      }
      const parsed = workbookLockSchema.safeParse(value);
      if (!parsed.success
        || parsed.data.expiresAtMs <= parsed.data.acquiredAtMs
        || parsed.data.expiresAtMs - parsed.data.acquiredAtMs > 60 * 60 * 1_000) {
        return { status: info.mtimeMs + this.leaseMs <= this.now() ? "stale" : "active", identity };
      }
      return {
        status: parsed.data.expiresAtMs <= this.now() ? "stale" : "active",
        record: parsed.data,
        identity,
      };
    } catch (error) {
      if (errorCode(error) === "ENOENT") return { status: "absent" };
      if (unavailableCodes.has(errorCode(error) ?? "")) throw new Error("WORKBOOK_LOCK_UNAVAILABLE", { cause: error });
      throw error;
    } finally {
      await handle?.close().catch(() => undefined);
    }
  }
}
