import { createInvestmentAnnualSummaries } from "../../domain/annualHistory";
import { confirmedInvestmentEntries, investmentChildren } from "../../domain/investments";
import type { FinanceData } from "../../domain/models";

export interface InvestmentHistoryPoint {
  year: number;
  investedValue: number;
  closingValue: number;
  contributions: number;
  withdrawals: number;
}

export interface InvestmentTimelinePoint {
  date: string;
  investedValue: number;
  closingValue: number;
}

function ownHistory(data: FinanceData, investmentId: string): InvestmentHistoryPoint[] {
  const current = createInvestmentAnnualSummaries(data).find((item) => item.investmentId === investmentId);
  const byYear = new Map(data.investmentAnnualSummaries.filter((item) => item.investmentId === investmentId).map((item) => [item.year, item]));
  const hasCurrentEntries = confirmedInvestmentEntries(data, investmentId).some((item) => item.date.startsWith(String(data.meta.activeYear)));
  if (current && hasCurrentEntries) byYear.set(current.year, current);
  let investedValue = 0;
  return [...byYear.values()].sort((a, b) => a.year - b.year).map((item) => {
    investedValue = Math.max(0, investedValue + item.contributions - item.withdrawals);
    return { ...item, investedValue };
  });
}

export function investmentValueHistory(data: FinanceData, investmentId: string): InvestmentHistoryPoint[] {
  const children = investmentChildren(data, investmentId);
  if (!children.length) return ownHistory(data, investmentId);
  const childHistories = children.map((child) => investmentValueHistory(data, child.id));
  const years = [...new Set(childHistories.flatMap((history) => history.map((item) => item.year)))].sort((a, b) => a - b);
  return years.map((year) => {
    const point = { year, investedValue: 0, closingValue: 0, contributions: 0, withdrawals: 0 };
    for (const history of childHistories) {
      const latest = history.filter((item) => item.year <= year).at(-1);
      const exact = history.find((item) => item.year === year);
      if (latest) {
        point.investedValue += latest.investedValue;
        point.closingValue += latest.closingValue;
      }
      if (exact) {
        point.contributions += exact.contributions;
        point.withdrawals += exact.withdrawals;
      }
    }
    return point;
  });
}

function ownTimeline(data: FinanceData, investmentId: string): InvestmentTimelinePoint[] {
  const entries = confirmedInvestmentEntries(data, investmentId)
    .sort((a, b) => a.date.localeCompare(b.date) || ({ contribution: 0, withdrawal: 1, valuation: 2 }[a.kind] - { contribution: 0, withdrawal: 1, valuation: 2 }[b.kind]));
  const entryYears = new Set(entries.map((item) => Number(item.date.slice(0, 4))));
  const events = [
    ...data.investmentAnnualSummaries
      .filter((item) => item.investmentId === investmentId && !entryYears.has(item.year))
      .map((item) => ({ date: `${item.year}-12-31`, summary: item })),
    ...entries.map((entry) => ({ date: entry.date, entry })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  let investedValue = 0;
  let closingValue = 0;
  const points: InvestmentTimelinePoint[] = [];
  for (const date of [...new Set(events.map((item) => item.date))]) {
    for (const event of events.filter((item) => item.date === date)) {
      if ("summary" in event) {
        investedValue = Math.max(0, investedValue + event.summary.contributions - event.summary.withdrawals);
        closingValue = event.summary.closingValue;
      } else if (event.entry.kind === "contribution") {
        investedValue += event.entry.amount;
        closingValue += event.entry.amount;
      } else if (event.entry.kind === "withdrawal") {
        investedValue = Math.max(0, investedValue - event.entry.amount);
        closingValue = Math.max(0, closingValue - event.entry.amount);
      }
      else closingValue = event.entry.amount;
    }
    points.push({ date, investedValue, closingValue });
  }
  return points;
}

export function investmentValueTimeline(data: FinanceData, investmentId: string): InvestmentTimelinePoint[] {
  const children = investmentChildren(data, investmentId);
  if (!children.length) return ownTimeline(data, investmentId);
  const childTimelines = children.map((child) => investmentValueTimeline(data, child.id));
  const dates = [...new Set(childTimelines.flatMap((timeline) => timeline.map((item) => item.date)))].sort();
  return dates.map((date) => childTimelines.reduce<InvestmentTimelinePoint>((point, timeline) => {
    const latest = timeline.filter((item) => item.date <= date).at(-1);
    if (latest) {
      point.investedValue += latest.investedValue;
      point.closingValue += latest.closingValue;
    }
    return point;
  }, { date, investedValue: 0, closingValue: 0 }));
}
