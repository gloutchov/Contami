import type { FinanceData, Investment, InvestmentEntry, PropertyEntry, RecurringItem, SharedExpense, Transaction, VehicleEntry } from "./models";
import { catalogUsageCount } from "./catalogUsage";

export interface SharedExpenseSplit {
  id: string;
  ownerShare: number;
  partnerShare: number;
  paidBy: SharedExpense["paidBy"];
  settled: boolean;
}

const nowIso = () => new Date().toISOString();
const randomUUID = () => globalThis.crypto.randomUUID();

function replaceOrAdd<T extends { id: string }>(items: T[], value: T): void {
  const index = items.findIndex((item) => item.id === value.id);
  if (index === -1) items.push(value);
  else items[index] = value;
}

function categoryName(data: FinanceData, id: string): string {
  return data.categories.find((item) => item.id === id)?.nameIt ?? "Altro";
}

function transactionForProperty(entry: PropertyEntry, existing?: Transaction): Transaction {
  const timestamp = nowIso();
  return {
    id: existing?.id ?? entry.transactionId ?? randomUUID(),
    date: entry.date,
    description: entry.description,
    categoryId: entry.categoryId!,
    paymentMethodId: entry.paymentMethodId!,
    accountId: existing?.accountId,
    kind: entry.kind as "income" | "expense",
    amount: entry.amount,
    currency: existing?.currency ?? "EUR",
    recurringId: existing?.recurringId,
    propertyId: entry.propertyId,
    propertyEntryId: entry.id,
    shared: existing?.shared ?? false,
    planned: existing?.planned,
    sharedPaidBy: existing?.sharedPaidBy ?? "owner",
    sharedSettled: existing?.sharedSettled ?? false,
    notes: entry.notes,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function transactionForInvestment(data: FinanceData, entry: InvestmentEntry, existing?: Transaction): Transaction {
  const timestamp = nowIso();
  return {
    id: existing?.id ?? entry.transactionId ?? randomUUID(),
    date: entry.date,
    description: entry.description,
    categoryId: entry.categoryId!,
    paymentMethodId: entry.paymentMethodId!,
    accountId: existing?.accountId,
    kind: "transfer",
    cashFlowDirection: entry.kind === "contribution" ? "outflow" : "inflow",
    amount: entry.amount,
    currency: data.investments.find((item) => item.id === entry.investmentId)?.currency ?? "EUR",
    recurringId: existing?.recurringId,
    investmentId: entry.investmentId,
    investmentEntryId: entry.id,
    shared: existing?.shared ?? false,
    planned: existing?.planned,
    sharedPaidBy: existing?.sharedPaidBy ?? "owner",
    sharedSettled: existing?.sharedSettled ?? false,
    notes: entry.notes,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function transactionForShared(entry: SharedExpense, existing?: Transaction): Transaction {
  const timestamp = nowIso();
  return {
    id: existing?.id ?? entry.transactionId ?? randomUUID(),
    date: entry.date,
    description: entry.description,
    categoryId: entry.categoryId,
    paymentMethodId: entry.paymentMethodId,
    accountId: existing?.accountId,
    kind: "expense",
    amount: entry.amount,
    currency: existing?.currency ?? "EUR",
    recurringId: existing?.recurringId,
    propertyId: existing?.propertyId,
    propertyEntryId: existing?.propertyEntryId,
    investmentId: existing?.investmentId,
    investmentEntryId: existing?.investmentEntryId,
    vehicleId: existing?.vehicleId,
    vehicleEntryId: existing?.vehicleEntryId,
    sharedExpenseId: entry.id,
    planned: existing?.planned,
    shared: true,
    sharedPaidBy: entry.paidBy,
    sharedSettled: entry.settled,
    notes: entry.notes,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function transactionForVehicle(entry: VehicleEntry, existing?: Transaction): Transaction {
  const timestamp = nowIso();
  return {
    id: existing?.id ?? entry.transactionId ?? randomUUID(), date: entry.date, description: entry.description,
    categoryId: entry.categoryId!, paymentMethodId: entry.paymentMethodId!, accountId: existing?.accountId,
    kind: "expense", amount: entry.amount, currency: existing?.currency ?? "EUR", recurringId: existing?.recurringId,
    vehicleId: entry.vehicleId, vehicleEntryId: entry.id, shared: existing?.shared ?? false, planned: existing?.planned,
    sharedPaidBy: existing?.sharedPaidBy ?? "owner", sharedSettled: existing?.sharedSettled ?? false,
    notes: entry.notes, createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp,
  };
}

export function upsertTransactionWithLinks(data: FinanceData, value: Transaction): void {
  const previous = data.transactions.find((item) => item.id === value.id);
  const transaction = { ...value, updatedAt: nowIso() };
  replaceOrAdd(data.transactions, transaction);

  const previousPropertyEntryId = previous?.propertyEntryId;
  if (previousPropertyEntryId && (!transaction.propertyId || transaction.kind === "transfer")) {
    data.propertyEntries = data.propertyEntries.filter((item) => item.id !== previousPropertyEntryId);
    transaction.propertyEntryId = undefined;
  }
  if (transaction.propertyId && transaction.kind !== "transfer") {
    const existing = data.propertyEntries.find((item) => item.id === transaction.propertyEntryId || item.transactionId === transaction.id);
    const entry: PropertyEntry = {
      ...existing,
      id: existing?.id ?? randomUUID(), propertyId: transaction.propertyId, date: transaction.date,
      kind: transaction.kind, category: categoryName(data, transaction.categoryId), categoryId: transaction.categoryId,
      description: transaction.description, amount: transaction.amount, paymentMethodId: transaction.paymentMethodId,
      transactionId: transaction.id, isCommonExpense: existing?.isCommonExpense ?? false, notes: transaction.notes,
    };
    replaceOrAdd(data.propertyEntries, entry);
    transaction.propertyEntryId = entry.id;
  }

  const previousInvestmentEntryId = previous?.investmentEntryId;
  if (previousInvestmentEntryId && (!transaction.investmentId || (transaction.kind === "transfer" && transaction.cashFlowDirection === "neutral"))) {
    data.investmentEntries = data.investmentEntries.filter((item) => item.id !== previousInvestmentEntryId);
    transaction.investmentEntryId = undefined;
  }
  if (transaction.investmentId && (transaction.kind !== "transfer" || transaction.cashFlowDirection === "inflow" || transaction.cashFlowDirection === "outflow")) {
    const existing = data.investmentEntries.find((item) => item.id === transaction.investmentEntryId || item.transactionId === transaction.id);
    const entry: InvestmentEntry = {
      id: existing?.id ?? randomUUID(), investmentId: transaction.investmentId, date: transaction.date,
      kind: transaction.kind === "transfer" ? (transaction.cashFlowDirection === "outflow" ? "contribution" : "withdrawal") : transaction.kind === "expense" ? "contribution" : "withdrawal", amount: transaction.amount,
      description: transaction.description, categoryId: transaction.categoryId, paymentMethodId: transaction.paymentMethodId,
      transactionId: transaction.id, notes: transaction.notes,
    };
    replaceOrAdd(data.investmentEntries, entry);
    transaction.investmentEntryId = entry.id;
  }

  const previousVehicleEntryId = previous?.vehicleEntryId;
  if (previousVehicleEntryId && (!transaction.vehicleId || transaction.kind !== "expense")) {
    data.vehicleEntries = data.vehicleEntries.filter((item) => item.id !== previousVehicleEntryId);
    transaction.vehicleEntryId = undefined;
  }
  if (transaction.vehicleId && transaction.kind === "expense") {
    const existing = data.vehicleEntries.find((item) => item.id === transaction.vehicleEntryId || item.transactionId === transaction.id);
    const entry: VehicleEntry = {
      id: existing?.id ?? randomUUID(), vehicleId: transaction.vehicleId, date: transaction.date,
      kind: existing?.kind ?? "other", description: transaction.description, amount: transaction.amount,
      odometerKm: existing?.odometerKm, distanceKm: existing?.distanceKm, fuelLiters: existing?.fuelLiters,
      fuelUnitPrice: existing?.fuelUnitPrice, fuelType: existing?.fuelType, vendor: existing?.vendor,
      categoryId: transaction.categoryId, paymentMethodId: transaction.paymentMethodId, transactionId: transaction.id, notes: transaction.notes,
    };
    replaceOrAdd(data.vehicleEntries, entry);
    transaction.vehicleEntryId = entry.id;
  }

  const previousSharedId = previous?.sharedExpenseId;
  if (previousSharedId && !transaction.shared) {
    data.sharedExpenses = data.sharedExpenses.filter((item) => item.id !== previousSharedId);
    transaction.sharedExpenseId = undefined;
  }
  if (transaction.shared && transaction.kind === "expense") {
    const existing = data.sharedExpenses.find((item) => item.id === transaction.sharedExpenseId || item.transactionId === transaction.id);
    const ownerRatio = existing && existing.amount > 0 ? existing.ownerShare / existing.amount : 0.5;
    const ownerShare = existing && Math.abs(existing.amount - transaction.amount) <= 0.01
      ? existing.ownerShare
      : Math.round(transaction.amount * ownerRatio * 100) / 100;
    const entry: SharedExpense = {
      id: existing?.id ?? randomUUID(), date: transaction.date, description: transaction.description,
      categoryId: transaction.categoryId, paymentMethodId: transaction.paymentMethodId, amount: transaction.amount,
      ownerShare, partnerShare: existing && Math.abs(existing.amount - transaction.amount) <= 0.01
        ? existing.partnerShare
        : Math.round((transaction.amount - ownerShare) * 100) / 100,
      paidBy: transaction.sharedPaidBy ?? "owner", settled: transaction.sharedSettled ?? false, transactionId: transaction.id, notes: transaction.notes,
    };
    replaceOrAdd(data.sharedExpenses, entry);
    transaction.sharedExpenseId = entry.id;
  }
  replaceOrAdd(data.transactions, transaction);
}

export function upsertPropertyEntryWithLinks(data: FinanceData, value: PropertyEntry): void {
  const previous = data.propertyEntries.find((item) => item.id === value.id);
  replaceOrAdd(data.propertyEntries, value);
  if (value.kind === "income" || value.kind === "expense") {
    const existing = data.transactions.find((item) => item.id === value.transactionId || item.propertyEntryId === value.id);
    const transaction = transactionForProperty(value, existing);
    value.transactionId = transaction.id;
    replaceOrAdd(data.propertyEntries, value);
    upsertTransactionWithLinks(data, transaction);
  } else if (previous?.transactionId) {
    data.transactions = data.transactions.filter((item) => item.id !== previous.transactionId);
    value.transactionId = undefined;
    replaceOrAdd(data.propertyEntries, value);
  }
}

export function upsertPropertyExpenseWithLinks(data: FinanceData, value: PropertyEntry, shared?: SharedExpenseSplit): void {
  upsertPropertyEntryWithLinks(data, value);
  const transaction = data.transactions.find((item) => item.id === value.transactionId || item.propertyEntryId === value.id);
  if (!transaction) throw new Error("TRANSACTION_NOT_FOUND");
  if (shared) {
    upsertSharedExpenseWithLinks(data, {
      id: shared.id,
      date: value.date,
      description: value.description,
      categoryId: value.categoryId!,
      paymentMethodId: value.paymentMethodId!,
      amount: value.amount,
      ownerShare: shared.ownerShare,
      partnerShare: shared.partnerShare,
      paidBy: shared.paidBy,
      settled: shared.settled,
      transactionId: transaction.id,
      notes: value.notes,
    });
  } else if (transaction.shared || transaction.sharedExpenseId) {
    upsertTransactionWithLinks(data, { ...transaction, shared: false, sharedExpenseId: transaction.sharedExpenseId });
  }
}

export function upsertInvestmentEntryWithLinks(data: FinanceData, value: InvestmentEntry): void {
  const previous = data.investmentEntries.find((item) => item.id === value.id);
  replaceOrAdd(data.investmentEntries, value);
  if (value.kind !== "valuation") {
    const existing = data.transactions.find((item) => item.id === value.transactionId || item.investmentEntryId === value.id);
    const transaction = transactionForInvestment(data, value, existing);
    value.transactionId = transaction.id;
    replaceOrAdd(data.investmentEntries, value);
    upsertTransactionWithLinks(data, transaction);
  } else if (previous?.transactionId) {
    data.transactions = data.transactions.filter((item) => item.id !== previous.transactionId);
    value.transactionId = undefined;
    replaceOrAdd(data.investmentEntries, value);
  }
}

export function upsertSharedExpenseWithLinks(data: FinanceData, value: SharedExpense): void {
  const existing = data.transactions.find((item) => item.id === value.transactionId || item.sharedExpenseId === value.id);
  const transaction = transactionForShared(value, existing);
  value.transactionId = transaction.id;
  replaceOrAdd(data.sharedExpenses, value);
  upsertTransactionWithLinks(data, transaction);
}

export function upsertVehicleEntryWithLinks(data: FinanceData, value: VehicleEntry): void {
  const previous = data.vehicleEntries.find((item) => item.id === value.id);
  replaceOrAdd(data.vehicleEntries, value);
  if (value.kind !== "valuation" && value.amount > 0 && value.categoryId && value.paymentMethodId) {
    const existing = data.transactions.find((item) => item.id === value.transactionId || item.vehicleEntryId === value.id);
    const transaction = transactionForVehicle(value, existing);
    value.transactionId = transaction.id;
    replaceOrAdd(data.vehicleEntries, value);
    upsertTransactionWithLinks(data, transaction);
  } else if (previous?.transactionId) {
    data.transactions = data.transactions.filter((item) => item.id !== previous.transactionId);
    value.transactionId = undefined;
    replaceOrAdd(data.vehicleEntries, value);
  }
}

function periodicRecurring(investment: Investment, existing?: RecurringItem): RecurringItem | undefined {
  if (!investment.periodicAmount || !investment.periodicFrequency || !investment.periodicNextDueDate || !investment.periodicCategoryId || !investment.periodicPaymentMethodId) return undefined;
  return {
    id: existing?.id ?? randomUUID(), name: investment.name, kind: "investment", direction: "expense",
    amount: investment.periodicAmount, frequency: investment.periodicFrequency, categoryId: investment.periodicCategoryId,
    paymentMethodId: investment.periodicPaymentMethodId, investmentId: investment.id, nextDueDate: investment.periodicNextDueDate,
    active: investment.active, closedAt: investment.closedAt, notes: investment.notes,
  };
}

export function syncInvestmentPlan(data: FinanceData, investment: Investment): void {
  const existing = data.recurringItems.find((item) => item.investmentId === investment.id && item.kind === "investment");
  const recurring = periodicRecurring(investment, existing);
  if (recurring) { replaceOrAdd(data.recurringItems, recurring); syncRecurringTransactions(data, recurring); }
  else if (existing) deleteLinkedEntity(data, "recurringItem", existing.id);
}

export function syncRecurringLink(data: FinanceData, recurring: RecurringItem): void {
  if (recurring.investmentId) {
    const investment = data.investments.find((item) => item.id === recurring.investmentId);
    if (investment) {
      investment.periodicAmount = recurring.amount;
      investment.periodicFrequency = recurring.frequency === "yearly" ? "yearly" : "monthly";
      investment.periodicNextDueDate = recurring.nextDueDate;
      investment.periodicCategoryId = recurring.categoryId;
      investment.periodicPaymentMethodId = recurring.paymentMethodId;
    }
  }
  if (recurring.propertyId && recurring.direction === "income" && recurring.frequency === "monthly") {
    const property = data.properties.find((item) => item.id === recurring.propertyId);
    if (property) {
      property.usage = "rental";
      property.expectedMonthlyRent = recurring.amount;
      property.rentDueDay = Number(recurring.nextDueDate.slice(8, 10));
    }
  }
}

function addFrequency(date: Date, frequency: RecurringItem["frequency"]): void {
  if (frequency === "weekly") date.setUTCDate(date.getUTCDate() + 7);
  else if (frequency === "monthly") date.setUTCMonth(date.getUTCMonth() + 1);
  else if (frequency === "quarterly") date.setUTCMonth(date.getUTCMonth() + 3);
  else date.setUTCFullYear(date.getUTCFullYear() + 1);
}

export function syncRecurringTransactions(data: FinanceData, recurring: RecurringItem): void {
  const planned = data.transactions.filter((item) => item.recurringId === recurring.id && item.planned);
  for (const transaction of planned) deleteLinkedEntity(data, "transaction", transaction.id);
  if (!recurring.active) return;
  const cursor = new Date(`${recurring.nextDueDate}T12:00:00Z`);
  const yearEnd = new Date(`${data.meta.activeYear}-12-31T12:00:00Z`);
  let occurrences = 0;
  while (cursor <= yearEnd && occurrences < 370) {
    const date = cursor.toISOString().slice(0, 10);
    if (date.startsWith(String(data.meta.activeYear))) {
      const direction = recurring.direction ?? "expense";
      const transactionKind = recurring.kind === "investment" ? "transfer" : direction;
      const cashFlowDirection = recurring.kind === "investment" ? (direction === "income" ? "inflow" : "outflow") : undefined;
      const existing = data.transactions.find((item) => item.recurringId === recurring.id && item.date === date && !item.planned)
        ?? data.transactions.find((item) => !item.recurringId && item.date === date && item.kind === transactionKind && item.cashFlowDirection === cashFlowDirection && Math.abs(item.amount - recurring.amount) < 0.01 && item.description.toLocaleLowerCase().includes(recurring.name.toLocaleLowerCase()));
      if (existing) existing.recurringId = recurring.id;
      else {
        const timestamp = nowIso();
        upsertTransactionWithLinks(data, {
          id: randomUUID(), date, description: recurring.name, categoryId: recurring.categoryId,
          paymentMethodId: recurring.paymentMethodId, kind: transactionKind, cashFlowDirection, amount: recurring.amount, currency: "EUR",
          recurringId: recurring.id, propertyId: recurring.propertyId, investmentId: recurring.investmentId, vehicleId: recurring.vehicleId,
          planned: true, shared: false, sharedPaidBy: "owner", sharedSettled: false,
          notes: recurring.notes, createdAt: timestamp, updatedAt: timestamp,
        });
      }
    }
    occurrences += 1;
    addFrequency(cursor, recurring.frequency);
  }
}

export function deleteLinkedEntity(data: FinanceData, entity: string, id: string): void {
  if (entity === "transaction") {
    const item = data.transactions.find((candidate) => candidate.id === id);
    if (!item) throw new Error("ENTITY_NOT_FOUND");
    data.transactions = data.transactions.filter((candidate) => candidate.id !== id);
    if (item.propertyEntryId) data.propertyEntries = data.propertyEntries.filter((candidate) => candidate.id !== item.propertyEntryId);
    if (item.investmentEntryId) data.investmentEntries = data.investmentEntries.filter((candidate) => candidate.id !== item.investmentEntryId);
    if (item.vehicleEntryId) data.vehicleEntries = data.vehicleEntries.filter((candidate) => candidate.id !== item.vehicleEntryId);
    if (item.sharedExpenseId) data.sharedExpenses = data.sharedExpenses.filter((candidate) => candidate.id !== item.sharedExpenseId);
    return;
  }
  if (entity === "propertyEntry") {
    const item = data.propertyEntries.find((candidate) => candidate.id === id);
    if (!item) throw new Error("ENTITY_NOT_FOUND");
    if (item.transactionId && data.transactions.some((candidate) => candidate.id === item.transactionId)) deleteLinkedEntity(data, "transaction", item.transactionId);
    else data.propertyEntries = data.propertyEntries.filter((candidate) => candidate.id !== id);
    return;
  }
  if (entity === "investmentEntry") {
    const item = data.investmentEntries.find((candidate) => candidate.id === id);
    if (!item) throw new Error("ENTITY_NOT_FOUND");
    if (item.transactionId && data.transactions.some((candidate) => candidate.id === item.transactionId)) deleteLinkedEntity(data, "transaction", item.transactionId);
    else data.investmentEntries = data.investmentEntries.filter((candidate) => candidate.id !== id);
    return;
  }
  if (entity === "sharedExpense") {
    const item = data.sharedExpenses.find((candidate) => candidate.id === id);
    if (!item) throw new Error("ENTITY_NOT_FOUND");
    if (item.transactionId && data.transactions.some((candidate) => candidate.id === item.transactionId)) deleteLinkedEntity(data, "transaction", item.transactionId);
    else data.sharedExpenses = data.sharedExpenses.filter((candidate) => candidate.id !== id);
    return;
  }
  if (entity === "vehicleEntry") {
    const item = data.vehicleEntries.find((candidate) => candidate.id === id);
    if (!item) throw new Error("ENTITY_NOT_FOUND");
    if (item.transactionId && data.transactions.some((candidate) => candidate.id === item.transactionId)) deleteLinkedEntity(data, "transaction", item.transactionId);
    else data.vehicleEntries = data.vehicleEntries.filter((candidate) => candidate.id !== id);
    return;
  }
  if (entity === "property") {
    const entryIds = new Set(data.propertyEntries.filter((item) => item.propertyId === id).map((item) => item.id));
    const transactionIds = data.transactions.filter((item) => item.propertyId === id || (item.propertyEntryId && entryIds.has(item.propertyEntryId))).map((item) => item.id);
    transactionIds.forEach((transactionId) => deleteLinkedEntity(data, "transaction", transactionId));
    data.propertyEntries = data.propertyEntries.filter((item) => item.propertyId !== id);
    data.recurringItems = data.recurringItems.filter((item) => item.propertyId !== id);
    data.properties = data.properties.filter((item) => item.id !== id);
    data.propertyAnnualSummaries = data.propertyAnnualSummaries.filter((item) => item.propertyId !== id);
    return;
  }
  if (entity === "investment") {
    const ids = new Set([id, ...data.investments.filter((item) => item.parentInvestmentId === id).map((item) => item.id)]);
    const entryIds = new Set(data.investmentEntries.filter((item) => ids.has(item.investmentId)).map((item) => item.id));
    const transactionIds = data.transactions.filter((item) => (item.investmentId && ids.has(item.investmentId)) || (item.investmentEntryId && entryIds.has(item.investmentEntryId))).map((item) => item.id);
    transactionIds.forEach((transactionId) => deleteLinkedEntity(data, "transaction", transactionId));
    data.investmentEntries = data.investmentEntries.filter((item) => !ids.has(item.investmentId));
    data.recurringItems = data.recurringItems.filter((item) => !item.investmentId || !ids.has(item.investmentId));
    data.investments = data.investments.filter((item) => !ids.has(item.id));
    data.investmentAnnualSummaries = data.investmentAnnualSummaries.filter((item) => !ids.has(item.investmentId));
    return;
  }
  if (entity === "vehicle") {
    const entryIds = new Set(data.vehicleEntries.filter((item) => item.vehicleId === id).map((item) => item.id));
    const transactionIds = data.transactions.filter((item) => item.vehicleId === id || (item.vehicleEntryId && entryIds.has(item.vehicleEntryId))).map((item) => item.id);
    transactionIds.forEach((transactionId) => deleteLinkedEntity(data, "transaction", transactionId));
    data.vehicleEntries = data.vehicleEntries.filter((item) => item.vehicleId !== id);
    data.recurringItems = data.recurringItems.filter((item) => item.vehicleId !== id);
    data.vehicleAnnualSummaries = data.vehicleAnnualSummaries.filter((item) => item.vehicleId !== id);
    data.vehicles = data.vehicles.filter((item) => item.id !== id);
    return;
  }
  const collections = {
    account: data.accounts,
    recurringItem: data.recurringItems,
    category: data.categories,
    paymentMethod: data.paymentMethods,
    investmentType: data.investmentTypes,
    taxType: data.taxTypes,
  } as const;
  const collection = collections[entity as keyof typeof collections];
  if (!collection?.some((item) => item.id === id)) throw new Error("ENTITY_NOT_FOUND");
  const inUse = entity === "account" ? data.transactions.some((item) => item.accountId === id)
    : entity === "category" ? catalogUsageCount(data, "category", id) > 0
      : entity === "paymentMethod" ? catalogUsageCount(data, "paymentMethod", id) > 0
        : entity === "investmentType" ? data.investments.some((item) => item.typeId === id)
          : entity === "taxType" ? catalogUsageCount(data, "taxType", id) > 0
          : false;
  if (inUse) throw new Error("ENTITY_IN_USE");
  if (entity === "recurringItem") {
    const plannedIds = data.transactions.filter((item) => item.recurringId === id && item.planned).map((item) => item.id);
    plannedIds.forEach((transactionId) => deleteLinkedEntity(data, "transaction", transactionId));
    data.transactions.forEach((item) => { if (item.recurringId === id) item.recurringId = undefined; });
  }
  (collection as Array<{ id: string }>).splice((collection as Array<{ id: string }>).findIndex((item) => item.id === id), 1);
}
