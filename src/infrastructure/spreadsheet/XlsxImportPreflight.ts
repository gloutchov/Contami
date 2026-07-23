import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_ENTRIES = 2_000;
const MAX_TOTAL_UNCOMPRESSED = 100 * 1024 * 1024;
const MAX_ENTRY_UNCOMPRESSED = 25 * 1024 * 1024;
const MAX_COMPRESSION_RATIO = 100;

const ACTIVE_PATHS = [
  /^xl\/vbaProject\.bin$/i,
  /^xl\/macrosheets\//i,
  /^xl\/dialogsheet\//i,
  /^xl\/activeX\//i,
  /^xl\/embeddings\//i,
  /^xl\/externalLinks\//i,
];

function invalid(): never {
  throw new Error("IMPORT_FILE_UNSAFE");
}

function endOfCentralDirectory(buffer: Buffer): number {
  const minimum = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) return offset;
  }
  return invalid();
}

function safeEntryName(value: string): boolean {
  if (!value || value.includes("\0") || value.includes("\\") || value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  const segments = value.split("/");
  return !segments.some((segment) => segment === ".." || segment === ".");
}

export async function preflightXlsxImport(filePath: string): Promise<void> {
  if (!path.isAbsolute(filePath) || filePath.length > 4_096 || filePath.includes("\0") || path.extname(filePath).toLowerCase() !== ".xlsx") {
    throw new Error("INVALID_WORKBOOK_PATH");
  }
  const fileStat = await stat(filePath);
  if (!fileStat.isFile() || fileStat.size <= 0 || fileStat.size > MAX_FILE_BYTES) throw new Error("IMPORT_FILE_TOO_LARGE");
  const buffer = await readFile(filePath);
  const eocd = endOfCentralDirectory(buffer);
  const disk = buffer.readUInt16LE(eocd + 4);
  const centralDisk = buffer.readUInt16LE(eocd + 6);
  const entries = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (disk !== 0 || centralDisk !== 0 || entries === 0xffff || centralOffset === 0xffffffff || centralSize === 0xffffffff || entries > MAX_ENTRIES) invalid();
  if (centralOffset + centralSize > eocd || centralOffset < 0) invalid();

  let offset = centralOffset;
  let totalUncompressed = 0;
  const names = new Set<string>();
  for (let index = 0; index < entries; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== CENTRAL_SIGNATURE) invalid();
    const flags = buffer.readUInt16LE(offset + 8);
    const compressed = buffer.readUInt32LE(offset + 20);
    const uncompressed = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const end = offset + 46 + nameLength + extraLength + commentLength;
    if (end > buffer.length || (flags & 0x1) !== 0 || compressed === 0xffffffff || uncompressed === 0xffffffff) invalid();
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString((flags & 0x800) !== 0 ? "utf8" : "latin1");
    const normalized = name.toLocaleLowerCase();
    if (!safeEntryName(name) || names.has(normalized) || ACTIVE_PATHS.some((pattern) => pattern.test(name))) invalid();
    names.add(normalized);
    totalUncompressed += uncompressed;
    const ratio = compressed === 0 ? (uncompressed === 0 ? 1 : Number.POSITIVE_INFINITY) : uncompressed / compressed;
    if (uncompressed > MAX_ENTRY_UNCOMPRESSED || totalUncompressed > MAX_TOTAL_UNCOMPRESSED || ratio > MAX_COMPRESSION_RATIO) {
      throw new Error("IMPORT_FILE_TOO_LARGE");
    }
    offset = end;
  }
  if (offset !== centralOffset + centralSize) invalid();
  for (const required of ["[content_types].xml", "xl/workbook.xml", "xl/_rels/workbook.xml.rels"]) {
    if (!names.has(required)) invalid();
  }
}
