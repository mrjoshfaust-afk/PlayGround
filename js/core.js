/* =========================================================================
   HOLLOWWOOD — core constants, utilities, sound, map, and state
   Vanilla Canvas 2D. No external assets or build step.
   ========================================================================= */

const WORLD = Object.freeze({ w: 1600, h: 1200, margin: 30 });
const TAU = Math.PI * 2;

const PLAYER_BASE = Object.freeze({
  maxHp: 100,
  speed: 210,
  radius: 15,
  attackRange: 112,
  attackArc: 1.16,
  attackCooldown: 0.4,
  attackAnim: 0.3,
  baseDamage: 18,
  potionHeal: 35,
  invulnTime: 0.62
});

const ENEMY_TYPES = Object.freeze({
  goblin: {
    name: 'Mire Goblin',
    short: 'Goblin',
    hp: 52,
    speed: 98,
    radius: 15,
    damage: 7,
    range: 48,
    aggro: 300,
    windup: 0.34,
    cooldown: 1.05,
    goldMin: 2,
    goldMax: 5,
    color: '#6f9b48',
    dark: '#365226'
  },
  wolf: {
    name: 'Gloom Wolf',
    short: 'Wolf',
    hp: 46,
    speed: 142,
    radius: 17,
    damage: 6,
    range: 52,
    aggro: 350,
    windup: 0.26,
    cooldown: 0.8,
    goldMin: 3,
    goldMax: 6,
    color: '#738081',
    dark: '#343f43'
  },
  orc: {
    name: 'Moss Orc',
    short: 'Orc',
    hp: 112,
    speed: 66,
    radius: 22,
    damage: 15,
    range: 64,
    aggro: 310,
    windup: 0.58,
    cooldown: 1.55,
    goldMin: 5,
    goldMax: 9,
    color: '#7d8a4b',
    dark: '#3e4522'
  }
});

const ENEMY_SPAWNS = Object.freeze([
  { type: 'goblin', x: 470, y: 646 },
  { type: 'wolf', x: 1046, y: 780 },
  { type: 'orc', x: 956, y: 332 }
]);

const POTION_SPAWNS = Object.freeze([
  { x: 352, y: 862 },
  { x: 1334, y: 982 }
]);

const PLAYER_SPAWN = Object.freeze({ x: 806, y: 1002 });
const CHEST_SPAWN = Object.freeze({ x: 1212, y: 392 });
const CAMPFIRE = Object.freeze({ x: 676, y: 1042 });
const TENT = Object.freeze({ x: 584, y: 1076 });
const POND = Object.freeze({ x: 1392, y: 1146, rx: 132, ry: 94, collisionR: 98 });

// --------------------------------------------------------------- utilities

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI * 3) % TAU) - Math.PI;
  return a + d * t;
}

function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDelta(a, b) {
  let d = ((b - a + Math.PI * 3) % TAU) - Math.PI;
  return d;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundRectPath(c, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + radius, y);
  c.arcTo(x + w, y, x + w, y + h, radius);
  c.arcTo(x + w, y + h, x, y + h, radius);
  c.arcTo(x, y + h, x, y, radius);
  c.arcTo(x, y, x + w, y, radius);
  c.closePath();
}

// ------------------------------------------------------------------ sound

