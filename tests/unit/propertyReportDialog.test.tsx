import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Property } from "../../src/domain/models";
import { PropertyReportDialog } from "../../src/renderer/components/PropertyReportDialog";
import { I18nProvider } from "../../src/renderer/i18n/I18nContext";

const property: Property = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Synthetic home",
  kind: "apartment",
  usage: "residence",
  ownershipShare: 0.5,
  purchasePrice: 200_000,
  active: true,
  notes: "",
};

afterEach(cleanup);

describe("PropertyReportDialog", () => {
  it("submits a localized current-year print request with ephemeral owner names", async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn().mockResolvedValue({ canceled: true });
    render(<I18nProvider language="it"><PropertyReportDialog property={property} onClose={() => undefined} onGenerate={onGenerate} /></I18nProvider>);

    expect(screen.getByRole("dialog", { name: /Report immobile · Synthetic home/ })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Periodo del report" })).toHaveValue("current-year");
    expect(screen.getByRole("textbox", { name: "Nome proprietario" })).toHaveValue("Tu");
    expect(screen.getByRole("textbox", { name: "Nome comproprietario" })).toHaveValue("Partner");

    await user.clear(screen.getByRole("textbox", { name: "Nome proprietario" }));
    await user.type(screen.getByRole("textbox", { name: "Nome proprietario" }), "Ada");
    await user.selectOptions(screen.getByRole("combobox", { name: "Periodo del report" }), "lifetime");
    await user.click(screen.getByRole("button", { name: "Stampa" }));

    expect(onGenerate).toHaveBeenCalledWith({
      propertyId: property.id,
      scope: "lifetime",
      language: "it",
      action: "print",
      ownerName: "Ada",
      coOwnerName: "Partner",
    });
  });

  it("disables both actions for an empty name and saves an English PDF when valid", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onGenerate = vi.fn().mockResolvedValue({ canceled: false, fileName: "statement.pdf" });
    render(<I18nProvider language="en"><PropertyReportDialog property={property} onClose={onClose} onGenerate={onGenerate} /></I18nProvider>);

    const owner = screen.getByRole("textbox", { name: "Owner name" });
    await user.clear(owner);
    expect(screen.getByRole("button", { name: "Print" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save PDF" })).toBeDisabled();
    await user.type(owner, "Alex");
    await user.click(screen.getByRole("button", { name: "Save PDF" }));

    expect(onGenerate).toHaveBeenCalledWith(expect.objectContaining({ language: "en", action: "save-pdf", ownerName: "Alex" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("stays open and restores its actions after generation fails", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onGenerate = vi.fn().mockRejectedValue(new Error("PROPERTY_REPORT_FAILED"));
    render(<I18nProvider language="en"><PropertyReportDialog property={property} onClose={onClose} onGenerate={onGenerate} /></I18nProvider>);

    await user.click(screen.getByRole("button", { name: "Save PDF" }));

    expect(onGenerate).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: /Property report · Synthetic home/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Save PDF" })).toBeEnabled();
  });
});
