# Night at Dusk Gallery

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/firtualz/dusk-gallery-stealth/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/firtualz/dusk-gallery-stealth/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A complete top-down stealth game. You are a shadow thief in the Dusk Gallery
at night: steal three artifacts and reach the exit without being seen.

## How to play

- **Move:** WASD or arrow keys. **Sneak:** hold Shift (slower, quieter, harder to spot).
- **Steal:** press E or Space near a glowing artifact.
- **Throw a coin:** click anywhere within reach to distract a guard — guards walk to the sound.
- **Hide:** stay behind display cases, statues and plants (they block a guard's line of sight), and keep to the dark shadow zones on the floor.
- **Win:** collect all 3 artifacts, then slip out through the green exit door. Finish with zero alarms for the rank **Perfect Shadow**.
- **Lose:** get caught twice while a guard is chasing you.

Guards patrol routes you can learn. Their yellow vision cones show what they
can see; a cone turns red as a guard grows suspicious. The detection meter
fills while you are seen and drains while you hide — if it fills, the guard
raises the alarm and runs to where he last saw you. Break line of sight and
wait it out to recover.

## Run it

```sh
node serve.ts   # serves game/ at http://localhost:8080
```

No build step, no network requests, no external assets — every sound is
synthesised with WebAudio. Open `game/index.html` in desktop Chrome and play.

## Layout

- `game/index.html` — the page
- `game/src/config.js` — tuning numbers and the level layout
- `game/src/world.js` — walls, cover, shadows, artifacts, exit, line of sight
- `game/src/guards.js` — guard patrols, investigation and chases
- `game/src/player.js` — movement, sneaking, coin throws, pickups
- `game/src/detection.js` — vision cones and the detection meter
- `game/src/render.js` — all canvas drawing: level, cones, guards, HUD, screens
- `game/src/audio.js` — WebAudio footsteps, alarm, chimes, fanfare
- `game/src/input.js` — keyboard and mouse
- `game/src/shots.js` — deterministic poses for screenshots (`?shot=start|hide|nearmiss|win`)
- `game/src/random.js` — seeded random numbers
- `game/src/main.js` — game loop and state machine
- `main.ts` — builds `dossier.json` and copies the game for make.fun
- `serve.ts` — tiny static server for local play

Built by an AI agent for make.fun's "Make the best stealth game" bounty.
