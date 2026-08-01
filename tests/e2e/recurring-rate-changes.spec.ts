import { expect, test } from "@playwright/test";

test("previews a future-only rate change from the keyboard in IT/light and EN/dark", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto("/");

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Italiano" }).click();
  await page.getByRole("button", { name: "Chiaro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Ricorrenze", exact: true }).click();

  const musicRow = page.locator(".recurrence-list").filter({ has: page.getByRole("heading", { name: "Music" }) });
  await musicRow.getByRole("button", { name: "Modifica" }).click();
  const dialogIt = page.getByRole("dialog", { name: "Modifica ricorrenza" });
  await expect(dialogIt.getByRole("spinbutton", { name: /Tariffa base/ })).toBeDisabled();
  await dialogIt.getByRole("button", { name: "Cambia tariffa" }).click();
  await dialogIt.getByLabel("Nuovo importo").fill("14.99");
  await dialogIt.getByLabel("Mese di decorrenza").fill(`${new Date().getFullYear()}-10`);
  await expect(dialogIt).toContainText("Scadenze pianificate da aggiornare: 1.");

  page.once("dialog", async (confirmation) => {
    expect(confirmation.message()).toContain("1 scadenze pianificate");
    await confirmation.accept();
  });
  await dialogIt.getByLabel("Mese di decorrenza").press("Enter");
  await expect(dialogIt).toContainText("14,99");
  await expect(dialogIt).toContainText("Dal 01 ott");
  await dialogIt.getByRole("button", { name: "Chiudi" }).click();

  await page.getByRole("button", { name: "Impostazioni" }).click();
  await page.getByRole("button", { name: "English" }).click();
  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Recurring", exact: true }).click();
  const musicRowEn = page.locator(".recurrence-list").filter({ has: page.getByRole("heading", { name: "Music" }) });
  await musicRowEn.getByRole("button", { name: "Edit" }).click();
  const dialogEn = page.getByRole("dialog", { name: "Edit recurring item" });
  await expect(dialogEn).toContainText("Rate history");
  await expect(dialogEn).toContainText("14.99");
  await expect(dialogEn.getByRole("button", { name: "Edit rate change" })).toBeVisible();
  expect(await dialogEn.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  expect(consoleErrors).toEqual([]);
});
