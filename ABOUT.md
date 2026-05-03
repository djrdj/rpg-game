# About RPG Gauntlet

**RPG Gauntlet** is an immersive, turn-based web RPG built for modern browsers. Designed to blend strategic combat with high-quality pixel art and engaging UI aesthetics, players embark on a perilous run through a gauntlet of increasingly challenging monster encounters.

## Game Mechanics
- **Turn-based Combat**: Take alternating turns against deadly foes using a dynamic moveset.
- **Hero Progression**: Gain XP from every victory, level up, and permanently increase your base stats.
- **Move Management**: Defeated monsters yield new abilities! Expand your move pool and equip up to four active moves at any given time to customize your strategy.
- **Status Effects**: Wield buffs and debuffs strategically. Effects span multiple turns, meaning calculating exactly when to shield up or unleash a battle cry is critical.
- **Local Saves**: Your progress is seamlessly saved to your browser's local storage. You can drop in and out of your run without losing your hard-earned XP or new moves.

## Technology Stack
- **Engine**: [Kaplay (v4000)](https://kaplayjs.com/) for optimized WebGL sprite rendering, audio management, and core game loop.
- **Frontend**: Built with [Vite](https://vitejs.dev/) and TypeScript for a rapid, strongly-typed development experience.
- **Backend Logic**: Serverless logic for determining monster behaviors and run configurations is powered by **Supabase Edge Functions**, running securely in the cloud via Deno.
- **Hosting**: Deployed rapidly on **Vercel** as a static application, seamlessly communicating with the Supabase edge network.

## Aesthetics
The game aims to provide a premium, modern feel:
- **Glassmorphism UI**: Semi-transparent, blurred interface elements.
- **Themed Encounters**: Dynamic backgrounds based on the environment (Goblin Forest, Spider Cave, Dragon Lair, etc.).
- **Impactful Animation**: Screen shakes, smooth tweens, and hover-scaling buttons create a tactile experience.

[Play the game here!](https://rpg-game-snowy.vercel.app/)
