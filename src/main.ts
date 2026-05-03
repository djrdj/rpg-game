// KaPlay v4 entry point — initialization, asset loading, and scene registration
// Implemented in Task 12
import kaplay from "kaplay";
import { registerMainMenuScene } from "./scenes/mainMenu";
import { registerRunOverviewScene } from "./scenes/runOverview";
import { registerMoveManagementScene } from "./scenes/moveManagement";
import { registerBattleScene } from "./scenes/battle";
import { registerPostBattleScene } from "./scenes/postBattle";
import { registerVictoryScene } from "./scenes/victory";
import { registerDefeatScene } from "./scenes/defeat";

const k = kaplay({
  width: 800,
  height: 600,
  background: [20, 20, 30],
});

// Polyfill for k.cursor which was removed in Kaplay v4000
// @ts-ignore
k.cursor = (style: string) => {
  return {
    id: "cursor",
    require: ["area"],
    add() {
      this.onHover(() => k.setCursor(style));
      this.onHoverEnd(() => k.setCursor("default"));
    },
  };
};

// Load monster sprites
k.loadSprite("dragon", "/sprites/monsters/dragon.png");
k.loadSprite("giant-spider", "/sprites/monsters/giant-spider.png");
k.loadSprite("goblin-mage", "/sprites/monsters/goblin-mage.png");
k.loadSprite("goblin-warrior", "/sprites/monsters/goblin-warrior.png");
k.loadSprite("witch", "/sprites/monsters/witch.png");

// Load battle backgrounds
k.loadSprite("bg-goblin-forest", "/backgrounds/goblin-forest.png");
k.loadSprite("bg-spider-cave", "/backgrounds/spider-cave.png");
k.loadSprite("bg-witch-swamp", "/backgrounds/witch-swamp.png");
k.loadSprite("bg-dragon-lair", "/backgrounds/dragon-lair.png");
k.loadSprite("bg-dark-tower", "/backgrounds/dark-tower.png");
k.loadSprite("bg-main-menu", "/backgrounds/main-menu.png");

// Load placeholder/hero sprites
k.loadSprite("knight", "/sprites/knight.png");
k.loadSprite("bean", "/sprites/crew/bean.png");
k.loadSprite("bobo", "/sprites/crew/bobo.png");
k.loadSprite("ghosty", "/sprites/crew/ghosty.png");
k.loadSprite("wunky", "/sprites/crew/wunky.png");
k.loadSprite("dino", "/sprites/crew/dino.png");
k.loadSprite("gigagantrum", "/sprites/crew/gigagantrum.png");

// Load audio assets
k.loadSound("menu-music", "/audio/menu-music.ogg");
k.loadSound("battle-music", "/audio/battle-music.ogg");
k.loadSound("buff", "/audio/buff.wav");
k.loadSound("enemy-death", "/audio/enemy-death.wav");
k.loadSound("enemy-damage", "/audio/enemy-damage.wav");
k.loadSound("player-death", "/audio/player-death.wav");
k.loadSound("player-damage", "/audio/player-damage.wav");

// Global Music Manager
let currentMusic: any = null;
let currentMusicName: string = "";

export function playBackgroundMusic(name: string, volume = 0.5) {
  if (currentMusicName === name) return;
  if (currentMusic) currentMusic.stop();
  currentMusic = k.play(name, { loop: true, volume });
  currentMusicName = name;
}

// Register all scenes
registerMainMenuScene(k);
registerRunOverviewScene(k);
registerMoveManagementScene(k);
registerBattleScene(k);
registerPostBattleScene(k);
registerVictoryScene(k);
registerDefeatScene(k);

// Start at main menu
k.go("main-menu");
