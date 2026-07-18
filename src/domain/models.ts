import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date");
const isoTimestamp = z.string().datetime();
const id = z.string().uuid();
const money = z.number().finite().nonnegative().max(1_000_000_000_000);
const text = z.string().trim().min(1).max(240);
const notes = z.string().trim().max(2_000).default("");

export const categorySchema = z.object({
  id,
  nameIt: text,
  nameEn: text,
  kind: z.enum(["income", "expense", "both"]),
  active: z.boolean(),
});

export const paymentMethodSchema = z.object({
  id,
  name: text,
  kind: z.enum(["cash", "card", "bank_transfer", "direct_debit", "digital_wallet", "other"]),
  active: z.boolean(),
});

export const accountSchema = z.object({
  id,
  name: text,
  kind: z.enum(["bank", "cash", "card", "digital_wallet", "other"]),
  currency: z.string().length(3).default("EUR"),
  openingBalance: z.number().finite().min(-1_000_000_000_000).max(1_000_000_000_000),
  active: z.boolean(),
  openedAt: isoDate,
  closedAt: isoDate.optional(),
  notes,
});

export const transactionSchema = z.object({
  id,
  date: isoDate,
  description: text,
  categoryId: id,
  paymentMethodId: id,
  accountId: id.optional(),
  kind: z.enum(["income", "expense", "transfer"]),
  amount: money.positive(),
  currency: z.string().length(3).default("EUR"),
  recurringId: id.optional(),
  notes,
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

export const propertySchema = z.object({
  id,
  name: text,
  kind: z.enum(["apartment", "house", "garage", "land", "commercial", "other"]),
  ownershipShare: z.number().finite().min(0).max(1),
  purchaseDate: isoDate.optional(),
  purchasePrice: money,
  active: z.boolean(),
  closedAt: isoDate.optional(),
  notes,
});

export const propertyEntrySchema = z.object({
  id,
  propertyId: id,
  date: isoDate,
  kind: z.enum(["income", "expense", "valuation", "consumption"]),
  category: text,
  description: text,
  amount: money,
  quantity: z.number().finite().nonnegative().max(1_000_000_000).optional(),
  unit: z.string().trim().max(24).optional(),
  paymentMethodId: id.optional(),
  notes,
}).superRefine((value, context) => {
  if ((value.kind === "income" || value.kind === "expense") && !value.paymentMethodId) {
    context.addIssue({ code: "custom", message: "Payment method is required for monetary property entries", path: ["paymentMethodId"] });
  }
});

export const investmentSchema = z.object({
  id,
  name: text,
  kind: z.enum(["fund", "stock", "bond", "pension", "savings", "etf", "other"]),
  provider: z.string().trim().max(120).default(""),
  currency: z.string().length(3).default("EUR"),
  active: z.boolean(),
  openedAt: isoDate,
  closedAt: isoDate.optional(),
  notes,
});

export const investmentEntrySchema = z.object({
  id,
  investmentId: id,
  date: isoDate,
  kind: z.enum(["contribution", "withdrawal", "valuation", "income", "fee"]),
  amount: money,
  description: text,
  paymentMethodId: id.optional(),
  notes,
}).superRefine((value, context) => {
  if (value.kind !== "valuation" && !value.paymentMethodId) {
    context.addIssue({ code: "custom", message: "Payment method is required for monetary investment entries", path: ["paymentMethodId"] });
  }
});

export const recurringItemSchema = z.object({
  id,
  name: text,
  kind: z.enum(["subscription", "service", "installment", "investment", "other"]),
  amount: money.positive(),
  frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  categoryId: id,
  paymentMethodId: id,
  nextDueDate: isoDate,
  endDate: isoDate.optional(),
  remainingInstallments: z.number().int().nonnegative().max(10_000).optional(),
  active: z.boolean(),
  closedAt: isoDate.optional(),
  notes,
});

export const sharedExpenseSchema = z.object({
  id,
  date: isoDate,
  description: text,
  categoryId: id,
  paymentMethodId: id,
  amount: money.positive(),
  ownerShare: money,
  partnerShare: money,
  paidBy: z.enum(["owner", "partner"]),
  settled: z.boolean(),
  notes,
}).superRefine((value, context) => {
  if (Math.abs(value.ownerShare + value.partnerShare - value.amount) > 0.01) {
    context.addIssue({
      code: "custom",
      message: "The two shares must match the total amount",
      path: ["partnerShare"],
    });
  }
});

export const annualSummarySchema = z.object({
  year: z.number().int().min(1900).max(9999),
  income: money,
  expenses: money,
  netCashFlow: z.number().finite(),
  closingNetWorth: z.number().finite(),
});

export const financeDataSchema = z.object({
  meta: z.object({
    schemaVersion: z.literal(1),
    activeYear: z.number().int().min(1900).max(9999),
    createdAt: isoTimestamp,
    updatedAt: isoTimestamp,
  }),
  categories: z.array(categorySchema).max(2_000),
  paymentMethods: z.array(paymentMethodSchema).max(500),
  accounts: z.array(accountSchema).max(500),
  transactions: z.array(transactionSchema).max(1_000_000),
  properties: z.array(propertySchema).max(10_000),
  propertyEntries: z.array(propertyEntrySchema).max(1_000_000),
  investments: z.array(investmentSchema).max(100_000),
  investmentEntries: z.array(investmentEntrySchema).max(1_000_000),
  recurringItems: z.array(recurringItemSchema).max(100_000),
  sharedExpenses: z.array(sharedExpenseSchema).max(1_000_000),
  annualSummaries: z.array(annualSummarySchema).max(500),
});

export type Category = z.infer<typeof categorySchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type Account = z.infer<typeof accountSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type Property = z.infer<typeof propertySchema>;
export type PropertyEntry = z.infer<typeof propertyEntrySchema>;
export type Investment = z.infer<typeof investmentSchema>;
export type InvestmentEntry = z.infer<typeof investmentEntrySchema>;
export type RecurringItem = z.infer<typeof recurringItemSchema>;
export type SharedExpense = z.infer<typeof sharedExpenseSchema>;
export type AnnualSummary = z.infer<typeof annualSummarySchema>;
export type FinanceData = z.infer<typeof financeDataSchema>;
