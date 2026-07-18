import type { FinanceData } from "../../domain/models";

export interface WorkbookTableDefinition {
  key: Exclude<keyof FinanceData, "meta">;
  sheet: string;
  columns: string[];
  dateColumns?: string[];
}

export const WORKBOOK_TABLES: WorkbookTableDefinition[] = [
  { key: "categories", sheet: "Categories", columns: ["id", "nameIt", "nameEn", "kind", "active"] },
  { key: "paymentMethods", sheet: "Payment Methods", columns: ["id", "name", "kind", "active"] },
  { key: "accounts", sheet: "Accounts", columns: ["id", "name", "kind", "currency", "openingBalance", "active", "openedAt", "closedAt", "notes"], dateColumns: ["openedAt", "closedAt"] },
  { key: "transactions", sheet: "Transactions", columns: ["id", "date", "description", "categoryId", "paymentMethodId", "accountId", "kind", "amount", "currency", "recurringId", "notes", "createdAt", "updatedAt"], dateColumns: ["date"] },
  { key: "properties", sheet: "Properties", columns: ["id", "name", "kind", "ownershipShare", "purchaseDate", "purchasePrice", "active", "closedAt", "notes"], dateColumns: ["purchaseDate", "closedAt"] },
  { key: "propertyEntries", sheet: "Property Entries", columns: ["id", "propertyId", "date", "kind", "category", "description", "amount", "quantity", "unit", "paymentMethodId", "notes"], dateColumns: ["date"] },
  { key: "investments", sheet: "Investments", columns: ["id", "name", "kind", "provider", "currency", "active", "openedAt", "closedAt", "notes"], dateColumns: ["openedAt", "closedAt"] },
  { key: "investmentEntries", sheet: "Investment Entries", columns: ["id", "investmentId", "date", "kind", "amount", "description", "paymentMethodId", "notes"], dateColumns: ["date"] },
  { key: "recurringItems", sheet: "Recurring Items", columns: ["id", "name", "kind", "amount", "frequency", "categoryId", "paymentMethodId", "nextDueDate", "endDate", "remainingInstallments", "active", "closedAt", "notes"], dateColumns: ["nextDueDate", "endDate", "closedAt"] },
  { key: "sharedExpenses", sheet: "Shared Expenses", columns: ["id", "date", "description", "categoryId", "paymentMethodId", "amount", "ownerShare", "partnerShare", "paidBy", "settled", "notes"], dateColumns: ["date"] },
  { key: "annualSummaries", sheet: "Annual Summaries", columns: ["year", "income", "expenses", "netCashFlow", "closingNetWorth"] },
];

export const WORKBOOK_SCHEMA_VERSION = 1;
