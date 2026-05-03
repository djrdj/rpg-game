# Implementation Plan: RPG Gauntlet Game

## Overview

Implement a browser-based 2D turn-based RPG using KaPlay v4 (TypeScript), Supabase Edge Functions (Deno), and Supabase PostgreSQL. The implementation proceeds from foundational types and project setup through core game logic, backend edge functions, all KaPlay scenes, persistence, and finally full integration wiring.

## Tasks

- [x] 1. Project setup and shared types
  - Scaffold the project: `src/`, `src/scenes/`, `src/game/`, `src/api/`, `src/db/`, `src/types/`, `src/__tests__/`, `supabase/functions/run-config/`, `supabase/functions/monster-move/`, `supabase/functions/__tests__/`
  - Install and configure KaPlay v4, Supabase JS SDK, Vitest, and fast-check
  - Write all TypeScript interfaces and types in `src/types/index.ts`: `Stats`, `MoveType`, `StatKey`, `MoveEffect`, `Move`, `ActiveEffect`, `Hero`, `Monster`, `RunConfig`, `BattleState`, `RunState`, `HeroRunRow`
  - Create the `hero_runs` table SQL migration file
  - _Requirements: 2.2, 7.1–7.6, 8.1, 13.1_

- [x] 2. Core combat logic (`src/game/combat.ts`)
  - [x] 2.1 Implement `calcPhysicalDamage(baseValue, attack, defense): number`
    - Formula: `max(1, baseValue * attack - defense)`
    - _Requirements: 7.1_

   - [x]* 2.2 Write property test for physical damage formula (P1)
    - **Property 1: Physical damage formula**
    - **Validates: Requirements 7.1**
    - File: `src/__tests__/combat.property.test.ts`
    - Tag: `// Feature: rpg-gauntlet-game, Property 1: Physical damage formula`

  - [x] 2.3 Implement `calcMagicDamage(baseValue, magic): number`
    - Formula: `baseValue * magic`, defense ignored
    - _Requirements: 7.2_

   - [x]* 2.4 Write property test for magic damage ignores defense (P2)
    - **Property 2: Magic damage ignores defense**
    - **Validates: Requirements 7.2**
    - File: `src/__tests__/combat.property.test.ts`

  - [x] 2.5 Implement `calcMagicHeal(baseValue, magic, currentHealth, maxHealth): number`
    - Formula: `min(maxHealth, currentHealth + baseValue * magic)`
    - _Requirements: 7.3_

   - [x]* 2.6 Write property test for magic healing capped at max health (P3)
    - **Property 3: Magic healing is capped at max health**
    - **Validates: Requirements 7.3**
    - File: `src/__tests__/combat.property.test.ts`

  - [x] 2.7 Implement `applyEffect(stats, effect): Stats` and `tickEffects(effects): ActiveEffect[]`
    - `applyEffect` modifies the stat by `delta` and records `originalValue`
    - `tickEffects` decrements `turnsRemaining`; when it reaches 0, restores `originalValue`
    - _Requirements: 7.4, 7.5, 7.6_

   - [x]* 2.8 Write property test for buff/debuff application and expiry round-trip (P4)
    - **Property 4: Buff/debuff application and expiry round-trip**
    - **Validates: Requirements 7.4, 7.5, 7.6**
    - File: `src/__tests__/combat.property.test.ts`

   - [x]* 2.9 Write unit tests for combat edge cases
    - Test minimum damage of 1 for physical moves
    - Test healing exactly at max health boundary
    - File: `src/__tests__/combat.unit.test.ts`
    - _Requirements: 7.1, 7.3_

