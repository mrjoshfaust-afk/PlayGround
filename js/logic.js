/* =========================================================================
   HOLLOWWOOD — simulation, combat, loot, and victory logic
   ========================================================================= */

function createPlayer() {
  return {
    x: PLAYER_SPAWN.x,
    y: PLAYER_SPAWN.y,
    r: PLAYER_BASE.radius,
    hp: PLAYER_BASE.maxHp,
    maxHp: PLAYER_BASE.maxHp,
    facing: -Math.PI / 2,
    speed: PLAYER_BASE.speed,
    attackCooldown: 0,
    attackTimer: 0,
    hitDone: true,
    invuln: 0,
    hurtFlash: 0,
    knockVX: 0,
    knockVY: 0,
    moving: false,
    walkPhase: 0,
    dead: false,
    deathT: 0
  };
}

function createEnemy(spawn, index) {
  const type = ENEMY_TYPES[spawn.type];
  return {
    id: index,
    type: spawn.type,
    name: type.name,
    short: type.short,
    x: spawn.x,
    y: spawn.y,
    homeX: spawn.x,
    homeY: spawn.y,
    r: type.radius,
    hp: type.hp,
    maxHp: type.hp,
    speed: type.speed,
    damage: type.damage,
    range: type.range,
    aggro: type.aggro,
    windup: type.windup,
    cooldown: type.cooldown,
    goldMin: type.goldMin,
    goldMax: type.goldMax,
    state: 'idle',
    stateT: rand(0.4, 1.4),
    windupT: 0,
    attackCooldown: rand(0.25, 0.85),
    facing: angleTo(spawn.x, spawn.y, PLAYER_SPAWN.x, PLAYER_SPAWN.y),
    wanderAngle: rand(0, TAU),
    walkPhase: rand(0, TAU),
    hitFlash: 0,
    alertT: 0,
    knockVX: 0,
    knockVY: 0,
    dead: false,
    deathT: 0,
    seed: rand(0, TAU)
  };
}

function createLeaves() {
  const leaves = [];
  for (let i = 0; i < 34; i++) {
    leaves.push({
      x: rand(40, WORLD.w - 40),
      y: rand(70, WORLD.h - 40),
      vx: rand(-8, 15),
      vy: rand(7, 19),
      phase: rand(0, TAU),
      speed: rand(0.55, 1.4),
      size: rand(1.5, 3.7),
      rot: rand(0, TAU),
      spin: rand(-1.4, 1.4),
      color: pick(['rgba(147, 109, 51, 0.5)', 'rgba(176, 126, 55, 0.43)', 'rgba(96, 128, 56, 0.4)', 'rgba(185, 146, 75, 0.32)'])
    });
  }
  return leaves;
}

function createFireflies() {
  const flies = [];
  const anchors = [
    [CAMPFIRE.x, CAMPFIRE.y],
    [POND.x, POND.y],
    [720, 760],
    [1180, 560],
    [420, 870]
  ];
  for (let i = 0; i < 30; i++) {
    const anchor = pick(anchors);
    flies.push({
      bx: anchor[0] + rand(-110, 110),
      by: anchor[1] + rand(-90, 90),
      phase: rand(0, TAU),
      speed: rand(0.22, 0.55),
      radius: rand(8, 42),
      size: rand(0.9, 2.2)
    });
  }
  return flies;
}

function resetGame() {
  game.mode = 'menu';
  game.time = 0;
  game.runStart = 0;
  game.overlayDelay = 0;
  game.overlayShown = false;
  game.damageFlash = 0;
  game.victoryFlash = 0;
  game.chestReward = null;
  game.player = createPlayer();
  game.enemies = ENEMY_SPAWNS.map(createEnemy);
  game.pickups = POTION_SPAWNS.map((p, i) => ({ x: p.x, y: p.y, type: 'potion', seed: rand(0, TAU), id: i }));
  game.drops = [];
  game.particles = [];
  game.floaters = [];
  game.slashes = [];
  game.leaves = createLeaves();
  game.fireflies = createFireflies();
  game.chest = {
    x: CHEST_SPAWN.x,
    y: CHEST_SPAWN.y,
    opened: false,
    openT: 0,
    glow: rand(0, TAU)
  };
  game.inventory = {
    potions: 1,
    gold: 0,
    relics: [],
    swordBonus: 0,
    maxHpBonus: 0,
    swordName: 'Iron Sword'
  };
  game.stats = {
    kills: 0,
    damageDealt: 0,
    damageTaken: 0,
    potionsUsed: 0,
    elapsed: 0
  };
  game.camera.shake = 0;
  game.camera.shakeX = 0;
  game.camera.shakeY = 0;
  snapCamera();
}

