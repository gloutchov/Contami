import path from "node:path";
import { APP_CONFIG } from "../../config/appConfig";
import {
  XLSX_BLOCKED_ENTRY_PATTERNS,
  XLSX_REQUIRED_ENTRIES,
  preflightXlsxZip,
  type XlsxZipPreflightResult,
} from "./XlsxZipPreflight";

export async function preflightXlsxWorkbook(filePath: string): Promise<XlsxZipPreflightResult> {
  if (!path.isAbsolute(filePath)
    || filePath.length > 4_096
    || filePath.includes("\0")
    || path.extname(filePath).toLowerCase() !== ".xlsx") throw new Error("INVALID_WORKBOOK_PATH");
  return preflightXlsxZip(filePath, {
    limits: { maxFileBytes: APP_CONFIG.workbook.maxBytes, ...APP_CONFIG.workbook.zip },
    unsafeErrorCode: "WORKBOOK_UNSAFE",
    resourceErrorCode: "WORKBOOK_RESOURCE_LIMIT",
    requiredEntries: XLSX_REQUIRED_ENTRIES,
    blockedEntryPatterns: XLSX_BLOCKED_ENTRY_PATTERNS,
  });
}
