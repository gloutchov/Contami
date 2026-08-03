import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  XLSX_BLOCKED_ENTRY_PATTERNS,
  XLSX_REQUIRED_ENTRIES,
  preflightXlsxZip,
  type XlsxZipLimits,
} from "../../src/infrastructure/spreadsheet/XlsxZipPreflight";
import { buildSyntheticZip, REQUIRED_XLSX_ENTRIES, type SyntheticZipEntry } from "../helpers/syntheticZip";

const MIB = 1024 * 1024;
const limits: XlsxZipLimits = {
  maxFileBytes: 32 * MIB,
  maxEntries: 64,
  maxCentralDirectoryBytes: MIB,
  maxEntryNameBytes: 1_024,
  maxExtraFieldBytes: 16 * 1_024,
  maxCommentBytes: 4 * 1_024,
  maxTotalUncompressedBytes: 16 * MIB,
  maxEntryUncompressedBytes: 12 * MIB,
  maxCompressionRatio: 200,
};
const policy = {
  limits,
  unsafeErrorCode: "SYNTHETIC_UNSAFE",
  resourceErrorCode: "SYNTHETIC_RESOURCE_LIMIT",
  requiredEntries: XLSX_REQUIRED_ENTRIES,
  blockedEntryPatterns: XLSX_BLOCKED_ENTRY_PATTERNS,
};
const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function writeArchive(buffer: Buffer, name = "synthetic.xlsx"): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "contami-zip-preflight-"));
  directories.push(directory);
  const filePath = path.join(directory, name);
  await writeFile(filePath, buffer);
  return filePath;
}

function archiveWith(...entries: SyntheticZipEntry[]): Buffer {
  return buildSyntheticZip([...REQUIRED_XLSX_ENTRIES, ...entries]);
}

