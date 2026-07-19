import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, rename, rm } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { APP_CONFIG } from "../../config/appConfig";

const execFileAsync = promisify(execFile);

function assertMirrorPaths(sourcePath: string, destinationPath: string): void {
  if (!path.isAbsolute(sourcePath) || !path.isAbsolute(destinationPath)) throw new Error("INVALID_MIRROR_PATH");
  if (path.extname(sourcePath).toLowerCase() !== ".xlsx" || path.extname(destinationPath).toLowerCase() !== ".numbers") throw new Error("INVALID_MIRROR_PATH");
  if (sourcePath.includes("\0") || destinationPath.includes("\0")) throw new Error("INVALID_MIRROR_PATH");
}

export class NumbersMirrorService {
  constructor(private readonly scriptPath: string) {}

  async isAvailable(): Promise<boolean> {
    if (process.platform !== "darwin") return false;
    const candidates = [
      "/Applications/Numbers.app",
      "/Applications/Numbers Creator Studio.app",
      path.join(process.env.HOME ?? "", "Applications", "Numbers.app"),
      path.join(process.env.HOME ?? "", "Applications", "Numbers Creator Studio.app"),
    ].filter((candidate) => candidate.startsWith("/"));
    for (const candidate of candidates) {
      try { await access(candidate); return true; } catch { /* Try the next supported Apple installation name. */ }
    }
    return false;
  }

  async mirror(sourcePath: string, destinationPath: string): Promise<void> {
    assertMirrorPaths(sourcePath, destinationPath);
    if (!(await this.isAvailable())) throw new Error("NUMBERS_NOT_AVAILABLE");
    const temporary = path.join(path.dirname(destinationPath), `.${path.basename(destinationPath, ".numbers")}-${randomUUID()}.numbers`);
    const rollback = `${destinationPath}.rollback-${randomUUID()}`;
    let hadExisting = false;
    try {
      await execFileAsync("/usr/bin/osascript", [this.scriptPath, sourcePath, temporary], {
        timeout: APP_CONFIG.numbersMirror.timeoutMs,
        windowsHide: true,
        maxBuffer: APP_CONFIG.numbersMirror.maxBufferBytes,
      });
      try {
        await access(destinationPath);
        await rename(destinationPath, rollback);
        hadExisting = true;
      } catch {
        hadExisting = false;
      }
      await rename(temporary, destinationPath);
      if (hadExisting) await rm(rollback, { recursive: true, force: true });
    } catch (error) {
      await rm(temporary, { recursive: true, force: true });
      if (hadExisting) {
        await rm(destinationPath, { recursive: true, force: true });
        await rename(rollback, destinationPath);
      }
      throw error;
    }
  }
}
