import { createPropertyAnnualSummaries } from "../../domain/annualHistory";
import type { FinanceData, PropertyEntry } from "../../domain/models";

export function propertyHistory(data: FinanceData, propertyId: string) {
  const current = createPropertyAnnualSummaries(data).find((item) => item.propertyId === propertyId);
  const byYear = new Map(data.propertyAnnualSummaries.filter((item) => item.propertyId === propertyId).map((item) => [item.year, item]));
  const hasCurrentEntries = data.propertyEntries.some((item) => item.propertyId === propertyId && item.date.startsWith(String(data.meta.activeYear)));
  if (current && hasCurrentEntries) byYear.set(current.year, current);
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

export const propertyConsumptionHistory = propertyHistory;

export function propertyEntryMonths(entries: PropertyEntry[]): string[] {
  return [...new Set(entries.map((item) => item.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
}

export function filterPropertyEntries(entries: PropertyEntry[], month: string, search: string): PropertyEntry[] {
  const query = search.trim().toLocaleLowerCase();
  return entries.filter((item) => (!month || item.date.startsWith(month))
    && (!query || `${item.description} ${item.category}`.toLocaleLowerCase().includes(query)));
}
