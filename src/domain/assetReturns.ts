import { propertyAnnualSummariesWithLateIncome } from "./annualHistory";
import { confirmedInvestmentEntries, investmentChildren, isRolloverOpeningValuation } from "./investments";
import type { FinanceData, Investment, InvestmentAnnualSummary, PropertyAnnualSummary } from "./models";

export type ReturnCoverage = "complete" | "partial" | "estimated" | "missing";
export type ReturnUnavailableReason = "insufficient-data" | "mixed-currency";

export type ReturnComponents = {
  kind: "investment";
  openingValue: number;
  endingValue: number;
  netFlows: number;
  weightedBase: number;
} | {
  kind: "rental";
  income: number;
  expenses: number;
  referenceValue: number;
} | {
  kind: "linked";
  periods: number;
};

export interface MonthlyReturnPoint {
  date: string;
  rate: number | null;
  coverage: Exclude<ReturnCoverage, "estimated">;
  components?: ReturnComponents;
}

export interface AnnualReturnPoint {
  year: number;
  rate: number;
  coverage: Exclude<ReturnCoverage, "missing">;
  partialPeriod: boolean;
  components?: ReturnComponents;
}

export interface AssetReturnSeries {
  monthly: MonthlyReturnPoint[];
  annual: AnnualReturnPoint[];
  currency?: string;
  unavailableReason?: ReturnUnavailableReason;
}

interface InvestmentPeriodMetrics {
  numerator: number;
  denominator: number;
  openingValue: number;
  endingValue: number;
  netFlows: number;
  coverage: "complete" | "partial";
}

interface InvestmentValueState {
  value: number;
  observationDate?: string;
}

const DAY_MS = 86_400_000;
const MAX_MONTHS = 240;
const EPSILON = 0.000_001;

function dateParts(date: string): [number, number, number] {
  return [Number(date.slice(0, 4)), Number(date.slice(5, 7)), Number(date.slice(8, 10))];
}

function dateSerial(date: string): number {
  const [year, month, day] = dateParts(date);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

function daysBetween(start: string, end: string): number {
  return dateSerial(end) - dateSerial(start);
}

function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

function monthEnd(date: string): string {
  const [year, month] = dateParts(date);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

function previousDay(date: string): string {
  return new Date((dateSerial(date) - 1) * DAY_MS).toISOString().slice(0, 10);
}

function addMonths(date: string, amount: number): string {
  const [year, month] = dateParts(date);
  return new Date(Date.UTC(year, month - 1 + amount, 1)).toISOString().slice(0, 10);
}

function monthSequence(start: string, end: string): string[] {
  if (start > end) return [];
  const months: string[] = [];
  for (let current = monthStart(start); current <= end && months.length < MAX_MONTHS; current = addMonths(current, 1)) {
    months.push(current);
  }
  return months;
}

function confirmedPropertyEntries(data: FinanceData, propertyId: string) {
  const plannedTransactionIds = new Set(data.transactions.filter((item) => item.planned).map((item) => item.id));
  return data.propertyEntries.filter((entry) => entry.propertyId === propertyId
    && (!entry.transactionId || !plannedTransactionIds.has(entry.transactionId)));
}

function returnLeaves(data: FinanceData, root: Investment): Investment[] {
  const children = investmentChildren(data, root.id);
  if (!children.length) return [root];
  return children.flatMap((child) => returnLeaves(data, child));
}

function investmentValueBefore(data: FinanceData, investment: Investment, date: string): InvestmentValueState {
  const entries = confirmedInvestmentEntries(data, investment.id)
    .filter((entry) => entry.date < date
      && (entry.kind === "contribution" || entry.kind === "withdrawal" || entry.kind === "valuation"))
    .map((entry) => ({
      date: entry.date,
      order: entry.kind === "contribution" ? 0 : entry.kind === "withdrawal" ? 1 : 2,
      id: entry.id,
      kind: entry.kind,
      amount: entry.amount,
      observationDate: entry.kind === "valuation" && !isRolloverOpeningValuation(entry) ? entry.date : undefined,
    }));
  const summaries = data.investmentAnnualSummaries
    .filter((summary) => summary.investmentId === investment.id && `${summary.year}-12-31` < date)
    .map((summary) => ({
      date: `${summary.year}-12-31`,
      order: 3,
      id: `summary-${summary.year}`,
      kind: "summary" as const,
      amount: summary.closingValue,
      observationDate: summary.closingValueObservedAt,
    }));
  const events = [...entries, ...summaries]
    .sort((left, right) => left.date.localeCompare(right.date) || left.order - right.order || left.id.localeCompare(right.id));
  let value = 0;
  let observationDate: string | undefined;
  for (const event of events) {
    if (event.kind === "contribution") value += event.amount;
    else if (event.kind === "withdrawal") value = Math.max(0, value - event.amount);
    else {
      value = event.amount;
      observationDate = event.observationDate;
    }
  }
  return { value, observationDate };
}

function investmentMonthMetrics(
  data: FinanceData,
  investment: Investment,
  start: string,
  periodEnd: string,
): InvestmentPeriodMetrics | undefined {
  const entries = confirmedInvestmentEntries(data, investment.id);
  const valuation = entries
    .filter((entry) => entry.kind === "valuation"
      && !isRolloverOpeningValuation(entry)
      && entry.date >= start
      && entry.date <= periodEnd)
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id))
    .at(-1);
  if (!valuation) return undefined;

  const opening = investmentValueBefore(data, investment, start);
  const openedAtPeriodStart = investment.openedAt === start;
  const movements = entries.filter((entry) => (entry.kind === "contribution" || entry.kind === "withdrawal")
    && entry.date >= start && entry.date <= valuation.date);
  const periodDays = daysBetween(start, valuation.date) + 1;
  let netFlows = 0;
  let weightedFlows = 0;
  for (const movement of movements) {
    const signedAmount = movement.kind === "contribution" ? movement.amount : -movement.amount;
    const dayNumber = daysBetween(start, movement.date) + 1;
    const weight = Math.max(0, (periodDays - dayNumber) / periodDays);
    netFlows += signedAmount;
    weightedFlows += signedAmount * weight;
  }
  const denominator = opening.value + weightedFlows;
  if (denominator <= EPSILON) return undefined;
  const completeOpening = opening.observationDate === previousDay(start) || openedAtPeriodStart;
  return {
    numerator: valuation.amount - opening.value - netFlows,
    denominator,
    openingValue: opening.value,
    endingValue: valuation.amount,
    netFlows,
    coverage: valuation.date === monthEnd(start) && completeOpening ? "complete" : "partial",
  };
}

