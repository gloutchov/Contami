import { describe, expect, it } from "vitest";
import { createEmptyFinanceData } from "../../src/domain/finance";
import {
  financeExecuteIpcArgumentsSchema,
  importPreviewIpcArgumentsSchema,
  importPreviewIdIpcArgumentsSchema,
  importTemplateGenerateIpcArgumentsSchema,
  noIpcArgumentsSchema,
  settingsUpdateIpcArgumentsSchema,
  workbookCreateIpcArgumentsSchema,
} from "../../src/shared/ipcValidation";

describe("IPC argument validation", () => {
  it("rejects unexpected arguments on parameterless channels", () => {
    expect(noIpcArgumentsSchema.safeParse([]).success).toBe(true);
    expect(noIpcArgumentsSchema.safeParse(["unexpected"]).success).toBe(false);
  });

  it("accepts only strict user-editable settings", () => {
    expect(settingsUpdateIpcArgumentsSchema.safeParse([{ language: "it", theme: "dark" }]).success).toBe(true);
    expect(settingsUpdateIpcArgumentsSchema.safeParse([{ workbookPath: "C:\\private.xlsx" }]).success).toBe(false);
    expect(settingsUpdateIpcArgumentsSchema.safeParse([{ theme: "neon" }]).success).toBe(false);
  });

  it("bounds workbook formats and finance command payloads", () => {
    expect(workbookCreateIpcArgumentsSchema.safeParse(["excel"]).success).toBe(true);
    expect(workbookCreateIpcArgumentsSchema.safeParse(["csv"]).success).toBe(false);
    const data = createEmptyFinanceData(2026);
    expect(financeExecuteIpcArgumentsSchema.safeParse([{
      type: "deleteEntity",
      entity: "category",
      id: data.categories[0].id,
    }]).success).toBe(true);
    const vehicleId = crypto.randomUUID();
    const installment = {
      id: crypto.randomUUID(), name: "Synthetic vehicle", kind: "installment", direction: "expense",
      amount: 250, frequency: "monthly", categoryId: data.categories[4].id,
      paymentMethodId: data.paymentMethods[0].id, accountId: crypto.randomUUID(), vehicleId,
      nextDueDate: "2026-09-01", remainingInstallments: 3, active: true, notes: "",
    } as const;
    expect(financeExecuteIpcArgumentsSchema.safeParse([{
      type: "addVehicleWithInstallment",
      value: {
        vehicle: { id: vehicleId, name: "Synthetic vehicle", manufacturer: "", model: "", fuelType: "electric", active: true, notes: "" },
        installment,
      },
    }]).success).toBe(true);
    expect(financeExecuteIpcArgumentsSchema.safeParse([{
      type: "addVehicleWithInstallment",
      value: {
        vehicle: { id: vehicleId, name: "Synthetic vehicle", manufacturer: "", model: "", fuelType: "electric", active: true, notes: "" },
        installment: { ...installment, vehicleId: crypto.randomUUID() },
      },
    }]).success).toBe(false);
    expect(financeExecuteIpcArgumentsSchema.safeParse([{ type: "deleteEntity", entity: "category", id: "not-a-uuid" }]).success).toBe(false);
  });

  it("accepts only known import template types and UI languages", () => {
    expect(importTemplateGenerateIpcArgumentsSchema.safeParse(["transactions", "it"]).success).toBe(true);
    expect(importTemplateGenerateIpcArgumentsSchema.safeParse(["bank-statements", "it"]).success).toBe(false);
    expect(importTemplateGenerateIpcArgumentsSchema.safeParse(["transactions", "fr"]).success).toBe(false);
    expect(importTemplateGenerateIpcArgumentsSchema.safeParse(["transactions", "it", "C:\\private.xlsx"]).success).toBe(false);
  });

  it("bounds import preview strategies and keeps confirmation opaque", () => {
    const previewId = crypto.randomUUID();
    expect(importPreviewIpcArgumentsSchema.safeParse(["skip", "it"]).success).toBe(true);
    expect(importPreviewIpcArgumentsSchema.safeParse(["overwrite-all", "it"]).success).toBe(false);
    expect(importPreviewIpcArgumentsSchema.safeParse(["update", "fr"]).success).toBe(false);
    expect(importPreviewIdIpcArgumentsSchema.safeParse([previewId]).success).toBe(true);
    expect(importPreviewIdIpcArgumentsSchema.safeParse([previewId, { commands: [] }]).success).toBe(false);
    expect(importPreviewIdIpcArgumentsSchema.safeParse(["C:\\private.xlsx"]).success).toBe(false);
  });
});
