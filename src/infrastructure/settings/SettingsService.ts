import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { appSettingsSchema, type AppSettings } from "../../shared/contracts";

const DEFAULT_SETTINGS: AppSettings = {
  language: "system",
  theme: "system",
  workbookFormat: "excel",
};

export class SettingsService {
  private readonly filePath: string;

  constructor(userDataPath: string) {
    this.filePath = path.join(userDataPath, "settings.json");
  }

  async get(): Promise<AppSettings> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return appSettingsSchema.parse(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  async update(patch: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.get();
    const next = appSettingsSchema.parse({ ...current, ...patch });
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.tmp-${randomUUID()}`;
    await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temporary, this.filePath);
    return next;
  }
}
