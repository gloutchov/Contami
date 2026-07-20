import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FinanceCommand } from "../../src/domain/commands";
import { applyFinanceCommand, createEmptyFinanceData } from "../../src/domain/finance";
import { InvestmentForm } from "../../src/renderer/forms/InvestmentForms";
import { PropertyExpenseForm } from "../../src/renderer/forms/PropertyExpenseForms";
import { PropertyEntryForm } from "../../src/renderer/forms/PropertyForms";
import { I18nProvider } from "../../src/renderer/i18n/I18nContext";
import { PropertiesView } from "../../src/renderer/views/PropertiesView";

const renderIt = (component: ReactNode) => render(<I18nProvider language="it">{component}</I18nProvider>);
afterEach(cleanup);

function dataWithUnrelatedSharedExpense() {
  const data = createEmptyFinanceData(2026);
  const propertyId = crypto.randomUUID();
  data.properties.push({ id: propertyId, name: "Casa", kind: "apartment", usage: "residence", areaSqm: 100, ownershipShare: 1, purchasePrice: 0, active: true, notes: "" });
  const transactionId = crypto.randomUUID();
  const sharedId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  data.transactions.push({
    id: transactionId, date: "2026-07-01", description: "Spesa condivisa precedente",
    categoryId: data.categories[3].id, paymentMethodId: data.paymentMethods[0].id,
    kind: "expense", amount: 40, currency: "EUR", sharedExpenseId: sharedId,
    shared: true, sharedPaidBy: "owner", sharedSettled: false, notes: "",
    createdAt: timestamp, updatedAt: timestamp,
  });
  data.sharedExpenses.push({
    id: sharedId, date: "2026-07-01", description: "Spesa condivisa precedente",
    categoryId: data.categories[3].id, paymentMethodId: data.paymentMethods[0].id,
    amount: 40, ownerShare: 20, partnerShare: 20, paidBy: "owner", settled: false,
    transactionId, notes: "",
  });
  return { data, propertyId };
}

