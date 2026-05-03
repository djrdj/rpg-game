# Requirements Document

## Introduction

RPG Gauntlet is a full-stack 2D turn-based RPG where a knight fights through a gauntlet of 5 monsters. The player controls the knight, selects moves each turn, and the server drives monster AI and run configuration. After defeating a monster the knight can learn one of its moves. Enough XP triggers a level up, increasing stats. The game is built with KaPlay (frontend), Supabase Edge Functions (serverless backend logic), and Supabase (persistence).

## Glossary

- **Game**: The overall RPG Gauntlet application.
- **Client**: The KaPlay-based frontend running in the browser.
- **Server**: Supabase Edge Functions serving game logic endpoints.
- **Database**: The Supabase/PostgreSQL persistence layer.
- **Run**: A single playthrough consisting of 5 sequential monster encounters.
- **Hero**: The player-controlled knight character.
- **Monster**: A computer-controlled enemy character with fixed stats and a moveset.
- **Battle**: A single turn-based combat encounter between the Hero and one Monster.
- **Turn**: One round of combat in which the Hero selects a move and the Monster responds.
- **Move**: An action a character can perform during a Turn (damage, heal, buff, debuff).
- **Moveset**: The collection of Moves available to a character.
- **Physical_Move**: A Move whose damage scales off the user's Attack and is reduced by the target's Defense.
- **Magic_Move**: A Move whose damage or healing scales off the user's Magic stat and bypasses Defense.
- **Buff**: A temporary stat increase lasting a defined number of turns.
- **Debuff**: A temporary stat decrease lasting a defined number of turns.
- **XP**: Experience points awarded to the Hero after winning a Battle.
- **Level**: The Hero's current progression tier, starting at 1.
- **Level_Up**: The event triggered when the Hero's XP reaches the threshold for the next Level.
- **Stat**: One of four character attributes: Health, Attack, Defense, Magic.
- **Run_Config**: The server-side configuration object describing the 5 Monsters, their stats, and movesets for a Run.
- **Battle_State**: The current snapshot of a Battle including HP, active Buffs/Debuffs, and turn number, sent to the Server to determine the Monster's next Move.
- **Move_Pool**: The full collection of Moves the Hero has learned across all Battles in a Run.

---

## Requirements

### Requirement 1: Main Menu

**User Story:** As a player, I want a main menu, so that I can start a new run or exit the game.

#### Acceptance Criteria

1. THE Game SHALL display a Main Menu screen on launch containing a "Start Run" option and an "Exit" option.
2. WHEN the player selects "Start Run", THE Client SHALL request a Run_Config from the Server and transition to the Run Overview screen.
3. WHEN the player selects "Exit", THE Game SHALL close the application.

---

### Requirement 2: Run Configuration Endpoint

**User Story:** As the game designer, I want run configuration served from the server, so that monster stats and movesets can be tweaked without a client rebuild.

#### Acceptance Criteria

1. THE Server SHALL expose a `GET /functions/v1/run-config` Supabase Edge Function endpoint.
2. WHEN `GET /functions/v1/run-config` is called, THE Server SHALL return a Run_Config containing exactly 5 Monsters in encounter order, each with a name, stats (Health, Attack, Defense, Magic), and a Moveset of exactly 4 Moves.
3. THE Server SHALL define Monster stats such that each successive Monster is more difficult than the previous one (i.e., Monster 5 is harder than Monster 1).
4. WHEN `GET /functions/v1/run-config` is called, THE Server SHALL respond within 500ms under normal load.

---

### Requirement 3: Run Overview / Map Screen

**User Story:** As a player, I want to see all upcoming encounters on a map, so that I can plan my run and manage my moves before each battle.

#### Acceptance Criteria

1. WHEN a Run starts, THE Client SHALL display a Run Overview screen listing all 5 Monster encounters in order.
2. THE Client SHALL display each encounter node as selectable by the player.
3. WHEN the player clicks an encounter node, THE Client SHALL transition to the Battle screen for that encounter.
4. THE Client SHALL display the Hero's current equipped Moveset on the Run Overview screen.
5. THE Client SHALL provide a Move Management button on the Run Overview screen.
6. WHEN the player opens Move Management, THE Client SHALL display all Moves in the Hero's Move_Pool and allow the player to swap Moves in and out of the active Moveset.

---

### Requirement 4: Battle Screen Layout

**User Story:** As a player, I want a clear battle screen, so that I can see both characters and make informed decisions each turn.

