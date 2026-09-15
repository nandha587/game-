export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'UPGRADE_SELECT' | 'GAME_OVER';

export type Difficulty = 'CASUAL' | 'STANDARD' | 'HARDCORE';

export type WeaponType = 'BLASTER' | 'SPREAD' | 'LASER' | 'PLASMA' | 'HOMING';

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  shieldRegenTimer: number;
  speed: number;
  fireCooldown: number; // ms
  lastFireTime: number;
  weaponType: WeaponType;
  weaponLevel: number; // 1 - 5
  bombCharge: number; // 0 - 100
  invulnerableTimer: number; // ms
  score: number;
  combo: number;
  comboTimer: number;
  maxCombo: number;
  kills: number;
  shotsFired: number;
  shotsHit: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  isPlayer: boolean;
  pierce: number;
  life: number;
  maxLife: number;
  isHoming?: boolean;
}

export type EnemyType = 'ASTEROID' | 'SCOUT' | 'CRUISER' | 'KAMIKAZE' | 'BOSS';

export interface Enemy {
  id: string;
  type: EnemyType;
  name?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  scoreValue: number;
  color: string;
  shootCooldown: number;
  lastShootTime: number;
  behaviorTimer: number;
  angle: number;
  isBoss?: boolean;
  bossPhase?: number;
  maxBossPhase?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  alpha: number;
}

export type PowerUpType = 'HEAL' | 'SHIELD' | 'WEAPON' | 'BOMB' | 'OVERDRIVE';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  duration: number;
  color: string;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size?: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  alpha: number;
}

export interface Perk {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
  effect: (player: Player) => void;
}

export interface HighScore {
  score: number;
  wave: number;
  difficulty: Difficulty;
  date: string;
}
