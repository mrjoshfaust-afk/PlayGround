/* =========================================================================
   HOLLOWWOOD — world rendering: trees, ruins, characters, and the chest
   ========================================================================= */

function drawTree(t, targetCtx, timeNow, swayOverride) {
  const c = targetCtx || ctx;
  const s = t.s;
  const now = timeNow == null ? game.time : timeNow;
  const sway = swayOverride == null ? Math.sin(now * 0.55 + t.seed) * 2.6 * s : swayOverride;

  c.save();
  c.translate(t.x, t.y);

  // Soft root shadow.
  c.fillStyle = 'rgba(2, 9, 5, 0.3)';
  c.beginPath();
  c.ellipse(2, 3, 27 * s, 9 * s, 0, 0, TAU);
  c.fill();

  // Trunk and roots.
  c.fillStyle = '#493522';
  c.beginPath();
  c.moveTo(-5 * s, 1);
  c.quadraticCurveTo(-4 * s, -16 * s, -3.2 * s, -34 * s);
  c.lineTo(3.4 * s, -34 * s);
  c.quadraticCurveTo(4.6 * s, -16 * s, 5 * s, 1);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(159, 120, 76, 0.28)';
  c.beginPath();
  c.moveTo(-2.6 * s, -2);
  c.quadraticCurveTo(-1.7 * s, -20 * s, -1.1 * s, -32 * s);
  c.lineTo(0.5 * s, -32 * s);
  c.lineTo(0.8 * s, -2);
  c.closePath();
  c.fill();

  c.strokeStyle = '#3d2b1c';
  c.lineWidth = 1.5 * s;
  c.beginPath();
  c.moveTo(-3 * s, -2);
  c.lineTo(-11 * s, 4);
  c.moveTo(3 * s, -2);
  c.lineTo(12 * s, 4);
  c.stroke();

  if (t.kind === 'pine') {
    const layers = [
      { y: -22, w: 25, h: 34, color: '#224a2c', light: '#2d5b36' },
      { y: -44, w: 20, h: 31, color: '#285631', light: '#376e3f' },
      { y: -64, w: 14, h: 28, color: '#315f37', light: '#457b47' }
    ];
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const off = sway * (1 + i * 0.28);
      const by = layer.y * s;
      const w = layer.w * s;
      const h = layer.h * s;
      c.fillStyle = layer.color;
      c.beginPath();
      c.moveTo(off, by - h);
      c.quadraticCurveTo(off + w * 0.28, by - h * 0.42, off + w, by + 5 * s);
      c.quadraticCurveTo(off + w * 0.28, by - 2 * s, off, by + 2 * s);
      c.quadraticCurveTo(off - w * 0.28, by - 2 * s, off - w, by + 5 * s);
      c.quadraticCurveTo(off - w * 0.28, by - h * 0.42, off, by - h);
      c.closePath();
      c.fill();

      c.fillStyle = layer.light;
      c.beginPath();
      c.moveTo(off, by - h);
      c.quadraticCurveTo(off + w * 0.19, by - h * 0.44, off + w * 0.42, by - h * 0.05);
      c.quadraticCurveTo(off + w * 0.1, by - h * 0.25, off - 1 * s, by - h * 0.02);
      c.quadraticCurveTo(off - w * 0.08, by - h * 0.4, off, by - h);
      c.closePath();
      c.fill();
    }
  } else {
    const dark = t.tint > 0.5 ? '#2a5232' : '#274b30';
    const mid = t.tint > 0.5 ? '#396a3e' : '#346039';
    const light = t.tint > 0.5 ? '#4c824a' : '#457844';
    const canopyY = -44 * s;
    const off = sway;

    c.fillStyle = dark;
    const blobs = [
      [-17, 5, 18], [16, 3, 17], [-4, -10, 22],
      [7, -25, 15], [-24, -10, 13], [24, -11, 12]
    ];
    for (const [bx, by, br] of blobs) {
      c.beginPath();
      c.arc(off + bx * s, canopyY + by * s, br * s, 0, TAU);
      c.fill();
    }

    c.fillStyle = mid;
    c.beginPath();
    c.ellipse(off - 5 * s, canopyY + 1 * s, 27 * s, 25 * s, 0.2, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(off + 14 * s, canopyY + 9 * s, 17 * s, 16 * s, -0.2, 0, TAU);
    c.fill();

    c.fillStyle = light;
    c.beginPath();
    c.ellipse(off - 10 * s, canopyY - 12 * s, 14 * s, 12 * s, 0.4, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(off + 18 * s, canopyY - 4 * s, 9 * s, 8 * s, -0.3, 0, TAU);
    c.fill();

    c.fillStyle = 'rgba(127, 170, 96, 0.42)';
    for (let i = 0; i < 7; i++) {
      const a = t.seed + i * 1.7;
      c.beginPath();
      c.arc(off + Math.cos(a) * 21 * s, canopyY + Math.sin(a) * 19 * s, 2.1 * s, 0, TAU);
      c.fill();
    }
  }

  // A few deep shadow accents under the canopy.
  c.fillStyle = 'rgba(4, 17, 9, 0.22)';
  c.beginPath();
  c.ellipse(-10 * s, -31 * s, 11 * s, 6 * s, 0.2, 0, TAU);
  c.fill();

  c.restore();
}

function drawRock(r, targetCtx) {
  const c = targetCtx || ctx;
  const s = r.s;
  c.save();
  c.translate(r.x, r.y);
  c.fillStyle = 'rgba(2, 9, 5, 0.28)';
  c.beginPath();
  c.ellipse(2, 3, 17 * s, 6 * s, 0, 0, TAU);
  c.fill();

  const pts = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + r.seed;
    const rr = (13 + ((i * 7 + 3) % 5)) * s;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.62 - 3 * s]);
  }
  c.fillStyle = r.shade > 0.5 ? '#6b7167' : '#60685f';
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(30, 36, 31, 0.7)';
  c.lineWidth = 1.4;
  c.stroke();

  c.fillStyle = 'rgba(164, 169, 151, 0.42)';
  c.beginPath();
  c.moveTo(pts[0][0] * 0.75, pts[0][1] - 3 * s);
  c.lineTo(pts[1][0] * 0.55, pts[1][1] - 4 * s);
  c.lineTo(pts[2][0] * 0.3, pts[2][1] - 1 * s);
  c.lineTo(pts[0][0] * 0.3, pts[0][1] + 2 * s);
  c.closePath();
  c.fill();

  c.fillStyle = 'rgba(87, 110, 64, 0.38)';
  c.beginPath();
  c.ellipse(-3 * s, 1 * s, 5 * s, 2.3 * s, 0.2, 0, TAU);
  c.fill();
  c.restore();
}

