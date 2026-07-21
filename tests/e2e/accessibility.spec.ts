import { expect, test } from "@playwright/test";

test("supports IT/EN, light/dark and keyboard-safe dialogs at 1080 px", async ({ page }) => {
  const consoleErrors: string[] = [];
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

  await page.getByRole("button", { name: "Immobili" }).click();
  await page.getByRole("button", { name: "Utenze" }).click();
  const dialog = page.getByRole("dialog", { name: "Registra utenza" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("input, select, textarea").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "Impostazioni" }).click();
  await page.getByRole("button", { name: "English" }).click();
  await page.getByRole("button", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(0);
  expect(consoleErrors).toEqual([]);
});
