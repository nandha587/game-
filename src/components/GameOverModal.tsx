import React from 'react';
import { Player, Difficulty } from '../types';
import { RotateCcw, Trophy, Target, Crosshair, Flame, ShieldAlert } from 'lucide-react';

interface GameOverModalProps {
  player: Player;
  wave: number;
  difficulty: Difficulty;
  isNewHighScore: boolean;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  player,
  wave,
  difficulty,
  isNewHighScore,
  onRestart,
  onHome,
}) => {
  const accuracy = player.shotsFired > 0 ? Math.round((player.shotsHit / player.shotsFired) * 100) : 0;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900/95 border border-rose-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-rose-950/40 text-white flex flex-col gap-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold tracking-wider uppercase mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>CRITICAL VESSEL FAILURE</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">MISSION TERMINATED</h2>
          <p className="text-xs text-slate-400 mt-1">Sector {wave} overrun by hostile fleet</p>
        </div>

        {/* Score Callout */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center">
          {isNewHighScore && (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30">
              <Trophy className="w-3.5 h-3.5" />
              <span>NEW ALL-TIME RECORD!</span>
            </div>
          )}
          <div className="text-xs uppercase tracking-widest text-slate-400">FINAL COMBAT SCORE</div>
          <div className="text-3xl font-black text-cyan-300 font-mono tracking-tight mt-1">
            {player.score.toLocaleString()}
          </div>
        </div>

        {/* Combat Performance Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Crosshair className="w-3.5 h-3.5 text-orange-400" />
              <span>Hostiles Vaporized</span>
            </div>
            <span className="text-base font-bold font-mono text-white">{player.kills}</span>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Accuracy</span>
            </div>
            <span className="text-base font-bold font-mono text-white">{accuracy}%</span>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Max Combo Streak</span>
            </div>
            <span className="text-base font-bold font-mono text-white">x{player.maxCombo}</span>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Trophy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Difficulty Mode</span>
            </div>
            <span className="text-base font-bold font-mono text-white">{difficulty}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onRestart}
            className="w-full py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 transition cursor-pointer transform active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Deploy Again (Space)</span>
          </button>
          <button
            onClick={onHome}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer"
          >
            Return to Command Menu
          </button>
        </div>
      </div>
    </div>
  );
};
