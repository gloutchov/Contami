import { deflateRawSync } from "node:zlib";

export interface SyntheticZipEntry {
  name: string;
  data?: Buffer;
  compression?: "store" | "deflate";
  declaredCompressedBytes?: number;
  declaredUncompressedBytes?: number;
}

export const REQUIRED_XLSX_ENTRIES: SyntheticZipEntry[] = [
  { name: "[Content_Types].xml", data: Buffer.from("<Types/>") },
  { name: "xl/workbook.xml", data: Buffer.from("<workbook/>") },
  { name: "xl/_rels/workbook.xml.rels", data: Buffer.from("<Relationships/>") },
];

export function buildSyntheticZip(entries: readonly SyntheticZipEntry[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const data = entry.data ?? Buffer.alloc(0);
    const method = entry.compression === "deflate" ? 8 : 0;
    const payload = method === 8 ? deflateRawSync(data) : data;
    const compressedBytes = entry.declaredCompressedBytes ?? payload.length;
    const uncompressedBytes = entry.declaredUncompressedBytes ?? data.length;
    if (compressedBytes !== payload.length) throw new Error("Synthetic ZIP compressed size must match payload size");

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(0, 14);
    local.writeUInt32LE(compressedBytes, 18);
    local.writeUInt32LE(uncompressedBytes, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, payload);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(0, 16);
    central.writeUInt32LE(compressedBytes, 20);
    central.writeUInt32LE(uncompressedBytes, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(localOffset, 42);
    centralParts.push(central, name);
    localOffset += local.length + name.length + payload.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirectory.length, 12);
  eocd.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localParts, centralDirectory, eocd]);
}
