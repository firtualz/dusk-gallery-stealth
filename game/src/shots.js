// shots.js — deterministic poses for the screenshots.
// ?shot=start | hide | nearmiss | win  (add &seed=1 to fix the random seed)
// Each pose sets the game state directly, so a screenshot is a real render
// of the game code in a known, repeatable state.

import { ARTIFACTS } from './config.js';

export const SHOT_NAMES = ['start', 'hide', 'nearmiss', 'win'];

export function parseShot(search) {
  const params = new URLSearchParams(search);
  const shot = params.get('shot');
  const seed = Number.parseInt(params.get('seed') || '1', 10);
  return { shot: SHOT_NAMES.includes(shot) ? shot : null, seed: Number.isFinite(seed) ? seed : 1 };
}

// Freeze the game on one frame and pose it for a screenshot.
export function applyShot(state, shot) {
  state.frozen = true;
  const guards = state.guards;
  const player = state.player;

  if (shot === 'start') {
    // The cover: the whole level, all 3 guards with cones, cover, exit, HUD.
    state.phase = 'playing';
    player.x = 110;
    player.y = 715;
    player.angle = -Math.PI / 2;
    guards[0].x = 500;
    guards[0].y = 210;
    guards[0].angle = 0;
    guards[0].mode = 'patrol';
    guards[1].x = 860;
    guards[1].y = 360;
    guards[1].angle = Math.PI / 2;
    guards[1].mode = 'patrol';
    guards[2].x = 640;
    guards[2].y = 660;
    guards[2].angle = -Math.PI / 2;
    guards[2].mode = 'patrol';
    for (const g of guards) g.meter = 0;
    state.maxMeter = 0;
    state.status = 'HIDDEN';
    state.time = 12;
  } else if (shot === 'hide') {
    // The player crouches behind the central display case while Lena's cone
    // sweeps right past the cover. Status HIDDEN, meter 0.
    state.phase = 'playing';
    player.x = 600;
    player.y = 470;
    player.angle = Math.PI;
    player.sneaking = true;
    guards[1].x = 700;
    guards[1].y = 360;
    guards[1].angle = 2.0; // cone sweeps down-left, past the case at the player
    guards[1].mode = 'patrol';
    guards[0].x = 300;
    guards[0].y = 210;
    guards[0].angle = 0;
    guards[2].x = 640;
    guards[2].y = 660;
    guards[2].angle = Math.PI / 2;
    for (const g of guards) g.meter = 0;
    state.maxMeter = 0;
    state.status = 'HIDDEN';
    state.time = 68;
  } else if (shot === 'nearmiss') {
    // The player stands at the very edge of Marco's cone, in the same hall
    // so the line of sight is open: meter 82, status SPOTTED!, the guard
    // turning toward the player.
    state.phase = 'playing';
    player.x = 640;
    player.y = 255;
    player.angle = Math.PI;
    guards[0].x = 500;
    guards[0].y = 210;
    guards[0].angle = Math.PI / 4;
    guards[0].meter = 82;
    guards[0].mode = 'patrol';
    guards[1].x = 860;
    guards[1].y = 500;
    guards[1].angle = Math.PI;
    guards[1].meter = 0;
    guards[2].x = 640;
    guards[2].y = 660;
    guards[2].angle = -Math.PI / 2;
    guards[2].meter = 0;
    state.maxMeter = 82;
    state.status = 'SPOTTED!';
    state.time = 94;
  } else if (shot === 'win') {
    // The win screen: all 3 artifacts stolen, escaped unseen, top rank.
    state.phase = 'won';
    state.player.artifactsTaken = 3;
    for (const a of state.artifacts) a.taken = true;
    state.time = 204;
    state.alarmsRaised = 0;
    state.maxMeter = 0;
    state.status = 'HIDDEN';
    // Keep the level visible behind the win overlay.
    player.x = 640;
    player.y = 740;
    guards[0].x = 500;
    guards[0].y = 210;
    guards[0].angle = Math.PI;
    guards[1].x = 420;
    guards[1].y = 500;
    guards[1].angle = 0;
    guards[2].x = 640;
    guards[2].y = 660;
    guards[2].angle = Math.PI / 2;
    for (const g of guards) g.meter = 0;
  }
  return state;
}

export { ARTIFACTS };
