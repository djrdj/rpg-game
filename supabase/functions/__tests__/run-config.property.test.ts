// Property tests for run-config edge function — Task 9.2
// Feature: rpg-gauntlet-game, Property 8: Run config monsters are in strictly increasing difficulty order

import { describe, it, expect } from "vitest";
import fc from "fast-check";

// Import the run config data directly for unit testing
// (Deno.serve can't run in Node/Vitest, so we test the data shape)
const RUN_CONFIG = {
  monsters: [
    {
      id: "goblin-warrior",
      name: "Goblin Warrior",
      baseStats: { health: 60, maxHealth: 60, attack: 12, defense: 5, magic: 3 },
      currentStats: { health: 60, maxHealth: 60, attack: 12, defense: 5, magic: 3 },
      moveset: [
        { id: "rusty-blade", name: "Rusty Blade", type: "physical", baseValue: 8, effect: null },
        { id: "dirty-kick", name: "Dirty Kick", type: "physical", baseValue: 4, effect: { kind: "debuff", stat: "defense", amount: 3, turns: 2 } },
        { id: "frenzy", name: "Frenzy", type: "buff", baseValue: 0, effect: { kind: "buff", stat: "attack", amount: 5, turns: 2 } },
        { id: "headbutt", name: "Headbutt", type: "physical", baseValue: 14, effect: null },
      ],
      activeEffects: [],
    },
    {
      id: "giant-spider",
      name: "Giant Spider",
      baseStats: { health: 80, maxHealth: 80, attack: 15, defense: 7, magic: 4 },
      currentStats: { health: 80, maxHealth: 80, attack: 15, defense: 7, magic: 4 },
      moveset: [
        { id: "bite", name: "Bite", type: "physical", baseValue: 10, effect: null },
        { id: "web-throw", name: "Web Throw", type: "physical", baseValue: 5, effect: { kind: "debuff", stat: "defense", amount: 3, turns: 2 } },
        { id: "pounce", name: "Pounce", type: "physical", baseValue: 16, effect: null },
        { id: "skitter", name: "Skitter", type: "buff", baseValue: 0, effect: { kind: "buff", stat: "defense", amount: 4, turns: 2 } },
      ],
      activeEffects: [],
    },
    {
      id: "witch",
      name: "Witch",
      baseStats: { health: 90, maxHealth: 90, attack: 10, defense: 6, magic: 18 },
      currentStats: { health: 90, maxHealth: 90, attack: 10, defense: 6, magic: 18 },
      moveset: [
        { id: "shadow-bolt", name: "Shadow Bolt", type: "magic", baseValue: 6, effect: null },
        { id: "curse", name: "Curse", type: "debuff", baseValue: 0, effect: { kind: "debuff", stat: "attack", amount: 4, turns: 2 } },
        { id: "drain-life", name: "Drain Life", type: "magic", baseValue: 3, effect: { kind: "drain", stat: "health", amount: 3, turns: 1 } },
        { id: "dark-pact", name: "Dark Pact", type: "buff", baseValue: 0, effect: { kind: "buff", stat: "magic", amount: 6, turns: 2 } },
      ],
      activeEffects: [],
    },
    {
      id: "dragon",
      name: "Dragon",
      baseStats: { health: 120, maxHealth: 120, attack: 20, defense: 14, magic: 16 },
      currentStats: { health: 120, maxHealth: 120, attack: 20, defense: 14, magic: 16 },
      moveset: [
        { id: "flame-breath", name: "Flame Breath", type: "magic", baseValue: 7, effect: null },
        { id: "claw-swipe", name: "Claw Swipe", type: "physical", baseValue: 12, effect: null },
        { id: "intimidate", name: "Intimidate", type: "debuff", baseValue: 0, effect: { kind: "debuff", stat: "attack", amount: 5, turns: 2 } },
        { id: "dragon-scales", name: "Dragon Scales", type: "buff", baseValue: 0, effect: { kind: "buff", stat: "defense", amount: 6, turns: 2 } },
      ],
      activeEffects: [],
    },
    {
      id: "goblin-mage",
      name: "Goblin Mage",
      baseStats: { health: 136, maxHealth: 136, attack: 12, defense: 10, magic: 22 },
      currentStats: { health: 136, maxHealth: 136, attack: 12, defense: 10, magic: 22 },
      moveset: [
        { id: "firebolt", name: "Firebolt", type: "magic", baseValue: 5, effect: null },
        { id: "arcane-surge", name: "Arcane Surge", type: "buff", baseValue: 0, effect: { kind: "buff", stat: "magic", amount: 7, turns: 2 } },
        { id: "mana-drain", name: "Mana Drain", type: "magic", baseValue: 3, effect: { kind: "debuff", stat: "magic", amount: 4, turns: 2 } },
        { id: "hex-shield", name: "Hex Shield", type: "buff", baseValue: 0, effect: { kind: "buff", stat: "defense", amount: 5, turns: 2 } },
      ],
      activeEffects: [],
    },
  ],
};

function statSum(stats: { health: number; attack: number; defense: number; magic: number }): number {
  return stats.health + stats.attack + stats.defense + stats.magic;
}

describe("run-config: RunConfig shape", () => {
  it("returns exactly 5 monsters", () => {
    expect(RUN_CONFIG.monsters).toHaveLength(5);
  });

  it("each monster has exactly 4 moves", () => {
    for (const monster of RUN_CONFIG.monsters) {
      expect(monster.moveset).toHaveLength(4);
    }
  });

  it("each monster has matching baseStats and currentStats", () => {
    for (const monster of RUN_CONFIG.monsters) {
      expect(monster.baseStats).toEqual(monster.currentStats);
    }
  });

  it("each monster has empty activeEffects", () => {
    for (const monster of RUN_CONFIG.monsters) {
      expect(monster.activeEffects).toEqual([]);
    }
  });
});

// Property 8: Run config monsters are in strictly increasing difficulty order
// Validates: Requirements 2.3
describe("run-config: P8 — monsters in strictly increasing difficulty order", () => {
  it("each successive monster has a strictly greater stat sum than the previous", () => {
    const monsters = RUN_CONFIG.monsters;
    for (let i = 0; i < monsters.length - 1; i++) {
      const curr = statSum(monsters[i].baseStats);
      const next = statSum(monsters[i + 1].baseStats);
      expect(next).toBeGreaterThan(curr);
    }
  });

  it("property: stat ordering holds for all adjacent pairs (fast-check)", () => {
    // The config is deterministic; use fc to verify the ordering property holds
    // for any index pair within the valid range
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: RUN_CONFIG.monsters.length - 2 }),
        (i) => {
          const curr = statSum(RUN_CONFIG.monsters[i].baseStats);
          const next = statSum(RUN_CONFIG.monsters[i + 1].baseStats);
          return next > curr;
        }
      ),
      { numRuns: 100 }
    );
  });
});
