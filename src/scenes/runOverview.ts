// Run Overview / Map scene — Task 14
import type { KAPLAYCtx } from "kaplay";
import { RunState } from "../types/index.js";
import { saveHeroRun } from "../db/persistence.js";
import { playBackgroundMusic } from "../main.js";

export function registerRunOverviewScene(k: KAPLAYCtx) {
  k.scene("run-overview", (runState: RunState) => {
    playBackgroundMusic("menu-music");
    // Save run state on scene entry (non-blocking)
    saveHeroRun(runState).catch((err) =>
      console.error("[run-overview] saveHeroRun error:", err)
    );

    const cx = k.center().x;
    const W = k.width();
    const H = k.height();

    // ── Background ───────────────────────────────────────────────────────────
    k.add([
      k.sprite("bg-main-menu", { width: k.width(), height: k.height() }),
      k.pos(0, 0),
    ]);
    k.add([
      k.rect(k.width(), k.height()),
      k.pos(0, 0),
      k.color(0, 0, 0),
      k.opacity(0.65), // Heavy dark overlay for map readability
    ]);

    // ── Title ────────────────────────────────────────────────────────────────
    k.add([
      k.text("Run Overview", { size: 42, font: "sans-serif" }),
      k.pos(cx + 2, 42),
      k.anchor("center"),
      k.color(0, 0, 0),
      k.opacity(0.8),
    ]);
    k.add([
      k.text("Run Overview", { size: 42, font: "sans-serif" }),
      k.pos(cx, 40),
      k.anchor("center"),
      k.color(255, 215, 0),
    ]);

    // ── Hero Info Card ───────────────────────────────────────────────────────
    k.add([
      k.rect(600, 110, { radius: 12 }),
      k.pos(cx, 130),
      k.anchor("center"),
      k.color(15, 20, 35),
      k.opacity(0.8),
      k.outline(2, k.Color.fromHex("#4a5af7")),
    ]);

    const { hero } = runState;
    const xpLabel =
      hero.level >= 5
        ? `Level ${hero.level} (MAX)`
        : `Level ${hero.level}  |  XP: ${hero.xp}/${hero.xpToNextLevel}`;

    k.add([
      k.text(xpLabel, { size: 20 }),
      k.pos(cx, 95),
      k.anchor("center"),
      k.color(120, 255, 180),
    ]);

    const hpLabel = `HP: ${hero.currentStats.health}/${hero.currentStats.maxHealth}   ATK: ${hero.baseStats.attack}   DEF: ${hero.baseStats.defense}   MAG: ${hero.baseStats.magic}`;
    k.add([
      k.text(hpLabel, { size: 16 }),
      k.pos(cx, 130),
      k.anchor("center"),
      k.color(200, 220, 255),
    ]);

    const moveNames = hero.moveset.map((m) => m.name).join("  •  ");
    k.add([
      k.text(`Moves: ${moveNames}`, { size: 14 }),
      k.pos(cx, 165),
      k.anchor("center"),
      k.color(180, 190, 210),
    ]);

    // ── Encounter nodes ──────────────────────────────────────────────────────
    const NODE_COUNT = 5;
    const nodeY = H / 2 + 60;
    const nodeSpacing = W / (NODE_COUNT + 1);
    const NODE_W = 120;
    const NODE_H = 80;

    // Connector lines between nodes
    for (let i = 0; i < NODE_COUNT - 1; i++) {
      const x1 = nodeSpacing * (i + 1);
      const x2 = nodeSpacing * (i + 2);
      k.add([
        k.rect(x2 - x1, 6),
        k.pos(x1, nodeY),
        k.anchor("left"),
        k.color(40, 50, 80),
        k.opacity(0.8),
      ]);
    }

    for (let i = 0; i < NODE_COUNT; i++) {
      const nodeX = nodeSpacing * (i + 1);
      const isCurrent = i === runState.currentMonsterIndex;
      const isPast = i < runState.currentMonsterIndex;
      const monsterName = runState.runConfig.monsters[i]?.name ?? `Monster ${i + 1}`;

      // Node background colour
      const bgColor = isCurrent
        ? k.color(60, 160, 80)   // Vibrant green — active
        : isPast
        ? k.color(60, 60, 70)    // Dim grey — completed
        : k.color(30, 40, 60);   // Dark blue — locked

      const nodeComponents: Parameters<typeof k.add>[0] = [
        k.rect(NODE_W, NODE_H, { radius: 12 }),
        k.pos(nodeX, nodeY),
        k.anchor("center"),
        bgColor,
        k.outline(isCurrent ? 3 : 2, isCurrent ? k.Color.fromHex("#ffdd44") : k.Color.fromHex("#222233")),
        k.area(),
        k.scale(1),
      ];

      if (isCurrent) {
        nodeComponents.push(k.cursor("pointer"));
      }

      const node = k.add(nodeComponents) as any;

      // Monster name label
      node.add([
        k.text(monsterName, { size: 15, width: NODE_W - 16, align: "center" }),
        k.anchor("center"),
        k.color(isPast ? 150 : 255, isPast ? 150 : 255, isPast ? 150 : 255),
      ]);

      // Node number badge
      const badge = node.add([
        k.circle(14),
        k.pos(-(NODE_W / 2) + 14, -(NODE_H / 2) + 14),
        k.color(isCurrent ? 255 : 40, isCurrent ? 215 : 40, isCurrent ? 0 : 60),
      ]);
      badge.add([
        k.text(`${i + 1}`, { size: 14 }),
        k.anchor("center"),
        k.color(isCurrent ? 0 : 200, isCurrent ? 0 : 200, isCurrent ? 0 : 200),
      ]);

      if (isCurrent) {
        // Subtle hover bounce
        node.onHover(() => {
          node.scaleTo(1.05);
        });
        node.onHoverEnd(() => {
          node.scaleTo(1);
        });

        node.onClick(() => {
          k.go("battle", runState);
        });
      } else if (isPast) {
        // Completed checkmark
        node.add([
          k.text("✓", { size: 24 }),
          k.pos(NODE_W / 2 - 16, -(NODE_H / 2) + 16),
          k.anchor("center"),
          k.color(100, 220, 100),
        ]);
      } else {
        // Lock icon for future nodes
        node.add([
          k.text("🔒", { size: 16 }),
          k.pos(0, 22),
          k.anchor("center"),
          k.color(100, 100, 120),
        ]);
      }
    }

    // ── Move Management button ───────────────────────────────────────────────
    const mmBtn = k.add([
      k.rect(260, 60, { radius: 12 }),
      k.pos(cx, H - 70),
      k.anchor("center"),
      k.color(80, 60, 160),
      k.opacity(0.9),
      k.area(),
      k.cursor("pointer"),
      k.outline(2, k.Color.fromHex("#333333")),
      k.scale(1),
    ]);
    mmBtn.add([
      k.text("Move Management", { size: 22 }),
      k.anchor("center"),
      k.color(255, 255, 255),
    ]);
    
    // Hover effects
    mmBtn.onHover(() => {
      mmBtn.scaleTo(1.05);
      mmBtn.outline = { width: 3, color: k.Color.fromHex("#a288ff") };
    });
    mmBtn.onHoverEnd(() => {
      mmBtn.scaleTo(1);
      mmBtn.outline = { width: 2, color: k.Color.fromHex("#333333") };
    });

    mmBtn.onClick(() => {
      k.go("move-management", runState);
    });
  });
}