- [x] 3. Hero state management (`src/game/heroState.ts`)
  - [x] 3.1 Implement `initHero(): Hero`
    - Starting stats: HP 100, ATK 12, DEF 8, MAG 8
    - Default moveset: Slash, Shield Up, Battle Cry, Second Wind (define these move constants here)
    - _Requirements: 8.1–8.5_

   - [x]* 3.2 Write property test for hero default moveset on new run (P5)
    - **Property 5: Hero starts every run with the default moveset**
    - **Validates: Requirements 8.1**
    - File: `src/__tests__/heroState.property.test.ts`

  - [x] 3.3 Implement `awardXP(hero, monsterIndex): Hero` and `checkLevelUp(hero): Hero`
    - XP formula: `50 * (monsterIndex + 1)`
    - Level-up thresholds and stat gains per the design table
    - _Requirements: 11.1, 11.2, 11.3_

   - [x]* 3.4 Write property test for XP award and level-up correctness (P10)
    - **Property 10: XP award and level-up correctness**
    - **Validates: Requirements 11.1, 11.2, 11.3**
    - File: `src/__tests__/heroState.property.test.ts`

  - [x] 3.5 Implement `learnMove(hero, move): Hero`
    - Adds the move to `hero.movePool`
    - _Requirements: 10.1, 10.2_

   - [x]* 3.6 Write property test for move learning adds move to pool (P9)
    - **Property 9: Move learning adds the move to the hero's pool**
    - **Validates: Requirements 10.1, 10.2, 10.3**
    - File: `src/__tests__/heroState.property.test.ts`

- [x] 4. Move management (`src/game/moveManager.ts`)
  - [x] 4.1 Implement `swapMove(hero, poolMoveId, activeSlotIndex): Hero`
    - Swaps a move from `movePool` into the active moveset at the given slot
    - Prevents duplicate move IDs in the active moveset; silently rejects invalid swaps
    - _Requirements: 12.1, 12.3, 12.4_

   - [x]* 4.2 Write property test for moveset invariant — always exactly 4 unique moves (P11)
    - **Property 11: Moveset invariant — always exactly 4 unique moves**
    - **Validates: Requirements 12.1, 12.3, 12.4**
    - File: `src/__tests__/moveManager.property.test.ts`

- [x] 5. Run state management (`src/game/runState.ts`)
  - [x] 5.1 Implement `initRunState(runConfig): RunState`
    - Creates a new run with a UUID, initializes hero via `initHero`, sets `currentMonsterIndex` to 0
    - _Requirements: 1.2, 3.1_

  - [x] 5.2 Implement `retryBattle(runState): RunState`
    - Resets the current monster's HP to max and turn counter to 1
    - Hero level, stats, move pool, and moveset remain unchanged
    - _Requirements: 14.3_

   - [x]* 5.3 Write property test for battle retry preserves hero progression (P13)
    - **Property 13: Battle retry preserves hero progression**
    - **Validates: Requirements 14.3**
    - File: `src/__tests__/runState.property.test.ts`

- [x] 6. Checkpoint — Ensure all game logic tests pass
  - Run `vitest --run src/__tests__/` and confirm all passing; ask the user if questions arise.

- [x] 7. Persistence layer (`src/db/persistence.ts`)
  - [x] 7.1 Implement `saveHeroRun(runState): Promise<void>`
    - Upserts a `HeroRunRow` to `hero_runs` via the Supabase JS SDK
    - On SDK write failure: log to console and show a non-blocking toast; do not block gameplay
    - _Requirements: 13.2_

  - [x] 7.2 Implement `loadHeroRun(runId): Promise<HeroRunRow | null>`
    - Reads the row from `hero_runs`; returns `null` on failure (triggers fresh run)
    - _Requirements: 13.1, 13.3_

   - [x]* 7.3 Write property test for hero state persistence round-trip (P12)
    - **Property 12: Hero state persistence round-trip**
    - **Validates: Requirements 13.2**
    - Mock the Supabase SDK; verify fields match in-memory state after upsert + read
    - File: `src/__tests__/persistence.property.test.ts`

