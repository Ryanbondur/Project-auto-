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
  path: path.join(outDir, "art-d-units-eras.png"),
  fullPage: false,
});
// Keep legacy filenames for PR continuity
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
  path: path.join(outDir, "art-d-board-combat.png"),
  fullPage: false,
});
await page.screenshot({
  path: path.join(outDir, "art-sprites-board.png"),
  fullPage: false,
});

// Named era boss + creep + projectile showcase (mutate live sim state for shot)
await page.evaluate(() => {
  const s = window.gameStore.getState();
  // Ensure a board exists for projectile source attribution
  if (s.board.length < 2) {
    window.gameStore.startNewRun(99);
  }
});
await page.evaluate(() => {
  try {
    window.gameStore.debugSeedSpriteArtDemo?.();
  } catch {
    /* ignore if wrong phase — combat inject still works */
  }
});

await page.evaluate(() => {
  const s = window.gameStore.getState();
  const start = s.path[Math.min(6, s.path.length - 1)] ?? { x: 2, y: 2 };
  s.phase = "AUTOBATTLE";
  s.creeps = [
    {
      instanceId: "shot-boss",
      defId: "creep_boss",
      hp: 400,
      maxHp: 700,
      pathIndex: 6,
      pathT: 0.3,
      x: start.x,
      y: start.y,
      alive: true,
      agendas: ["shielded", "siege"],
      shieldHp: 40,
      regenAccMs: 0,
      hexCooldownMs: 0,
      isBossCreep: true,
      displayName: "Siege Saint",
      bossMechanic: "path_splitter",
      eraBossId: "boss_siege_saint",
    },
    {
      instanceId: "shot-grunt",
      defId: "creep_grunt",
      hp: 30,
      maxHp: 40,
      pathIndex: 4,
      pathT: 0.2,
      x: (s.path[4] ?? start).x,
      y: (s.path[4] ?? start).y,
      alive: true,
      agendas: [],
      shieldHp: 0,
      regenAccMs: 0,
      hexCooldownMs: 0,
      isBossCreep: false,
    },
    {
      instanceId: "shot-tank",
      defId: "creep_tank",
      hp: 90,
      maxHp: 120,
      pathIndex: 8,
      pathT: 0.1,
      x: (s.path[8] ?? start).x,
      y: (s.path[8] ?? start).y,
      alive: true,
      agendas: [],
      shieldHp: 0,
      regenAccMs: 0,
      hexCooldownMs: 0,
      isBossCreep: false,
    },
  ];
  s.projectiles = [
    {
      id: "shot-p1",
      sourceUnitId: s.board[0]?.instanceId ?? "u",
      from: { x: 4.5, y: 2.5 },
      pos: { x: 6.2, y: 3.5 },
      aim: { x: 7.5, y: 4.5 },
      toCreepId: "shot-boss",
      damage: 20,
      aoeRadius: 0,
      speed: 6,
      progress: 0.88,
      pierceExtra: 0,
      arcHeight: 0,
      lifestealFraction: 0,
    },
    {
      id: "shot-p2",
      sourceUnitId: s.board[4]?.instanceId ?? "u",
      from: { x: 8.5, y: 3.5 },
      pos: { x: 7.0, y: 4.0 },
      aim: { x: 6.5, y: 4.5 },
      toCreepId: "shot-tank",
      damage: 40,
      aoeRadius: 1.4,
      speed: 5,
      progress: 0.9,
      pierceExtra: 0,
      arcHeight: 0.4,
      lifestealFraction: 0,
    },
  ];
  s.waveRuntime = {
    spawnQueue: [],
    elapsedMs: 1000,
    allSpawned: true,
    eventHpMult: 1,
  };
});
await new Promise((r) => setTimeout(r, 200));
await page.evaluate(() => {
  document.querySelector(".game-canvas")?.scrollIntoView({ block: "center" });
});
await page.screenshot({
  path: path.join(outDir, "art-d-boss-creep-proj.png"),
  fullPage: false,
});

console.log(
  JSON.stringify(
    {
      units: path.join(outDir, "art-d-units-eras.png"),
      board: path.join(outDir, "art-d-board-combat.png"),
      boss: path.join(outDir, "art-d-boss-creep-proj.png"),
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
          creeps: s.creeps.filter((c) => c.alive).map((c) => ({
            defId: c.defId,
            eraBossId: c.eraBossId ?? null,
          })),
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
