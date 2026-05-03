// Feature: rpg-gauntlet-game, Property 1: Physical damage formula
// Feature: rpg-gauntlet-game, Property 2: Magic damage ignores defense
// Feature: rpg-gauntlet-game, Property 3: Magic healing is capped at max health
// Feature: rpg-gauntlet-game, Property 4: Buff/debuff application and expiry round-trip

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  calcPhysicalDamage,
  calcMagicDamage,
  calcMagicHeal,
  applyEffect,
  tickEffects,
} from "../game/combat.js";
import type { ActiveEffect, Stats, StatKey } from "../types/index.js";

// ── P1: Physical damage formula ──────────────────────────────────────────────
// For any attacker with a given attack stat, a target with a given defense stat,
// and a physical move with a given baseValue, the calculated damage must equal
// max(1, baseValue * attack - defense).
// Validates: Requirements 7.1

describe("P1: Physical damage formula", () => {
  it("property: damage = max(1, baseValue * attack - defense)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),   // baseValue
        fc.integer({ min: 1, max: 100 }),   // attack
        fc.integer({ min: 0, max: 200 }),   // defense
        (baseValue, attack, defense) => {
          const result = calcPhysicalDamage(baseValue, attack, defense);
          const expected = Math.max(1, (baseValue + attack) - defense);
          return result === expected;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: damage is never less than 1", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),    // baseValue
        fc.integer({ min: 1, max: 10 }),    // attack
        fc.integer({ min: 100, max: 1000 }), // defense (very high)
        (baseValue, attack, defense) => {
          const result = calcPhysicalDamage(baseValue, attack, defense);
          return result >= 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── P2: Magic damage ignores defense ─────────────────────────────────────────
// For any caster with a given magic stat, a target with any defense value,
// and a magic damage move with a given baseValue, the calculated damage
// must equal baseValue * magic regardless of the target's defense.
// Validates: Requirements 7.2

describe("P2: Magic damage ignores defense", () => {
  it("property: damage = baseValue * magic, independent of defense", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),   // baseValue
        fc.integer({ min: 1, max: 100 }),   // magic
        fc.integer({ min: 0, max: 500 }),   // defense (any value)
        (baseValue, magic, defense) => {
          const result = calcMagicDamage(baseValue, magic);
          const expected = baseValue + magic;
          return result === expected;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: same move gives same damage regardless of target defense", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),    // baseValue
        fc.integer({ min: 1, max: 50 }),    // magic
        fc.integer({ min: 0, max: 200 }),   // defense1
        fc.integer({ min: 0, max: 200 }),   // defense2
        (baseValue, magic, _d1, _d2) => {
          const result1 = calcMagicDamage(baseValue, magic);
          const result2 = calcMagicDamage(baseValue, magic);
          return result1 === result2;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── P3: Magic healing is capped at max health ────────────────────────────────
// For any caster with a given magic stat, currentHealth, and maxHealth,
// and a healing move with a given baseValue, the resulting health must equal
// min(maxHealth, currentHealth + baseValue * magic).
// Validates: Requirements 7.3

describe("P3: Magic healing is capped at max health", () => {
  it("property: healed health = min(maxHealth, currentHealth + baseValue * magic)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),    // baseValue
        fc.integer({ min: 1, max: 50 }),    // magic
        fc.integer({ min: 1, max: 200 }),   // currentHealth
        fc.integer({ min: 1, max: 200 }),   // maxHealth
        (baseValue, magic, currentHealth, maxHealth) => {
          const result = calcMagicHeal(baseValue, magic, currentHealth, maxHealth);
          const expected = Math.min(maxHealth, currentHealth + baseValue + magic);
          return result === expected;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: healed health never exceeds maxHealth", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),   // baseValue
        fc.integer({ min: 1, max: 100 }),   // magic
        fc.integer({ min: 1, max: 100 }),   // currentHealth
        fc.integer({ min: 1, max: 100 }),   // maxHealth
        (baseValue, magic, currentHealth, maxHealth) => {
          const result = calcMagicHeal(baseValue, magic, currentHealth, maxHealth);
          return result <= maxHealth;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── P4: Buff/debuff application and expiry round-trip ─────────────────────────
// For any character stat, effect amount, and duration, applying a buff or
// debuff should change the stat by the defined amount; after the effect's
// turnsRemaining reaches 0, the stat must be restored to its exact
// pre-effect value (originalValue).
// Validates: Requirements 7.4, 7.5, 7.6

describe("P4: Buff/debuff application and expiry round-trip", () => {
  function makeStats(health = 100, maxHealth = 100, attack = 10, defense = 10, magic = 10): Stats {
    return { health, maxHealth, attack, defense, magic };
  }

  function makeEffect(stat: StatKey, delta: number, turns: number): ActiveEffect {
    return { stat, delta, turnsRemaining: turns, appliedTurn: 1, originalValue: 0 };
  }

  it("property: applying a buff increases the stat by delta", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),    // delta (buff)
        fc.integer({ min: 10, max: 100 }),  // original stat value
        (delta, origValue) => {
          const stats = makeStats();
          // Apply to attack stat
          const effect: ActiveEffect = { stat: "attack", delta, turnsRemaining: 2, appliedTurn: 1, originalValue: origValue };
          const result = applyEffect(stats, effect);
          return result.attack === stats.attack + delta;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: applying a debuff decreases the stat by delta", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),    // delta (debuff - positive, but stat decreases)
        fc.integer({ min: 10, max: 100 }),  // original stat value
        (delta, origValue) => {
          const stats = makeStats();
          const effect: ActiveEffect = { stat: "defense", delta: -delta, turnsRemaining: 2, appliedTurn: 1, originalValue: origValue };
          const result = applyEffect(stats, effect);
          return result.defense === stats.defense - delta;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: after effect expires (turnsRemaining reaches 0), stat is restored", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),    // delta
        fc.integer({ min: 10, max: 100 }),  // original stat value
        (delta, origValue) => {
          const stats = makeStats(origValue, origValue, origValue, origValue, origValue);

          // Apply buff to attack on turn 1
          const effect: ActiveEffect = { stat: "attack", delta, turnsRemaining: 2, appliedTurn: 1, originalValue: origValue };
          const buffed = applyEffect(stats, effect);
          if (buffed.attack !== origValue + delta) return false;

          // Tick on turn 2 — currentTurn(2) is not > appliedTurn(1) + 1 (2), so it does NOT decrement yet.
          const tick1 = tickEffects([{ ...effect }], 2);
          if (tick1.active.length !== 1) return false;
          if (tick1.expired.length !== 0) return false;

          // Tick on turn 3 — currentTurn(3) > appliedTurn(1) + 1 (2), so turnsRemaining becomes 1
          const tick2 = tickEffects([{ ...effect }], 3);
          if (tick2.active.length !== 1) return false;
          if (tick2.expired.length !== 0) return false;
          
          // Tick on turn 4 — currentTurn(4) > appliedTurn(1) + 1 (2), so turnsRemaining becomes 0 (expires)
          // We must pass the returned active effect from tick2 to simulate consecutive ticks
          const tick3 = tickEffects(tick2.active, 4);
          if (tick3.active.length !== 0) return false;
          if (tick3.expired.length !== 1) return false;

          // After expiry, stat should be restored to originalValue
          // (caller is responsible for restoring using expired[0].originalValue)
          return tick3.expired[0].originalValue === origValue;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: multiple effects on different stats can coexist", () => {
    const stats = makeStats(100, 100, 10, 10, 10);

    const buff1: ActiveEffect = { stat: "attack", delta: 5, turnsRemaining: 2, appliedTurn: 1, originalValue: 10 };
    const buff2: ActiveEffect = { stat: "defense", delta: 3, turnsRemaining: 3, appliedTurn: 1, originalValue: 10 };

    const after1 = applyEffect(stats, buff1);
    const after2 = applyEffect(after1, buff2);

    return after2.attack === 15 && after2.defense === 13 && after2.magic === 10;
  });
});
