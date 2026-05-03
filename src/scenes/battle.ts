// Battle scene — Task 15
import type { KAPLAYCtx } from "kaplay";
import type { RunState, Move, ActiveEffect, Stats } from "../types/index.js";
import {
  calcPhysicalDamage,
  calcMagicDamage,
  calcMagicHeal,
  applyEffect,
  tickEffects,
} from "../game/combat.js";
import { awardXP, learnMove } from "../game/heroState.js";
import { fetchMonsterMove } from "../api/monsterMove.js";
import { playBackgroundMusic } from "../main.js";

// ── Sprite key mapping ───────────────────────────────────────────────────────
const MONSTER_SPRITE: Record<string, string> = {
  "goblin-warrior": "goblin-warrior",
  "giant-spider": "giant-spider",
  witch: "witch",
  dragon: "dragon",
  "goblin-mage": "goblin-mage",
};

// ── Background mapping ───────────────────────────────────────────────────────
const MONSTER_BG: Record<string, string> = {
  "goblin-warrior": "bg-goblin-forest",
  "giant-spider": "bg-spider-cave",
  witch: "bg-witch-swamp",
  dragon: "bg-dragon-lair",
  "goblin-mage": "bg-dark-tower",
};

// ── Layout constants ─────────────────────────────────────────────────────────
const HERO_X = 180;
const HERO_Y = 260;
const MONSTER_X = 620;
const MONSTER_Y = 260;
const HP_BAR_W = 160;
const HP_BAR_H = 16;
const CARD_W = 160;
const CARD_H = 80;
const CARD_Y = 460;
const CARD_HOVER_OFFSET = 12;

