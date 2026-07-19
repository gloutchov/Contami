import type { RecurringItem, Transaction } from "../../domain/models";

const newestFirst = (left: Transaction, right: Transaction) =>
  right.date.localeCompare(left.date) || right.updatedAt.localeCompare(left.updatedAt);

const confirmedThrough = (transaction: Transaction, asOf: string) =>
  transaction.date <= asOf && !transaction.planned;

export function recentTransactionsAsOf(transactions: Transaction[], asOf: string, limit = 5) {
  return [...transactions]
    .filter((transaction) => confirmedThrough(transaction, asOf))
    .sort(newestFirst)
    .slice(0, limit);
}

export function recentRecurringExpensesAsOf(
  transactions: Transaction[],
  recurringItems: RecurringItem[],
  asOf: string,
  limit = 5,
) {
  const recurringNames = recurringItems.map((item) => item.name.toLocaleLowerCase());
  return [...transactions]
    .filter((transaction) => confirmedThrough(transaction, asOf))
    .filter((transaction) => transaction.kind === "expense")
    .filter((transaction) => Boolean(transaction.recurringId)
      || recurringNames.some((name) => transaction.description.toLocaleLowerCase().includes(name)))
    .sort(newestFirst)
    .slice(0, limit);
}
