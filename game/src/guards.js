// guards.js — the gallery guards: patrols, the rotating watcher,
// investigating a thrown coin, and chasing the player when the alarm sounds.

import { GUARD_DEFS, GUARD_RADIUS, GUARD_ROTATE_SPEED, GUARD_INVESTIGATE_SPEED, GUARD_CHASE_SPEED } from './config.js';
import { canStandAt, moveCircle } from './world.js';

export function createGuards() {
  return GUARD_DEFS.map((def, index) => {
    const start = def.waypoints[0];
    return {
      id: index,
      name: def.name,
      kind: def.kind,
      x: start.x,
      y: start.y,
      angle: def.kind === 'watcher' ? -Math.PI / 2 : 0,
      waypointIndex: 1,
      waypoints: def.waypoints,
      speed: def.speed,
      range: def.range,
      color: def.color,
      radius: GUARD_RADIUS,
      // Behaviour state: 'patrol' | 'investigate' | 'chase' | 'search' | 'return'
      mode: 'patrol',
      meter: 0, // 0..100 detection meter for this guard
      lastSeen: null, // {x, y} where the player was last spotted
      investigateTarget: null,
      searchTimer: 0,
      stepTimer: 0, // footstep sound clock
      rotateAngle: -Math.PI / 2,
      returnTarget: null,
    };
  });
}

function distanceTo(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Walk toward a point at `speed`; returns true when arrived.
function walkToward(guard, target, speed, dt) {
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  const before = { x: guard.x, y: guard.y };
  moveCircle(guard, nx - guard.x, ny - guard.y, guard.radius);
  guard.angle = Math.atan2(ny - before.y, nx - before.x);
  if (Math.hypot(guard.x - before.x, guard.y - before.y) < 0.01) return true; // stuck
  return Math.hypot(target.x - guard.x, target.y - guard.y) < 6;
}

function nearestWaypointIndex(guard) {
  let best = 0;
  let bestDist = Infinity;
  guard.waypoints.forEach((w, i) => {
    const d = Math.hypot(w.x - guard.x, w.y - guard.y);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

// A guard hears a coin land and walks over to look.
export function guardHearCoin(guard, x, y) {
  if (guard.mode === 'chase') return; // a chasing guard ignores coins
  guard.mode = 'investigate';
  guard.investigateTarget = { x, y };
}

// The alarm: the guard runs to where the player was last seen.
export function guardRaiseAlarm(guard, x, y) {
  guard.mode = 'chase';
  guard.lastSeen = { x, y };
}

export function updateGuard(guard, dt, events) {
  guard.stepTimer += dt;

  if (guard.kind === 'watcher' && guard.mode === 'patrol') {
    // Otto stands in the south hall and slowly sweeps his gaze around.
    guard.rotateAngle += GUARD_ROTATE_SPEED * dt;
    guard.angle = guard.rotateAngle;
    return;
  }

  if (guard.mode === 'patrol') {
    const target = guard.waypoints[guard.waypointIndex];
    if (walkToward(guard, target, guard.speed, dt)) {
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    }
    return;
  }

  if (guard.mode === 'investigate') {
    const target = guard.investigateTarget;
    if (!target) {
      guard.mode = 'return';
      return;
    }
    if (walkToward(guard, target, GUARD_INVESTIGATE_SPEED, dt)) {
      guard.mode = 'search';
      guard.searchTimer = 1.6;
    }
    return;
  }

  if (guard.mode === 'chase') {
    const target = guard.lastSeen;
    if (!target) {
      guard.mode = 'return';
      return;
    }
    if (walkToward(guard, target, GUARD_CHASE_SPEED, dt)) {
      guard.mode = 'search';
      guard.searchTimer = 2.5;
    }
    return;
  }

  if (guard.mode === 'search') {
    // Look around the spot, then give up and walk back to the patrol route.
    guard.searchTimer -= dt;
    guard.angle += dt * 1.8;
    if (guard.searchTimer <= 0) {
      guard.mode = 'return';
      guard.returnTarget = guard.waypoints[nearestWaypointIndex(guard)];
    }
    return;
  }

  if (guard.mode === 'return') {
    const target = guard.returnTarget || guard.waypoints[0];
    if (walkToward(guard, target, guard.speed, dt)) {
      guard.mode = 'patrol';
      guard.waypointIndex = (nearestWaypointIndex(guard) + 1) % guard.waypoints.length;
      guard.meter = 0;
    }
    return;
  }
}

// Put every guard back on its patrol route (after the player is caught).
export function resetGuards(guards) {
  for (const guard of guards) {
    const start = guard.waypoints[0];
    guard.x = start.x;
    guard.y = start.y;
    guard.angle = guard.kind === 'watcher' ? -Math.PI / 2 : 0;
    guard.rotateAngle = -Math.PI / 2;
    guard.waypointIndex = 1;
    guard.mode = 'patrol';
    guard.meter = 0;
    guard.lastSeen = null;
    guard.investigateTarget = null;
    guard.searchTimer = 0;
  }
}

export { distanceTo };
export function guardCanStand(x, y) {
  return canStandAt(x, y, GUARD_RADIUS);
}
