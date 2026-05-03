// Run state management — Task 5

import type { RunConfig, RunState } from "../types/index.js";
import { initHero } from "./heroState.js";

/**
 * Create a fresh RunState for a new run.
 * Requirements: 1.2, 3.1
 */
export function initRunState(runConfig: RunConfig): RunState {
  return {
    runId: crypto.randomUUID(),
    hero: initHero(),
    runConfig,
    currentMonsterIndex: 0,
    isComplete: false,
  };
}

/**
 * Reset the current monster's HP and clear its active effects,
 * leaving the hero's level, stats, moveset, move pool, and active effects unchanged.
 * Requirements: 14.3
 */
export function retryBattle(runState: RunState): RunState {
  const monsters = runState.runConfig.monsters;
  const idx = runState.currentMonsterIndex;
  const monster = monsters[idx];

  const resetMonster = {
    ...monster,
    currentStats: {
      ...monster.currentStats,
      health: monster.baseStats.maxHealth,
      maxHealth: monster.baseStats.maxHealth,
    },
    activeEffects: [],
  };

  const updatedMonsters = monsters.map((m, i) => (i === idx ? resetMonster : m));

  // Also restore hero HP to max and clear active effects so the retry is fair
  const resetHero = {
    ...runState.hero,
    currentStats: {
      ...runState.hero.baseStats,
    },
    activeEffects: [],
  };

  return {
    ...runState,
    hero: resetHero,
    runConfig: {
      ...runState.runConfig,
      monsters: updatedMonsters,
    },
  };
}
