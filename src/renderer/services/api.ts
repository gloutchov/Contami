import { applyFinanceCommand, computeDashboard, createEmptyFinanceData } from "../../domain/finance";
import type { FinanceData } from "../../domain/models";
import type { AppSettings, ContaMiApi, FinanceSnapshot } from "../../shared/contracts";

function demoData(): FinanceData {
  const data = createEmptyFinanceData(new Date().getFullYear());
  const now = new Date().toISOString();
  const category = (name: string) => data.categories.find((item) => item.nameEn === name)!.id;
  const payment = data.paymentMethods[1].id;
  const accountId = crypto.randomUUID();
  const recurringId = crypto.randomUUID();
  data.accounts.push({ id: accountId, name: "Main account", kind: "bank", currency: "EUR", openingBalance: 24_800, active: true, openedAt: `${data.meta.activeYear}-01-01`, notes: "" });
  data.transactions.push(
    { id: crypto.randomUUID(), date: `${data.meta.activeYear}-01-04`, description: "Salary", categoryId: category("Salary"), paymentMethodId: payment, accountId, kind: "income", amount: 3_250, currency: "EUR", notes: "", createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), date: `${data.meta.activeYear}-01-07`, description: "Groceries", categoryId: category("Groceries"), paymentMethodId: payment, accountId, kind: "expense", amount: 138.40, currency: "EUR", notes: "", createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), date: `${data.meta.activeYear}-02-04`, description: "Salary", categoryId: category("Salary"), paymentMethodId: payment, accountId, kind: "income", amount: 3_250, currency: "EUR", notes: "", createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), date: `${data.meta.activeYear}-02-13`, description: "Train", categoryId: category("Transport"), paymentMethodId: payment, accountId, kind: "expense", amount: 84, currency: "EUR", notes: "", createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), date: `${data.meta.activeYear}-03-04`, description: "Salary", categoryId: category("Salary"), paymentMethodId: payment, accountId, kind: "income", amount: 3_250, currency: "EUR", notes: "", createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), date: `${data.meta.activeYear}-03-18`, description: "Electricity", categoryId: category("Home"), paymentMethodId: payment, accountId, kind: "expense", amount: 126.90, currency: "EUR", notes: "", createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), date: `${data.meta.activeYear}-06-01`, description: "Music", categoryId: category("Services & subscriptions"), paymentMethodId: payment, accountId, kind: "expense", amount: 10.99, currency: "EUR", recurringId, notes: "", createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), date: `${data.meta.activeYear}-12-01`, description: "Music", categoryId: category("Services & subscriptions"), paymentMethodId: payment, accountId, kind: "expense", amount: 10.99, currency: "EUR", recurringId, planned: true, notes: "", createdAt: now, updatedAt: now },
  );
  const propertyId = crypto.randomUUID();
  data.properties.push({ id: propertyId, name: "City apartment", kind: "apartment", usage: "residence", address: "Via Esempio 12, Milano", areaSqm: 92, ownershipShare: 1, cadastralValue: 124_000, purchasePrice: 245_000, active: true, notes: "" });
  data.propertyEntries.push(
    { id: crypto.randomUUID(), propertyId, date: `${data.meta.activeYear}-01-01`, kind: "valuation", category: "Market value", description: "Annual valuation", amount: 278_000, notes: "" },
    { id: crypto.randomUUID(), propertyId, date: `${data.meta.activeYear}-03-18`, kind: "consumption", category: "Electricity", description: "Electricity consumption", amount: 0, quantity: 412, unit: "kWh", notes: "" },
    { id: crypto.randomUUID(), propertyId, date: `${data.meta.activeYear}-03-18`, kind: "consumption", category: "Gas", description: "Gas consumption", amount: 0, quantity: 286, unit: "m³", notes: "" },
    { id: crypto.randomUUID(), propertyId, date: `${data.meta.activeYear}-03-18`, kind: "consumption", category: "Water", description: "Water consumption", amount: 0, quantity: 58, unit: "m³", notes: "" },
    { id: crypto.randomUUID(), propertyId, date: `${data.meta.activeYear}-03-18`, kind: "expense", category: "Electricity", categoryId: category("Home"), description: "Electricity bill", amount: 126.90, paymentMethodId: payment, notes: "" },
    { id: crypto.randomUUID(), propertyId, date: `${data.meta.activeYear}-03-19`, kind: "expense", category: "Gas", categoryId: category("Home"), description: "Gas bill", amount: 98.40, paymentMethodId: payment, notes: "" },
    { id: crypto.randomUUID(), propertyId, date: `${data.meta.activeYear}-03-20`, kind: "expense", category: "Water", categoryId: category("Home"), description: "Water bill", amount: 42.50, paymentMethodId: payment, notes: "" },
    { id: crypto.randomUUID(), propertyId, date: `${data.meta.activeYear}-02-15`, kind: "expense", category: "Condominium", categoryId: category("Home"), description: "Condominium installment", amount: 540, paymentMethodId: payment, notes: "" },
    { id: crypto.randomUUID(), propertyId, date: `${data.meta.activeYear}-04-01`, kind: "expense", category: "Internet", categoryId: category("Home"), description: "Home internet", amount: 180, paymentMethodId: payment, notes: "" },
    { id: crypto.randomUUID(), propertyId, date: `${data.meta.activeYear}-01-31`, kind: "expense", category: "Canone TV", categoryId: category("Home"), description: "Canone TV", amount: 90, paymentMethodId: payment, notes: "" },
  );
  data.propertyAnnualSummaries.push(
    { propertyId, year: data.meta.activeYear - 2, income: 0, expenses: 1_850, closingValue: 260_000, electricityKwh: 1_280, gasCubicMeters: 920, waterCubicMeters: 104, electricityCost: 520, gasCost: 610, waterCost: 145 },
    { propertyId, year: data.meta.activeYear - 1, income: 0, expenses: 1_920, closingValue: 270_000, electricityKwh: 1_210, gasCubicMeters: 860, waterCubicMeters: 98, electricityCost: 495, gasCost: 570, waterCost: 138 },
  );
  const rentalId = crypto.randomUUID();
  data.properties.push({ id: rentalId, name: "Rental apartment", kind: "apartment", usage: "rental", address: "Via Demo 8, Milano", areaSqm: 68, ownershipShare: 0.5, cadastralValue: 88_000, expectedMonthlyRent: 750, rentDueDay: 5, purchasePrice: 180_000, active: true, notes: "" });
  data.propertyEntries.push(
    { id: crypto.randomUUID(), propertyId: rentalId, date: `${data.meta.activeYear}-01-01`, kind: "valuation", category: "Market value", description: "Annual valuation", amount: 210_000, notes: "" },
    { id: crypto.randomUUID(), propertyId: rentalId, date: `${data.meta.activeYear}-06-05`, kind: "income", category: "Rent", categoryId: category("Rent income"), description: "June rent", amount: 750, paymentMethodId: payment, notes: "" },
    { id: crypto.randomUUID(), propertyId: rentalId, date: `${data.meta.activeYear}-06-18`, kind: "expense", category: "Home", categoryId: category("Home"), description: "Routine maintenance", amount: 180, paymentMethodId: payment, notes: "" },
  );
  data.propertyAnnualSummaries.push(
    { propertyId: rentalId, year: data.meta.activeYear - 2, income: 8_400, expenses: 1_250, closingValue: 195_000, electricityKwh: 0, gasCubicMeters: 0, waterCubicMeters: 0, electricityCost: 0, gasCost: 0, waterCost: 0 },
    { propertyId: rentalId, year: data.meta.activeYear - 1, income: 8_700, expenses: 980, closingValue: 202_000, electricityKwh: 0, gasCubicMeters: 0, waterCubicMeters: 0, electricityCost: 0, gasCost: 0, waterCost: 0 },
  );
  const investmentId = crypto.randomUUID();
  data.investments.push({ id: investmentId, name: "Balanced portfolio", kind: "fund", typeId: data.investmentTypes.find((item) => item.code === "fund")?.id, provider: "", currency: "EUR", active: true, openedAt: `${data.meta.activeYear - 4}-01-01`, notes: "" });
  data.investmentEntries.push(
    { id: crypto.randomUUID(), investmentId, date: `${data.meta.activeYear}-02-01`, kind: "contribution", amount: 5_000, description: "Contribution", categoryId: category("Investments"), paymentMethodId: payment, notes: "" },
    { id: crypto.randomUUID(), investmentId, date: `${data.meta.activeYear}-03-01`, kind: "valuation", amount: 92_450, description: "Current value", notes: "" },
  );
  data.investmentAnnualSummaries.push(
    { investmentId, year: data.meta.activeYear - 2, closingValue: 79_000, contributions: 70_000, withdrawals: 0 },
    { investmentId, year: data.meta.activeYear - 1, closingValue: 85_000, contributions: 5_000, withdrawals: 0 },
  );
  const pensionTypeId = data.investmentTypes.find((item) => item.code === "pension")?.id;
  const pensionId = crypto.randomUUID();
  const pensionComponents = ["Linea Equilibrio", "Linea Crescita", "Linea Valore"].map((name) => ({ id: crypto.randomUUID(), name }));
  data.investments.push(
    { id: pensionId, name: "Fondo Pensione Fideuram", kind: "pension", typeId: pensionTypeId, provider: "Fideuram", currency: "EUR", active: true, openedAt: `${data.meta.activeYear - 6}-01-01`, notes: "" },
    ...pensionComponents.map((item) => ({ id: item.id, name: item.name, kind: "pension" as const, typeId: pensionTypeId, parentInvestmentId: pensionId, provider: "Fideuram", currency: "EUR", active: true, openedAt: `${data.meta.activeYear - 6}-01-01`, notes: "" })),
  );
  pensionComponents.forEach((item, index) => {
    data.investmentEntries.push(
      { id: crypto.randomUUID(), investmentId: item.id, date: `${data.meta.activeYear}-01-31`, kind: "contribution", amount: 600, description: "Pension contribution", categoryId: category("Investments"), paymentMethodId: payment, notes: "" },
      { id: crypto.randomUUID(), investmentId: item.id, date: `${data.meta.activeYear}-06-30`, kind: "valuation", amount: [18_450, 12_780, 9_620][index], description: "Current value", notes: "" },
    );
    data.investmentAnnualSummaries.push(
      { investmentId: item.id, year: data.meta.activeYear - 2, closingValue: [15_000, 9_000, 7_000][index], contributions: 4_800, withdrawals: 0 },
      { investmentId: item.id, year: data.meta.activeYear - 1, closingValue: [16_800, 10_600, 8_100][index], contributions: 1_200, withdrawals: 0 },
    );
  });
  const previousVehicleId = crypto.randomUUID(); const currentVehicleId = crypto.randomUUID();
  data.vehicles.push(
    { id: previousVehicleId, name: "Previous demo car", manufacturer: "Example", model: "Classic", fuelType: "petrol", purchaseDate: `${data.meta.activeYear - 8}-01-01`, disposalDate: `${data.meta.activeYear - 2}-12-31`, purchasePrice: 18_000, salePrice: 6_000, active: false, notes: "" },
    { id: currentVehicleId, name: "Current demo car", manufacturer: "Example", model: "Hybrid", fuelType: "hybrid", purchaseDate: `${data.meta.activeYear - 1}-01-01`, purchasePrice: 27_000, active: true, notes: "" },
  );
  data.vehicleAnnualSummaries.push(
    { vehicleId: previousVehicleId, year: data.meta.activeYear - 2, totalCosts: 14_500, fuelCosts: 8_200, installments: 0, taxes: 1_050, insurance: 2_300, tires: 900, maintenance: 1_350, repairs: 700, fuelLiters: 0, distanceKm: 86_000, closingOdometer: 86_000 },
    { vehicleId: currentVehicleId, year: data.meta.activeYear - 1, totalCosts: 4_200, fuelCosts: 1_150, installments: 1_800, taxes: 220, insurance: 620, tires: 0, maintenance: 410, repairs: 0, fuelLiters: 620, distanceKm: 12_400, averageKmPerLiter: 20, closingOdometer: 12_400 },
  );
  data.vehicleEntries.push(
    { id: crypto.randomUUID(), vehicleId: currentVehicleId, date: `${data.meta.activeYear}-05-10`, kind: "fuel", description: "Demo fuel", amount: 64, distanceKm: 720, fuelLiters: 36, odometerKm: 18_200, categoryId: category("Transport"), paymentMethodId: payment, notes: "" },
    { id: crypto.randomUUID(), vehicleId: currentVehicleId, date: `${data.meta.activeYear}-06-20`, kind: "insurance", description: "Demo insurance", amount: 620, categoryId: category("Transport"), paymentMethodId: payment, notes: "" },
  );
  data.recurringItems.push({ id: recurringId, name: "Music", kind: "subscription", amount: 10.99, frequency: "monthly", categoryId: category("Services & subscriptions"), paymentMethodId: payment, nextDueDate: `${data.meta.activeYear}-08-01`, active: true, notes: "" });
  data.sharedExpenses.push({ id: crypto.randomUUID(), date: `${data.meta.activeYear}-07-12`, description: "Weekend groceries", categoryId: category("Groceries"), paymentMethodId: payment, amount: 86, ownerShare: 43, partnerShare: 43, paidBy: "owner", settled: false, notes: "" });
  data.annualSummaries.push(
    { year: data.meta.activeYear - 2, income: 37_800, expenses: 29_400, netCashFlow: 8_400, closingNetWorth: 367_000, liquidBalance: 28_000, propertyValue: 260_000, investmentValue: 79_000, pensionValue: 0, monthlyRecurring: 245, vehicleCosts: 0 },
    { year: data.meta.activeYear - 1, income: 39_600, expenses: 31_200, netCashFlow: 8_400, closingNetWorth: 386_500, liquidBalance: 31_500, propertyValue: 270_000, investmentValue: 85_000, pensionValue: 0, monthlyRecurring: 230, vehicleCosts: 0 },
  );
  return data;
}
function createDevelopmentApi(): ContaMiApi {
  const missingWorkbookScenario = new URLSearchParams(window.location.search).get("qa") === "missing-workbook";
  let settings: AppSettings = { language: "system", theme: "system", workbookFormat: "excel" };
  let data = missingWorkbookScenario ? createEmptyFinanceData(new Date().getFullYear()) : demoData();
  let configured = !missingWorkbookScenario;
  let warningCode = missingWorkbookScenario ? "WORKBOOK_MISSING" : undefined;
  const snapshot = (): FinanceSnapshot => ({ data: structuredClone(data), metrics: computeDashboard(data), workbookConfigured: configured, workbookDisplayName: configured ? "ContaMi-demo.xlsx" : undefined, lastSavedAt: configured ? data.meta.updatedAt : undefined, warningCode });
  return {
    getSettings: async () => settings,
    updateSettings: async (patch) => { settings = { ...settings, ...patch }; return settings; },
    getCapabilities: async () => ({ platform: "darwin", systemLanguage: navigator.language.startsWith("it") ? "it" : "en", systemTheme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light", numbersAvailable: false }),
    getSnapshot: async () => snapshot(),
    createWorkbook: async () => { configured = true; warningCode = undefined; return { canceled: false, path: "ContaMi-demo.xlsx" }; },
    openWorkbook: async () => { configured = true; warningCode = undefined; return { canceled: false, path: "ContaMi-demo.xlsx" }; },
    execute: async (command) => { data = applyFinanceCommand(data, command); return snapshot(); },
    rolloverYear: async () => ({ canceled: false, year: data.meta.activeYear + 1, newWorkbookPath: "ContaMi-next.xlsx" }),
    revealWorkbook: async () => true,
    generateImportTemplate: async (type) => ({ canceled: false, fileName: `ContaMi-template-${type.replaceAll("_", "-")}-v1.xlsx` }),
  };
}

let developmentApi: ContaMiApi | undefined;

export function getApi(): ContaMiApi {
  if (window.contami) return window.contami;
  if (import.meta.env.DEV) {
    developmentApi ??= createDevelopmentApi();
    return developmentApi;
  }
  throw new Error("ContaMì secure bridge is unavailable");
}