function drawTent(targetCtx) {
  const c = targetCtx || ctx;
  const x = TENT.x;
  const y = TENT.y;
  c.save();
  c.translate(x, y);
  c.fillStyle = 'rgba(2, 9, 5, 0.28)';
  c.beginPath();
  c.ellipse(5, 6, 43, 12, 0, 0, TAU);
  c.fill();

  c.fillStyle = '#614d33';
  c.beginPath();
  c.moveTo(-38, 4);
  c.lineTo(0, -48);
  c.lineTo(38, 4);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(45, 34, 22, 0.8)';
  c.lineWidth = 2;
  c.stroke();

  c.fillStyle = '#7b6241';
  c.beginPath();
  c.moveTo(-30, 2);
  c.lineTo(0, -42);
  c.lineTo(0, 2);
  c.closePath();
  c.fill();
  c.fillStyle = '#4a3824';
  c.beginPath();
  c.moveTo(0, 2);
  c.lineTo(0, -42);
  c.lineTo(29, 2);
  c.closePath();
  c.fill();

  c.fillStyle = '#281c12';
  c.beginPath();
  c.moveTo(0, 2);
  c.lineTo(0, -24);
  c.lineTo(10, 2);
  c.closePath();
  c.fill();

  c.strokeStyle = '#9c8154';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, -48);
  c.lineTo(0, -56);
  c.moveTo(-38, 4);
  c.lineTo(-44, 8);
  c.moveTo(38, 4);
  c.lineTo(44, 8);
  c.stroke();
  c.restore();
}

function drawCampfire() {
  const c = ctx;
  const x = CAMPFIRE.x;
  const y = CAMPFIRE.y;
  const flicker = Math.sin(game.time * 8.3) * 0.12 + Math.sin(game.time * 13.7) * 0.06;

  c.save();
  c.translate(x, y);

  const glow = c.createRadialGradient(0, -5, 3, 0, -5, 94);
  glow.addColorStop(0, 'rgba(255, 168, 70, 0.26)');
  glow.addColorStop(0.42, 'rgba(255, 130, 46, 0.09)');
  glow.addColorStop(1, 'rgba(255, 120, 30, 0)');
  c.fillStyle = glow;
  c.beginPath();
  c.arc(0, -5, 94, 0, TAU);
  c.fill();

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    c.fillStyle = i % 2 ? '#696c60' : '#75786a';
    c.beginPath();
    c.ellipse(Math.cos(a) * 22, Math.sin(a) * 11 + 3, 6.5, 4.3, a, 0, TAU);
    c.fill();
  }

  c.strokeStyle = '#4a2f1b';
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-12, 3);
  c.lineTo(12, -6);
  c.moveTo(-11, -5);
  c.lineTo(13, 4);
  c.stroke();

  c.fillStyle = '#ff9e3d';
  c.beginPath();
  c.moveTo(-8, 0);
  c.quadraticCurveTo(-11 + flicker * 7, -17, 0, -30 - flicker * 5);
  c.quadraticCurveTo(11 + flicker * 4, -16, 8, 0);
  c.closePath();
  c.fill();
  c.fillStyle = '#ffe38a';
  c.beginPath();
  c.moveTo(-4, 0);
  c.quadraticCurveTo(-5, -11, 1, -19 - flicker * 4);
  c.quadraticCurveTo(7, -10, 5, 0);
  c.closePath();
  c.fill();

  c.restore();
}

