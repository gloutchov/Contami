import { open, type FileHandle } from "node:fs/promises";

const LOCAL_SIGNATURE = 0x04034b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const EOCD_SIGNATURE = 0x06054b50;
const DATA_DESCRIPTOR_SIGNATURE = 0x08074b50;
const EOCD_BYTES = 22;
const MAX_EOCD_SEARCH_BYTES = 65_557;
const ALLOWED_GENERAL_FLAGS = 0x080e; // deflate options, data descriptor, UTF-8 names

export interface XlsxZipLimits {
  maxFileBytes: number;
  maxEntries: number;
  maxCentralDirectoryBytes: number;
  maxEntryNameBytes: number;
  maxExtraFieldBytes: number;
  maxCommentBytes: number;
  maxTotalUncompressedBytes: number;
  maxEntryUncompressedBytes: number;
  maxCompressionRatio: number;
}

export interface XlsxZipPolicy {
  limits: XlsxZipLimits;
  unsafeErrorCode: string;
  resourceErrorCode: string;
  requiredEntries?: readonly string[];
  blockedEntryPatterns?: readonly RegExp[];
}

export interface XlsxZipPreflightResult {
  entries: number;
  compressedBytes: number;
  uncompressedBytes: number;
  inspectedBytes: number;
}

interface CentralEntry {
  name: string;
  nameBytes: Buffer;
  flags: number;
  method: number;
  crc32: number;
  compressedBytes: number;
  uncompressedBytes: number;
  localOffset: number;
}

export const XLSX_REQUIRED_ENTRIES = Object.freeze([
  "[content_types].xml",
  "_rels/.rels",
  "xl/workbook.xml",
  "xl/_rels/workbook.xml.rels",
]);

export const XLSX_BLOCKED_ENTRY_PATTERNS = Object.freeze([
  /^xl\/vbaProject\.bin$/i,
  /^xl\/macrosheets\//i,
  /^xl\/dialogsheets?\//i,
  /^xl\/activeX\//i,
  /^xl\/embeddings\//i,
  /^xl\/externalLinks\//i,
  /\.(?:zip|xlsx|xlsm|xlsb|xlam|ods|numbers)$/i,
]);

function fail(code: string): never {
  throw new Error(code);
}

function normalizeEntryName(value: string): string {
  return value.normalize("NFC").toLowerCase();
}

function safeEntryName(value: string): boolean {
  if (!value
    || value.includes("\\")
    || value.startsWith("/")
    || /^[A-Za-z]:/.test(value)) return false;
  for (const character of value) {
    const codePoint = character.codePointAt(0)!;
    if (codePoint <= 0x1f || codePoint === 0x7f) return false;
  }
  const directory = value.endsWith("/");
  const segments = value.split("/");
  if (directory) segments.pop();
  return segments.length > 0 && !segments.some((segment) => !segment || segment === "." || segment === "..");
}

function decodeEntryName(bytes: Buffer, utf8: boolean, unsafeErrorCode: string): string {
  if (!utf8) return bytes.toString("latin1");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return fail(unsafeErrorCode);
  }
}

async function readExactly(handle: FileHandle, length: number, position: number, unsafeErrorCode: string): Promise<Buffer> {
  const buffer = Buffer.allocUnsafe(length);
  let offset = 0;
  while (offset < length) {
    const { bytesRead } = await handle.read(buffer, offset, length - offset, position + offset);
    if (bytesRead === 0) return fail(unsafeErrorCode);
    offset += bytesRead;
  }
  return buffer;
}

function findEocd(tail: Buffer, tailOffset: number, fileSize: number, unsafeErrorCode: string): number {
  for (let offset = tail.length - EOCD_BYTES; offset >= 0; offset -= 1) {
    if (tail.readUInt32LE(offset) !== EOCD_SIGNATURE) continue;
    const commentLength = tail.readUInt16LE(offset + 20);
    const absoluteOffset = tailOffset + offset;
    if (absoluteOffset + EOCD_BYTES + commentLength === fileSize) return offset;
  }
  return fail(unsafeErrorCode);
}

