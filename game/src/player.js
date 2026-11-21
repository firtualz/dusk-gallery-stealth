// player.js — the shadow thief: movement, sneaking, coin throws and pickups.

import {
  PLAYER_RADIUS,
  PLAYER_WALK_SPEED,
  PLAYER_SNEAK_SPEED,
  PLAYER_START,
  PLAYER_LIVES,
  COIN_COUNT,
  COIN_THROW_RANGE,
  PICKUP_RADIUS,
} from './config.js';
import { canStandAt, moveCircle, isInShadow } from './world.js';

export function createPlayer() {
  return {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    radius: PLAYER_RADIUS,
    angle: 0, // facing direction, radians
    moving: false,
    sneaking: false,
    lives: PLAYER_LIVES,
    coins: COIN_COUNT,
    coinCooldown: 0,
    artifactsTaken: 0,
    stepTimer: 0,
    graceTimer: 0, // seconds of invisibility after being caught
  };
}

export function resetPlayer(player) {
  player.x = PLAYER_START.x;
  player.y = PLAYER_START.y;
  player.angle = 0;
  player.moving = false;
  player.sneaking = false;
  player.coinCooldown = 0;
  player.stepTimer = 0;
  player.graceTimer = 0;
}

// Move the player from the keyboard state. Returns true when a footstep
// sound should play (the caller paces the sound with stepTimer).
export function updatePlayer(player, input, dt) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;

  player.sneaking = !!input.sneak;
  const speed = player.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
  player.moving = dx !== 0 || dy !== 0;

  if (player.moving) {
    const len = Math.hypot(dx, dy);
    const step = speed * dt;
    moveCircle(player, (dx / len) * step, (dy / len) * step, player.radius);
    player.angle = Math.atan2(dy, dx);
  }

  if (player.coinCooldown > 0) player.coinCooldown -= dt;
  if (player.graceTimer > 0) player.graceTimer -= dt;

  // Footstep pacing: walkers step twice a second, sneakers once.
  const stepInterval = player.sneaking ? 0.55 : 0.34;
  player.stepTimer += dt;
  if (player.moving && player.stepTimer >= stepInterval) {
    player.stepTimer = 0;
    return true;
  }
  return false;
}

// Throw a coin toward (tx, ty). Returns the landing point, or null when the
// player has no coins, is on cooldown, or the click is out of range.
export function throwCoin(player, tx, ty) {
  if (player.coins <= 0 || player.coinCooldown > 0) return null;
  const dx = tx - player.x;
  const dy = ty - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 10 || dist > COIN_THROW_RANGE) return null;
  player.coins -= 1;
  player.coinCooldown = 1.0;
  // The coin stops at the first wall or cover in its path.
  let landX = tx;
  let landY = ty;
  for (let t = 0.05; t <= 1; t += 0.05) {
    const px = player.x + dx * t;
    const py = player.y + dy * t;
    if (!canStandAt(px, py, 4)) break;
    landX = px;
    landY = py;
  }
  return { x: landX, y: landY };
}

// Try to steal the nearest artifact within reach. Returns it, or null.
export function tryPickup(player, artifacts) {
  for (const artifact of artifacts) {
    if (artifact.taken) continue;
    if (Math.hypot(artifact.x - player.x, artifact.y - player.y) <= PICKUP_RADIUS) {
      artifact.taken = true;
      player.artifactsTaken += 1;
      return artifact;
    }
  }
  return null;
}

export function playerInShadow(player) {
  return isInShadow(player.x, player.y);
}