// ------------------------------------------------------------- collisions

function collidesAt(x, y, r) {
  if (x < WORLD.margin + r || x > WORLD.w - WORLD.margin - r ||
      y < WORLD.margin + r || y > WORLD.h - WORLD.margin - r) {
    return true;
  }

  for (const tree of game.trees) {
    if (Math.abs(x - tree.x) > 64 || Math.abs(y - tree.y) > 64) continue;
    if (dist(x, y, tree.x, tree.y) < r + tree.collisionR) return true;
  }
  for (const rock of game.rocks) {
    if (Math.abs(x - rock.x) > 64 || Math.abs(y - rock.y) > 64) continue;
    if (dist(x, y, rock.x, rock.y) < r + rock.collisionR) return true;
  }

  if (game.chest && dist(x, y, game.chest.x, game.chest.y) < r + 21) return true;
  if (dist(x, y, CAMPFIRE.x, CAMPFIRE.y) < r + 18) return true;
  if (dist(x, y, TENT.x, TENT.y + 8) < r + 27) return true;

  const nd = Math.hypot((x - POND.x) / (POND.collisionR + r), (y - POND.y) / (POND.collisionR + r));
  if (nd < 1) return true;

  return false;
}

function moveEntity(entity, dx, dy, radius) {
  if (dx) {
    const nx = entity.x + dx;
    if (!collidesAt(nx, entity.y, radius)) entity.x = nx;
  }
  if (dy) {
    const ny = entity.y + dy;
    if (!collidesAt(entity.x, ny, radius)) entity.y = ny;
  }
  entity.x = clamp(entity.x, WORLD.margin + radius, WORLD.w - WORLD.margin - radius);
  entity.y = clamp(entity.y, WORLD.margin + radius, WORLD.h - WORLD.margin - radius);
}

// --------------------------------------------------------- effects & drops

function spawnParticles(x, y, count, options = {}) {
  const colors = options.colors || ['#ffd776', '#f7ecc8', '#b9924d'];
  const speed = options.speed || [40, 150];
  const life = options.life || [0.3, 0.7];
  const size = options.size || [1.3, 3.6];
  const gravity = options.gravity == null ? 90 : options.gravity;
  const direction = options.direction;
  const spread = options.spread == null ? TAU : options.spread;

  for (let i = 0; i < count; i++) {
    const a = direction == null ? rand(0, TAU) : direction + rand(-spread / 2, spread / 2);
    const v = rand(speed[0], speed[1]);
    const maxLife = rand(life[0], life[1]);
    game.particles.push({
      x: x + rand(-3, 3),
      y: y + rand(-3, 3),
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: maxLife,
      maxLife,
      size: rand(size[0], size[1]),
      color: pick(colors),
      gravity,
      drag: options.drag == null ? 2.1 : options.drag,
      glow: Boolean(options.glow),
      shape: options.shape || 'dot'
    });
  }
}

function spawnSlash(x, y, angle, color, radius, life = 0.2) {
  game.slashes.push({ x, y, angle, color, radius, life, maxLife: life, kind: 'slash' });
}

function updateEffects(dt) {
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      game.particles.splice(i, 1);
      continue;
    }
    p.vy += p.gravity * dt;
    p.vx *= Math.exp(-p.drag * dt);
    p.vy *= Math.exp(-p.drag * 0.45 * dt);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  for (let i = game.floaters.length - 1; i >= 0; i--) {
    const f = game.floaters[i];
    f.life -= dt;
    if (f.life <= 0) {
      game.floaters.splice(i, 1);
      continue;
    }
    f.y -= 35 * dt;
    f.x += f.vx * dt;
  }

  for (let i = game.slashes.length - 1; i >= 0; i--) {
    const s = game.slashes[i];
    s.life -= dt;
    if (s.life <= 0) game.slashes.splice(i, 1);
  }
}