- [x] 8. API client wrappers (`src/api/`)
  - [x] 8.1 Implement `fetchRunConfig(): Promise<RunConfig>` in `src/api/runConfig.ts`
    - `GET /functions/v1/run-config`; on failure show error overlay with "Retry" button
    - _Requirements: 1.2, 2.1, 2.4_

  - [x] 8.2 Implement `fetchMonsterMove(battleState): Promise<Move>` in `src/api/monsterMove.ts`
    - `POST /functions/v1/monster-move`; retry up to 2 times with 500ms backoff on failure
    - On all retries exhausted: show error overlay with "Retry Turn" option
    - _Requirements: 5.2, 5.3, 6.1, 6.3_

- [x] 9. Supabase Edge Function — `run-config`
  - [x] 9.1 Implement `supabase/functions/run-config/index.ts`
    - Deno HTTP handler for `GET /functions/v1/run-config`
    - Returns hardcoded `RunConfig` with all 5 monsters (Goblin Warrior, Giant Spider, Witch, Dragon, Goblin Mage) with stats and movesets per the design
    - Each monster has exactly 4 moves; monsters ordered by increasing difficulty
    - _Requirements: 2.1, 2.2, 2.3, 9.1–9.5_

  - [ ]* 9.2 Write property test for run config difficulty ordering (P8)
    - **Property 8: Run config monsters are in strictly increasing difficulty order**
    - **Validates: Requirements 2.3**
    - File: `supabase/functions/__tests__/run-config.property.test.ts`

- [x] 10. Supabase Edge Function — `monster-move`
  - [x] 10.1 Implement `supabase/functions/monster-move/index.ts`
    - Deno HTTP handler for `POST /functions/v1/monster-move`
    - Validate required fields (`monsterId`, `monsterStats`, `monsterMoveset`, `heroStats`, `turnNumber`); return 400 with descriptive error on missing/empty fields
    - Implement monster AI: select a move from `monsterMoveset` (weighted random or rule-based)
    - Return selected move as `{ move: Move }`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

   - [x]* 10.2 Write property test for monster-move returns valid move (P6)
    - **Property 6: Monster-move endpoint returns a move from the monster's moveset**
    - **Validates: Requirements 5.3, 6.2**
    - File: `supabase/functions/__tests__/monster-move.property.test.ts`

   - [x]* 10.3 Write property test for monster-move rejects malformed requests (P7)
    - **Property 7: Monster-move endpoint rejects malformed requests**
    - **Validates: Requirements 6.4**
    - File: `supabase/functions/__tests__/monster-move.property.test.ts`

- [x] 11. Checkpoint — Ensure all edge function tests pass
  - Run `vitest --run supabase/functions/__tests__/` and confirm all passing; ask the user if questions arise.

- [x] 12. KaPlay initialization and asset loading (`src/main.ts`)
  - Initialize KaPlay v4 with canvas settings
  - Load all 6 KaPlay Crew placeholder sprites: `bean`, `bobo`, `ghosty`, `wunky`, `dino`, `gigagantrum`
  - Register all scenes: `main-menu`, `run-overview`, `move-management`, `battle`, `post-battle`, `victory`, `defeat`
  - Start at `main-menu` scene
  - _Requirements: 1.1, 4.1_

- [x] 13. Main Menu scene (`src/scenes/mainMenu.ts`)
  - Render title text and "Start Run" / "Exit" buttons using KaPlay UI primitives
  - "Start Run": call `fetchRunConfig()`, on success call `initRunState()` and `go("run-overview")`; on failure show error overlay with "Retry" button
  - "Exit": close the window
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 14. Run Overview / Map scene (`src/scenes/runOverview.ts`)
  - Render 5 encounter nodes in order; highlight the current node (`currentMonsterIndex`)
  - Display hero's current level, XP progress bar, and active moveset cards
  - "Move Management" button transitions to `move-management` scene
  - Clicking the current encounter node transitions to `battle` scene
  - Persist hero state via `saveHeroRun` on scene entry
  - _Requirements: 3.1–3.6, 11.4_

