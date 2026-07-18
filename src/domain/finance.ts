import type { FinanceCommand } from "./commands";
import type { AnnualSummary, FinanceData, InvestmentEntry, PropertyEntry } from "./models";
import { financeDataSchema } from "./models";

const nowIso = () => new Date().toISOString();
const todayIso = () => new Date().toISOString().slice(0, 10);
const randomUUID = () => globalThis.crypto.randomUUID();

export function createEmptyFinanceData(year = new Date().getFullYear()): FinanceData {
  const timestamp = nowIso();
  const category = (nameIt: string, nameEn: string, kind: "income" | "expense" | "both") => ({
    id: randomUUID(), nameIt, nameEn, kind, active: true,
  });
  const payment = (name: string, kind: "cash" | "card" | "bank_transfer" | "direct_debit" | "digital_wallet" | "other") => ({
    id: randomUUID(), name, kind, active: true,
  });

  return financeDataSchema.parse({
    meta: { schemaVersion: 1, activeYear: year, createdAt: timestamp, updatedAt: timestamp },
    categories: [
      category("Stipendio", "Salary", "income"),
      category("Affitti", "Rent income", "income"),
      category("Alimentari", "Groceries", "expense"),
      category("Casa", "Home", "expense"),
      category("Trasporti", "Transport", "expense"),
      category("Salute", "Health", "expense"),
      category("Tempo libero", "Leisure", "expense"),
      category("Servizi e abbonamenti", "Services & subscriptions", "expense"),
      category("Investimenti", "Investments", "both"),
      category("Altro", "Other", "both"),
    ],
    paymentMethods: [
      payment("Conto corrente", "bank_transfer"),
      payment("Carta", "card"),
      payment("Contanti", "cash"),
      payment("Addebito diretto", "direct_debit"),
      payment("Wallet digitale", "digital_wallet"),
    ],
    accounts: [],
    transactions: [],
    properties: [],
    propertyEntries: [],
    investments: [],
    investmentEntries: [],
    recurringItems: [],
    sharedExpenses: [],
    annualSummaries: [],
  });
}

function ensureUnique(collection: Array<{ id: string }>, id: string): void {
  if (collection.some((item) => item.id === id)) throw new Error("DUPLICATE_ID");
}

export function applyFinanceCommand(data: FinanceData, command: FinanceCommand): FinanceData {
  const next = structuredClone(data);
  switch (command.type) {
    case "addTransaction":
      ensureUnique(next.transactions, command.value.id);
      next.transactions.push(command.value);
      break;
    case "addAccount":
      ensureUnique(next.accounts, command.value.id);
      next.accounts.push(command.value);
      break;
    case "addProperty":
      ensureUnique(next.properties, command.value.id);
      next.properties.push(command.value);
      break;
    case "addPropertyEntry":
      ensureUnique(next.propertyEntries, command.value.id);
      if (!next.properties.some((item) => item.id === command.value.propertyId)) throw new Error("PROPERTY_NOT_FOUND");
      next.propertyEntries.push(command.value);
      break;
    case "addInvestment":
      ensureUnique(next.investments, command.value.id);
      next.investments.push(command.value);
      break;
    case "addInvestmentEntry":
      ensureUnique(next.investmentEntries, command.value.id);
      if (!next.investments.some((item) => item.id === command.value.investmentId)) throw new Error("INVESTMENT_NOT_FOUND");
      next.investmentEntries.push(command.value);
      break;
    case "addRecurringItem":
      ensureUnique(next.recurringItems, command.value.id);
      next.recurringItems.push(command.value);
      break;
    case "addSharedExpense":
      ensureUnique(next.sharedExpenses, command.value.id);
      next.sharedExpenses.push(command.value);
      break;
    case "addCategory":
      ensureUnique(next.categories, command.value.id);
      next.categories.push(command.value);
      break;
    case "addPaymentMethod":
      ensureUnique(next.paymentMethods, command.value.id);
      next.paymentMethods.push(command.value);
      break;
    case "setActive": {
      const map = {
        account: next.accounts,
        property: next.properties,
        investment: next.investments,
        recurringItem: next.recurringItems,
      } as const;
      const item = map[command.entity].find((candidate) => candidate.id === command.id);
      if (!item) throw new Error("ENTITY_NOT_FOUND");
      item.active = command.active;
      item.closedAt = command.active ? undefined : (command.closedAt ?? todayIso());
      break;
    }
    case "setSharedExpenseSettled": {
      const item = next.sharedExpenses.find((candidate) => candidate.id === command.id);
      if (!item) throw new Error("SHARED_EXPENSE_NOT_FOUND");
      item.settled = command.settled;
      break;
    }
  }
  next.meta.updatedAt = nowIso();
  return financeDataSchema.parse(next);
}

