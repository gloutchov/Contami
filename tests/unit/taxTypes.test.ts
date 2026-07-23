import { describe, expect, it } from "vitest";
import { applyFinanceCommand, createEmptyFinanceData } from "../../src/domain/finance";
import type { PropertyEntry, TaxType } from "../../src/domain/models";

function addProperty(data: ReturnType<typeof createEmptyFinanceData>, usage: "residence" | "rental" = "residence"): string {
  const id = crypto.randomUUID();
  data.properties.push({
    id, name: "Synthetic property", kind: "apartment", usage,
    ownershipShare: 1, purchasePrice: 0, active: true, notes: "",
  });
  return id;
}

function taxEntry(data: ReturnType<typeof createEmptyFinanceData>, propertyId: string, taxTypeId: string, installment = 1): PropertyEntry {
  return {
    id: crypto.randomUUID(), propertyId, date: "2026-07-23", kind: "expense",
    category: "Synthetic tax", categoryId: data.categories.find((item) => item.kind !== "income")!.id,
    description: "Synthetic tax entry", amount: 100, paymentMethodId: data.paymentMethods[0].id,
    taxTypeId, taxInstallmentNumber: installment, notes: "",
  };
}

describe("configurable property taxes", () => {
  it("creates, updates, archives, reopens and deletes an unused tax type", () => {
    let data = createEmptyFinanceData(2026);
    const taxType: TaxType = {
      id: crypto.randomUUID(), name: "Synthetic levy", appliesTo: "rental", installments: 4, active: true,
    };

    data = applyFinanceCommand(data, { type: "addTaxType", value: taxType });
    data = applyFinanceCommand(data, { type: "updateTaxType", value: { ...taxType, name: "Updated levy", installments: 6 } });
    data = applyFinanceCommand(data, { type: "setActive", entity: "taxType", id: taxType.id, active: false });
    expect(data.taxTypes.find((item) => item.id === taxType.id)).toMatchObject({ name: "Updated levy", installments: 6, active: false });

    data = applyFinanceCommand(data, { type: "setActive", entity: "taxType", id: taxType.id, active: true });
    data = applyFinanceCommand(data, { type: "deleteEntity", entity: "taxType", id: taxType.id });
    expect(data.taxTypes.some((item) => item.id === taxType.id)).toBe(false);
  });

  it("rejects duplicate names and protects taxes referenced by history", () => {
    let data = createEmptyFinanceData(2026);
    const imu = data.taxTypes.find((item) => item.name === "IMU")!;
    const propertyId = addProperty(data);
    data = applyFinanceCommand(data, { type: "addPropertyExpense", value: { entry: taxEntry(data, propertyId, imu.id) } });

    expect(() => applyFinanceCommand(data, {
      type: "addTaxType",
      value: { id: crypto.randomUUID(), name: " imu ", appliesTo: "all", installments: 1, active: true },
    })).toThrow("DUPLICATE_TAX_NAME");
    expect(() => applyFinanceCommand(data, { type: "deleteEntity", entity: "taxType", id: imu.id })).toThrow("ENTITY_IN_USE");

    const archived = applyFinanceCommand(data, { type: "setActive", entity: "taxType", id: imu.id, active: false });
    expect(archived.propertyEntries[0].taxTypeId).toBe(imu.id);
    expect(archived.taxTypes.find((item) => item.id === imu.id)?.active).toBe(false);
  });

  it("validates applicability, active state and installment limits for new entries", () => {
    let data = createEmptyFinanceData(2026);
    const residenceId = addProperty(data, "residence");
    const rentalTax: TaxType = {
      id: crypto.randomUUID(), name: "Rental levy", appliesTo: "rental", installments: 3, active: true,
    };
    data = applyFinanceCommand(data, { type: "addTaxType", value: rentalTax });

    expect(() => applyFinanceCommand(data, {
      type: "addPropertyExpense",
      value: { entry: taxEntry(data, residenceId, rentalTax.id) },
    })).toThrow("TAX_TYPE_NOT_APPLICABLE");
    const rentalId = addProperty(data, "rental");
    expect(() => applyFinanceCommand(data, {
      type: "addPropertyExpense",
      value: { entry: taxEntry(data, rentalId, rentalTax.id, 4) },
    })).toThrow("INVALID_TAX_INSTALLMENT");

    data = applyFinanceCommand(data, {
      type: "addPropertyExpense",
      value: { entry: taxEntry(data, rentalId, rentalTax.id, 3) },
    });
    data = applyFinanceCommand(data, { type: "setActive", entity: "taxType", id: rentalTax.id, active: false });
    expect(() => applyFinanceCommand(data, {
      type: "addPropertyExpense",
      value: { entry: taxEntry(data, rentalId, rentalTax.id, 1) },
    })).toThrow("TAX_TYPE_INACTIVE");
    expect(() => applyFinanceCommand(data, {
      type: "updatePropertyExpense",
      value: { entry: { ...data.propertyEntries[0], taxInstallmentNumber: 4 } },
    })).toThrow("INVALID_TAX_INSTALLMENT");
  });
});
