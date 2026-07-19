import { describe, expect, it } from "vitest";
import { createPropertyAnnualSummaries, createVehicleAnnualSummaries } from "../../src/domain/annualHistory";
import { createEmptyFinanceData } from "../../src/domain/finance";

describe("annual detailed history", () => {
  it("aggregates residence utilities and vehicle cost categories", () => {
    const data = createEmptyFinanceData(2026);
    const propertyId = crypto.randomUUID();
    const vehicleId = crypto.randomUUID();
    data.properties.push({ id: propertyId, name: "Synthetic home", kind: "apartment", usage: "residence", ownershipShare: 1, purchasePrice: 100_000, active: true, notes: "" });
    data.propertyEntries.push(
      { id: crypto.randomUUID(), propertyId, date: "2026-01-31", kind: "consumption", category: "electricity", description: "Reading", amount: 0, quantity: 250, unit: "kWh", notes: "" },
      { id: crypto.randomUUID(), propertyId, date: "2026-02-28", kind: "consumption", category: "acqua fredda", description: "Reading", amount: 0, quantity: 12, unit: "m³", notes: "" },
      { id: crypto.randomUUID(), propertyId, date: "2026-03-31", kind: "expense", category: "Luce", description: "Bolletta elettricità", amount: 85, categoryId: data.categories[3].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
      { id: crypto.randomUUID(), propertyId, date: "2026-04-30", kind: "expense", category: "Acqua", description: "Bolletta acqua", amount: 45, categoryId: data.categories[3].id, paymentMethodId: data.paymentMethods[0].id, notes: "" },
    );
    data.vehicles.push({ id: vehicleId, name: "Synthetic car", manufacturer: "", model: "", fuelType: "petrol", active: true, notes: "" });
    data.vehicleEntries.push(
      { id: crypto.randomUUID(), vehicleId, date: "2026-03-10", kind: "fuel", description: "Fuel", amount: 50, distanceKm: 600, fuelLiters: 30, notes: "" },
      { id: crypto.randomUUID(), vehicleId, date: "2026-04-10", kind: "insurance", description: "Policy", amount: 400, notes: "" },
    );

    expect(createPropertyAnnualSummaries(data)[0]).toMatchObject({ electricityKwh: 250, waterCubicMeters: 12, electricityCost: 85, waterCost: 45 });
    expect(createVehicleAnnualSummaries(data)[0]).toMatchObject({ totalCosts: 450, fuelCosts: 50, insurance: 400, averageKmPerLiter: 20 });
  });
});
