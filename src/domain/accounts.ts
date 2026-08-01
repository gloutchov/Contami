import type { Account, FinanceData, Transaction } from "./models";

export interface AccountEffect {
  accountId: string;
  amount: number;
}

export interface TransactionAccountEffectOptions {
  includePlanned?: boolean;
}

export function accountIsAvailable(account: Account, date: string): boolean {
  return date >= account.openedAt && (!account.closedAt || date <= account.closedAt);
}

export function isInternalAccountTransfer(transaction: Transaction): boolean {
  return transaction.kind === "transfer"
    && transaction.cashFlowDirection === "neutral"
    && Boolean(transaction.accountId && transaction.destinationAccountId);
}

export function transactionAccountEffects(transaction: Transaction, options: TransactionAccountEffectOptions = {}): AccountEffect[] {
  if (transaction.planned && !options.includePlanned) return [];
  if (isInternalAccountTransfer(transaction)) {
    return [
      { accountId: transaction.accountId!, amount: -transaction.amount },
      { accountId: transaction.destinationAccountId!, amount: transaction.amount },
    ];
  }
  if (!transaction.accountId) return [];
  if (transaction.kind === "income" || (transaction.kind === "transfer" && transaction.cashFlowDirection === "inflow")) {
    return [{ accountId: transaction.accountId, amount: transaction.amount }];
  }
  if (transaction.kind === "expense" || (transaction.kind === "transfer" && transaction.cashFlowDirection === "outflow")) {
    return [{ accountId: transaction.accountId, amount: -transaction.amount }];
  }
  return [];
}

export function accountBalance(data: FinanceData, accountId: string, throughDate?: string): number {
  const account = data.accounts.find((item) => item.id === accountId);
  if (!account || (throughDate && account.openedAt > throughDate)) return 0;
  return account.openingBalance + data.transactions.reduce((sum, transaction) => {
    if (throughDate && transaction.date > throughDate) return sum;
    if (!accountIsAvailable(account, transaction.date)) return sum;
    return sum + transactionAccountEffects(transaction)
      .filter((effect) => effect.accountId === accountId)
      .reduce((effectSum, effect) => effectSum + effect.amount, 0);
  }, 0);
}

export function accountsForPaymentMethod(data: FinanceData, paymentMethodId: string, date: string, selectedId?: string): Account[] {
  const cashPayment = data.paymentMethods.find((item) => item.id === paymentMethodId)?.kind === "cash";
  return data.accounts.filter((account) => (
    (account.active || account.id === selectedId)
    && accountIsAvailable(account, date)
    && (cashPayment ? account.kind === "cash" : account.kind !== "cash")
  ));
}

export function validateAccount(data: FinanceData, account: Account): void {
  if (account.kind !== "cash" && account.defaultFundingAccountId) throw new Error("INVALID_CASH_REGISTER_FUNDING_ACCOUNT");
  if (!account.defaultFundingAccountId) return;
  const funding = data.accounts.find((item) => item.id === account.defaultFundingAccountId);
  if (!funding || funding.id === account.id || funding.kind === "cash" || funding.currency !== account.currency) {
    throw new Error("INVALID_CASH_REGISTER_FUNDING_ACCOUNT");
  }
}

export function validatePaymentAccount(data: FinanceData, paymentMethodId: string, accountId: string | undefined, date: string, currency = "EUR"): void {
  const paymentMethod = data.paymentMethods.find((item) => item.id === paymentMethodId);
  if (!paymentMethod) throw new Error("PAYMENT_METHOD_NOT_FOUND");
  const account = accountId ? data.accounts.find((item) => item.id === accountId) : undefined;
  if (!account || !accountIsAvailable(account, date) || account.currency !== currency) throw new Error("ACCOUNT_REQUIRED");
  if (paymentMethod.kind === "cash" ? account.kind !== "cash" : account.kind === "cash") {
    throw new Error("ACCOUNT_PAYMENT_METHOD_MISMATCH");
  }
}

export function resolvePaymentAccountId(data: FinanceData, paymentMethodId: string, accountId: string | undefined, date: string, currency = "EUR"): string {
  if (accountId) {
    validatePaymentAccount(data, paymentMethodId, accountId, date, currency);
    return accountId;
  }
  const matches = accountsForPaymentMethod(data, paymentMethodId, date).filter((account) => account.currency === currency);
  if (matches.length !== 1) throw new Error("ACCOUNT_REQUIRED");
  return matches[0].id;
}

export function validateTransactionAccounts(data: FinanceData, transaction: Transaction): void {
  const paymentMethod = data.paymentMethods.find((item) => item.id === transaction.paymentMethodId);
  if (!paymentMethod) throw new Error("PAYMENT_METHOD_NOT_FOUND");
  const source = transaction.accountId ? data.accounts.find((item) => item.id === transaction.accountId) : undefined;
  const destination = transaction.destinationAccountId ? data.accounts.find((item) => item.id === transaction.destinationAccountId) : undefined;
  const internal = transaction.kind === "transfer" && transaction.cashFlowDirection === "neutral";

  if (internal) {
    if (!source || !accountIsAvailable(source, transaction.date) || source.currency !== transaction.currency) {
      throw new Error("ACCOUNT_REQUIRED");
    }
    if (!destination || destination.id === source.id || !accountIsAvailable(destination, transaction.date) || destination.currency !== source.currency) {
      throw new Error("INVALID_INTERNAL_TRANSFER");
    }
    return;
  }
  if (destination) throw new Error("INVALID_INTERNAL_TRANSFER");
  transaction.accountId = resolvePaymentAccountId(data, paymentMethod.id, source?.id, transaction.date, transaction.currency);
}
