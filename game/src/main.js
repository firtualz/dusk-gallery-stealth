// main.js — the game loop and state machine for Night at Dusk Gallery.
// Phases: 'title' -> 'playing' -> 'won' | 'lost'. Shot mode (?shot=...) poses
// the game for a screenshot and freezes it on one frame.

import { CANVAS_WIDTH, CANVAS_HEIGHT, ARTIFACTS } from './config.js';
import { createArtifacts, isAtExit } from './world.js';
import { createGuards, updateGuard, guardHearCoin, resetGuards } from './guards.js';
import { createPlayer, updatePlayer, throwCoin, tryPickup, resetPlayer } from './player.js';
import { updateDetection, calmMeters } from './detection.js';
import { renderGame } from './render.js';
import {
  unlockAudio,
  toggleMute,
  setSuspicion,
  playFootstep,
  playGuardStep,
  playCoinClink,
  playPickupChime,
  playAlarm,
  playCaughtSting,
  playWinFanfare,
} from './audio.js';
import { createInput, attachInput, consumeClick, consumePressedKey } from './input.js';
import { parseShot, applyShot } from './shots.js';
import { makeRandom } from './random.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const input = createInput();
attachInput(input, canvas);

function createState(seed) {
  const rng = makeRandom(seed);
  return {
    phase: 'title', // 'title' | 'playing' | 'won' | 'lost'
    player: createPlayer(),
    guards: createGuards(),
    artifacts: createArtifacts(),
    coins: [], // thrown coins: {x, y, bornAt}
    time: 0,
    maxMeter: 0,
    status: 'HIDDEN',
    alarmsRaised: 0,
    wasChasing: false, // true while any guard was chasing on the last frame
    frozen: false, // shot mode: render once, never update
    rng,
    coinRipple: 0,
  };
}

const { shot, seed } = parseShot(window.location.search);
const state = createState(seed);
if (shot) applyShot(state, shot);

function resetGame() {
  const fresh = createState(seed);
  state.phase = 'playing';
  state.player = fresh.player;
  state.guards = fresh.guards;
  state.artifacts = fresh.artifacts;
  state.coins = [];
  state.time = 0;
  state.maxMeter = 0;
  state.status = 'HIDDEN';
  state.alarmsRaised = 0;
  state.wasChasing = false;
  state.frozen = false;
}

function playerCaught(guard) {
  state.player.lives -= 1;
  playCaughtSting();
  if (state.player.lives <= 0) {
    state.phase = 'lost';
    setSuspicion(0);
    return;
  }
  // The thief slips away and starts again at the gallery door.
  resetPlayer(state.player);
  resetGuards(state.guards);
  state.coins = [];
  state.maxMeter = 0;
  state.status = 'HIDDEN';
  state.player.graceTimer = 2.5;
}

function update(dt) {
  if (state.phase !== 'playing') return;

  state.time += dt;

  // Keyboard: restart and mute work in every phase.
  const key = consumePressedKey(input);
  if (key === 'KeyR') {
    resetGame();
    return;
  }
  if (key === 'KeyM') {
    toggleMute();
  }

  // Movement and footsteps.
  const stepped = updatePlayer(state.player, input, dt);
  if (stepped) playFootstep(0, state.player.sneaking);

  // Steal an artifact.
  if (key === 'KeyE' || key === 'Space') {
    const stolen = tryPickup(state.player, state.artifacts);
    if (stolen) playPickupChime();
  }

  // Throw a coin where the player clicked.
  const click = consumeClick(input);
  if (click) {
    unlockAudio();
    const landing = throwCoin(state.player, click.x, click.y);
    if (landing) {
      playCoinClink();
      state.coins.push({ x: landing.x, y: landing.y, bornAt: state.time });
      for (const guard of state.guards) {
        const dist = Math.hypot(guard.x - landing.x, guard.y - landing.y);
        if (dist <= 300) guardHearCoin(guard, landing.x, landing.y);
      }
    }
  }

  // Guards move; their footsteps pan by where they are relative to the player.
  for (const guard of state.guards) {
    updateGuard(guard, dt, null);
    if (guard.mode === 'patrol' || guard.mode === 'chase') {
      const interval = guard.mode === 'chase' ? 0.3 : 0.5;
      if (guard.stepTimer >= interval) {
        guard.stepTimer = 0;
        const pan = Math.max(-1, Math.min(1, (guard.x - state.player.x) / 400));
        playGuardStep(pan);
      }
    }
  }

  // Detection: meters, alarms, catches.
  const result = updateDetection(state.guards, state.player, dt);
  state.maxMeter = result.maxMeter;
  if (result.alarmRaised) {
    state.alarmsRaised += 1;
    playAlarm();
  }
  if (result.caughtBy) {
    playerCaught(result.caughtBy);
    return;
  }

  // Status line: HIDDEN / SPOTTED! / HUNTED.
  const anyChasing = state.guards.some((g) => g.mode === 'chase');
  state.status = anyChasing ? 'HUNTED' : result.anySeen ? 'SPOTTED!' : 'HIDDEN';
  setSuspicion(state.maxMeter);

  // Calm down once, right after an alarm ends and every guard is back on
  // patrol. (Calling this every frame would clamp the meter and no alarm
  // could ever trigger.)
  if (!anyChasing && state.wasChasing && state.guards.every((g) => g.mode === 'patrol')) {
    calmMeters(state.guards);
  }
  state.wasChasing = anyChasing;

  // Win: all 3 artifacts stolen, then reach the green exit door.
  if (state.player.artifactsTaken >= ARTIFACTS.length && isAtExit(state.player.x, state.player.y)) {
    state.phase = 'won';
    playWinFanfare();
    setSuspicion(0);
  }

  // Fade old coin ripples.
  state.coins = state.coins.filter((c) => state.time - c.bornAt < 2.5);
}

function handleTitleKeys() {
  const key = consumePressedKey(input);
  if (key === 'Enter' || key === 'Space') {
    unlockAudio();
    state.phase = 'playing';
    return;
  }
  if (key === 'KeyR') resetGame();
  if (key === 'KeyM') toggleMute();
  const click = consumeClick(input);
  if (click) {
    unlockAudio();
    state.phase = 'playing';
  }
}

function handleEndKeys() {
  const key = consumePressedKey(input);
  if (key === 'KeyR') resetGame();
  if (key === 'KeyM') toggleMute();
  consumeClick(input);
}

let lastTime = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  if (!state.frozen) {
    if (state.phase === 'title') handleTitleKeys();
    else if (state.phase === 'won' || state.phase === 'lost') handleEndKeys();
    else update(dt);
  }
  renderGame(ctx, state, now / 1000);
  requestAnimationFrame(frame);
}

// Exposed for automated play-testing (Playwright): the live game state.
window.__game = state;

requestAnimationFrame(frame);
