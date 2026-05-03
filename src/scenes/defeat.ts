// Defeat scene — Task 17
import type { KAPLAYCtx } from "kaplay";
import type { RunState } from "../types/index.js";
import { playBackgroundMusic } from "../main.js";
import { retryBattle } from "../game/runState.js";

export function registerDefeatScene(k: KAPLAYCtx) {
  k.scene("defeat", (runState: RunState) => {
    playBackgroundMusic("menu-music");
    const cx = k.center().x;
    const H = k.height();

    // ── Background ───────────────────────────────────────────────────────
    k.add([
      k.rect(k.width(), H),
      k.pos(0, 0),
      k.color(40, 20, 20),
    ]);

    // ── Defeat title ─────────────────────────────────────────────────────
    k.add([
      k.text("DEFEATED", { size: 48 }),
      k.pos(cx, 80),
      k.anchor("center"),
      k.color(255, 80, 80),
    ]);

    let yOffset = 160;

    // ── Defeat message ──────────────────────────────────────────────────
    const monster = runState.runConfig.monsters[runState.currentMonsterIndex];
    k.add([
      k.text(`You were defeated by ${monster.name}!`, { size: 22, width: 500, align: "center" }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(255, 200, 200),
    ]);
    yOffset += 50;

    // ── Hero stats at time of defeat ────────────────────────────────────
    const hero = runState.hero;
    k.add([
      k.text(`Hero Level: ${hero.level}  XP: ${hero.xp}`, { size: 18 }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(200, 200, 200),
    ]);
    yOffset += 36;

    k.add([
      k.text(`HP: ${hero.currentStats.health}/${hero.currentStats.maxHealth}  ATK: ${hero.currentStats.attack}  DEF: ${hero.currentStats.defense}  MAG: ${hero.currentStats.magic}`, { size: 14, width: 600, align: "center" }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(180, 180, 180),
    ]);
    yOffset += 60;

    // ── Retry button ────────────────────────────────────────────────────
    const retryBtn = k.add([
      k.rect(200, 56, { radius: 10 }),
      k.pos(cx, H - 100),
      k.anchor("center"),
      k.color(160, 60, 60),
      k.area(),
      k.cursor("pointer"),
    ]);
    retryBtn.add([
      k.text("Retry Battle", { size: 22 }),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);

    retryBtn.onClick(() => {
      // Reset the battle state (monster HP to max, turn counter to 1)
      // Hero level, stats, move pool, and moveset remain unchanged
      const retriedState = retryBattle(runState);
      k.go("battle", retriedState);
    });

    // ── Back to Run Overview button ─────────────────────────────────────
    const overviewBtn = k.add([
      k.rect(240, 44, { radius: 8 }),
      k.pos(cx, H - 40),
      k.anchor("center"),
      k.color(60, 60, 100),
      k.area(),
      k.cursor("pointer"),
    ]);
    overviewBtn.add([
      k.text("Back to Overview", { size: 18 }),
      k.anchor("center"),
      k.color(200, 200, 255),
    ]);

    overviewBtn.onClick(() => {
      k.go("run-overview", runState);
    });
  });
}
