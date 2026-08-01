import type { FinanceData, Investment } from "./models";

export function pensionInvestmentIds(data: FinanceData): Set<string> {
  const pensionTypeIds = new Set(data.investmentTypes.filter((type) => type.code === "pension").map((type) => type.id));
  const ids = new Set(data.investments
    .filter((item) => item.kind === "pension" || (item.typeId && pensionTypeIds.has(item.typeId)))
    .map((item) => item.id));
  const childrenByParent = new Map<string, string[]>();
  for (const item of data.investments) {
    if (!item.parentInvestmentId) continue;
    const children = childrenByParent.get(item.parentInvestmentId) ?? [];
    children.push(item.id);
    childrenByParent.set(item.parentInvestmentId, children);
  }
  const pending = [...ids];
  for (let index = 0; index < pending.length; index += 1) {
    for (const childId of childrenByParent.get(pending[index]) ?? []) {
      if (ids.has(childId)) continue;
      ids.add(childId);
      pending.push(childId);
    }
  }
  return ids;
}

export function isPensionInvestment(data: FinanceData, item: Investment): boolean {
  return pensionInvestmentIds(data).has(item.id);
}

export function investmentChildren(data: FinanceData, investmentId: string, activeOnly = false): Investment[] {
  return data.investments.filter((item) => item.parentInvestmentId === investmentId && (!activeOnly || item.active));
}

export function confirmedInvestmentEntries(data: FinanceData, investmentId?: string) {
  const plannedTransactionIds = new Set(data.transactions.filter((item) => item.planned).map((item) => item.id));
  return data.investmentEntries.filter((entry) => (!investmentId || entry.investmentId === investmentId)
    && (!entry.transactionId || !plannedTransactionIds.has(entry.transactionId)));
}

export function latestInvestmentValue(data: FinanceData, investmentId: string): number {
  const order = { contribution: 0, withdrawal: 1, valuation: 2 } as const;
  return confirmedInvestmentEntries(data, investmentId)
    .sort((left, right) => left.date.localeCompare(right.date) || order[left.kind] - order[right.kind])
    .reduce((value, entry) => {
      if (entry.kind === "contribution") return value + entry.amount;
      if (entry.kind === "withdrawal") return Math.max(0, value - entry.amount);
      return entry.amount;
    }, 0);
}

export function investmentInvestedCapital(data: FinanceData, investmentId: string): number {
  return Math.max(0, confirmedInvestmentEntries(data, investmentId).reduce((capital, entry) => {
    if (entry.kind === "contribution") return capital + entry.amount;
    if (entry.kind === "withdrawal") return capital - entry.amount;
    return capital;
  }, 0));
}

export function investmentPositionValue(data: FinanceData, investment: Investment): number {
  const children = investmentChildren(data, investment.id);
  return children.length
    ? children.filter((child) => child.active).reduce((sum, child) => sum + investmentPositionValue(data, child), 0)
    : latestInvestmentValue(data, investment.id);
}

export function investmentPositionInvestedCapital(data: FinanceData, investment: Investment): number {
  const children = investmentChildren(data, investment.id);
  return children.length
    ? children.filter((child) => child.active).reduce((sum, child) => sum + investmentPositionInvestedCapital(data, child), 0)
    : investmentInvestedCapital(data, investment.id);
}

export function investmentPositionIsLoss(data: FinanceData, investment: Investment): boolean {
  return investmentPositionValue(data, investment) < investmentPositionInvestedCapital(data, investment);
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
  const parents = new Set(data.investments.flatMap((item) => item.parentInvestmentId ? [item.parentInvestmentId] : []));
  const plannedTransactionIds = new Set(data.transactions.filter((item) => item.planned).map((item) => item.id));
  const entriesByInvestment = new Map<string, typeof data.investmentEntries>();
  for (const entry of data.investmentEntries) {
    if (entry.transactionId && plannedTransactionIds.has(entry.transactionId)) continue;
    const entries = entriesByInvestment.get(entry.investmentId) ?? [];
    entries.push(entry);
    entriesByInvestment.set(entry.investmentId, entries);
  }
  const order = { contribution: 0, withdrawal: 1, valuation: 2 } as const;
  const valueByInvestment = new Map<string, number>();
  for (const [investmentId, entries] of entriesByInvestment) {
    const value = entries.sort((left, right) => left.date.localeCompare(right.date) || order[left.kind] - order[right.kind])
      .reduce((current, entry) => {
        if (entry.kind === "contribution") return current + entry.amount;
        if (entry.kind === "withdrawal") return Math.max(0, current - entry.amount);
        return entry.amount;
      }, 0);
    valueByInvestment.set(investmentId, value);
  }
  const leaves = data.investments.filter((item) => item.active && !parents.has(item.id));
  const pensions = leaves.filter((item) => pensionIds.has(item.id)).reduce((sum, item) => sum + (valueByInvestment.get(item.id) ?? 0), 0);
  const investments = leaves.filter((item) => !pensionIds.has(item.id)).reduce((sum, item) => sum + (valueByInvestment.get(item.id) ?? 0), 0);
  return { investments, pensions, combined: investments + pensions };
}
