import { open, stat, type FileHandle } from "node:fs/promises";
import path from "node:path";
import { APP_CONFIG } from "../../config/appConfig";

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const DATA_DESCRIPTOR_SIGNATURE = 0x08074b50;
const EOCD_MIN_BYTES = 22;
const EOCD_MAX_SEARCH_BYTES = EOCD_MIN_BYTES + 65_535;
const CENTRAL_HEADER_BYTES = 46;
const LOCAL_HEADER_BYTES = 30;
const ALLOWED_GENERAL_FLAGS = 0x080e; // deflate options, data descriptor, UTF-8 names

const REQUIRED_XLSX_ENTRIES = [
  "[content_types].xml",
  "_rels/.rels",
  "xl/workbook.xml",
  "xl/_rels/workbook.xml.rels",
] as const;

const BLOCKED_XLSX_PATHS = [
  /^xl\/vbaProject\.bin$/i,
  /^xl\/macrosheets\//i,
  /^xl\/dialogsheet\//i,
  /^xl\/activeX\//i,
  /^xl\/embeddings\//i,
  /^xl\/externalLinks\//i,
  /\.(?:zip|xlsx|xlsm|xlsb|xlam|ods|numbers)$/i,
] as const;

export interface XlsxArchiveLimits {
  maxFileBytes: number;
  maxEntries: number;
  maxCentralDirectoryBytes: number;
  maxExpandedBytes: number;
  maxEntryExpandedBytes: number;
  maxCompressionRatio: number;
  maxEntryNameBytes: number;
}

interface XlsxArchiveErrors {
  invalidPath: string;
  invalidArchive: string;
  resourceLimit: string;
}

interface XlsxArchiveEntry {
  name: string;
  nameBytes: Buffer;
  flags: number;
  method: number;
  crc32: number;
  compressedBytes: number;
  expandedBytes: number;
  localOffset: number;
}

export interface XlsxArchiveSummary {
  fileBytes: number;
  entries: number;
  expandedBytes: number;
  maximumCompressionRatio: number;
}

const WORKBOOK_LIMITS: XlsxArchiveLimits = {
  maxFileBytes: APP_CONFIG.workbook.maxBytes,
  maxEntries: APP_CONFIG.workbook.maxArchiveEntries,
  maxCentralDirectoryBytes: APP_CONFIG.workbook.maxCentralDirectoryBytes,
  maxExpandedBytes: APP_CONFIG.workbook.maxExpandedBytes,
  maxEntryExpandedBytes: APP_CONFIG.workbook.maxEntryExpandedBytes,
  maxCompressionRatio: APP_CONFIG.workbook.maxCompressionRatio,
  maxEntryNameBytes: APP_CONFIG.workbook.maxEntryNameBytes,
};

export const IMPORT_ARCHIVE_LIMITS: XlsxArchiveLimits = {
  maxFileBytes: APP_CONFIG.importTemplates.maxBytes,
  maxEntries: APP_CONFIG.importTemplates.maxArchiveEntries,
  maxCentralDirectoryBytes: APP_CONFIG.importTemplates.maxCentralDirectoryBytes,
  maxExpandedBytes: APP_CONFIG.importTemplates.maxExpandedBytes,
  maxEntryExpandedBytes: APP_CONFIG.importTemplates.maxEntryExpandedBytes,
  maxCompressionRatio: APP_CONFIG.importTemplates.maxCompressionRatio,
  maxEntryNameBytes: APP_CONFIG.importTemplates.maxEntryNameBytes,
};

const WORKBOOK_ERRORS: XlsxArchiveErrors = {
  invalidPath: "INVALID_WORKBOOK_PATH",
  invalidArchive: "WORKBOOK_ARCHIVE_UNSAFE",
  resourceLimit: "WORKBOOK_RESOURCE_LIMIT",
};