function drawChest() {
  const chest = game.chest;
  if (!chest) return;
  const c = ctx;
  const open = chest.openT;
  const bob = Math.sin(game.time * 1.8 + chest.glow) * 1.2;

  c.save();
  c.translate(chest.x, chest.y + bob);

  // Ground shadow.
  c.fillStyle = 'rgba(2, 9, 5, 0.35)';
  c.beginPath();
  c.ellipse(0, 13, 31, 9, 0, 0, TAU);
  c.fill();

  if (!chest.opened) {
    const pulse = 0.55 + Math.sin(game.time * 2.3) * 0.2;
    const glow = c.createRadialGradient(0, -6, 3, 0, -6, 62);
    glow.addColorStop(0, `rgba(255, 222, 125, ${0.18 * pulse})`);
    glow.addColorStop(0.55, `rgba(230, 193, 104, ${0.08 * pulse})`);
    glow.addColorStop(1, 'rgba(230, 193, 104, 0)');
    c.fillStyle = glow;
    c.beginPath();
    c.arc(0, -6, 62, 0, TAU);
    c.fill();
  }

  // Chest base.
  const bodyGrad = c.createLinearGradient(0, -8, 0, 16);
  bodyGrad.addColorStop(0, '#83552e');
  bodyGrad.addColorStop(0.55, '#6d4526');
  bodyGrad.addColorStop(1, '#452817');
  c.fillStyle = bodyGrad;
  roundRectPath(c, -26, -7, 52, 25, 4);
  c.fill();
  c.strokeStyle = '#2f1b0d';
  c.lineWidth = 2;
  c.stroke();

  c.strokeStyle = '#b48e4d';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-14, -7);
  c.lineTo(-14, 18);
  c.moveTo(14, -7);
  c.lineTo(14, 18);
  c.stroke();

  // Lid, hinged at the back.
  c.save();
  c.translate(0, -7);
  c.rotate(-open * 1.05);
  const lidGrad = c.createLinearGradient(0, -18, 0, 2);
  lidGrad.addColorStop(0, '#9b6b39');
  lidGrad.addColorStop(0.55, '#7a4c2a');
  lidGrad.addColorStop(1, '#56351e');
  c.fillStyle = lidGrad;
  roundRectPath(c, -26, -16, 52, 18, 6);
  c.fill();
  c.strokeStyle = '#2f1b0d';
  c.lineWidth = 2;
  c.stroke();
  c.strokeStyle = '#b48e4d';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-14, -15);
  c.lineTo(-14, 1);
  c.moveTo(14, -15);
  c.lineTo(14, 1);
  c.stroke();
  c.restore();

  // Lock plate.
  c.fillStyle = '#d4ae5d';
  c.beginPath();
  c.arc(0, -3, 5, 0, TAU);
  c.fill();
  c.fillStyle = '#3b290f';
  c.beginPath();
  c.arc(0, -3, 1.8, 0, TAU);
  c.fill();

  if (chest.opened) {
    const inner = c.createRadialGradient(0, -2, 1, 0, -2, 29);
    inner.addColorStop(0, 'rgba(255, 238, 164, 0.45)');
    inner.addColorStop(1, 'rgba(255, 220, 110, 0)');
    c.fillStyle = inner;
    c.beginPath();
    c.arc(0, -2, 29, 0, TAU);
    c.fill();
  } else {
    c.fillStyle = `rgba(255, 238, 178, ${0.55 + Math.sin(game.time * 3) * 0.22})`;
    c.font = '15px Georgia, serif';
    c.textAlign = 'center';
    c.fillText('✦', 0, -27 + Math.sin(game.time * 2.2) * 2);
  }

  c.restore();
}

