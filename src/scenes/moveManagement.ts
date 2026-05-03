// Move Management scene — Task 18
import type { KAPLAYCtx } from "kaplay";
import { RunState, Hero } from "../types/index.js";
import { swapMove } from "../game/moveManager.js";
import { saveHeroRun } from "../db/persistence.js";
import { playBackgroundMusic } from "../main.js";

// ── Layout constants ─────────────────────────────────────────────────
const POOL_CARD_W = 140;
const POOL_CARD_H = 70;
const SLOT_CARD_W = 160;
const SLOT_CARD_H = 80;
const CARD_GAP = 12;

export function registerMoveManagementScene(k: KAPLAYCtx) {
  k.scene("move-management", (runState: RunState) => {
    playBackgroundMusic("menu-music");
    // Safety: ensure no duplicates between moveset and pool (Requirement 12.1)
    const activeIds = new Set(runState.hero.moveset.filter(m => m).map(m => m.id));
    const cleanPool = runState.hero.movePool.filter(m => !activeIds.has(m.id));
    
    let hero = { 
      ...runState.hero, 
      moveset: [...runState.hero.moveset] as [any, any, any, any], 
      movePool: cleanPool 
    };
    const cx = k.center().x;
    const H = k.height();

    // ── Info Box Logic ───────────────────────────────────────────────
    const infoBox = k.add([
      k.rect(460, 100, { radius: 12 }),
      k.pos(cx, H - 160),
      k.anchor("center"),
      k.color(15, 20, 35),
      k.outline(3, k.Color.fromHex("#4a5af7")),
      k.z(100),
    ]);
    infoBox.hidden = true;

    const infoTitle = infoBox.add([
      k.text("", { size: 18, font: "sans-serif" }),
      k.pos(0, -35),
      k.anchor("center"),
      k.color(255, 220, 100),
      k.z(101),
    ]);

    const infoContent = infoBox.add([
      k.text("", { size: 14, width: 420, align: "center", lineSpacing: 4 }),
      k.pos(0, 5),
      k.anchor("top"),
      k.color(210, 220, 240),
      k.z(101),
    ]);

    function buildMoveDescription(move: any): string {
      let desc = "";
      if (move.type === "physical") desc = `Physical attack (Base: ${move.baseValue})`;
      else if (move.type === "magic") desc = `Magic attack (Base: ${move.baseValue})`;
      else desc = `${move.type.charAt(0).toUpperCase() + move.type.slice(1)} effect`;
      
      if (move.effect) {
        desc += `\n${move.effect.kind}: ${move.effect.stat} ${move.effect.amount > 0 ? "+" : ""}${move.effect.amount} (${move.effect.turns} turns)`;
      }
      return desc;
    }

    function showInfo(title: string, content: string) {
      infoTitle.text = title;
      infoContent.text = content;
      infoBox.hidden = false;
    }

    function hideInfo() {
      infoBox.hidden = true;
    }

    // ── Background ───────────────────────────────────────────────────
    k.add([
      k.sprite("bg-dark-tower", { width: k.width(), height: k.height() }),
      k.pos(0, 0),
    ]);
    // Dark overlay for readability
    k.add([
      k.rect(k.width(), k.height()),
      k.pos(0, 0),
      k.color(0, 0, 0),
      k.opacity(0.6), // Heavier overlay since there's lots of text
    ]);

    // ── Title ────────────────────────────────────────────────────────
    k.add([
      k.text("Move Management", { size: 28 }),
      k.pos(cx, 30),
      k.anchor("center"),
      k.color(200, 220, 255),
    ]);

    let yOffset = 80;

    // ── Interaction State ───────────────────────────────────────────
    let selectedPoolMoveId: string | null = null;

    // ── Active Moveset slots (4 slots) ──────────────────────────────
    k.add([
      k.text("Active Moveset (4 slots)", { size: 18 }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(180, 255, 180),
    ]);
    yOffset += 30;

    const totalSlotsW = 4 * SLOT_CARD_W + 3 * CARD_GAP;
    const slotsStartX = cx - totalSlotsW / 2;

    // Create 4 slots
    for (let i = 0; i < 4; i++) {
      const cardX = slotsStartX + i * (SLOT_CARD_W + CARD_GAP);
      const baseY = yOffset;

      // Slot container (clickable area)
      const slot = k.add([
        k.rect(SLOT_CARD_W, SLOT_CARD_H, { radius: 6 }),
        k.pos(cardX, baseY),
        k.color(40, 50, 70),
        k.outline(2, k.Color.fromHex("#666666")),
        k.area(),
        k.cursor("pointer"),
      ]);

      const move = hero.moveset[i];
      if (move) {
        slot.color = k.Color.fromHex("#28503c");
        slot.outline = { width: 2, color: k.Color.fromHex("#88cc88") };

        slot.add([
          k.text(move.name, { size: 13, width: SLOT_CARD_W - 12, align: "center" }),
          k.pos(SLOT_CARD_W / 2, 18),
          k.anchor("center"),
          k.color(255, 255, 255),
        ]);

        slot.add([
          k.text(move.type.toUpperCase(), { size: 11 }),
          k.pos(SLOT_CARD_W / 2, 50),
          k.anchor("center"),
          k.color(180, 220, 255),
        ]);
      } else {
        slot.add([
          k.text("(empty)", { size: 14 }),
          k.pos(SLOT_CARD_W / 2, SLOT_CARD_H / 2),
          k.anchor("center"),
          k.color(100, 100, 100),
        ]);
      }
      
      if (move) {
        slot.onHover(() => showInfo(move.name, buildMoveDescription(move)));
        slot.onHoverEnd(hideInfo);
      }

      slot.onClick(() => {
        if (selectedPoolMoveId) {
          performSwap(selectedPoolMoveId, i);
          selectedPoolMoveId = null;
        } else if (move) {
          // Visual feedback when clicking occupied slot
          slot.outline = { width: 3, color: k.Color.fromHex("#ffdd44") };
          k.wait(0.3, () => {
            slot.outline = { width: 2, color: k.Color.fromHex("#88cc88") };
          });
        }
      });
    }

    yOffset += SLOT_CARD_H + 30;

    // ── Move Pool (all learned moves) ───────────────────────────────
    k.add([
      k.text("Move Pool", { size: 18 }),
      k.pos(cx, yOffset),
      k.anchor("center"),
      k.color(180, 200, 255),
    ]);
    yOffset += 30;

    // Pool moves — click to select, then click a slot to swap
    const poolCards: any[] = [];
    const poolStartX = cx - 300; // fixed width area

    hero.movePool.forEach((move, i) => {
      const cardX = poolStartX + (i % 4) * (POOL_CARD_W + CARD_GAP);
      const cardY = yOffset + Math.floor(i / 4) * (POOL_CARD_H + CARD_GAP);

      const card = k.add([
        k.rect(POOL_CARD_W, POOL_CARD_H, { radius: 6 }),
        k.pos(cardX, cardY),
        k.color(50, 50, 80),
        k.outline(1, k.Color.fromHex("#666666")),
        k.area(),
        k.cursor("pointer"),
      ]);

      card.add([
        k.text(move.name, { size: 12, width: POOL_CARD_W - 12, align: "center" }),
        k.pos(POOL_CARD_W / 2, 18),
        k.anchor("center"),
        k.color(255, 255, 255),
      ]);

      card.add([
        k.text(move.type.toUpperCase(), { size: 10 }),
        k.pos(POOL_CARD_W / 2, 45),
        k.anchor("center"),
        k.color(180, 220, 255),
      ]);

      card.onHover(() => showInfo(move.name, buildMoveDescription(move)));
      card.onHoverEnd(hideInfo);

      card.onClick(() => {
        selectedPoolMoveId = move.id;
        poolCards.forEach(c => c.outline = { width: 1, color: k.Color.fromHex("#666666") });
        card.outline = { width: 3, color: k.Color.fromHex("#ffdd44") };
      });

      poolCards.push(card);
    });

    // ── Helper: perform swap ────────────────────────────────────────
    function performSwap(poolMoveId: string, activeSlotIndex: number) {
      const updatedHero = swapMove(hero, poolMoveId, activeSlotIndex);

      // Check if anything changed
      if (updatedHero === hero) {
        // Swap rejected (invalid) — show brief feedback
        k.add([
          k.text("Invalid swap!", { size: 16 }),
          k.pos(cx, H - 120),
          k.anchor("center"),
          k.color(255, 80, 80),
          k.opacity(1),
          k.lifespan(1.5, { fade: 0.5 }),
        ]);
        return;
      }

      hero = updatedHero;

      // Update RunState
      const updatedRunState: RunState = { ...runState, hero };

      // Persist the change
      saveHeroRun(updatedRunState).catch((err) =>
        console.error("[move-management] saveHeroRun error:", err)
      );

      // Re-render: go back and return to refresh
      k.go("move-management", updatedRunState);
    }

    // ── Instructions text ──────────────────────────────────────────
    k.add([
      k.text("Click a move from the pool, then click an active slot to swap.", { size: 13, width: 500, align: "center" }),
      k.pos(cx, H - 100),
      k.anchor("center"),
      k.color(150, 150, 180),
    ]);

    // ── Back button ────────────────────────────────────────────────
    const backBtn = k.add([
      k.rect(180, 48, { radius: 8 }),
      k.pos(cx, H - 50),
      k.anchor("center"),
      k.color(80, 80, 140),
      k.area(),
      k.cursor("pointer"),
    ]);
    backBtn.add([
      k.text("Back to Overview", { size: 18 }),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);

    backBtn.onClick(() => {
      const updatedRunState: RunState = { ...runState, hero };
      k.go("run-overview", updatedRunState);
    });
  });
}
