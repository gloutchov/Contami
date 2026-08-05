const MIB = 1024 * 1024;

export const APP_CONFIG = Object.freeze({
  window: { width: 1_440, height: 900, minWidth: 1_080, minHeight: 700 },
  workbook: {
    maxBytes: 250 * MIB,
    backupLimit: 10,
    lockLeaseMs: 5 * 60 * 1_000,
    lockMaxBytes: 4 * 1_024,
    zip: Object.freeze({
      maxEntries: 4_096,
      maxCentralDirectoryBytes: 4 * MIB,
      maxEntryNameBytes: 1_024,
      maxExtraFieldBytes: 16 * 1_024,
      maxCommentBytes: 4 * 1_024,
      maxTotalUncompressedBytes: 256 * MIB,
      maxEntryUncompressedBytes: 128 * MIB,
      maxCompressionRatio: 200,
    }),
  },
  importTemplates: {
    maxRows: 5_000,
    zip: Object.freeze({
      maxFileBytes: 20 * MIB,
      maxEntries: 2_000,
      maxCentralDirectoryBytes: 2 * MIB,
      maxEntryNameBytes: 1_024,
      maxExtraFieldBytes: 16 * 1_024,
      maxCommentBytes: 4 * 1_024,
      maxTotalUncompressedBytes: 100 * MIB,
      maxEntryUncompressedBytes: 25 * MIB,
      maxCompressionRatio: 100,
    }),
  },
  numbersMirror: { timeoutMs: 60_000, maxBufferBytes: 64 * 1024 },
  ui: { noticeDurationMs: 6_000 },
});
