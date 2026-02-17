# Witness Earth — Hex Map

Phaser 3 hex map game (planetary survey, post-collapse era). Built with Vite and organized using Phaser best practices.

## Project structure

- **`src/main.js`** — Entry point; creates the Phaser game and handles resize.
- **`src/config.js`** — Phaser game configuration and scene list.
- **`src/scenes/`** — Game scenes (e.g. `HexMapScene.js`).
- **`src/data/`** — Game data (biomes, descriptions).
- **`src/utils/`** — Shared utilities (seeded RNG, noise, hex geometry).
- **`src/constants.js`** — Map and hex grid constants.
- **`index.html`** — UI shell (topbar, legend, info panel) and game container.
- **`public/`** — Static assets (add sprites, audio here when needed).

## Commands

```bash
npm install
npm run dev      # Dev server with HMR (default: http://localhost:8080)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

## Adding assets

1. Put files in `public/assets/` (e.g. `public/assets/map/tiles.png`).
2. Add a preload scene or preload in your scene’s `preload()` with `this.load.image('key', 'assets/map/tiles.png')`.
3. Use the same path from `index.html` when loading (Vite serves `public/` at `/`).

## Extending

- **New scenes:** Create under `src/scenes/`, add to `config.js` `scene: [...]`, and start them with `this.scene.start('SceneKey')`.
- **Prefabs:** Add `src/prefabs/` for custom game object classes (e.g. hex tile sprites).
- **Events:** Use `this.events.emit()` / `this.events.on()` for scene communication.