function addFloater(x, y, text, color = '#fff0c6', size = 14) {
  game.floaters.push({
    x, y, text, color, size,
    vx: rand(-6, 6),
    life: 0.82,
    maxLife: 0.82
  });
}

function dropGold(x, y, total) {
  const pieces = randInt(3, 5);
  let left = total;
  for (let i = 0; i < pieces; i++) {
    const value = i === pieces - 1 ? Math.max(1, left) : Math.max(1, Math.floor(total / pieces));
    left -= value;
    const a = rand(0, TAU);
    const speed = rand(55, 155);
    game.drops.push({
      x: x + rand(-5, 5),
      y: y + rand(-5, 5),
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      value,
      age: 0,
      phase: rand(0, TAU)
    });
  }
}

function updateDrops(dt) {
  const p = game.player;
  if (!p) return;
  for (let i = game.drops.length - 1; i >= 0; i--) {
    const d = game.drops[i];
    d.age += dt;
    d.vx *= Math.exp(-4.5 * dt);
    d.vy *= Math.exp(-4.5 * dt);
    d.x += d.vx * dt;
    d.y += d.vy * dt;

    const dd = dist(d.x, d.y, p.x, p.y);
    const magnet = d.age > 0.26 && (dd < 165 || game.mode === 'victory');
    if (magnet) {
      const a = angleTo(d.x, d.y, p.x, p.y);
      const pull = 280 + Math.max(0, 190 - dd) * 2.2;
      d.x += Math.cos(a) * pull * dt;
      d.y += Math.sin(a) * pull * dt;
    }

    if (dd < 19 && !p.dead) {
      game.inventory.gold += d.value;
      addFloater(p.x + rand(-8, 8), p.y - 24, '+' + d.value, '#ffd76e', 11);
      spawnParticles(d.x, d.y, 4, { colors: ['#ffd76e', '#fff1ad'], speed: [20, 60], life: [0.18, 0.4], gravity: 0, size: [1, 2.2], glow: true });
      if (Math.random() < 0.32) Sound.play('coin');
      game.drops.splice(i, 1);
      updateHud();
    }
  }
}

// ---------------------------------------------------------------- pickups

function collectPickups() {
  const p = game.player;
  if (!p || p.dead) return;
  for (let i = game.pickups.length - 1; i >= 0; i--) {
    const item = game.pickups[i];
    if (dist(p.x, p.y, item.x, item.y) < p.r + 19) {
      game.pickups.splice(i, 1);
      game.inventory.potions += 1;
      addFloater(item.x, item.y - 20, 'Healing Potion +1', '#9be7a0', 12);
      spawnParticles(item.x, item.y, 15, { colors: ['#9be7a0', '#d8ffd1', '#63c879'], speed: [25, 90], life: [0.35, 0.75], gravity: -25, size: [1.2, 3.2], glow: true });
      showToast('Healing Potion collected — tap HEAL to drink');
      Sound.play('potion');
      updateHud();
    }
  }
}

function tryUsePotion() {
  const p = game.player;
  if (!p || game.mode !== 'playing' || p.dead) return;
  if (game.inventory.potions <= 0) {
    showToast('No potions left — search the glade');
    Sound.play('deny');
    return;
  }
  if (p.hp >= p.maxHp) {
    showToast('Health is already full');
    Sound.play('deny');
    return;
  }
  game.inventory.potions -= 1;
  const healed = Math.min(PLAYER_BASE.potionHeal, p.maxHp - p.hp);
  p.hp += healed;
  game.stats.potionsUsed += 1;
  addFloater(p.x, p.y - 30, '+' + Math.round(healed) + ' HP', '#8bf59a', 16);
  spawnParticles(p.x, p.y, 24, { colors: ['#8bf59a', '#d7ffd2', '#4ccf73'], speed: [30, 105], life: [0.4, 0.9], gravity: -50, size: [1.4, 3.4], glow: true });
  Sound.play('potion');
  showToast('Potion drunk — health restored');
  updateHud();
}

// ------------------------------------------------------------------ combat

