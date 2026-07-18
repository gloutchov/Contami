import { stat } from "node:fs/promises";

export interface WorkbookRevision {
  path: string;
  modifiedAtMs: number;
  size: number;
}

export class WorkbookRevisionGuard {
  async capture(filePath: string): Promise<WorkbookRevision> {
    const info = await stat(filePath);
    return { path: filePath, modifiedAtMs: info.mtimeMs, size: info.size };
  }

  async assertUnchanged(expected: WorkbookRevision | undefined, filePath: string): Promise<void> {
    if (!expected || expected.path !== filePath) return;
    const current = await this.capture(filePath);
    if (current.modifiedAtMs !== expected.modifiedAtMs || current.size !== expected.size) {
      throw new Error("WORKBOOK_CHANGED_EXTERNALLY");
    }
  }
}
