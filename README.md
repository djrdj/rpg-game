# RPG Gauntlet

[![Play Game](https://img.shields.io/badge/Play_Now-Live_on_Vercel-success?style=for-the-badge&logo=vercel)](https://rpg-game-snowy.vercel.app/)

A turn-based RPG web game built with **Kaplay**, **Vite**, and **Supabase Edge Functions**. Engage in tactical monster battles, level up your hero, learn new moves, and attempt to survive the gauntlet.

For a deeper dive into the gameplay mechanics and the technology stack, read the [ABOUT.md](./ABOUT.md).

## Play the Game
🎮 **[Play RPG Gauntlet Live!](https://rpg-game-snowy.vercel.app/)**

Progress is automatically saved to your browser's local storage.

---

## Local Development

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Supabase CLI (optional, if you wish to run Edge Functions locally)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nordeus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a local `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Note: If you are contributing, ask the project maintainer for the development Supabase keys to interact with the Edge Functions.*

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The game will be available at `http://localhost:5173`.

### Running Tests
The project contains a robust suite of property-based tests (using `fast-check`) and unit tests (using `vitest`) to ensure the integrity of the combat formulas, XP scaling, and state management.

```bash
npm test
```

### Building for Production
To create an optimized static bundle for deployment:
```bash
npm run build
```
The output will be placed in the `dist` directory.

## Deployment
This project is configured for a zero-config deployment on **Vercel**.
Ensure you have the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured in your Vercel Project Environment Variables.

## License
MIT License