function currentInvestmentSummary(data: FinanceData, investment: Investment, asOf: string): InvestmentAnnualSummary | undefined {
  const year = data.meta.activeYear;
  if (!asOf.startsWith(String(year))) return undefined;
  const entries = confirmedInvestmentEntries(data, investment.id)
    .filter((entry) => entry.date.startsWith(String(year)) && entry.date <= asOf);
  const valuation = entries
    .filter((entry) => entry.kind === "valuation" && !isRolloverOpeningValuation(entry))
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id))
    .at(-1);
  if (!valuation) return undefined;
  const measuredEntries = entries.filter((entry) => entry.date <= valuation.date);
  return {
    investmentId: investment.id,
    year,
    closingValue: valuation.amount,
    contributions: measuredEntries.filter((entry) => entry.kind === "contribution").reduce((sum, entry) => sum + entry.amount, 0),
    withdrawals: measuredEntries.filter((entry) => entry.kind === "withdrawal").reduce((sum, entry) => sum + entry.amount, 0),
    closingValueObservedAt: valuation.date,
  };
}

function summariesForInvestment(data: FinanceData, investment: Investment, asOf: string): InvestmentAnnualSummary[] {
  const byYear = new Map(data.investmentAnnualSummaries
    .filter((item) => item.investmentId === investment.id)
    .map((item) => [item.year, item]));
  const current = currentInvestmentSummary(data, investment, asOf);
  if (current) byYear.set(current.year, current);
  return [...byYear.values()].sort((left, right) => left.year - right.year);
}