export async function preflightXlsxZip(filePath: string, policy: XlsxZipPolicy): Promise<XlsxZipPreflightResult> {
  const { limits, unsafeErrorCode, resourceErrorCode } = policy;
  const handle = await open(filePath, "r");
  let inspectedBytes = 0;
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size < EOCD_BYTES) fail(unsafeErrorCode);
    if (info.size > limits.maxFileBytes) fail(resourceErrorCode);

    const tailLength = Math.min(info.size, MAX_EOCD_SEARCH_BYTES);
    const tailOffset = info.size - tailLength;
    const tail = await readExactly(handle, tailLength, tailOffset, unsafeErrorCode);
    inspectedBytes += tailLength;
    const eocdInTail = findEocd(tail, tailOffset, info.size, unsafeErrorCode);
    const eocdOffset = tailOffset + eocdInTail;
    const disk = tail.readUInt16LE(eocdInTail + 4);
    const centralDisk = tail.readUInt16LE(eocdInTail + 6);
    const diskEntries = tail.readUInt16LE(eocdInTail + 8);
    const entries = tail.readUInt16LE(eocdInTail + 10);
    const centralSize = tail.readUInt32LE(eocdInTail + 12);
    const centralOffset = tail.readUInt32LE(eocdInTail + 16);
    const commentLength = tail.readUInt16LE(eocdInTail + 20);
    if (disk !== 0 || centralDisk !== 0 || diskEntries !== entries || entries === 0) fail(unsafeErrorCode);
    if (entries === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) fail(unsafeErrorCode);
    if (entries > limits.maxEntries || centralSize > limits.maxCentralDirectoryBytes || commentLength > limits.maxCommentBytes) {
      fail(resourceErrorCode);
    }
    if (centralOffset + centralSize !== eocdOffset) fail(unsafeErrorCode);

    const central = await readExactly(handle, centralSize, centralOffset, unsafeErrorCode);
    inspectedBytes += centralSize;
    const names = new Set<string>();
    const localOffsets = new Set<number>();
    const parsed: CentralEntry[] = [];
    let cursor = 0;
    let totalUncompressedBytes = 0;
    let totalCompressedBytes = 0;
    for (let index = 0; index < entries; index += 1) {
      if (cursor + 46 > central.length || central.readUInt32LE(cursor) !== CENTRAL_SIGNATURE) fail(unsafeErrorCode);
      const flags = central.readUInt16LE(cursor + 8);
      const method = central.readUInt16LE(cursor + 10);
      const crc32 = central.readUInt32LE(cursor + 16);
      const compressedBytes = central.readUInt32LE(cursor + 20);
      const uncompressedBytes = central.readUInt32LE(cursor + 24);
      const nameLength = central.readUInt16LE(cursor + 28);
      const extraLength = central.readUInt16LE(cursor + 30);
      const entryCommentLength = central.readUInt16LE(cursor + 32);
      const diskStart = central.readUInt16LE(cursor + 34);
      const localOffset = central.readUInt32LE(cursor + 42);
      const end = cursor + 46 + nameLength + extraLength + entryCommentLength;
      if (end > central.length
        || nameLength === 0
        || nameLength > limits.maxEntryNameBytes
        || extraLength > limits.maxExtraFieldBytes
        || entryCommentLength > limits.maxCommentBytes
        || diskStart !== 0
        || (flags & ~ALLOWED_GENERAL_FLAGS) !== 0
        || (method !== 0 && method !== 8)
        || compressedBytes === 0xffffffff
        || uncompressedBytes === 0xffffffff
        || localOffset === 0xffffffff
        || localOffset >= centralOffset
        || localOffsets.has(localOffset)) fail(unsafeErrorCode);
      const nameBytes = central.subarray(cursor + 46, cursor + 46 + nameLength);
      const name = decodeEntryName(nameBytes, (flags & 0x800) !== 0, unsafeErrorCode);
      const normalizedName = normalizeEntryName(name);
      if (!safeEntryName(name)
        || names.has(normalizedName)
        || policy.blockedEntryPatterns?.some((pattern) => pattern.test(name))) fail(unsafeErrorCode);
      if (name.endsWith("/") && (compressedBytes !== 0 || uncompressedBytes !== 0)) fail(unsafeErrorCode);
      if (method === 0 && compressedBytes !== uncompressedBytes) fail(unsafeErrorCode);
      names.add(normalizedName);
      localOffsets.add(localOffset);
      totalUncompressedBytes += uncompressedBytes;
      totalCompressedBytes += compressedBytes;
      const ratio = compressedBytes === 0
        ? (uncompressedBytes === 0 ? 1 : Number.POSITIVE_INFINITY)
        : uncompressedBytes / compressedBytes;
      if (uncompressedBytes > limits.maxEntryUncompressedBytes
        || totalUncompressedBytes > limits.maxTotalUncompressedBytes
        || ratio > limits.maxCompressionRatio) fail(resourceErrorCode);
      parsed.push({ name, nameBytes: Buffer.from(nameBytes), flags, method, crc32, compressedBytes, uncompressedBytes, localOffset });
      cursor = end;
    }
    if (cursor !== central.length) fail(unsafeErrorCode);
    for (const required of policy.requiredEntries ?? []) {
      if (!names.has(normalizeEntryName(required))) fail(unsafeErrorCode);
    }

    const ranges: Array<{ start: number; end: number }> = [];
    for (const entry of parsed) {
      const local = await readExactly(handle, 30 + entry.nameBytes.length, entry.localOffset, unsafeErrorCode);
      inspectedBytes += local.length;
      if (local.readUInt32LE(0) !== LOCAL_SIGNATURE) fail(unsafeErrorCode);
      const localFlags = local.readUInt16LE(6);
      const localMethod = local.readUInt16LE(8);
      const localCrc32 = local.readUInt32LE(14);
      const localCompressedBytes = local.readUInt32LE(18);
      const localUncompressedBytes = local.readUInt32LE(22);
      const localNameLength = local.readUInt16LE(26);
      const localExtraLength = local.readUInt16LE(28);
      const usesDescriptor = (entry.flags & 0x8) !== 0;
      if (localFlags !== entry.flags
        || localMethod !== entry.method
        || localNameLength !== entry.nameBytes.length
        || localExtraLength > limits.maxExtraFieldBytes
        || !local.subarray(30).equals(entry.nameBytes)
        || (!usesDescriptor && (localCrc32 !== entry.crc32
          || localCompressedBytes !== entry.compressedBytes
          || localUncompressedBytes !== entry.uncompressedBytes))
        || (usesDescriptor && ((localCrc32 !== 0 && localCrc32 !== entry.crc32)
          || (localCompressedBytes !== 0 && localCompressedBytes !== entry.compressedBytes)
          || (localUncompressedBytes !== 0 && localUncompressedBytes !== entry.uncompressedBytes)))) fail(unsafeErrorCode);
      const dataStart = entry.localOffset + 30 + localNameLength + localExtraLength;
      const dataEnd = dataStart + entry.compressedBytes;
      if (dataEnd > centralOffset) fail(unsafeErrorCode);
      let rangeEnd = dataEnd;
      if (usesDescriptor) {
        if (dataEnd + 12 > centralOffset) fail(unsafeErrorCode);
        const descriptorLength = Math.min(16, centralOffset - dataEnd);
        const descriptor = await readExactly(handle, descriptorLength, dataEnd, unsafeErrorCode);
        inspectedBytes += descriptor.length;
        const hasSignature = descriptorLength >= 16
          && descriptor.readUInt32LE(0) === DATA_DESCRIPTOR_SIGNATURE
          && descriptor.readUInt32LE(4) === entry.crc32
          && descriptor.readUInt32LE(8) === entry.compressedBytes
          && descriptor.readUInt32LE(12) === entry.uncompressedBytes;
        if (hasSignature) rangeEnd += 16;
        else {
          if (descriptor.readUInt32LE(0) !== entry.crc32
            || descriptor.readUInt32LE(4) !== entry.compressedBytes
            || descriptor.readUInt32LE(8) !== entry.uncompressedBytes) fail(unsafeErrorCode);
          rangeEnd += 12;
        }
      }
      ranges.push({ start: entry.localOffset, end: rangeEnd });
    }
    ranges.sort((left, right) => left.start - right.start);
    if (ranges[0]?.start !== 0) fail(unsafeErrorCode);
    for (let index = 1; index < ranges.length; index += 1) {
      if (ranges[index]!.start < ranges[index - 1]!.end) fail(unsafeErrorCode);
    }
    return {
      entries,
      compressedBytes: totalCompressedBytes,
      uncompressedBytes: totalUncompressedBytes,
      inspectedBytes,
    };
  } finally {
    await handle.close();
  }
}
