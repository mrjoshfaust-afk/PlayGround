/* =========================================================================
   HOLLOWWOOD — effects, attack trails, ambient life, and screen polish
   ========================================================================= */

let screenOverlay = null;
let redOverlay = null;
let goldOverlay = null;

function buildScreenOverlays() {
  const w = Math.max(2, Math.round(game.view.w));
  const h = Math.max(2, Math.round(game.view.h));

  screenOverlay = document.createElement('canvas');
  screenOverlay.width = w;
  screenOverlay.height = h;
  const s = screenOverlay.getContext('2d');
  const vignette = s.createRadialGradient(w * 0.5, h * 0.46, Math.min(w, h) * 0.24, w * 0.5, h * 0.46, Math.max(w, h) * 0.74);
  vignette.addColorStop(0, 'rgba(4, 12, 7, 0)');
  vignette.addColorStop(0.62, 'rgba(4, 11, 7, 0.06)');
  vignette.addColorStop(1, 'rgba(2, 7, 4, 0.62)');
  s.fillStyle = vignette;
  s.fillRect(0, 0, w, h);
  const warm = s.createRadialGradient(w * 0.18, h * 0.04, 0, w * 0.18, h * 0.04, Math.max(w, h) * 0.75);
  warm.addColorStop(0, 'rgba(255, 219, 139, 0.055)');
  warm.addColorStop(0.45, 'rgba(255, 210, 120, 0.015)');
  warm.addColorStop(1, 'rgba(255, 210, 120, 0)');
  s.fillStyle = warm;
  s.fillRect(0, 0, w, h);

  redOverlay = document.createElement('canvas');
  redOverlay.width = w;
  redOverlay.height = h;
  const r = redOverlay.getContext('2d');
  const danger = r.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.24, w * 0.5, h * 0.5, Math.max(w, h) * 0.68);
  danger.addColorStop(0, 'rgba(110, 9, 12, 0)');
  danger.addColorStop(0.62, 'rgba(137, 13, 14, 0.18)');
  danger.addColorStop(1, 'rgba(180, 20, 20, 1)');
  r.fillStyle = danger;
  r.fillRect(0, 0, w, h);

  goldOverlay = document.createElement('canvas');
  goldOverlay.width = w;
  goldOverlay.height = h;
  const go = goldOverlay.getContext('2d');
  const gold = go.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.max(w, h) * 0.76);
  gold.addColorStop(0, 'rgba(255, 237, 170, 0.075)');
  gold.addColorStop(1, 'rgba(230, 193, 104, 0.02)');
  go.fillStyle = gold;
  go.fillRect(0, 0, w, h);
}

function drawWaterRipples() {
  const c = ctx;
  c.save();
  c.translate(POND.x, POND.y);
  for (let i = 0; i < 4; i++) {
    const phase = (game.time * 0.18 + i * 0.26) % 1;
    const a = (1 - phase) * 0.13;
    c.strokeStyle = `rgba(184, 236, 215, ${a})`;
    c.lineWidth = 1.2;
    c.beginPath();
    c.ellipse(0, 0, POND.rx * (0.34 + phase * 0.52), POND.ry * (0.32 + phase * 0.5), 0, Math.PI * 0.08, Math.PI * 0.72);
    c.stroke();
  }
  c.restore();
}

function drawLeaves() {
  const c = ctx;
  c.save();
  for (const leaf of game.leaves) {
    const wobble = Math.sin(leaf.phase * 1.5) * 0.8;
    c.save();
    c.translate(leaf.x, leaf.y);
    c.rotate(leaf.rot + wobble);
    c.fillStyle = leaf.color;
    c.beginPath();
    c.ellipse(0, 0, leaf.size, leaf.size * 0.44, 0, 0, TAU);
    c.fill();
    c.restore();
  }
  c.restore();
}

