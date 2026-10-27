import { defineConfig } from "@playwright/test";

/* Browser tests (src/tests/playwright), run against a built app (E2E_BUILD_DIR, default build/) served with the
   DHIS2 instance in .env.local. Read-only, and never against production: see src/tests/playwright/env.js. */
const port = 8098;
const buildDir = process.env.E2E_BUILD_DIR ?? "build";

export default defineConfig({
    testDir: "src/tests/playwright",
    testMatch: "**/*.e2e.ts",
    outputDir: "src/tests/playwright/.results",
    workers: 1,
    fullyParallel: false,
    timeout: 5 * 60_000,
    expect: { timeout: 60_000 },
    reporter: [["list"]],
    use: {
        baseURL: `http://localhost:${port}/`,
        channel: process.env.E2E_BROWSER_CHANNEL ?? "msedge",
        viewport: { width: 1440, height: 1000 },
        locale: "en-GB",
        actionTimeout: 60_000,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    webServer: {
        command: `"${process.execPath}" src/tests/playwright/server.js "${buildDir}" ${port}`,
        url: `http://localhost:${port}/`,
        reuseExistingServer: false,
        stdout: "pipe",
    },
});