#### Acceptance Criteria

1. THE Client SHALL display the Hero on the left side of the Battle screen and the Monster on the right side.
2. THE Client SHALL display the current HP of both the Hero and the Monster at all times during a Battle.
3. THE Client SHALL display the Hero's active Moveset as selectable move cards during the player's Turn.
4. THE Client SHALL display an "End Turn" button that the player clicks to submit their selected Move and end their Turn.
5. WHILE it is the Monster's Turn, THE Client SHALL disable move selection and the End Turn button.

---

### Requirement 5: Turn-Based Combat Flow

**User Story:** As a player, I want turn-based combat, so that I can strategically choose moves and react to the monster's actions.

#### Acceptance Criteria

1. THE Battle SHALL begin with the Hero's Turn.
2. WHEN the player selects a Move and clicks "End Turn", THE Client SHALL apply the Hero's Move to the Battle_State and send the Battle_State to the Server.
3. WHEN the Server receives the Battle_State, THE Server SHALL return the Monster's chosen Move via the monster-move Edge Function.
4. WHEN the Monster's Move is received, THE Client SHALL apply it to the Battle_State and display the result.
5. WHEN either the Hero's HP or the Monster's HP reaches 0, THE Battle SHALL end.
6. WHEN the Hero's HP reaches 0, THE Client SHALL display a defeat screen with an option to retry the same Battle.
7. WHEN the Monster's HP reaches 0, THE Client SHALL transition to the Post-Battle screen.

---

### Requirement 6: Monster Move Endpoint

**User Story:** As the game designer, I want monster AI served from the server, so that bot behavior can be updated without a client rebuild.

#### Acceptance Criteria

1. THE Server SHALL expose a `POST /functions/v1/monster-move` Supabase Edge Function endpoint.
2. WHEN `POST /functions/v1/monster-move` is called with the current Battle_State, THE Server SHALL return a valid Move from the Monster's Moveset.
3. THE Server SHALL respond within 300ms under normal load.
4. IF the Battle_State is malformed or missing required fields, THEN THE Server SHALL return a 400 status code with a descriptive error message.

---

### Requirement 7: Damage and Healing Calculation

**User Story:** As a player, I want moves to have meaningful stat interactions, so that building my hero's stats feels impactful.

#### Acceptance Criteria

1. WHEN a Physical_Move is applied, THE Game SHALL calculate damage as: `(base_value * attacker.Attack) - target.Defense`, with a minimum result of 1.
2. WHEN a Magic_Move that deals damage is applied, THE Game SHALL calculate damage as: `base_value * caster.Magic`, ignoring the target's Defense.
3. WHEN a Magic_Move that heals is applied, THE Game SHALL calculate healing as: `base_value * caster.Magic`, capped at the caster's maximum Health.
4. WHEN a Buff is applied, THE Game SHALL increase the target stat by the defined amount for the defined number of turns.
5. WHEN a Debuff is applied, THE Game SHALL decrease the target stat by the defined amount for the defined number of turns.
6. WHEN a Buff or Debuff expires, THE Game SHALL restore the affected stat to its pre-buff value.

---

### Requirement 8: Hero Default Moveset

**User Story:** As a player, I want the knight to start with a balanced default moveset, so that I can engage in combat immediately.

#### Acceptance Criteria

1. THE Hero SHALL begin every Run with the following 4 Moves equipped: Slash, Shield Up, Battle Cry, Second Wind.
2. WHEN Slash is used, THE Game SHALL apply a Physical_Move with moderate base damage scaling off the Hero's Attack, reduced by the Monster's Defense.
3. WHEN Shield Up is used, THE Game SHALL apply a Buff that raises the Hero's Defense for 2 turns with no damage.
4. WHEN Battle Cry is used, THE Game SHALL apply a Buff that raises the Hero's Attack for 2 turns with no damage.
5. WHEN Second Wind is used, THE Game SHALL apply a Magic_Move that heals the Hero for a moderate amount scaling off the Hero's Magic.

---

### Requirement 9: Monster Movesets

**User Story:** As a player, I want each monster to have a unique moveset, so that each encounter feels distinct and requires different strategy.

#### Acceptance Criteria

