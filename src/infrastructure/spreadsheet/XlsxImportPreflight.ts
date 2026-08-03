import path from "node:path";
import { APP_CONFIG } from "../../config/appConfig";
import { XLSX_BLOCKED_ENTRY_PATTERNS, XLSX_REQUIRED_ENTRIES, preflightXlsxZip } from "./XlsxZipPreflight";

export async function preflightXlsxImport(filePath: string): Promise<void> {
  if (!path.isAbsolute(filePath) || filePath.length > 4_096 || filePath.includes("\0") || path.extname(filePath).toLowerCase() !== ".xlsx") {
    throw new Error("INVALID_WORKBOOK_PATH");
  }
  await preflightXlsxZip(filePath, {
    limits: APP_CONFIG.importTemplates.zip,
    unsafeErrorCode: "IMPORT_FILE_UNSAFE",
    resourceErrorCode: "IMPORT_FILE_TOO_LARGE",
    requiredEntries: XLSX_REQUIRED_ENTRIES,
    blockedEntryPatterns: XLSX_BLOCKED_ENTRY_PATTERNS,
  });
}
