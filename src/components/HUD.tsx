import React from 'react';
import { Player, Difficulty } from '../types';
import { Shield, Heart, Zap, Volume2, VolumeX, Pause, Play, Bomb, Flame } from 'lucide-react';

interface HUDProps {
  player: Player;
  wave: number;
  highScore: number;
  difficulty: Difficulty;
  isMuted: boolean;
  isPaused: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onTriggerBomb: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  wave,
  highScore,
  difficulty,
  isMuted,
  isPaused,
  onToggleMute,
  onTogglePause,
  onTriggerBomb,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
  const shieldPercent = Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100));
  const bombReady = player.bombCharge >= 100;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Health & Shield Gauges */}
        <div className="flex flex-col gap-2 w-52 sm:w-64">
          {/* Shield Gauge */}
          <div className="bg-slate-900/85 backdrop-blur-md rounded-lg p-2 border border-indigo-500/30 shadow-lg shadow-indigo-950/20">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-300 mb-1">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>SHIELD MATRIX</span>
              </div>
              <span>
                {Math.round(player.shield)} / {player.maxShield}
              </span>
            </div>
            <div className="w-full bg-slate-950/90 rounded-full h-2 overflow-hidden border border-indigo-900/50">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-150"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          </div>

          {/* Hull Integrity */}
          <div className="bg-slate-900/85 backdrop-blur-md rounded-lg p-2 border border-rose-500/30 shadow-lg shadow-rose-950/20">
            <div className="flex items-center justify-between text-xs font-semibold text-rose-300 mb-1">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>HULL INTEGRITY</span>
              </div>
              <span>
                {Math.max(0, Math.round(player.health))} / {player.maxHealth}
              </span>
            </div>
            <div className="w-full bg-slate-950/90 rounded-full h-2 overflow-hidden border border-rose-900/50">
              <div
                className={`h-full transition-all duration-150 ${
                  hpPercent > 40
                    ? 'bg-gradient-to-r from-rose-500 to-emerald-400'
                    : 'bg-rose-500 animate-pulse'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Weapon Status Tag */}
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-slate-900/80 px-2.5 py-0.5 rounded border border-cyan-500/40 text-cyan-300 font-medium">
              {player.weaponType} LV.{player.weaponLevel}
            </span>
            <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 text-slate-400">
              {difficulty}
            </span>
          </div>
        </div>

        {/* Center: Wave & Combo Display */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 px-4 py-1.5 rounded-full shadow-lg text-center">
            <span className="text-xs tracking-widest text-cyan-400 font-bold uppercase">
              SECTOR {wave}
            </span>
          </div>

          {player.combo > 1 && (
            <div className="mt-1.5 flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold animate-bounce">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>COMBO x{player.combo}</span>
            </div>
          )}
        </div>

        {/* Right: Score, Controls & Audio */}
        <div className="flex flex-col items-end gap-2">
          {/* Score Card */}
          <div className="bg-slate-900/85 backdrop-blur-md rounded-lg p-2.5 px-4 border border-cyan-500/30 text-right shadow-lg">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">SCORE</div>
            <div className="text-lg sm:text-xl font-black text-cyan-300 font-mono tracking-tight">
              {player.score.toLocaleString()}
            </div>
            {highScore > 0 && (
              <div className="text-[10px] text-slate-400 font-mono">
                BEST: {highScore.toLocaleString()}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onTogglePause}
              title={isPaused ? 'Resume Game' : 'Pause Game'}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar: EMP Super Bomb Button */}
      <div className="flex items-end justify-between">
        <div className="pointer-events-auto">
          <button
            onClick={onTriggerBomb}
            disabled={!bombReady}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xl ${
              bombReady
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border border-pink-400/80 shadow-pink-500/30 animate-pulse cursor-pointer'
                : 'bg-slate-900/80 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <Bomb className="w-4 h-4" />
            <span>SUPER BOMB {bombReady ? '(READY)' : `(${Math.round(player.bombCharge)}%)`}</span>
          </button>
        </div>

        {/* Tip */}
        <div className="hidden sm:block text-[11px] text-slate-400/80 bg-slate-950/70 px-3 py-1 rounded-md border border-slate-800/80">
          [WASD / Arrows] Move &bull; [Space] Fire &bull; [K / Shift] Super Bomb &bull; [P] Pause
        </div>
      </div>
    </div>
  );
};
