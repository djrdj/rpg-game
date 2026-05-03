// API wrapper for POST /functions/v1/monster-move — Task 8.2
import type { BattleState, Move } from "../types";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchMonsterMove(battleState: BattleState): Promise<Move> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/monster-move`;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS);
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(battleState),
      });

      if (!response.ok) {
        lastError = new Error(`Monster move request failed: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      return data.move as Move;
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`Failed to fetch monster move after ${MAX_RETRIES + 1} attempts: ${lastError}`);
}
