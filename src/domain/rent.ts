import type { FinanceData, Transaction } from "./models";

export type RentInstallmentStatus = "paid" | "paidLate" | "overdue" | "scheduled" | "unassigned";

export interface RentInstallment {
  transactionId: string;
  dueDate?: string;
  paidAt?: string;
  amount: number;
  status: RentInstallmentStatus;
}

function installmentStatus(transaction: Transaction, asOf: string): RentInstallmentStatus {
  if (!transaction.dueDate) return transaction.planned ? "scheduled" : "unassigned";
  if (transaction.planned) return transaction.dueDate <= asOf ? "overdue" : "scheduled";
  return transaction.date > transaction.dueDate ? "paidLate" : "paid";
}

export function rentInstallmentsForProperty(data: FinanceData, propertyId: string, asOf: string): RentInstallment[] {
  const recurringIds = new Set(data.recurringItems
    .filter((item) => item.kind === "rent" && item.direction === "income" && item.propertyId === propertyId)
    .map((item) => item.id));
  return data.transactions
    .filter((transaction) => transaction.kind === "income"
      && transaction.propertyId === propertyId
      && Boolean(transaction.recurringId && recurringIds.has(transaction.recurringId)))
    .map((transaction) => ({
      transactionId: transaction.id,
      dueDate: transaction.dueDate,
      paidAt: transaction.planned ? undefined : transaction.date,
      amount: transaction.amount,
      status: installmentStatus(transaction, asOf),
    }))
    .sort((left, right) => (left.dueDate ?? left.paidAt ?? "").localeCompare(right.dueDate ?? right.paidAt ?? ""));
}

export function propertyHasOverdueRent(data: FinanceData, propertyId: string, asOf: string): boolean {
  return rentInstallmentsForProperty(data, propertyId, asOf).some((item) => item.status === "overdue");
}
