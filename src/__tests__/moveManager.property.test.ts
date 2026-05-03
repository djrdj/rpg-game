// Feature: rpg-gauntlet-game, Property 11: Moveset invariant — always exactly 4 unique moves

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { swapMove } from "../game/moveManager.js";
import { initHero } from "../game/heroState.js";
import type { Move } from "../types/index.js";

// ── P11: Moveset invariant — always exactly 4 unique moves ────────────────
// For any sequence of valid move swaps in Move Management, the hero's active
// moveset must always contain exactly 4 moves and must never contain
// duplicate move id values.
// Validates: Requirements 12.1, 12.3, 12.4

describe("P11: Moveset invariant — always exactly 4 unique moves", () => {
  // Helper to create a move with unique id
  function makeMove(id: string): Move {
    return { id, name: id, type: "physical", baseValue: 10, effect: null };
  }

  it("property: after swapMove, moveset always has exactly 4 moves", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.nat().map((n) => `pool-move-${n}`), // pool move id
            fc.integer({ min: 0, max: 3 }) // slot index
          ),
          { minLength: 1, maxLength: 20 }
        ),
        (swaps) => {
          let hero = initHero();

          // Add some extra moves to the pool for swapping
          const extraMoves = ["extra-1", "extra-2", "extra-3", "extra-4"].map(makeMove);
          for (const m of extraMoves) {
            hero = { ...hero, movePool: [...hero.movePool, m] };
          }

          // Perform each swap
          for (const [moveId, slotIdx] of swaps) {
            hero = swapMove(hero, moveId, slotIdx);
          }

          // Invariant: moveset must have exactly 4 moves
          if (hero.moveset.length !== 4) return false;

          // Invariant: no duplicate ids in moveset
          const ids = hero.moveset.map((m) => m.id);
          const uniqueIds = new Set(ids);
          return uniqueIds.size === 4;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: swapMove never creates duplicate move ids in moveset", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3 }), // slot index
        fc.string({ minLength: 1 }), // pool move id
        (slotIdx, moveId) => {
          const hero = initHero();

          // Add the move to pool
          const newMove: Move = { id: moveId, name: moveId, type: "physical", baseValue: 10, effect: null };
          const heroWithMove = { ...hero, movePool: [...hero.movePool, newMove] };

          const result = swapMove(heroWithMove, moveId, slotIdx);

          // Check for duplicates
          const ids = result.moveset.map((m) => m.id);
          const uniqueIds = new Set(ids);
          return uniqueIds.size === result.moveset.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("unit: swapMove rejects invalid slot index", () => {
    const hero = initHero();
    const result1 = swapMove(hero, "slash", -1);
    const result2 = swapMove(hero, "slash", 4);
    const result3 = swapMove(hero, "slash", 99);

    // Hero should be unchanged
    expect(result1).toEqual(hero);
    expect(result2).toEqual(hero);
    expect(result3).toEqual(hero);
  });

  it("unit: swapMove rejects move not in pool", () => {
    const hero = initHero();
    const result = swapMove(hero, "non-existent-move", 0);
    expect(result).toEqual(hero);
  });

  it("unit: swapMove works correctly for valid swap", () => {
    const hero = initHero();
    const extraMove: Move = { id: "extra", name: "Extra", type: "magic", baseValue: 5, effect: null };
    const heroWithExtra = { ...hero, movePool: [...hero.movePool, extraMove] };

    const result = swapMove(heroWithExtra, "extra", 0);

    expect(result.moveset[0].id).toBe("extra");
    expect(result.movePool.find((m) => m.id === "slash")).toBeDefined(); // displaced move in pool
  });
});
