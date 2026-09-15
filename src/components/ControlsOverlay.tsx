import React from 'react';
import { Bomb } from 'lucide-react';

interface ControlsOverlayProps {
  bombReady: boolean;
  bombCharge: number;
  onTriggerBomb: () => void;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  bombReady,
  bombCharge,
  onTriggerBomb,
}) => {
  return (
    <div className="sm:hidden pointer-events-none absolute bottom-4 right-4 z-20 flex flex-col items-end gap-3">
      {/* Mobile Bomb Touch Action Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTriggerBomb();
        }}
        disabled={!bombReady}
        className={`pointer-events-auto w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-2xl border transition-all active:scale-95 ${
          bombReady
            ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white border-pink-300 shadow-pink-500/50 animate-pulse'
            : 'bg-slate-900/80 text-slate-500 border-slate-700/60'
        }`}
      >
        <Bomb className="w-6 h-6" />
        <span className="text-[9px] font-bold mt-0.5">
          {bombReady ? 'EMP' : `${Math.round(bombCharge)}%`}
        </span>
      </button>
    </div>
  );
};