function annualInvestmentEstimates(
  data: FinanceData,
  leaves: Investment[],
  asOf: string,
): AnnualReturnPoint[] {
  const histories = new Map(leaves.map((leaf) => [leaf.id, summariesForInvestment(data, leaf, asOf)]));
  const years = [...new Set([...histories.values()].flatMap((history) => history.map((item) => item.year)))].sort();
  const points: AnnualReturnPoint[] = [];
  for (const year of years) {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    const relevant = leaves.filter((leaf) => leaf.openedAt <= yearEnd && (!leaf.closedAt || leaf.closedAt >= yearStart));
    const rows = relevant.map((leaf) => histories.get(leaf.id)?.find((item) => item.year === year));
    if (!relevant.length || rows.some((row) => !row)) continue;
    if (year !== data.meta.activeYear && rows.some((row) => !row!.closingValueObservedAt)) continue;
    let openingValue = 0;
    let missingOpeningValue = false;
    for (const leaf of relevant) {
      const previous = histories.get(leaf.id)?.filter((item) => item.year < year).at(-1);
      if (previous) openingValue += previous.closingValue;
      else if (leaf.openedAt < yearStart) missingOpeningValue = true;
    }
    if (missingOpeningValue) continue;
    const closingValue = rows.reduce((sum, row) => sum + row!.closingValue, 0);
    const contributions = rows.reduce((sum, row) => sum + row!.contributions, 0);
    const withdrawals = rows.reduce((sum, row) => sum + row!.withdrawals, 0);
    const netFlows = contributions - withdrawals;
    const denominator = openingValue + netFlows / 2;
    if (denominator <= EPSILON) continue;
    const rate = (closingValue - openingValue - netFlows) / denominator;
    if (!Number.isFinite(rate)) continue;
    points.push({
      year,
      rate,
      coverage: "estimated",
      partialPeriod: (year === data.meta.activeYear && asOf < yearEnd)
        || relevant.some((leaf) => leaf.openedAt > yearStart || (leaf.closedAt !== undefined && leaf.closedAt < yearEnd))
        || rows.some((row) => row!.closingValueObservedAt !== yearEnd),
      components: {
        kind: "investment",
        openingValue,
        endingValue: closingValue,
        netFlows,
        weightedBase: denominator,
      },
    });
  }
  return points;
}

function persistedAnnualInvestmentReturns(data: FinanceData, root: Investment): AnnualReturnPoint[] {
  return data.investmentAnnualSummaries
    .filter((summary) => summary.investmentId === root.id
      && summary.returnRate !== undefined
      && summary.returnMethod !== undefined
      && summary.returnCoverage !== undefined)
    .map((summary) => ({
      year: summary.year,
      rate: summary.returnRate!,
      coverage: summary.returnCoverage!,
      partialPeriod: summary.returnPartialPeriod ?? summary.returnCoverage !== "complete",
    }));
}

function exactAnnualInvestmentReturns(
  data: FinanceData,
  leaves: Investment[],
  monthly: MonthlyReturnPoint[],
  asOf: string,
): AnnualReturnPoint[] {
  const points: AnnualReturnPoint[] = [];
  const years = [...new Set(monthly.map((item) => Number(item.date.slice(0, 4))))].sort();
  for (const year of years) {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    const firstOpening = leaves
      .filter((leaf) => leaf.openedAt <= yearEnd && (!leaf.closedAt || leaf.closedAt >= yearStart))
      .map((leaf) => leaf.openedAt > yearStart ? leaf.openedAt : yearStart)
      .sort()[0];
    if (!firstOpening) continue;
    const expectedStart = monthStart(firstOpening);
    const expectedEnd = monthStart(asOf < yearEnd ? asOf : yearEnd);
    const expectedMonths = monthSequence(expectedStart, expectedEnd).filter((date) => date.startsWith(String(year)));
    const yearPoints = expectedMonths.map((date) => monthly.find((point) => point.date === date));
    if (!expectedMonths.length || yearPoints.some((point) => !point || point.rate === null || point.coverage !== "complete")) continue;
    const rate = yearPoints.reduce((linked, point) => linked * (1 + point!.rate!), 1) - 1;
    points.push({
      year,
      rate,
      coverage: expectedStart === yearStart && expectedEnd === monthStart(yearEnd) ? "complete" : "partial",
      partialPeriod: expectedStart !== yearStart || expectedEnd !== monthStart(yearEnd),
      components: { kind: "linked", periods: yearPoints.length },
    });
  }
  return points;
}

