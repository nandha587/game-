import {
  Player,
  Bullet,
  Enemy,
  Particle,
  PowerUp,
  FloatingText,
  Star,
  Difficulty,
  PowerUpType,
} from '../types';
import { COLORS, DIFFICULTY_SETTINGS } from './constants';
import { sounds } from '../audio';

export interface GameWorld {
  width: number;
  height: number;
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  particles: Particle[];
  powerUps: PowerUp[];
  floatingTexts: FloatingText[];
  stars: Star[];
  wave: number;
  waveActive: boolean;
  waveSpawnQueue: { type: Enemy['type']; delay: number }[];
  waveTimer: number;
  screenShake: number;
  difficulty: Difficulty;
  isPaused: boolean;
  keysPressed: Record<string, boolean>;
  touchControl: {
    active: boolean;
    dx: number;
    dy: number;
    shooting: boolean;
  };
}

export function createInitialWorld(width: number, height: number, difficulty: Difficulty): GameWorld {
  const diff = DIFFICULTY_SETTINGS[difficulty];
  const maxHealth = Math.round(100 * diff.playerHealthMultiplier);
  const maxShield = Math.round(50 * diff.playerHealthMultiplier);

  // Initialize background starfield
  const stars: Star[] = [];
  const starCount = Math.min(180, Math.floor((width * height) / 3500));
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.8,
      speed: Math.random() * 1.5 + 0.3,
      color: Math.random() > 0.8 ? '#93c5fd' : Math.random() > 0.9 ? '#c084fc' : '#ffffff',
      alpha: Math.random() * 0.7 + 0.3,
    });
  }

  const player: Player = {
    x: width / 2,
    y: height * 0.82,
    vx: 0,
    vy: 0,
    radius: 18,
    rotation: -Math.PI / 2,
    health: maxHealth,
    maxHealth,
    shield: maxShield,
    maxShield,
    shieldRegenTimer: 0,
    speed: 380,
    fireCooldown: 170,
    lastFireTime: 0,
    weaponType: 'BLASTER',
    weaponLevel: 1,
    bombCharge: 20,
    invulnerableTimer: 1500,
    score: 0,
    combo: 0,
    comboTimer: 0,
    maxCombo: 0,
    kills: 0,
    shotsFired: 0,
    shotsHit: 0,
  };

  return {
    width,
    height,
    player,
    bullets: [],
    enemies: [],
    particles: [],
    powerUps: [],
    floatingTexts: [],
    stars,
    wave: 1,
    waveActive: false,
    waveSpawnQueue: [],
    waveTimer: 0,
    screenShake: 0,
    difficulty,
    isPaused: false,
    keysPressed: {},
    touchControl: {
      active: false,
      dx: 0,
      dy: 0,
      shooting: false,
    },
  };
}

export function startWave(world: GameWorld) {
  world.waveActive = true;
  world.waveTimer = 0;
  world.waveSpawnQueue = [];

  const wave = world.wave;
  const isBossWave = wave % 5 === 0;

  if (isBossWave) {
    // Spawn Boss!
    world.waveSpawnQueue.push({ type: 'BOSS', delay: 800 });
    // Accompanying escorts
    const escorts = Math.min(6, 2 + Math.floor(wave / 5));
    for (let i = 0; i < escorts; i++) {
      world.waveSpawnQueue.push({
        type: i % 2 === 0 ? 'SCOUT' : 'KAMIKAZE',
        delay: 2000 + i * 1200,
      });
    }
  } else {
    // Regular wave composition
    const asteroidCount = 3 + wave * 2;
    const scoutCount = 2 + Math.floor(wave * 1.5);
    const cruiserCount = wave >= 3 ? Math.floor(wave / 2) : 0;
    const kamikazeCount = wave >= 2 ? Math.min(8, Math.floor(wave * 0.8)) : 0;

    let delay = 300;
    for (let i = 0; i < asteroidCount; i++) {
      world.waveSpawnQueue.push({ type: 'ASTEROID', delay: (delay += 400) });
    }
    for (let i = 0; i < scoutCount; i++) {
      world.waveSpawnQueue.push({ type: 'SCOUT', delay: (delay += 600) });
    }
    for (let i = 0; i < cruiserCount; i++) {
      world.waveSpawnQueue.push({ type: 'CRUISER', delay: (delay += 1200) });
    }
    for (let i = 0; i < kamikazeCount; i++) {
      world.waveSpawnQueue.push({ type: 'KAMIKAZE', delay: (delay += 750) });
    }
  }

  // Floating text announcement
  addFloatingText(
    world,
    isBossWave ? `⚠️ WARNING: BOSS SECTOR (WAVE ${wave}) ⚠️` : `WAVE ${wave} COMMENCING`,
    world.width / 2,
    world.height * 0.35,
    isBossWave ? '#ef4444' : '#38bdf8',
    2400,
    26,
  );
}