- [x] 15. Battle scene (`src/scenes/battle.ts`)
  - [x] 15.1 Render hero sprite (`bean`) on the left and current monster sprite on the right; display HP bars for both
    - _Requirements: 4.1, 4.2_

  - [x] 15.2 Render the hero's 4 move cards at the bottom; implement hover-to-raise, click-to-expand, click-to-select interactions
    - Disable all cards and the End Turn button during the monster's turn
    - _Requirements: 4.3, 4.4, 4.5_

  - [x] 15.3 Implement the hero turn: on "End Turn" click, apply the selected move using `calcPhysicalDamage` / `calcMagicDamage` / `calcMagicHeal` / `applyEffect`, then call `fetchMonsterMove(battleState)`
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 15.4 Implement the monster turn: apply the returned monster move to the battle state; tick active effects via `tickEffects`; clamp HP to 0
    - _Requirements: 5.4, 5.5_

  - [x] 15.5 Implement win/loss detection: on monster HP = 0 call `awardXP` + `learnMove` then `go("post-battle")`; on hero HP = 0 `go("defeat")`
    - _Requirements: 5.6, 5.7, 14.1, 14.2_

   - [x]* 15.6 Write unit tests for scene transitions from battle
    - Test hero-wins path → post-battle transition
    - Test hero-loses path → defeat transition
    - File: `src/__tests__/scenes.unit.test.ts`
    - _Requirements: 5.6, 5.7_

- [x] 16. Post-Battle scene (`src/scenes/postBattle.ts`)
  - Display the randomly selected learned move name and description
  - Show XP gained and new total; show level-up notification if `checkLevelUp` triggered a level-up with stat deltas
  - "Continue" button: persist state via `saveHeroRun`, then `go("run-overview")`
  - If all 5 monsters defeated, `go("victory")` instead
  - _Requirements: 10.1–10.4, 11.3, 11.5, 14.1_

- [x] 17. Victory and Defeat scenes (`src/scenes/victory.ts`, `src/scenes/defeat.ts`)
  - Victory: display win message; mark run complete via `saveHeroRun` with `isComplete: true`; "Play Again" button resets to `main-menu`
  - Defeat: display loss message; "Retry" button calls `retryBattle(runState)` and `go("battle")`
  - _Requirements: 14.1, 14.2, 14.3_

- [x] 18. Move Management scene (`src/scenes/moveManagement.ts`)
  - Display all moves in `hero.movePool` and the 4 active moveset slots
  - Clicking a pool move then an active slot calls `swapMove`; prevent duplicate equipping
  - "Back" button returns to `run-overview`
  - _Requirements: 3.5, 3.6, 12.1–12.4_

- [x] 19. Checkpoint — Ensure all tests pass
  - Run `vitest --run` across the full test suite; ask the user if questions arise.
  - **All tests pass (64 passed, 2 skipped - integration tests skipped due to no local Supabase instance).**

- [ ] 20. Integration wiring and end-to-end validation
- [x] 20.1 Wire `RunState` through all scenes via KaPlay scene params so hero state flows correctly from `run-overview` → `battle` → `post-battle` → `run-overview`
    - _Requirements: 3.1, 5.7, 10.4_

  - [x] 20.2 Ensure `saveHeroRun` is called at every state-change point: battle won, move learned, level-up, run complete
    - _Requirements: 13.2, 13.3_

  - [x]* 20.3 Write integration tests for edge function endpoints
    - `GET /run-config`: verify 200, 5 monsters, 4 moves each, response within 500ms
    - `POST /monster-move`: verify 200 with valid move shape, response within 300ms
    - File: `supabase/functions/__tests__/integration.test.ts`
    - _Requirements: 2.4, 6.3_

- [x] 21. Final checkpoint — Ensure all tests pass
  - Run `vitest --run` and confirm the full suite is green; ask the user if questions arise.
  - **All tests pass (64 passed, 2 skipped - integration tests require running Supabase instance).**

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations each
- Tag each property test: `// Feature: rpg-gauntlet-game, Property N: <property_text>`
- KaPlay Crew sprites are placeholders — swap sprite keys when final assets are ready
- Supabase SDK write failures are non-blocking; gameplay continues from in-memory state