function drawPotionPickup(item) {
  const c = ctx;
  const bob = Math.sin(game.time * 2.2 + item.seed) * 3;
  c.save();
  c.translate(item.x, item.y + bob);

  c.fillStyle = 'rgba(3, 11, 6, 0.3)';
  c.beginPath();
  c.ellipse(0, 12 - bob, 13, 5, 0, 0, TAU);
  c.fill();

  const glow = c.createRadialGradient(0, 0, 2, 0, 0, 30);
  glow.addColorStop(0, 'rgba(132, 255, 154, 0.24)');
  glow.addColorStop(1, 'rgba(90, 220, 120, 0)');
  c.fillStyle = glow;
  c.beginPath();
  c.arc(0, 0, 30, 0, TAU);
  c.fill();

  c.fillStyle = '#d6e4cf';
  c.fillRect(-3, -13, 6, 5);
  c.fillStyle = '#8a5d35';
  c.fillRect(-4, -16, 8, 3);
  c.fillStyle = 'rgba(214, 236, 216, 0.55)';
  roundRectPath(c, -8, -9, 16, 18, 6);
  c.fill();
  c.fillStyle = '#53d575';
  roundRectPath(c, -6, -1, 12, 10, 4);
  c.fill();
  c.fillStyle = 'rgba(220, 255, 220, 0.75)';
  c.beginPath();
  c.ellipse(-3, -4, 2.1, 5, -0.2, 0, TAU);
  c.fill();

  c.fillStyle = 'rgba(197, 255, 188, 0.8)';
  c.beginPath();
  c.arc(8, -12, 1.4, 0, TAU);
  c.fill();
  c.restore();
}

function drawGoldDrop(drop) {
  const c = ctx;
  const bob = Math.sin(game.time * 6 + drop.phase) * 1.6;
  c.save();
  c.translate(drop.x, drop.y + bob);
  c.fillStyle = 'rgba(3, 10, 6, 0.25)';
  c.beginPath();
  c.ellipse(0, 5, 5, 2, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#d8a83e';
  c.beginPath();
  c.arc(0, 0, 4.2, 0, TAU);
  c.fill();
  c.strokeStyle = '#f8de83';
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(0, 0, 3.2, 0, TAU);
  c.stroke();
  c.fillStyle = 'rgba(255, 251, 204, 0.8)';
  c.beginPath();
  c.arc(-1.2, -1.3, 1, 0, TAU);
  c.fill();
  c.restore();
}

function drawPlayer() {
  const p = game.player;
  if (!p) return;
  const c = ctx;
  const deadAlpha = p.dead ? Math.max(0, 1 - p.deathT * 0.65) : 1;
  if (deadAlpha <= 0) return;
  const bob = p.moving && !p.dead ? Math.sin(p.walkPhase * 2) * 1.6 : Math.sin(game.time * 2.1) * 0.55;

  c.save();
  c.globalAlpha = deadAlpha;
  c.translate(p.x, p.y);

  // Shadow stays flat while the body rotates.
  c.fillStyle = 'rgba(2, 9, 5, 0.34)';
  c.beginPath();
  c.ellipse(0, 5, 19, 8, 0, 0, TAU);
  c.fill();

  if (p.dead) {
    c.rotate(p.facing + p.deathT * 1.1);
    c.globalAlpha = deadAlpha * 0.78;
  } else {
    c.rotate(p.facing);
    c.translate(0, bob);
  }

  // Cape trailing behind.
  const capeWave = Math.sin(game.time * 3.2) * 2;
  c.fillStyle = '#6b2629';
  c.beginPath();
  c.moveTo(-7, -10);
  c.quadraticCurveTo(-22, -8 + capeWave, -29, 0);
  c.quadraticCurveTo(-21, 9 - capeWave, -7, 10);
  c.closePath();
  c.fill();
  c.strokeStyle = '#43171b';
  c.lineWidth = 1;
  c.stroke();

  // Feet.
  const step = p.moving ? Math.sin(p.walkPhase) * 4.6 : 0;
  c.fillStyle = '#2a201a';
  c.beginPath();
  c.ellipse(-8 + step, -6, 5.4, 3.5, 0, 0, TAU);
  c.fill();
  c.beginPath();
  c.ellipse(-8 - step, 6, 5.4, 3.5, 0, 0, TAU);
  c.fill();

  // Body armour.
  const body = c.createLinearGradient(-10, -11, 12, 11);
  body.addColorStop(0, '#64809a');
  body.addColorStop(0.5, '#3e5a72');
  body.addColorStop(1, '#26394b');
  c.fillStyle = body;
  c.beginPath();
  c.ellipse(0, 0, 13, 10.5, 0, 0, TAU);
  c.fill();
  c.strokeStyle = '#172733';
  c.lineWidth = 1.4;
  c.stroke();

  // Leather belt and chest highlight.
  c.strokeStyle = '#7d5c34';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-5, -8);
  c.lineTo(-5, 8);
  c.stroke();
  c.strokeStyle = 'rgba(203, 224, 232, 0.4)';
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(1, 0, 7, -1.1, 1.1);
  c.stroke();

  // Shoulder plates.
  c.fillStyle = '#839aab';
  c.beginPath();
  c.ellipse(2, -10, 6, 3.8, -0.3, 0, TAU);
  c.fill();
  c.beginPath();
  c.ellipse(2, 10, 6, 3.8, 0.3, 0, TAU);
  c.fill();

  // Shield on the left arm.
  c.save();
  c.translate(-1, -13);
  c.fillStyle = '#6e4b28';
  c.beginPath();
  c.arc(0, 0, 7, 0, TAU);
  c.fill();
  c.fillStyle = '#a9b7b2';
  c.beginPath();
  c.arc(0, 0, 5.2, 0, TAU);
  c.fill();
  c.fillStyle = '#e0c36e';
  c.beginPath();
  c.arc(0, 0, 1.9, 0, TAU);
  c.fill();
  c.restore();

  // Head and helmet.
  c.fillStyle = '#d8b184';
  c.beginPath();
  c.arc(10, 0, 7, 0, TAU);
  c.fill();
  c.fillStyle = '#526978';
  c.beginPath();
  c.arc(9.3, 0, 7, Math.PI * 0.48, Math.PI * 1.52);
  c.fill();
  c.fillStyle = '#9eb3bd';
  c.beginPath();
  c.arc(10.4, -2.5, 2.4, 0, TAU);
  c.fill();
  c.fillStyle = '#2b1c14';
  c.beginPath();
  c.arc(13.7, -2.1, 1, 0, TAU);
  c.fill();

  // Sword at rest.
  if (p.attackTimer <= 0 && !p.dead) {
    c.save();
    c.translate(0, 12);
    c.rotate(-0.38);
    c.strokeStyle = '#d7dde0';
    c.lineWidth = 2.7;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(24, 0);
    c.stroke();
    c.strokeStyle = '#f7f5df';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(1, -0.8);
    c.lineTo(22, -0.8);
    c.stroke();
    c.fillStyle = '#b98b45';
    c.fillRect(-1, -4, 3, 8);
    c.fillStyle = '#55321c';
    c.fillRect(-6, -1.6, 5, 3.2);
    c.restore();
  }

  c.restore();

  // Invulnerability shield ring.
  if (p.invuln > 0 && !p.dead) {
    const a = clamp(p.invuln / PLAYER_BASE.invulnTime, 0, 1);
    c.save();
    c.strokeStyle = `rgba(255, 233, 165, ${a * 0.5})`;
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(p.x, p.y - 3, p.r + 13 + Math.sin(game.time * 18) * 2, 0, TAU);
    c.stroke();
    c.restore();
  }

  if (p.hurtFlash > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = `rgba(255, 88, 70, ${p.hurtFlash * 0.5})`;
    c.beginPath();
    c.arc(p.x, p.y, p.r + 8, 0, TAU);
    c.fill();
    c.restore();
  }
}