export function spawnEnemy(world: GameWorld, type: Enemy['type']) {
  const diff = DIFFICULTY_SETTINGS[world.difficulty];
  const hpScale = (1 + (world.wave - 1) * 0.2) * diff.enemyHealthMultiplier;
  const speedScale = (1 + Math.min(0.6, (world.wave - 1) * 0.05)) * diff.enemySpeedMultiplier;
  const id = 'enemy_' + Math.random().toString(36).substring(2, 9);
  const now = performance.now();

  const spawnX = Math.random() * (world.width - 80) + 40;
  const spawnY = -40;

  let enemy: Enemy;

  switch (type) {
    case 'ASTEROID': {
      const radius = 18 + Math.random() * 16;
      enemy = {
        id,
        type: 'ASTEROID',
        x: spawnX,
        y: spawnY,
        vx: (Math.random() - 0.5) * 40 * speedScale,
        vy: (70 + Math.random() * 50) * speedScale,
        radius,
        health: Math.round((20 + radius) * hpScale),
        maxHealth: Math.round((20 + radius) * hpScale),
        scoreValue: Math.round(100 * diff.scoreMultiplier),
        color: COLORS.asteroid,
        shootCooldown: 0,
        lastShootTime: 0,
        behaviorTimer: 0,
        angle: Math.random() * Math.PI * 2,
      };
      break;
    }
    case 'SCOUT': {
      enemy = {
        id,
        type: 'SCOUT',
        x: spawnX,
        y: spawnY,
        vx: (Math.random() > 0.5 ? 1 : -1) * 110 * speedScale,
        vy: 90 * speedScale,
        radius: 16,
        health: Math.round(35 * hpScale),
        maxHealth: Math.round(35 * hpScale),
        scoreValue: Math.round(200 * diff.scoreMultiplier),
        color: COLORS.scout,
        shootCooldown: 1400 + Math.random() * 600,
        lastShootTime: now + Math.random() * 800,
        behaviorTimer: 0,
        angle: Math.PI / 2,
      };
      break;
    }
    case 'CRUISER': {
      enemy = {
        id,
        type: 'CRUISER',
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 45 * speedScale,
        radius: 28,
        health: Math.round(180 * hpScale),
        maxHealth: Math.round(180 * hpScale),
        scoreValue: Math.round(500 * diff.scoreMultiplier),
        color: COLORS.cruiser,
        shootCooldown: 2100,
        lastShootTime: now + 500,
        behaviorTimer: 0,
        angle: Math.PI / 2,
      };
      break;
    }
    case 'KAMIKAZE': {
      enemy = {
        id,
        type: 'KAMIKAZE',
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 160 * speedScale,
        radius: 14,
        health: Math.round(25 * hpScale),
        maxHealth: Math.round(25 * hpScale),
        scoreValue: Math.round(250 * diff.scoreMultiplier),
        color: COLORS.kamikaze,
        shootCooldown: 0,
        lastShootTime: 0,
        behaviorTimer: 0,
        angle: Math.PI / 2,
      };
      break;
    }
    case 'BOSS': {
      const bossHp = Math.round((1200 + world.wave * 250) * hpScale);
      enemy = {
        id,
        type: 'BOSS',
        name: world.wave === 5 ? 'VORTEX DREADNOUGHT' : `CYBER LEVIATHAN MK-${world.wave / 5}`,
        x: world.width / 2,
        y: -100,
        vx: 60 * speedScale,
        vy: 35,
        radius: 52,
        health: bossHp,
        maxHealth: bossHp,
        scoreValue: Math.round(4000 * diff.scoreMultiplier),
        color: COLORS.boss,
        shootCooldown: 900,
        lastShootTime: now + 1500,
        behaviorTimer: 0,
        angle: Math.PI / 2,
        isBoss: true,
        bossPhase: 1,
        maxBossPhase: 3,
      };
      sounds.playExplosion('large');
      break;
    }
  }

  world.enemies.push(enemy);
}

