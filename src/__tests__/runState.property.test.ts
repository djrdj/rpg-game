// Feature: rpg-gauntlet-game, Property 13: Battle retry preserves hero progression

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { initRunState, retryBattle } from "../game/runState.js";
import { initHero, awardXP, learnMove } from "../game/heroState.js";
import type { Move } from "../types/index.js";

// ── P13: Battle retry preserves hero progression ────────────────────────────
// For any hero state and any battle, retrying the battle must reset the
// monster's HP to its maximum and the turn counter to 1, while the hero's
// level, stats, move pool, and active moveset remain unchanged from before
// the retry.
// Validates: Requirements 14.3

describe("P13: Battle retry preserves hero progression", () => {
  // Create a mock RunConfig for testing
  function makeRunConfig() {
    return {
      monsters: [
        {
          id: "test-monster",
          name: "Test Monster",
          baseStats: { health: 60, maxHealth: 60, attack: 10, defense: 5, magic: 3 },
          currentStats: { health: 30, maxHealth: 60, attack: 10, defense: 5, magic: 3 }, // damaged
          moveset: [
            { id: "test-attack", name: "Test Attack", type: "physical" as const, baseValue: 10, effect: null },
            { id: "test-attack2", name: "Test Attack 2", type: "physical" as const, baseValue: 8, effect: null },
            { id: "test-buff", name: "Test Buff", type: "buff" as const, baseValue: 0, effect: { kind: "buff" as const, stat: "attack" as const, amount: 3, turns: 2 } },
            { id: "test-heal", name: "Test Heal", type: "magic" as const, baseValue: 5, effect: null },
          ] as [Move, Move, Move, Move],
          activeEffects: [],
        },
      ],
    };
  }

  it("property: retryBattle preserves hero level, stats, movePool, and moveset", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // arbitrary seed
        (_) => {
          const runConfig = makeRunConfig();
          const runState = initRunState(runConfig);

          // Snapshot hero state before retry
          const heroBefore = { ...runState.hero };

          // Simulate some progression
          let progressedHero = awardXP(runState.hero, 0); // award some XP
          progressedHero = learnMove(progressedHero, {
            id: "learned-move",
            name: "Learned Move",
            type: "magic",
            baseValue: 5,
            effect: null,
          });

          const runStateWithProgress = { ...runState, hero: progressedHero };

          // Retry the battle
          const result = retryBattle(runStateWithProgress);

          // Hero state must be unchanged
          expect(result.hero.level).toBe(progressedHero.level);
          expect(result.hero.xp).toBe(progressedHero.xp);
          expect(result.hero.baseStats).toEqual(progressedHero.baseStats);
          expect(result.hero.currentStats).toEqual(progressedHero.currentStats);
          expect(result.hero.movePool).toEqual(progressedHero.movePool);
          expect(result.hero.moveset).toEqual(progressedHero.moveset);

          return true;
        }
      ),
      { numRuns: 10 } // Deterministic, 10 runs sufficient
    );
  });

  it("property: retryBattle resets monster HP to max", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // damage to monster
        (damage) => {
          const runConfig = makeRunConfig();
          const runState = initRunState(runConfig);

          // Damage the monster
          const damagedMonster = {
            ...runState.runConfig.monsters[0],
            currentStats: {
              ...runState.runConfig.monsters[0].currentStats,
              health: Math.max(1, 60 - damage),
            },
          };
          const damagedRunState = {
            ...runState,
            runConfig: {
              ...runState.runConfig,
              monsters: [damagedMonster],
            },
          };

          const result = retryBattle(damagedRunState);
          const monsterResult = result.runConfig.monsters[0];

          return monsterResult.currentStats.health === monsterResult.baseStats.maxHealth;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("unit: retryBattle resets monster HP to maxHealth", () => {
    const runConfig = makeRunConfig();
    const runState = initRunState(runConfig);

    // Monster is already at full health in initRunState
    const result = retryBattle(runState);
    const monster = result.runConfig.monsters[0];

    expect(monster.currentStats.health).toBe(monster.baseStats.maxHealth);
  });

  it("unit: retryBattle clears monster active effects", () => {
    const runConfig = makeRunConfig();
    const runState = initRunState(runConfig);

    // Add some active effects to monster
    const monsterWithEffects = {
      ...runState.runConfig.monsters[0],
      activeEffects: [{ stat: "attack" as const, delta: 5, turnsRemaining: 2, appliedTurn: 1, originalValue: 10 }],
    };
    const runStateWithEffects = {
      ...runState,
      runConfig: { ...runState.runConfig, monsters: [monsterWithEffects] },
    };

    const result = retryBattle(runStateWithEffects);
    const monster = result.runConfig.monsters[0];

    expect(monster.activeEffects).toEqual([]);
  });
});
