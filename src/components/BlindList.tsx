import { BlindLevel } from '../types';

interface BlindListProps {
  levels: BlindLevel[];
  currentLevelIndex: number;
}

export function BlindList({ levels, currentLevelIndex }: BlindListProps) {
  return (
    <div className="h-full overflow-y-auto bg-zinc-900/50 rounded-xl border border-white/10 p-4">
      <h3 className="text-zinc-400 text-xs font-mono uppercase tracking-widest mb-4">Structure</h3>
      <div className="space-y-1">
        {levels.map((level, index) => {
          const isCurrent = index === currentLevelIndex;
          const isPast = index < currentLevelIndex;
          
          return (
            <div 
              key={level.id}
              className={`
                grid grid-cols-[40px_1fr_auto] gap-4 p-3 rounded-lg text-sm transition-colors
                ${isCurrent ? 'bg-indigo-500/20 border border-indigo-500/50 text-white' : ''}
                ${isPast ? 'text-zinc-600' : 'text-zinc-300'}
                ${!isCurrent && !isPast ? 'hover:bg-white/5' : ''}
              `}
            >
              <div className="font-mono opacity-50">{index + 1}</div>
              <div className="font-medium">
                {level.isBreak ? (
                  <span className="text-emerald-400">BREAK</span>
                ) : (
                  <span>{level.smallBlind.toLocaleString()} / {level.bigBlind.toLocaleString()} {level.ante ? `(${level.ante})` : ''}</span>
                )}
              </div>
              <div className="font-mono opacity-70">{level.duration}m</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