function tryAttack() {
  const p = game.player;
  if (!p || p.dead || game.mode !== 'playing' || p.attackCooldown > 0) return;

  let nearest = null;
  let nearestD = 158;
  for (const e of game.enemies) {
    if (e.dead) continue;
    const d = dist(p.x, p.y, e.x, e.y);
    if (d < nearestD) {
      nearestD = d;
      nearest = e;
    }
  }
  if (nearest) p.facing = angleTo(p.x, p.y, nearest.x, nearest.y);

  p.attackCooldown = PLAYER_BASE.attackCooldown;
  p.attackTimer = PLAYER_BASE.attackAnim;
  p.hitDone = false;
  Sound.play('swing');
}

function performSwordHit() {
  const p = game.player;
  if (!p || p.hitDone) return;
  p.hitDone = true;
  let hits = 0;

  for (const e of game.enemies) {
    if (e.dead) continue;
    const d = dist(p.x, p.y, e.x, e.y);
    if (d - e.r > PLAYER_BASE.attackRange) continue;
    const a = angleTo(p.x, p.y, e.x, e.y);
    if (Math.abs(angleDelta(p.facing, a)) > PLAYER_BASE.attackArc) continue;

    const crit = Math.random() < 0.13;
    let damage = PLAYER_BASE.baseDamage + game.inventory.swordBonus + randInt(-2, 5);
    if (crit) damage = Math.round(damage * 1.7);
    damageEnemy(e, damage, a, crit);
    hits += 1;
  }

  if (hits > 0) {
    game.camera.shake = Math.max(game.camera.shake, 0.22);
    spawnSlash(p.x, p.y, p.facing, 'rgba(255, 242, 196, 0.72)', PLAYER_BASE.attackRange, 0.16);
  } else {
    spawnParticles(p.x + Math.cos(p.facing) * 52, p.y + Math.sin(p.facing) * 52, 4, {
      colors: ['rgba(209, 198, 160, 0.4)'], speed: [8, 28], life: [0.2, 0.4], gravity: 0, size: [0.8, 1.8]
    });
  }
}

function damageEnemy(enemy, amount, angle, crit) {
  const p = game.player;
  enemy.hp = Math.max(0, enemy.hp - amount);
  enemy.hitFlash = 0.16;
  enemy.alertT = 4.5;
  enemy.knockVX += Math.cos(angle) * (crit ? 310 : 235);
  enemy.knockVY += Math.sin(angle) * (crit ? 310 : 235);
  game.stats.damageDealt += amount;
  if (enemy.state === 'idle') enemy.state = 'chase';

  addFloater(
    enemy.x + rand(-7, 7),
    enemy.y - enemy.r - 18,
    (crit ? 'CRIT ' : '') + amount,
    crit ? '#ffd867' : '#fff1c8',
    crit ? 19 : 14
  );
  spawnParticles(enemy.x, enemy.y, crit ? 18 : 10, {
    colors: crit ? ['#ffd867', '#fff4c8', '#d69039'] : ['#f7ecc8', '#d5b46e', '#a66c3e'],
    speed: [45, crit ? 240 : 175],
    life: [0.22, 0.55],
    gravity: 140,
    size: [1.2, crit ? 4.1 : 3.2],
    direction: angle,
    spread: 2.2
  });
  game.camera.shake = Math.max(game.camera.shake, crit ? 0.44 : 0.27);
  Sound.play(crit ? 'crit' : 'hit');

  if (enemy.hp <= 0) killEnemy(enemy);
}

function killEnemy(enemy) {
  if (enemy.dead) return;
  enemy.dead = true;
  enemy.deathT = 0;
  game.stats.kills += 1;

  const totalGold = randInt(enemy.goldMin, enemy.goldMax);
  dropGold(enemy.x, enemy.y, totalGold);
  spawnParticles(enemy.x, enemy.y, 30, {
    colors: ['#ddd29e', '#8ca65e', '#e6b85f', '#5b753f'],
    speed: [35, 210],
    life: [0.4, 1.0],
    gravity: 100,
    size: [1.2, 4.1]
  });
  spawnSlash(enemy.x, enemy.y, rand(0, TAU), 'rgba(255, 220, 146, 0.55)', enemy.r + 30, 0.32);
  Sound.play('enemyDown');
  game.camera.shake = Math.max(game.camera.shake, 0.48);

  const remaining = 3 - game.stats.kills;
  if (remaining > 0) {
    showToast(`${enemy.short} slain — ${remaining} ${remaining === 1 ? 'beast' : 'beasts'} remain`);
  } else {
    showToast('The glade falls silent...');
  }
  updateHud();

  if (game.enemies.every(e => e.dead)) triggerVictory();
}

