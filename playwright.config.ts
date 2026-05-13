import { defineConfig, devices } from "@playwright/test";

const frontendPort = process.env.E2E_FRONTEND_PORT ?? "3000";
const frontendUrl = `http://127.0.0.1:${frontendPort}`;

export default defineConfig({
  testDir: ".",
  testMatch: ["tests/e2e/**/*.spec.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: frontendUrl,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${frontendPort}`,
    url: frontendUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_BASE_URL:
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000",
      NEXT_PUBLIC_WS_URL:
        process.env.NEXT_PUBLIC_WS_URL ?? "ws://127.0.0.1:8000",
    },
  },
  projects: [
    {
      name: "msedge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },
  ],
});
