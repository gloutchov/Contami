import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/landing",
  outputDir: "test-results/landing",
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4174",
    viewport: { width: 1_080, height: 800 },
    locale: "en-US",
    colorScheme: "light",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/serve-landing.mjs",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