function damagePlayer(amount, source) {
  const p = game.player;
  if (!p || p.dead || game.mode !== 'playing' || p.invuln > 0) return;

  p.hp = Math.max(0, p.hp - amount);
  p.invuln = PLAYER_BASE.invulnTime;
  p.hurtFlash = 0.38;
  game.damageFlash = Math.max(game.damageFlash, 0.46);
  game.stats.damageTaken += amount;
  game.camera.shake = Math.max(game.camera.shake, 0.56);

  if (source) {
    const a = angleTo(source.x, source.y, p.x, p.y);
    const force = source.type === 'orc' ? 285 : 170;
    p.knockVX += Math.cos(a) * force;
    p.knockVY += Math.sin(a) * force;
  }

  addFloater(p.x + rand(-5, 5), p.y - 30, '-' + amount, '#ff8a74', 17);
  spawnParticles(p.x, p.y, 15, {
    colors: ['#ff8a74', '#d14a45', '#f4c39b'],
    speed: [35, 160],
    life: [0.25, 0.6],
    gravity: 130,
    size: [1.1, 3.4]
  });
  Sound.play('hurt');
  updateHud();

  if (p.hp <= 0) {
    p.dead = true;
    game.mode = 'dead';
    game.overlayDelay = 1.15;
    game.overlayShown = false;
    game.input.attackHeld = false;
    spawnParticles(p.x, p.y, 28, { colors: ['#b9433e', '#e2a476', '#6a4d36'], speed: [25, 120], life: [0.6, 1.4], gravity: 80, size: [1.4, 3.8] });
    Sound.play('defeat');
  }
}

// ------------------------------------------------------------------ enemies

function startEnemyWindup(enemy) {
  enemy.state = 'windup';
  enemy.windupT = enemy.windup;
  enemy.attackCooldown = enemy.cooldown;
  Sound.play('enemyWindup');
}

function enemyStrike(enemy) {
  const p = game.player;
  enemy.state = 'recover';
  enemy.stateT = enemy.type === 'goblin' ? 0.48 : 0.3;

  spawnSlash(
    enemy.x + Math.cos(enemy.facing) * enemy.r * 0.7,
    enemy.y + Math.sin(enemy.facing) * enemy.r * 0.7,
    enemy.facing,
    'rgba(255, 112, 92, 0.6)',
    enemy.range * 0.82,
    0.18
  );
  Sound.play('enemyAttack');

  if (!p || p.dead) return;
  const d = dist(enemy.x, enemy.y, p.x, p.y);
  const a = angleTo(enemy.x, enemy.y, p.x, p.y);
  if (d <= enemy.range + p.r + 10 && Math.abs(angleDelta(enemy.facing, a)) < 1.0) {
    damagePlayer(enemy.damage, enemy);
  }
}

