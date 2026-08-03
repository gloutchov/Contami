import { IMPORT_ARCHIVE_ERRORS, IMPORT_ARCHIVE_LIMITS, preflightXlsxArchive } from "./XlsxArchivePreflight";

export async function preflightXlsxImport(filePath: string): Promise<void> {
  await preflightXlsxArchive(filePath, IMPORT_ARCHIVE_LIMITS, IMPORT_ARCHIVE_ERRORS);
}
