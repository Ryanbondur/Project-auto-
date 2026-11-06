/**
 * Headless ~390px screenshots for sprite atlas art pass.
 * Usage: node scripts/capture-art-sprites-shots.mjs [baseUrl] [outDir]
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
await page.waitForSelector(".doctrine-sheet", { timeout: 10000 });
await page.evaluate(() => {
  const btn = [...document.querySelectorAll(".doctrine-sheet button")].find((b) =>
    (b.textContent ?? "").includes("Deep Coffers"),
  );
  btn?.click();
});
await page.waitForSelector(".run-screen", { timeout: 10000 });
await page.evaluate(() => {
  window.gameStore.startNewRun(42);
  window.gameStore.debugSeedSpriteArtDemo();
});
await page.waitForFunction(
  () => window.gameStore.getState().board.length >= 4,
  { timeout: 5000 },
);

// Warm atlas + idle breath
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => {
  document.querySelector(".game-canvas")?.scrollIntoView({ block: "center" });
});
await new Promise((r) => setTimeout(r, 150));
await page.screenshot({
  path: path.join(outDir, "art-sprites-units.png"),
  fullPage: false,
});

// Combat board with creeps + projectiles
await page.evaluate(() => {
  const s = window.gameStore.getState();
  for (const u of s.board) {
    if (u.starLevel > 2) u.starLevel = 2;
  }
  window.gameStore.debugSetGold(s.gold);
  window.gameStore.ready();
});
await page.waitForFunction(
  () => window.gameStore.getState().phase === "AUTOBATTLE",
  { timeout: 5000 },
);

let sawCombat = false;
for (let i = 0; i < 500; i++) {
  await page.evaluate(() => window.gameStore.tick(40));
  const snap = await page.evaluate(() => {
    const s = window.gameStore.getState();
    return {
      phase: s.phase,
      creeps: s.creeps.filter((c) => c.alive).length,
      projectiles: s.projectiles.length,
    };
  });
  if (snap.phase !== "AUTOBATTLE") break;
  if (snap.creeps > 0 && snap.projectiles > 0) {
    sawCombat = true;
    break;
  }
}

await page.evaluate(() => {
  document.querySelector(".game-canvas")?.scrollIntoView({ block: "center" });
});
await new Promise((r) => setTimeout(r, 120));
await page.screenshot({
  path: path.join(outDir, "art-sprites-board.png"),
  fullPage: false,
});

console.log(
  JSON.stringify(
    {
      units: path.join(outDir, "art-sprites-units.png"),
      board: path.join(outDir, "art-sprites-board.png"),
      sawCombat,
      state: await page.evaluate(() => {
        const s = window.gameStore.getState();
        return {
          phase: s.phase,
          board: s.board.map((u) => ({
            defId: u.defId,
            star: u.starLevel,
            tile: u.tile,
          })),
          creeps: s.creeps.filter((c) => c.alive).map((c) => c.defId),
          projectiles: s.projectiles.length,
          selected: s.selectedInstanceId,
        };
      }),
    },
    null,
    2,
  ),
);

await browser.close();
