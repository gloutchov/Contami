import { describe, expect, it } from "vitest";
import type { PropertyEntry } from "../../src/domain/models";
import { summarizeResidenceEntries } from "../../src/renderer/utils/propertyIndicators";

const base: PropertyEntry = {
  id: "11111111-1111-4111-8111-111111111111",
  propertyId: "22222222-2222-4222-8222-222222222222",
  date: "2026-01-01",
  kind: "expense",
  category: "Casa",
  description: "Spesa",
  amount: 0,
  notes: "",
};

const entry = (id: string, value: Partial<PropertyEntry>): PropertyEntry => ({ ...base, id, ...value });

describe("residence indicators", () => {
  it("aggregates bilingual utility and household labels for the selected year", () => {
    const result = summarizeResidenceEntries([
      entry("33333333-3333-4333-8333-333333333333", { kind: "consumption", category: "Luce", quantity: 320 }),
      entry("44444444-4444-4444-8444-444444444444", { category: "Servizi", description: "Telefono e Internet", amount: 180 }),
      entry("55555555-5555-4555-8555-555555555555", { category: "Tasse", description: "Canone RAI", amount: 90 }),
      entry("66666666-6666-4666-8666-666666666666", { category: "Condominio", amount: 540 }),
      entry("77777777-7777-4777-8777-777777777777", { date: "2025-01-01", category: "Internet", amount: 999 }),
    ], 2026);

    expect(result).toMatchObject({ electricity: 320, phoneInternet: 180, tvLicence: 90, condominium: 540 });
  });
});