1. THE Server SHALL define the Witch with moves: Shadow Bolt (Magic_Move, heavy damage, scales off Magic), Curse (Debuff, lowers Hero's Attack for 2 turns), Drain Life (Magic_Move, light damage + heals Witch for same amount), Dark Pact (Buff, raises Witch's Magic for 2 turns at cost of some Witch HP).
2. THE Server SHALL define the Giant Spider with moves: Bite (Physical_Move, moderate damage), Web Throw (Physical_Move, light damage + Debuff lowering Hero's Defense for 2 turns), Pounce (Physical_Move, heavy damage), Skitter (Buff, raises Spider's Defense for 2 turns).
3. THE Server SHALL define the Dragon with moves: Flame Breath (Magic_Move, heavy damage), Claw Swipe (Physical_Move, moderate damage), Intimidate (Debuff, lowers target's Attack for 2 turns), Dragon Scales (Buff, raises Dragon's Defense for 2 turns).
4. THE Server SHALL define the Goblin Warrior with moves: Rusty Blade (Physical_Move, moderate damage), Dirty Kick (Physical_Move, light damage + Debuff lowering target's Defense for 2 turns), Frenzy (Buff, raises Goblin Warrior's Attack for 2 turns), Headbutt (Physical_Move, heavy damage).
5. THE Server SHALL define the Goblin Mage with moves: Firebolt (Magic_Move, moderate damage), Arcane Surge (Buff, raises Goblin Mage's Magic for 2 turns), Mana Drain (Magic_Move, light damage + Debuff lowering target's Magic for 2 turns), Hex Shield (Buff, raises Goblin Mage's Defense for 2 turns).

---

### Requirement 10: Post-Battle — Move Learning

**User Story:** As a player, I want to learn a move from each defeated monster, so that my hero grows more versatile over the run.

#### Acceptance Criteria

1. WHEN the Hero defeats a Monster, THE Client SHALL display the Post-Battle screen showing one Move selected at random from the defeated Monster's Moveset.
2. THE Client SHALL add the learned Move to the Hero's Move_Pool.
3. THE Client SHALL inform the player which Move was learned on the Post-Battle screen.
4. WHEN the player dismisses the Post-Battle screen, THE Client SHALL return to the Run Overview screen.

---

### Requirement 11: XP and Level Up

**User Story:** As a player, I want to earn XP and level up, so that my hero becomes stronger over the course of a run.

#### Acceptance Criteria

1. WHEN the Hero wins a Battle, THE Game SHALL award a defined amount of XP to the Hero.
2. WHEN the Hero's total XP meets or exceeds the threshold for the next Level, THE Game SHALL trigger a Level_Up.
3. WHEN a Level_Up occurs, THE Game SHALL increase the Hero's Attack, Defense, Health, and Magic stats by defined amounts.
4. THE Client SHALL display the Hero's current Level and XP progress on the Run Overview screen.
5. WHEN a Level_Up occurs, THE Client SHALL display a notification informing the player of the stat increases.

---

### Requirement 12: Move Management

**User Story:** As a player, I want to manage my equipped moves between battles, so that I can adapt my strategy for upcoming encounters.

#### Acceptance Criteria

1. THE Hero's active Moveset SHALL contain exactly 4 Moves at all times.
2. WHEN the player opens Move Management, THE Client SHALL display all Moves in the Move_Pool alongside the currently equipped Moveset.
3. WHEN the player selects a Move from the Move_Pool and a Move from the active Moveset to replace, THE Client SHALL swap the two Moves.
4. THE Client SHALL prevent the player from equipping the same Move more than once in the active Moveset.

---

### Requirement 13: Persistence via Supabase

**User Story:** As a player, I want my run progress saved, so that the game can track hero state across sessions.

#### Acceptance Criteria

1. THE Database SHALL store the Hero's current Level, XP, Stats, Move_Pool, and active Moveset for an active Run.
2. WHEN the Hero's state changes (Level_Up, Move learned, Battle won), THE Client SHALL persist the updated Hero state to the Database via the Supabase client SDK.
3. WHEN a Run is completed or abandoned, THE Client SHALL mark the Run as finished in the Database.

---

### Requirement 14: Win and Loss Conditions

**User Story:** As a player, I want clear win and loss conditions, so that I know when I've succeeded or failed.

#### Acceptance Criteria

1. WHEN the Hero defeats all 5 Monsters in a Run, THE Client SHALL display a victory screen.
2. WHEN the Hero's HP reaches 0 in a Battle, THE Client SHALL display a defeat screen for that Battle with an option to retry.
3. WHEN the player retries a Battle, THE Client SHALL reset the Battle_State to the start of that encounter while preserving the Hero's Level, Stats, Move_Pool, and active Moveset.