export function investmentReturnSeries(
  data: FinanceData,
  root: Investment,
  asOf = `${data.meta.activeYear}-12-31`,
): AssetReturnSeries {
  const leaves = returnLeaves(data, root);
  if (!leaves.length) return { monthly: [], annual: [], unavailableReason: "insufficient-data" };
  if (new Set(leaves.map((item) => item.currency)).size > 1) {
    return { monthly: [], annual: [], unavailableReason: "mixed-currency" };
  }
  const effectiveEnd = [asOf, `${data.meta.activeYear}-12-31`, root.closedAt ?? "9999-12-31"]
    .sort()[0];
  const valuationDates = leaves.flatMap((leaf) => confirmedInvestmentEntries(data, leaf.id)
    .filter((entry) => entry.kind === "valuation" && !isRolloverOpeningValuation(entry) && entry.date <= effectiveEnd)
    .map((entry) => entry.date));
  const earliestValuation = valuationDates.sort()[0];
  let monthly: MonthlyReturnPoint[] = [];
  if (earliestValuation) {
    const uncappedStart = monthStart(earliestValuation);
    const cappedStart = addMonths(monthStart(effectiveEnd), -(MAX_MONTHS - 1));
    const start = uncappedStart > cappedStart ? uncappedStart : cappedStart;
    monthly = monthSequence(start, effectiveEnd).map((date) => {
      const end = monthEnd(date) < effectiveEnd ? monthEnd(date) : effectiveEnd;
      const relevant = leaves.filter((leaf) => leaf.openedAt <= end && (!leaf.closedAt || leaf.closedAt >= date));
      const metrics = relevant.map((leaf) => investmentMonthMetrics(data, leaf, date, end));
      if (!relevant.length || metrics.some((item) => !item)) return { date, rate: null, coverage: "missing" as const };
      const numerator = metrics.reduce((sum, item) => sum + item!.numerator, 0);
      const denominator = metrics.reduce((sum, item) => sum + item!.denominator, 0);
      if (denominator <= EPSILON) return { date, rate: null, coverage: "missing" as const };
      return {
        date,
        rate: numerator / denominator,
        coverage: metrics.every((item) => item!.coverage === "complete") ? "complete" as const : "partial" as const,
        components: {
          kind: "investment" as const,
          openingValue: metrics.reduce((sum, item) => sum + item!.openingValue, 0),
          endingValue: metrics.reduce((sum, item) => sum + item!.endingValue, 0),
          netFlows: metrics.reduce((sum, item) => sum + item!.netFlows, 0),
          weightedBase: denominator,
        },
      };
    });
  }
  const estimated = annualInvestmentEstimates(data, leaves, effectiveEnd);
  const exact = exactAnnualInvestmentReturns(data, leaves, monthly, effectiveEnd);
  const persisted = persistedAnnualInvestmentReturns(data, root);
  const annualByYear = new Map(estimated.map((point) => [point.year, point]));
  persisted.forEach((point) => annualByYear.set(point.year, point));
  exact.forEach((point) => annualByYear.set(point.year, point));
  const annual = [...annualByYear.values()].sort((left, right) => left.year - right.year);
  return {
    monthly,
    annual,
    currency: leaves[0].currency,
    unavailableReason: monthly.some((point) => point.rate !== null) || annual.length ? undefined : "insufficient-data",
  };
}

function propertyReferenceValue(data: FinanceData, propertyId: string, date: string): number | undefined {
  const property = data.properties.find((item) => item.id === propertyId);
  if (!property) return undefined;
  const observations = [
    ...(property.purchaseDate && property.purchasePrice > 0
      ? [{ date: property.purchaseDate, order: 0, value: property.purchasePrice }]
      : []),
    ...data.propertyAnnualSummaries
      .filter((item) => item.propertyId === propertyId)
      .map((item) => ({ date: `${item.year}-12-31`, order: 1, value: item.closingValue })),
    ...confirmedPropertyEntries(data, propertyId)
      .filter((item) => item.kind === "valuation")
      .map((item) => ({ date: item.date, order: 2, value: item.amount })),
  ].filter((item) => item.date <= date)
    .sort((left, right) => left.date.localeCompare(right.date) || left.order - right.order);
  return observations.at(-1)?.value
    ?? (!property.purchaseDate && property.purchasePrice > 0 ? property.purchasePrice : undefined);
}

