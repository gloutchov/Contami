export const APP_CONFIG = Object.freeze({
  window: { width: 1_440, height: 900, minWidth: 1_080, minHeight: 700 },
  workbook: { maxBytes: 250 * 1024 * 1024, backupLimit: 10 },
  numbersMirror: { timeoutMs: 60_000, maxBufferBytes: 64 * 1024 },
  ui: { noticeDurationMs: 6_000 },
});
