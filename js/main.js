/* =========================================================================
   HOLLOWWOOD — DOM HUD, controls, game loop, and startup
   ========================================================================= */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

const hud = document.getElementById('hud');
const controls = document.getElementById('controls');
const menu = document.getElementById('menu');
const victoryScreen = document.getElementById('victory');
const gameoverScreen = document.getElementById('gameover');
const healthFill = document.getElementById('health-fill');
const healthTrack = document.getElementById('health-track');
const hpText = document.getElementById('hp-text');
const killCount = document.getElementById('kill-count');
const beastPips = Array.from(document.querySelectorAll('.beast-pip'));
const goldCount = document.getElementById('gold-count');
const potionCount = document.getElementById('potion-count');
const swordStat = document.getElementById('sword-stat');
const relicList = document.getElementById('relic-list');
const toastEl = document.getElementById('toast');
const interactBtn = document.getElementById('interact-btn');
const potionBtn = document.getElementById('potion-btn');
const attackBtn = document.getElementById('attack-btn');
const joystick = document.getElementById('joystick');
const joystickKnob = document.getElementById('joystick-knob');
const potionBadge = document.getElementById('potion-badge');
const soundBtn = document.getElementById('sound-btn');
const playBtn = document.getElementById('play-btn');
const againBtn = document.getElementById('again-btn');
const retryBtn = document.getElementById('retry-btn');
const victoryTime = document.getElementById('victory-time');
const victoryKills = document.getElementById('victory-kills');
const victoryGold = document.getElementById('victory-gold');
const victoryDamage = document.getElementById('victory-damage');
const victoryLoot = document.getElementById('victory-loot');
const defeatKills = document.getElementById('defeat-kills');
const defeatDamage = document.getElementById('defeat-damage');
const defeatGold = document.getElementById('defeat-gold');

let toastTimer = 0;
let lastRelicSignature = '';
let lastFrame = performance.now();

// -------------------------------------------------------------------- HUD

function updateHud(force = false) {
  const p = game.player;
  const inv = game.inventory;
  if (!p || !inv) return;

  const ratio = clamp(p.hp / p.maxHp, 0, 1);
  healthFill.style.width = (ratio * 100).toFixed(1) + '%';
  healthTrack.setAttribute('aria-valuenow', String(Math.round(p.hp)));
  healthTrack.setAttribute('aria-valuemax', String(p.maxHp));
  hpText.textContent = Math.ceil(p.hp) + ' / ' + p.maxHp;
  healthFill.classList.toggle('low', ratio < 0.3);

  killCount.textContent = game.stats.kills + ' / 3';
  beastPips.forEach((pip, i) => pip.classList.toggle('dead', i < game.stats.kills));

  goldCount.textContent = String(inv.gold);
  potionCount.textContent = String(inv.potions);
  potionBadge.textContent = String(inv.potions);
  potionBtn.classList.toggle('empty', inv.potions <= 0);
  swordStat.textContent = String(PLAYER_BASE.baseDamage + inv.swordBonus);

  const signature = inv.relics.map(r => r.id).join('|');
  if (force || signature !== lastRelicSignature) {
    lastRelicSignature = signature;
    relicList.replaceChildren();
    for (const relic of inv.relics) {
      const chip = document.createElement('span');
      chip.className = 'relic-chip';
      chip.title = relic.description;
      const icon = document.createElement('span');
      icon.className = 'relic-ico';
      icon.textContent = relic.icon;
      const name = document.createElement('span');
      name.className = 'relic-name';
      name.textContent = relic.name;
      chip.append(icon, name);
      relicList.append(chip);
    }
  }
}

function updateContextButton() {
  const show = game.mode === 'playing' && nearChest();
  interactBtn.classList.toggle('visible', show);
  if (!show) interactBtn.classList.remove('pressed');
}

function showToast(message, duration = 2300) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return m + ':' + String(s % 60).padStart(2, '0');
}

// --------------------------------------------------------------- overlays

function startGame() {
  Sound.init();
  resetGame();
  game.mode = 'playing';
  game.runStart = 0;
  game.overlayShown = false;
  game.input.attackHeld = false;
  game.input.keys.clear();
  game.input.joyX = 0;
  game.input.joyY = 0;

  menu.classList.add('is-hidden');
  victoryScreen.classList.add('is-hidden');
  gameoverScreen.classList.add('is-hidden');
  hud.classList.remove('is-hidden');
  controls.classList.remove('is-hidden');
  updateHud(true);
  updateContextButton();
  showToast('Defeat the three beasts', 2100);
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  lastFrame = performance.now();
}

