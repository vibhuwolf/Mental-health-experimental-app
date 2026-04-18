import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.join(repoRoot, "artifacts", "videos");
const baseUrl = process.env.MOODDROP_BASE_URL ?? "http://127.0.0.1:3000";
const finalVideoPath = path.join(outputDir, "mooddrop-testing-walkthrough.webm");

async function pause(page, ms) {
  await page.waitForTimeout(ms);
}

async function moveRangeSlider(page, value) {
  await page.locator("#intensity").evaluate(
    (input, nextValue) => {
      input.value = String(nextValue);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
    value
  );
}

async function run() {
  await mkdir(outputDir, { recursive: true });
  await rm(finalVideoPath, { force: true });

  const browser = await chromium.launch({
    channel: "msedge",
    headless: false,
    slowMo: 200,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1400, height: 900 },
    },
  });

  const page = await context.newPage();
  const video = page.video();

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await pause(page, 1200);

    await page.getByRole("button", { name: "Start a 60-second check-in" }).click();
    await page.waitForURL(`${baseUrl}/check-in`);
    await pause(page, 900);

    await page.getByRole("button", { name: "Wired" }).click();
    await moveRangeSlider(page, 4);
    await page
      .getByLabel("Optional note")
      .fill("Deadlines and group chat noise are making everything louder tonight.");
    await pause(page, 500);
    await page.getByRole("button", { name: "Decode this drop" }).click();
    await page.waitForURL(/\/check-in\/drop_/);
    await pause(page, 1600);

    await page.getByRole("link", { name: "Go to dashboard" }).click();
    await page.waitForURL(`${baseUrl}/dashboard`);
    await pause(page, 1400);

    await page.getByRole("link", { name: "New 60-second check-in" }).click();
    await page.waitForURL(`${baseUrl}/check-in`);
    await pause(page, 800);

    await page.getByRole("button", { name: "Hopeful" }).click();
    await moveRangeSlider(page, 2);
    await page
      .getByLabel("Optional note")
      .fill("Walked after class and finally felt softer.");
    await page.getByRole("button", { name: "Show extras" }).click();
    await page.getByLabel("Song title").fill("Saturn");
    await page.getByLabel("Artist").fill("SZA");
    await pause(page, 500);
    await page.getByRole("button", { name: "Decode this drop" }).click();
    await page.waitForURL(/\/check-in\/drop_/);
    await pause(page, 1500);

    await page.getByRole("link", { name: "Open replay studio" }).click();
    await page.waitForURL(`${baseUrl}/replay`);
    await pause(page, 1200);
    await page.mouse.wheel(0, 850);
    await pause(page, 1400);

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await pause(page, 800);
    await page.getByRole("button", { name: "Open calm mode" }).click();
    await page.waitForURL(`${baseUrl}/spiral?direct=1`);
    await pause(page, 1800);
  } finally {
    await context.close();
    await browser.close();
  }

  if (!video) {
    throw new Error("Playwright did not attach a video to the page.");
  }

  const recordedPath = await video.path();
  await rename(recordedPath, finalVideoPath);
  console.log(finalVideoPath);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
