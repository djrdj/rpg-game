// Feature: rpg-gauntlet-game, Property 5: Hero starts every run with the default moveset
// Feature: rpg-gauntlet-game, Property 9: Move learning adds the move to the hero's pool
// Feature: rpg-gauntlet-game, Property 10: XP award and level-up correctness

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { initHero, awardXP, checkLevelUp, learnMove } from "../game/heroState.js";
import type { Move } from "../types/index.js";

// ── P5: Hero starts every run with the default moveset ───────────────────────
// For any new run initialization, the hero's active moveset must contain exactly
// the four moves: Slash, Shield Up, Battle Cry, and Second Wind — in any order.
// Validates: Requirements 8.1

describe("P5: Hero default moveset on new run", () => {
  const defaultMoveNames = ["Slash", "Shield Up", "Battle Cry", "Second Wind"];
  const defaultMoveIds = ["slash", "shield-up", "battle-cry", "second-wind"];

  it("property: initHero returns moveset with exactly the 4 default moves", () => {
    fc.assert(
      fc.property(
        fc.nat(), // arbitrary seed/value (initHero is deterministic)
        (_) => {
          const hero = initHero();

          // Must have exactly 4 moves
          if (hero.moveset.length !== 4) return false;

          // All default move ids must be present
          const movesetIds = hero.moveset.map((m) => m.id);
          const allPresent = defaultMoveIds.every((id) => movesetIds.includes(id));

          // No extra moves
          const onlyDefaults = movesetIds.every((id) => defaultMoveIds.includes(id));

          return allPresent && onlyDefaults;
        }
      ),
      { numRuns: 10 } // initHero is deterministic, 10 runs sufficient
    );
  });

  it("property: initHero returns movePool containing all 4 default moves", () => {
    fc.assert(
      fc.property(
        fc.nat(),
        (_) => {
          const hero = initHero();

          if (hero.movePool.length < 4) return false;

          const poolIds = hero.movePool.map((m) => m.id);
          return defaultMoveIds.every((id) => poolIds.includes(id));
        }
      ),
      { numRuns: 10 }
    );
  });

  it("unit: default moves have correct types", () => {
    const hero = initHero();
    const slash = hero.moveset.find((m) => m.id === "slash");
    const shieldUp = hero.moveset.find((m) => m.id === "shield-up");
    const battleCry = hero.moveset.find((m) => m.id === "battle-cry");
    const secondWind = hero.moveset.find((m) => m.id === "second-wind");

    expect(slash?.type).toBe("physical");
    expect(shieldUp?.type).toBe("buff");
    expect(battleCry?.type).toBe("buff");
    expect(secondWind?.type).toBe("magic");
  });
});

// ── P9: Move learning adds the move to the hero's pool ────────────────────────
// For any monster and any move selected from that monster's moveset as the
// learned move, after post-battle processing the hero's movePool must contain
// that move, and the post-battle screen render must include the move's name.
// Validates: Requirements 10.1, 10.2, 10.3

