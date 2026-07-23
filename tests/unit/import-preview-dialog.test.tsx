import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ImportPreview } from "../../src/domain/imports";
import { ImportPreviewDialog } from "../../src/renderer/components/ImportPreviewDialog";
import { I18nProvider } from "../../src/renderer/i18n/I18nContext";

afterEach(cleanup);

const preview: ImportPreview = {
  canceled: false,
  previewId: crypto.randomUUID(),
  fileName: "synthetic.xlsx",
  templateType: "transactions",
  totalRows: 2,
  validRows: 1,
  rejectedRows: 1,
  conflictRows: 0,
  amountTotal: 125,
  actions: { create: 1, update: 0, skip: 0 },
  errors: [{ row: 7, column: "category", code: "MISSING_REFERENCE" }],
  errorsTruncated: false,
};

describe("ImportPreviewDialog", () => {
  it("shows the bilingual row-level preview and confirms from the keyboard", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<I18nProvider language="it"><ImportPreviewDialog preview={preview} onClose={() => undefined} onConfirm={onConfirm} /></I18nProvider>);

    expect(screen.getByRole("dialog", { name: "Anteprima importazione" })).toBeInTheDocument();
    expect(screen.getByText("Riga 7, colonna category: riferimento non trovato")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Conferma importazione" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("renders the same summary in English and disables confirmation without writable actions", () => {
    render(<I18nProvider language="en"><ImportPreviewDialog
      preview={{ ...preview, actions: { create: 0, update: 0, skip: 1 } }}
      onClose={() => undefined}
      onConfirm={async () => undefined}
    /></I18nProvider>);

    expect(screen.getByText("Row 7, column category: reference not found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm import" })).toBeDisabled();
  });
});
