import { Perk, Difficulty } from '../types';

export const COLORS = {
  player: '#38bdf8', // sky-400
  playerShield: '#818cf8', // indigo-400
  playerBullet: '#38bdf8',
  playerLaser: '#06b6d4',
  playerPlasma: '#a855f7',
  enemyBullet: '#f43f5e',
  asteroid: '#94a3b8',
  scout: '#f97316',
  cruiser: '#ef4444',
  kamikaze: '#ec4899',
  boss: '#e11d48',
  powerUpHeal: '#10b981',
  powerUpShield: '#6366f1',
  powerUpWeapon: '#f59e0b',
  powerUpBomb: '#ec4899',
};

export const DIFFICULTY_SETTINGS: Record<
  Difficulty,
  {
    name: string;
    description: string;
    playerHealthMultiplier: number;
    enemySpeedMultiplier: number;
    enemyHealthMultiplier: number;
    scoreMultiplier: number;
  }
> = {
  CASUAL: {
    name: 'Casual',
    description: 'Generous shields, slower enemies. Great for relaxing arcade action.',
    playerHealthMultiplier: 1.5,
    enemySpeedMultiplier: 0.8,
    enemyHealthMultiplier: 0.8,
    scoreMultiplier: 1.0,
  },
  STANDARD: {
    name: 'Standard',
    description: 'Balanced challenge with tactical dodging and timed power-up usage.',
    playerHealthMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
    enemyHealthMultiplier: 1.0,
    scoreMultiplier: 1.5,
  },
  HARDCORE: {
    name: 'Hardcore',
    description: 'Faster bullet hell, high aggression, maximum score rewards.',
    playerHealthMultiplier: 0.75,
    enemySpeedMultiplier: 1.25,
    enemyHealthMultiplier: 1.25,
    scoreMultiplier: 2.5,
  },
};

export const AVAILABLE_PERKS: Perk[] = [
  {
    id: 'rapid_fire',
    title: 'Hyper Capacitor',
    description: 'Increase firing rate by 22% for relentless bullet streams.',
    icon: 'Zap',
    rarity: 'COMMON',
    effect: (p) => {
      p.fireCooldown = Math.max(80, p.fireCooldown * 0.78);
    },
  },
  {
    id: 'shield_boost',
    title: 'Aegis Shielding',
    description: '+35 Maximum Shield capacity and instant full shield recharge.',
    icon: 'Shield',
    rarity: 'COMMON',
    effect: (p) => {
      p.maxShield += 35;
      p.shield = p.maxShield;
    },
  },
  {
    id: 'hull_repair',
    title: 'Titanium Plating',
    description: '+40 Max Health and instantly restore 60 Health.',
    icon: 'Heart',
    rarity: 'COMMON',
    effect: (p) => {
      p.maxHealth += 40;
      p.health = Math.min(p.maxHealth, p.health + 60);
    },
  },
  {
    id: 'sublight_thrusters',
    title: 'Sub-Light Thrusters',
    description: '+20% Flight speed and enhanced evasive maneuverability.',
    icon: 'Wind',
    rarity: 'COMMON',
    effect: (p) => {
      p.speed *= 1.2;
    },
  },
  {
    id: 'spread_shot',
    title: 'Multi-Vector Spread',
    description: 'Converts primary blaster into a triple spread salvo.',
    icon: 'Split',
    rarity: 'RARE',
    effect: (p) => {
      p.weaponType = 'SPREAD';
      p.weaponLevel = Math.min(5, p.weaponLevel + 1);
    },
  },
  {
    id: 'tachyon_laser',
    title: 'Tachyon Beam',
    description: 'Unleashes high-frequency piercing laser beams that cut through swarms.',
    icon: 'Crosshair',
    rarity: 'RARE',
    effect: (p) => {
      p.weaponType = 'LASER';
      p.weaponLevel = Math.min(5, p.weaponLevel + 1);
    },
  },
  {
    id: 'plasma_cannon',
    title: 'Plasma Torpedoes',
    description: 'Fires explosive heavy plasma orbs with massive kinetic punch.',
    icon: 'Sun',
    rarity: 'RARE',
    effect: (p) => {
      p.weaponType = 'PLASMA';
      p.weaponLevel = Math.min(5, p.weaponLevel + 1);
    },
  },
  {
    id: 'super_bomb_capacitor',
    title: 'Orbital EMP Surge',
    description: 'Fully charges Super Bomb immediately and doubles charging rate.',
    icon: 'Flame',
    rarity: 'LEGENDARY',
    effect: (p) => {
      p.bombCharge = 100;
    },
  },
  {
    id: 'nanite_swarm',
    title: 'Nanite Swarm Overdrive',
    description: 'Fully repairs hull, restores shields, and increases weapon damage.',
    icon: 'Sparkles',
    rarity: 'LEGENDARY',
    effect: (p) => {
      p.health = p.maxHealth;
      p.shield = p.maxShield;
      p.weaponLevel = Math.min(5, p.weaponLevel + 1);
    },
  },
];
