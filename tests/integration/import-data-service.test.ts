import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import type { PreparedImport } from "../../src/domain/imports";
import type { ImportTemplateParser } from "../../src/infrastructure/spreadsheet/ExcelImportTemplateParser";
import { ImportDataService } from "../../src/main/services/ImportDataService";

const electronMocks = vi.hoisted(() => ({ showOpenDialog: vi.fn() }));
vi.mock("electron", () => ({ dialog: { showOpenDialog: electronMocks.showOpenDialog } }));

function prepared(): PreparedImport {
  const data = createEmptyFinanceData(2026);
  const category = data.categories.find((item) => item.kind === "income")!;
  const payment = data.paymentMethods[0]!;
  return {
    fileName: "synthetic-private-path.xlsx",
    templateType: "transactions",
    commands: [{
      type: "addTransaction",
      value: {
        id: crypto.randomUUID(), date: "2026-01-01", description: "Synthetic", categoryId: category.id,
        paymentMethodId: payment.id, kind: "income", amount: 10, currency: "EUR", planned: false,
        shared: false, notes: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    }],
    preview: {
      fileName: "synthetic-private-path.xlsx", templateType: "transactions", totalRows: 1, validRows: 1,
      rejectedRows: 0, conflictRows: 0, amountTotal: 10, actions: { create: 1, update: 0, skip: 0 },
      errors: [], errorsTruncated: false,
    },
  };
}

describe("ImportDataService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps prepared commands in main memory and applies them once only after confirmation", async () => {
    const data = createEmptyFinanceData(2026);
    const finance = {
      snapshot: vi.fn().mockResolvedValue({ data, workbookConfigured: true }),
      applyImport: vi.fn().mockResolvedValue({}),
    };
    const plan = prepared();
    const parser: ImportTemplateParser = { parse: vi.fn().mockResolvedValue(plan) };
    electronMocks.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [path.resolve("private", "filled.xlsx")] });
    const service = new ImportDataService({} as never, finance as never, parser);

    const preview = await service.preview("skip", "it");

    expect(preview.previewId).toMatch(/^[0-9a-f-]{36}$/);
    expect(preview).not.toHaveProperty("commands");
    expect(JSON.stringify(preview)).not.toContain(path.resolve("private"));
    expect(finance.applyImport).not.toHaveBeenCalled();

    const result = await service.confirm(preview.previewId!);

    expect(finance.applyImport).toHaveBeenCalledOnce();
    expect(finance.applyImport).toHaveBeenCalledWith(plan.commands);
    expect(result.actions.create).toBe(1);
    await expect(service.confirm(preview.previewId!)).rejects.toThrow("IMPORT_PREVIEW_EXPIRED");
  });

  it("leaves data untouched when selection or preview confirmation is canceled", async () => {
    const data = createEmptyFinanceData(2026);
    const finance = {
      snapshot: vi.fn().mockResolvedValue({ data, workbookConfigured: true }),
      applyImport: vi.fn(),
    };
    const parser: ImportTemplateParser = { parse: vi.fn() };
    electronMocks.showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });
    const service = new ImportDataService({} as never, finance as never, parser);

    const canceled = await service.preview("skip", "en");

    expect(canceled.canceled).toBe(true);
    expect(parser.parse).not.toHaveBeenCalled();
    expect(finance.applyImport).not.toHaveBeenCalled();

    electronMocks.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [path.resolve("filled.xlsx")] });
    vi.mocked(parser.parse).mockResolvedValue(prepared());
    const preview = await service.preview("skip", "en");
    expect(service.discard(preview.previewId!)).toBe(true);
    await expect(service.confirm(preview.previewId!)).rejects.toThrow("IMPORT_PREVIEW_EXPIRED");
    expect(finance.applyImport).not.toHaveBeenCalled();
  });
});
