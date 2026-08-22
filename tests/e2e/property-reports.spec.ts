import { expect, test, type Page } from "@playwright/test";

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  return errors;
}

test("saves a current-year property report in Italian dark mode", async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Italiano" }).click();
  await page.getByRole("button", { name: "Scuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "it");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByRole("navigation").getByRole("button", { name: "Immobili", exact: true }).click();
  await page.getByRole("heading", { name: "City apartment" }).click();
  await page.getByRole("dialog", { name: "City apartment" }).getByRole("button", { name: "Report immobile" }).click();

  const dialog = page.getByRole("dialog", { name: "Report immobile · City apartment" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "Periodo del report" })).toBeFocused();
  await expect(dialog.getByRole("combobox", { name: "Periodo del report" })).toHaveValue("current-year");
  await dialog.getByRole("textbox", { name: "Nome proprietario" }).fill("Giulia Rossi");
  await dialog.getByRole("textbox", { name: "Nome comproprietario" }).fill("Marco Bianchi");
  await expect(dialog).toContainText("non vengono salvati nel workbook");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

  await dialog.getByRole("button", { name: "Salva PDF" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status")).toContainText("ContaMi-report-demo-current-year.pdf");
  expect(consoleErrors).toEqual([]);
});

test("prints a lifetime property report in English light mode", async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "English" }).click();
  await page.getByRole("button", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.getByRole("navigation").getByRole("button", { name: "Properties", exact: true }).click();
  await page.getByRole("heading", { name: "City apartment" }).click();
  await page.getByRole("dialog", { name: "City apartment" }).getByRole("button", { name: "Property report" }).click();

  const dialog = page.getByRole("dialog", { name: "Property report · City apartment" });
  const scope = dialog.getByRole("combobox", { name: "Report period" });
  await scope.selectOption("lifetime");
  await expect(scope).toHaveValue("lifetime");
  const owner = dialog.getByRole("textbox", { name: "Owner name", exact: true });
  const coOwner = dialog.getByRole("textbox", { name: "Co-owner name" });
  await owner.fill("");
  await expect(dialog.getByRole("button", { name: "Print" })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Save PDF" })).toBeDisabled();
  await owner.fill("Alex Morgan");
  await coOwner.fill("Taylor Morgan");
  await dialog.getByRole("button", { name: "Print" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status")).toContainText("Report sent to the print dialog.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  expect(consoleErrors).toEqual([]);
});
