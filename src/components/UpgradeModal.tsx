import React from 'react';
import { Perk } from '../types';
import { Zap, Shield, Heart, Wind, Split, Crosshair, Sun, Flame, Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  perks: Perk[];
  wave: number;
  onSelectPerk: (perk: Perk) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-5 h-5 text-amber-400" />,
  Shield: <Shield className="w-5 h-5 text-indigo-400" />,
  Heart: <Heart className="w-5 h-5 text-rose-400" />,
  Wind: <Wind className="w-5 h-5 text-sky-400" />,
  Split: <Split className="w-5 h-5 text-cyan-400" />,
  Crosshair: <Crosshair className="w-5 h-5 text-emerald-400" />,
  Sun: <Sun className="w-5 h-5 text-purple-400" />,
  Flame: <Flame className="w-5 h-5 text-pink-400" />,
  Sparkles: <Sparkles className="w-5 h-5 text-yellow-300" />,
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ perks, wave, onSelectPerk }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/50 flex flex-col gap-6">
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">
            SECTOR {wave - 1} SECURED
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            SELECT SHIP UPGRADE
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Choose a combat enhancement system to prepare for Sector {wave}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {perks.map((perk) => {
            const isLegendary = perk.rarity === 'LEGENDARY';
            const isRare = perk.rarity === 'RARE';

            return (
              <button
                key={perk.id}
                onClick={() => onSelectPerk(perk)}
                className={`p-4 rounded-xl border flex flex-col items-start text-left transition-all group hover:-translate-y-1 cursor-pointer ${
                  isLegendary
                    ? 'bg-purple-950/40 border-purple-500/60 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-900/40'
                    : isRare
                      ? 'bg-cyan-950/40 border-cyan-500/60 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-900/40'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-700/50">
                    {ICON_MAP[perk.icon] || <Zap className="w-5 h-5 text-cyan-400" />}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isLegendary
                        ? 'border-purple-400/50 text-purple-300 bg-purple-900/30'
                        : isRare
                          ? 'border-cyan-400/50 text-cyan-300 bg-cyan-900/30'
                          : 'border-slate-600 text-slate-400 bg-slate-800/60'
                    }`}
                  >
                    {perk.rarity}
                  </span>
                </div>

                <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                  {perk.title}
                </div>
                <div className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {perk.description}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 w-full text-[11px] font-semibold text-cyan-400 flex items-center justify-end">
                  Install Module &rarr;
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