export const IMPORT_ARCHIVE_ERRORS: XlsxArchiveErrors = {
  invalidPath: "INVALID_WORKBOOK_PATH",
  invalidArchive: "IMPORT_FILE_UNSAFE",
  resourceLimit: "IMPORT_FILE_TOO_LARGE",
};

function fail(code: string): never {
  throw new Error(code);
}

function assertXlsxPath(filePath: string, errors: XlsxArchiveErrors): void {
  if (!path.isAbsolute(filePath)
    || filePath.length > 4_096
    || filePath.includes("\0")
    || path.extname(filePath).toLowerCase() !== ".xlsx") {
    fail(errors.invalidPath);
  }
}

async function readExactly(handle: FileHandle, length: number, position: number, errors: XlsxArchiveErrors): Promise<Buffer> {
  const buffer = Buffer.allocUnsafe(length);
  let consumed = 0;
  while (consumed < length) {
    const result = await handle.read(buffer, consumed, length - consumed, position + consumed);
    if (result.bytesRead === 0) fail(errors.invalidArchive);
    consumed += result.bytesRead;
  }
  return buffer;
}

function endOfCentralDirectory(tail: Buffer, errors: XlsxArchiveErrors): number {
  for (let offset = tail.length - EOCD_MIN_BYTES; offset >= 0; offset -= 1) {
    if (tail.readUInt32LE(offset) === EOCD_SIGNATURE
      && offset + EOCD_MIN_BYTES + tail.readUInt16LE(offset + 20) === tail.length) return offset;
  }
  return fail(errors.invalidArchive);
}

function decodeEntryName(value: Buffer, utf8: boolean, errors: XlsxArchiveErrors): string {
  if (!utf8) return value.toString("latin1");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(value);
  } catch {
    return fail(errors.invalidArchive);
  }
}