export function firePlayerBullet(world: GameWorld, now: number) {
  const p = world.player;
  if (now - p.lastFireTime < p.fireCooldown) return;
  p.lastFireTime = now;
  p.shotsFired++;

  const speed = 720;

  switch (p.weaponType) {
    case 'BLASTER': {
      if (p.weaponLevel === 1) {
        // Single central bolt
        world.bullets.push({
          id: 'b_' + Math.random(),
          x: p.x,
          y: p.y - p.radius,
          vx: 0,
          vy: -speed,
          radius: 4,
          damage: 25,
          color: COLORS.playerBullet,
          isPlayer: true,
          pierce: 1,
          life: 1800,
          maxLife: 1800,
        });
      } else {
        // Dual parallel blasters
        const offset = 8;
        world.bullets.push(
          {
            id: 'b_' + Math.random(),
            x: p.x - offset,
            y: p.y - p.radius + 2,
            vx: 0,
            vy: -speed,
            radius: 4,
            damage: 20 + p.weaponLevel * 4,
            color: COLORS.playerBullet,
            isPlayer: true,
            pierce: 1,
            life: 1800,
            maxLife: 1800,
          },
          {
            id: 'b_' + Math.random(),
            x: p.x + offset,
            y: p.y - p.radius + 2,
            vx: 0,
            vy: -speed,
            radius: 4,
            damage: 20 + p.weaponLevel * 4,
            color: COLORS.playerBullet,
            isPlayer: true,
            pierce: 1,
            life: 1800,
            maxLife: 1800,
          },
        );
      }
      sounds.playLaser('player');
      break;
    }
    case 'SPREAD': {
      // 3 or 5 spread shots
      const angles = p.weaponLevel >= 3 ? [-0.28, -0.14, 0, 0.14, 0.28] : [-0.22, 0, 0.22];
      angles.forEach((angle) => {
        world.bullets.push({
          id: 'b_' + Math.random(),
          x: p.x,
          y: p.y - p.radius,
          vx: Math.sin(angle) * speed,
          vy: -Math.cos(angle) * speed,
          radius: 3.5,
          damage: 18 + p.weaponLevel * 3,
          color: '#38bdf8',
          isPlayer: true,
          pierce: 1,
          life: 1600,
          maxLife: 1600,
        });
      });
      sounds.playLaser('player');
      break;
    }
    case 'LASER': {
      // High-speed piercing tachyon beam
      world.bullets.push({
        id: 'b_' + Math.random(),
        x: p.x,
        y: p.y - p.radius,
        vx: 0,
        vy: -speed * 1.3,
        radius: 5,
        damage: 32 + p.weaponLevel * 8,
        color: COLORS.playerLaser,
        isPlayer: true,
        pierce: 4 + p.weaponLevel,
        life: 1400,
        maxLife: 1400,
      });
      sounds.playLaser('laser_beam');
      break;
    }
    case 'PLASMA': {
      // Heavy kinetic explosive orb
      world.bullets.push({
        id: 'b_' + Math.random(),
        x: p.x,
        y: p.y - p.radius,
        vx: 0,
        vy: -speed * 0.85,
        radius: 8 + p.weaponLevel,
        damage: 60 + p.weaponLevel * 15,
        color: COLORS.playerPlasma,
        isPlayer: true,
        pierce: 2,
        life: 2000,
        maxLife: 2000,
      });
      sounds.playLaser('plasma');
      break;
    }
  }

  // Muzzle particles
  createMuzzleFlash(world, p.x, p.y - p.radius);
}

export function triggerSuperBomb(world: GameWorld): boolean {
  const p = world.player;
  if (p.bombCharge < 100) return false;

  p.bombCharge = 0;
  world.screenShake = 24;
  sounds.playBombBlast();

  // Create huge shockwave particles
  for (let i = 0; i < 90; i++) {
    const angle = (i / 90) * Math.PI * 2;
    const speed = 250 + Math.random() * 350;
    world.particles.push({
      x: p.x,
      y: p.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * 4 + 2,
      color: Math.random() > 0.5 ? '#ec4899' : '#38bdf8',
      life: 800 + Math.random() * 400,
      maxLife: 1200,
      alpha: 1,
    });
  }

  // Destroy all enemy bullets
  world.bullets = world.bullets.filter((b) => b.isPlayer);

  // Inflict massive damage to all enemies
  world.enemies.forEach((enemy) => {
    enemy.health -= 350;
    createExplosion(world, enemy.x, enemy.y, 'medium');
  });

  addFloatingText(world, '💥 EMP DETONATED 💥', world.width / 2, world.height * 0.45, '#ec4899', 1800, 30);
  return true;
}

export function spawnPowerUp(world: GameWorld, x: number, y: number) {
  // 35% chance to drop powerup
  if (Math.random() > 0.35) return;

  const roll = Math.random();
  let type: PowerUpType = 'SHIELD';
  let color = COLORS.powerUpShield;

  if (roll < 0.28) {
    type = 'HEAL';
    color = COLORS.powerUpHeal;
  } else if (roll < 0.55) {
    type = 'SHIELD';
    color = COLORS.powerUpShield;
  } else if (roll < 0.82) {
    type = 'WEAPON';
    color = COLORS.powerUpWeapon;
  } else {
    type = 'BOMB';
    color = COLORS.powerUpBomb;
  }

  world.powerUps.push({
    id: 'pu_' + Math.random(),
    type,
    x,
    y,
    vx: (Math.random() - 0.5) * 30,
    vy: 55,
    radius: 12,
    life: 12000,
    duration: 12000,
    color,
  });
}

export function addFloatingText(
  world: GameWorld,
  text: string,
  x: number,
  y: number,
  color = '#ffffff',
  life = 1000,
  size = 16,
) {
  world.floatingTexts.push({
    id: 'ft_' + Math.random(),
    text,
    x,
    y,
    vy: -40,
    color,
    life,
    maxLife: life,
    size,
  });
}