function showVictoryScreen() {
  const stats = game.stats;
  const inv = game.inventory;
  victoryTime.textContent = formatTime(stats.elapsed);
  victoryKills.textContent = String(stats.kills);
  victoryGold.textContent = String(inv.gold);
  victoryDamage.textContent = String(stats.damageDealt);

  victoryLoot.replaceChildren();
  const seen = new Set();
  const loot = [];
  if (game.chestReward) loot.push({ id: 'chest', icon: game.chestReward.icon, label: 'Chest: ' + game.chestReward.label });
  for (const relic of inv.relics) loot.push({ id: relic.id, icon: relic.icon, label: relic.name });
  for (const item of loot) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const pill = document.createElement('span');
    pill.className = 'loot-pill';
    pill.textContent = item.icon + ' ' + item.label;
    victoryLoot.append(pill);
  }

  controls.classList.add('is-hidden');
  victoryScreen.classList.remove('is-hidden');
}

function showGameOverScreen() {
  defeatKills.textContent = String(game.stats.kills);
  defeatDamage.textContent = String(game.stats.damageDealt);
  defeatGold.textContent = String(game.inventory.gold);
  controls.classList.add('is-hidden');
  gameoverScreen.classList.remove('is-hidden');
}

// --------------------------------------------------------------- resizing

function resizeGame() {
  const w = Math.max(280, window.innerWidth || document.documentElement.clientWidth);
  const h = Math.max(300, window.innerHeight || document.documentElement.clientHeight);
  const nativeDpr = Math.min(2, window.devicePixelRatio || 1);
  const budgetScale = Math.sqrt(900000 / Math.max(1, w * h));
  const dpr = clamp(Math.min(nativeDpr, budgetScale), 0.75, nativeDpr);

  game.view.w = w;
  game.view.h = h;
  game.view.dpr = dpr;

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  const zoom = clamp(Math.min(w / 780, h / 630), 0.84, 1.55);
  game.camera.zoom = zoom;
  buildScreenOverlays();
  snapCamera();
}

// ---------------------------------------------------------------- controls

function updateJoystickFromPointer(event) {
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const max = rect.width * 0.31;
  let dx = event.clientX - cx;
  let dy = event.clientY - cy;
  const length = Math.hypot(dx, dy);
  if (length > max) {
    dx = (dx / length) * max;
    dy = (dy / length) * max;
  }
  game.input.joyX = dx / max;
  game.input.joyY = dy / max;
  joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

function releaseJoystick() {
  game.input.joyActive = false;
  game.input.joyPointer = null;
  game.input.joyX = 0;
  game.input.joyY = 0;
  joystick.classList.remove('active');
  joystickKnob.style.transform = 'translate(-50%, -50%)';
}

function onJoystickDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  game.input.joyActive = true;
  game.input.joyPointer = event.pointerId;
  joystick.classList.add('active');
  if (joystick.setPointerCapture) {
    try { joystick.setPointerCapture(event.pointerId); } catch (_) {}
  }
  updateJoystickFromPointer(event);
}

function onJoystickMove(event) {
  if (!game.input.joyActive || game.input.joyPointer !== event.pointerId) return;
  event.preventDefault();
  updateJoystickFromPointer(event);
}

function onJoystickUp(event) {
  if (game.input.joyPointer !== event.pointerId) return;
  event.preventDefault();
  releaseJoystick();
}

function bindControls() {
  joystick.addEventListener('pointerdown', onJoystickDown, { passive: false });
  joystick.addEventListener('pointermove', onJoystickMove, { passive: false });
  joystick.addEventListener('pointerup', onJoystickUp, { passive: false });
  joystick.addEventListener('pointercancel', onJoystickUp, { passive: false });
  joystick.addEventListener('lostpointercapture', () => releaseJoystick());

  attackBtn.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!game.input.attackHeld) {
      game.input.attackHeld = true;
      tryAttack();
    }
    attackBtn.classList.add('pressed');
    if (attackBtn.setPointerCapture) {
      try { attackBtn.setPointerCapture(event.pointerId); } catch (_) {}
    }
  }, { passive: false });

  const releaseAttack = (event) => {
    if (event) event.preventDefault();
    game.input.attackHeld = false;
    attackBtn.classList.remove('pressed');
  };
  attackBtn.addEventListener('pointerup', releaseAttack, { passive: false });
  attackBtn.addEventListener('pointercancel', releaseAttack, { passive: false });
  attackBtn.addEventListener('lostpointercapture', () => {
    game.input.attackHeld = false;
    attackBtn.classList.remove('pressed');
  });

  potionBtn.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (game.time - game.input.lastPotionAt < 0.22) return;
    game.input.lastPotionAt = game.time;
    tryUsePotion();
  }, { passive: false });

  interactBtn.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    tryInteract();
  }, { passive: false });

  playBtn.addEventListener('click', startGame);
  againBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);

  soundBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    Sound.init();
    Sound.enabled = !Sound.enabled;
    soundBtn.textContent = Sound.enabled ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-label', Sound.enabled ? 'Mute sound' : 'Enable sound');
    soundBtn.title = Sound.enabled ? 'Mute sound' : 'Enable sound';
    try { localStorage.setItem('hollowwood-muted', Sound.enabled ? '0' : '1'); } catch (_) {}
    if (Sound.enabled) Sound.play('coin');
  });

  window.addEventListener('keydown', (event) => {
    const code = event.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) event.preventDefault();

    if (code === 'Space') {
      game.input.attackHeld = true;
      tryAttack();
      return;
    }
    if (code === 'KeyQ' && !event.repeat) {
      tryUsePotion();
      return;
    }
    if (code === 'KeyE' && !event.repeat) {
      tryInteract();
      return;
    }
    if (code === 'Enter' && game.mode === 'menu') {
      startGame();
      return;
    }
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      game.input.keys.add(code);
    }
  });

  window.addEventListener('keyup', (event) => {
    if (event.code === 'Space') game.input.attackHeld = false;
    game.input.keys.delete(event.code);
  });

  window.addEventListener('blur', () => {
    game.input.keys.clear();
    game.input.attackHeld = false;
    releaseJoystick();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      game.input.keys.clear();
      game.input.attackHeld = false;
      releaseJoystick();
    }
    lastFrame = performance.now();
  });

  document.addEventListener('contextmenu', (event) => {
    if (event.target && event.target.closest && event.target.closest('#game-shell')) {
      event.preventDefault();
    }
  });

  window.addEventListener('resize', resizeGame);
  window.addEventListener('orientationchange', () => setTimeout(resizeGame, 80));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resizeGame);

  for (const btn of document.querySelectorAll('.game-btn, .primary-btn, .sound-btn')) {
    btn.addEventListener('contextmenu', event => event.preventDefault());
  }
}

