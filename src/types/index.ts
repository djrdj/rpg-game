// ── Stat block ──────────────────────────────────────────────────────────────
export interface Stats {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  magic: number;
}

// ── Move ────────────────────────────────────────────────────────────────────
export type MoveType = "physical" | "magic" | "buff" | "debuff";
export type StatKey = "attack" | "defense" | "magic" | "health";

export interface MoveEffect {
  kind: "buff" | "debuff" | "drain"; // drain = damage + self-heal
  stat: StatKey;
  amount: number;
  turns: number;
}

export interface Move {
  id: string;
  name: string;
  type: MoveType;
  baseValue: number; // 0 for pure buff/debuff moves
  effect: MoveEffect | null;
}

// ── Active buff/debuff on a character ───────────────────────────────────────
export interface ActiveEffect {
  stat: StatKey;
  delta: number; // positive = buff, negative = debuff
  turnsRemaining: number;
  originalValue: number; // stat value before the effect was applied
  appliedTurn: number; // the turnNumber when the effect was cast
}

// ── Hero ─────────────────────────────────────────────────────────────────────
export interface Hero {
  level: number;
  xp: number;
  xpToNextLevel: number;
  baseStats: Stats;
  currentStats: Stats; // includes active buff/debuff modifications
  moveset: [Move, Move, Move, Move]; // always exactly 4
  movePool: Move[];
  activeEffects: ActiveEffect[];
}

// ── Monster ──────────────────────────────────────────────────────────────────
export interface Monster {
  id: string;
  name: string;
  baseStats: Stats;
  currentStats: Stats;
  moveset: [Move, Move, Move, Move];
  activeEffects: ActiveEffect[];
}

// ── Run Config (from server) ─────────────────────────────────────────────────
export interface RunConfig {
  monsters: Monster[]; // length === 5, in encounter order
}

// ── Battle State (sent to monster-move endpoint) ─────────────────────────────
export interface BattleState {
  monsterId: string;
  monsterStats: Stats;
  monsterMoveset: Move[];
  heroStats: Stats;
  activeBuffs: ActiveEffect[];
  turnNumber: number;
}

// ── Run State (client-side) ──────────────────────────────────────────────────
export interface RunState {
  runId: string;
  hero: Hero;
  runConfig: RunConfig;
  currentMonsterIndex: number; // 0–4
  isComplete: boolean;
}

// ── Database row (hero_runs table) ───────────────────────────────────────────
export interface HeroRunRow {
  id: string; // UUID, run ID
  hero_level: number;
  hero_xp: number;
  hero_stats: Stats; // stored as JSONB
  move_pool: Move[]; // stored as JSONB
  active_moveset: Move[]; // stored as JSONB
  current_monster_index: number;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}
