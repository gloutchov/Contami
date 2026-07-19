import type { FinanceData, Investment } from "./models";

export function pensionInvestmentIds(data: FinanceData): Set<string> {
  const pensionTypeIds = new Set(data.investmentTypes.filter((type) => type.code === "pension").map((type) => type.id));
  const ids = new Set(data.investments
    .filter((item) => item.kind === "pension" || (item.typeId && pensionTypeIds.has(item.typeId)))
    .map((item) => item.id));

  for (let pass = 0; pass < data.investments.length; pass += 1) {
    let changed = false;
    for (const item of data.investments) {
      if (item.parentInvestmentId && ids.has(item.parentInvestmentId) && !ids.has(item.id)) {
        ids.add(item.id);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return ids;
}

export function isPensionInvestment(data: FinanceData, item: Investment): boolean {
  return pensionInvestmentIds(data).has(item.id);
}

export function investmentChildren(data: FinanceData, investmentId: string, activeOnly = false): Investment[] {
  return data.investments.filter((item) => item.parentInvestmentId === investmentId && (!activeOnly || item.active));
}

export function latestInvestmentValue(data: FinanceData, investmentId: string): number {
  return [...data.investmentEntries]
    .filter((entry) => entry.investmentId === investmentId && entry.kind === "valuation")
    .sort((left, right) => right.date.localeCompare(left.date))[0]?.amount ?? 0;
}

export function investmentPositionValue(data: FinanceData, investment: Investment): number {
  const children = investmentChildren(data, investment.id);
  return children.length
    ? children.filter((child) => child.active).reduce((sum, child) => sum + investmentPositionValue(data, child), 0)
    : latestInvestmentValue(data, investment.id);
}

export function pensionPlans(data: FinanceData): Investment[] {
  const pensionIds = pensionInvestmentIds(data);
  return data.investments.filter((item) => pensionIds.has(item.id)
    && (!item.parentInvestmentId || !pensionIds.has(item.parentInvestmentId)));
}

export function pensionCompartments(data: FinanceData, pensionId?: string): Investment[] {
  const pensionIds = pensionInvestmentIds(data);
  return data.investments.filter((item) => pensionIds.has(item.id)
    && Boolean(item.parentInvestmentId)
    && (!pensionId || item.parentInvestmentId === pensionId));
}

export function selectableFinancialPositions(data: FinanceData): Investment[] {
  const pensionIds = pensionInvestmentIds(data);
  return data.investments.filter((item) => {
    if (!item.active || investmentChildren(data, item.id).length) return false;
    if (!pensionIds.has(item.id)) return true;
    return Boolean(item.parentInvestmentId && pensionIds.has(item.parentInvestmentId));
  });
}

export function regularInvestments(data: FinanceData): Investment[] {
  const pensionIds = pensionInvestmentIds(data);
  return data.investments.filter((item) => !pensionIds.has(item.id));
}

export function portfolioValues(data: FinanceData): { investments: number; pensions: number; combined: number } {
  const pensionIds = pensionInvestmentIds(data);
  const leaves = data.investments.filter((item) => item.active && !investmentChildren(data, item.id).length);
  const pensions = leaves.filter((item) => pensionIds.has(item.id)).reduce((sum, item) => sum + latestInvestmentValue(data, item.id), 0);
  const investments = leaves.filter((item) => !pensionIds.has(item.id)).reduce((sum, item) => sum + latestInvestmentValue(data, item.id), 0);
  return { investments, pensions, combined: investments + pensions };
}
