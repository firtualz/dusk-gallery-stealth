// config.js — tuning numbers and the Dusk Gallery level layout.
// Every coordinate is in canvas pixels. The canvas is 1280 x 800.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;

// --- Player ---------------------------------------------------------------
export const PLAYER_RADIUS = 16;
export const PLAYER_WALK_SPEED = 155; // px per second
export const PLAYER_SNEAK_SPEED = 72;
export const PLAYER_START = { x: 110, y: 715 };
export const PLAYER_LIVES = 2;
export const COIN_COUNT = 5;
export const COIN_THROW_RANGE = 280;
export const COIN_HEAR_RADIUS = 300;
export const PICKUP_RADIUS = 36;

// --- Guards ---------------------------------------------------------------
export const GUARD_RADIUS = 15;
export const GUARD_PATROL_SPEED = 70;
export const GUARD_CHASE_SPEED = 152;
export const GUARD_INVESTIGATE_SPEED = 105;
export const GUARD_VISION_RANGE = 230;
export const GUARD_VISION_HALF_ANGLE = (32 * Math.PI) / 180;
export const GUARD_CATCH_RADIUS = 27;
export const GUARD_ROTATE_SPEED = 0.55; // radians per second, for the watcher

// --- Detection ------------------------------------------------------------
export const DETECT_CLOSE_DIST = 90;
export const DETECT_MID_DIST = 160;
export const DETECT_RATE_CLOSE = 72; // meter points per second
export const DETECT_RATE_MID = 44;
export const DETECT_RATE_FAR = 24;
export const DETECT_SNEAK_FACTOR = 0.5;
export const DETECT_SHADOW_FACTOR = 0.6;
export const DETECT_DECAY_RATE = 30; // meter points per second while unseen
export const ALARM_METER = 100;
export const ALARM_SEARCH_TIME = 2.5; // seconds a guard searches the last seen spot
export const ALARM_COOLDOWN_METER = 35; // meter value after an alarm ends
export const GRACE_AFTER_CAUGHT = 2.5; // seconds the player cannot be seen after a catch

// --- Level geometry -------------------------------------------------------
// Walls block movement and line of sight. Covers block line of sight and
// movement too (display cases, statues, plants). Shadow zones are dark
// floor: detection fills slower inside them and guard vision is shorter.

// Outer border + two divider walls with offset door gaps.
export const WALLS = [
  { x: 0, y: 0, w: 1280, h: 24 }, // north border
  { x: 0, y: 776, w: 1280, h: 24 }, // south border
  { x: 0, y: 0, w: 24, h: 800 }, // west border
  { x: 1256, y: 0, w: 24, h: 800 }, // east border
  // Divider 1 (y 280): door gap x 700..820, right of centre.
  { x: 24, y: 280, w: 676, h: 20 },
  { x: 820, y: 280, w: 436, h: 20 },
  // Divider 2 (y 540): door gap x 300..420, left of centre.
  { x: 24, y: 540, w: 276, h: 20 },
  { x: 420, y: 540, w: 836, h: 20 },
  // Pillars.
  { x: 330, y: 110, w: 40, h: 40 },
  { x: 910, y: 110, w: 40, h: 40 },
  { x: 560, y: 380, w: 40, h: 40 },
  { x: 980, y: 620, w: 40, h: 40 },
];

// Cover objects: {x, y, w, h, kind} — kind is 'case', 'statue' or 'plant'.
export const COVERS = [
  { x: 470, y: 80, w: 140, h: 54, kind: 'case' },
  { x: 180, y: 90, w: 64, h: 64, kind: 'statue' },
  { x: 1040, y: 90, w: 64, h: 64, kind: 'statue' },
  { x: 900, y: 180, w: 54, h: 120, kind: 'case' },
  { x: 150, y: 360, w: 56, h: 56, kind: 'plant' },
  { x: 1074, y: 360, w: 56, h: 56, kind: 'plant' },
  { x: 560, y: 400, w: 150, h: 54, kind: 'case' },
  { x: 760, y: 430, w: 54, h: 120, kind: 'case' },
  { x: 150, y: 620, w: 56, h: 56, kind: 'plant' },
  { x: 1000, y: 600, w: 64, h: 64, kind: 'statue' },
  { x: 420, y: 620, w: 140, h: 54, kind: 'case' },
];

// Shadow zones: dark floor where the player is harder to spot.
export const SHADOWS = [
  { x: 40, y: 40, w: 170, h: 130 },
  { x: 1070, y: 40, w: 170, h: 130 },
  { x: 40, y: 320, w: 150, h: 170 },
  { x: 1090, y: 320, w: 150, h: 170 },
  { x: 40, y: 590, w: 170, h: 150 },
  { x: 990, y: 580, w: 240, h: 170 },
];

// Artifacts to steal: {x, y, name, color}.
export const ARTIFACTS = [
  { x: 640, y: 110, name: 'Golden Vase', color: '#f5c542' },
  { x: 150, y: 430, name: 'Jade Statue', color: '#4ade80' },
  { x: 1120, y: 650, name: 'Ruby Painting', color: '#f87171' },
];

// The exit door: a green glowing doorway in the south wall.
export const EXIT = { x: 600, y: 748, w: 80, h: 28 };

// Guard patrols: {name, kind, waypoints, speed, range, color}.
// kind 'patrol' walks its waypoints; kind 'watcher' stands and rotates.
export const GUARD_DEFS = [
  {
    name: 'Marco',
    kind: 'patrol',
    waypoints: [
      { x: 180, y: 210 },
      { x: 1100, y: 210 },
    ],
    speed: 72,
    range: 230,
    color: '#5b8cff',
  },
  {
    name: 'Lena',
    kind: 'patrol',
    waypoints: [
      { x: 420, y: 360 },
      { x: 860, y: 360 },
      { x: 860, y: 500 },
      { x: 420, y: 500 },
    ],
    speed: 62,
    range: 210,
    color: '#a855f7',
  },
  {
    name: 'Otto',
    kind: 'watcher',
    waypoints: [{ x: 640, y: 660 }],
    speed: 0,
    range: 210,
    color: '#22b8d4',
  },
];

// Warm lamp pools drawn on the floor (visual only, no gameplay effect).
export const LAMPS = [
  { x: 640, y: 60, r: 130 },
  { x: 200, y: 480, r: 110 },
  { x: 1080, y: 480, r: 110 },
  { x: 640, y: 700, r: 120 },
];