function drawFireflies() {
  const c = ctx;
  c.save();
  c.globalCompositeOperation = 'lighter';

  for (const f of game.fireflies) {
    const x = f.bx + Math.cos(f.phase + game.time * f.speed) * f.radius;
    const y = f.by + Math.sin(f.phase * 1.4 + game.time * f.speed * 0.8) * f.radius * 0.62;
    const pulse = 0.28 + Math.pow(Math.max(0, Math.sin(f.phase * 2 + game.time * 1.6)), 3) * 0.7;
    const glow = c.createRadialGradient(x, y, 0, x, y, f.size * 8);
    glow.addColorStop(0, `rgba(239, 255, 172, ${0.5 * pulse})`);
    glow.addColorStop(0.38, `rgba(197, 243, 118, ${0.18 * pulse})`);
    glow.addColorStop(1, 'rgba(168, 230, 95, 0)');
    c.fillStyle = glow;
    c.beginPath();
    c.arc(x, y, f.size * 8, 0, TAU);
    c.fill();
    c.fillStyle = `rgba(249, 255, 204, ${0.8 * pulse})`;
    c.beginPath();
    c.arc(x, y, f.size, 0, TAU);
    c.fill();
  }

  // Embers curling up from the campfire.
  for (let i = 0; i < 12; i++) {
    const t = (game.time * 0.32 + i / 12) % 1;
    const x = CAMPFIRE.x + Math.sin(i * 2.7 + game.time * 2.1) * (7 + t * 18);
    const y = CAMPFIRE.y - 12 - t * 64;
    const a = (1 - t) * 0.55;
    c.fillStyle = `rgba(255, 174, 83, ${a})`;
    c.beginPath();
    c.arc(x, y, 0.8 + (1 - t) * 1.5, 0, TAU);
    c.fill();
  }

  c.restore();
}

function drawParticles() {
  const c = ctx;
  for (const p of game.particles) {
    const a = clamp(p.life / p.maxLife, 0, 1);
    c.save();
    c.globalAlpha = a;
    if (p.glow) {
      c.shadowColor = p.color;
      c.shadowBlur = 9;
    }
    c.fillStyle = p.color;
    c.beginPath();
    c.arc(p.x, p.y, p.size * (0.55 + a * 0.55), 0, TAU);
    c.fill();
    c.restore();
  }
}

function drawFloaters() {
  const c = ctx;
  c.save();
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (const f of game.floaters) {
    const a = clamp(f.life / f.maxLife, 0, 1);
    const rise = 1 - a;
    c.globalAlpha = Math.min(1, a * 2.2);
    c.font = `800 ${f.size}px "Trebuchet MS", "Segoe UI", sans-serif`;
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(3, 9, 5, 0.72)';
    c.strokeText(f.text, f.x, f.y - rise * 14);
    c.fillStyle = f.color;
    c.fillText(f.text, f.x, f.y - rise * 14);
  }
  c.restore();
}

function drawSlashes() {
  const c = ctx;
  for (const s of game.slashes) {
    const t = 1 - s.life / s.maxLife;
    c.save();
    c.translate(s.x, s.y);
    c.rotate(s.angle);
    c.globalAlpha = clamp(s.life / s.maxLife, 0, 1) * 0.85;
    c.strokeStyle = s.color;
    c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      c.lineWidth = 8 - i * 2.2;
      c.beginPath();
      c.arc(0, 0, s.radius * (0.55 + t * 0.26) - i * 2, -0.75 + t * 0.2, 0.75 + t * 0.2);
      c.stroke();
    }
    c.restore();
  }
}

function drawAttackSwing() {
  const p = game.player;
  if (!p || p.dead || p.attackTimer <= 0 || game.mode !== 'playing') return;
  const c = ctx;
  const t = clamp(1 - p.attackTimer / PLAYER_BASE.attackAnim, 0, 1);
  const start = p.facing - PLAYER_BASE.attackArc;
  const current = start + t * PLAYER_BASE.attackArc * 2;
  const alpha = Math.sin(t * Math.PI) * 0.9 + 0.08;

  c.save();
  c.translate(p.x, p.y);

  // Broad, readable swoosh trail.
  c.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const a0 = start + i * 0.06;
    const a1 = current - i * 0.035;
    if (a1 <= a0) continue;
    c.strokeStyle = `rgba(255, 245, 205, ${alpha * (0.18 - i * 0.025)})`;
    c.lineWidth = 17 - i * 3.2;
    c.beginPath();
    c.arc(0, -2, PLAYER_BASE.attackRange * 0.7, a0, a1);
    c.stroke();
  }
  c.strokeStyle = `rgba(255, 252, 229, ${alpha * 0.62})`;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, -2, PLAYER_BASE.attackRange * 0.7, start, current);
  c.stroke();

  // Steel blade at the current angle.
  c.rotate(current);
  const bladeStart = 22;
  const bladeEnd = 87;
  c.strokeStyle = 'rgba(232, 240, 241, 0.95)';
  c.lineWidth = 4.2;
  c.beginPath();
  c.moveTo(bladeStart, -2);
  c.lineTo(bladeEnd, -2);
  c.stroke();
  c.strokeStyle = 'rgba(255, 255, 241, 0.9)';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(bladeStart + 2, -3.4);
  c.lineTo(bladeEnd - 2, -3.4);
  c.stroke();
  c.fillStyle = '#c69a4e';
  c.fillRect(bladeStart - 5, -7, 4, 10);
  c.fillStyle = 'rgba(255, 250, 213, 0.9)';
  c.beginPath();
  c.arc(bladeEnd, -2, 3 + Math.sin(t * Math.PI) * 2.2, 0, TAU);
  c.fill();

  c.restore();
}

