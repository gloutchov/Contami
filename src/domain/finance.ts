import type { FinanceCommand } from "./commands";
import { DEFAULT_INVESTMENT_TYPES } from "./catalogDefaults";
import {
  deleteLinkedEntity,
  syncInvestmentPlan,
  syncRecurringLink,
  syncRecurringTransactions,
  upsertInvestmentEntryWithLinks,
  upsertPropertyEntryWithLinks,
  upsertSharedExpenseWithLinks,
  upsertTransactionWithLinks,
  upsertVehicleEntryWithLinks,
} from "./linkedRecords";
import { portfolioValues } from "./investments";
import type { AnnualSummary, FinanceData, InvestmentEntry, PropertyEntry } from "./models";
import { financeDataSchema } from "./models";

const nowIso = () => new Date().toISOString();
const todayIso = () => new Date().toISOString().slice(0, 10);
const randomUUID = () => globalThis.crypto.randomUUID();

export function createEmptyFinanceData(year = new Date().getFullYear()): FinanceData {
  const timestamp = nowIso();
  const category = (nameIt: string, nameEn: string, kind: "income" | "expense" | "both") => ({ id: randomUUID(), nameIt, nameEn, kind, active: true });
  const payment = (name: string, kind: "cash" | "card" | "bank_transfer" | "direct_debit" | "digital_wallet" | "other") => ({ id: randomUUID(), name, kind, active: true });
  return financeDataSchema.parse({
    meta: { schemaVersion: 3, activeYear: year, createdAt: timestamp, updatedAt: timestamp },
    categories: [
      category("Stipendio", "Salary", "income"), category("Affitti", "Rent income", "income"),
      category("Alimentari", "Groceries", "expense"), category("Casa", "Home", "expense"),
      category("Trasporti", "Transport", "expense"), category("Salute", "Health", "expense"),
      category("Tempo libero", "Leisure", "expense"), category("Servizi e abbonamenti", "Services & subscriptions", "expense"),
      category("Investimenti", "Investments", "both"), category("Altro", "Other", "both"),
    ],
    paymentMethods: [
      payment("Conto corrente", "bank_transfer"), payment("Carta", "card"), payment("Contanti", "cash"),
      payment("Addebito diretto", "direct_debit"), payment("Wallet digitale", "digital_wallet"),
    ],
    investmentTypes: structuredClone(DEFAULT_INVESTMENT_TYPES),
    accounts: [], transactions: [], properties: [], propertyEntries: [], investments: [], investmentEntries: [],
    recurringItems: [], sharedExpenses: [], vehicles: [], vehicleEntries: [], annualSummaries: [],
    propertyAnnualSummaries: [], investmentAnnualSummaries: [], vehicleAnnualSummaries: [],
  });
}

function ensureUnique(collection: Array<{ id: string }>, id: string): void {
  if (collection.some((item) => item.id === id)) throw new Error("DUPLICATE_ID");
}

function replace<T extends { id: string }>(collection: T[], value: T): void {
  const index = collection.findIndex((item) => item.id === value.id);
  if (index === -1) throw new Error("ENTITY_NOT_FOUND");
  collection[index] = value;
}

function ensureExists(collection: Array<{ id: string }>, id: string): void {
  if (!collection.some((item) => item.id === id)) throw new Error("ENTITY_NOT_FOUND");
}

function ensureEditableInvestmentType(data: FinanceData, typeId: string, code: string): void {
  const current = data.investmentTypes.find((item) => item.id === typeId);
  if (code === "pension" || current?.code === "pension") throw new Error("RESERVED_INVESTMENT_TYPE");
}

