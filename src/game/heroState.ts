// Hero state management — Task 3

import type { Hero, Move, Stats } from "../types/index.js";

// ── Default move constants ───────────────────────────────────────────────────

export const SLASH: Move = {
  id: "slash",
  name: "Slash",
  type: "physical",
  baseValue: 8,
  effect: null,
};

export const SHIELD_UP: Move = {
  id: "shield-up",
  name: "Shield Up",
  type: "buff",
  baseValue: 0,
  effect: { kind: "buff", stat: "defense", amount: 4, turns: 2 },
};

export const BATTLE_CRY: Move = {
  id: "battle-cry",
  name: "Battle Cry",
  type: "buff",
  baseValue: 0,
  effect: { kind: "buff", stat: "attack", amount: 4, turns: 2 },
};

export const SECOND_WIND: Move = {
  id: "second-wind",
  name: "Second Wind",
  type: "magic",
  baseValue: 3,
  effect: null,
};

// ── XP / level-up table ──────────────────────────────────────────────────────

interface LevelUpEntry {
  xpThreshold: number;
  attackGain: number;
  defenseGain: number;
  healthGain: number;
  magicGain: number;
}

const LEVEL_UP_TABLE: Record<number, LevelUpEntry> = {
  1: { xpThreshold: 100,  attackGain: 3, defenseGain: 2, healthGain: 15, magicGain: 2 },
  2: { xpThreshold: 250,  attackGain: 3, defenseGain: 2, healthGain: 15, magicGain: 2 },
  3: { xpThreshold: 450,  attackGain: 4, defenseGain: 3, healthGain: 20, magicGain: 3 },
  4: { xpThreshold: 700,  attackGain: 4, defenseGain: 3, healthGain: 20, magicGain: 3 },
};

// ── Hero initialisation ──────────────────────────────────────────────────────

/** Create a fresh hero with default starting stats and moveset. */
export function initHero(): Hero {
  const baseStats: Stats = {
    health: 100,
    maxHealth: 100,
    attack: 12,
    defense: 8,
    magic: 8,
  };

  return {
    level: 1,
    xp: 0,
    xpToNextLevel: LEVEL_UP_TABLE[1].xpThreshold,
    baseStats: { ...baseStats },
    currentStats: { ...baseStats },
    moveset: [SLASH, SHIELD_UP, BATTLE_CRY, SECOND_WIND],
    movePool: [SLASH, SHIELD_UP, BATTLE_CRY, SECOND_WIND],
    activeEffects: [],
  };
}

// ── XP and level-up ──────────────────────────────────────────────────────────

/**
 * Award XP to the hero after defeating a monster.
 * monsterIndex is 0-based (0 = first monster, 4 = last).
 * XP formula: 50 * (monsterIndex + 1)
 */
export function awardXP(hero: Hero, monsterIndex: number): Hero {
  const xpGained = 50 * (monsterIndex + 1);
  const updated: Hero = { ...hero, xp: hero.xp + xpGained };
  return checkLevelUp(updated);
}

/**
 * Check whether the hero has enough XP to level up and apply the level-up
 * if so. Handles multiple level-ups in a single call.
 */
export function checkLevelUp(hero: Hero): Hero {
  let current = hero;

  while (current.level < 5) {
    const entry = LEVEL_UP_TABLE[current.level];
    if (!entry || current.xp < entry.xpThreshold) break;

    const newBaseStats: Stats = {
      health: current.baseStats.health + entry.healthGain,
      maxHealth: current.baseStats.maxHealth + entry.healthGain,
      attack: current.baseStats.attack + entry.attackGain,
      defense: current.baseStats.defense + entry.defenseGain,
      magic: current.baseStats.magic + entry.magicGain,
    };

    const newCurrentStats: Stats = {
      health: current.currentStats.health + entry.healthGain,
      maxHealth: current.currentStats.maxHealth + entry.healthGain,
      attack: current.currentStats.attack + entry.attackGain,
      defense: current.currentStats.defense + entry.defenseGain,
      magic: current.currentStats.magic + entry.magicGain,
    };

    const nextLevel = current.level + 1;
    const nextEntry = LEVEL_UP_TABLE[nextLevel];

    current = {
      ...current,
      level: nextLevel,
      xp: current.xp - entry.xpThreshold,
      xpToNextLevel: nextEntry ? nextEntry.xpThreshold : 0,
      baseStats: newBaseStats,
      currentStats: newCurrentStats,
    };
  }

  return current;
}

// ── Move learning ────────────────────────────────────────────────────────────

/**
 * Add a move to the hero's move pool. Duplicate moves (by id) are ignored.
 */
export function learnMove(hero: Hero, move: Move): Hero {
  const alreadyKnown = hero.movePool.some((m) => m.id === move.id);
  if (alreadyKnown) return hero;
  return { ...hero, movePool: [...hero.movePool, move] };
}