function drawScreenEffects() {
  const c = ctx;
  const w = game.view.w;
  const h = game.view.h;
  const p = game.player;

  if (!screenOverlay || screenOverlay.width !== Math.round(w) || screenOverlay.height !== Math.round(h)) {
    buildScreenOverlays();
  }

  // Cached varnish + vignette: one image blit instead of full-screen gradients.
  c.drawImage(screenOverlay, 0, 0, w, h);

  // Damage / low-health edge glow.
  let red = game.damageFlash * 0.65;
  if (p && !p.dead && p.hp / p.maxHp < 0.3) {
    red = Math.max(red, 0.14 + Math.sin(game.time * 5.2) * 0.06);
  }
  if (red > 0.005) {
    c.save();
    c.globalAlpha = clamp(red, 0, 1);
    c.drawImage(redOverlay, 0, 0, w, h);
    c.restore();
  }

  if (game.victoryFlash > 0) {
    c.save();
    c.globalAlpha = clamp(game.victoryFlash, 0, 1);
    c.drawImage(goldOverlay, 0, 0, w, h);
    c.restore();
  }
}

function drawEdgeMarkersFinal() {
  const p = game.player;
  if (!p || p.dead || game.mode !== 'playing') return;
  const c = ctx;
  const w = game.view.w;
  const h = game.view.h;
  const cam = game.camera;
  const zoom = cam.zoom || 1;
  const mx = Math.max(30, w * 0.05);
  const top = 84;
  const bottom = w < 760 ? 146 : 108;

  const targets = [];
  for (const e of game.enemies) {
    if (!e.dead) targets.push({ x: e.x, y: e.y, color: '255, 110, 92', size: 7.5, pulse: 0 });
  }
  if (game.chest && !game.chest.opened) {
    targets.push({ x: game.chest.x, y: game.chest.y, color: '255, 220, 124', size: 8, pulse: 1 });
  }

  for (const t of targets) {
    const sx = (t.x - cam.x) * zoom + w / 2;
    const sy = (t.y - cam.y) * zoom + h / 2;
    if (sx > mx + 16 && sx < w - mx - 16 && sy > top + 16 && sy < h - bottom - 16) continue;

    const cx = clamp(sx, mx, w - mx);
    const cy = clamp(sy, top, h - bottom);
    const angle = Math.atan2(sy - h / 2, sx - w / 2);
    const pulse = t.pulse ? 0.68 + Math.sin(game.time * 2.6) * 0.28 : 0.82;

    c.save();
    c.translate(cx, cy);
    c.rotate(angle);
    c.globalAlpha = pulse;

    const glow = c.createRadialGradient(0, 0, 0, 0, 0, 23);
    glow.addColorStop(0, `rgba(${t.color}, 0.28)`);
    glow.addColorStop(1, `rgba(${t.color}, 0)`);
    c.fillStyle = glow;
    c.beginPath();
    c.arc(0, 0, 23, 0, TAU);
    c.fill();

    c.fillStyle = `rgba(${t.color}, 0.96)`;
    c.strokeStyle = 'rgba(5, 12, 8, 0.65)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(t.size + 5, 0);
    c.lineTo(-t.size * 0.7, -t.size);
    c.lineTo(-t.size * 0.2, 0);
    c.lineTo(-t.size * 0.7, t.size);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }
}

function renderGame() {
  const c = ctx;
  const w = game.view.w;
  const h = game.view.h;
  const dpr = game.view.dpr;
  const cam = game.camera;
  const zoom = cam.zoom || 1;

  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = '#0a1810';
  c.fillRect(0, 0, w, h);

  c.save();
  c.translate(w / 2 + cam.shakeX, h / 2 + cam.shakeY);
  c.scale(zoom, zoom);
  c.translate(-cam.x, -cam.y);

  const viewW = w / zoom;
  const viewH = h / zoom;
  const left = Math.max(0, cam.x - viewW / 2 - 28);
  const top = Math.max(0, cam.y - viewH / 2 - 28);
  const right = Math.min(WORLD.w, cam.x + viewW / 2 + 28);
  const bottom = Math.min(WORLD.h, cam.y + viewH / 2 + 28);
  if (right > left && bottom > top) {
    c.drawImage(groundCanvas, left, top, right - left, bottom - top, left, top, right - left, bottom - top);
  }
  drawWaterRipples();
  drawLeaves();
  drawWorldCharacters();
  drawAttackSwing();
  drawSlashes();
  drawParticles();
  drawFloaters();
  drawFireflies();

  c.restore();

  drawScreenEffects();
  drawEdgeMarkersFinal();
}
