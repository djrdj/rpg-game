// Combat logic — Task 2
import type { Stats, ActiveEffect } from "../types/index";

export function calcPhysicalDamage(
  baseValue: number,
  attack: number,
  defense: number
): number {
  // Balanced additive formula: (base + attack) - defense
  return Math.max(1, (baseValue + attack) - defense);
}

/** 2.3 Magic damage: baseValue + magic (defense ignored) */
export function calcMagicDamage(baseValue: number, magic: number): number {
  return baseValue + magic;
}

/** 2.5 Magic heal: min(maxHealth, currentHealth + baseValue + magic) */
export function calcMagicHeal(
  baseValue: number,
  magic: number,
  currentHealth: number,
  maxHealth: number
): number {
  return Math.min(maxHealth, currentHealth + baseValue + magic);
}

/** 2.7a Apply an active effect's delta to the relevant stat, recording originalValue */
export function applyEffect(stats: Stats, effect: ActiveEffect): Stats {
  return {
    ...stats,
    [effect.stat]: stats[effect.stat] + effect.delta,
  };
}

/**
 * 2.7b Tick all active effects by one turn.
 * Decrements turnsRemaining and returns only the still-active effects.
 * Expired effects (turnsRemaining reaches 0) are dropped; callers should
 * restore stats using originalValue before calling this (or use the battle
 * loop pattern: collect expired effects first, restore stats, then filter).
 *
 * Returns { active, expired } so callers can restore originalValue for
 * any effects that just expired this tick.
 */
export function tickEffects(effects: ActiveEffect[], currentTurnNumber: number): {
  active: ActiveEffect[];
  expired: ActiveEffect[];
} {
  const ticked = effects.map((e) => {
    // Only tick if we are at least 2 rounds past the round it was applied
    // This gives the caster exactly 'turns' number of future attacks with the effect
    if (currentTurnNumber > e.appliedTurn + 1) {
      return { ...e, turnsRemaining: e.turnsRemaining - 1 };
    }
    return e;
  });
  return {
    active: ticked.filter((e) => e.turnsRemaining > 0),
    expired: ticked.filter((e) => e.turnsRemaining <= 0),
  };
}
