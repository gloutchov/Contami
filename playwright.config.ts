import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results",
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1_080, height: 800 },
    locale: "en-US",
    colorScheme: "light",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev:renderer -- --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