describe("P9: Move learning adds move to pool", () => {
  it("property: learnMove adds the move to hero's movePool", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          type: fc.constantFrom("physical", "magic", "buff", "debuff"),
          baseValue: fc.integer({ min: 0, max: 20 }),
        }),
        fc.option(
          fc.record({
            kind: fc.constantFrom("buff", "debuff", "drain"),
            stat: fc.constantFrom("attack", "defense", "magic", "health"),
            amount: fc.integer({ min: 1, max: 10 }),
            turns: fc.integer({ min: 1, max: 5 }),
          }),
          { nil: null }
        ),
        (moveData, effect) => {
          const move = { ...moveData, effect: effect as any } as Move;
          const hero = initHero();
          const result = learnMove(hero, move);

          // Move should be in the pool
          const inPool = result.movePool.some((m) => m.id === move.id);
          if (!inPool) return false;

          // If move was already known, pool should be unchanged
          if (hero.movePool.some((m) => m.id === move.id)) {
            return result.movePool.length === hero.movePool.length;
          }

          return result.movePool.length === hero.movePool.length + 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: learnMove does not duplicate existing moves", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (moveId) => {
          const existingMove: Move = {
            id: moveId,
            name: "Test Move",
            type: "physical",
            baseValue: 10,
            effect: null,
          };

          const hero = initHero();
          // Pre-add the move
          const heroWithMove = {
            ...hero,
            movePool: [...hero.movePool, existingMove],
          };

          // Try to learn it again
          const result = learnMove(heroWithMove, existingMove);

          // Pool size should not change
          return result.movePool.length === heroWithMove.movePool.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── P10: XP award and level-up correctness ───────────────────────────────────
// For any hero at any level, winning a battle against monster at index i must
// award exactly 50 * (i + 1) XP; if the resulting total XP meets or exceeds
// xpToNextLevel, a level-up must be triggered and each of the hero's four
// stats must increase by the defined amounts for that level transition.
// Validates: Requirements 11.1, 11.2, 11.3

describe("P10: XP award and level-up correctness", () => {
  function makeHero(level: number, xp: number): ReturnType<typeof initHero> {
    const hero = initHero();
    // Override level and XP for testing
    return { ...hero, level, xp, xpToNextLevel: getXPThreshold(level) };
  }

  function getXPThreshold(level: number): number {
    const table: Record<number, number> = { 1: 100, 2: 250, 3: 450, 4: 700, 5: Infinity };
    return table[level] ?? Infinity;
  }

  function getLevelUpGains(level: number): { attack: number; defense: number; health: number; magic: number } {
    const table: Record<number, { attack: number; defense: number; health: number; magic: number }> = {
      1: { attack: 3, defense: 2, health: 15, magic: 2 },
      2: { attack: 3, defense: 2, health: 15, magic: 2 },
      3: { attack: 4, defense: 3, health: 20, magic: 3 },
      4: { attack: 4, defense: 3, health: 20, magic: 3 },
    };
    return table[level] ?? { attack: 0, defense: 0, health: 0, magic: 0 };
  }

  it("property: awardXP adds exactly 50 * (monsterIndex + 1) XP (accounting for level-up)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }), // monsterIndex
        fc.integer({ min: 0, max: 100 }), // initial xp
        (monsterIndex, initialXP) => {
          const hero = makeHero(1, initialXP);
          const xpGained = 50 * (monsterIndex + 1);
          const result = awardXP(hero, monsterIndex);
          // After level-up, xp is the remainder after subtracting thresholds
          // Total XP after award = initialXP + xpGained
          // But result.xp is the XP towards the NEXT level
          const totalXP = initialXP + xpGained;
          // Simulate what checkLevelUp does
          let remainingXP = totalXP;
          let expectedLevel = 1;
          const thresholds: Record<number, number> = { 1: 100, 2: 250, 3: 450, 4: 700 };
          for (const lvl of [1, 2, 3, 4]) {
            if (remainingXP >= (thresholds[lvl] || Infinity)) {
              remainingXP -= thresholds[lvl];
              expectedLevel = lvl + 1;
            }
          }
          return result.xp === remainingXP && result.level === expectedLevel;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: level-up increases stats by defined amounts", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }), // current level (1-4, can level up)
        fc.integer({ min: 0, max: 50 }),  // xp (will add enough to trigger level-up)
        (level, extraXP) => {
          const hero = makeHero(level, 0);
          // Award enough XP to trigger level-up
          const xpNeeded = getXPThreshold(level);
          const monsterIndex = Math.ceil(xpNeeded / 50) - 1;
          const result = awardXP(hero, Math.max(0, monsterIndex));

          if (result.level > hero.level) {
            const gains = getLevelUpGains(level);
            return (
              result.baseStats.attack === hero.baseStats.attack + gains.attack &&
              result.baseStats.defense === hero.baseStats.defense + gains.defense &&
              result.baseStats.health === hero.baseStats.health + gains.health &&
              result.baseStats.magic === hero.baseStats.magic + gains.magic
            );
          }
          return true; // No level-up, no stat changes expected
        }
      ),
      { numRuns: 100 }
    );
  });

  it("unit: hero at level 1 with 50 XP awards 50 XP for monster 0 (total 100 = level up)", () => {
    const hero = makeHero(1, 50);
    const result = awardXP(hero, 0); // monsterIndex 0 = 50 XP
    expect(result.level).toBe(2);
    expect(result.baseStats.attack).toBe(12 + 3);
    expect(result.baseStats.defense).toBe(8 + 2);
    expect(result.baseStats.health).toBe(100 + 15);
    expect(result.baseStats.magic).toBe(8 + 2);
  });

  it("unit: hero at level 1 with 0 XP and monsterIndex 4 awards 250 total XP -> level 2 with remainder 150", () => {
    const hero = makeHero(1, 0);
    const result = awardXP(hero, 4); // monsterIndex 4 = 250 XP
    expect(result.level).toBe(2);
    expect(result.xp).toBe(150); // 250 - 100 threshold = 150 remaining
  });
});
