import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "docs", "assets");
const port = 3050;
const baseUrl = `http://127.0.0.1:${port}`;

async function ensureServerReady() {
  const deadline = Date.now() + 90_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { redirect: "manual" });

      if (response.ok || response.status === 307) {
        return;
      }
    } catch {
      // Keep waiting for the server to come online.
    }

    await delay(1_000);
  }

  throw new Error("Timed out waiting for the local server.");
}

async function captureScreens() {
  await mkdir(outputDir, { recursive: true });

  const server = spawn(
    "cmd.exe",
    ["/c", "npm.cmd", "run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        PORT: String(port),
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  server.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
  });

  server.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
  });

  try {
    await ensureServerReady();

    const browser = await chromium.launch({
      channel: "msedge",
      headless: true,
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 1040 },
      colorScheme: "light",
    });
    const page = await context.newPage();

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(outputDir, "repo-landing.png"),
    });

    await page.getByRole("button", { name: /Start a 60-second check-in/i }).click();
    await page.waitForURL(/\/check-in$/, { timeout: 45_000 });
    await page.screenshot({
      path: path.join(outputDir, "repo-check-in.png"),
    });

    await page.locator("#text").fill(
      "Campus has been loud all day and I want one clear signal before my project review."
    );
    await page.getByRole("button", { name: /Decode this drop/i }).click();
    await page.waitForURL(/\/check-in\/[^/?#]+$/, { timeout: 60_000 });
    await page.screenshot({
      path: path.join(outputDir, "repo-insight.png"),
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(outputDir, "repo-dashboard.png"),
    });

    await page.goto(`${baseUrl}/replay`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(outputDir, "repo-replay.png"),
    });

    await browser.close();
  } finally {
    if (!server.killed) {
      spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], {
        stdio: "ignore",
      });
    }
  }
}

captureScreens().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
