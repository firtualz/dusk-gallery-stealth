// render.js — all canvas drawing: the gallery at night, vision cones,
// guards, the player, the HUD, and the title / win / lose screens.

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WALLS,
  COVERS,
  SHADOWS,
  LAMPS,
  EXIT,
  GUARD_VISION_HALF_ANGLE,
  ALARM_METER,
} from './config.js';
import { isInShadow, rayBlockDistance } from './world.js';

const FLOOR_DARK = '#241b12';
const FLOOR_LIGHT = '#2e2417';
const SHADOW_FILL = 'rgba(8, 6, 4, 0.55)';
const WALL_FILL = '#4a3a28';
const WALL_EDGE = '#8a6d3b';

function drawFloor(ctx) {
  ctx.fillStyle = FLOOR_DARK;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Wooden floorboards.
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 1;
  for (let y = 24; y < CANVAS_HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
  for (let x = 24; x < CANVAS_WIDTH; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  // Warm lamp pools on the floor.
  for (const lamp of LAMPS) {
    const grad = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
    grad.addColorStop(0, 'rgba(255, 196, 110, 0.20)');
    grad.addColorStop(1, 'rgba(255, 196, 110, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Shadow zones: dark floor where the player is hard to spot.
  for (const s of SHADOWS) {
    ctx.fillStyle = SHADOW_FILL;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(120, 160, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
    ctx.setLineDash([]);
  }
}

function drawWalls(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = WALL_FILL;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = WALL_EDGE;
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
  }
  // Gold trim along the two divider walls.
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(24, 300);
  ctx.lineTo(1256, 300);
  ctx.moveTo(24, 560);
  ctx.lineTo(1256, 560);
  ctx.stroke();
}

function drawCover(ctx, cover) {
  if (cover.kind === 'case') {
    ctx.fillStyle = '#171310';
    ctx.fillRect(cover.x, cover.y, cover.w, cover.h);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.strokeRect(cover.x + 1, cover.y + 1, cover.w - 2, cover.h - 2);
    ctx.fillStyle = 'rgba(201, 162, 39, 0.25)';
    ctx.fillRect(cover.x + 6, cover.y + 6, cover.w - 12, cover.h - 12);
  } else if (cover.kind === 'statue') {
    ctx.fillStyle = '#3d3a35';
    ctx.beginPath();
    ctx.arc(cover.x + cover.w / 2, cover.y + cover.h / 2, cover.w / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a8578';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#57534a';
    ctx.beginPath();
    ctx.arc(cover.x + cover.w / 2, cover.y + cover.h / 2, cover.w / 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // plant: a big dark-green bush in a pot
    ctx.fillStyle = '#1d3a1a';
    ctx.beginPath();
    ctx.arc(cover.x + cover.w / 2, cover.y + cover.h / 2, cover.w / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c5a24';
    ctx.beginPath();
    ctx.arc(cover.x + cover.w / 2 - 8, cover.y + cover.h / 2 - 6, 10, 0, Math.PI * 2);
    ctx.arc(cover.x + cover.w / 2 + 9, cover.y + cover.h / 2 + 5, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a7a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cover.x + cover.w / 2, cover.y + cover.h / 2, cover.w / 2 - 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawArtifacts(ctx, artifacts, time) {
  for (const artifact of artifacts) {
    if (artifact.taken) continue;
    const pulse = 0.55 + 0.3 * Math.sin(time * 3 + artifact.x);
    const grad = ctx.createRadialGradient(artifact.x, artifact.y, 4, artifact.x, artifact.y, 46);
    grad.addColorStop(0, artifact.color);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalAlpha = pulse;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(artifact.x, artifact.y, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // The artifact itself: a small gem on a pedestal.
    ctx.fillStyle = '#241b12';
    ctx.fillRect(artifact.x - 14, artifact.y + 4, 28, 14);
    ctx.fillStyle = artifact.color;
    ctx.beginPath();
    ctx.moveTo(artifact.x, artifact.y - 14);
    ctx.lineTo(artifact.x + 10, artifact.y + 2);
    ctx.lineTo(artifact.x, artifact.y + 8);
    ctx.lineTo(artifact.x - 10, artifact.y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(artifact.name.toUpperCase(), artifact.x, artifact.y + 34);
  }
}

function drawExit(ctx, time, artifactsLeft) {
  const glow = 0.5 + 0.3 * Math.sin(time * 2.5);
  const grad = ctx.createRadialGradient(EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2, 4, EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2, 90);
  grad.addColorStop(0, `rgba(74, 222, 128, ${glow})`);
  grad.addColorStop(1, 'rgba(74, 222, 128, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(EXIT.x - 60, EXIT.y - 70, EXIT.w + 120, EXIT.h + 90);
  ctx.fillStyle = '#14532d';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = '#bbf7d0';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y - 10);
  if (artifactsLeft > 0) {
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`NEED ${artifactsLeft} MORE ARTIFACT${artifactsLeft > 1 ? 'S' : ''}`, EXIT.x + EXIT.w / 2, EXIT.y - 28);
  }
}

function drawVisionCone(ctx, guard) {
  const alertness = guard.meter / ALARM_METER;
  const chasing = guard.mode === 'chase';
  const fill = chasing
    ? 'rgba(239, 68, 68, 0.30)'
    : alertness > 0.6
      ? 'rgba(249, 115, 22, 0.26)'
      : 'rgba(250, 204, 21, 0.20)';
  const edge = chasing ? 'rgba(239, 68, 68, 0.65)' : 'rgba(250, 204, 21, 0.45)';
  // Raycast the cone: each edge ray stops at the first wall or cover, so
  // the cone never shines through a wall.
  const steps = 26;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  for (let i = 0; i <= steps; i++) {
    const angle = guard.angle - GUARD_VISION_HALF_ANGLE + (2 * GUARD_VISION_HALF_ANGLE * i) / steps;
    const dist = rayBlockDistance(guard.x, guard.y, Math.cos(angle), Math.sin(angle), guard.range);
    ctx.lineTo(guard.x + Math.cos(angle) * dist, guard.y + Math.sin(angle) * dist);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGuard(ctx, guard, time) {
  drawVisionCone(ctx, guard);
  // Body: a navy uniform with a cap, high contrast against the floor.
  ctx.fillStyle = guard.color;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Facing tick.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.angle) * (guard.radius + 7), guard.y + Math.sin(guard.angle) * (guard.radius + 7));
  ctx.stroke();
  // Name tag and suspicion pips above the guard.
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(guard.name.toUpperCase(), guard.x, guard.y - guard.radius - 14);
  if (guard.meter > 5) {
    const w = 34;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(guard.x - w / 2, guard.y - guard.radius - 10, w, 5);
    ctx.fillStyle = guard.meter >= ALARM_METER ? '#ef4444' : '#f59e0b';
    ctx.fillRect(guard.x - w / 2, guard.y - guard.radius - 10, (w * guard.meter) / ALARM_METER, 5);
  }
  if (guard.mode === 'chase') {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('!', guard.x, guard.y - guard.radius - 22);
  } else if (guard.mode === 'investigate') {
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('?', guard.x, guard.y - guard.radius - 22);
  }
}

function drawPlayer(ctx, player, time) {
  // A faint ring while the player is safe in shadow.
  if (isInShadow(player.x, player.y)) {
    ctx.strokeStyle = 'rgba(120, 160, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  // The thief: a dark teal hooded figure with a gold trim.
  const blink = player.graceTimer > 0 && Math.floor(time * 8) % 2 === 0;
  if (!blink) {
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f5c542';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.angle) * (player.radius + 6), player.y + Math.sin(player.angle) * (player.radius + 6));
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', player.x, player.y - player.radius - 8);
  }
}

function drawCoins(ctx, coins, time) {
  for (const coin of coins) {
    const age = time - coin.bornAt;
    const radius = 6 + age * 46;
    ctx.strokeStyle = `rgba(250, 204, 21, ${Math.max(0, 0.8 - age * 0.5)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    if (age < 0.6) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function drawHud(ctx, state) {
  const { player, guards, artifacts, time, status, maxMeter } = state;
  // Top bar.
  ctx.fillStyle = 'rgba(10, 8, 5, 0.82)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 46);
  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  const taken = artifacts.filter((a) => a.taken).length;
  ctx.fillText(`ARTIFACTS  ${taken}/3`, 20, 30);
  // Detection meter.
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('DETECTION', 240, 30);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(340, 16, 220, 16);
  const meterColor = maxMeter >= ALARM_METER ? '#ef4444' : maxMeter > 60 ? '#f97316' : '#facc15';
  ctx.fillStyle = meterColor;
  ctx.fillRect(340, 16, (220 * Math.min(100, maxMeter)) / 100, 16);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(340, 16, 220, 16);
  // Status.
  const statusColor = status === 'HIDDEN' ? '#4ade80' : status === 'SPOTTED!' ? '#f97316' : '#ef4444';
  ctx.fillStyle = statusColor;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(status, 700, 30);
  // Timer, coins, lives.
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`TIME ${formatTime(time)}`, 1000, 30);
  ctx.fillText(`COINS ${player.coins}`, 1110, 30);
  ctx.fillStyle = '#f87171';
  ctx.fillText('♥'.repeat(Math.max(0, player.lives)), 1250, 30);
  // Bottom hint bar.
  ctx.fillStyle = 'rgba(10, 8, 5, 0.7)';
  ctx.fillRect(0, CANVAS_HEIGHT - 26, CANVAS_WIDTH, 26);
  ctx.fillStyle = '#d6c9a8';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD move  •  SHIFT sneak  •  CLICK throw a coin  •  E steal  •  R restart  •  M mute', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8);
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 6, 4, 0.78)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText(title, CANVAS_WIDTH / 2, 300);
  ctx.fillStyle = '#f5f0e1';
  ctx.font = '20px Georgia, serif';
  let y = 360;
  for (const line of lines) {
    ctx.fillText(line, CANVAS_WIDTH / 2, y);
    y += 34;
  }
}

export function renderGame(ctx, state, time) {
  drawFloor(ctx);
  drawArtifacts(ctx, state.artifacts, time);
  drawExit(ctx, time, state.artifacts.filter((a) => !a.taken).length);
  drawWalls(ctx);
  for (const cover of COVERS) drawCover(ctx, cover);
  for (const guard of state.guards) drawGuard(ctx, guard, time);
  drawCoins(ctx, state.coins, time);
  drawPlayer(ctx, state.player, time);
  drawHud(ctx, state);

  if (state.phase === 'title') {
    drawOverlay(
      ctx,
      'NIGHT AT DUSK GALLERY',
      [
        'A stealth game — steal 3 artifacts, reach the exit unseen.',
        'Stealth: cones, cover, exit — no one saw you.',
        '',
        'WASD / arrows — move      SHIFT — sneak      CLICK — throw a coin',
        'E — steal an artifact      R — restart      M — mute',
        '',
        'Hide behind cases and statues. Dark floor keeps you safe.',
        'Press ENTER or CLICK to begin.',
      ],
      '#f5c542',
    );
  } else if (state.phase === 'won') {
    const rank = state.alarmsRaised === 0 ? 'PERFECT SHADOW' : state.player.lives === 2 ? 'CLEAN GETAWAY' : 'LUCKY ESCAPE';
    drawOverlay(
      ctx,
      'ESCAPED UNSEEN',
      [
        `Artifacts stolen: ${state.player.artifactsTaken} / 3`,
        `Time: ${formatTime(state.time)}      Alarms: ${state.alarmsRaised}`,
        `Rank: ${rank}`,
        '',
        'Press R to play again.',
      ],
      '#4ade80',
    );
  } else if (state.phase === 'lost') {
    drawOverlay(
      ctx,
      'CAUGHT IN THE DARK',
      [
        'The guards caught you twice. The gallery keeps its secrets.',
        `Artifacts stolen: ${state.player.artifactsTaken} / 3      Time: ${formatTime(state.time)}`,
        '',
        'Press R to try again.',
      ],
      '#ef4444',
    );
  }
}

export { formatTime };
