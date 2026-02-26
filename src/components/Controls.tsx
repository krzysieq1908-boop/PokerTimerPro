import { Play, Pause, SkipForward, SkipBack, RotateCcw, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';

interface ControlsProps {
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  onNext: () => void;
  onPrev: () => void;
  onAdjustTime: (seconds: number) => void;
}

export function Controls({ isRunning, onToggle, onReset, onNext, onPrev, onAdjustTime }: ControlsProps) {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
      
      {/* Main Controls Row */}
      <div className="flex items-center justify-center gap-6 sm:gap-8 w-full">
        
        {/* Previous Level */}
        <button 
          onClick={onPrev}
          className="group relative p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300 active:scale-95"
          title="Previous Level"
        >
          <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <SkipBack size={24} className="relative z-10 text-zinc-400 group-hover:text-white transition-colors" />
        </button>
        
        {/* Play / Pause - The Centerpiece */}
        <button 
          onClick={onToggle}
          className={`
            relative group w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] flex items-center justify-center transition-all duration-500 transform hover:scale-105 active:scale-95
            ${isRunning 
              ? 'bg-[#1a1a1a] border border-white/10 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.5)]'
            }
          `}
        >
          {/* Glow effect behind */}
          {!isRunning && (
            <div className="absolute inset-0 rounded-[2rem] bg-indigo-500 blur-2xl opacity-40 animate-pulse" />
          )}
          
          {/* Icon */}
          <div className="relative z-10">
            {isRunning ? (
              <Pause size={40} className="text-zinc-400 group-hover:text-white transition-colors" fill="currentColor" />
            ) : (
              <Play size={44} className="text-white ml-2" fill="currentColor" />
            )}
          </div>
        </button>

        {/* Next Level */}
        <button 
          onClick={onNext}
          className="group relative p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300 active:scale-95"
          title="Next Level"
        >
          <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <SkipForward size={24} className="relative z-10 text-zinc-400 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Secondary Controls (Time Adjust & Reset) */}
      <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onAdjustTime(-60)} 
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            -1m
          </button>
          <button 
            onClick={() => onAdjustTime(-10)} 
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            -10s
          </button>
        </div>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button 
          onClick={onReset} 
          className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all active:rotate-[-180deg] duration-500" 
          title="Reset Timer"
        >
          <RotateCcw size={18} />
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <div className="flex items-center gap-1">
          <button 
            onClick={() => onAdjustTime(10)} 
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            +10s
          </button>
          <button 
            onClick={() => onAdjustTime(60)} 
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            +1m
          </button>
        </div>
      </div>
    </div>
  );
}
