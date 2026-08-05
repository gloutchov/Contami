import { expect, test } from "@playwright/test";

const variants = [
  {
    name: "Italian dark",
    languageButton: "Italiano",
    themeButton: "Scuro",
    lang: "it",
    theme: "dark",
    settings: "Impostazioni",
    newAccount: "Nuovo conto",
    nameLabel: "Nome",
    save: "Salva",
    accountName: "Conto sintetico recuperato",
    confirmation: /Un salvataggio interrotto ha lasciato un blocco scaduto/,
  },
  {
    name: "English light",
    languageButton: "English",
    themeButton: "Light",
    lang: "en",
    theme: "light",
    settings: "Settings",
    newAccount: "New account",
    nameLabel: "Name",
    save: "Save",
    accountName: "Recovered synthetic account",
    confirmation: /An interrupted save left an expired lock/,
  },
] as const;

for (const variant of variants) {
  test(`confirms stale-lock recovery in ${variant.name}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    await page.goto("/?qa=stale-lock");
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("button", { name: variant.languageButton }).click();
    await page.getByRole("button", { name: variant.themeButton }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", variant.lang);
    await expect(page.locator("html")).toHaveAttribute("data-theme", variant.theme);

    await page.getByRole("button", { name: variant.newAccount }).click();
    const accountDialog = page.getByRole("dialog", { name: variant.newAccount });
    await accountDialog.getByLabel(variant.nameLabel, { exact: true }).fill(variant.accountName);
    page.once("dialog", async (dialog) => {
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toMatch(variant.confirmation);
      await dialog.accept();
    });
    await accountDialog.getByRole("button", { name: variant.save }).click();

    await expect(accountDialog).toBeHidden();
    await expect(page.getByText(variant.accountName)).toBeVisible();
    await expect(page.getByRole("heading", { name: variant.settings, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    expect(consoleErrors).toEqual([]);
  });
}
