import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { SettingsService } from "../../src/infrastructure/settings/SettingsService";

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))); });

describe("SettingsService", () => {
  it("uses conservative defaults and persists validated preferences", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "contami-settings-")); directories.push(directory);
    const service = new SettingsService(directory);
    expect(await service.get()).toMatchObject({ language: "system", theme: "system", workbookFormat: "excel" });
    await service.update({ language: "it", theme: "dark" });
    expect(await service.get()).toMatchObject({ language: "it", theme: "dark", workbookFormat: "excel" });
  });
});