export function applyFinanceCommand(data: FinanceData, command: FinanceCommand): FinanceData {
  const next = structuredClone(data);
  switch (command.type) {
    case "addTransaction": ensureUnique(next.transactions, command.value.id); upsertTransactionWithLinks(next, command.value); break;
    case "updateTransaction": ensureExists(next.transactions, command.value.id); upsertTransactionWithLinks(next, command.value); break;
    case "addAccount": ensureUnique(next.accounts, command.value.id); next.accounts.push(command.value); break;
    case "updateAccount": replace(next.accounts, command.value); break;
    case "addProperty": ensureUnique(next.properties, command.value.id); next.properties.push(command.value); break;
    case "updateProperty": replace(next.properties, command.value); break;
    case "addPropertyEntry":
      ensureUnique(next.propertyEntries, command.value.id);
      if (!next.properties.some((item) => item.id === command.value.propertyId)) throw new Error("PROPERTY_NOT_FOUND");
      upsertPropertyEntryWithLinks(next, command.value); break;
    case "updatePropertyEntry": ensureExists(next.propertyEntries, command.value.id); upsertPropertyEntryWithLinks(next, command.value); break;
    case "addInvestment":
      ensureUnique(next.investments, command.value.id); next.investments.push(command.value); syncInvestmentPlan(next, command.value); break;
    case "updateInvestment": replace(next.investments, command.value); syncInvestmentPlan(next, command.value); break;
    case "addInvestmentEntry":
      ensureUnique(next.investmentEntries, command.value.id);
      if (!next.investments.some((item) => item.id === command.value.investmentId)) throw new Error("INVESTMENT_NOT_FOUND");
      upsertInvestmentEntryWithLinks(next, command.value); break;
    case "updateInvestmentEntry": ensureExists(next.investmentEntries, command.value.id); upsertInvestmentEntryWithLinks(next, command.value); break;
    case "addRecurringItem": ensureUnique(next.recurringItems, command.value.id); next.recurringItems.push(command.value); syncRecurringLink(next, command.value); syncRecurringTransactions(next, command.value); break;
    case "updateRecurringItem": replace(next.recurringItems, command.value); syncRecurringLink(next, command.value); syncRecurringTransactions(next, command.value); break;
    case "addSharedExpense": ensureUnique(next.sharedExpenses, command.value.id); upsertSharedExpenseWithLinks(next, command.value); break;
    case "updateSharedExpense": ensureExists(next.sharedExpenses, command.value.id); upsertSharedExpenseWithLinks(next, command.value); break;
    case "addVehicle": ensureUnique(next.vehicles, command.value.id); next.vehicles.push(command.value); break;
    case "updateVehicle": replace(next.vehicles, command.value); break;
    case "addVehicleEntry":
      ensureUnique(next.vehicleEntries, command.value.id);
      if (!next.vehicles.some((item) => item.id === command.value.vehicleId)) throw new Error("VEHICLE_NOT_FOUND");
      upsertVehicleEntryWithLinks(next, command.value); break;
    case "updateVehicleEntry": ensureExists(next.vehicleEntries, command.value.id); upsertVehicleEntryWithLinks(next, command.value); break;
    case "addCategory": ensureUnique(next.categories, command.value.id); next.categories.push(command.value); break;
    case "updateCategory": replace(next.categories, command.value); break;
    case "addPaymentMethod": ensureUnique(next.paymentMethods, command.value.id); next.paymentMethods.push(command.value); break;
    case "updatePaymentMethod": replace(next.paymentMethods, command.value); break;
    case "addInvestmentType":
      ensureEditableInvestmentType(next, command.value.id, command.value.code);
      ensureUnique(next.investmentTypes, command.value.id); next.investmentTypes.push(command.value); break;
    case "updateInvestmentType":
      ensureEditableInvestmentType(next, command.value.id, command.value.code);
      replace(next.investmentTypes, command.value); break;
    case "deleteEntity":
      if (command.entity === "investmentType") {
        const type = next.investmentTypes.find((item) => item.id === command.id);
        if (type?.code === "pension") throw new Error("RESERVED_INVESTMENT_TYPE");
      }
      deleteLinkedEntity(next, command.entity, command.id); break;
    case "setActive": {
      if (command.entity === "recurringItem") {
        const item = next.recurringItems.find((candidate) => candidate.id === command.id);
        if (!item) throw new Error("ENTITY_NOT_FOUND");
        item.active = command.active;
        item.closedAt = command.active ? undefined : (command.closedAt ?? todayIso());
        syncRecurringTransactions(next, item);
      } else if (command.entity === "investment") {
        const item = next.investments.find((candidate) => candidate.id === command.id);
        if (!item) throw new Error("ENTITY_NOT_FOUND");
        const linkedIds = new Set([item.id]);
        for (let pass = 0; pass < next.investments.length; pass += 1) {
          let changed = false;
          next.investments.forEach((candidate) => {
            if (candidate.parentInvestmentId && linkedIds.has(candidate.parentInvestmentId) && !linkedIds.has(candidate.id)) {
              linkedIds.add(candidate.id); changed = true;
            }
          });
          if (!changed) break;
        }
        next.investments.filter((candidate) => linkedIds.has(candidate.id)).forEach((candidate) => {
          candidate.active = command.active;
          candidate.closedAt = command.active ? undefined : (command.closedAt ?? todayIso());
        });
        next.recurringItems.filter((candidate) => candidate.investmentId && linkedIds.has(candidate.investmentId) && candidate.kind === "investment").forEach((recurring) => {
          recurring.active = command.active;
          recurring.closedAt = command.active ? undefined : (command.closedAt ?? todayIso());
          syncRecurringTransactions(next, recurring);
        });
      } else if (command.entity === "vehicle") {
        const item = next.vehicles.find((candidate) => candidate.id === command.id);
        if (!item) throw new Error("ENTITY_NOT_FOUND");
        item.active = command.active;
        item.disposalDate = command.active ? undefined : (command.closedAt ?? todayIso());
      } else {
        const collection = command.entity === "account" ? next.accounts : next.properties;
        const item = collection.find((candidate) => candidate.id === command.id);
        if (!item) throw new Error("ENTITY_NOT_FOUND");
        item.active = command.active;
        item.closedAt = command.active ? undefined : (command.closedAt ?? todayIso());
      }
      break;
    }
    case "setSharedExpenseSettled": {
      const item = next.sharedExpenses.find((candidate) => candidate.id === command.id);
      if (!item) throw new Error("SHARED_EXPENSE_NOT_FOUND");
      item.settled = command.settled;
      const transaction = next.transactions.find((candidate) => candidate.id === item.transactionId);
      if (transaction) transaction.sharedSettled = command.settled;
      break;
    }
    case "settleSharedExpenseMonth":
      next.sharedExpenses.filter((item) => item.date.startsWith(command.month)).forEach((item) => {
        item.settled = command.settled;
        const transaction = next.transactions.find((candidate) => candidate.id === item.transactionId);
        if (transaction) transaction.sharedSettled = command.settled;
      });
      break;
  }
  next.meta.updatedAt = nowIso();
  return financeDataSchema.parse(next);
}

