/**
 * Headless phone-width screenshots for gambit / sabotage / buff combat.
 * Usage: node scripts/capture-mechanics-shots.mjs [baseUrl] [outDir]
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:5173/";
const outDir = process.argv[3] ?? "/cursor/stores/self/media";
fs.mkdirSync(outDir, { recursive: true });

const chrome =
  process.env.CHROME_PATH ??
  "/usr/local/bin/google-chrome";

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--window-size=390,844"],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
});

const page = await browser.newPage();
await page.goto(baseUrl, { waitUntil: "networkidle0", timeout: 60000 });

// Start run from menu (React screen switch requires the button)
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
await page.evaluate(() => {
  window.gameStore.startNewRun(42);
});

// Open gambit sheet
await page.click("button.gambit-open");
await page.waitForSelector(".gambit-sheet", { timeout: 5000 });
await page.screenshot({
  path: path.join(outDir, "mechanics-gambit-sheet.png"),
  fullPage: false,
});
await page.click(".sheet-close");

// Seed sabotage + buff demo
await page.evaluate(() => {
  window.gameStore.debugSeedMechanicsDemo();
  // Soften unit so wave lasts long enough for a combat shot
  const s = window.gameStore.getState();
  if (s.board[0]) s.board[0].starLevel = 1;
  window.gameStore.debugSetGold(s.gold);
});
await page.waitForFunction(
  () => window.gameStore.getState().pathSabotages.some((s) => s.placed),
  { timeout: 5000 },
);
await page.evaluate(() => {
  document.querySelector(".sabotage-tray")?.scrollIntoView({ block: "center" });
});
await new Promise((r) => setTimeout(r, 250));
await page.screenshot({
  path: path.join(outDir, "mechanics-sabotage-prep.png"),
  fullPage: false,
});

// Start combat for buff-in-combat shot
await page.evaluate(() => {
  window.gameStore.ready();
});
await page.waitForFunction(
  () => window.gameStore.getState().phase === "AUTOBATTLE",
  { timeout: 5000 },
);
// Tick until creeps + projectiles exist, then shoot
for (let i = 0; i < 400; i++) {
  await page.evaluate(() => window.gameStore.tick(50));
  const snap = await page.evaluate(() => {
    const s = window.gameStore.getState();
    return {
      phase: s.phase,
      creeps: s.creeps.filter((c) => c.alive).length,
      projectiles: s.projectiles.length,
    };
  });
  if (snap.phase !== "AUTOBATTLE") break;
  if (snap.creeps > 0 && snap.projectiles > 0) break;
}
await page.evaluate(() => {
  document.querySelector(".game-canvas")?.scrollIntoView({ block: "center" });
});
await new Promise((r) => setTimeout(r, 150));
await page.screenshot({
  path: path.join(outDir, "mechanics-buff-combat.png"),
  fullPage: false,
});

console.log(
  JSON.stringify(
    {
      gambit: path.join(outDir, "mechanics-gambit-sheet.png"),
      sabotage: path.join(outDir, "mechanics-sabotage-prep.png"),
      buffCombat: path.join(outDir, "mechanics-buff-combat.png"),
      state: await page.evaluate(() => {
        const s = window.gameStore.getState();
        return {
          phase: s.phase,
          sabotages: s.pathSabotages,
          chips: s.chips.map((c) => ({
            id: c.defId,
            star: c.starLevel,
            on: c.socketedOnInstanceId,
          })),
          board: s.board.length,
          creeps: s.creeps.filter((c) => c.alive).length,
          projectiles: s.projectiles.length,
          baseHp: s.baseHp,
        };
      }),
    },
    null,
    2,
  ),
);

await browser.close();
