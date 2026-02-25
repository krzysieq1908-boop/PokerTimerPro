import { Play, Pause, SkipForward, SkipBack, RotateCcw, Plus, Minus } from 'lucide-react';

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
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onPrev}
          className="p-4 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
          title="Previous Level"
        >
          <SkipBack size={24} />
        </button>
        
        <button 
          onClick={onToggle}
          className={`
            w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95
            ${isRunning 
              ? 'bg-amber-500/20 text-amber-500 border-2 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]' 
              : 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]'
            }
          `}
        >
          {isRunning ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
        </button>

        <button 
          onClick={onNext}
          className="p-4 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
          title="Next Level"
        >
          <SkipForward size={24} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => onAdjustTime(-60)} className="px-3 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono">-1m</button>
        <button onClick={() => onAdjustTime(-10)} className="px-3 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono">-10s</button>
        <button onClick={onReset} className="p-2 rounded-full text-zinc-500 hover:text-red-400 transition-colors" title="Reset Timer">
          <RotateCcw size={20} />
        </button>
        <button onClick={() => onAdjustTime(10)} className="px-3 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono">+10s</button>
        <button onClick={() => onAdjustTime(60)} className="px-3 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono">+1m</button>
      </div>
    </div>
  );
}