const Sound = {
  enabled: true,
  ctx: null,
  master: null,
  noiseBuffer: null,

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.24;
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this.createNoise(1);
      try {
        const saved = localStorage.getItem('hollowwood-muted');
        if (saved === '1') this.enabled = false;
      } catch (_) {}
    } catch (_) {
      this.ctx = null;
    }
  },

  createNoise(seconds) {
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  },

  tone(freq, duration, type, volume, glide) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, glide), t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  },

  noise(volume, duration, frequency, q) {
    if (!this.enabled || !this.ctx || !this.noiseBuffer) return;
    const t = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency || 900;
    filter.Q.value = q || 0.8;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(t);
    source.stop(t + duration + 0.02);
  },

  play(name) {
    if (!this.enabled || !this.ctx) return;
    switch (name) {
      case 'swing':
        this.noise(0.12, 0.13, 1500, 0.7);
        this.tone(240, 0.09, 'triangle', 0.035, 150);
        break;
      case 'hit':
        this.tone(140, 0.13, 'square', 0.11, 62);
        this.noise(0.16, 0.1, 420, 0.9);
        break;
      case 'crit':
        this.tone(320, 0.16, 'square', 0.12, 80);
        this.tone(620, 0.1, 'triangle', 0.08, 240);
        this.noise(0.12, 0.08, 1200, 0.8);
        break;
      case 'hurt':
        this.tone(180, 0.22, 'sawtooth', 0.11, 55);
        this.noise(0.13, 0.16, 300, 0.7);
        break;
      case 'potion':
        this.tone(520, 0.15, 'sine', 0.09, 840);
        this.tone(780, 0.22, 'triangle', 0.065, 1160);
        break;
      case 'coin':
        this.tone(1180, 0.07, 'triangle', 0.06, 1540);
        break;
      case 'chest':
        this.tone(330, 0.16, 'triangle', 0.08, 440);
        this.tone(550, 0.18, 'sine', 0.08, 760);
        this.tone(880, 0.26, 'sine', 0.08, 1160);
        break;
      case 'enemyDown':
        this.tone(180, 0.32, 'sawtooth', 0.1, 48);
        this.noise(0.14, 0.25, 260, 0.7);
        break;
      case 'enemyWindup':
        this.tone(300, 0.08, 'square', 0.035, 380);
        break;
      case 'enemyAttack':
        this.noise(0.1, 0.09, 700, 0.9);
        break;
      case 'victory':
        [392, 523, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => this.tone(f, 0.42, 'triangle', 0.075, f * 1.01), i * 115);
        });
        break;
      case 'defeat':
        this.tone(220, 0.5, 'sawtooth', 0.09, 72);
        this.tone(110, 0.7, 'sine', 0.08, 45);
        break;
      case 'deny':
        this.tone(150, 0.1, 'square', 0.05, 118);
        break;
      default:
        break;
    }
  }
};

// -------------------------------------------------------- world generation

