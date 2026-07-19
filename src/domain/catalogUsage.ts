import type { FinanceData } from "./models";

export type CatalogUsageKind = "category" | "paymentMethod";

export function catalogUsageCount(data: FinanceData, kind: CatalogUsageKind, id: string): number {
  const field = kind === "category" ? "categoryId" : "paymentMethodId";
  const count = (items: ReadonlyArray<{ categoryId?: string; paymentMethodId?: string }>) => items.filter((item) => item[field] === id).length;
  const periodicReferences = data.investments.filter((item) => (
    kind === "category" ? item.periodicCategoryId === id : item.periodicPaymentMethodId === id
  )).length;
  return count(data.transactions)
    + count(data.propertyEntries)
    + count(data.investmentEntries)
    + count(data.recurringItems)
    + count(data.sharedExpenses)
    + count(data.vehicleEntries)
    + periodicReferences;
}
