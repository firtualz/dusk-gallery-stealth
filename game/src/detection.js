// detection.js — vision cones and the detection meter.
// A guard sees the player only when the player is inside the cone, in range,
// and the line of sight is not blocked by a wall or cover.

import {
  GUARD_VISION_HALF_ANGLE,
  DETECT_CLOSE_DIST,
  DETECT_MID_DIST,
  DETECT_RATE_CLOSE,
  DETECT_RATE_MID,
  DETECT_RATE_FAR,
  DETECT_SNEAK_FACTOR,
  DETECT_SHADOW_FACTOR,
  DETECT_DECAY_RATE,
  ALARM_METER,
  ALARM_COOLDOWN_METER,
  GUARD_CATCH_RADIUS,
} from './config.js';
import { lineBlocked, isInShadow } from './world.js';
import { guardRaiseAlarm } from './guards.js';

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Is the player inside this guard's vision cone (range + angle, no LOS yet)?
export function playerInCone(guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = isInShadow(player.x, player.y) ? guard.range * 0.75 : guard.range;
  if (dist > range) return { seen: false, dist };
  const angleToPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(angleToPlayer, guard.angle)) > GUARD_VISION_HALF_ANGLE) {
    return { seen: false, dist };
  }
  return { seen: true, dist };
}

// Full visibility test: cone plus an unblocked line of sight.
export function guardSeesPlayer(guard, player) {
  if (player.graceTimer > 0) return { seen: false, dist: Infinity };
  const cone = playerInCone(guard, player);
  if (!cone.seen) return cone;
  if (lineBlocked(guard.x, guard.y, player.x, player.y)) return { seen: false, dist: cone.dist };
  return cone;
}

function detectionRate(dist, player) {
  let rate = dist < DETECT_CLOSE_DIST ? DETECT_RATE_CLOSE : dist < DETECT_MID_DIST ? DETECT_RATE_MID : DETECT_RATE_FAR;
  if (player.sneaking) rate *= DETECT_SNEAK_FACTOR;
  if (isInShadow(player.x, player.y)) rate *= DETECT_SHADOW_FACTOR;
  return rate;
}

// Update every guard's meter. Returns an object describing what happened:
// { alarmRaised: guard|null, caughtBy: guard|null, maxMeter, anySeen }.
export function updateDetection(guards, player, dt) {
  let maxMeter = 0;
  let anySeen = false;
  let alarmRaised = null;
  let caughtBy = null;

  for (const guard of guards) {
    const check = guardSeesPlayer(guard, player);
    if (check.seen) {
      anySeen = true;
      guard.meter += detectionRate(check.dist, player) * dt;
      guard.lastSeen = { x: player.x, y: player.y };
      if (guard.meter >= ALARM_METER && guard.mode !== 'chase') {
        guard.meter = ALARM_METER;
        guardRaiseAlarm(guard, player.x, player.y);
        alarmRaised = guard;
      }
    } else if (guard.mode !== 'chase') {
      guard.meter = Math.max(0, guard.meter - DETECT_DECAY_RATE * dt);
    }

    // A chasing guard that touches the player catches them.
    if (guard.mode === 'chase') {
      const dist = Math.hypot(guard.x - player.x, guard.y - player.y);
      if (dist <= GUARD_CATCH_RADIUS && player.graceTimer <= 0) {
        caughtBy = guard;
      }
    }

    if (guard.meter > maxMeter) maxMeter = guard.meter;
  }

  // When every guard has calmed down, the alarm is over.
  return { alarmRaised, caughtBy, maxMeter, anySeen };
}

// After an alarm ends with the player still free, meters settle here.
export function calmMeters(guards) {
  for (const guard of guards) {
    if (guard.mode === 'patrol') guard.meter = Math.min(guard.meter, ALARM_COOLDOWN_METER);
  }
}
