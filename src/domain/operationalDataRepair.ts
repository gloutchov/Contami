import { financeDataSchema, type Account, type FinanceData, type Transaction } from "./models";
import { accountsForPaymentMethod } from "./accounts";

export interface OperationalDataRepair {
  data: FinanceData;
  repairedTransactionAccounts: number;
  unresolvedTransactionAccounts: number;
  closedInstallmentPlans: number;
}

export function transactionHasCashEffect(transaction: Transaction): boolean {
  return transaction.kind === "income"
    || transaction.kind === "expense"
    || (transaction.kind === "transfer"
      && (transaction.cashFlowDirection === "inflow" || transaction.cashFlowDirection === "outflow"));
}

function accountAcceptsTransaction(account: Account, transaction: Transaction): boolean {
  return account.active
    && transaction.date >= account.openedAt
    && (!account.closedAt || transaction.date <= account.closedAt);
}

function closeFinishedInstallments(data: FinanceData, today: string): number {
  let closed = 0;
  const finishedIds = new Set<string>();
  for (const recurring of data.recurringItems) {
    if (recurring.kind !== "installment" || recurring.remainingInstallments !== 0 || !recurring.active) continue;
    const latestConfirmedDate = data.transactions
      .filter((transaction) => transaction.recurringId === recurring.id && !transaction.planned)
      .map((transaction) => transaction.date)
      .sort()
      .at(-1);
    recurring.active = false;
    recurring.closedAt = recurring.closedAt ?? latestConfirmedDate ?? today;
    finishedIds.add(recurring.id);
    closed += 1;
  }
  if (finishedIds.size > 0) {
    data.transactions = data.transactions.filter((transaction) =>
      !transaction.planned || !transaction.recurringId || !finishedIds.has(transaction.recurringId));
  }
  return closed;
}

export function repairOperationalData(
  source: FinanceData,
  options: { today?: string } = {},
): OperationalDataRepair {
  const data = structuredClone(source);
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const closedInstallmentPlans = closeFinishedInstallments(data, today);
  let repairedTransactionAccounts = 0;
  let unresolvedTransactionAccounts = 0;

  for (const transaction of data.transactions) {
    if (transaction.accountId || !transactionHasCashEffect(transaction)) continue;
    const candidates = accountsForPaymentMethod(data, transaction.paymentMethodId, transaction.date)
      .filter((account) => accountAcceptsTransaction(account, transaction) && account.currency === transaction.currency);
    if (candidates.length === 1) {
      transaction.accountId = candidates[0]!.id;
      const linkedInvestmentEntry = data.investmentEntries.find((entry) =>
        entry.id === transaction.investmentEntryId || entry.transactionId === transaction.id);
      if (linkedInvestmentEntry && linkedInvestmentEntry.kind !== "valuation" && !linkedInvestmentEntry.accountId) {
        linkedInvestmentEntry.accountId = transaction.accountId;
      }
      repairedTransactionAccounts += 1;
    } else {
      unresolvedTransactionAccounts += 1;
    }
  }

  return {
    data: financeDataSchema.parse(data),
    repairedTransactionAccounts,
    unresolvedTransactionAccounts,
    closedInstallmentPlans,
  };
}