describe("XlsxZipPreflight", () => {
  it("accepts a bounded XLSX container without reading entry payloads", async () => {
    const payload = Buffer.alloc(8 * MIB, 0x5a);
    const filePath = await writeArchive(archiveWith({ name: "xl/worksheets/sheet1.xml", data: payload }));
    const startedAt = performance.now();

    const result = await preflightXlsxZip(filePath, policy);

    expect(result.entries).toBe(REQUIRED_XLSX_ENTRIES.length + 1);
    expect(result.uncompressedBytes).toBeGreaterThanOrEqual(payload.length);
    expect(result.inspectedBytes).toBeLessThan(128 * 1_024);
    expect(performance.now() - startedAt).toBeLessThan(2_000);
  });

  it.each([
    ["duplicate entry", archiveWith({ name: "xl/workbook.xml", data: Buffer.from("duplicate") })],
    ["case-insensitive duplicate entry", archiveWith({ name: "XL/WORKBOOK.XML", data: Buffer.from("duplicate") })],
    ["Unicode-normalized duplicate entry", archiveWith(
      { name: "xl/media/caf\u00e9.txt", data: Buffer.from("first") },
      { name: "xl/media/cafe\u0301.txt", data: Buffer.from("second") },
    )],
    ["traversal path", archiveWith({ name: "xl/../payload.xml", data: Buffer.from("x") })],
    ["nested archive", archiveWith({ name: "xl/media/payload.zip", data: Buffer.from("x") })],
    ["dialog sheet", archiveWith({ name: "xl/dialogSheets/sheet1.xml", data: Buffer.from("x") })],
  ])("rejects a %s", async (_label, buffer) => {
    const filePath = await writeArchive(buffer);
    await expect(preflightXlsxZip(filePath, policy)).rejects.toThrow("SYNTHETIC_UNSAFE");
  });

  it("rejects truncated archives and inconsistent local metadata", async () => {
    const valid = archiveWith({ name: "xl/worksheets/sheet1.xml", data: Buffer.from("x") });
    const truncatedPath = await writeArchive(valid.subarray(0, valid.length - 7), "truncated.xlsx");
    await expect(preflightXlsxZip(truncatedPath, policy)).rejects.toThrow("SYNTHETIC_UNSAFE");

    const inconsistent = Buffer.from(valid);
    inconsistent.writeUInt16LE(8, 8);
    const inconsistentPath = await writeArchive(inconsistent, "inconsistent.xlsx");
    await expect(preflightXlsxZip(inconsistentPath, policy)).rejects.toThrow("SYNTHETIC_UNSAFE");
  });

  it("validates signed data descriptors and rejects inconsistent descriptor metadata", async () => {
    const valid = archiveWith({
      name: "xl/worksheets/sheet1.xml",
      data: Buffer.from("descriptor payload"),
      compression: "deflate",
      dataDescriptor: true,
    });
    await expect(preflightXlsxZip(await writeArchive(valid, "descriptor.xlsx"), policy)).resolves.toMatchObject({
      entries: REQUIRED_XLSX_ENTRIES.length + 1,
    });

    const unsigned = archiveWith({
      name: "xl/worksheets/sheet1.xml",
      data: Buffer.from("unsigned descriptor payload"),
      compression: "deflate",
      dataDescriptor: true,
      dataDescriptorSignature: false,
    });
    await expect(preflightXlsxZip(await writeArchive(unsigned, "unsigned-descriptor.xlsx"), policy)).resolves.toMatchObject({
      entries: REQUIRED_XLSX_ENTRIES.length + 1,
    });

    const inconsistent = Buffer.from(valid);
    const eocdOffset = inconsistent.length - 22;
    const centralOffset = inconsistent.readUInt32LE(eocdOffset + 16);
    inconsistent.writeUInt32LE(1, centralOffset - 12);
    await expect(preflightXlsxZip(await writeArchive(inconsistent, "bad-descriptor.xlsx"), policy)).rejects.toThrow("SYNTHETIC_UNSAFE");
  });

  it("rejects a highly compressible ZIP bomb before decompressing data", async () => {
    const filePath = await writeArchive(archiveWith({
      name: "xl/worksheets/sheet1.xml",
      data: Buffer.alloc(MIB, 0x41),
      compression: "deflate",
    }));
    await expect(preflightXlsxZip(filePath, policy)).rejects.toThrow("SYNTHETIC_RESOURCE_LIMIT");
  });

  it.each([
    ["file size", (archive: Buffer) => ({ ...limits, maxFileBytes: archive.length - 1 })],
    ["entry count", () => ({ ...limits, maxEntries: REQUIRED_XLSX_ENTRIES.length })],
    ["central-directory size", () => ({ ...limits, maxCentralDirectoryBytes: 64 })],
    ["single-entry expansion", () => ({ ...limits, maxEntryUncompressedBytes: 4 })],
    ["total expansion", () => ({ ...limits, maxTotalUncompressedBytes: 40 })],
    ["compression ratio", () => ({ ...limits, maxCompressionRatio: 2 })],
  ])("enforces the %s resource limit", async (_label, limitFactory) => {
    const archive = archiveWith({
      name: "xl/worksheets/sheet1.xml",
      data: Buffer.alloc(32, 0x41),
      compression: "deflate",
    });
    const filePath = await writeArchive(archive);
    await expect(preflightXlsxZip(filePath, {
      ...policy,
      limits: limitFactory(archive),
    })).rejects.toThrow("SYNTHETIC_RESOURCE_LIMIT");
  });

  it("handles reproducible structural mutations with deterministic safe outcomes", async () => {
    const original = archiveWith({ name: "xl/worksheets/sheet1.xml", data: Buffer.from("synthetic") });
    let state = 0x9e3779b9;
    const next = (): number => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return state >>> 0;
    };
    for (let index = 0; index < 32; index += 1) {
      const mutated = Buffer.from(original);
      const structuralOffset = next() % 2 === 0
        ? next() % 30
        : mutated.length - 1 - (next() % Math.min(220, mutated.length));
      mutated[structuralOffset] = mutated[structuralOffset]! ^ (1 << (next() % 8));
      const filePath = await writeArchive(mutated, `seed-${index}.xlsx`);
      const outcome = async (): Promise<string> => {
        try {
          await preflightXlsxZip(filePath, policy);
          return "OK";
        } catch (error) {
          return error instanceof Error ? error.message : "UNKNOWN";
        }
      };
      const first = await outcome();
      expect(["OK", "SYNTHETIC_UNSAFE", "SYNTHETIC_RESOURCE_LIMIT"]).toContain(first);
      expect(await outcome()).toBe(first);
    }
  });
});
