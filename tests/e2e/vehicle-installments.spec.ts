import { expect, test } from "@playwright/test";

test("creates, edits, closes and reopens one vehicle installment plan in IT/EN and dark/light", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto("/");
  const activeYear = new Date().getFullYear();

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Italiano" }).click();
  await page.getByRole("button", { name: "Scuro" }).click();
  await page.getByRole("navigation").getByRole("button", { name: "Automobile", exact: true }).click();
  await page.getByRole("button", { name: "Nuova automobile" }).click();

  const createDialog = page.getByRole("dialog", { name: "Nuova automobile" });
  await createDialog.getByLabel("Nome").fill("Automobile sintetica rateale");
  await createDialog.getByLabel("Gestisci il finanziamento").check();
  await createDialog.getByRole("spinbutton", { name: "Importo rata" }).fill("325");
  await createDialog.getByLabel("Prossima scadenza").fill(`${activeYear}-09-15`);
  await createDialog.getByRole("spinbutton", { name: /Rate residue/ }).fill("3");
  await expect(createDialog.locator(".vehicle-financing-section").getByRole("combobox").last()).toHaveValue(/.+/);
  await createDialog.getByRole("button", { name: "Salva" }).click();

  const vehicleCard = page.locator("article.entity-card").filter({ has: page.getByRole("heading", { name: "Automobile sintetica rateale" }) });
  await expect(vehicleCard).toBeVisible();
  await page.getByRole("heading", { name: "Automobile sintetica rateale" }).click();
  let detailDialog = page.getByRole("dialog", { name: "Automobile sintetica rateale" });
  await expect(detailDialog.getByRole("cell", { name: "Automobile sintetica rateale", exact: true })).toHaveCount(3);
  await page.keyboard.press("Escape");

  await page.getByRole("navigation").getByRole("button", { name: "Ricorrenze", exact: true }).click();
  const recurringRow = page.locator(".recurrence-list").filter({ has: page.getByRole("heading", { name: "Automobile sintetica rateale" }) });
  await expect(recurringRow).toContainText("gestita da Automobile");
  await expect(recurringRow.getByRole("button", { name: "Elimina" })).toBeDisabled();

  await page.getByRole("navigation").getByRole("button", { name: "Automobile", exact: true }).click();
  await vehicleCard.getByRole("button", { name: "Chiudi" }).click();
  await expect(vehicleCard.getByText("Chiuso", { exact: true })).toBeVisible();
  await vehicleCard.getByRole("button", { name: "Riapri" }).click();
  await expect(vehicleCard.getByText("Attivo", { exact: true })).toBeVisible();
  await page.getByRole("heading", { name: "Automobile sintetica rateale" }).click();
  detailDialog = page.getByRole("dialog", { name: "Automobile sintetica rateale" });
  await expect(detailDialog.getByRole("cell", { name: "Automobile sintetica rateale", exact: true })).toHaveCount(3);
  await page.keyboard.press("Escape");

  await vehicleCard.getByRole("button", { name: "Modifica" }).click();
  const editDialog = page.getByRole("dialog", { name: "Modifica automobile" });
  await expect(editDialog.getByLabel("Gestisci il finanziamento")).toBeChecked();
  await expect(editDialog.getByRole("spinbutton", { name: "Tariffa base" })).toBeDisabled();
  await editDialog.getByLabel("Nome").fill("Automobile sintetica aggiornata");
  await editDialog.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByRole("heading", { name: "Automobile sintetica aggiornata" })).toBeVisible();

  await page.getByRole("button", { name: "Impostazioni" }).click();
  await page.getByRole("button", { name: "English" }).click();
  await page.getByRole("button", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("navigation").getByRole("button", { name: "Vehicles", exact: true }).click();
  const englishCard = page.locator("article.entity-card").filter({ has: page.getByRole("heading", { name: "Automobile sintetica aggiornata" }) });
  await englishCard.getByRole("button", { name: "Edit" }).click();
  const englishDialog = page.getByRole("dialog", { name: "Edit vehicle" });
  await expect(englishDialog.getByText("Vehicle financing", { exact: true })).toBeVisible();
  await expect(englishDialog.getByLabel("Manage financing")).toBeChecked();
  await expect(englishDialog.getByText("The base rate is protected. Use Change rate below to update future installments only.")).toBeVisible();
  await page.keyboard.press("Escape");

  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  expect(consoleErrors).toEqual([]);
});
