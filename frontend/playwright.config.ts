import { defineConfig, devices } from "@playwright/test";
import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load defaults from frontend/.env.test, but let process.env win.
loadDotenv({
  path: path.resolve(__dirname, ".env.test"),
  override: false,
});

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:4321";
const STORAGE_STATE = path.resolve(__dirname, "playwright/.auth/admin.json");

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",

  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,

  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: BASE_URL,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: isCI
    ? [
        // CI: only setup + chromium
        {
          name: "setup",
          testMatch: /auth\.setup\.ts/,
        },
        {
          name: "chromium",
          use: {
            ...devices["Desktop Chrome"],
            storageState: STORAGE_STATE,
          },
          dependencies: ["setup"],
        },
      ]
    : [
        // Local: full browser matrix
        {
          name: "setup",
          testMatch: /auth\.setup\.ts/,
        },
        {
          name: "chromium",
          use: {
            ...devices["Desktop Chrome"],
            storageState: STORAGE_STATE,
          },
          dependencies: ["setup"],
        },
        {
          name: "firefox",
          use: {
            ...devices["Desktop Firefox"],
            storageState: STORAGE_STATE,
          },
          dependencies: ["setup"],
        },
        {
          name: "webkit",
          use: {
            ...devices["Desktop Safari"],
            storageState: STORAGE_STATE,
          },
          dependencies: ["setup"],
        },
      ],
});
