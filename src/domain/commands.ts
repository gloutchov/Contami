import { z } from "zod";
import {
  accountSchema,
  categorySchema,
  investmentEntrySchema,
  investmentSchema,
  investmentTypeSchema,
  paymentMethodSchema,
  propertyEntrySchema,
  propertySchema,
  recurringItemSchema,
  sharedExpenseSchema,
  transactionSchema,
  vehicleEntrySchema,
  vehicleSchema,
} from "./models";

const entityId = z.string().uuid();
const month = z.string().regex(/^\d{4}-\d{2}$/);

export const financeCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("addTransaction"), value: transactionSchema }),
  z.object({ type: z.literal("updateTransaction"), value: transactionSchema }),
  z.object({ type: z.literal("addAccount"), value: accountSchema }),
  z.object({ type: z.literal("updateAccount"), value: accountSchema }),
  z.object({ type: z.literal("addProperty"), value: propertySchema }),
  z.object({ type: z.literal("updateProperty"), value: propertySchema }),
  z.object({ type: z.literal("addPropertyEntry"), value: propertyEntrySchema }),
  z.object({ type: z.literal("updatePropertyEntry"), value: propertyEntrySchema }),
  z.object({ type: z.literal("addInvestment"), value: investmentSchema }),
  z.object({ type: z.literal("updateInvestment"), value: investmentSchema }),
  z.object({ type: z.literal("addInvestmentEntry"), value: investmentEntrySchema }),
  z.object({ type: z.literal("updateInvestmentEntry"), value: investmentEntrySchema }),
  z.object({ type: z.literal("addRecurringItem"), value: recurringItemSchema }),
  z.object({ type: z.literal("updateRecurringItem"), value: recurringItemSchema }),
  z.object({ type: z.literal("addSharedExpense"), value: sharedExpenseSchema }),
  z.object({ type: z.literal("updateSharedExpense"), value: sharedExpenseSchema }),
  z.object({ type: z.literal("addVehicle"), value: vehicleSchema }),
  z.object({ type: z.literal("updateVehicle"), value: vehicleSchema }),
  z.object({ type: z.literal("addVehicleEntry"), value: vehicleEntrySchema }),
  z.object({ type: z.literal("updateVehicleEntry"), value: vehicleEntrySchema }),
  z.object({ type: z.literal("addCategory"), value: categorySchema }),
  z.object({ type: z.literal("updateCategory"), value: categorySchema }),
  z.object({ type: z.literal("addPaymentMethod"), value: paymentMethodSchema }),
  z.object({ type: z.literal("updatePaymentMethod"), value: paymentMethodSchema }),
  z.object({ type: z.literal("addInvestmentType"), value: investmentTypeSchema }),
  z.object({ type: z.literal("updateInvestmentType"), value: investmentTypeSchema }),
  z.object({
    type: z.literal("deleteEntity"),
    entity: z.enum(["transaction", "account", "property", "propertyEntry", "investment", "investmentEntry", "recurringItem", "sharedExpense", "vehicle", "vehicleEntry", "category", "paymentMethod", "investmentType"]),
    id: entityId,
  }),
  z.object({
    type: z.literal("setActive"),
    entity: z.enum(["account", "property", "investment", "recurringItem", "vehicle"]),
    id: entityId,
    active: z.boolean(),
    closedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  z.object({ type: z.literal("setSharedExpenseSettled"), id: entityId, settled: z.boolean() }),
  z.object({ type: z.literal("settleSharedExpenseMonth"), month, settled: z.boolean() }),
]);

export type FinanceCommand = z.infer<typeof financeCommandSchema>;