function updateEnemies(dt) {
  const p = game.player;
  for (const e of game.enemies) {
    if (e.dead) {
      e.deathT += dt;
      continue;
    }

    e.hitFlash = Math.max(0, e.hitFlash - dt);
    e.attackCooldown = Math.max(0, e.attackCooldown - dt);
    e.alertT = Math.max(0, e.alertT - dt);

    if (Math.abs(e.knockVX) > 1 || Math.abs(e.knockVY) > 1) {
      moveEntity(e, e.knockVX * dt, e.knockVY * dt, e.r);
      e.knockVX *= Math.exp(-7 * dt);
      e.knockVY *= Math.exp(-7 * dt);
    } else {
      e.knockVX = 0;
      e.knockVY = 0;
    }

    if (!p || p.dead) {
      e.state = 'idle';
      continue;
    }

    const d = dist(e.x, e.y, p.x, p.y);
    const towardPlayer = angleTo(e.x, e.y, p.x, p.y);

    switch (e.state) {
      case 'idle': {
        e.stateT -= dt;
        if (d < e.aggro) {
          e.state = 'chase';
          e.alertT = 4;
          break;
        }
        if (e.stateT <= 0) {
          e.stateT = rand(1.4, 3.4);
          const homeDist = dist(e.x, e.y, e.homeX, e.homeY);
          e.wanderAngle = homeDist > 105 ? angleTo(e.x, e.y, e.homeX, e.homeY) : rand(0, TAU);
          if (e.type === 'wolf') e.wanderAngle += rand(-0.3, 0.3);
        }
        e.facing = lerpAngle(e.facing, e.wanderAngle, 1 - Math.exp(-4 * dt));
        const spd = e.speed * 0.27;
        moveEntity(e, Math.cos(e.wanderAngle) * spd * dt, Math.sin(e.wanderAngle) * spd * dt, e.r);
        e.walkPhase += dt * 5;
        break;
      }

      case 'chase': {
        e.facing = lerpAngle(e.facing, towardPlayer, 1 - Math.exp(-10 * dt));
        if (d <= e.range && e.attackCooldown <= 0) {
          startEnemyWindup(e);
          break;
        }

        let moveAngle = towardPlayer;
        let speed = e.speed;
        if (e.type === 'wolf' && d < 160 && d > e.range * 0.9) {
          moveAngle += Math.sin(game.time * 4.2 + e.seed) * 0.58;
          speed *= 0.92;
        }
        if (d > e.range * 0.78) {
          moveEntity(e, Math.cos(moveAngle) * speed * dt, Math.sin(moveAngle) * speed * dt, e.r);
          e.walkPhase += dt * (e.type === 'wolf' ? 13 : 8);
        } else if (e.attackCooldown > 0.55) {
          // Give the player a readable moment of space while the attack cools down.
          moveEntity(e, -Math.cos(moveAngle) * speed * 0.34 * dt, -Math.sin(moveAngle) * speed * 0.34 * dt, e.r);
          e.walkPhase += dt * 4;
        }
        break;
      }

      case 'windup': {
        e.facing = lerpAngle(e.facing, towardPlayer, 1 - Math.exp(-15 * dt));
        e.windupT -= dt;
        if (e.windupT <= 0) enemyStrike(e);
        break;
      }

      case 'recover': {
        e.stateT -= dt;
        if (e.stateT <= 0) {
          e.state = e.type === 'goblin' ? 'retreat' : 'chase';
          e.stateT = e.type === 'goblin' ? 0.62 : 0;
        }
        break;
      }

      case 'retreat': {
        e.stateT -= dt;
        const away = angleTo(p.x, p.y, e.x, e.y);
        e.facing = lerpAngle(e.facing, towardPlayer, 1 - Math.exp(-8 * dt));
        moveEntity(e, Math.cos(away) * e.speed * 0.85 * dt, Math.sin(away) * e.speed * 0.85 * dt, e.r);
        e.walkPhase += dt * 9;
        if (e.stateT <= 0) e.state = 'chase';
        break;
      }

      default:
        e.state = 'chase';
    }
  }

  // Keep the three beasts from stacking into a single silhouette.
  for (let i = 0; i < game.enemies.length; i++) {
    const a = game.enemies[i];
    if (a.dead) continue;
    for (let j = i + 1; j < game.enemies.length; j++) {
      const b = game.enemies[j];
      if (b.dead) continue;
      const d = dist(a.x, a.y, b.x, b.y);
      const min = a.r + b.r + 7;
      if (d > 0 && d < min) {
        const push = (min - d) * 0.5;
        const ang = angleTo(a.x, a.y, b.x, b.y);
        moveEntity(a, -Math.cos(ang) * push, -Math.sin(ang) * push, a.r);
        moveEntity(b, Math.cos(ang) * push, Math.sin(ang) * push, b.r);
      }
    }
  }
}

// ---------------------------------------------------------------- the chest

function nearChest() {
  const p = game.player;
  return p && !p.dead && game.chest && !game.chest.opened && dist(p.x, p.y, game.chest.x, game.chest.y) < 88;
}

function addRelic(id, icon, name, description) {
  if (game.inventory.relics.some(r => r.id === id)) return;
  game.inventory.relics.push({ id, icon, name, description });
}

