import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import { I18nProvider } from "../../src/renderer/i18n/I18nContext";
import { RecurringView } from "../../src/renderer/views/RecurringView";
import { TransactionsView } from "../../src/renderer/views/TransactionsView";

afterEach(cleanup);

const renderIt = (component: React.ReactNode) =>
  render(<I18nProvider language="it">{component}</I18nProvider>);

describe("cash and installment views", () => {
  it("uses pure filtered balances while keeping unfiltered account and cash-register totals as of today", () => {
    const data = createEmptyFinanceData(2026);
    const accountId = crypto.randomUUID();
    const cashRegisterId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const cashPaymentMethodId = data.paymentMethods.find((item) => item.kind === "cash")!.id;
    data.accounts.push(
      {
        id: accountId, name: "Conto sintetico", kind: "bank", currency: "EUR",
        openingBalance: 1_000, active: true, openedAt: "2026-01-01", notes: "",
      },
      {
        id: cashRegisterId, name: "Cassa sintetica", kind: "cash", currency: "EUR",
        openingBalance: 40, active: true, openedAt: "2026-01-01", notes: "",
      },
    );
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
      {
        id: crypto.randomUUID(), date: "2026-02-03", description: "Uscita sintetica in contanti",
        categoryId: data.categories.find((item) => item.kind === "expense")!.id,
        paymentMethodId: cashPaymentMethodId, accountId: cashRegisterId, kind: "expense", amount: 10,
        currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp,
      },
    );

    renderIt(<TransactionsView data={data} onSave={vi.fn()} />);

    const accountBalanceCard = screen.getByText("Saldo Conto (filtrato)").closest("article")!;
    expect(accountBalanceCard).toHaveTextContent(/1250,00/);
    expect(accountBalanceCard).toHaveTextContent(/Saldo iniziale incluso:.*1000,00/);
    const cashRegisterBalanceCard = screen.getByText("Saldo Cassa (filtrato)").closest("article")!;
    expect(cashRegisterBalanceCard).toHaveTextContent(/30,00/);
    expect(cashRegisterBalanceCard).toHaveTextContent(/Saldo iniziale incluso:.*40,00/);
    expect(screen.getByRole("status")).toHaveTextContent("1 Transazioni");

    const todayTotals = screen.getByLabelText("Totali alla data odierna");
    const accountToday = within(todayTotals).getByRole("group", { name: "Conto" });
    const cashRegisterToday = within(todayTotals).getByRole("group", { name: "Cassa" });
    expect(accountToday).toHaveTextContent(/Flussi in entrata:.*250,00/);
    expect(accountToday).toHaveTextContent(/Flussi in uscita:.*0,00/);
    expect(accountToday).toHaveTextContent(/Saldo:.*1250,00/);
    expect(cashRegisterToday).toHaveTextContent(/Flussi in entrata:.*0,00/);
    expect(cashRegisterToday).toHaveTextContent(/Flussi in uscita:.*10,00/);
    expect(cashRegisterToday).toHaveTextContent(/Saldo:.*30,00/);

    fireEvent.change(screen.getByRole("combobox", { name: "Tipo" }), { target: { value: "income" } });
    expect(accountBalanceCard).toHaveTextContent(/250,00/);
    expect(accountBalanceCard).toHaveTextContent("Solo movimenti filtrati; saldo iniziale escluso.");
    expect(cashRegisterBalanceCard).toHaveTextContent(/0,00/);
    expect(cashRegisterBalanceCard).toHaveTextContent("Solo movimenti filtrati; saldo iniziale escluso.");
    expect(accountToday).toHaveTextContent(/Saldo:.*1250,00/);
    expect(cashRegisterToday).toHaveTextContent(/Saldo:.*30,00/);
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

  it("asks for the actual receipt date while preserving a rent installment's due date", async () => {
    const data = createEmptyFinanceData(2026);
    const accountId = crypto.randomUUID();
    const propertyId = crypto.randomUUID();
    const recurringId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const categoryId = data.categories.find((item) => item.nameIt === "Affitti")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
    data.accounts.push({
      id: accountId, name: "Synthetic bank", kind: "bank", currency: "EUR",
      openingBalance: 0, active: true, openedAt: "2026-01-01", notes: "",
    });
    data.properties.push({
      id: propertyId, name: "Synthetic rental", kind: "apartment", usage: "rental",
      ownershipShare: 1, purchasePrice: 0, active: true, notes: "",
    });
    data.recurringItems.push({
      id: recurringId, name: "Synthetic rent", kind: "rent", direction: "income", amount: 800,
      frequency: "monthly", categoryId, paymentMethodId, accountId, propertyId,
      nextDueDate: "2026-06-15", active: true, notes: "",
    });
    data.transactions.push({
      id: crypto.randomUUID(), date: "2026-06-15", dueDate: "2026-06-15", description: "Synthetic rent",
      categoryId, paymentMethodId, accountId, kind: "income", amount: 800, currency: "EUR",
      recurringId, propertyId, planned: true, notes: "", createdAt: timestamp, updatedAt: timestamp,
    });
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderIt(<TransactionsView data={data} onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: "Conferma" }));
    expect(screen.getByRole("heading", { name: "Conferma movimento previsto" })).toBeInTheDocument();
    expect(screen.getByLabelText("Scadenza / competenza")).toHaveValue("2026-06-15");
    fireEvent.change(screen.getByLabelText("Data effettiva di incasso"), { target: { value: "2026-07-04" } });
    await user.click(screen.getByRole("button", { name: "Salva" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0][0]).toMatchObject({
      type: "updateTransaction",
      value: { date: "2026-07-04", dueDate: "2026-06-15", planned: false },
    });
  });

  it("confirms a non-rent annual occurrence directly without moving it out of its due month", async () => {
    const data = createEmptyFinanceData(2026);
    const recurringId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const categoryId = data.categories.find((item) => item.kind === "expense")!.id;
    const paymentMethodId = data.paymentMethods[0].id;
    data.recurringItems.push({
      id: recurringId, name: "Synthetic annual service", kind: "subscription", direction: "expense",
      amount: 120, frequency: "yearly", categoryId, paymentMethodId,
      nextDueDate: "2026-12-20", active: true, notes: "",
    });
    data.transactions.push({
      id: crypto.randomUUID(), date: "2026-12-20", dueDate: "2026-12-20", description: "Synthetic annual service",
      categoryId, paymentMethodId, kind: "expense", amount: 120, currency: "EUR", recurringId,
      planned: true, notes: "", createdAt: timestamp, updatedAt: timestamp,
    });
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderIt(<TransactionsView data={data} onSave={onSave} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Mese" }), "2026-12");
    expect(screen.getByText("Synthetic annual service")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Conferma" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(screen.queryByRole("heading", { name: "Conferma movimento previsto" })).not.toBeInTheDocument();
    expect(onSave.mock.calls[0][0]).toMatchObject({
      type: "updateTransaction",
      value: { date: "2026-12-20", dueDate: "2026-12-20", planned: false },
    });
  });
});