function createWorldLayout() {
  const rng = mulberry32(0x51f15e);
  const reserved = [
    { x: PLAYER_SPAWN.x, y: PLAYER_SPAWN.y, r: 94 },
    { x: CHEST_SPAWN.x, y: CHEST_SPAWN.y, r: 110 },
    { x: CAMPFIRE.x, y: CAMPFIRE.y, r: 75 },
    { x: TENT.x, y: TENT.y, r: 72 },
    ...ENEMY_SPAWNS.map(e => ({ x: e.x, y: e.y, r: 72 })),
    ...POTION_SPAWNS.map(p => ({ x: p.x, y: p.y, r: 54 }))
  ];
  const pathSamples = [
    [806, 1120], [794, 1000], [790, 890], [836, 778], [924, 662],
    [1018, 554], [1112, 462], [1200, 402]
  ];
  pathSamples.forEach(([x, y]) => reserved.push({ x, y, r: 58 }));

  const clearOf = (x, y, r) => {
    for (const p of reserved) {
      if (dist(x, y, p.x, p.y) < p.r + r) return false;
    }
    if (Math.hypot((x - POND.x) / (POND.rx + r + 8), (y - POND.y) / (POND.ry + r + 8)) < 1) return false;
    return true;
  };

  const trees = [];
  const rocks = [];
  const bushes = [];

  function addTree(x, y, s, kind, force) {
    const collisionR = 9 + s * 6;
    if (!force && !clearOf(x, y, collisionR + 6)) return false;
    for (const t of trees) {
      if (dist(x, y, t.x, t.y) < 28 + s * 7) return false;
    }
    trees.push({
      x, y, s, kind,
      collisionR,
      seed: rng() * TAU,
      tint: rng()
    });
    return true;
  }

  function addRock(x, y, s, force) {
    const collisionR = 9 + s * 7;
    if (!force && !clearOf(x, y, collisionR + 4)) return false;
    for (const t of trees) {
      if (dist(x, y, t.x, t.y) < collisionR + t.collisionR + 10) return false;
    }
    for (const r of rocks) {
      if (dist(x, y, r.x, r.y) < collisionR + r.collisionR + 8) return false;
    }
    rocks.push({ x, y, s, collisionR, seed: rng() * TAU, shade: rng() });
    return true;
  }

  // Border forest: dense enough to frame the glade, with natural gaps.
  for (let x = 45; x < WORLD.w - 20; x += 105) {
    addTree(x + rng() * 28 - 14, 38 + rng() * 88, 1.08 + rng() * 0.44, rng() > 0.42 ? 'pine' : 'oak', true);
    addTree(x + rng() * 32 - 16, WORLD.h - 24 - rng() * 74, 1.06 + rng() * 0.4, rng() > 0.5 ? 'pine' : 'oak', true);
  }
  for (let y = 132; y < WORLD.h - 70; y += 112) {
    addTree(38 + rng() * 70, y + rng() * 30 - 15, 1.04 + rng() * 0.42, rng() > 0.46 ? 'pine' : 'oak', true);
    addTree(WORLD.w - 34 - rng() * 72, y + rng() * 30 - 15, 1.04 + rng() * 0.42, rng() > 0.46 ? 'pine' : 'oak', true);
  }

  // Hand-placed interior clusters.
  const interior = [
    [262, 512, 1.05, 'oak'], [330, 690, 1.12, 'pine'], [214, 824, 0.98, 'oak'],
    [400, 956, 1.02, 'pine'], [258, 1034, 1.08, 'oak'], [468, 792, 0.93, 'oak'],
    [592, 724, 1.14, 'pine'], [660, 566, 0.98, 'oak'], [520, 446, 1.08, 'pine'],
    [714, 364, 0.92, 'oak'], [862, 248, 1.1, 'pine'], [1068, 176, 0.95, 'oak'],
    [1238, 226, 1.12, 'pine'], [1374, 316, 1.02, 'oak'], [1448, 478, 1.16, 'pine'],
    [1320, 602, 0.94, 'oak'], [1430, 714, 1.08, 'oak'], [1118, 900, 1.04, 'pine'],
    [1240, 1014, 0.96, 'oak'], [970, 986, 1.02, 'pine'], [878, 412, 0.9, 'oak'],
    [342, 356, 1.12, 'pine'], [1258, 850, 0.9, 'oak']
  ];
  for (const [x, y, s, kind] of interior) addTree(x, y, s, kind, false);

  const rockData = [
    [420, 1000, 1.0], [1004, 1010, 0.86], [1272, 620, 0.94], [758, 522, 0.76],
    [1428, 450, 0.72], [306, 746, 0.82], [1108, 122, 0.68], [862, 436, 0.62],
    [1190, 880, 0.72], [690, 820, 0.58], [1468, 890, 0.84], [548, 936, 0.56]
  ];
  for (const [x, y, s] of rockData) addRock(x, y, s, false);

  // Non-colliding shrub clusters provide foreground texture.
  const bushSpots = [
    [190, 610], [375, 600], [610, 650], [742, 470], [1010, 480],
    [1150, 660], [1320, 760], [870, 1080], [1290, 1080], [480, 1080],
    [230, 920], [1450, 250], [760, 170], [1060, 1080], [1408, 1000]
  ];
  for (const [x, y] of bushSpots) {
    bushes.push({ x: x + rng() * 18 - 9, y: y + rng() * 12 - 6, s: 0.72 + rng() * 0.5, seed: rng() * TAU });
  }

  // Ruined stone circle around the chest clearing.
  const ruinStones = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + 0.22;
    ruinStones.push({
      x: CHEST_SPAWN.x + Math.cos(a) * 88,
      y: CHEST_SPAWN.y + Math.sin(a) * 64,
      s: 0.48 + rng() * 0.28,
      a
    });
  }

  return { trees, rocks, bushes, ruinStones, seed: 0x51f15e };
}