function latestValue(entries: Array<PropertyEntry | InvestmentEntry>, targetId: string, idKey: "propertyId" | "investmentId"): number {
  return entries.filter((entry) => entry[idKey as keyof typeof entry] === targetId && entry.kind === "valuation")
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.amount ?? 0;
}

export const monthlyAmount = (amount: number, frequency: "weekly" | "monthly" | "quarterly" | "yearly") => ({
  weekly: amount * 52 / 12, monthly: amount, quarterly: amount / 3, yearly: amount / 12,
})[frequency];

export interface HistoricalMetric {
  year: number;
  netWorth: number;
  liquidBalance: number;
  propertyValue: number;
  investmentValue: number;
  income: number;
  expenses: number;
  monthlyRecurring: number;
}

export interface DashboardMetrics {
  netWorth: number; liquidBalance: number; propertyValue: number; investmentValue: number; pensionValue: number;
  yearIncome: number; yearExpenses: number; monthlyRecurring: number; sharedBalance: number;
  propertyIncome: number; propertyExpenses: number;
  months: Array<{ month: string; income: number; expenses: number }>;
  categories: Array<{ id: string; nameIt: string; nameEn: string; amount: number }>;
  history: HistoricalMetric[];
}

export function computeDashboard(data: FinanceData): DashboardMetrics {
  const year = String(data.meta.activeYear);
  const yearTransactions = data.transactions.filter((item) => item.date.startsWith(year));
  const yearIncome = yearTransactions.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount, 0);
  const yearExpenses = yearTransactions.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount, 0);
  const liquidBalance = data.accounts.reduce((sum, account) => sum + account.openingBalance + data.transactions.filter((item) => item.accountId === account.id).reduce((subtotal, item) => {
    if (item.kind === "income" || (item.kind === "transfer" && item.cashFlowDirection === "inflow")) return subtotal + item.amount;
    if (item.kind === "expense" || (item.kind === "transfer" && item.cashFlowDirection === "outflow")) return subtotal - item.amount;
    return subtotal;
  }, 0), 0);
  const propertyValue = data.properties.filter((item) => item.active).reduce((sum, item) => sum + (latestValue(data.propertyEntries, item.id, "propertyId") || item.purchasePrice) * item.ownershipShare, 0);
  const { investments: investmentValue, pensions: pensionValue, combined: combinedInvestmentValue } = portfolioValues(data);
  const monthlyRecurring = data.recurringItems.filter((item) => item.active && item.direction !== "income").reduce((sum, item) => sum + monthlyAmount(item.amount, item.frequency), 0);
  const sharedBalance = data.sharedExpenses.filter((item) => !item.settled).reduce((sum, item) => item.paidBy === "owner" ? sum + item.partnerShare : sum - item.ownerShare, 0);
  const propertyYearEntries = data.propertyEntries.filter((item) => item.date.startsWith(year));
  const propertyIncome = propertyYearEntries.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount, 0);
  const propertyExpenses = propertyYearEntries.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount, 0);
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, "0")}`;
    const items = yearTransactions.filter((item) => item.date.startsWith(month));
    return { month, income: items.filter((item) => item.kind === "income").reduce((sum, item) => sum + item.amount, 0), expenses: items.filter((item) => item.kind === "expense").reduce((sum, item) => sum + item.amount, 0) };
  });
  const categories = data.categories.map((category) => ({
    id: category.id, nameIt: category.nameIt, nameEn: category.nameEn,
    amount: yearTransactions.filter((item) => item.kind === "expense" && item.categoryId === category.id).reduce((sum, item) => sum + item.amount, 0),
  })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 6);
  const netWorth = liquidBalance + propertyValue + combinedInvestmentValue;
  const history = [
    ...data.annualSummaries.map((item) => ({ year: item.year, netWorth: item.closingNetWorth, liquidBalance: item.liquidBalance, propertyValue: item.propertyValue, investmentValue: item.investmentValue, income: item.income, expenses: item.expenses, monthlyRecurring: item.monthlyRecurring })),
    { year: data.meta.activeYear, netWorth, liquidBalance, propertyValue, investmentValue: combinedInvestmentValue, income: yearIncome, expenses: yearExpenses, monthlyRecurring },
  ].sort((a, b) => a.year - b.year);
  return { netWorth, liquidBalance, propertyValue, investmentValue, pensionValue, yearIncome, yearExpenses, monthlyRecurring, sharedBalance, propertyIncome, propertyExpenses, months, categories, history };
}

export function createAnnualSummary(data: FinanceData): AnnualSummary {
  const metrics = computeDashboard(data);
  return {
    year: data.meta.activeYear, income: metrics.yearIncome, expenses: metrics.yearExpenses,
    netCashFlow: metrics.yearIncome - metrics.yearExpenses, closingNetWorth: metrics.netWorth,
    liquidBalance: metrics.liquidBalance, propertyValue: metrics.propertyValue,
    investmentValue: metrics.investmentValue, pensionValue: metrics.pensionValue, monthlyRecurring: metrics.monthlyRecurring,
    vehicleCosts: data.vehicleEntries.filter((item) => item.date.startsWith(String(data.meta.activeYear)) && item.kind !== "valuation").reduce((sum, item) => sum + item.amount, 0),
  };
}