function drawGoblin(c, e, walk) {
  // Feet.
  c.fillStyle = '#28341c';
  c.beginPath();
  c.ellipse(-7 + walk, -5, 4.7, 3.1, 0, 0, TAU);
  c.fill();
  c.beginPath();
  c.ellipse(-7 - walk, 5, 4.7, 3.1, 0, 0, TAU);
  c.fill();

  // Body.
  const body = c.createLinearGradient(-9, -9, 9, 9);
  body.addColorStop(0, '#7ba64f');
  body.addColorStop(0.55, '#5d813d');
  body.addColorStop(1, '#3b5528');
  c.fillStyle = body;
  c.beginPath();
  c.ellipse(0, 0, 10.5, 8.5, 0, 0, TAU);
  c.fill();
  c.strokeStyle = '#2a3e1c';
  c.lineWidth = 1.1;
  c.stroke();

  // Arms.
  c.fillStyle = '#6d9747';
  c.beginPath();
  c.ellipse(1, -9.5, 5.5, 3.1, 0.2, 0, TAU);
  c.fill();
  c.beginPath();
  c.ellipse(1, 9.5, 5.5, 3.1, -0.2, 0, TAU);
  c.fill();

  // Head.
  c.fillStyle = '#83ae54';
  c.beginPath();
  c.arc(9, 0, 7.6, 0, TAU);
  c.fill();
  c.strokeStyle = '#314920';
  c.lineWidth = 1;
  c.stroke();

  // Long ears.
  c.fillStyle = '#6c9545';
  c.beginPath();
  c.moveTo(6, -6);
  c.lineTo(-1, -15);
  c.lineTo(2, -4);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(6, 6);
  c.lineTo(-1, 15);
  c.lineTo(2, 4);
  c.closePath();
  c.fill();

  // Eyes and snout.
  c.fillStyle = '#f2da74';
  c.beginPath();
  c.arc(12, -2.8, 1.9, 0, TAU);
  c.fill();
  c.beginPath();
  c.arc(12, 2.8, 1.9, 0, TAU);
  c.fill();
  c.fillStyle = '#2a1d12';
  c.beginPath();
  c.arc(12.7, -2.8, 0.85, 0, TAU);
  c.fill();
  c.beginPath();
  c.arc(12.7, 2.8, 0.85, 0, TAU);
  c.fill();
  c.strokeStyle = '#3a4b24';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(14.5, 1.6);
  c.lineTo(16.7, 0);
  c.lineTo(14.5, -1.6);
  c.stroke();

  // Rusty dagger.
  c.strokeStyle = '#a8a99a';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(1, 11);
  c.lineTo(15, 15);
  c.stroke();
  c.fillStyle = '#5e3f22';
  c.fillRect(-1, 10, 4, 4);
}

