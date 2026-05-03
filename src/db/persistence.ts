// Local Storage persistence layer for public deployment
import type { HeroRunRow, RunState } from "../types/index";

const SAVE_KEY_PREFIX = "rpg_gauntlet_run_";

/**
 * Saves a hero run to the browser's localStorage.
 * On failure (e.g. quota exceeded): logs to console and shows a non-blocking warning. Does NOT throw.
 */
export async function saveHeroRun(runState: RunState): Promise<void> {
  const row: Omit<HeroRunRow, "created_at"> = {
    id: runState.runId,
    hero_level: runState.hero.level,
    hero_xp: runState.hero.xp,
    hero_stats: runState.hero.currentStats,
    move_pool: runState.hero.movePool,
    active_moveset: runState.hero.moveset,
    current_monster_index: runState.currentMonsterIndex,
    is_complete: runState.isComplete,
    updated_at: new Date().toISOString(),
  };

  try {
    localStorage.setItem(SAVE_KEY_PREFIX + runState.runId, JSON.stringify(row));
  } catch (error) {
    console.error("[persistence] saveHeroRun failed (localStorage):", error);
    console.warn("[toast] Could not save run progress. Your progress may not be saved.");
  }
}

/**
 * Loads a hero run row from localStorage by run ID.
 * Returns null on failure (caller should start a fresh run).
 */
export async function loadHeroRun(runId: string): Promise<HeroRunRow | null> {
  try {
    const saved = localStorage.getItem(SAVE_KEY_PREFIX + runId);
    if (!saved) return null;
    return JSON.parse(saved) as HeroRunRow;
  } catch (error) {
    console.error("[persistence] loadHeroRun failed (localStorage):", error);
    return null;
  }
}
