import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", "release/**"],
    coverage: {
      reporter: ["text", "html"],
      exclude: ["src/test/**", "src/renderer/main.tsx"],
    },
  },
});