export function registerBattleScene(k: KAPLAYCtx) {
  k.scene("battle", (runState: RunState) => {
    playBackgroundMusic("battle-music", 0.4);

    // ── Mutable battle state ─────────────────────────────────────────────────
    // Reset hero HP to max and clear active effects at start of each battle
    let hero = {
      ...runState.hero,
      currentStats: { ...runState.hero.baseStats },
      activeEffects: [],
    };
    const monster = runState.runConfig.monsters[runState.currentMonsterIndex];
    let monsterHP = monster.baseStats.health;
    let heroHP = hero.currentStats.maxHealth;
    let monsterActiveEffects: ActiveEffect[] = [];
    let heroActiveEffects: ActiveEffect[] = [];
    let monsterCurrentStats: Stats = { ...monster.baseStats };
    let heroCurrentStats: Stats = { ...hero.currentStats };
    let turnNumber = 1;
    let selectedMoveIndex = 0;
    let isMonsterTurn = false;

    // ── Battle log state ─────────────────────────────────────────────────────
    const battleLog: string[] = [];

    const monsterSpriteKey = MONSTER_SPRITE[monster.id] ?? "bobo";
    const bgKey = MONSTER_BG[monster.id] ?? "bg-goblin-forest";

    // ── Themed Background ─────────────────────────────────────────────────────
    k.add([
      k.sprite(bgKey, { width: k.width(), height: k.height() }),
      k.pos(0, 0),
    ]);
    // Dark overlay for readability
    k.add([
      k.rect(k.width(), k.height()),
      k.pos(0, 0),
      k.color(0, 0, 0),
      k.opacity(0.35),
    ]);

    // ── Turn label ───────────────────────────────────────────────────────────
    k.add([
      k.rect(200, 36, { radius: 18 }),
      k.pos(k.center().x, 22),
      k.anchor("center"),
      k.color(0, 0, 0),
      k.opacity(0.6),
    ]);
    const turnLabel = k.add([
      k.text("Your Turn", { size: 20 }),
      k.pos(k.center().x, 22),
      k.anchor("center"),
      k.color(120, 255, 180),
    ]);

    // ── Battle Log UI ────────────────────────────────────────────────────────
    const logBox = k.add([
      k.rect(300, 100, { radius: 8 }),
      k.pos(k.width() - 310, 10),
      k.color(10, 10, 20),
      k.opacity(0.7),
      k.outline(2, k.Color.fromHex("#3a3a5a")),
    ]);

    const logText = logBox.add([
      k.text("", { size: 12, width: 280, lineSpacing: 4 }),
      k.pos(10, 10),
      k.color(200, 200, 200),
    ]);

    function addToLog(msg: string) {
      battleLog.push(msg);
      if (battleLog.length > 5) battleLog.shift();
      logText.text = battleLog.join("\n");
    }

    // ── Floating Numbers Helper ──────────────────────────────────────────────
    function showPopup(pos: any, text: string, color: any) {
      const p = k.add([
        k.text(text, { size: 20 }),
        k.pos(pos.x, pos.y - 40),
        k.anchor("center"),
        k.color(color),
        k.move(k.UP, 40),
        k.opacity(1),
      ]);
      p.onUpdate(() => {
        p.opacity -= k.dt() * 1.5;
        if (p.opacity <= 0) p.destroy();
      });
    }

    function animateShake(obj: any) {
      const startPos = obj.pos.clone();
      let elapsed = 0;
      const shakeDuration = 0.3; // 300ms
      const shakeSpeed = 60; // How fast it vibrates
      const shakeAmplitude = 12; // How far it moves

      const ev = obj.onUpdate(() => {
        elapsed += k.dt();
        if (elapsed >= shakeDuration) {
          obj.pos.x = startPos.x;
          ev.cancel();
        } else {
          obj.pos.x = startPos.x + Math.sin(elapsed * shakeSpeed) * shakeAmplitude;
        }
      });
    }

    function animateAttack(attacker: any, target: any, onHit: () => void) {
      const startPos = attacker.pos.clone();
      const targetPos = target.pos.clone();
      // Move closer but not exactly on top
      const offset = attacker === heroSprite ? -60 : 60;
      const attackPos = k.vec2(targetPos.x + offset, targetPos.y);

      k.tween(
        startPos,
        attackPos,
        0.2,
        (val) => attacker.pos = val,
        k.easings.easeOutQuad
      ).then(() => {
        onHit();
        animateShake(target);
        k.tween(
          attacker.pos,
          startPos,
          0.2,
          (val) => attacker.pos = val,
          k.easings.easeInQuad
        );
      });
    }

    // ── Hero sprite (15.1) ───────────────────────────────────────────────────
    const heroSprite = k.add([
      k.sprite("knight"),
      k.pos(HERO_X, HERO_Y),
      k.anchor("center"),
      k.scale(3.5),
    ]);

    // ── Monster sprite (15.1) ────────────────────────────────────────────────
    const monsterSprite = k.add([
      k.sprite(monsterSpriteKey),
      k.pos(MONSTER_X, MONSTER_Y),
      k.anchor("center"),
      k.scale(3.5),
      k.area(),
    ]);

    monsterSprite.onHover(() => {
      const moveDetails = monster.moveset.map(m => `• ${m.name}: ${buildMoveDescription(m)}`).join("\n");
      showInfo(`${monster.name}'s Moveset`, moveDetails, true);
    });
    monsterSprite.onHoverEnd(hideInfo);

    // ── Monster name label ───────────────────────────────────────────────────
    k.add([
      k.rect(180, 28, { radius: 14 }),
      k.pos(MONSTER_X, MONSTER_Y - 100),
      k.anchor("center"),
      k.color(0, 0, 0),
      k.opacity(0.5),
    ]);
    k.add([
      k.text(monster.name, { size: 18 }),
      k.pos(MONSTER_X, MONSTER_Y - 100),
      k.anchor("center"),
      k.color(255, 200, 80),
    ]);

    // ── Hero name label ─────────────────────────────────────────────────────
    k.add([
      k.rect(120, 28, { radius: 14 }),
      k.pos(HERO_X, HERO_Y - 100),
      k.anchor("center"),
      k.color(0, 0, 0),
      k.opacity(0.5),
    ]);
    k.add([
      k.text("Hero", { size: 18 }),
      k.pos(HERO_X, HERO_Y - 100),
      k.anchor("center"),
      k.color(100, 200, 255),
    ]);

    // ── HP bars (15.1) ───────────────────────────────────────────────────────
    // Hero HP bar background
    k.add([
      k.rect(HP_BAR_W, HP_BAR_H, { radius: 8 }),
      k.pos(HERO_X - HP_BAR_W / 2, HERO_Y + 80),
      k.color(40, 15, 15),
      k.outline(2, k.Color.fromHex("#333333")),
    ]);
    const heroHPBar = k.add([
      k.rect(HP_BAR_W, HP_BAR_H, { radius: 8 }),
      k.pos(HERO_X - HP_BAR_W / 2, HERO_Y + 80),
      k.color(80, 220, 100),
    ]);
    const heroHPText = k.add([
      k.text(`HP: ${heroHP}/${heroCurrentStats.maxHealth}`, { size: 14 }),
      k.pos(HERO_X, HERO_Y + 102),
      k.anchor("center"),
      k.color(180, 255, 200),
    ]);

    // Monster HP bar background
    k.add([
      k.rect(HP_BAR_W, HP_BAR_H, { radius: 8 }),
      k.pos(MONSTER_X - HP_BAR_W / 2, MONSTER_Y + 80),
      k.color(40, 15, 15),
      k.outline(2, k.Color.fromHex("#333333")),
    ]);
    const monsterHPBar = k.add([
      k.rect(HP_BAR_W, HP_BAR_H, { radius: 8 }),
      k.pos(MONSTER_X - HP_BAR_W / 2, MONSTER_Y + 80),
      k.color(220, 80, 80),
    ]);
    const monsterHPText = k.add([
      k.text(`HP: ${monsterHP}/${monsterCurrentStats.maxHealth}`, { size: 14 }),
      k.pos(MONSTER_X, MONSTER_Y + 102),
      k.anchor("center"),
      k.color(255, 180, 180),
    ]);

    // Stat labels (3.3)
    const heroStatsText = k.add([
      k.text(`ATK: ${heroCurrentStats.attack} DEF: ${heroCurrentStats.defense} MAG: ${heroCurrentStats.magic}`, { size: 11 }),
      k.pos(HERO_X, HERO_Y + 120),
      k.anchor("center"),
      k.color(180, 190, 210),
    ]);

    const monsterStatsText = k.add([
      k.text(`ATK: ${monsterCurrentStats.attack} DEF: ${monsterCurrentStats.defense} MAG: ${monsterCurrentStats.magic}`, { size: 11 }),
      k.pos(MONSTER_X, MONSTER_Y + 120),
      k.anchor("center"),
      k.color(180, 190, 210),
    ]);

    // Active effect labels (3.2)
    const heroEffectsLabel = k.add([
      k.text("", { size: 11 }),
      k.pos(HERO_X, HERO_Y - 120),
      k.anchor("center"),
      k.color(120, 255, 160),
    ]);

    const monsterEffectsLabel = k.add([
      k.text("", { size: 11 }),
      k.pos(MONSTER_X, MONSTER_Y - 120),
      k.anchor("center"),
      k.color(255, 120, 120),
    ]);

    // ── Information Box (Central Tooltip) ──────────────────────────────────
    const infoBox = k.add([
      k.rect(460, 100, { radius: 12 }),
      k.pos(k.center().x, 340),
      k.anchor("center"),
      k.color(15, 20, 35),
      k.outline(3, k.Color.fromHex("#4a5af7")),
      k.z(100),
    ]);
    infoBox.hidden = true;

    const infoTitle = infoBox.add([
      k.text("", { size: 18, font: "sans-serif" }),
      k.pos(0, 0), // Will be set dynamically
      k.anchor("center"),
      k.color(255, 220, 100),
      k.z(101),
    ]);

    const infoContent = infoBox.add([
      k.text("", { size: 14, width: 420, align: "center", lineSpacing: 4 }),
      k.pos(0, 0), // Will be set dynamically
      k.anchor("top"),
      k.color(210, 220, 240),
      k.z(101),
    ]);

    function buildMoveDescription(move: Move): string {
      let desc = "";
      if (move.type === "physical") desc = `Physical attack (Base: ${move.baseValue})`;
      else if (move.type === "magic") desc = `Magic attack (Base: ${move.baseValue})`;
      else desc = `${move.type.charAt(0).toUpperCase() + move.type.slice(1)} effect`;
      
      if (move.effect) {
        desc += `\n${move.effect.kind}: ${move.effect.stat} ${move.effect.amount > 0 ? "+" : ""}${move.effect.amount} (${move.effect.turns} turns)`;
      }
      return desc;
    }

    function showInfo(title: string, content: string, isMonster: boolean = false) {
      infoTitle.text = title;
      infoContent.text = content;
      
      const h = isMonster ? 250 : 100;
      infoBox.width = isMonster ? 520 : 460;
      infoBox.height = h;
      infoBox.pos.y = 300; // Keep it fixed in the middle
      
      // Center text within the box
      infoTitle.pos.y = -(h / 2) + 30;
      infoContent.pos.y = -(h / 2) + 60;
      
      infoBox.hidden = false;
    }

    function hideInfo() {
      infoBox.hidden = true;
    }

    // ── HP bar update helper ─────────────────────────────────────────────────
    function refreshHPBars() {
      const heroRatio = Math.max(0, heroHP) / heroCurrentStats.maxHealth;
      heroHPBar.width = HP_BAR_W * heroRatio;
      heroHPText.text = `HP: ${Math.max(0, heroHP)}/${heroCurrentStats.maxHealth}`;

      const monsterRatio = Math.max(0, monsterHP) / monsterCurrentStats.maxHealth;
      monsterHPBar.width = HP_BAR_W * monsterRatio;
      monsterHPText.text = `HP: ${Math.max(0, monsterHP)}/${monsterCurrentStats.maxHealth}`;

      // Update stats text
      heroStatsText.text = `ATK: ${heroCurrentStats.attack} DEF: ${heroCurrentStats.defense} MAG: ${heroCurrentStats.magic}`;
      monsterStatsText.text = `ATK: ${monsterCurrentStats.attack} DEF: ${monsterCurrentStats.defense} MAG: ${monsterCurrentStats.magic}`;

      // Update active effects text
      heroEffectsLabel.text = heroActiveEffects.map(e => `${e.stat} ${e.delta > 0 ? "+" : ""}${e.delta} (${e.turnsRemaining}T)`).join(", ");
      monsterEffectsLabel.text = monsterActiveEffects.map(e => `${e.stat} ${e.delta > 0 ? "+" : ""}${e.delta} (${e.turnsRemaining}T)`).join(", ");
    }

    // ── Move cards (15.2) ────────────────────────────────────────────────────
    const totalCardsW = hero.moveset.length * CARD_W + (hero.moveset.length - 1) * 16;
    const cardsStartX = k.center().x - totalCardsW / 2;

    const cardObjects: ReturnType<typeof k.add>[] = [];
    const cardBaseY: number[] = [];

    hero.moveset.forEach((move, i) => {
      const cardX = cardsStartX + i * (CARD_W + 16);
      const baseY = CARD_Y;
      cardBaseY.push(baseY);

      const isSelected = i === selectedMoveIndex;
      const card = k.add([
        k.rect(CARD_W, CARD_H, { radius: 12 }),
        k.pos(cardX, baseY),
        k.color(isSelected ? 30 : 20, isSelected ? 40 : 25, isSelected ? 70 : 35),
        k.opacity(0.85),
        k.area(),
        k.cursor("pointer"),
        k.outline(isSelected ? 3 : 2, k.Color.fromHex(isSelected ? "#ffdd44" : "#4a5af7")),
      ]);

      card.add([
        k.text(move.name, { size: 15, width: CARD_W - 16, align: "center" }),
        k.pos(CARD_W / 2, 22),
        k.anchor("center"),
        k.color(255, 255, 255),
      ]);

      card.add([
        k.text(move.type.toUpperCase(), { size: 11 }),
        k.pos(CARD_W / 2, 54),
        k.anchor("center"),
        k.color(isSelected ? 200 : 150, isSelected ? 220 : 180, isSelected ? 255 : 220),
      ]);

      // Hover-to-raise (15.2)
      card.onHover(() => {
        if (!isMonsterTurn) {
          card.pos.y = baseY - CARD_HOVER_OFFSET;
          showInfo(move.name, buildMoveDescription(move), false);
        }
      });
      card.onHoverEnd(() => {
        card.pos.y = baseY;
        hideInfo();
      });

      // Click-to-select (15.2)
      card.onClick(() => {
        if (isMonsterTurn) return;
        selectedMoveIndex = i;
        refreshCards();
      });

      cardObjects.push(card);
    });

    function refreshCards() {
      hero.moveset.forEach((move, i) => {
        const card = cardObjects[i] as any;
        const isSelected = i === selectedMoveIndex;
        card.color = k.Color.fromArray(
          isSelected ? [30, 40, 70] : [20, 25, 35]
        );
        card.outline = { width: isSelected ? 3 : 2, color: k.Color.fromHex(isSelected ? "#ffdd44" : "#4a5af7") };
      });
    }

    function setCardsEnabled(enabled: boolean) {
      cardObjects.forEach((c) => {
        const card = c as any;
        card.color = enabled
          ? k.Color.fromArray([20, 25, 35])
          : k.Color.fromArray([15, 15, 20]);
        if (!enabled) card.outline = { width: 1, color: k.Color.fromHex("#333333") };
      });
      // Re-apply selection highlight if enabling
      if (enabled) refreshCards();
    }

    // ── End Turn button (15.2, 15.3) ─────────────────────────────────────────
    const endTurnBtn = k.add([
      k.rect(160, 52, { radius: 12 }),
      k.pos(k.center().x, CARD_Y + CARD_H + 28),
      k.anchor("center"),
      k.color(40, 160, 80),
      k.area(),
      k.cursor("pointer"),
      k.outline(2, k.Color.fromHex("#88ffaa")),
    ]);
    endTurnBtn.add([
      k.text("End Turn", { size: 20 }),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);

    // ── Error overlay helper ─────────────────────────────────────────────────
    function showErrorOverlay(onRetry: () => void) {
      const overlay = k.add([
        k.rect(k.width(), k.height()),
        k.pos(0, 0),
        k.color(0, 0, 0),
        k.opacity(0.8),
        k.z(20),
      ]);
      const errMsg = k.add([
        k.text("Failed to get monster move.\nPlease retry.", { size: 20, align: "center" }),
        k.pos(k.center().x, k.center().y - 40),
        k.anchor("center"),
        k.color(255, 80, 80),
        k.z(21),
      ]);
      const retryBtn = k.add([
        k.rect(160, 48, { radius: 8 }),
        k.pos(k.center().x, k.center().y + 30),
        k.anchor("center"),
        k.color(60, 120, 200),
        k.area(),
        k.cursor("pointer"),
        k.z(21),
      ]);
      retryBtn.add([
        k.text("Retry Turn", { size: 18 }),
        k.anchor("center"),
        k.color(255, 255, 255),
      ]);
      retryBtn.onClick(() => {
        overlay.destroy();
        errMsg.destroy();
        retryBtn.destroy();
        onRetry();
      });
    }

    // ── Win/loss check (15.5) ────────────────────────────────────────────────
    function checkWinLoss() {
      if (monsterHP <= 0) {
        monsterHP = 0;
        refreshHPBars();
        k.play("enemy-death");
        // Award XP and learn a move
        const updatedHero = awardXP(hero, runState.currentMonsterIndex);
        const randomMove = monster.moveset[Math.floor(Math.random() * monster.moveset.length)];
        const heroWithMove = learnMove(updatedHero, randomMove);
        const updatedRunState: RunState = {
          ...runState,
          hero: heroWithMove,
          currentMonsterIndex: runState.currentMonsterIndex,
        };
        k.go("post-battle", updatedRunState, randomMove);
        return true;
      }
      if (heroHP <= 0) {
        heroHP = 0;
        refreshHPBars();
        k.play("player-death");
        k.go("defeat", runState);
        return true;
      }
      return false;
    }

    // ── Apply a move effect helper ───────────────────────────────────────────
    function buildActiveEffect(effect: NonNullable<Move["effect"]>): ActiveEffect {
      return {
        stat: effect.stat,
        delta: effect.kind === "debuff" ? -effect.amount : effect.amount,
        turnsRemaining: effect.turns,
        originalValue: 0, // will be set by applyEffect caller
        appliedTurn: turnNumber,
      };
    }

    // ── Hero turn logic (15.3) ───────────────────────────────────────────────
    async function doMonsterTurn(monsterMove: Move) {
      isMonsterTurn = true;
      setCardsEnabled(false);
      endTurnBtn.color = k.Color.fromArray([60, 60, 60]);
      turnLabel.text = "Monster's Turn";
      let damageDealt = 0;

      const performAction = () => {
        // 1. Apply Move Damage/Heal
        if (monsterMove.type === "physical") {
          damageDealt = calcPhysicalDamage(monsterMove.baseValue, monsterCurrentStats.attack, heroCurrentStats.defense);
          heroHP = Math.max(0, heroHP - damageDealt);
          showPopup(k.vec2(HERO_X, HERO_Y), `-${damageDealt}`, k.RED);
          k.play("player-damage");
        } else if (monsterMove.type === "magic") {
          damageDealt = calcMagicDamage(monsterMove.baseValue, monsterCurrentStats.magic);
          heroHP = Math.max(0, heroHP - damageDealt);
          showPopup(k.vec2(HERO_X, HERO_Y), `-${damageDealt}`, k.MAGENTA);
          k.play("player-damage");
        }

        // 2. Apply Move Effect (Buff, Debuff, Drain, Cost)
        if (monsterMove.effect) {
          const effect = monsterMove.effect;
          if (effect.kind === "buff") {
            const ae = buildActiveEffect(effect);
            ae.originalValue = monsterCurrentStats[effect.stat];
            monsterCurrentStats = applyEffect(monsterCurrentStats, ae);
            monsterActiveEffects = [...monsterActiveEffects, ae];
            addToLog(`${monster.name} buffed ${effect.stat}`);
            k.play("buff");
          } else if (effect.kind === "debuff") {
            const ae = buildActiveEffect(effect);
            ae.originalValue = heroCurrentStats[effect.stat];
            heroCurrentStats = applyEffect(heroCurrentStats, ae);
            heroActiveEffects = [...heroActiveEffects, ae];
            addToLog(`${monster.name} debuffed your ${effect.stat}`);
            k.play("buff");
          } else if (effect.kind === "drain") {
            monsterHP = Math.min(monsterCurrentStats.maxHealth, monsterHP + damageDealt);
            showPopup(k.vec2(MONSTER_X, MONSTER_Y), `+${damageDealt}`, k.GREEN);
          }
        }
      };

      if (monsterMove.type === "physical" || monsterMove.type === "magic") {
        animateAttack(monsterSprite, heroSprite, performAction);
        await k.wait(0.4); // Wait for animation to cycle back mostly
      } else {
        performAction();
      }

      // Handle special moves with HP costs (e.g., Dark Pact)
      if (monsterMove.id === "dark-pact") {
        monsterHP = Math.max(0, monsterHP - 15);
        showPopup(k.vec2(MONSTER_X, MONSTER_Y), `-15`, k.RED);
        addToLog(`Dark Pact cost ${monster.name} 15 HP`);
      }

      heroHP = Math.max(0, heroHP);
      monsterHP = Math.max(0, monsterHP);
      refreshHPBars();

      if (checkWinLoss()) return;

      // Small delay before returning control
      await k.wait(0.5);

      isMonsterTurn = false;
      setCardsEnabled(true);
      endTurnBtn.color = k.Color.fromArray([60, 160, 80]);
      turnLabel.text = "Your Turn";
      turnNumber++;
      
      // TICK PLAYER EFFECTS AT START OF NEW TURN
      const heroTick = tickEffects(heroActiveEffects, turnNumber);
      heroActiveEffects = heroTick.active;
      for (const expired of heroTick.expired) {
        heroCurrentStats = { ...heroCurrentStats, [expired.stat]: expired.originalValue };
        addToLog(`Your ${expired.stat} effect expired`);
      }
      refreshHPBars();
    }

    async function executeMonsterTurn() {
      // TICK MONSTER EFFECTS AT START OF MONSTER TURN
      const monsterTick = tickEffects(monsterActiveEffects, turnNumber);
      monsterActiveEffects = monsterTick.active;
      for (const expired of monsterTick.expired) {
        monsterCurrentStats = { ...monsterCurrentStats, [expired.stat]: expired.originalValue };
        addToLog(`${monster.name}'s ${expired.stat} effect expired`);
      }
      refreshHPBars();

      const battleState = {
        monsterId: monster.id,
        monsterStats: monsterCurrentStats,
        monsterMoveset: monster.moveset as Move[],
        heroStats: heroCurrentStats,
        activeBuffs: heroActiveEffects,
        turnNumber,
      };

      try {
        const monsterMove = await fetchMonsterMove(battleState);
        await doMonsterTurn(monsterMove);
      } catch {
        showErrorOverlay(() => executeMonsterTurn());
      }
    }

    endTurnBtn.onClick(async () => {
      if (isMonsterTurn) return;

      isMonsterTurn = true;
      setCardsEnabled(false);
      endTurnBtn.color = k.Color.fromArray([60, 60, 60]);

      const move = hero.moveset[selectedMoveIndex];
      let damageDealt = 0;
      addToLog(`You used ${move.name}`);

      const performHeroAction = () => {
        // 1. Apply Damage/Heal
        if (move.type === "physical") {
          damageDealt = calcPhysicalDamage(move.baseValue, heroCurrentStats.attack, monsterCurrentStats.defense);
          monsterHP = Math.max(0, monsterHP - damageDealt);
          showPopup(k.vec2(MONSTER_X, MONSTER_Y), `-${damageDealt}`, k.RED);
          k.play("enemy-damage");
        } else if (move.type === "magic") {
          if (move.id === "second-wind") {
            const heal = calcMagicHeal(move.baseValue, heroCurrentStats.magic, heroHP, heroCurrentStats.maxHealth) - heroHP;
            heroHP += heal;
            showPopup(k.vec2(HERO_X, HERO_Y), `+${heal}`, k.GREEN);
          } else {
            damageDealt = calcMagicDamage(move.baseValue, heroCurrentStats.magic);
            monsterHP = Math.max(0, monsterHP - damageDealt);
            showPopup(k.vec2(MONSTER_X, MONSTER_Y), `-${damageDealt}`, k.MAGENTA);
            k.play("enemy-damage");
          }
        }

        // 2. Apply Effect
        if (move.effect) {
          const effect = move.effect;
          if (effect.kind === "buff") {
            const ae = buildActiveEffect(effect);
            ae.originalValue = heroCurrentStats[effect.stat];
            heroCurrentStats = applyEffect(heroCurrentStats, ae);
            heroActiveEffects = [...heroActiveEffects, ae];
            addToLog(`You buffed your ${effect.stat}`);
            k.play("buff");
          } else if (effect.kind === "debuff") {
            const ae = buildActiveEffect(effect);
            ae.originalValue = monsterCurrentStats[effect.stat];
            monsterCurrentStats = applyEffect(monsterCurrentStats, ae);
            monsterActiveEffects = [...monsterActiveEffects, ae];
            addToLog(`You debuffed ${monster.name}'s ${effect.stat}`);
            k.play("buff");
          } else if (effect.kind === "drain") {
            heroHP = Math.min(heroCurrentStats.maxHealth, heroHP + damageDealt);
            showPopup(k.vec2(HERO_X, HERO_Y), `+${damageDealt}`, k.GREEN);
          }
        }
      };

      if (move.type === "physical" || (move.type === "magic" && move.id !== "second-wind")) {
        animateAttack(heroSprite, monsterSprite, performHeroAction);
        await k.wait(0.4);
      } else {
        performHeroAction();
      }

      refreshHPBars();

      if (checkWinLoss()) return;

      // Small delay before monster acts
      await k.wait(0.8);
      await executeMonsterTurn();
    });

    // Initial HP bar render
    refreshHPBars();
  });
}