function drawWolf(c, e, walk) {
  // Legs.
  c.fillStyle = '#3d484c';
  const legSpots = [[-10, -8], [8, -9], [-10, 8], [8, 9]];
  for (let i = 0; i < 4; i++) {
    const [lx, ly] = legSpots[i];
    c.beginPath();
    c.ellipse(lx + (i % 2 ? walk : -walk), ly, 3.8, 2.3, 0.15, 0, TAU);
    c.fill();
  }

  // Tail.
  c.strokeStyle = '#48555a';
  c.lineWidth = 4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-15, 0);
  c.quadraticCurveTo(-25, -4 + Math.sin(game.time * 4 + e.seed) * 3, -29, -10);
  c.stroke();

  // Body.
  const body = c.createLinearGradient(-14, -12, 14, 12);
  body.addColorStop(0, '#879394');
  body.addColorStop(0.5, '#667477');
  body.addColorStop(1, '#3f4b4f');
  c.fillStyle = body;
  c.beginPath();
  c.ellipse(-2, 0, 17, 10, 0, 0, TAU);
  c.fill();
  c.strokeStyle = '#2c3538';
  c.lineWidth = 1.1;
  c.stroke();

  // Back stripe.
  c.strokeStyle = 'rgba(42, 52, 55, 0.7)';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-12, -1);
  c.quadraticCurveTo(-2, -5, 8, -2);
  c.stroke();

  // Head.
  c.fillStyle = '#7d8a8c';
  c.beginPath();
  c.arc(14, 0, 8.2, 0, TAU);
  c.fill();
  c.strokeStyle = '#2e383b';
  c.lineWidth = 1;
  c.stroke();

  // Ears.
  c.fillStyle = '#586568';
  c.beginPath();
  c.moveTo(9, -6);
  c.lineTo(10, -14);
  c.lineTo(15, -6);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(9, 6);
  c.lineTo(10, 14);
  c.lineTo(15, 6);
  c.closePath();
  c.fill();

  // Snout and eyes.
  c.fillStyle = '#8e9a99';
  c.beginPath();
  c.ellipse(20, 0, 5.5, 4.1, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#1d1510';
  c.beginPath();
  c.arc(24.6, 0, 1.7, 0, TAU);
  c.fill();
  c.fillStyle = '#ffcf5e';
  c.beginPath();
  c.arc(16.4, -3.6, 1.55, 0, TAU);
  c.fill();
  c.beginPath();
  c.arc(16.4, 3.6, 1.55, 0, TAU);
  c.fill();
  c.fillStyle = '#241a11';
  c.beginPath();
  c.arc(16.9, -3.6, 0.7, 0, TAU);
  c.fill();
  c.beginPath();
  c.arc(16.9, 3.6, 0.7, 0, TAU);
  c.fill();
}

