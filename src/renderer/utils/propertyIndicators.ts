import type { PropertyEntry } from "../../domain/models";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
const matches = (item: PropertyEntry, tokens: string[]) => tokens.some((token) => normalize(`${item.category} ${item.description}`).includes(token));

export function summarizeResidenceEntries(entries: PropertyEntry[], year: number) {
  const current = entries.filter((item) => item.date.startsWith(String(year)));
  const consumption = (...tokens: string[]) => current
    .filter((item) => item.kind === "consumption" && matches(item, tokens))
    .reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const expense = (...tokens: string[]) => current
    .filter((item) => item.kind === "expense" && matches(item, tokens))
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    electricity: consumption("electric", "luce"),
    gas: consumption("gas"),
    water: consumption("water", "acqua"),
    electricityCost: expense("electric", "luce"),
    gasCost: expense("gas"),
    waterCost: expense("water", "acqua"),
    condominium: expense("condomin"),
    phoneInternet: expense("telefono", "internet", "phone", "broadband"),
    tvLicence: expense("canone tv", "canone rai", "tv licence", "tv license"),
  };
}
