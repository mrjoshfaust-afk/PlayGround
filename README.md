# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://go.ondev.store/).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://go.ondev.store/mrjoshfaust-afk/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/mrjoshfaust-afk/PlayGround)

- 🎮 [Open the project](https://go.ondev.store/mrjoshfaust-afk/PlayGround).
- ✨ [Remix this project](https://go.ondev.store/mrjoshfaust-afk/PlayGround?remix=1).
- 💻 [Explore the source](https://github.com/mrjoshfaust-afk/PlayGround).
- 🛠️ [Check build runs](https://github.com/mrjoshfaust-afk/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/mrjoshfaust-afk/PlayGround/issues).
- 👤 [Explore the creator's projects](https://go.ondev.store/mrjoshfaust-afk).
- 🌍 [Create with OMGithub](https://go.ondev.store/).
<!-- omgithub:readme:end -->

## Hollowwood — A Forest Adventure

A small, self-contained 2D action-adventure built with vanilla Canvas and WebAudio. No build step or external assets required.

Three beasts have taken the glade. Play as a warrior, cut them down, loot the chest, and survive.

### Play

Serve the folder with any static server and open `index.html`:

```bash
./start.sh          # serves on http://localhost:3000
```

### Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | WASD / arrow keys | Left joystick |
| Sword | Space | Sword button |
| Heal | Q | Heal button |
| Open chest | E | Open button |

### Features

- Active sword combat with arcs, knockback, damage numbers, and critical hits.
- Three independently patrolling/chasing enemies: goblin, wolf, and orc.
- Health, invulnerability frames, healing potions, and a defeat/retry flow.
- A treasure chest with one of five random rewards, plus pickups and gold.
- Inventory satchel for gold, potions, and permanent upgrades.
- Responsive HUD and touch controls sized for Android portrait and landscape.
- Victory screen with time, kills, gold, and damage dealt; instant restart.
- Procedural forest with camera follow, culling, cached sprites, and a fixed-step simulation.

### Project layout

- `index.html` — page shell, HUD, menus, and overlays
- `styles.css` — responsive visual design and touch layout
- `js/core.js` — constants, state, map, terrain rendering, audio helpers
- `js/logic.js` — movement, combat, enemy AI, pickups, chest, win/lose
- `js/render-world.js` — trees, characters, chest, culling
- `js/render-fx.js` — water, particles, combat FX, screen overlays
- `js/main.js` — input, HUD updates, fixed-timestep loop, debug API