describe("v0.8 review forms", () => {
  it("creates a new investment together with its initial contribution", async () => {
    const data = createEmptyFinanceData(2026);
    const onSave = vi.fn<(command: FinanceCommand) => Promise<void>>().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderIt(<InvestmentForm data={data} onClose={() => undefined} onSave={onSave} />);

    await user.type(screen.getByLabelText("Nome"), "Fondo sintetico");
    await user.type(screen.getByLabelText(/^Versamento iniziale/), "2500");
    await user.click(screen.getByRole("button", { name: "Salva" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    const command = onSave.mock.calls[0][0];
    expect(command.type).toBe("addInvestmentWithInitialContribution");
    if (command.type === "addInvestmentWithInitialContribution") {
      expect(command.value.initialContribution).toMatchObject({ amount: 2_500, kind: "contribution" });
      expect(command.value.initialContribution.investmentId).toBe(command.value.investment.id);
    }
  });

  it("calculates a property valuation from the value per square metre", async () => {
    const data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    data.properties.push({ id: propertyId, name: "Casa", kind: "apartment", usage: "residence", areaSqm: 100, ownershipShare: 1, purchasePrice: 0, active: true, notes: "" });
    const onSave = vi.fn<(command: FinanceCommand) => Promise<void>>().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderIt(<PropertyEntryForm data={data} initialPropertyId={propertyId} onClose={() => undefined} onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText("Tipo"), "valuation");
    await user.type(screen.getByLabelText("Descrizione"), "Valutazione sintetica");
    await user.selectOptions(screen.getByLabelText("Metodo di valutazione"), "sqm");
    await user.type(screen.getByLabelText(/^Valore per m²/), "3000");
    expect(screen.getByText("300000.00")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Salva" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    const command = onSave.mock.calls[0][0];
    expect(command.type).toBe("addPropertyEntry");
    if (command.type === "addPropertyEntry") expect(command.value).toMatchObject({ amount: 300_000, valuePerSqm: 3_000 });
  });

  it("creates an electricity expense with bands and a shared split", async () => {
    const data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    data.properties.push({ id: propertyId, name: "Casa", kind: "apartment", usage: "residence", areaSqm: 100, ownershipShare: 1, purchasePrice: 0, active: true, notes: "" });
    const onSave = vi.fn<(command: FinanceCommand) => Promise<void>>().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderIt(<PropertyExpenseForm data={data} mode="utility" initialPropertyId={propertyId} onClose={() => undefined} onSave={onSave} />);

    await user.type(screen.getByLabelText("Descrizione"), "Bolletta elettrica");
    await user.type(screen.getByLabelText("Importo"), "180");
    await user.type(screen.getByLabelText("Elettricità F1 (kWh)"), "100");
    await user.type(screen.getByLabelText(/^Elettricità F2 \+ F3 \(kWh\)/), "210");
    await user.click(screen.getByRole("checkbox", { name: /Mostra anche nelle Spese condivise/ }));
    await user.click(screen.getByRole("button", { name: "Salva" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    const command = onSave.mock.calls[0][0];
    expect(command.type).toBe("addPropertyExpense");
    if (command.type === "addPropertyExpense") {
      expect(command.value.entry).toMatchObject({ detailKind: "utility_electricity", quantity: 310, electricityKwhF1: 100, electricityKwhF23: 210 });
      expect(command.value.shared).toMatchObject({ ownerShare: 90, partnerShare: 90 });
    }
  });

  it("offers IMU and TARI instalments in English", async () => {
    const data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    data.properties.push({ id: propertyId, name: "Home", kind: "apartment", usage: "residence", ownershipShare: 1, purchasePrice: 0, active: true, notes: "" });
    render(<I18nProvider language="en"><PropertyExpenseForm data={data} mode="tax" initialPropertyId={propertyId} onClose={() => undefined} onSave={async () => undefined} /></I18nProvider>);
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText("Tax"), "tax_imu");
    expect(screen.getByRole("option", { name: "First instalment" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Second instalment" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Tax"), "tax_tari");
    expect((screen.getByRole("option", { name: "TARI" }) as HTMLOptionElement).selected).toBe(true);
  });

  it("keeps utility and tax controls interactive when opened from the properties view", async () => {
    const data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    data.properties.push({ id: propertyId, name: "Casa", kind: "apartment", usage: "residence", areaSqm: 100, ownershipShare: 1, purchasePrice: 0, active: true, notes: "" });
    const user = userEvent.setup();
    renderIt(<PropertiesView data={data} onSave={async () => undefined} />);

    await user.click(screen.getByRole("button", { name: "Utenze" }));
    const utilitySelect = screen.getByLabelText("Utenza");
    const description = screen.getByLabelText("Descrizione");
    expect(utilitySelect).toBeEnabled();
    expect(description).toBeEnabled();
    await user.selectOptions(utilitySelect, "utility_gas");
    await user.type(description, "Bolletta gas modificabile");
    expect((utilitySelect as HTMLSelectElement).value).toBe("utility_gas");
    expect(description).toHaveValue("Bolletta gas modificabile");

    await user.click(screen.getByRole("button", { name: "Annulla" }));
    await user.click(screen.getByRole("button", { name: "Tasse" }));
    const taxSelect = screen.getByLabelText("Tassa");
    expect(taxSelect).toBeEnabled();
    await user.selectOptions(taxSelect, "tax_imu");
    expect((taxSelect as HTMLSelectElement).value).toBe("tax_imu");
    expect(screen.getByLabelText("Rata")).toBeEnabled();
  });

  it("does not reuse an unrelated shared expense id for a new utility", async () => {
    const fixture = dataWithUnrelatedSharedExpense();
    let data = fixture.data;
    const { propertyId } = fixture;
    const onSave = vi.fn<(command: FinanceCommand) => Promise<void>>().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderIt(<PropertyExpenseForm data={data} mode="utility" initialPropertyId={propertyId} onClose={() => undefined} onSave={onSave} />);

    expect(screen.getByRole("checkbox", { name: /Mostra anche nelle Spese condivise/ })).not.toBeChecked();
    await user.type(screen.getByLabelText("Descrizione"), "Nuova bolletta gas");
    await user.type(screen.getByLabelText("Importo"), "80");
    await user.selectOptions(screen.getByLabelText("Utenza"), "utility_gas");
    await user.click(screen.getByRole("button", { name: "Salva" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    const command = onSave.mock.calls[0][0];
    expect(command.type).toBe("addPropertyExpense");
    if (command.type === "addPropertyExpense") {
      expect(command.value.shared).toBeUndefined();
      expect(() => { data = applyFinanceCommand(data, command); }).not.toThrow();
      expect(data.propertyEntries).toHaveLength(1);
      expect(data.sharedExpenses).toHaveLength(1);
    }
  });

  it("does not reuse an unrelated shared expense id for a new property tax", async () => {
    const fixture = dataWithUnrelatedSharedExpense();
    let data = fixture.data;
    const { propertyId } = fixture;
    const onSave = vi.fn<(command: FinanceCommand) => Promise<void>>().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderIt(<PropertyExpenseForm data={data} mode="tax" initialPropertyId={propertyId} onClose={() => undefined} onSave={onSave} />);

    expect(screen.getByRole("checkbox", { name: /Mostra anche nelle Spese condivise/ })).not.toBeChecked();
    await user.selectOptions(screen.getByLabelText("Tassa"), "tax_imu");
    await user.selectOptions(screen.getByLabelText("Rata"), "first");
    await user.type(screen.getByLabelText("Descrizione"), "Prima rata IMU");
    await user.type(screen.getByLabelText("Importo"), "350");
    await user.click(screen.getByRole("button", { name: "Salva" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    const command = onSave.mock.calls[0][0];
    expect(command.type).toBe("addPropertyExpense");
    if (command.type === "addPropertyExpense") {
      expect(command.value.entry).toMatchObject({ detailKind: "tax_imu", taxInstallment: "first", amount: 350 });
      expect(command.value.shared).toBeUndefined();
      expect(() => { data = applyFinanceCommand(data, command); }).not.toThrow();
      expect(data.propertyEntries).toHaveLength(1);
      expect(data.transactions).toHaveLength(2);
      expect(data.sharedExpenses).toHaveLength(1);
    }
  });

  it("can include an IMU payment in the common property-expense summary", async () => {
    const data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    data.properties.push({ id: propertyId, name: "Casa", kind: "apartment", usage: "residence", ownershipShare: 1, purchasePrice: 0, active: true, notes: "" });
    const onSave = vi.fn<(command: FinanceCommand) => Promise<void>>().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderIt(<PropertyExpenseForm data={data} mode="tax" initialPropertyId={propertyId} onClose={() => undefined} onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText("Tassa"), "tax_imu");
    await user.selectOptions(screen.getByLabelText("Rata"), "first");
    await user.click(screen.getByRole("checkbox", { name: /Mostra questa voce anche nel riepilogo delle spese comuni/ }));
    await user.type(screen.getByLabelText("Descrizione"), "Prima rata IMU comune");
    await user.type(screen.getByLabelText("Importo"), "350");
    await user.click(screen.getByRole("button", { name: "Salva" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    const command = onSave.mock.calls[0][0];
    expect(command.type).toBe("addPropertyExpense");
    if (command.type === "addPropertyExpense") {
      expect(command.value.entry).toMatchObject({ detailKind: "tax_imu", category: "IMU", taxInstallment: "first", isCommonExpense: true });
    }
  });
});
