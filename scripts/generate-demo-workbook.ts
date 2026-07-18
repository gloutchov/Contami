import path from "node:path";
import { createEmptyFinanceData } from "../src/domain/finance";
import { ExcelWorkbookRepository } from "../src/infrastructure/spreadsheet/ExcelWorkbookRepository";

async function main(): Promise<void> {
const output = process.argv[2];
if (!output || !path.isAbsolute(output)) throw new Error("Pass an absolute .xlsx output path");

const data = createEmptyFinanceData(2026);
const timestamp = "2026-07-18T10:00:00.000Z";
const accountId = crypto.randomUUID();
const propertyId = crypto.randomUUID();
const investmentId = crypto.randomUUID();

data.accounts.push({
  id: accountId, name: "Conto demo", kind: "bank", currency: "EUR", openingBalance: 6_500,
  active: true, openedAt: "2026-01-01", notes: "Synthetic QA data / Dati sintetici di collaudo",
});
data.transactions.push(
  { id: crypto.randomUUID(), date: "2026-01-27", description: "Entrata demo", categoryId: data.categories[0].id, paymentMethodId: data.paymentMethods[0].id, accountId, kind: "income", amount: 3_200, currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp },
  { id: crypto.randomUUID(), date: "2026-02-05", description: "Spesa demo", categoryId: data.categories[2].id, paymentMethodId: data.paymentMethods[1].id, accountId, kind: "expense", amount: 186.4, currency: "EUR", notes: "", createdAt: timestamp, updatedAt: timestamp },
);
data.properties.push({ id: propertyId, name: "Immobile demo", kind: "apartment", ownershipShare: 1, purchaseDate: "2020-03-14", purchasePrice: 220_000, active: true, notes: "" });
data.propertyEntries.push(
  { id: crypto.randomUUID(), propertyId, date: "2026-06-30", kind: "valuation", category: "Valutazione", description: "Valutazione demo", amount: 245_000, notes: "" },
  { id: crypto.randomUUID(), propertyId, date: "2026-06-30", kind: "consumption", category: "Energia", description: "Consumo demo", amount: 0, quantity: 178, unit: "kWh", notes: "" },
);
data.investments.push({ id: investmentId, name: "Fondo demo", kind: "fund", provider: "Gestore demo", currency: "EUR", active: true, openedAt: "2024-05-01", notes: "" });
data.investmentEntries.push({ id: crypto.randomUUID(), investmentId, date: "2026-07-01", kind: "valuation", amount: 34_750, description: "Valutazione demo", notes: "" });
data.recurringItems.push({ id: crypto.randomUUID(), name: "Servizio demo", kind: "subscription", amount: 12.9, frequency: "monthly", categoryId: data.categories[7].id, paymentMethodId: data.paymentMethods[3].id, nextDueDate: "2026-08-01", active: true, notes: "" });
data.sharedExpenses.push({ id: crypto.randomUUID(), date: "2026-07-12", description: "Spesa condivisa demo", categoryId: data.categories[6].id, paymentMethodId: data.paymentMethods[1].id, amount: 80, ownerShare: 40, partnerShare: 40, paidBy: "owner", settled: false, notes: "" });
data.meta.updatedAt = timestamp;

await new ExcelWorkbookRepository().save(output, data);
console.log(output);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Workbook generation failed");
  process.exitCode = 1;
});
