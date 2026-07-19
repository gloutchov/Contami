import { DEFAULT_INVESTMENT_TYPES, investmentTypeIdForKind } from "./catalogDefaults";
import { financeDataSchema, type FinanceData } from "./models";

type RawRecord = Record<string, unknown>;

function list(value: unknown): RawRecord[] {
  return Array.isArray(value) ? value.filter((item): item is RawRecord => Boolean(item) && typeof item === "object") : [];
}

function compatibleCategoryId(categories: RawRecord[], kind: "income" | "expense", name?: unknown): string {
  const normalized = typeof name === "string" ? name.trim().toLocaleLowerCase() : "";
  const named = categories.find((item) => [item.nameIt, item.nameEn].some((candidate) => typeof candidate === "string" && candidate.trim().toLocaleLowerCase() === normalized));
  const fallback = categories.find((item) => item.kind === kind || item.kind === "both");
  const id = named?.id ?? fallback?.id;
  if (typeof id !== "string") throw new Error("INVALID_WORKBOOK_SCHEMA");
  return id;
}

export function migrateFinanceData(rawValue: unknown): FinanceData {
  if (!rawValue || typeof rawValue !== "object") throw new Error("INVALID_WORKBOOK_SCHEMA");
  const raw = structuredClone(rawValue) as RawRecord;
  const meta = raw.meta as RawRecord | undefined;
  const version = Number(meta?.schemaVersion);
  if (version === 3) return financeDataSchema.parse(raw);
  if ((version !== 1 && version !== 2) || !meta) throw new Error("INVALID_WORKBOOK_SCHEMA");

  if (version === 1) {
    const categories = list(raw.categories);
    raw.investmentTypes = structuredClone(DEFAULT_INVESTMENT_TYPES);
    raw.properties = list(raw.properties).map((item) => ({ usage: "other", address: "", ...item }));
    raw.propertyEntries = list(raw.propertyEntries).map((item) => {
      const kind = item.kind === "income" ? "income" : "expense";
      return {
        ...item,
        categoryId: item.kind === "income" || item.kind === "expense" ? compatibleCategoryId(categories, kind, item.category) : undefined,
        isCommonExpense: false,
      };
    });
    raw.investments = list(raw.investments).map((item) => ({ ...item, typeId: investmentTypeIdForKind(String(item.kind)) }));
    raw.investmentEntries = list(raw.investmentEntries).map((item) => {
      const legacyKind = String(item.kind);
      const kind = legacyKind === "valuation" ? "valuation" : legacyKind === "withdrawal" || legacyKind === "income" ? "withdrawal" : "contribution";
      return {
        ...item,
        kind,
        categoryId: kind === "valuation" ? undefined : compatibleCategoryId(categories, kind === "withdrawal" ? "income" : "expense", "Investimenti"),
      };
    });
    raw.recurringItems = list(raw.recurringItems).map((item) => ({ direction: "expense", ...item }));
    raw.sharedExpenses = list(raw.sharedExpenses);
    raw.annualSummaries = list(raw.annualSummaries).map((item) => ({
      ...item,
      liquidBalance: 0,
      propertyValue: 0,
      investmentValue: Math.max(0, Number(item.closingNetWorth) || 0),
      monthlyRecurring: 0,
    }));
  }
  raw.transactions = list(raw.transactions).map((item) => ({ ...item }));
  raw.recurringItems = list(raw.recurringItems).map((item) => ({ ...item }));
  raw.vehicles = [];
  raw.vehicleEntries = [];
  raw.propertyAnnualSummaries = [];
  raw.investmentAnnualSummaries = [];
  raw.vehicleAnnualSummaries = [];
  raw.annualSummaries = list(raw.annualSummaries).map((item) => ({ pensionValue: 0, vehicleCosts: 0, ...item }));
  meta.schemaVersion = 3;
  return financeDataSchema.parse(raw);
}
