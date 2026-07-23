import type { InvestmentType, TaxType } from "./models";

export const DEFAULT_INVESTMENT_TYPES: InvestmentType[] = [
  { id: "10000000-0000-4000-8000-000000000001", nameIt: "Pensione Integrativa", nameEn: "Pension fund", code: "pension", active: true },
  { id: "10000000-0000-4000-8000-000000000002", nameIt: "Titoli", nameEn: "Securities", code: "stock", active: true },
  { id: "10000000-0000-4000-8000-000000000003", nameIt: "Fondi", nameEn: "Funds", code: "fund", active: true },
  { id: "10000000-0000-4000-8000-000000000004", nameIt: "Fogli", nameEn: "Savings plans", code: "savings", active: true },
  { id: "10000000-0000-4000-8000-000000000005", nameIt: "ETF", nameEn: "ETFs", code: "etf", active: true },
  { id: "10000000-0000-4000-8000-000000000006", nameIt: "Obbligazioni", nameEn: "Bonds", code: "bond", active: true },
  { id: "10000000-0000-4000-8000-000000000007", nameIt: "Altro", nameEn: "Other", code: "other", active: true },
];

export const DEFAULT_TAX_TYPES: TaxType[] = [
  { id: "20000000-0000-4000-8000-000000000001", name: "Canone TV", appliesTo: "all", installments: 1, active: true },
  { id: "20000000-0000-4000-8000-000000000002", name: "IMU", appliesTo: "all", installments: 2, active: true },
  { id: "20000000-0000-4000-8000-000000000003", name: "TARI", appliesTo: "all", installments: 2, active: true },
];

export function taxTypeIdForLegacyDetailKind(detailKind: string): string | undefined {
  const index = detailKind === "tax_tv_licence" ? 0 : detailKind === "tax_imu" ? 1 : detailKind === "tax_tari" ? 2 : -1;
  return index >= 0 ? DEFAULT_TAX_TYPES[index].id : undefined;
}

export function investmentTypeIdForKind(kind: string): string {
  const code = kind === "pension" ? "pension" : kind === "stock" ? "stock" : kind === "bond" ? "bond" : kind === "savings" ? "savings" : kind === "etf" ? "etf" : kind === "fund" ? "fund" : "other";
  return DEFAULT_INVESTMENT_TYPES.find((item) => item.code === code)!.id;
}
