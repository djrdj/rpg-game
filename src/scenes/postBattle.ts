// Post-Battle scene — Task 16
import type { KAPLAYCtx } from "kaplay";
import { RunState, Move } from "../types/index.js";
import { saveHeroRun } from "../db/persistence.js";
import { playBackgroundMusic } from "../main.js";

export function registerPostBattleScene(k: KAPLAYCtx) {
  k.scene("post-battle", (runState: RunState, learnedMove: Move) => {
    playBackgroundMusic("menu-music");
    const cx = k.center().x;
    const H = k.height();

    // ── Background ────────────────────────────────────────────────────────────
    k.add([
      k.rect(k.width(), H),
      k.pos(0, 0),
      k.color(20, 30, 20),
    ]);

    // ── Title ─────────────────────────────────────────────────────────────────
    k.add([
      k.text("Victory!", { size: 36 }),
      k.pos(cx, 40),
      k.anchor("center"),
      k.color(255, 220, 80),
    ]);

    let yOffset = 100;

    // ── XP gained ─────────────────────────────────────────────────────────────
    // XP formula: 50 * (monsterIndex + 1) — same as awardXP
    const xpGained = 50 * (runState.currentMonsterIndex + 1);
    const hero = runState.hero;

    k.add([
      k.text(`XP Gained: +${xpGained}`, { size: 22 }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(120, 220, 120),
    ]);
    yOffset += 36;

    const xpLabel =
      hero.level >= 5
        ? `Total XP: ${hero.xp}  (Level MAX)`
        : `Total XP: ${hero.xp} / ${hero.xpToNextLevel}  (Level ${hero.level})`;

    k.add([
      k.text(xpLabel, { size: 18 }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(180, 240, 180),
    ]);
    yOffset += 50;

    // ── Level-up notification ─────────────────────────────────────────────────
    // Detect level-up by comparing level before awardXP vs current hero level.
    // The previous level can be inferred: if hero.level > 1 and xpGained was
    // enough to push past a threshold, a level-up occurred.
    // We detect it by checking if the hero's level is higher than it would be
    // without the XP from this battle. We do this by re-running the check on
    // the hero state *before* XP was awarded (hero.xp - xpGained at old level).
    // Simpler approach: the battle scene passes the updated hero; we compare
    // the hero's baseStats to the default starting stats scaled by level.
    // Best approach: store previous level in runState is not available, so we
    // detect level-up by checking if hero.level > 1 and the XP was enough.
    // We reconstruct the pre-battle hero level by checking if (hero.xp + xpGained)
    // would have been at a lower level. Since checkLevelUp subtracts thresholds,
    // we detect level-up if the hero's level changed during awardXP.
    // The simplest reliable signal: compare hero.level to what it was before.
    // Since we don't have the pre-battle hero, we detect level-up by checking
    // if the current hero.xp < xpGained (meaning XP wrapped around a threshold).
    // Actually: after checkLevelUp, hero.xp is the *remainder* after subtracting
    // the threshold. So if hero.xp < xpGained, a level-up occurred.
    const leveledUp = hero.xp < xpGained;

    if (leveledUp) {
      // Show level-up banner
      k.add([
        k.rect(400, 44, { radius: 8 }),
        k.pos(cx, yOffset),
        k.anchor("center"),
        k.color(255, 200, 0),
      ]);
      k.add([
        k.text(`LEVEL UP!  Now Level ${hero.level}`, { size: 20 }),
        k.pos(cx, yOffset),
        k.anchor("center"),
        k.color(30, 20, 0),
      ]);
      yOffset += 54;

      // Stat deltas — derived from LEVEL_UP_TABLE entries for the previous level.
      // We know the previous level was hero.level - 1 (assuming single level-up).
      // Stat gains per level from heroState.ts LEVEL_UP_TABLE:
      const STAT_GAINS: Record<number, { attack: number; defense: number; health: number; magic: number }> = {
        2: { attack: 3, defense: 2, health: 15, magic: 2 },
        3: { attack: 3, defense: 2, health: 15, magic: 2 },
        4: { attack: 4, defense: 3, health: 20, magic: 3 },
        5: { attack: 4, defense: 3, health: 20, magic: 3 },
      };
      const gains = STAT_GAINS[hero.level];
      if (gains) {
        const deltaText =
          `ATK +${gains.attack}  DEF +${gains.defense}  HP +${gains.health}  MAG +${gains.magic}`;
        k.add([
          k.text(deltaText, { size: 16 }),
          k.pos(cx, yOffset),
          k.anchor("center"),
          k.color(255, 240, 160),
        ]);
        yOffset += 40;
      }
    }

    // ── Learned move ──────────────────────────────────────────────────────────
    k.add([
      k.text("Move Learned:", { size: 18 }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(180, 180, 255),
    ]);
    yOffset += 30;

    k.add([
      k.text(learnedMove.name, { size: 24 }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(220, 200, 255),
    ]);
    yOffset += 32;

    // Move description: type + baseValue + effect summary
    const moveDesc = buildMoveDescription(learnedMove);
    k.add([
      k.text(moveDesc, { size: 14, width: 500, align: "center" }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(180, 180, 200),
    ]);
    yOffset += 50;

    // ── Continue button ───────────────────────────────────────────────────────
    const allDefeated = runState.currentMonsterIndex >= 4;

    const continueBtn = k.add([
      k.rect(200, 52, { radius: 10 }),
      k.pos(cx, H - 60),
      k.anchor("center"),
      k.color(60, 160, 80),
      k.area(),
      k.cursor("pointer"),
    ]);
    continueBtn.add([
      k.text(allDefeated ? "Claim Victory!" : "Continue", { size: 20 }),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);

    continueBtn.onClick(async () => {
      // Advance monster index before saving (unless all defeated)
      const nextRunState: RunState = allDefeated
        ? { ...runState, isComplete: true }
        : { ...runState, currentMonsterIndex: runState.currentMonsterIndex + 1 };

      await saveHeroRun(nextRunState).catch((err) =>
        console.error("[post-battle] saveHeroRun error:", err)
      );

      if (allDefeated) {
        k.go("victory", nextRunState);
      } else {
        k.go("run-overview", nextRunState);
      }
    });
  });
}

// ── Helper: build a human-readable move description ──────────────────────────
function buildMoveDescription(move: Move): string {
  const typePart = move.type.charAt(0).toUpperCase() + move.type.slice(1);

  if (move.type === "physical") {
    return `${typePart} attack — Base power: ${move.baseValue}`;
  }

  if (move.type === "magic") {
    if (move.id === "second-wind") {
      return `Magic heal — Restores HP based on Magic stat`;
    }
    const base = `${typePart} attack — Base power: ${move.baseValue}`;
    if (move.effect) {
      return `${base} + ${move.effect.kind} ${move.effect.stat} by ${move.effect.amount} for ${move.effect.turns} turns`;
    }
    return base;
  }

  if ((move.type === "buff" || move.type === "debuff") && move.effect) {
    const target = move.type === "buff" ? "self" : "enemy";
    return `${typePart} — ${move.effect.kind}s ${target}'s ${move.effect.stat} by ${move.effect.amount} for ${move.effect.turns} turns`;
  }

  return typePart;
}
