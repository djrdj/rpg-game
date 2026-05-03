// Victory scene — Task 17
import type { KAPLAYCtx } from "kaplay";
import type { RunState } from "../types/index.js";
import { playBackgroundMusic } from "../main.js";
import { saveHeroRun } from "../db/persistence.js";

export function registerVictoryScene(k: KAPLAYCtx) {
  k.scene("victory", (runState: RunState) => {
    playBackgroundMusic("menu-music");
    const cx = k.center().x;
    const H = k.height();

    // ── Background ───────────────────────────────────────────────────────
    k.add([
      k.rect(k.width(), H),
      k.pos(0, 0),
      k.color(20, 40, 20),
    ]);

    // ── Victory title ─────────────────────────────────────────────────────
    k.add([
      k.text("YOU WIN!", { size: 48 }),
      k.pos(cx, 80),
      k.anchor("center"),
      k.color(255, 220, 80),
    ]);

    let yOffset = 160;

    // ── Congratulations message ─────────────────────────────────────────
    k.add([
      k.text("Congratulations! You defeated all 5 monsters!", { size: 22, width: 600, align: "center" }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(200, 255, 200),
    ]);
    yOffset += 50;

    // ── Hero stats summary ──────────────────────────────────────────────
    const hero = runState.hero;
    k.add([
      k.text(`Final Level: ${hero.level}`, { size: 20 }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(180, 220, 255),
    ]);
    yOffset += 32;

    k.add([
      k.text(`Total XP: ${hero.xp}`, { size: 18 }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(180, 220, 255),
    ]);
    yOffset += 32;

    const statsText = `ATK: ${hero.baseStats.attack}  DEF: ${hero.baseStats.defense}  HP: ${hero.baseStats.maxHealth}  MAG: ${hero.baseStats.magic}`;
    k.add([
      k.text(statsText, { size: 16 }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(200, 200, 200),
    ]);
    yOffset += 50;

    // ── Moves learned ───────────────────────────────────────────────────
    k.add([
      k.text(`Total Moves Learned: ${hero.movePool.length - 4}`, { size: 18 }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(220, 200, 255),
    ]);
    yOffset += 60;

    // ── Play Again button ───────────────────────────────────────────────
    const playAgainBtn = k.add([
      k.rect(220, 56, { radius: 10 }),
      k.pos(cx, H - 80),
      k.anchor("center"),
      k.color(60, 160, 80),
      k.area(),
      k.cursor("pointer"),
    ]);
    playAgainBtn.add([
      k.text("Play Again", { size: 22 }),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);

    playAgainBtn.onClick(async () => {
      // Mark run as complete before leaving
      const completedState: RunState = { ...runState, isComplete: true };
      await saveHeroRun(completedState).catch((err) =>
        console.error("[victory] saveHeroRun error:", err)
      );
      k.go("main-menu");
    });
  });
}
