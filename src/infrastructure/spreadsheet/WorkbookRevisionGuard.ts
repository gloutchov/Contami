import { createHash } from "node:crypto";
import { open, stat } from "node:fs/promises";
import { APP_CONFIG } from "../../config/appConfig";

export interface WorkbookRevision {
  path: string;
  modifiedAtMs: number;
  size: number;
  sha256: string;
}

export interface MissingWorkbookRevision {
  path: string;
  missing: true;
}

export type WorkbookRevisionState = WorkbookRevision | MissingWorkbookRevision;

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function sameFileIdentity(
  left: { dev: number; ino: number; size: number; mtimeMs: number; ctimeMs: number },
  right: { dev: number; ino: number; size: number; mtimeMs: number; ctimeMs: number },
): boolean {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.size === right.size
    && left.mtimeMs === right.mtimeMs
    && left.ctimeMs === right.ctimeMs;
}

export class WorkbookRevisionGuard {
  constructor(private readonly maxBytes = APP_CONFIG.workbook.maxBytes) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error("INVALID_WORKBOOK_REVISION_CONFIG");
  }

  async capture(filePath: string): Promise<WorkbookRevision> {
    const handle = await open(filePath, "r");
    try {
      const before = await handle.stat();
      if (before.size > this.maxBytes) throw new Error("WORKBOOK_TOO_LARGE");
      const digest = createHash("sha256");
      const buffer = Buffer.allocUnsafe(1024 * 1024);
      let position = 0;
      while (position < before.size) {
        const { bytesRead } = await handle.read(buffer, 0, Math.min(buffer.length, before.size - position), position);
        if (bytesRead === 0) break;
        digest.update(buffer.subarray(0, bytesRead));
        position += bytesRead;
      }
      const after = await handle.stat();
      const currentPath = await stat(filePath);
      if (position !== before.size || !sameFileIdentity(before, after) || !sameFileIdentity(after, currentPath)) {
        throw new Error("WORKBOOK_CHANGED_EXTERNALLY");
      }
      return {
        path: filePath,
        modifiedAtMs: after.mtimeMs,
        size: after.size,
        sha256: digest.digest("hex"),
      };
    } finally {
      await handle.close();
    }
  }

  async captureState(filePath: string): Promise<WorkbookRevisionState> {
    try {
      return await this.capture(filePath);
    } catch (error) {
      if (isMissingFile(error)) return { path: filePath, missing: true };
      throw error;
    }
  }

  async assertState(expected: WorkbookRevisionState, filePath: string): Promise<void> {
    if (expected.path !== filePath) throw new Error("WORKBOOK_CHANGED_EXTERNALLY");
    if ("missing" in expected) {
      const current = await this.captureState(filePath);
      if (!("missing" in current)) throw new Error("WORKBOOK_CHANGED_EXTERNALLY");
      return;
    }
    await this.assertUnchanged(expected, filePath);
  }

  async assertUnchanged(expected: WorkbookRevision | undefined, filePath: string): Promise<void> {
    if (!expected) return;
    if (expected.path !== filePath) throw new Error("WORKBOOK_CHANGED_EXTERNALLY");
    let current: WorkbookRevision;
    try {
      current = await this.capture(filePath);
    } catch (error) {
      if (isMissingFile(error)) throw new Error("WORKBOOK_CHANGED_EXTERNALLY", { cause: error });
      throw error;
    }
    if (current.modifiedAtMs !== expected.modifiedAtMs
      || current.size !== expected.size
      || current.sha256 !== expected.sha256) {
      throw new Error("WORKBOOK_CHANGED_EXTERNALLY");
    }
  }
}
