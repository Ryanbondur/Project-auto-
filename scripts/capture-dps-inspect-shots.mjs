/**
 * Headless ~390px screenshots for DPS panel + unit inspect.
 * Usage: node scripts/capture-dps-inspect-shots.mjs [baseUrl] [outDir]
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
await page.evaluate(() => {
  window.gameStore.startNewRun(42);
  window.gameStore.debugSeedNeonSkinDemo();
  // Seed readable wave DPS without waiting on a full combat sim.
  const s = window.gameStore.getState();
  const amounts = [420, 1180, 860, 2400, 1550, 310, 990, 640];
  s.board.forEach((u, i) => {
    const d = amounts[i % amounts.length] ?? 100;
    u.damageDealtWave = d;
    u.damageDealtRun = d * 3;
  });
  // Socket a pierce chip on the first unit for inspect buff chips.
  if (s.board[0]) {
    const chip = {
      instanceId: "shot_c_pierce",
      defId: "chip_pierce",
      starLevel: 2,
      socketedOnInstanceId: s.board[0].instanceId,
    };
    s.chips.push(chip);
    s.board[0].chipInstanceIds = [chip.instanceId];
  }
  window.gameStore.debugSetGold(s.gold);
});

await page.waitForFunction(
  () => window.gameStore.getState().board.length >= 6,
  { timeout: 5000 },
);

await page.evaluate(() => {
  document.querySelector(".game-canvas")?.scrollIntoView({ block: "center" });
});
await new Promise((r) => setTimeout(r, 200));

// Open DPS panel
await page.click("button.dps-chip");
await page.waitForSelector(".dps-sheet", { timeout: 3000 });
await new Promise((r) => setTimeout(r, 120));
await page.screenshot({
  path: path.join(outDir, "dps-panel.png"),
  fullPage: false,
});

// Close DPS, then long-press a boarded unit for inspect
await page.click("button.dps-close");
await page.waitForFunction(() => !document.querySelector(".dps-sheet"), {
  timeout: 3000,
});

const holdTarget = await page.evaluate(() => {
  const canvas = document.querySelector(".game-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error("no canvas");
  const s = window.gameStore.getState();
  const unit = s.board.find((u) => u.tile) ?? s.board[0];
  if (!unit?.tile) throw new Error("no boarded unit");
  const TILE = 48;
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / canvas.width;
  const scaleY = rect.height / canvas.height;
  const cx = (unit.tile.x + 0.5) * TILE * scaleX + rect.left;
  const cy = (unit.tile.y + 0.5) * TILE * scaleY + rect.top;
  return { x: cx, y: cy, instanceId: unit.instanceId };
});

// Prefer pointer long-press (matches GameCanvas handlers). Fall back to
// dispatching a synthetic inspect open if automation doesn't fire hold.
await page.mouse.move(holdTarget.x, holdTarget.y);
await page.mouse.down({ button: "left" });
await new Promise((r) => setTimeout(r, 520));
await page.mouse.up({ button: "left" });

const inspectVisible = await page
  .waitForSelector(".inspect-card", { timeout: 2500 })
  .then(() => true)
  .catch(() => false);

if (!inspectVisible) {
  await page.evaluate((instanceId) => {
    // Dispatch a CustomEvent the RunScreen listens for in capture builds.
    window.dispatchEvent(
      new CustomEvent("atd:debug-inspect", { detail: { instanceId } }),
    );
  }, holdTarget.instanceId);
  await page.waitForSelector(".inspect-card", { timeout: 3000 });
}

await new Promise((r) => setTimeout(r, 150));
await page.screenshot({
  path: path.join(outDir, "unit-inspect.png"),
  fullPage: false,
});

console.log(
  JSON.stringify(
    {
      dps: path.join(outDir, "dps-panel.png"),
      inspect: path.join(outDir, "unit-inspect.png"),
      holdTarget,
      inspectOpen: await page.evaluate(() =>
        Boolean(document.querySelector(".inspect-card")),
      ),
    },
    null,
    2,
  ),
);

await browser.close();
