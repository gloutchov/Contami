import { expect, test, type Page } from "@playwright/test";

async function useEnglish(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "English" }).click();
  await page.getByRole("button", { name: "Light" }).click();
}

test("keeps cash-register balances separate and internal transfers neutral", async ({ page }) => {
  await useEnglish(page);
  const accountCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Account", exact: true }) });
  const cashCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Cash registers", exact: true }) });
  await expect(accountCard).toContainText("Bank · Balance: €27,389.71");

  await cashCard.getByRole("button", { name: "New cash register" }).click();
  const cashDialog = page.getByRole("dialog", { name: "New cash register" });
  await cashDialog.getByLabel("Name").fill("Synthetic cash register");
  await cashDialog.getByLabel("Default funding account").selectOption({ label: "Main account" });
  await cashDialog.getByRole("button", { name: "Save" }).click();
  await expect(cashCard).toContainText("Synthetic cash register");

  await page.getByRole("navigation").getByRole("button", { name: "Transactions", exact: true }).click();
  await page.getByRole("button", { name: "New transaction" }).click();
  const withdrawalDialog = page.getByRole("dialog", { name: "New transaction" });
  await withdrawalDialog.getByLabel("Type").selectOption("transfer");
  await withdrawalDialog.getByLabel("Description", { exact: true }).fill("Synthetic ATM withdrawal");
  await withdrawalDialog.getByLabel("Category").selectOption({ label: "Other" });
  await expect(withdrawalDialog.getByLabel("Source account or cash register")).toHaveValue(/.+/);
  await expect(withdrawalDialog.getByLabel("Destination account or cash register")).toHaveValue(/.+/);
  await withdrawalDialog.getByLabel("Amount").fill("100");
  await withdrawalDialog.getByRole("button", { name: "Save" }).click();

  await page.getByRole("navigation").getByRole("button", { name: "Settings", exact: true }).click();
  await expect(accountCard).toContainText("Bank · Balance: €27,289.71");
  await expect(cashCard).toContainText("Cash · Balance: €100.00");

  await page.getByRole("navigation").getByRole("button", { name: "Transactions", exact: true }).click();
  await page.getByRole("button", { name: "New transaction" }).click();
  const cashExpenseDialog = page.getByRole("dialog", { name: "New transaction" });
  await cashExpenseDialog.getByLabel("Description", { exact: true }).fill("Synthetic cash expense");
  await cashExpenseDialog.getByLabel("Category").selectOption({ label: "Groceries" });
  await cashExpenseDialog.getByLabel("Payment method").selectOption({ label: "Contanti" });
  await expect(cashExpenseDialog.getByLabel("Cash register")).toHaveValue(/.+/);
  await cashExpenseDialog.getByLabel("Amount").fill("20");
  await cashExpenseDialog.getByRole("button", { name: "Save" }).click();

  await page.getByRole("navigation").getByRole("button", { name: "Settings", exact: true }).click();
  await expect(accountCard).toContainText("Bank · Balance: €27,289.71");
  await expect(cashCard).toContainText("Cash · Balance: €80.00");

  await page.getByRole("navigation").getByRole("button", { name: "Overview", exact: true }).click();
  const overviewCashBalance = page.locator("article.kpi-card").filter({ hasText: "Cash register balance" });
  await expect(overviewCashBalance).toContainText("€80.00");

  await page.getByRole("navigation").getByRole("button", { name: "Transactions", exact: true }).click();
  const transactionKpis = page.locator(".transaction-kpi-grid .kpi-card");
  await expect(transactionKpis).toHaveCount(6);
  const kpiBoxes = await transactionKpis.evaluateAll((cards) => cards.map((card) => {
    const box = card.getBoundingClientRect();
    return { x: box.x, y: box.y, right: box.right };
  }));
  expect(new Set(kpiBoxes.slice(0, 3).map((box) => Math.round(box.y))).size).toBe(1);
  expect(new Set(kpiBoxes.slice(3).map((box) => Math.round(box.y))).size).toBe(1);
  expect(kpiBoxes[3]!.y).toBeGreaterThan(kpiBoxes[0]!.y);
  expect(Math.max(...kpiBoxes.map((box) => box.right))).toBeLessThanOrEqual(1080);
  await expect(transactionKpis.filter({ hasText: "Cash register inflows (filtered)" })).toContainText("€100.00");
  await expect(transactionKpis.filter({ hasText: "Cash register outflows (filtered)" })).toContainText("€20.00");
  await expect(transactionKpis.filter({ hasText: "Cash register balance (filtered)" })).toContainText("€80.00");

  const paymentMethodFilter = page.locator(".filter-toolbar").getByRole("combobox", { name: "Payment method" });
  await paymentMethodFilter.selectOption({ label: "Contanti" });
  await expect(transactionKpis.filter({ hasText: "Account inflows (filtered)" })).toContainText("€0.00");
  await expect(transactionKpis.filter({ hasText: "Account outflows (filtered)" })).toContainText("€0.00");
  await expect(transactionKpis.filter({ hasText: "Cash register inflows (filtered)" })).toContainText("€0.00");
  await expect(transactionKpis.filter({ hasText: "Cash register outflows (filtered)" })).toContainText("€20.00");
  await expect(transactionKpis.filter({ hasText: "Cash register balance (filtered)" })).toContainText("-€20.00");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

test("marks investment and pension card values as losses", async ({ page }) => {
  await useEnglish(page);
  await page.getByRole("navigation").getByRole("button", { name: "Investments", exact: true }).click();
  await page.getByRole("button", { name: "New investment" }).click();
  const investmentDialog = page.getByRole("dialog", { name: "New investment" });
  await investmentDialog.getByLabel("Name").fill("Synthetic loss position");
  await investmentDialog.getByLabel(/Initial contribution/).fill("1000");
  await investmentDialog.getByRole("button", { name: "Save" }).click();

  const investmentCard = page.locator("article.entity-card").filter({ has: page.getByRole("heading", { name: "Synthetic loss position" }) });
  await expect(investmentCard.locator(".entity-value")).not.toHaveClass(/value-loss/);
  await investmentCard.click();
  await page.getByRole("dialog", { name: "Synthetic loss position" }).getByRole("button", { name: "Update value" }).click();
  const valuationDialog = page.getByRole("dialog", { name: "Update value" });
  await valuationDialog.getByLabel("Amount").fill("800");
  await valuationDialog.getByLabel("Description").fill("Synthetic loss valuation");
  await valuationDialog.getByRole("button", { name: "Save" }).click();
  await expect(investmentCard.locator(".entity-value")).toHaveClass(/value-loss/);

  await page.getByRole("navigation").getByRole("button", { name: "Private Pension", exact: true }).click();
  const compartmentCard = page.locator("article.entity-card").filter({ has: page.getByRole("heading", { name: "Linea Equilibrio" }) });
  await compartmentCard.click();
  await page.getByRole("dialog", { name: "Linea Equilibrio" }).getByRole("button", { name: "Update value" }).click();
  const pensionValuationDialog = page.getByRole("dialog", { name: "Update value" });
  await pensionValuationDialog.getByLabel("Amount").fill("100");
  await pensionValuationDialog.getByLabel("Description").fill("Synthetic pension loss valuation");
  await pensionValuationDialog.getByRole("button", { name: "Save" }).click();
  await expect(compartmentCard.locator(".entity-value")).toHaveClass(/value-loss/);
});
