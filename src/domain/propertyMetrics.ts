import type { PropertyEntry } from "./models";

export type PropertyUtilityKind = "electricity" | "gas" | "water" | "phoneInternet";

export function normalizePropertyText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_/.-]+/g, " ")
    .toLocaleLowerCase();
}

function entryText(entry: Pick<PropertyEntry, "category" | "description">): string {
  return normalizePropertyText(`${entry.category} ${entry.description}`);
}

function includesAny(value: string, tokens: string[]): boolean {
  return tokens.some((token) => value.includes(token));
}

export function propertyUtilityKind(entry: Pick<PropertyEntry, "category" | "description" | "detailKind">): PropertyUtilityKind | undefined {
  if (entry.detailKind === "utility_electricity") return "electricity";
  if (entry.detailKind === "utility_gas") return "gas";
  if (entry.detailKind === "utility_water") return "water";
  if (entry.detailKind === "utility_phone_internet") return "phoneInternet";

  const value = entryText(entry);
  if (includesAny(value, ["electric", "luce"])) return "electricity";
  if (includesAny(value, ["gas"])) return "gas";
  if (includesAny(value, ["water", "acqua"])) return "water";
  if (includesAny(value, ["telefono", "internet", "phone", "broadband"])) return "phoneInternet";
  return undefined;
}

export function propertyElectricityKwh(entry: Pick<PropertyEntry, "quantity" | "electricityKwhF1" | "electricityKwhF2" | "electricityKwhF3" | "electricityKwhF23">): number {
  if (entry.quantity !== undefined && entry.quantity > 0) return entry.quantity;
  const f1 = entry.electricityKwhF1 ?? 0;
  const f23 = entry.electricityKwhF23 ?? 0;
  const f2 = entry.electricityKwhF2 ?? 0;
  const f3 = entry.electricityKwhF3 ?? 0;
  return f1 + (f23 > 0 ? f23 : f2 + f3);
}

export function propertyConsumptionQuantity(entry: PropertyEntry, kind: Exclude<PropertyUtilityKind, "phoneInternet">): number {
  if (propertyUtilityKind(entry) !== kind) return 0;
  if (kind === "electricity") return propertyElectricityKwh(entry);
  return entry.quantity ?? 0;
}

export function isPropertyUtilityCost(entry: PropertyEntry, kind: PropertyUtilityKind): boolean {
  return entry.kind === "expense" && propertyUtilityKind(entry) === kind;
}

export function isCondominiumCost(entry: Pick<PropertyEntry, "kind" | "category" | "description">): boolean {
  if (entry.kind !== "expense") return false;
  const value = entryText(entry);
  return includesAny(value, ["condomin", "spese comuni", "common expense", "condominium"]);
}