function latestValue(entries: Array<PropertyEntry | InvestmentEntry>, targetId: string, idKey: "propertyId" | "investmentId"): number {
  return entries
    .filter((entry) => entry[idKey as keyof typeof entry] === targetId && entry.kind === "valuation")
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.amount ?? 0;
}

const monthlyAmount = (amount: number, frequency: "weekly" | "monthly" | "quarterly" | "yearly") => ({
  weekly: amount * 52 / 12,
  monthly: amount,
  quarterly: amount / 3,
  yearly: amount / 12,
})[frequency];

export interface DashboardMetrics {
  netWorth: number;
  liquidBalance: number;
  propertyValue: number;
  investmentValue: number;
  yearIncome: number;
  yearExpenses: number;
  monthlyRecurring: number;
  sharedBalance: number;
  months: Array<{ month: string; income: number; expenses: number }>;
  categories: Array<{ id: string; nameIt: string; nameEn: string; amount: number }>;
}

export function computeDashboard(data: FinanceData): DashboardMetrics {
  const year = String(data.meta.activeYear);
  const yearTransactions = data.transactions.filter((item) => item.date.startsWith(year));
  const yearIncome = yearTransactions.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount, 0);
  const yearExpenses = yearTransactions.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount, 0);
  const liquidBalance = data.accounts.reduce((sum, account) => {
    const movements = data.transactions.filter((item) => item.accountId === account.id).reduce((subtotal, item) => {
      if (item.kind === "income") return subtotal + item.amount;
      if (item.kind === "expense") return subtotal - item.amount;
      return subtotal;
    }, 0);
    return sum + account.openingBalance + movements;
  }, 0);
  const propertyValue = data.properties.filter((item) => item.active).reduce((sum, item) => {
    const valuation = latestValue(data.propertyEntries, item.id, "propertyId");
    return sum + (valuation || item.purchasePrice) * item.ownershipShare;
  }, 0);
  const investmentValue = data.investments.filter((item) => item.active).reduce(
    (sum, item) => sum + latestValue(data.investmentEntries, item.id, "investmentId"),
    0,
  );
  const monthlyRecurring = data.recurringItems.filter((item) => item.active).reduce(
    (sum, item) => sum + monthlyAmount(item.amount, item.frequency),
    0,
  );
  const sharedBalance = data.sharedExpenses.filter((item) => !item.settled).reduce((sum, item) => (
    item.paidBy === "owner" ? sum + item.partnerShare : sum - item.ownerShare
  ), 0);
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, "0")}`;
    const items = yearTransactions.filter((item) => item.date.startsWith(month));
    return {
      month,
      income: items.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount, 0),
      expenses: items.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount, 0),
    };
  });
  const categories = data.categories.map((category) => ({
    id: category.id,
    nameIt: category.nameIt,
    nameEn: category.nameEn,
    amount: yearTransactions.filter((item) => item.kind === "expense" && item.categoryId === category.id)
      .reduce((sum, item) => sum + item.amount, 0),
  })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 6);

  return {
    netWorth: liquidBalance + propertyValue + investmentValue,
    liquidBalance,
    propertyValue,
    investmentValue,
    yearIncome,
    yearExpenses,
    monthlyRecurring,
    sharedBalance,
    months,
    categories,
  };
}

export function createAnnualSummary(data: FinanceData): AnnualSummary {
  const metrics = computeDashboard(data);
  return {
    year: data.meta.activeYear,
    income: metrics.yearIncome,
    expenses: metrics.yearExpenses,
    netCashFlow: metrics.yearIncome - metrics.yearExpenses,
    closingNetWorth: metrics.netWorth,
  };
}