export function createExplosion(world: GameWorld, x: number, y: number, size: 'small' | 'medium' | 'large') {
  sounds.playExplosion(size);

  const count = size === 'large' ? 45 : size === 'medium' ? 24 : 12;
  const baseSpeed = size === 'large' ? 240 : size === 'medium' ? 160 : 100;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * baseSpeed + 20;
    const color =
      Math.random() > 0.6
        ? '#f97316'
        : Math.random() > 0.3
          ? '#eab308'
          : Math.random() > 0.15
            ? '#ef4444'
            : '#ffffff';

    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * (size === 'large' ? 5 : 3) + 1.5,
      color,
      life: 400 + Math.random() * 400,
      maxLife: 800,
      alpha: 1,
    });
  }

  world.screenShake = Math.max(world.screenShake, size === 'large' ? 16 : size === 'medium' ? 8 : 4);
}

function createMuzzleFlash(world: GameWorld, x: number, y: number) {
  for (let i = 0; i < 4; i++) {
    world.particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 30,
      vy: -Math.random() * 70 - 40,
      radius: Math.random() * 2 + 1,
      color: '#67e8f9',
      life: 140,
      maxLife: 140,
      alpha: 0.8,
    });
  }
}

function createThrustParticle(world: GameWorld, p: Player) {
  for (let i = 0; i < 2; i++) {
    const spread = (Math.random() - 0.5) * 8;
    world.particles.push({
      x: p.x + spread,
      y: p.y + p.radius + 4,
      vx: spread * 2,
      vy: Math.random() * 80 + 90,
      radius: Math.random() * 3 + 1,
      color: Math.random() > 0.5 ? '#38bdf8' : '#818cf8',
      life: 180 + Math.random() * 80,
      maxLife: 260,
      alpha: 0.9,
    });
  }
}

