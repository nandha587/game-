import React from 'react';
import { Difficulty, HighScore } from '../types';
import { DIFFICULTY_SETTINGS } from '../game/constants';
import { Play, Rocket, Shield, Crosshair, Trophy, Volume2, VolumeX } from 'lucide-react';

interface StartScreenProps {
  onStart: (difficulty: Difficulty) => void;
  selectedDifficulty: Difficulty;
  setSelectedDifficulty: (d: Difficulty) => void;
  highScores: HighScore[];
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  selectedDifficulty,
  setSelectedDifficulty,
  highScores,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 text-slate-100 flex flex-col gap-6">
        {/* Title Header */}
        <div className="text-center relative">
          <button
            onClick={onToggleMute}
            className="absolute right-0 top-0 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-2">
            <Rocket className="w-3.5 h-3.5" />
            <span>Retro Space Arcade</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
            COSMIC DEFENDER
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Defend deep space from hostile fleet incursions, collect weapon cores, and defeat boss leviathans.
          </p>
        </div>

        {/* Difficulty Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Combat Protocol
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((d) => {
              const info = DIFFICULTY_SETTINGS[d];
              const isSelected = selectedDifficulty === d;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`p-3 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm">{info.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-cyan-400">
                      {info.scoreMultiplier}x PTS
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {info.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Guide */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-slate-800 rounded font-mono text-cyan-300 font-semibold">
              WASD / Arrows
            </span>
            <span className="text-slate-300">Move Ship</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-slate-800 rounded font-mono text-cyan-300 font-semibold">
              Space / Tap
            </span>
            <span className="text-slate-300">Primary Fire</span>
          </div>
          <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
            <span className="px-2 py-1 bg-slate-800 rounded font-mono text-pink-400 font-semibold">
              K / Shift
            </span>
            <span className="text-slate-300">Super Bomb</span>
          </div>
        </div>

        {/* High Scores summary */}
        {highScores.length > 0 && (
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-2">
              <Trophy className="w-3.5 h-3.5" />
              <span>RECORD ARCHIVE</span>
            </div>
            <div className="space-y-1 text-xs">
              {highScores.slice(0, 3).map((hs, idx) => (
                <div key={idx} className="flex justify-between text-slate-300 font-mono">
                  <span>
                    #{idx + 1} Sector {hs.wave} ({hs.difficulty})
                  </span>
                  <span className="text-cyan-400 font-bold">{hs.score.toLocaleString()} PTS</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Launch Button */}
        <button
          onClick={() => onStart(selectedDifficulty)}
          className="w-full py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2 transition cursor-pointer transform active:scale-98"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Launch Mission</span>
        </button>
      </div>
    </div>
  );
};
