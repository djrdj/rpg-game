// Main Menu scene — Task 13
import type { KAPLAYCtx } from "kaplay";
import { fetchRunConfig } from "../api/runConfig";
import { initRunState } from "../game/runState";
import { playBackgroundMusic } from "../main";

export function registerMainMenuScene(k: KAPLAYCtx) {
  k.scene("main-menu", () => {
    playBackgroundMusic("menu-music");

    // ── Epic Background ──────────────────────────────────────────────────────
    k.add([
      k.sprite("bg-main-menu", { width: k.width(), height: k.height() }),
      k.pos(0, 0),
    ]);
    
    // Dark overlay for cinematic feel and text readability
    k.add([
      k.rect(k.width(), k.height()),
      k.pos(0, 0),
      k.color(0, 0, 0),
      k.opacity(0.4),
    ]);

    // ── Title ────────────────────────────────────────────────────────────────
    // Title drop shadow
    k.add([
      k.text("RPG Gauntlet", { size: 64, font: "sans-serif" }),
      k.pos(k.center().x + 4, k.center().y - 146),
      k.anchor("center"),
      k.color(0, 0, 0),
      k.opacity(0.8),
    ]);
    // Main Title
    k.add([
      k.text("RPG Gauntlet", { size: 64, font: "sans-serif" }),
      k.pos(k.center().x, k.center().y - 150),
      k.anchor("center"),
      k.color(255, 215, 0),
    ]);

    // ── Buttons ──────────────────────────────────────────────────────────────
    const createMenuButton = (text: string, yOffset: number, baseColor: number[], highlightColor: string) => {
      const btn = k.add([
        k.rect(260, 60, { radius: 12 }),
        k.pos(k.center().x, k.center().y + yOffset),
        k.anchor("center"),
        k.color(baseColor[0], baseColor[1], baseColor[2]),
        k.opacity(0.85),
        k.area(),
        k.cursor("pointer"),
        k.outline(2, k.Color.fromHex("#333333")),
        k.scale(1),
      ]);

      btn.add([
        k.text(text, { size: 24 }),
        k.anchor("center"),
        k.color(255, 255, 255),
      ]);

      // Hover effects
      btn.onHover(() => {
        btn.scaleTo(1.05);
        btn.outline = { width: 3, color: k.Color.fromHex(highlightColor) };
      });
      btn.onHoverEnd(() => {
        btn.scaleTo(1);
        btn.outline = { width: 2, color: k.Color.fromHex("#333333") };
      });

      return btn;
    };

    const startBtn = createMenuButton("Start Run", 20, [40, 80, 160], "#4a90e2");
    const exitBtn = createMenuButton("Exit", 100, [160, 40, 40], "#e24a4a");

    exitBtn.onClick(() => {
      window.close();
    });

    function showErrorOverlay(onRetry: () => void) {
      const overlay = k.add([
        k.rect(k.width(), k.height()),
        k.pos(0, 0),
        k.color(0, 0, 0),
        k.opacity(0.75),
        k.z(10),
      ]);

      const errMsg = k.add([
        k.text("Failed to load run config.\nPlease try again.", { size: 22, align: "center" }),
        k.pos(k.center().x, k.center().y - 50),
        k.anchor("center"),
        k.color(255, 80, 80),
        k.z(11),
      ]);

      const retryBtn = k.add([
        k.rect(160, 48, { radius: 8 }),
        k.pos(k.center().x, k.center().y + 30),
        k.anchor("center"),
        k.color(60, 120, 200),
        k.area(),
        k.cursor("pointer"),
        k.z(11),
      ]);
      retryBtn.add([
        k.text("Retry", { size: 20 }),
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

    async function startRun() {
      try {
        const runConfig = await fetchRunConfig();
        const runState = initRunState(runConfig);
        k.go("run-overview", runState);
      } catch {
        showErrorOverlay(startRun);
      }
    }

    startBtn.onClick(() => {
      startRun();
    });
  });
}