// ---------------------------------------------------------------------------
// UPDATE LOOP
// ---------------------------------------------------------------------------
export function updateGame(world: GameWorld, dt: number, now: number): { waveCleared: boolean; playerDead: boolean } {
  if (world.isPaused) return { waveCleared: false, playerDead: false };

  const p = world.player;

  // Screen shake decay
  if (world.screenShake > 0) {
    world.screenShake = Math.max(0, world.screenShake - dt * 25);
  }

  // Update Background Stars
  for (const s of world.stars) {
    s.y += s.speed * (dt * 60);
    if (s.y > world.height) {
      s.y = 0;
      s.x = Math.random() * world.width;
    }
  }

  // Handle Player Movement (Keyboard + Touch)
  let moveX = 0;
  let moveY = 0;

  if (world.keysPressed['ArrowLeft'] || world.keysPressed['KeyA']) moveX -= 1;
  if (world.keysPressed['ArrowRight'] || world.keysPressed['KeyD']) moveX += 1;
  if (world.keysPressed['ArrowUp'] || world.keysPressed['KeyW']) moveY -= 1;
  if (world.keysPressed['ArrowDown'] || world.keysPressed['KeyS']) moveY += 1;

  if (world.touchControl.active) {
    moveX = world.touchControl.dx;
    moveY = world.touchControl.dy;
  }

  // Normalize if diagonal
  const mag = Math.hypot(moveX, moveY);
  if (mag > 1) {
    moveX /= mag;
    moveY /= mag;
  }

  // Inertia / damping
  const targetVx = moveX * p.speed;
  const targetVy = moveY * p.speed;
  p.vx += (targetVx - p.vx) * Math.min(1, dt * 14);
  p.vy += (targetVy - p.vy) * Math.min(1, dt * 14);

  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // Screen boundaries
  p.x = Math.max(p.radius, Math.min(world.width - p.radius, p.x));
  p.y = Math.max(p.radius, Math.min(world.height - p.radius, p.y));

  // Thruster trail
  createThrustParticle(world, p);

  // Auto/Continuous fire
  const wantsShooting =
    world.keysPressed['Space'] ||
    world.keysPressed['KeyJ'] ||
    world.touchControl.shooting ||
    world.touchControl.active;

  if (wantsShooting) {
    firePlayerBullet(world, now);
  }

  // Shield regeneration (after 3.5s of taking no damage)
  p.shieldRegenTimer += dt * 1000;
  if (p.shieldRegenTimer > 3500 && p.shield < p.maxShield) {
    p.shield = Math.min(p.maxShield, p.shield + dt * 15);
  }

  // Invulnerability timer decay
  if (p.invulnerableTimer > 0) {
    p.invulnerableTimer = Math.max(0, p.invulnerableTimer - dt * 1000);
  }

  // Combo decay
  if (p.comboTimer > 0) {
    p.comboTimer -= dt * 1000;
    if (p.comboTimer <= 0) {
      p.combo = 0;
    }
  }

  // Wave Spawner queue processing
  if (world.waveActive) {
    world.waveTimer += dt * 1000;
    for (let i = world.waveSpawnQueue.length - 1; i >= 0; i--) {
      const item = world.waveSpawnQueue[i];
      if (world.waveTimer >= item.delay) {
        spawnEnemy(world, item.type);
        world.waveSpawnQueue.splice(i, 1);
      }
    }
  }

  // -------------------------------------------------------------------------
  // UPDATE BULLETS
  // -------------------------------------------------------------------------
  for (let i = world.bullets.length - 1; i >= 0; i--) {
    const b = world.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt * 1000;

    // Out of bounds or life expired
    if (
      b.life <= 0 ||
      b.y < -30 ||
      b.y > world.height + 30 ||
      b.x < -30 ||
      b.x > world.width + 30
    ) {
      world.bullets.splice(i, 1);
    }
  }

  // -------------------------------------------------------------------------
  // UPDATE ENEMIES
  // -------------------------------------------------------------------------
  for (let i = world.enemies.length - 1; i >= 0; i--) {
    const e = world.enemies[i];
    e.behaviorTimer += dt;

    // Movement behavior based on type
    if (e.type === 'ASTEROID') {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.angle += dt * 1.5;
    } else if (e.type === 'SCOUT') {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      // Bounce off lateral walls
      if (e.x < e.radius || e.x > world.width - e.radius) {
        e.vx = -e.vx;
      }
      // Shoot at player
      if (now - e.lastShootTime > e.shootCooldown && e.y > 20 && e.y < world.height * 0.7) {
        e.lastShootTime = now;
        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        const speed = 280;
        world.bullets.push({
          id: 'eb_' + Math.random(),
          x: e.x,
          y: e.y + e.radius,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 4,
          damage: 15,
          color: COLORS.enemyBullet,
          isPlayer: false,
          pierce: 1,
          life: 3000,
          maxLife: 3000,
        });
        sounds.playLaser('enemy');
      }
    } else if (e.type === 'CRUISER') {
      e.x += Math.sin(e.behaviorTimer * 1.8) * 80 * dt;
      e.y += e.vy * dt;
      // Stop moving down when reaching top third of screen
      if (e.y > world.height * 0.25) {
        e.vy = 0;
      }
      // Heavy salvo shooting
      if (now - e.lastShootTime > e.shootCooldown && e.y > 40) {
        e.lastShootTime = now;
        // Dual laser salvo
        const offsets = [-14, 14];
        offsets.forEach((ox) => {
          world.bullets.push({
            id: 'eb_' + Math.random(),
            x: e.x + ox,
            y: e.y + e.radius,
            vx: ox * 3,
            vy: 240,
            radius: 5,
            damage: 20,
            color: COLORS.enemyBullet,
            isPlayer: false,
            pierce: 1,
            life: 3500,
            maxLife: 3500,
          });
        });
        sounds.playLaser('enemy');
      }
    } else if (e.type === 'KAMIKAZE') {
      // Homing tracking until close, then dive
      if (e.y < p.y - 120) {
        const targetAngle = Math.atan2(p.y - e.y, p.x - e.x);
        e.vx += Math.cos(targetAngle) * 350 * dt;
        e.vy += Math.sin(targetAngle) * 250 * dt;
        // Cap speed
        const curSpd = Math.hypot(e.vx, e.vy);
        if (curSpd > 320) {
          e.vx = (e.vx / curSpd) * 320;
          e.vy = (e.vy / curSpd) * 320;
        }
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    } else if (e.type === 'BOSS') {
      // Boss pattern
      if (e.y < world.height * 0.2) {
        e.y += e.vy * dt;
      } else {
        // Horizontal patrol
        e.x += e.vx * dt;
        if (e.x < e.radius + 20 || e.x > world.width - e.radius - 20) {
          e.vx = -e.vx;
        }
      }

      // Boss multi-shot patterns
      if (now - e.lastShootTime > e.shootCooldown && e.y > 60) {
        e.lastShootTime = now;
        // 5-way spread burst
        for (let s = -2; s <= 2; s++) {
          const angle = Math.PI / 2 + s * 0.25;
          const speed = 230;
          world.bullets.push({
            id: 'eb_' + Math.random(),
            x: e.x,
            y: e.y + e.radius - 8,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 5,
            damage: 22,
            color: COLORS.enemyBullet,
            isPlayer: false,
            pierce: 1,
            life: 4000,
            maxLife: 4000,
          });
        }
        sounds.playLaser('enemy');
      }
    }

    // Remove if fallen below bottom of screen
    if (e.y > world.height + 60) {
      world.enemies.splice(i, 1);
    }
  }

  // -------------------------------------------------------------------------
  // COLLISION DETECTION: PLAYER BULLETS vs ENEMIES
  // -------------------------------------------------------------------------
  for (let bi = world.bullets.length - 1; bi >= 0; bi--) {
    const b = world.bullets[bi];
    if (!b.isPlayer) continue;

    for (let ei = world.enemies.length - 1; ei >= 0; ei--) {
      const e = world.enemies[ei];
      const dist = Math.hypot(b.x - e.x, b.y - e.y);

      if (dist < b.radius + e.radius) {
        // Hit!
        e.health -= b.damage;
        p.shotsHit++;
        b.pierce--;

        // Hit spark
        for (let k = 0; k < 4; k++) {
          world.particles.push({
            x: b.x,
            y: b.y,
            vx: (Math.random() - 0.5) * 120,
            vy: (Math.random() - 0.5) * 120,
            radius: 2,
            color: '#67e8f9',
            life: 180,
            maxLife: 180,
            alpha: 1,
          });
        }

        // Check if enemy died
        if (e.health <= 0) {
          const isBoss = e.isBoss;
          createExplosion(world, e.x, e.y, isBoss ? 'large' : e.radius > 20 ? 'medium' : 'small');
          spawnPowerUp(world, e.x, e.y);

          // Update combo
          p.combo++;
          p.comboTimer = 3200; // 3.2s combo window
          if (p.combo > p.maxCombo) p.maxCombo = p.combo;

          // Score with combo multiplier
          const comboMultiplier = 1 + Math.min(4, Math.floor(p.combo / 4) * 0.5);
          const earned = Math.round(e.scoreValue * comboMultiplier);
          p.score += earned;
          p.kills++;

          // Charge bomb by 4% to 15%
          p.bombCharge = Math.min(100, p.bombCharge + (isBoss ? 40 : 6));

          // Floating score text
          addFloatingText(
            world,
            p.combo > 3 ? `+${earned} (x${comboMultiplier})` : `+${earned}`,
            e.x,
            e.y,
            p.combo > 5 ? '#f59e0b' : '#38bdf8',
            900,
            p.combo > 5 ? 18 : 14,
          );

          world.enemies.splice(ei, 1);
        }

        if (b.pierce <= 0) {
          world.bullets.splice(bi, 1);
          break;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // COLLISION DETECTION: ENEMY BULLETS vs PLAYER
  // -------------------------------------------------------------------------
  for (let bi = world.bullets.length - 1; bi >= 0; bi--) {
    const b = world.bullets[bi];
    if (b.isPlayer) continue;

    const dist = Math.hypot(b.x - p.x, b.y - p.y);
    if (dist < b.radius + p.radius && p.invulnerableTimer <= 0) {
      // Damage Player
      applyDamageToPlayer(world, b.damage);
      world.bullets.splice(bi, 1);
    }
  }

  // -------------------------------------------------------------------------
  // COLLISION DETECTION: ENEMIES vs PLAYER
  // -------------------------------------------------------------------------
  for (let ei = world.enemies.length - 1; ei >= 0; ei--) {
    const e = world.enemies[ei];
    const dist = Math.hypot(e.x - p.x, e.y - p.y);

    if (dist < e.radius + p.radius && p.invulnerableTimer <= 0) {
      // Collision damage
      const ramDamage = e.type === 'KAMIKAZE' ? 45 : e.type === 'ASTEROID' ? 30 : 25;
      applyDamageToPlayer(world, ramDamage);
      e.health -= 60;
      if (e.health <= 0) {
        createExplosion(world, e.x, e.y, 'medium');
        world.enemies.splice(ei, 1);
      }
    }
  }

  // -------------------------------------------------------------------------
  // POWER-UPS vs PLAYER
  // -------------------------------------------------------------------------
  for (let pi = world.powerUps.length - 1; pi >= 0; pi--) {
    const pu = world.powerUps[pi];
    pu.x += pu.vx * dt;
    pu.y += pu.vy * dt;
    pu.life -= dt * 1000;

    const dist = Math.hypot(pu.x - p.x, pu.y - p.y);
    if (dist < pu.radius + p.radius + 8) {
      // Picked up!
      sounds.playPowerUp();
      applyPowerUp(world, pu.type);
      world.powerUps.splice(pi, 1);
    } else if (pu.life <= 0 || pu.y > world.height + 20) {
      world.powerUps.splice(pi, 1);
    }
  }

  // -------------------------------------------------------------------------
  // PARTICLES UPDATE
  // -------------------------------------------------------------------------
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const part = world.particles[i];
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    part.life -= dt * 1000;
    part.alpha = Math.max(0, part.life / part.maxLife);
    if (part.life <= 0) {
      world.particles.splice(i, 1);
    }
  }

  // -------------------------------------------------------------------------
  // FLOATING TEXTS UPDATE
  // -------------------------------------------------------------------------
  for (let i = world.floatingTexts.length - 1; i >= 0; i--) {
    const ft = world.floatingTexts[i];
    ft.y += ft.vy * dt;
    ft.life -= dt * 1000;
    if (ft.life <= 0) {
      world.floatingTexts.splice(i, 1);
    }
  }

  // Check wave cleared condition
  const waveCleared =
    world.waveActive &&
    world.waveSpawnQueue.length === 0 &&
    world.enemies.length === 0;

  if (waveCleared) {
    world.waveActive = false;
    sounds.playWaveComplete();
  }

  const playerDead = p.health <= 0;
  if (playerDead) {
    createExplosion(world, p.x, p.y, 'large');
    sounds.playGameOver();
  }

  return { waveCleared, playerDead };
}

function applyDamageToPlayer(world: GameWorld, damage: number) {
  const p = world.player;
  p.shieldRegenTimer = 0; // reset regen
  p.combo = 0; // break combo on hit

  if (p.shield > 0) {
    sounds.playShieldHit();
    if (p.shield >= damage) {
      p.shield -= damage;
    } else {
      const remainder = damage - p.shield;
      p.shield = 0;
      p.health -= remainder;
    }
  } else {
    sounds.playExplosion('small');
    p.health -= damage;
  }

  p.invulnerableTimer = 600; // Brief 0.6s grace period
  world.screenShake = 10;

  // Flash particles around player
  for (let i = 0; i < 8; i++) {
    world.particles.push({
      x: p.x,
      y: p.y,
      vx: (Math.random() - 0.5) * 150,
      vy: (Math.random() - 0.5) * 150,
      radius: 2.5,
      color: '#ef4444',
      life: 250,
      maxLife: 250,
      alpha: 1,
    });
  }
}

function applyPowerUp(world: GameWorld, type: PowerUpType) {
  const p = world.player;
  switch (type) {
    case 'HEAL': {
      p.health = Math.min(p.maxHealth, p.health + 35);
      addFloatingText(world, '+35 HEALTH', p.x, p.y - 20, COLORS.powerUpHeal, 1200, 16);
      break;
    }
    case 'SHIELD': {
      p.shield = p.maxShield;
      addFloatingText(world, 'SHIELDS RESTORED', p.x, p.y - 20, COLORS.powerUpShield, 1200, 16);
      break;
    }
    case 'WEAPON': {
      p.weaponLevel = Math.min(5, p.weaponLevel + 1);
      addFloatingText(world, `WEAPON LV.${p.weaponLevel}`, p.x, p.y - 20, COLORS.powerUpWeapon, 1400, 18);
      break;
    }
    case 'BOMB': {
      p.bombCharge = 100;
      addFloatingText(world, 'SUPER BOMB READY', p.x, p.y - 20, COLORS.powerUpBomb, 1400, 18);
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// RENDER LOOP
// ---------------------------------------------------------------------------
export function renderGame(ctx: CanvasRenderingContext2D, world: GameWorld) {
  const { width, height, screenShake } = world;

  ctx.save();

  // Apply screen shake
  if (screenShake > 0) {
    const offsetX = (Math.random() - 0.5) * screenShake;
    const offsetY = (Math.random() - 0.5) * screenShake;
    ctx.translate(offsetX, offsetY);
  }

  // Clear canvas with space void color
  ctx.fillStyle = '#060813';
  ctx.fillRect(0, 0, width, height);

  // Deep space subtle gradient nebula
  const nebulaGrad = ctx.createRadialGradient(
    width * 0.4,
    height * 0.3,
    50,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.8,
  );
  nebulaGrad.addColorStop(0, 'rgba(30, 27, 75, 0.45)');
  nebulaGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.3)');
  nebulaGrad.addColorStop(1, 'rgba(6, 8, 19, 1)');
  ctx.fillStyle = nebulaGrad;
  ctx.fillRect(0, 0, width, height);

  // Draw Starfield
  for (const s of world.stars) {
    ctx.fillStyle = s.color;
    ctx.globalAlpha = s.alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Draw Power-ups
  for (const pu of world.powerUps) {
    drawPowerUp(ctx, pu);
  }

  // Draw Particles
  for (const part of world.particles) {
    ctx.save();
    ctx.globalAlpha = part.alpha;
    ctx.fillStyle = part.color;
    ctx.beginPath();
    ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw Enemies
  for (const e of world.enemies) {
    drawEnemy(ctx, e);
  }

  // Draw Bullets
  for (const b of world.bullets) {
    drawBullet(ctx, b);
  }

  // Draw Player
  drawPlayer(ctx, world.player);

  // Draw Floating Texts
  for (const ft of world.floatingTexts) {
    const alpha = Math.max(0, ft.life / ft.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${ft.size || 16}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillStyle = ft.color;
    ctx.textAlign = 'center';
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 8;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player) {
  // Invulnerability flicker
  if (p.invulnerableTimer > 0 && Math.floor(p.invulnerableTimer / 80) % 2 === 0) {
    return;
  }

  ctx.save();
  ctx.translate(p.x, p.y);

  // Shield aura
  if (p.shield > 0) {
    const shieldAlpha = Math.min(0.6, 0.2 + (p.shield / p.maxShield) * 0.4);
    ctx.save();
    ctx.strokeStyle = `rgba(129, 140, 248, ${shieldAlpha})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Sleek delta fighter craft
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 12;

  // Main hull
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(0, -p.radius - 2); // Nose
  ctx.lineTo(p.radius * 0.85, p.radius); // Right wing tip
  ctx.lineTo(p.radius * 0.35, p.radius * 0.6); // Right thruster notch
  ctx.lineTo(0, p.radius * 0.75); // Center engine
  ctx.lineTo(-p.radius * 0.35, p.radius * 0.6); // Left thruster notch
  ctx.lineTo(-p.radius * 0.85, p.radius); // Left wing tip
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Neon cockpit canopy
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(0, -p.radius * 0.5);
  ctx.lineTo(p.radius * 0.25, p.radius * 0.1);
  ctx.lineTo(0, p.radius * 0.25);
  ctx.lineTo(-p.radius * 0.25, p.radius * 0.1);
  ctx.closePath();
  ctx.fill();

  // Wing tip blasters
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(-p.radius * 0.85 - 1, p.radius * 0.4, 3, 7);
  ctx.fillRect(p.radius * 0.85 - 2, p.radius * 0.4, 3, 7);

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
  ctx.save();
  ctx.translate(e.x, e.y);

  if (e.type === 'ASTEROID') {
    ctx.rotate(e.angle);
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const sides = 7;
    for (let s = 0; s < sides; s++) {
      const a = (s / sides) * Math.PI * 2;
      const r = e.radius * (0.8 + (s % 2 === 0 ? 0.2 : -0.1));
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (e.type === 'SCOUT') {
    // Triangular dart
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#431407';
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, e.radius); // Forward tip pointing down
    ctx.lineTo(e.radius * 0.75, -e.radius * 0.7);
    ctx.lineTo(0, -e.radius * 0.3);
    ctx.lineTo(-e.radius * 0.75, -e.radius * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (e.type === 'CRUISER') {
    // Hexagonal armored dreadnought
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#450a0a';
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(0, e.radius);
    ctx.lineTo(e.radius * 0.9, e.radius * 0.3);
    ctx.lineTo(e.radius * 0.9, -e.radius * 0.6);
    ctx.lineTo(0, -e.radius * 0.9);
    ctx.lineTo(-e.radius * 0.9, -e.radius * 0.6);
    ctx.lineTo(-e.radius * 0.9, e.radius * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Core glow
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.type === 'KAMIKAZE') {
    // Sharp razor missile
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#831843';
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, e.radius * 1.2);
    ctx.lineTo(e.radius * 0.6, -e.radius);
    ctx.lineTo(0, -e.radius * 0.6);
    ctx.lineTo(-e.radius * 0.6, -e.radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (e.type === 'BOSS') {
    // Massive Titan Battleship
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#1c0505';
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 3;

    // Heavy main fuselage
    ctx.beginPath();
    ctx.moveTo(0, e.radius * 1.1);
    ctx.lineTo(e.radius * 0.6, e.radius * 0.6);
    ctx.lineTo(e.radius * 1.1, 0);
    ctx.lineTo(e.radius * 0.8, -e.radius * 0.8);
    ctx.lineTo(0, -e.radius * 0.5);
    ctx.lineTo(-e.radius * 0.8, -e.radius * 0.8);
    ctx.lineTo(-e.radius * 1.1, 0);
    ctx.lineTo(-e.radius * 0.6, e.radius * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing core reactor
    const pulse = (Math.sin(performance.now() * 0.006) + 1) * 0.5;
    ctx.fillStyle = `rgba(239, 68, 68, ${0.6 + pulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Health Bar over enemy (only if damaged or boss)
  if (e.health < e.maxHealth || e.isBoss) {
    const barWidth = e.radius * 2;
    const barHeight = e.isBoss ? 6 : 4;
    const hpRatio = Math.max(0, e.health / e.maxHealth);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(-barWidth / 2, -e.radius - 12, barWidth, barHeight);

    ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(-barWidth / 2, -e.radius - 12, barWidth * hpRatio, barHeight);
  }

  ctx.restore();
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  ctx.save();
  ctx.shadowColor = b.color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = b.color;

  if (b.pierce > 1) {
    // Laser or Plasma elongated beam
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.radius * 0.8, b.radius * 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp) {
  const pulse = Math.sin(performance.now() * 0.008) * 2;
  ctx.save();
  ctx.translate(pu.x, pu.y);

  // Outer glowing pulse
  ctx.shadowColor = pu.color;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = pu.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, pu.radius + pulse, 0, Math.PI * 2);
  ctx.stroke();

  // Inner core
  ctx.fillStyle = pu.color;
  ctx.beginPath();
  ctx.arc(0, 0, pu.radius * 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
