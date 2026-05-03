// Move management — Task 4

import type { Hero } from "../types/index.js";

/**
 * Swaps a move from the hero's movePool into the active moveset at the given slot.
 * The displaced move is returned to the pool.
 *
 * Silent rejection (returns hero unchanged) when:
 * - poolMoveId is not found in movePool
 * - activeSlotIndex is out of range (not 0–3)
 * - poolMoveId is already present in the active moveset at a different slot
 *
 * Requirement: 12.1, 12.3, 12.4
 */
export function swapMove(
  hero: Hero,
  poolMoveId: string,
  activeSlotIndex: number
): Hero {
  // Reject if slot index is out of range
  if (activeSlotIndex < 0 || activeSlotIndex > 3) return hero;

  // Reject if the move is not in the pool
  const poolMove = hero.movePool.find((m) => m.id === poolMoveId);
  if (!poolMove) return hero;

  // Reject if the move is already in the active moveset at a different slot
  const existingSlot = hero.moveset.findIndex((m) => m.id === poolMoveId);
  if (existingSlot !== -1 && existingSlot !== activeSlotIndex) return hero;

  // If the move is already in the exact same slot, nothing to do
  if (existingSlot === activeSlotIndex) return hero;

  // The move being displaced
  const displacedMove = hero.moveset[activeSlotIndex];

  // Build the new moveset
  const newMoveset = [...hero.moveset] as [
    typeof hero.moveset[0],
    typeof hero.moveset[1],
    typeof hero.moveset[2],
    typeof hero.moveset[3],
  ];
  newMoveset[activeSlotIndex] = poolMove;

  // Build the new pool: remove the swapped-in move, add the displaced move (if not already there)
  const newPool = hero.movePool.filter((m) => m.id !== poolMoveId);
  if (displacedMove && !newPool.some((m) => m.id === displacedMove.id)) {
    newPool.push(displacedMove);
  }

  return { ...hero, moveset: newMoveset, movePool: newPool };
}