function rollChestReward() {
  const roll = Math.random();
  if (roll < 0.34) {
    const amount = randInt(28, 62);
    game.inventory.gold += amount;
    return { kind: 'gold', icon: '🪙', label: `${amount} Gold` };
  }
  if (roll < 0.58) {
    game.inventory.potions += 2;
    return { kind: 'potion', icon: '🧪', label: '2 Healing Potions' };
  }
  if (roll < 0.77) {
    game.inventory.swordBonus += 6;
    game.inventory.swordName = 'Silver Edge';
    addRelic('silver-edge', '⚔️', 'Silver Edge', '+6 sword damage');
    return { kind: 'blade', icon: '⚔️', label: 'Silver Edge +6 damage' };
  }
  if (roll < 0.91) {
    const p = game.player;
    game.inventory.maxHpBonus += 25;
    p.maxHp += 25;
    p.hp = Math.min(p.maxHp, p.hp + 25);
    addRelic('vitality-charm', '❤️', 'Vitality Charm', '+25 max health');
    return { kind: 'health', icon: '❤️', label: 'Vitality Charm +25 HP' };
  }
  game.inventory.gold += 60;
  addRelic('ancient-ruby', '💎', 'Ancient Ruby', 'A priceless ruby');
  return { kind: 'ruby', icon: '💎', label: 'Ancient Ruby + 60 gold' };
}

function openChest() {
  const p = game.player;
  if (!p || game.mode !== 'playing' || game.chest.opened) return;
  if (dist(p.x, p.y, game.chest.x, game.chest.y) > 88) {
    showToast('Move closer to the chest');
    Sound.play('deny');
    return;
  }

  game.chest.opened = true;
  game.chest.openT = 0;
  const reward = rollChestReward();
  game.chestReward = reward;
  game.camera.shake = Math.max(game.camera.shake, 0.32);

  spawnParticles(game.chest.x, game.chest.y - 12, 30, {
    colors: ['#ffe89a', '#e6c168', '#f7f0ca', '#caa64f'],
    speed: [25, 165],
    life: [0.4, 1.1],
    gravity: -55,
    size: [1.2, 3.6],
    glow: true
  });
  addFloater(game.chest.x, game.chest.y - 42, reward.icon + ' ' + reward.label, '#ffe7a0', 12);
  Sound.play('chest');
  showToast('Chest opened — ' + reward.label);
  updateHud();
}

function tryInteract() {
  if (game.mode !== 'playing') return;
  if (game.chest.opened) return;
  if (nearChest()) openChest();
  else {
    showToast('Move closer to the chest');
    Sound.play('deny');
  }
}

// --------------------------------------------------------- camera & ambient

function snapCamera() {
  const p = game.player;
  if (!p) return;
  const zoom = game.camera.zoom || 1;
  const halfW = game.view.w / (2 * zoom);
  const halfH = game.view.h / (2 * zoom);
  let cx = p.x;
  let cy = p.y - 10;
  if (halfW * 2 >= WORLD.w) cx = WORLD.w / 2;
  else cx = clamp(cx, halfW, WORLD.w - halfW);
  if (halfH * 2 >= WORLD.h) cy = WORLD.h / 2;
  else cy = clamp(cy, halfH, WORLD.h - halfH);
  game.camera.x = cx;
  game.camera.y = cy;
}

function updateCamera(dt) {
  const p = game.player;
  if (!p) return;
  const cam = game.camera;
  const zoom = cam.zoom || 1;
  const halfW = game.view.w / (2 * zoom);
  const halfH = game.view.h / (2 * zoom);

  let tx = p.x;
  let ty = p.y - 10;
  if (game.mode === 'menu') {
    tx += Math.sin(game.time * 0.16) * 24;
    ty += Math.cos(game.time * 0.12) * 14;
  }

  let cx;
  let cy;
  if (halfW * 2 >= WORLD.w) cx = WORLD.w / 2;
  else cx = clamp(tx, halfW, WORLD.w - halfW);
  if (halfH * 2 >= WORLD.h) cy = WORLD.h / 2;
  else cy = clamp(ty, halfH, WORLD.h - halfH);

  const smooth = 1 - Math.exp(-dt * (game.mode === 'menu' ? 2.4 : 8));
  cam.x = lerp(cam.x, cx, smooth);
  cam.y = lerp(cam.y, cy, smooth);
  cam.shake = Math.max(0, cam.shake - dt * 2.6);
  const amp = cam.shake * cam.shake * 11;
  cam.shakeX = Math.sin(game.time * 86) * amp;
  cam.shakeY = Math.cos(game.time * 101) * amp * 0.75;
}

