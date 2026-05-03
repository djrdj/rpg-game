// monster-move Edge Function — Task 10.1
// POST /functions/v1/monster-move — receives BattleState, returns a Move from the monster's moveset

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/** Select a move based on situational logic (smarter AI). */
export function selectMove(battleStateOrMoveset: any): any {
  // Backward compatibility for tests that pass just the moveset array
  if (Array.isArray(battleStateOrMoveset)) {
    return battleStateOrMoveset[Math.floor(Math.random() * battleStateOrMoveset.length)];
  }

  const { monsterStats, monsterMoveset, heroStats, turnNumber } = battleStateOrMoveset;
  const moves = monsterMoveset as any[];

  // Fallback if moveset is missing or empty
  if (!moves || moves.length === 0) return null;

  // 1. If very low health, prioritize healing or defensive moves
  const healthRatio = monsterStats.health / monsterStats.maxHealth;
  if (healthRatio < 0.3) {
    const healMove = moves.find(m => m.effect?.kind === "drain" || m.id === "hex-shield" || m.id === "skitter");
    if (healMove) return healMove;
  }

  // 2. On early turns, prioritize buffs or debuffs
  if (turnNumber <= 2) {
    const buffMove = moves.find(m => m.type === "buff" || m.type === "debuff");
    if (buffMove && Math.random() > 0.3) return buffMove;
  }

  // 3. If hero is low health, go for the kill (highest base value physical/magic)
  if (heroStats.health < 40) {
    const killMove = [...moves].sort((a, b) => b.baseValue - a.baseValue)[0];
    if (killMove && killMove.baseValue > 0) return killMove;
  }

  // 4. Default: weighted random (prefer damage moves slightly)
  const damageMoves = moves.filter(m => m.baseValue > 0);
  if (damageMoves.length > 0 && Math.random() > 0.4) {
    return damageMoves[Math.floor(Math.random() * damageMoves.length)];
  }

  return moves[Math.floor(Math.random() * moves.length)];
}

// Only call Deno.serve if Deno is available (not in Node.js tests)
if (typeof Deno !== "undefined") {
  Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    // Validate required fields
    const requiredFields = ["monsterId", "monsterStats", "monsterMoveset", "heroStats", "turnNumber"] as const;
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    // Validate monsterMoveset is a non-empty array
    if (!Array.isArray(body.monsterMoveset)) {
      return json({ error: "Missing required field: monsterMoveset" }, 400);
    }
    if ((body.monsterMoveset as unknown[]).length === 0) {
      return json({ error: "monsterMoveset must not be empty" }, 400);
    }

    const move = selectMove(body);
    return json({ move });
  });
}
