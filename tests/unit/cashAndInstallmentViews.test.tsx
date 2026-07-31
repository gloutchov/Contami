import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import { I18nProvider } from "../../src/renderer/i18n/I18nContext";
import { RecurringView } from "../../src/renderer/views/RecurringView";
import { TransactionsView } from "../../src/renderer/views/TransactionsView";

afterEach(cleanup);

const renderIt = (component: React.ReactNode) =>
  render(<I18nProvider language="it">{component}</I18nProvider>);

describe("cash and installment views", () => {
  it("includes opening cash in transaction balances and warns about unassigned rows", () => {
    const data = createEmptyFinanceData(2026);
    const accountId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    data.accounts.push({
      id: accountId, name: "Conto sintetico", kind: "bank", currency: "EUR",
      openingBalance: 1_000, active: true, openedAt: "2026-01-01", notes: "",
    });
    data.transactions.push(
      {
        id: crypto.randomUUID(), date: "2026-02-01", description: "Entrata sintetica",
        categoryId: data.categories.find((item) => item.kind === "income")!.id,
        paymentMethodId: data.paymentMethods[0].id, accountId, kind: "income", amount: 250,
        currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp,
      },
      {
        id: crypto.randomUUID(), date: "2026-02-02", description: "Uscita senza conto",
        categoryId: data.categories.find((item) => item.kind === "expense")!.id,
        paymentMethodId: data.paymentMethods[0].id, kind: "expense", amount: 50,
        currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp,
      },
    );

    renderIt(<TransactionsView data={data} onSave={vi.fn()} />);

    const balanceCard = screen.getByText("Saldo filtrato").closest("article")!;
    expect(balanceCard).toHaveTextContent(/1200,00/);
    expect(balanceCard).toHaveTextContent(/Saldo iniziale incluso:.*1000,00/);
    expect(screen.getByRole("status")).toHaveTextContent("1 Transazioni");
    expect(screen.getByText("Saldo:", { exact: false }).parentElement).toHaveTextContent(/1200,00/);
  });

  it("exposes the remaining installment plans in an accessible tooltip", () => {
    const data = createEmptyFinanceData(2026);
    const categoryId = data.categories.find((item) => item.kind === "expense")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
    data.recurringItems.push(
      {
        id: crypto.randomUUID(), name: "Prestito sintetico", kind: "installment", direction: "expense",
        amount: 100, frequency: "monthly", categoryId, paymentMethodId, nextDueDate: "2026-08-15",
        remainingInstallments: 2, active: true, notes: "",
      },
      {
        id: crypto.randomUUID(), name: "Acquisto sintetico", kind: "installment", direction: "expense",
        amount: 50, frequency: "monthly", categoryId, paymentMethodId, nextDueDate: "2026-09-01",
        remainingInstallments: 1, active: true, notes: "",
      },
    );

    renderIt(<RecurringView data={data} onSave={vi.fn()} />);

    const card = screen.getByText("Rate residue").closest("article")!;
    expect(card).toHaveAttribute("tabindex", "0");
    expect(card).toHaveTextContent("3");
    const tooltip = within(card).getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Prestito sintetico");
    expect(tooltip).toHaveTextContent("2 residue");
    expect(tooltip).toHaveTextContent("Acquisto sintetico");
    expect(tooltip).toHaveTextContent("1 residue");
  });
});
