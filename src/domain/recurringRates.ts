import type { FinanceData, RecurringItem, RecurringRateChange, Transaction } from "./models";

export function recurringOccurrenceDate(transaction: Pick<Transaction, "date" | "dueDate">): string {
  return transaction.dueDate ?? transaction.date;
}

export function recurringRateChangesFor(
  data: Pick<FinanceData, "recurringRateChanges">,
  recurringId: string,
): RecurringRateChange[] {
  return data.recurringRateChanges
    .filter((item) => item.recurringId === recurringId)
    .sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom));
}

export function recurringRateAtChanges(
  baseAmount: number,
  changes: readonly RecurringRateChange[],
  occurrenceDate: string,
): number {
  let amount = baseAmount;
  for (const change of changes) {
    if (change.effectiveFrom > occurrenceDate) break;
    amount = change.amount;
  }
  return amount;
}

export function recurringRateAt(
  data: Pick<FinanceData, "recurringRateChanges">,
  recurring: Pick<RecurringItem, "id" | "amount">,
  occurrenceDate: string,
): number {
  return recurringRateAtChanges(recurring.amount, recurringRateChangesFor(data, recurring.id), occurrenceDate);
}

export function sortRecurringRateChanges(changes: readonly RecurringRateChange[]): RecurringRateChange[] {
  return [...changes].sort((left, right) => left.recurringId.localeCompare(right.recurringId)
    || left.effectiveFrom.localeCompare(right.effectiveFrom)
    || left.id.localeCompare(right.id));
}

export function recurringRateChangeImpactCount(
  data: FinanceData,
  recurringId: string,
  candidateChanges: readonly RecurringRateChange[],
): number {
  const recurring = data.recurringItems.find((item) => item.id === recurringId);
  if (!recurring) return 0;
  return data.transactions.filter((transaction) => transaction.recurringId === recurringId
    && transaction.planned
    && Math.abs(transaction.amount - recurringRateAtChanges(
      recurring.amount,
      candidateChanges,
      recurringOccurrenceDate(transaction),
    )) > 0.005).length;
}

export function assertConfirmedRatesUnchanged(
  data: FinanceData,
  recurringId: string,
  candidateChanges: readonly RecurringRateChange[],
): void {
  const recurring = data.recurringItems.find((item) => item.id === recurringId);
  if (!recurring) throw new Error("RECURRING_ITEM_NOT_FOUND");
  const currentChanges = recurringRateChangesFor(data, recurringId);
  const changesConfirmedHistory = data.transactions.some((transaction) => {
    if (transaction.recurringId !== recurringId || transaction.planned) return false;
    const occurrenceDate = recurringOccurrenceDate(transaction);
    return Math.abs(
      recurringRateAtChanges(recurring.amount, currentChanges, occurrenceDate)
      - recurringRateAtChanges(recurring.amount, candidateChanges, occurrenceDate),
    ) > 0.005;
  });
  if (changesConfirmedHistory) throw new Error("RATE_CHANGE_CONFIRMED_HISTORY");
}

export function recurringRateChangeIsMutable(data: FinanceData, change: RecurringRateChange): boolean {
  const candidate = recurringRateChangesFor(data, change.recurringId).filter((item) => item.id !== change.id);
  try {
    assertConfirmedRatesUnchanged(data, change.recurringId, candidate);
    return true;
  } catch {
    return false;
  }
}
