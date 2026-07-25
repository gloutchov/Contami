import { expect, test, type Locator } from "@playwright/test";

test("supports IT/EN, light/dark and keyboard-safe dialogs at 1080 px", async ({ page }) => {
  const consoleErrors: string[] = [];
  const expectProportionalCompactCharts = async (root: Locator) => {
    const checks = await root.locator(".trend-bars").evaluateAll((charts) => charts.map((chart) => {
      const style = getComputedStyle(chart);
      const chartBox = chart.getBoundingClientRect();
      const labels = Array.from(chart.querySelectorAll(".trend-column small")).map((label) => label.getBoundingClientRect());
      const fills = Array.from(chart.querySelectorAll<HTMLElement>(".trend-track i"));
      const renderedHeights = fills.map((fill) => Math.round(fill.getBoundingClientRect().height));
      const requestedHeights = fills.map((fill) => fill.style.height);
      const maximumTrackHeight = Math.max(0, ...Array.from(chart.querySelectorAll(".trend-track")).map((track) => track.getBoundingClientRect().height));
      return {
        barsUseTrackHeight: Math.max(0, ...renderedHeights) >= maximumTrackHeight * 0.95,
        differentValuesHaveDifferentHeights: new Set(requestedHeights).size <= 1 || new Set(renderedHeights).size > 1,
        labelsInside: labels.length > 0 && labels.every((label) => label.height > 0 && label.top >= chartBox.top && label.bottom <= chartBox.bottom - 1),
        overflowY: style.overflowY,
        verticalScroll: chart.scrollHeight > chart.clientHeight + 1,
      };
    }));
    expect(checks.length).toBeGreaterThan(0);
    expect(checks.every((item) => item.barsUseTrackHeight && item.differentValuesHaveDifferentHeights && !item.verticalScroll && item.labelsInside)).toBe(true);
  };
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(navigation).toBeVisible();
  const reducedTransitionMs = await navigation.getByRole("button", { name: "Overview" }).evaluate((element) => {
    const duration = getComputedStyle(element).transitionDuration;
    return Number.parseFloat(duration) * (duration.endsWith("ms") ? 1 : 1_000);
  });
  expect(reducedTransitionMs).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Italiano" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "it");
  await page.getByRole("button", { name: "Scuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const taxCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Tasse", exact: true }) });
  await taxCard.getByRole("button", { name: "Nuova tassa" }).click();
  const taxTypeDialog = page.getByRole("dialog", { name: "Nuova tassa" });
  await taxTypeDialog.getByLabel("Nome della tassa").fill("Tassa sintetica");
  await taxTypeDialog.getByRole("spinbutton", { name: /Numero di rate/ }).fill("3");
  await taxTypeDialog.getByRole("button", { name: "Salva" }).click();
  await expect(taxCard.getByText("Tassa sintetica")).toBeVisible();
  const importCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Importazione dati", exact: true }) });
  await importCard.getByRole("button", { name: "Transazioni" }).click();
  await expect(page.getByRole("status")).toContainText("Creato il template ContaMi-template-transactions-v1.xlsx.");
  await importCard.getByRole("button", { name: "Importa file compilato" }).click();
  const importDialogIt = page.getByRole("dialog", { name: "Anteprima importazione" });
  await expect(importDialogIt).toContainText("Riga 9, colonna category: riferimento non trovato");
  await expect(importDialogIt.getByRole("button", { name: "Chiudi" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(importDialogIt.getByRole("button", { name: "Conferma importazione" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(importDialogIt).toBeHidden();

  await page.getByRole("button", { name: "Immobili", exact: true }).click();
  await page.getByRole("button", { name: "Utenze" }).click();
  const dialog = page.getByRole("dialog", { name: "Registra utenza" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("input, select, textarea").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "Tasse" }).click();
  const propertyTaxDialog = page.getByRole("dialog", { name: "Registra tassa" });
  await propertyTaxDialog.getByLabel("Tassa").selectOption({ label: "Tassa sintetica" });
  const installmentSelect = propertyTaxDialog.locator('select:has(> option[value="3"])');
  await installmentSelect.selectOption("3");
  await expect(installmentSelect).toHaveValue("3");
  await page.keyboard.press("Escape");
  await expect(propertyTaxDialog).toBeHidden();
  await page.getByRole("heading", { name: "City apartment" }).click();
  const propertyDetailDialog = page.getByRole("dialog", { name: "City apartment" });
  await expect(propertyDetailDialog).toBeVisible();
  await expectProportionalCompactCharts(propertyDetailDialog);
  await page.keyboard.press("Escape");
  await expect(propertyDetailDialog).toBeHidden();
  await page.getByRole("button", { name: "Automobile" }).click();
  await page.getByRole("heading", { name: "Current demo car" }).click();
  const vehicleDetailDialog = page.getByRole("dialog", { name: "Current demo car" });
  await expect(vehicleDetailDialog).toBeVisible();
  await expectProportionalCompactCharts(vehicleDetailDialog.locator(".vehicle-history"));
  await page.keyboard.press("Escape");
  await expect(vehicleDetailDialog).toBeHidden();

  await page.getByRole("button", { name: "Impostazioni" }).click();
  await page.getByRole("button", { name: "English" }).click();
  await page.getByRole("button", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("heading", { name: "Data import", exact: true })).toBeVisible();
  const englishImportCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Data import", exact: true }) });
  await englishImportCard.getByRole("button", { name: "Import completed file" }).click();
  const importDialogEn = page.getByRole("dialog", { name: "Import preview" });
  await expect(importDialogEn).toContainText("Row 9, column category: reference not found");
  await importDialogEn.getByRole("button", { name: "Confirm import" }).click();
  await expect(page.getByRole("status")).toContainText("Import complete: 2 created, 0 updated, 1 skipped.");

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(0);
  expect(consoleErrors).toEqual([]);
});
