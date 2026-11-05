/**
 * Headless ~390px screenshots: sell-zone, drag-merge, event-sheet.
 * Usage: node scripts/capture-sell-events-shots.mjs [baseUrl] [outDir]
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:5173/";
const outDir = process.argv[3] ?? "/cursor/stores/self/media";
fs.mkdirSync(outDir, { recursive: true });

const chrome = process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome";

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--window-size=390,844"],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
});

const page = await browser.newPage();
await page.goto(baseUrl, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForFunction(() => Boolean(window.gameStore), { timeout: 15000 });
await page.waitForSelector(".menu-actions", { timeout: 10000 });
await page.evaluate(() => {
  const btn = [...document.querySelectorAll(".menu-actions button")].find((b) =>
    (b.textContent ?? "").includes("New run"),
  );
  if (!btn) throw new Error("New run button missing");
  btn.click();
});
await page.waitForSelector(".run-screen", { timeout: 10000 });

// —— Sell zone (selected board unit) ——
await page.evaluate(() => {
  window.gameStore.startNewRun(42);
  const s = window.gameStore.getState();
  s.gold = 40;
  s.board = [
    {
      instanceId: "shot_board_1",
      defId: "unit_slinger",
      starLevel: 2,
      targeting: "First",
      tile: { x: 1, y: 1 },
      cooldownMs: 0,
      currentTargetId: null,
      chipInstanceIds: [],
      fromMerge: true,
    },
    {
      instanceId: "shot_board_2",
      defId: "unit_archer",
      starLevel: 1,
      targeting: "Last",
      tile: { x: 2, y: 3 },
      cooldownMs: 0,
      currentTargetId: null,
      chipInstanceIds: [],
      fromMerge: false,
    },
  ];
  s.bench = [
    {
      instanceId: "shot_bench_1",
      defId: "unit_slinger",
      starLevel: 2,
      targeting: "First",
      tile: null,
      cooldownMs: 0,
      currentTargetId: null,
      chipInstanceIds: [],
      fromMerge: true,
    },
  ];
  window.gameStore.selectUnit("shot_board_1");
});
await new Promise((r) => setTimeout(r, 250));
await page.evaluate(() => {
  document.querySelector(".sell-zone")?.scrollIntoView({ block: "center" });
});
await new Promise((r) => setTimeout(r, 150));
await page.screenshot({
  path: path.join(outDir, "sell-zone.png"),
  fullPage: false,
});

// —— Drag-merge affordance (two identical on bench/board list) ——
await page.evaluate(() => {
  window.gameStore.selectUnit("shot_bench_1");
  document.querySelector(".bench")?.scrollIntoView({ block: "center" });
});
await new Promise((r) => setTimeout(r, 200));
await page.screenshot({
  path: path.join(outDir, "drag-merge.png"),
  fullPage: false,
});

// —— Event sheet ——
await page.evaluate(() => {
  window.gameStore.debugForceEvent();
});
await page.waitForSelector(".event-sheet", { timeout: 5000 });
await new Promise((r) => setTimeout(r, 200));
await page.screenshot({
  path: path.join(outDir, "event-sheet.png"),
  fullPage: false,
});

await browser.close();
console.log("Wrote sell-zone.png, drag-merge.png, event-sheet.png →", outDir);
