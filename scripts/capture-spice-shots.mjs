/**
 * Headless ~390px screenshots for spice systems pack.
 * Usage: node scripts/capture-spice-shots.mjs [baseUrl] [outDir]
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

// —— 1) Doctrine pick sheet ——
await page.evaluate(() => {
  const btn = [...document.querySelectorAll(".menu-actions button")].find((b) =>
    (b.textContent ?? "").includes("New run"),
  );
  if (!btn) throw new Error("New run missing");
  btn.click();
});
await page.waitForSelector(".doctrine-sheet", { timeout: 10000 });
await page.screenshot({
  path: path.join(outDir, "doctrine-pick.png"),
  fullPage: false,
});

// Pick Deep Coffers and enter run
await page.evaluate(() => {
  const btn = [...document.querySelectorAll(".doctrine-sheet button")].find((b) =>
    (b.textContent ?? "").includes("Deep Coffers"),
  );
  btn?.click();
});
await page.waitForSelector(".run-screen", { timeout: 10000 });

// —— 2) Path mutate ——
await page.evaluate(() => {
  window.gameStore.debugSeedNeonSkinDemo();
  // Retry seeds until a legal lengthen/bend lands (visual proof)
  for (let i = 0; i < 12; i++) {
    const before = window.gameStore.getState().path.length;
    window.gameStore.debugMutatePath(i % 2 === 0 ? "lengthen" : "add_bend");
    const after = window.gameStore.getState().path.length;
    if (after !== before) break;
  }
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({
  path: path.join(outDir, "path-mutate.png"),
  fullPage: false,
});

// —— 3) Creep agendas ——
await page.evaluate(() => {
  window.gameStore.debugSeedAgendaDemo();
});
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({
  path: path.join(outDir, "creep-agenda.png"),
  fullPage: false,
});

// —— 4) Era boss ——
await page.evaluate(() => {
  // Back to prep for HUD boss chip
  const s = window.gameStore.getState();
  window.gameStore.resetRun(42, []);
  window.gameStore.startNewRun(42, "path_warden");
  window.gameStore.debugSeedNeonSkinDemo();
  window.gameStore.debugSeedEraBoss();
});
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({
  path: path.join(outDir, "era-boss.png"),
  fullPage: false,
});

// —— 5) Draft duel ——
await page.evaluate(() => {
  window.gameStore.debugForceDraftDuel();
});
await page.waitForSelector(".draft-sheet", { timeout: 10000 });
await new Promise((r) => setTimeout(r, 200));
await page.screenshot({
  path: path.join(outDir, "draft-duel.png"),
  fullPage: false,
});

await browser.close();
console.log("Wrote spice screenshots to", outDir);