function safeEntryName(value: string): boolean {
  if (!value || value.includes("\0") || value.includes("\\") || value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  const segments = value.split("/");
  return segments.every((segment, index) => {
    if (segment === ".." || segment === ".") return false;
    return segment.length > 0 || index === segments.length - 1;
  });
}

function compressionRatio(compressed: number, expanded: number): number {
  if (compressed === 0) return expanded === 0 ? 1 : Number.POSITIVE_INFINITY;
  return expanded / compressed;
}

function parseCentralDirectory(
  central: Buffer,
  expectedEntries: number,
  limits: XlsxArchiveLimits,
  errors: XlsxArchiveErrors,
): { entries: XlsxArchiveEntry[]; expandedBytes: number; maximumCompressionRatio: number } {
  const entries: XlsxArchiveEntry[] = [];
  const names = new Set<string>();
  let offset = 0;
  let expandedBytes = 0;
  let maximumCompressionRatio = 1;

  for (let index = 0; index < expectedEntries; index += 1) {
    if (offset + CENTRAL_HEADER_BYTES > central.length || central.readUInt32LE(offset) !== CENTRAL_SIGNATURE) fail(errors.invalidArchive);
    const flags = central.readUInt16LE(offset + 8);
    const method = central.readUInt16LE(offset + 10);
    const crc32 = central.readUInt32LE(offset + 16);
    const compressedBytes = central.readUInt32LE(offset + 20);
    const entryExpandedBytes = central.readUInt32LE(offset + 24);
    const nameLength = central.readUInt16LE(offset + 28);
    const extraLength = central.readUInt16LE(offset + 30);
    const commentLength = central.readUInt16LE(offset + 32);
    const startingDisk = central.readUInt16LE(offset + 34);
    const localOffset = central.readUInt32LE(offset + 42);
    const end = offset + CENTRAL_HEADER_BYTES + nameLength + extraLength + commentLength;

    if (end > central.length
      || nameLength === 0
      || nameLength > limits.maxEntryNameBytes
      || startingDisk !== 0
      || compressedBytes === 0xffffffff
      || entryExpandedBytes === 0xffffffff
      || localOffset === 0xffffffff
      || (flags & ~ALLOWED_GENERAL_FLAGS) !== 0
      || (method !== 0 && method !== 8)) fail(errors.invalidArchive);

    const nameBytes = central.subarray(offset + CENTRAL_HEADER_BYTES, offset + CENTRAL_HEADER_BYTES + nameLength);
    const name = decodeEntryName(nameBytes, (flags & 0x0800) !== 0, errors);
    const normalized = name.toLowerCase();
    if (!safeEntryName(name) || names.has(normalized) || BLOCKED_XLSX_PATHS.some((pattern) => pattern.test(name))) fail(errors.invalidArchive);
    if (name.endsWith("/") && (compressedBytes !== 0 || entryExpandedBytes !== 0)) fail(errors.invalidArchive);
    if (method === 0 && compressedBytes !== entryExpandedBytes) fail(errors.invalidArchive);
    names.add(normalized);

    expandedBytes += entryExpandedBytes;
    const ratio = compressionRatio(compressedBytes, entryExpandedBytes);
    maximumCompressionRatio = Math.max(maximumCompressionRatio, ratio);
    if (entryExpandedBytes > limits.maxEntryExpandedBytes
      || expandedBytes > limits.maxExpandedBytes
      || ratio > limits.maxCompressionRatio) fail(errors.resourceLimit);

    entries.push({ name, nameBytes: Buffer.from(nameBytes), flags, method, crc32, compressedBytes, expandedBytes: entryExpandedBytes, localOffset });
    offset = end;
  }

  if (offset !== central.length) fail(errors.invalidArchive);
  for (const required of REQUIRED_XLSX_ENTRIES) if (!names.has(required)) fail(errors.invalidArchive);
  return { entries, expandedBytes, maximumCompressionRatio };
}

async function validateLocalEntries(
  handle: FileHandle,
  entries: readonly XlsxArchiveEntry[],
  centralOffset: number,
  errors: XlsxArchiveErrors,
): Promise<void> {
  const ranges: Array<{ start: number; end: number }> = [];
  for (const entry of entries) {
    if (entry.localOffset + LOCAL_HEADER_BYTES > centralOffset) fail(errors.invalidArchive);
    const local = await readExactly(handle, LOCAL_HEADER_BYTES, entry.localOffset, errors);
    if (local.readUInt32LE(0) !== LOCAL_SIGNATURE) fail(errors.invalidArchive);
    const flags = local.readUInt16LE(6);
    const method = local.readUInt16LE(8);
    const crc32 = local.readUInt32LE(14);
    const compressedBytes = local.readUInt32LE(18);
    const expandedBytes = local.readUInt32LE(22);
    const nameLength = local.readUInt16LE(26);
    const extraLength = local.readUInt16LE(28);
    const dataOffset = entry.localOffset + LOCAL_HEADER_BYTES + nameLength + extraLength;
    const dataEnd = dataOffset + entry.compressedBytes;
    if (flags !== entry.flags || method !== entry.method || nameLength !== entry.nameBytes.length || dataEnd > centralOffset) fail(errors.invalidArchive);
    if ((flags & 0x0008) === 0
      && (crc32 !== entry.crc32 || compressedBytes !== entry.compressedBytes || expandedBytes !== entry.expandedBytes)) fail(errors.invalidArchive);
    if ((flags & 0x0008) !== 0
      && ((crc32 !== 0 && crc32 !== entry.crc32)
        || (compressedBytes !== 0 && compressedBytes !== entry.compressedBytes)
        || (expandedBytes !== 0 && expandedBytes !== entry.expandedBytes))) fail(errors.invalidArchive);
    const localName = await readExactly(handle, nameLength, entry.localOffset + LOCAL_HEADER_BYTES, errors);
    if (!localName.equals(entry.nameBytes)) fail(errors.invalidArchive);
    let rangeEnd = dataEnd;
    if ((flags & 0x0008) !== 0) {
      if (dataEnd + 12 > centralOffset) fail(errors.invalidArchive);
      const descriptorBytes = Math.min(16, centralOffset - dataEnd);
      const descriptor = await readExactly(handle, descriptorBytes, dataEnd, errors);
      const hasSignature = descriptorBytes >= 16
        && descriptor.readUInt32LE(0) === DATA_DESCRIPTOR_SIGNATURE
        && descriptor.readUInt32LE(4) === entry.crc32
        && descriptor.readUInt32LE(8) === entry.compressedBytes
        && descriptor.readUInt32LE(12) === entry.expandedBytes;
      if (hasSignature) rangeEnd += 16;
      else {
        if (descriptor.readUInt32LE(0) !== entry.crc32
          || descriptor.readUInt32LE(4) !== entry.compressedBytes
          || descriptor.readUInt32LE(8) !== entry.expandedBytes) fail(errors.invalidArchive);
        rangeEnd += 12;
      }
    }
    ranges.push({ start: entry.localOffset, end: rangeEnd });
  }

  ranges.sort((left, right) => left.start - right.start);
  if (ranges[0]?.start !== 0) fail(errors.invalidArchive);
  for (let index = 1; index < ranges.length; index += 1) {
    if (ranges[index]!.start < ranges[index - 1]!.end) fail(errors.invalidArchive);
  }
}

export async function preflightXlsxArchive(
  filePath: string,
  limits: XlsxArchiveLimits,
  errors: XlsxArchiveErrors,
): Promise<XlsxArchiveSummary> {
  assertXlsxPath(filePath, errors);
  const fileStat = await stat(filePath);
  if (!fileStat.isFile() || fileStat.size <= 0) fail(errors.invalidArchive);
  if (fileStat.size > limits.maxFileBytes) fail(errors.resourceLimit);

  const handle = await open(filePath, "r");
  try {
    const tailLength = Math.min(fileStat.size, EOCD_MAX_SEARCH_BYTES);
    const tailOffset = fileStat.size - tailLength;
    const tail = await readExactly(handle, tailLength, tailOffset, errors);
    const relativeEocd = endOfCentralDirectory(tail, errors);
    const eocdOffset = tailOffset + relativeEocd;
    const eocd = tail.subarray(relativeEocd);
    const commentLength = eocd.readUInt16LE(20);
    const disk = eocd.readUInt16LE(4);
    const centralDisk = eocd.readUInt16LE(6);
    const diskEntries = eocd.readUInt16LE(8);
    const entries = eocd.readUInt16LE(10);
    const centralSize = eocd.readUInt32LE(12);
    const centralOffset = eocd.readUInt32LE(16);
    if (eocdOffset + EOCD_MIN_BYTES + commentLength !== fileStat.size
      || disk !== 0
      || centralDisk !== 0
      || entries === 0
      || diskEntries !== entries
      || entries === 0xffff
      || centralOffset === 0xffffffff
      || centralSize === 0xffffffff
      || centralOffset + centralSize !== eocdOffset) fail(errors.invalidArchive);
    if (entries > limits.maxEntries || centralSize > limits.maxCentralDirectoryBytes) fail(errors.resourceLimit);

    const central = await readExactly(handle, centralSize, centralOffset, errors);
    const parsed = parseCentralDirectory(central, entries, limits, errors);
    await validateLocalEntries(handle, parsed.entries, centralOffset, errors);
    return {
      fileBytes: fileStat.size,
      entries,
      expandedBytes: parsed.expandedBytes,
      maximumCompressionRatio: parsed.maximumCompressionRatio,
    };
  } finally {
    await handle.close();
  }
}

export function preflightXlsxWorkbook(filePath: string): Promise<XlsxArchiveSummary> {
  return preflightXlsxArchive(filePath, WORKBOOK_LIMITS, WORKBOOK_ERRORS);
}
