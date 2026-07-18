import { applyFinanceCommand, computeDashboard, createEmptyFinanceData } from "../../domain/finance";
import type { FinanceData } from "../../domain/models";
import type { AppSettings, ContaMiApi, FinanceSnapshot } from "../../shared/contracts";

function demoData(): FinanceData {
  const data = createEmptyFinanceData(new Date().getFullYear());
  const now = new Date().toISOString();
  const category = (name: string) => data.categories.find((item) => item.nameEn === name)!.id;
  const payment = data.paymentMethods[1].id;
  const accountId = crypto.randomUUID();
  data.accounts.push({ id: accountId, name: "Main account", kind: "bank", currency: "EUR", openingBalance: 24_800, active: true, openedAt: `${data.meta.activeYear}-01-01`, notes: "" });
  data.transactions.push(
    { id: crypto.randomUUID(), date: `${data.meta.activeYear}-01-04`, description: "Salary", categoryId: category("Salary"), paymentMethodId: payment, accountId, kind: "income", amount: 3_250, currency: "EUR", notes: "", createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), date: `${data.meta.activeYear}-01-07`, description: "Groceries", categoryId: category("Groceries"), paymentMethodId: payment, accountId, kind: "expense", amount: 138.40, currency: "EUR", notes: "", createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), date: `${data.meta.activeYear}-02-04`, description: "Salary", categoryId: category("Salary"), paymentMethodId: payment, accountId, kind: "income", amount: 3_250, currency: "EUR", notes: "", createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), date: `${data.meta.activeYear}-02-13`, description: "Train", categoryId: category("Transport"), paymentMethodId: payment, accountId, kind: "expense", amount: 84, currency: "EUR", notes: "", createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), date: `${data.meta.activeYear}-03-04`, description: "Salary", categoryId: category("Salary"), paymentMethodId: payment, accountId, kind: "income", amount: 3_250, currency: "EUR", notes: "", createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), date: `${data.meta.activeYear}-03-18`, description: "Electricity", categoryId: category("Home"), paymentMethodId: payment, accountId, kind: "expense", amount: 126.90, currency: "EUR", notes: "", createdAt: now, updatedAt: now },
  );
  const propertyId = crypto.randomUUID();
  data.properties.push({ id: propertyId, name: "City apartment", kind: "apartment", ownershipShare: 1, purchasePrice: 245_000, active: true, notes: "" });
  data.propertyEntries.push({ id: crypto.randomUUID(), propertyId, date: `${data.meta.activeYear}-01-01`, kind: "valuation", category: "Market value", description: "Annual valuation", amount: 278_000, notes: "" });
  const investmentId = crypto.randomUUID();
  data.investments.push({ id: investmentId, name: "Balanced portfolio", kind: "fund", provider: "", currency: "EUR", active: true, openedAt: `${data.meta.activeYear - 4}-01-01`, notes: "" });
  data.investmentEntries.push({ id: crypto.randomUUID(), investmentId, date: `${data.meta.activeYear}-03-01`, kind: "valuation", amount: 92_450, description: "Current value", notes: "" });
  data.recurringItems.push({ id: crypto.randomUUID(), name: "Music", kind: "subscription", amount: 10.99, frequency: "monthly", categoryId: category("Services & subscriptions"), paymentMethodId: payment, nextDueDate: `${data.meta.activeYear}-08-01`, active: true, notes: "" });
  data.sharedExpenses.push({ id: crypto.randomUUID(), date: `${data.meta.activeYear}-07-12`, description: "Weekend groceries", categoryId: category("Groceries"), paymentMethodId: payment, amount: 86, ownerShare: 43, partnerShare: 43, paidBy: "owner", settled: false, notes: "" });
  return data;
}
function createDevelopmentApi(): ContaMiApi {
  let settings: AppSettings = { language: "system", theme: "system", workbookFormat: "excel" };
  let data = demoData();
  let configured = true;
  const snapshot = (): FinanceSnapshot => ({ data: structuredClone(data), metrics: computeDashboard(data), workbookConfigured: configured, workbookDisplayName: "ContaMi-demo.xlsx", lastSavedAt: data.meta.updatedAt });
  return {
    getSettings: async () => settings,
    updateSettings: async (patch) => { settings = { ...settings, ...patch }; return settings; },
    getCapabilities: async () => ({ platform: "darwin", systemLanguage: navigator.language.startsWith("it") ? "it" : "en", systemTheme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light", numbersAvailable: false }),
    getSnapshot: async () => snapshot(),
    createWorkbook: async () => { configured = true; return { canceled: false, path: "ContaMi-demo.xlsx" }; },
    openWorkbook: async () => { configured = true; return { canceled: false, path: "ContaMi-demo.xlsx" }; },
    execute: async (command) => { data = applyFinanceCommand(data, command); return snapshot(); },
    rolloverYear: async () => ({ canceled: false, year: data.meta.activeYear + 1, newWorkbookPath: "ContaMi-next.xlsx" }),
    revealWorkbook: async () => true,
  };
}

let developmentApi: ContaMiApi | undefined;

export function getApi(): ContaMiApi {
  if (window.contami) return window.contami;
  if (import.meta.env.DEV) {
    developmentApi ??= createDevelopmentApi();
    return developmentApi;
  }
  throw new Error("ContaMì secure bridge is unavailable");
}