// ------------------------------------------------------------------- loop

let accumulator = 0;
const FIXED_STEP = 1 / 60;

function frame(now) {
  const elapsed = clamp((now - lastFrame) / 1000, 0, 0.25);
  lastFrame = now;
  accumulator = Math.min(accumulator + elapsed, 0.25);
  let steps = 0;
  while (accumulator >= FIXED_STEP && steps < 16) {
    updateGame(FIXED_STEP);
    accumulator -= FIXED_STEP;
    steps += 1;
  }
  if (steps === 16) accumulator = 0;
  renderGame();
  requestAnimationFrame(frame);
}

function init() {
  resizeGame();
  resetGame();
  prepareWorldSprites();
  buildScreenOverlays();
  updateHud(true);
  updateContextButton();
  bindControls();

  try {
    Sound.enabled = localStorage.getItem('hollowwood-muted') !== '1';
  } catch (_) {}
  soundBtn.textContent = Sound.enabled ? '🔊' : '🔇';
  soundBtn.setAttribute('aria-label', Sound.enabled ? 'Mute sound' : 'Enable sound');

  requestAnimationFrame(frame);
}

// --------------------------------------------------------------- debugging

window.__hollowwood = {
  game,
  startGame,
  resetGame,
  tryAttack,
  tryUsePotion,
  tryInteract,
  damagePlayer,
  openChest,
  triggerVictory,
  teleport(x, y) {
    if (!game.player) return;
    game.player.x = clamp(Number(x), WORLD.margin, WORLD.w - WORLD.margin);
    game.player.y = clamp(Number(y), WORLD.margin, WORLD.h - WORLD.margin);
    game.player.knockVX = 0;
    game.player.knockVY = 0;
    snapCamera();
  },
  placeNearChest() {
    this.teleport(game.chest.x - 54, game.chest.y + 42);
  },
  setEnemyHp(index, hp) {
    const enemy = game.enemies[index];
    if (!enemy) return;
    enemy.hp = clamp(Number(hp), 0, enemy.maxHp);
  },
  snapshot() {
    return {
      mode: game.mode,
      time: game.time,
      player: game.player ? {
        x: game.player.x,
        y: game.player.y,
        hp: game.player.hp,
        maxHp: game.player.maxHp,
        facing: game.player.facing,
        dead: game.player.dead
      } : null,
      enemies: game.enemies.map(e => ({
        type: e.type,
        x: e.x,
        y: e.y,
        hp: e.hp,
        maxHp: e.maxHp,
        state: e.state,
        dead: e.dead
      })),
      inventory: JSON.parse(JSON.stringify(game.inventory)),
      stats: JSON.parse(JSON.stringify(game.stats)),
      chest: game.chest ? { x: game.chest.x, y: game.chest.y, opened: game.chest.opened } : null,
      chestReward: game.chestReward,
      pickups: game.pickups.length,
      drops: game.drops.length,
      victoryVisible: !victoryScreen.classList.contains('is-hidden'),
      gameOverVisible: !gameoverScreen.classList.contains('is-hidden'),
      interactVisible: interactBtn.classList.contains('visible')
    };
  }
};

init();