function updateAmbient(dt) {
  for (const leaf of game.leaves) {
    leaf.phase += dt * leaf.speed;
    leaf.x += (leaf.vx + Math.sin(leaf.phase) * 13) * dt;
    leaf.y += (leaf.vy + Math.cos(leaf.phase * 0.7) * 4) * dt;
    leaf.rot += leaf.spin * dt;
    if (leaf.y > WORLD.h + 20) {
      leaf.y = -15;
      leaf.x = rand(0, WORLD.w);
    }
    if (leaf.x > WORLD.w + 20) leaf.x = -15;
    if (leaf.x < -20) leaf.x = WORLD.w + 15;
  }
}

// ------------------------------------------------------------- game update

function updateGame(dt) {
  game.time += dt;
  updateAmbient(dt);
  updateEffects(dt);
  updateCamera(dt);

  if (game.mode === 'playing') {
    updatePlayer(dt);
    updateEnemies(dt);
    updateDrops(dt);
    collectPickups();
    if (game.chest) game.chest.openT = Math.min(1, game.chest.openT + dt * 2.6);
    game.damageFlash = Math.max(0, game.damageFlash - dt * 1.5);
    updateContextButton();
  } else if (game.mode === 'victory') {
    updateDrops(dt);
    if (game.chest) game.chest.openT = Math.min(1, game.chest.openT + dt * 2.6);
    game.victoryFlash = Math.min(1, game.victoryFlash + dt * 1.6);
    game.overlayDelay -= dt;
    if (game.overlayDelay <= 0 && !game.overlayShown) {
      game.overlayShown = true;
      showVictoryScreen();
    }
    updateContextButton();
  } else if (game.mode === 'dead') {
    const p = game.player;
    if (p) p.deathT += dt;
    updateDrops(dt);
    game.damageFlash = Math.max(0, game.damageFlash - dt * 0.9);
    game.overlayDelay -= dt;
    if (game.overlayDelay <= 0 && !game.overlayShown) {
      game.overlayShown = true;
      showGameOverScreen();
    }
    updateContextButton();
  } else {
    game.damageFlash = Math.max(0, game.damageFlash - dt);
    updateContextButton();
  }
}

function triggerVictory() {
  if (game.mode !== 'playing') return;
  game.mode = 'victory';
  game.overlayDelay = 1.45;
  game.overlayShown = false;
  game.victoryFlash = 0;
  game.stats.elapsed = game.time - game.runStart;
  game.input.attackHeld = false;
  game.camera.shake = Math.max(game.camera.shake, 0.7);
  Sound.play('victory');
}

function updatePlayer(dt) {
  const p = game.player;
  if (!p || p.dead) return;
  const keys = game.input.keys;

  let mx = 0;
  let my = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
  mx += game.input.joyX;
  my += game.input.joyY;

  const len = Math.hypot(mx, my);
  if (len > 1) {
    mx /= len;
    my /= len;
  }
  p.moving = len > 0.12;

  if (p.moving) {
    p.facing = lerpAngle(p.facing, Math.atan2(my, mx), 1 - Math.exp(-dt * 17));
    p.walkPhase += dt * 11.5;
    moveEntity(p, mx * p.speed * dt, my * p.speed * dt, p.r);
  } else {
    p.walkPhase += dt * 2.1;
  }

  if (Math.abs(p.knockVX) > 1 || Math.abs(p.knockVY) > 1) {
    moveEntity(p, p.knockVX * dt, p.knockVY * dt, p.r);
    p.knockVX *= Math.exp(-6.2 * dt);
    p.knockVY *= Math.exp(-6.2 * dt);
  } else {
    p.knockVX = 0;
    p.knockVY = 0;
  }

  p.attackCooldown = Math.max(0, p.attackCooldown - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.hurtFlash = Math.max(0, p.hurtFlash - dt);

  if (p.attackTimer > 0) {
    p.attackTimer -= dt;
    if (!p.hitDone && p.attackTimer <= PLAYER_BASE.attackAnim * 0.52) performSwordHit();
    if (p.attackTimer < 0) p.attackTimer = 0;
  }

  if (game.input.attackHeld && p.attackCooldown <= 0) tryAttack();
}
