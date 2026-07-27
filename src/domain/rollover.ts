import { randomUUID } from "node:crypto";
import { createAnnualSummary, createEmptyFinanceData } from "./finance";
import { createInvestmentAnnualSummaries, createPropertyAnnualSummaries, createVehicleAnnualSummaries } from "./annualHistory";
import { syncRecurringTransactions } from "./linkedRecords";
import type { FinanceData, InvestmentEntry, PropertyEntry } from "./models";

function balanceForAccount(data: FinanceData, accountId: string): number {
  const account = data.accounts.find((item) => item.id === accountId);
  if (!account) return 0;
  return account.openingBalance + data.transactions.filter((item) => item.accountId === accountId).reduce((sum, item) => {
    if (item.kind === "income") return sum + item.amount;
    if (item.kind === "expense") return sum - item.amount;
    if (item.kind === "transfer" && item.cashFlowDirection === "inflow") return sum + item.amount;
    if (item.kind === "transfer" && item.cashFlowDirection === "outflow") return sum - item.amount;
    return sum;
  }, 0);
}

function latestEntry<T extends PropertyEntry | InvestmentEntry>(entries: T[], id: string, foreignKey: "propertyId" | "investmentId"): T | undefined {
  return entries
    .filter((entry) => entry[foreignKey as keyof T] === id && entry.kind === "valuation")
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function advanceDueDate(date: string, frequency: "weekly" | "monthly" | "quarterly" | "yearly", year: number): string {
  const threshold = new Date(Date.UTC(year, 0, 1));
  const current = new Date(`${date}T00:00:00Z`);
  while (current < threshold) {
    if (frequency === "weekly") current.setUTCDate(current.getUTCDate() + 7);
    else if (frequency === "monthly") current.setUTCMonth(current.getUTCMonth() + 1);
    else if (frequency === "quarterly") current.setUTCMonth(current.getUTCMonth() + 3);
    else current.setUTCFullYear(current.getUTCFullYear() + 1);
  }
  return current.toISOString().slice(0, 10);
}

export function createRolloverFinanceData(current: FinanceData, nextYear = current.meta.activeYear + 1): FinanceData {
  if (nextYear <= current.meta.activeYear) throw new Error("INVALID_ROLLOVER_YEAR");
  const next = createEmptyFinanceData(nextYear);
  next.categories = structuredClone(current.categories);
  next.paymentMethods = structuredClone(current.paymentMethods);
  next.investmentTypes = structuredClone(current.investmentTypes);
  next.taxTypes = structuredClone(current.taxTypes);
  next.accounts = current.accounts.filter((item) => item.active).map((item) => ({
    ...structuredClone(item), openingBalance: balanceForAccount(current, item.id), closedAt: undefined,
  }));
  next.properties = structuredClone(current.properties.filter((item) => item.active));
  next.investments = structuredClone(current.investments.filter((item) => item.active));
  next.vehicles = structuredClone(current.vehicles.filter((item) => item.active));
  next.recurringItems = current.recurringItems
    .filter((item) => item.active && item.remainingInstallments !== 0 && (!item.endDate || item.endDate >= `${nextYear}-01-01`))
    .map((item) => ({ ...structuredClone(item), nextDueDate: advanceDueDate(item.nextDueDate, item.frequency, nextYear) }));
  next.recurringItems.forEach((item) => syncRecurringTransactions(next, item));
  next.sharedExpenses = structuredClone(current.sharedExpenses.filter((item) => !item.settled));
  next.annualSummaries = [...structuredClone(current.annualSummaries), createAnnualSummary(current)];
  next.propertyAnnualSummaries = [...structuredClone(current.propertyAnnualSummaries), ...createPropertyAnnualSummaries(current)];
  next.investmentAnnualSummaries = [...structuredClone(current.investmentAnnualSummaries), ...createInvestmentAnnualSummaries(current)];
  next.vehicleAnnualSummaries = [...structuredClone(current.vehicleAnnualSummaries), ...createVehicleAnnualSummaries(current)];
  for (const property of next.properties) {
    const entry = latestEntry(current.propertyEntries, property.id, "propertyId");
    if (entry) next.propertyEntries.push({ ...structuredClone(entry), id: randomUUID(), date: `${nextYear}-01-01`, description: "Opening valuation / Valutazione iniziale" });
  }
  for (const investment of next.investments) {
    const entry = latestEntry(current.investmentEntries, investment.id, "investmentId");
    if (entry) next.investmentEntries.push({ ...structuredClone(entry), id: randomUUID(), date: `${nextYear}-01-01`, description: "Opening valuation / Valutazione iniziale" });
  }
  next.meta.updatedAt = new Date().toISOString();
  return next;
}
