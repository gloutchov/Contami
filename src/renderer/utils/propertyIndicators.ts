import type { PropertyEntry } from "../../domain/models";
import { isCondominiumCost, isPropertyUtilityCost, normalizePropertyText, propertyConsumptionQuantity } from "../../domain/propertyMetrics";

export function summarizeResidenceEntries(entries: PropertyEntry[], year: number) {
  const current = entries.filter((item) => item.date.startsWith(String(year)));
  const consumption = (kind: "electricity" | "gas" | "water") => current
    .filter((item) => item.kind === "consumption" || item.detailKind?.startsWith("utility_"))
    .reduce((sum, item) => sum + propertyConsumptionQuantity(item, kind), 0);
  const utilityExpense = (kind: "electricity" | "gas" | "water" | "phoneInternet") => current
    .filter((item) => isPropertyUtilityCost(item, kind))
    .reduce((sum, item) => sum + item.amount, 0);
  const textExpense = (...tokens: string[]) => current
    .filter((item) => item.kind === "expense" && tokens.some((token) => normalizePropertyText(`${item.category} ${item.description}`).includes(token)))
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    electricity: consumption("electricity"),
    gas: consumption("gas"),
    water: consumption("water"),
    electricityCost: utilityExpense("electricity"),
    gasCost: utilityExpense("gas"),
    waterCost: utilityExpense("water"),
    condominium: current.filter((item) => isCondominiumCost(item)).reduce((sum, item) => sum + item.amount, 0),
    phoneInternet: utilityExpense("phoneInternet"),
    tvLicence: textExpense("canone tv", "canone rai", "tv licence", "tv license"),
  };
}