const worldLayout = createWorldLayout();

// ------------------------------------------------------- terrain painting

function buildGroundCanvas(layout) {
  const c = document.createElement('canvas');
  c.width = WORLD.w;
  c.height = WORLD.h;
  const g = c.getContext('2d');
  const rng = mulberry32(0x9a7213);

  g.fillStyle = '#29492f';
  g.fillRect(0, 0, WORLD.w, WORLD.h);

  // Broad mossy patches.
  for (let i = 0; i < 95; i++) {
    const x = rng() * WORLD.w;
    const y = rng() * WORLD.h;
    const r = 45 + rng() * 180;
    const light = rng() > 0.55;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    if (light) {
      grad.addColorStop(0, `rgba(88, 129, 68, ${0.1 + rng() * 0.11})`);
      grad.addColorStop(1, 'rgba(88, 129, 68, 0)');
    } else {
      grad.addColorStop(0, `rgba(8, 30, 18, ${0.1 + rng() * 0.12})`);
      grad.addColorStop(1, 'rgba(8, 30, 18, 0)');
    }
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }

  // A cool-shadow hollow under the northern trees.
  const hollow = g.createRadialGradient(920, 330, 80, 920, 330, 490);
  hollow.addColorStop(0, 'rgba(7, 24, 15, 0.3)');
  hollow.addColorStop(1, 'rgba(7, 24, 15, 0)');
  g.fillStyle = hollow;
  g.fillRect(0, 0, WORLD.w, WORLD.h);

  // Camp clearing.
  const campClearing = g.createRadialGradient(CAMPFIRE.x, CAMPFIRE.y, 10, CAMPFIRE.x, CAMPFIRE.y, 180);
  campClearing.addColorStop(0, 'rgba(116, 91, 54, 0.3)');
  campClearing.addColorStop(0.55, 'rgba(99, 82, 51, 0.18)');
  campClearing.addColorStop(1, 'rgba(99, 82, 51, 0)');
  g.fillStyle = campClearing;
  g.beginPath();
  g.arc(CAMPFIRE.x, CAMPFIRE.y, 180, 0, TAU);
  g.fill();

  // Winding trail toward the chest.
  const trail = new Path2D();
  trail.moveTo(806, 1174);
  trail.bezierCurveTo(784, 1060, 772, 968, 792, 882);
  trail.bezierCurveTo(814, 788, 880, 706, 940, 636);
  trail.bezierCurveTo(1012, 554, 1100, 492, 1204, 404);

  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = 'rgba(38, 51, 29, 0.6)';
  g.lineWidth = 86;
  g.stroke(trail);
  g.strokeStyle = '#65563a';
  g.lineWidth = 68;
  g.stroke(trail);
  g.strokeStyle = '#7d6947';
  g.lineWidth = 48;
  g.stroke(trail);
  g.strokeStyle = 'rgba(150, 127, 84, 0.38)';
  g.lineWidth = 21;
  g.stroke(trail);

  // Side trail to the goblin's glade.
  const sideTrail = new Path2D();
  sideTrail.moveTo(822, 790);
  sideTrail.bezierCurveTo(720, 760, 616, 720, 508, 674);
  g.strokeStyle = 'rgba(38, 51, 29, 0.48)';
  g.lineWidth = 60;
  g.stroke(sideTrail);
  g.strokeStyle = '#66563b';
  g.lineWidth = 45;
  g.stroke(sideTrail);
  g.strokeStyle = 'rgba(130, 108, 72, 0.35)';
  g.lineWidth = 16;
  g.stroke(sideTrail);

  // Trail stones.
  for (let i = 0; i < 42; i++) {
    const t = rng();
    const x = 798 + Math.sin(t * 5.4) * 54 + (rng() - 0.5) * 68;
    const y = 1120 - t * 700;
    g.fillStyle = rng() > 0.5 ? 'rgba(150, 137, 109, 0.34)' : 'rgba(64, 58, 43, 0.34)';
    g.beginPath();
    g.ellipse(x, y, 2.2 + rng() * 5.5, 1.5 + rng() * 3.7, rng() * TAU, 0, TAU);
    g.fill();
  }

  // Pond.
  const pond = POND;
  g.save();
  g.translate(pond.x, pond.y);
  g.fillStyle = 'rgba(45, 50, 29, 0.85)';
  g.beginPath();
  g.ellipse(0, 0, pond.rx + 9, pond.ry + 8, 0, 0, TAU);
  g.fill();
  const water = g.createLinearGradient(0, -pond.ry, 0, pond.ry);
  water.addColorStop(0, '#285557');
  water.addColorStop(0.5, '#1f5351');
  water.addColorStop(1, '#123a39');
  g.fillStyle = water;
  g.beginPath();
  g.ellipse(0, 0, pond.rx, pond.ry, 0, 0, TAU);
  g.fill();

  g.strokeStyle = 'rgba(125, 185, 163, 0.2)';
  g.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.ellipse(0, 0, pond.rx - 18 - i * 13, pond.ry - 13 - i * 8, 0, Math.PI * (0.11 + i * 0.07), Math.PI * (0.85 + i * 0.03));
    g.stroke();
  }

  for (let i = 0; i < 5; i++) {
    const lx = -53 + rng() * 108;
    const ly = -34 + rng() * 66;
    g.fillStyle = i % 2 ? '#3e6a3e' : '#56814a';
    g.beginPath();
    g.ellipse(lx, ly, 9 + rng() * 9, 5 + rng() * 5, rng() * TAU, 0, TAU);
    g.fill();
  }
  g.restore();

  // Dirt ruin around the chest.
  const ruin = g.createRadialGradient(CHEST_SPAWN.x, CHEST_SPAWN.y, 18, CHEST_SPAWN.x, CHEST_SPAWN.y, 160);
  ruin.addColorStop(0, 'rgba(137, 119, 82, 0.33)');
  ruin.addColorStop(0.62, 'rgba(119, 103, 70, 0.17)');
  ruin.addColorStop(1, 'rgba(119, 103, 70, 0)');
  g.fillStyle = ruin;
  g.beginPath();
  g.arc(CHEST_SPAWN.x, CHEST_SPAWN.y, 160, 0, TAU);
  g.fill();

  // Ruined flagstones.
  for (const stone of layout.ruinStones) {
    g.save();
    g.translate(stone.x, stone.y);
    g.rotate(stone.a + 0.4);
    g.fillStyle = `rgba(111, 112, 94, ${0.22 + stone.s * 0.2})`;
    g.beginPath();
    g.ellipse(0, 0, 10 + stone.s * 12, 5 + stone.s * 6, 0, 0, TAU);
    g.fill();
    g.restore();
  }

  // Grass blades and tiny ground detail.
  for (let i = 0; i < 1500; i++) {
    const x = rng() * WORLD.w;
    const y = rng() * WORLD.h;
    const h = 1.5 + rng() * 4.5;
    g.strokeStyle = rng() > 0.5 ? 'rgba(94, 137, 72, 0.34)' : 'rgba(33, 75, 41, 0.42)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + (rng() - 0.5) * 3, y - h * 0.6, x + (rng() - 0.5) * 5, y - h);
    g.stroke();
  }

  // Fallen leaves.
  for (let i = 0; i < 220; i++) {
    const x = rng() * WORLD.w;
    const y = rng() * WORLD.h;
    g.save();
    g.translate(x, y);
    g.rotate(rng() * TAU);
    g.fillStyle = pick(['rgba(128, 93, 49, 0.3)', 'rgba(156, 113, 50, 0.24)', 'rgba(84, 108, 48, 0.28)', 'rgba(112, 68, 43, 0.25)']);
    g.beginPath();
    g.ellipse(0, 0, 1.2 + rng() * 3.2, 0.8 + rng() * 1.5, 0, 0, TAU);
    g.fill();
    g.restore();
  }

  // Wildflowers.
  for (let i = 0; i < 95; i++) {
    const x = rng() * WORLD.w;
    const y = rng() * WORLD.h;
    if (Math.hypot((x - POND.x) / POND.rx, (y - POND.y) / POND.ry) < 1.12) continue;
    const color = pick(['rgba(236, 224, 170, 0.6)', 'rgba(197, 161, 217, 0.55)', 'rgba(230, 192, 116, 0.58)', 'rgba(153, 193, 216, 0.4)']);
    g.fillStyle = color;
    g.beginPath();
    g.arc(x, y, 1.1 + rng() * 2.1, 0, TAU);
    g.fill();
    if (rng() > 0.45) {
      g.fillStyle = 'rgba(255, 250, 214, 0.65)';
      g.beginPath();
      g.arc(x, y, 0.6, 0, TAU);
      g.fill();
    }
  }

  // Shrubs baked into the terrain.
  for (const b of layout.bushes) {
    g.save();
    g.translate(b.x, b.y);
    g.scale(b.s, b.s);
    g.fillStyle = 'rgba(6, 22, 13, 0.25)';
    g.beginPath();
    g.ellipse(2, 6, 17, 7, 0, 0, TAU);
    g.fill();
    const colors = ['#315636', '#3d6940', '#4c7a47'];
    for (let i = 0; i < 5; i++) {
      g.fillStyle = colors[i % colors.length];
      g.beginPath();
      g.arc(-10 + i * 5, -4 + Math.sin(i * 2 + b.seed) * 4, 6 + (i % 3) * 2, 0, TAU);
      g.fill();
    }
    g.restore();
  }

  // Dark, painted world edge.
  const edge = 110;
  const top = g.createLinearGradient(0, 0, 0, edge);
  top.addColorStop(0, 'rgba(4, 13, 8, 0.62)');
  top.addColorStop(1, 'rgba(4, 13, 8, 0)');
  g.fillStyle = top;
  g.fillRect(0, 0, WORLD.w, edge);
  const bottom = g.createLinearGradient(0, WORLD.h, 0, WORLD.h - edge);
  bottom.addColorStop(0, 'rgba(3, 10, 6, 0.6)');
  bottom.addColorStop(1, 'rgba(3, 10, 6, 0)');
  g.fillStyle = bottom;
  g.fillRect(0, WORLD.h - edge, WORLD.w, edge);
  const left = g.createLinearGradient(0, 0, edge, 0);
  left.addColorStop(0, 'rgba(4, 13, 8, 0.56)');
  left.addColorStop(1, 'rgba(4, 13, 8, 0)');
  g.fillStyle = left;
  g.fillRect(0, 0, edge, WORLD.h);
  const right = g.createLinearGradient(WORLD.w, 0, WORLD.w - edge, 0);
  right.addColorStop(0, 'rgba(4, 13, 8, 0.56)');
  right.addColorStop(1, 'rgba(4, 13, 8, 0)');
  g.fillStyle = right;
  g.fillRect(WORLD.w - edge, 0, edge, WORLD.h);

  return c;
}

const groundCanvas = buildGroundCanvas(worldLayout);

// ------------------------------------------------------------ global state

const game = {
  mode: 'menu',
  time: 0,
  runStart: 0,
  overlayDelay: 0,
  damageFlash: 0,
  victoryFlash: 0,
  hintTimer: 0,
  player: null,
  enemies: [],
  pickups: [],
  drops: [],
  particles: [],
  floaters: [],
  slashes: [],
  leaves: [],
  fireflies: [],
  trees: worldLayout.trees,
  rocks: worldLayout.rocks,
  chest: null,
  inventory: null,
  stats: null,
  chestReward: null,
  camera: {
    x: PLAYER_SPAWN.x,
    y: PLAYER_SPAWN.y,
    zoom: 1,
    shake: 0,
    shakeX: 0,
    shakeY: 0
  },
  view: { w: 1, h: 1, dpr: 1 },
  input: {
    keys: new Set(),
    joyX: 0,
    joyY: 0,
    joyActive: false,
    joyPointer: null,
    attackHeld: false,
    lastPotionAt: -10
  }
};
