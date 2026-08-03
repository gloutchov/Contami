import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { performance } from "node:perf_hooks";
import path from "node:path";
import JSZip from "jszip";
import { afterEach, describe, expect, it } from "vitest";
import { ExcelWorkbookRepository } from "../../src/infrastructure/spreadsheet/ExcelWorkbookRepository";
import {
  preflightXlsxArchive,
  preflightXlsxWorkbook,
  type XlsxArchiveLimits,
} from "../../src/infrastructure/spreadsheet/XlsxArchivePreflight";

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

interface CentralRecord {
  centralOffset: number;
  localOffset: number;
  nameOffset: number;
  nameLength: number;
  name: string;
}

function findEocd(buffer: Buffer): number {
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65_557); offset -= 1) {
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) return offset;
  }
  throw new Error("Synthetic ZIP has no EOCD");
}

function centralRecords(buffer: Buffer): { eocd: number; centralOffset: number; records: CentralRecord[] } {
  const eocd = findEocd(buffer);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  const count = buffer.readUInt16LE(eocd + 10);
  const records: CentralRecord[] = [];
  let offset = centralOffset;
  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(offset) !== CENTRAL_SIGNATURE) throw new Error("Synthetic central directory is invalid");
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const nameOffset = offset + 46;
    records.push({
      centralOffset: offset,
      localOffset: buffer.readUInt32LE(offset + 42),
      nameOffset,
      nameLength,
      name: buffer.subarray(nameOffset, nameOffset + nameLength).toString("utf8"),
    });
    offset = nameOffset + nameLength + extraLength + commentLength;
  }
  return { eocd, centralOffset, records };
}

function replaceRecordName(buffer: Buffer, record: CentralRecord, nextName: string): void {
  const encoded = Buffer.from(nextName, "utf8");
  if (encoded.length !== record.nameLength) throw new Error("Synthetic replacement name must keep the same byte length");
  encoded.copy(buffer, record.nameOffset);
  if (buffer.readUInt32LE(record.localOffset) !== LOCAL_SIGNATURE) throw new Error("Synthetic local header is invalid");
  const localNameLength = buffer.readUInt16LE(record.localOffset + 26);
  if (localNameLength !== encoded.length) throw new Error("Synthetic local name has a different length");
  encoded.copy(buffer, record.localOffset + 30);
}

async function syntheticXlsx(entries: Record<string, string | Buffer> = {}): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", "<Types/>");
  zip.file("_rels/.rels", "<Relationships/>");
  zip.file("xl/workbook.xml", "<workbook/>");
  zip.file("xl/_rels/workbook.xml.rels", "<Relationships/>");
  for (const [name, value] of Object.entries(entries)) zip.file(name, value);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } });
}

async function temporaryFile(name: string, contents: Buffer): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "contami-xlsx-preflight-"));
  directories.push(directory);
  const filePath = path.join(directory, name);
  await writeFile(filePath, contents);
  return filePath;
}