function currentPropertySummary(data: FinanceData, propertyId: string, asOf: string): PropertyAnnualSummary | undefined {
  const year = data.meta.activeYear;
  if (!asOf.startsWith(String(year))) return undefined;
  const property = data.properties.find((item) => item.id === propertyId);
  if (!property) return undefined;
  const entries = confirmedPropertyEntries(data, propertyId).filter((entry) => entry.date <= asOf);
  const incomeEntries = entries.filter((entry) => entry.kind === "income"
    && (entry.dueDate ?? entry.date).startsWith(String(year))
    && (entry.dueDate ?? entry.date) <= asOf);
  const expenseEntries = entries.filter((entry) => entry.kind === "expense" && entry.date.startsWith(String(year)));
  return {
    propertyId,
    year,
    income: incomeEntries.reduce((sum, entry) => sum + entry.amount, 0),
    expenses: expenseEntries.reduce((sum, entry) => sum + entry.amount, 0),
    closingValue: propertyReferenceValue(data, propertyId, asOf) ?? 0,
    electricityKwh: 0,
    gasCubicMeters: 0,
    waterCubicMeters: 0,
    electricityCost: 0,
    gasCost: 0,
    waterCost: 0,
    phoneInternetCost: 0,
    condominiumCost: 0,
  };
}

export function rentalPropertyReturnSeries(
  data: FinanceData,
  propertyId: string,
  asOf = `${data.meta.activeYear}-12-31`,
): AssetReturnSeries {
  const property = data.properties.find((item) => item.id === propertyId);
  if (!property || property.usage !== "rental") {
    return { monthly: [], annual: [], unavailableReason: "insufficient-data" };
  }
  const effectiveEnd = [asOf, `${data.meta.activeYear}-12-31`, property.closedAt ?? "9999-12-31"].sort()[0];
  const entries = confirmedPropertyEntries(data, propertyId);
  const activeYearStart = `${data.meta.activeYear}-01-01`;
  const uncappedStart = property.purchaseDate && property.purchaseDate > activeYearStart
    ? monthStart(property.purchaseDate)
    : activeYearStart;
  const cappedStart = addMonths(monthStart(effectiveEnd), -(MAX_MONTHS - 1));
  const start = uncappedStart > cappedStart ? uncappedStart : cappedStart;
  const monthly = monthSequence(start, effectiveEnd).map((date): MonthlyReturnPoint => {
    const end = monthEnd(date) < effectiveEnd ? monthEnd(date) : effectiveEnd;
    const referenceValue = propertyReferenceValue(data, propertyId, end);
    if (!referenceValue || referenceValue < EPSILON) return { date, rate: null, coverage: "missing" };
    const monetary = entries.filter((entry) => {
      if (entry.kind !== "income" && entry.kind !== "expense") return false;
      const competenceDate = entry.kind === "income" ? entry.dueDate ?? entry.date : entry.date;
      return competenceDate >= date && competenceDate <= end;
    });
    const income = monetary.filter((entry) => entry.kind === "income").reduce((sum, entry) => sum + entry.amount, 0);
    const expenses = monetary.filter((entry) => entry.kind === "expense").reduce((sum, entry) => sum + entry.amount, 0);
    return {
      date,
      rate: (income - expenses) / referenceValue,
      coverage: end === monthEnd(date) ? "complete" : "partial",
      components: { kind: "rental", income, expenses, referenceValue },
    };
  });

  const byYear = new Map(propertyAnnualSummariesWithLateIncome(data)
    .filter((item) => item.propertyId === propertyId)
    .map((item) => [item.year, item]));
  const current = currentPropertySummary(data, propertyId, effectiveEnd);
  if (current) byYear.set(current.year, current);
  const annual = [...byYear.values()]
    .filter((item) => item.closingValue > EPSILON)
    .sort((left, right) => left.year - right.year)
    .map((item): AnnualReturnPoint => {
      const yearStart = `${item.year}-01-01`;
      const yearEnd = `${item.year}-12-31`;
      const partialPeriod = (property.purchaseDate !== undefined && property.purchaseDate > yearStart && property.purchaseDate <= yearEnd)
        || (property.closedAt !== undefined && property.closedAt >= yearStart && property.closedAt < yearEnd)
        || (item.year === data.meta.activeYear && effectiveEnd < yearEnd);
      return {
        year: item.year,
        rate: (item.income - item.expenses) / item.closingValue,
        coverage: partialPeriod ? "partial" : "complete",
        partialPeriod,
        components: { kind: "rental", income: item.income, expenses: item.expenses, referenceValue: item.closingValue },
      };
    });
  return {
    monthly,
    annual,
    currency: "EUR",
    unavailableReason: monthly.some((point) => point.rate !== null) || annual.length ? undefined : "insufficient-data",
  };
}
