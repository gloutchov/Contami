import type { InvestmentType } from "./models";

export const DEFAULT_INVESTMENT_TYPES: InvestmentType[] = [
  { id: "10000000-0000-4000-8000-000000000001", nameIt: "Pensione Integrativa", nameEn: "Pension fund", code: "pension", active: true },
  { id: "10000000-0000-4000-8000-000000000002", nameIt: "Titoli", nameEn: "Securities", code: "stock", active: true },
  { id: "10000000-0000-4000-8000-000000000003", nameIt: "Fondi", nameEn: "Funds", code: "fund", active: true },
  { id: "10000000-0000-4000-8000-000000000004", nameIt: "Fogli", nameEn: "Savings plans", code: "savings", active: true },
  { id: "10000000-0000-4000-8000-000000000005", nameIt: "ETF", nameEn: "ETFs", code: "etf", active: true },
  { id: "10000000-0000-4000-8000-000000000006", nameIt: "Obbligazioni", nameEn: "Bonds", code: "bond", active: true },
  { id: "10000000-0000-4000-8000-000000000007", nameIt: "Altro", nameEn: "Other", code: "other", active: true },
];

export function investmentTypeIdForKind(kind: string): string {
  const code = kind === "pension" ? "pension" : kind === "stock" ? "stock" : kind === "bond" ? "bond" : kind === "savings" ? "savings" : kind === "etf" ? "etf" : kind === "fund" ? "fund" : "other";
  return DEFAULT_INVESTMENT_TYPES.find((item) => item.code === code)!.id;
}