describe("XlsxArchivePreflight", () => {
  it("accepts a bounded XLSX and reports its archive budget before parsing", async () => {
    const filePath = await temporaryFile("valid.xlsx", await syntheticXlsx({ "xl/worksheets/sheet1.xml": "<worksheet/>" }));

    const summary = await preflightXlsxWorkbook(filePath);

    expect(summary.entries).toBeGreaterThanOrEqual(5);
    expect(summary.fileBytes).toBeGreaterThan(0);
    expect(summary.expandedBytes).toBeGreaterThan(0);
    expect(summary.maximumCompressionRatio).toBeGreaterThanOrEqual(1);
  });

  it("rejects truncation, nested archives, duplicate names and traversal without modifying the file", async () => {
    const valid = await syntheticXlsx({
      "xl/a.xml": "<a/>",
      "xl/b.xml": "<b/>",
      "xl/aa/bad.xml": "<bad/>",
    });
    const duplicate = Buffer.from(valid);
    const duplicateRecords = centralRecords(duplicate).records;
    replaceRecordName(duplicate, duplicateRecords.find((record) => record.name === "xl/b.xml")!, "xl/a.xml");
    const traversal = Buffer.from(valid);
    const traversalRecord = centralRecords(traversal).records.find((record) => record.name === "xl/aa/bad.xml")!;
    replaceRecordName(traversal, traversalRecord, "xl/../bad.xml");
    const nestedZip = await syntheticXlsx({ "xl/nested.zip": await syntheticXlsx() });

    for (const [name, contents] of [
      ["truncated.xlsx", valid.subarray(0, valid.length - 9)],
      ["duplicate.xlsx", duplicate],
      ["traversal.xlsx", traversal],
      ["nested.xlsx", nestedZip],
    ] as const) {
      const filePath = await temporaryFile(name, contents);
      const before = await readFile(filePath);
      await expect(preflightXlsxWorkbook(filePath)).rejects.toThrow("WORKBOOK_ARCHIVE_UNSAFE");
      expect(await readFile(filePath)).toEqual(before);
    }
  });

  it("rejects an extreme compression ratio through the repository before ExcelJS parsing", async () => {
    const bomb = await syntheticXlsx({ "xl/worksheets/sheet1.xml": Buffer.alloc(2 * 1024 * 1024, 0x41) });
    const filePath = await temporaryFile("compression-bomb.xlsx", bomb);
    const startedAt = performance.now();

    await expect(new ExcelWorkbookRepository().load(filePath)).rejects.toThrow("WORKBOOK_RESOURCE_LIMIT");

    expect(performance.now() - startedAt).toBeLessThan(2_000);
  });

  it("rejects inconsistent local and central metadata, encryption flags and ZIP64 markers", async () => {
    const valid = await syntheticXlsx({ "xl/worksheets/sheet1.xml": "<worksheet/>" });
    const metadata = Buffer.from(valid);
    const metadataRecord = centralRecords(metadata).records.find((record) => record.name === "xl/workbook.xml")!;
    metadata.writeUInt32LE((metadata.readUInt32LE(metadataRecord.centralOffset + 16) ^ 0xffffffff) >>> 0, metadataRecord.centralOffset + 16);

    const encrypted = Buffer.from(valid);
    const encryptedRecord = centralRecords(encrypted).records.find((record) => record.name === "xl/workbook.xml")!;
    encrypted.writeUInt16LE(encrypted.readUInt16LE(encryptedRecord.centralOffset + 8) | 0x0001, encryptedRecord.centralOffset + 8);

    const zip64 = Buffer.from(valid);
    const zip64Eocd = findEocd(zip64);
    zip64.writeUInt16LE(0xffff, zip64Eocd + 8);
    zip64.writeUInt16LE(0xffff, zip64Eocd + 10);

    for (const [name, contents] of [
      ["metadata.xlsx", metadata],
      ["encrypted.xlsx", encrypted],
      ["zip64.xlsx", zip64],
    ] as const) {
      await expect(preflightXlsxWorkbook(await temporaryFile(name, contents))).rejects.toThrow("WORKBOOK_ARCHIVE_UNSAFE");
    }
  });

  it("enforces centralized entry, expanded-size and central-directory limits", async () => {
    const filePath = await temporaryFile("limits.xlsx", await syntheticXlsx({
      "xl/worksheets/sheet1.xml": "x".repeat(512),
      "xl/styles.xml": "y".repeat(512),
    }));
    const baseline: XlsxArchiveLimits = {
      maxFileBytes: 10 * 1024 * 1024,
      maxEntries: 1_000,
      maxCentralDirectoryBytes: 1024 * 1024,
      maxExpandedBytes: 10 * 1024 * 1024,
      maxEntryExpandedBytes: 10 * 1024 * 1024,
      maxCompressionRatio: 1_000,
      maxEntryNameBytes: 1_024,
    };
    const errors = { invalidPath: "PATH", invalidArchive: "UNSAFE", resourceLimit: "LIMIT" };

    await expect(preflightXlsxArchive(filePath, { ...baseline, maxEntries: 2 }, errors)).rejects.toThrow("LIMIT");
    await expect(preflightXlsxArchive(filePath, { ...baseline, maxExpandedBytes: 100 }, errors)).rejects.toThrow("LIMIT");
    await expect(preflightXlsxArchive(filePath, { ...baseline, maxEntryExpandedBytes: 100 }, errors)).rejects.toThrow("LIMIT");
    await expect(preflightXlsxArchive(filePath, { ...baseline, maxCentralDirectoryBytes: 10 }, errors)).rejects.toThrow("LIMIT");
  });

  it("rejects a reproducible seeded corpus of structural mutations", async () => {
    const source = await syntheticXlsx({ "xl/worksheets/sheet1.xml": "<worksheet/>" });
    const mutations: Array<(buffer: Buffer) => void> = [
      (buffer) => { const { records } = centralRecords(buffer); buffer.writeUInt32LE(0, records[0]!.centralOffset); },
      (buffer) => { const { records } = centralRecords(buffer); buffer.writeUInt16LE(0, records[0]!.centralOffset + 28); },
      (buffer) => { const { centralOffset, records } = centralRecords(buffer); buffer.writeUInt32LE(centralOffset, records[0]!.centralOffset + 42); },
      (buffer) => { const { records } = centralRecords(buffer); buffer.writeUInt16LE(99, records[0]!.centralOffset + 10); },
      (buffer) => { const { records } = centralRecords(buffer); buffer.writeUInt16LE(1, records[0]!.centralOffset + 34); },
      (buffer) => { const { records } = centralRecords(buffer); buffer.writeUInt32LE(0xffffffff, records[0]!.centralOffset + 20); },
      (buffer) => { const { eocd } = centralRecords(buffer); buffer.writeUInt16LE(1, eocd + 4); },
      (buffer) => { const { eocd } = centralRecords(buffer); buffer.writeUInt16LE(1, eocd + 6); },
      (buffer) => { const { eocd } = centralRecords(buffer); buffer.writeUInt16LE(buffer.readUInt16LE(eocd + 8) - 1, eocd + 8); },
      (buffer) => { const { eocd } = centralRecords(buffer); buffer.writeUInt32LE(buffer.readUInt32LE(eocd + 16) + 1, eocd + 16); },
      (buffer) => { const { eocd } = centralRecords(buffer); buffer.writeUInt32LE(buffer.readUInt32LE(eocd + 12) - 1, eocd + 12); },
      (buffer) => { const { records } = centralRecords(buffer); buffer.writeUInt32LE(0, records[0]!.localOffset); },
      (buffer) => { const { records } = centralRecords(buffer); buffer.writeUInt16LE(buffer.readUInt16LE(records[0]!.localOffset + 26) + 1, records[0]!.localOffset + 26); },
      (buffer) => { const { records } = centralRecords(buffer); buffer.writeUInt16LE(1, records[0]!.localOffset + 6); },
      (buffer) => { const { eocd } = centralRecords(buffer); buffer.writeUInt16LE(1, eocd + 20); },
    ];

    for (let seed = 0; seed < 45; seed += 1) {
      const mutated = Buffer.from(source);
      mutations[(seed * 17 + 11) % mutations.length]!(mutated);
      const filePath = await temporaryFile(`seed-${seed.toString().padStart(2, "0")}.xlsx`, mutated);
      await expect(preflightXlsxWorkbook(filePath), `seed ${seed}`).rejects.toThrow("WORKBOOK_ARCHIVE_UNSAFE");
    }
  });
});