function drawOrc(c, e, walk) {
  // Feet.
  c.fillStyle = '#2a2e19';
  c.beginPath();
  c.ellipse(-9 + walk, -8, 6.4, 4.1, 0, 0, TAU);
  c.fill();
  c.beginPath();
  c.ellipse(-9 - walk, 8, 6.4, 4.1, 0, 0, TAU);
  c.fill();

  // Body.
  const body = c.createLinearGradient(-12, -14, 13, 14);
  body.addColorStop(0, '#8b975b');
  body.addColorStop(0.5, '#687440');
  body.addColorStop(1, '#434b28');
  c.fillStyle = body;
  c.beginPath();
  c.ellipse(0, 0, 16, 14, 0, 0, TAU);
  c.fill();
  c.strokeStyle = '#30371b';
  c.lineWidth = 1.4;
  c.stroke();

  // Leather harness.
  c.strokeStyle = '#533b22';
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(-7, -12);
  c.lineTo(4, 12);
  c.stroke();

  // Shoulder plates.
  c.fillStyle = '#585e3a';
  c.beginPath();
  c.ellipse(1, -14, 8, 5.5, -0.25, 0, TAU);
  c.fill();
  c.beginPath();
  c.ellipse(1, 14, 8, 5.5, 0.25, 0, TAU);
  c.fill();
  c.strokeStyle = '#383d24';
  c.lineWidth = 1.2;
  c.stroke();

  // Head.
  c.fillStyle = '#93a25e';
  c.beginPath();
  c.arc(12, 0, 9, 0, TAU);
  c.fill();
  c.strokeStyle = '#3c441f';
  c.lineWidth = 1.2;
  c.stroke();

  // Mohawk.
  c.fillStyle = '#3d2e1d';
  c.beginPath();
  c.moveTo(4, -7);
  c.lineTo(9, -13);
  c.lineTo(13, -7);
  c.lineTo(17, -12);
  c.lineTo(20, -5);
  c.closePath();
  c.fill();

  // Jaw and tusks.
  c.fillStyle = '#7e8a4f';
  c.beginPath();
  c.ellipse(17, 0, 5.2, 4.2, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#f1e6c4';
  c.beginPath();
  c.moveTo(18, -3);
  c.lineTo(20, -7);
  c.lineTo(20.7, -2.5);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(18, 3);
  c.lineTo(20, 7);
  c.lineTo(20.7, 2.5);
  c.closePath();
  c.fill();

  // Eyes.
  c.fillStyle = '#ffce61';
  c.beginPath();
  c.arc(15, -3.7, 1.8, 0, TAU);
  c.fill();
  c.beginPath();
  c.arc(15, 3.7, 1.8, 0, TAU);
  c.fill();
  c.fillStyle = '#2e1b11';
  c.beginPath();
  c.arc(15.7, -3.7, 0.8, 0, TAU);
  c.fill();
  c.beginPath();
  c.arc(15.7, 3.7, 0.8, 0, TAU);
  c.fill();

  // Heavy cleaver.
  c.save();
  c.translate(0, 17);
  c.rotate(0.18);
  c.fillStyle = '#5a3b1f';
  c.fillRect(-2, -2, 6, 4);
  c.fillStyle = '#a5aaa4';
  c.beginPath();
  c.moveTo(4, -4);
  c.lineTo(23, -6);
  c.lineTo(27, 3);
  c.lineTo(5, 4);
  c.closePath();
  c.fill();
  c.strokeStyle = '#5c625d';
  c.lineWidth = 1;
  c.stroke();
  c.restore();
}

function drawEnemy(e) {
  const c = ctx;
  if (e.dead && e.deathT > 1.1) return;
  const alpha = e.dead ? Math.max(0, 1 - e.deathT / 1.1) : 1;
  if (alpha <= 0) return;
  const bob = e.dead ? 0 : Math.sin(e.walkPhase * 2 + e.seed) * 1.3;
  const walk = e.dead ? 0 : Math.sin(e.walkPhase) * 4;

  c.save();
  c.globalAlpha = alpha;
  c.translate(e.x, e.y);

  c.fillStyle = 'rgba(2, 9, 5, 0.32)';
  c.beginPath();
  c.ellipse(0, 6, e.r + 7, e.r * 0.44, 0, 0, TAU);
  c.fill();

  if (e.dead) {
    c.rotate(e.facing + e.deathT * 0.8);
    c.globalAlpha = alpha * 0.72;
  } else {
    c.rotate(e.facing);
    c.translate(0, bob);
  }

  if (e.type === 'goblin') drawGoblin(c, e, walk);
  else if (e.type === 'wolf') drawWolf(c, e, walk);
  else drawOrc(c, e, walk);

  if (e.hitFlash > 0) {
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = `rgba(255, 247, 218, ${e.hitFlash * 3.1})`;
    c.beginPath();
    c.ellipse(0, 0, e.r + 5, e.r * 0.85, 0, 0, TAU);
    c.fill();
  }

  c.restore();

  if (!e.dead && e.state === 'windup') {
    const pulse = 0.45 + Math.sin(game.time * 28) * 0.18;
    c.save();
    c.strokeStyle = `rgba(255, 105, 84, ${pulse})`;
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(e.x, e.y, e.r + 8, 0, TAU);
    c.stroke();
    c.restore();
  }
}

function drawEnemyHealthBar(e) {
  if (e.dead) return;
  const c = ctx;
  const max = e.type === 'orc' ? 54 : 42;
  const w = max;
  const h = 5;
  const x = e.x - w / 2;
  const y = e.y - e.r - (e.type === 'orc' ? 40 : 31);
  const ratio = clamp(e.hp / e.maxHp, 0, 1);

  c.save();
  c.fillStyle = 'rgba(4, 10, 6, 0.72)';
  roundRectPath(c, x - 1, y - 1, w + 2, h + 2, 3);
  c.fill();
  c.fillStyle = ratio > 0.55 ? '#6fcf72' : ratio > 0.28 ? '#e0b64d' : '#e25b4b';
  roundRectPath(c, x, y, Math.max(2, w * ratio), h, 2.5);
  c.fill();
  c.fillStyle = 'rgba(255, 255, 255, 0.32)';
  c.fillRect(x + 1, y + 1, Math.max(0, w * ratio - 2), 1);
  c.restore();
}

let tentSprite = null;

function prepareWorldSprites() {
  for (const tree of game.trees) {
    if (tree.sprite) continue;
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const g = canvas.getContext('2d');
    g.translate(100, 170);
    drawTree(tree, g, 0, 0);
    tree.sprite = { canvas, ox: 100, oy: 170 };
  }

  for (const rock of game.rocks) {
    if (rock.sprite) continue;
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const g = canvas.getContext('2d');
    g.translate(50, 70);
    drawRock(rock, g);
    rock.sprite = { canvas, ox: 50, oy: 70 };
  }

  if (!tentSprite) {
    const canvas = document.createElement('canvas');
    canvas.width = 130;
    canvas.height = 120;
    const g = canvas.getContext('2d');
    g.translate(65, 100);
    drawTent(g);
    tentSprite = { canvas, ox: 65, oy: 100 };
  }
}

function drawTreeSprite(t) {
  if (!t.sprite) return drawTree(t);
  ctx.drawImage(t.sprite.canvas, t.x - t.sprite.ox, t.y - t.sprite.oy);
}

function drawRockSprite(r) {
  if (!r.sprite) return drawRock(r);
  ctx.drawImage(r.sprite.canvas, r.x - r.sprite.ox, r.y - r.sprite.oy);
}

function drawTentSprite() {
  if (!tentSprite) return drawTent();
  ctx.drawImage(tentSprite.canvas, TENT.x - tentSprite.ox, TENT.y - tentSprite.oy);
}

function inWorldView(x, y, padX = 70, padTop = 120, padBottom = 40) {
  const zoom = game.camera.zoom || 1;
  const halfW = game.view.w / (2 * zoom);
  const halfH = game.view.h / (2 * zoom);
  return x > game.camera.x - halfW - padX &&
    x < game.camera.x + halfW + padX &&
    y > game.camera.y - halfH - padTop &&
    y < game.camera.y + halfH + padBottom;
}

function drawWorldCharacters() {
  // Telegraphs sit beneath the actors so the characters stay readable.
  for (const e of game.enemies) {
    if (e.dead || e.state !== 'windup') continue;
    if (!inWorldView(e.x, e.y, 120, 120, 120)) continue;
    const progress = 1 - e.windupT / e.windup;
    ctx.save();
    ctx.translate(e.x, e.y);
    const sector = ctx.createRadialGradient(0, 0, 4, 0, 0, e.range + 12);
    sector.addColorStop(0, `rgba(255, 80, 64, ${0.05 + progress * 0.13})`);
    sector.addColorStop(1, 'rgba(255, 80, 64, 0)');
    ctx.fillStyle = sector;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, e.range + 15, e.facing - 0.93, e.facing + 0.93);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 132, 105, ${0.25 + progress * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, e.range + 12, e.facing - 0.93, e.facing + 0.93);
    ctx.stroke();
    ctx.restore();
  }

  const drawables = [];
  for (const t of game.trees) {
    if (inWorldView(t.x, t.y, 85, 175, 35)) {
      drawables.push({ y: t.y, draw: () => drawTreeSprite(t) });
    }
  }
  for (const r of game.rocks) {
    if (inWorldView(r.x, r.y, 55, 60, 25)) {
      drawables.push({ y: r.y, draw: () => drawRockSprite(r) });
    }
  }
  if (inWorldView(CAMPFIRE.x, CAMPFIRE.y, 120, 130, 60)) {
    drawables.push({ y: CAMPFIRE.y, draw: drawCampfire });
  }
  if (inWorldView(TENT.x, TENT.y, 100, 120, 50)) {
    drawables.push({ y: TENT.y, draw: drawTentSprite });
  }
  if (inWorldView(game.chest.x, game.chest.y, 100, 110, 50)) {
    drawables.push({ y: game.chest.y, draw: drawChest });
  }
  for (const item of game.pickups) {
    if (inWorldView(item.x, item.y, 50, 60, 30)) {
      drawables.push({ y: item.y, draw: () => drawPotionPickup(item) });
    }
  }
  for (const drop of game.drops) {
    if (inWorldView(drop.x, drop.y, 30, 30, 20)) {
      drawables.push({ y: drop.y, draw: () => drawGoldDrop(drop) });
    }
  }
  for (const e of game.enemies) {
    if (!e.dead || e.deathT < 1.1) drawables.push({ y: e.y, draw: () => drawEnemy(e) });
  }
  if (game.player) drawables.push({ y: game.player.y, draw: drawPlayer });

  drawables.sort((a, b) => a.y - b.y);
  for (const item of drawables) item.draw();

  if (game.mode !== 'menu') {
    for (const e of game.enemies) drawEnemyHealthBar(e);
  }
}
