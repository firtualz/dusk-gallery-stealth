// world.js — the gallery level: walls, cover, shadows, artifacts, exit,
// and the geometry helpers every other module uses (collision, line of sight).

import {
  WALLS,
  COVERS,
  SHADOWS,
  ARTIFACTS,
  EXIT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './config.js';

// All rectangles that block movement and line of sight.
export function blockingRects() {
  return WALLS.concat(COVERS);
}

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Is the point (x, y) inside any wall or cover?
export function isSolidPoint(x, y) {
  for (const r of blockingRects()) {
    if (pointInRect(x, y, r)) return true;
  }
  return false;
}

// Can a circle of radius `radius` centred at (x, y) stand there?
// Checks the circle against every blocking rectangle.
export function canStandAt(x, y, radius) {
  if (x - radius < 0 || x + radius > CANVAS_WIDTH) return false;
  if (y - radius < 0 || y + radius > CANVAS_HEIGHT) return false;
  for (const r of blockingRects()) {
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < radius * radius) return false;
  }
  return true;
}

// Move a circle by (dx, dy), sliding along walls: try the full move, then
// each axis separately, so the player and guards glide around corners.
export function moveCircle(pos, dx, dy, radius) {
  let nx = pos.x + dx;
  let ny = pos.y + dy;
  if (canStandAt(nx, ny, radius)) {
    pos.x = nx;
    pos.y = ny;
    return;
  }
  if (canStandAt(nx, pos.y, radius)) {
    pos.x = nx;
    return;
  }
  if (canStandAt(pos.x, ny, radius)) {
    pos.y = ny;
  }
}

// --- Segment vs rectangle (for line of sight) ------------------------------

function segmentIntersectsRect(x1, y1, x2, y2, r) {
  // Quick reject: both ends on one side.
  if ((x1 < r.x && x2 < r.x) || (x1 > r.x + r.w && x2 > r.x + r.w)) return false;
  if ((y1 < r.y && y2 < r.y) || (y1 > r.y + r.h && y2 > r.y + r.h)) return false;
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Test the four edges with a parametric intersection.
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    const edx = ex2 - ex1;
    const edy = ey2 - ey1;
    const denom = dx * edy - dy * edx;
    if (denom === 0) continue;
    const t = ((ex1 - x1) * edy - (ey1 - y1) * edx) / denom;
    const u = ((ex1 - x1) * dy - (ey1 - y1) * dx) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

// Is the straight line from (x1, y1) to (x2, y2) blocked by a wall or cover?
export function lineBlocked(x1, y1, x2, y2) {
  for (const r of blockingRects()) {
    if (segmentIntersectsRect(x1, y1, x2, y2, r)) return true;
  }
  return false;
}

// How far a ray from (x, y) in unit direction (dx, dy) travels before it
// hits a wall or cover, at most maxDist. Slab test per rectangle: the ray
// enters the rectangle at t0 and leaves at t1; the nearest entry wins.
export function rayBlockDistance(x, y, dx, dy, maxDist) {
  let best = maxDist;
  for (const r of blockingRects()) {
    let t0 = 0;
    let t1 = best;
    if (dx === 0) {
      if (x < r.x || x > r.x + r.w) continue;
    } else {
      let ta = (r.x - x) / dx;
      let tb = (r.x + r.w - x) / dx;
      if (ta > tb) {
        const tmp = ta;
        ta = tb;
        tb = tmp;
      }
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
      if (t0 > t1) continue;
    }
    if (dy === 0) {
      if (y < r.y || y > r.y + r.h) continue;
    } else {
      let ta = (r.y - y) / dy;
      let tb = (r.y + r.h - y) / dy;
      if (ta > tb) {
        const tmp = ta;
        ta = tb;
        tb = tmp;
      }
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
      if (t0 > t1) continue;
    }
    if (t0 < best) best = Math.max(0, t0);
  }
  return best;
}

// --- Shadows, artifacts, exit ----------------------------------------------

export function isInShadow(x, y) {
  for (const s of SHADOWS) {
    if (pointInRect(x, y, s)) return true;
  }
  return false;
}

export function createArtifacts() {
  return ARTIFACTS.map((a) => ({ ...a, taken: false }));
}

export function isAtExit(x, y) {
  return x >= EXIT.x && x <= EXIT.x + EXIT.w && y >= EXIT.y - 14 && y <= EXIT.y + EXIT.h;
}

export { WALLS, COVERS, SHADOWS, ARTIFACTS, EXIT };
