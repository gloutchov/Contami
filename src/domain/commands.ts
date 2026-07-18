import { z } from "zod";
import {
  accountSchema,
  categorySchema,
  investmentEntrySchema,
  investmentSchema,
  paymentMethodSchema,
  propertyEntrySchema,
  propertySchema,
  recurringItemSchema,
  sharedExpenseSchema,
  transactionSchema,
} from "./models";

export const financeCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("addTransaction"), value: transactionSchema }),
  z.object({ type: z.literal("addAccount"), value: accountSchema }),
  z.object({ type: z.literal("addProperty"), value: propertySchema }),
  z.object({ type: z.literal("addPropertyEntry"), value: propertyEntrySchema }),
  z.object({ type: z.literal("addInvestment"), value: investmentSchema }),
  z.object({ type: z.literal("addInvestmentEntry"), value: investmentEntrySchema }),
  z.object({ type: z.literal("addRecurringItem"), value: recurringItemSchema }),
  z.object({ type: z.literal("addSharedExpense"), value: sharedExpenseSchema }),
  z.object({ type: z.literal("addCategory"), value: categorySchema }),
  z.object({ type: z.literal("addPaymentMethod"), value: paymentMethodSchema }),
  z.object({
    type: z.literal("setActive"),
    entity: z.enum(["account", "property", "investment", "recurringItem"]),
    id: z.string().uuid(),
    active: z.boolean(),
    closedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  z.object({
    type: z.literal("setSharedExpenseSettled"),
    id: z.string().uuid(),
    settled: z.boolean(),
  }),
]);

export type FinanceCommand = z.infer<typeof financeCommandSchema>;
