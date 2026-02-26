import { Users, Coins, Trophy, TrendingUp, DollarSign, UserMinus, UserPlus, RefreshCw, PlusCircle } from 'lucide-react';
import { TournamentConfig } from '../types';

interface StatsDisplayProps {
  stats: TournamentConfig;
  onUpdate: (updates: Partial<TournamentConfig>) => void;
}

export function StatsDisplay({ stats, onUpdate }: StatsDisplayProps) {
  // Calculations
  const totalChips = 
    (stats.totalEntries * stats.startingStack) + 
    (stats.rebuys * stats.rebuyStack) + 
    (stats.addons * stats.addonStack);
  
  const avgStack = stats.playersRemaining > 0 
    ? Math.floor(totalChips / stats.playersRemaining) 
    : 0;

  const prizePool = 
    (stats.totalEntries * stats.buyIn) + 
    (stats.rebuys * stats.rebuyCost) + 
    (stats.addons * stats.addonCost);

  const handlePlayerBust = () => {
    if (stats.playersRemaining > 0) {
      onUpdate({ playersRemaining: stats.playersRemaining - 1 });
    }
  };

  const handleRebuy = () => {
    onUpdate({ 
      rebuys: stats.rebuys + 1,
      // Usually a rebuy implies a player is still in or re-entered, 
      // but often it's just adding chips. 
      // If it's a re-entry, totalEntries should increment too.
      // For simplicity, let's assume it's just an add-on of chips for now 
      // or user manually adjusts entries if it's a new entry.
      // Actually, often "Rebuy" means staying in. "Re-entry" means new entry.
      // Let's keep it simple: Rebuy adds chips and cost.
    });
  };

  const handleAddon = () => {
    onUpdate({ addons: stats.addons + 1 });
  };

  // Parse payouts
  const payoutStructure = (stats.payouts || "").split('\n')
    .map(line => {
      const parts = line.split(':');
      if (parts.length < 2) return null;
      const place = parts[0].trim();
      const percentageStr = parts[1].trim().replace('%', '');
      const percentage = parseFloat(percentageStr);
      if (isNaN(percentage)) return null;
      return {
        place,
        amount: Math.floor(prizePool * (percentage / 100)),
        percent: percentage
      };
    })
    .filter((item): item is { place: string; amount: number; percent: number } => item !== null);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* Players Card */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-4 flex flex-col justify-between group hover:border-indigo-500/30 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <Users size={18} />
            <span className="text-sm font-medium uppercase tracking-wider">Players</span>
          </div>
          <div className="flex gap-1">
             <button 
              onClick={() => onUpdate({ playersRemaining: stats.playersRemaining + 1, totalEntries: stats.totalEntries + 1 })}
              className="p-1.5 hover:bg-white/10 rounded text-emerald-400"
              title="Add Player"
            >
              <UserPlus size={16} />
            </button>
            <button 
              onClick={handlePlayerBust}
              className="p-1.5 hover:bg-white/10 rounded text-red-400"
              title="Bust Player"
            >
              <UserMinus size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{stats.playersRemaining}</span>
          <span className="text-zinc-600 text-sm">/ {stats.totalEntries}</span>
        </div>
      </div>

      {/* Average Stack Card */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-4 flex flex-col justify-between group hover:border-indigo-500/30 transition-colors">
        <div className="flex items-center gap-2 text-zinc-400 mb-2">
          <TrendingUp size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">Avg Stack</span>
        </div>
        <div className="text-3xl font-bold text-white tabular-nums">
          {avgStack.toLocaleString()}
        </div>
        <div className="text-xs text-zinc-600 mt-1">
          Total Chips: {(totalChips / 1000).toFixed(1)}k
        </div>
      </div>

      {/* Prize Pool Card */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-4 flex flex-col group hover:border-indigo-500/30 transition-colors relative overflow-hidden">
        <div className="flex items-center gap-2 text-zinc-400 mb-2">
          <Trophy size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">Prize Pool</span>
        </div>
        <div className="text-3xl font-bold text-emerald-400 tabular-nums mb-2">
          ${prizePool.toLocaleString()}
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 max-h-[80px]">
          {payoutStructure.length > 0 ? (
            <div className="flex flex-col gap-1">
              {payoutStructure.map((payout, i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 last:border-0 pb-1 last:pb-0">
                  <span className="text-zinc-500 font-mono text-xs">{payout.place}</span>
                  <span className="text-zinc-300 font-medium tabular-nums">${payout.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-600 italic">
              {stats.payouts || "Winner takes all"}
            </div>
          )}
        </div>
      </div>

      {/* Rebuys / Addons Control */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-4 flex flex-col justify-between group hover:border-indigo-500/30 transition-colors">
        <div className="flex items-center gap-2 text-zinc-400 mb-2">
          <Coins size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">Extras</span>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleRebuy}
            onContextMenu={(e) => {
              e.preventDefault();
              if (stats.rebuys > 0) onUpdate({ rebuys: stats.rebuys - 1 });
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-2 rounded-lg transition-colors text-sm font-medium relative group/btn"
            title="Right-click to undo"
          >
            <RefreshCw size={14} />
            Rebuy ({stats.rebuys})
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
              Right-click to undo
            </span>
          </button>
          <button 
            onClick={handleAddon}
            onContextMenu={(e) => {
              e.preventDefault();
              if (stats.addons > 0) onUpdate({ addons: stats.addons - 1 });
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-2 rounded-lg transition-colors text-sm font-medium relative group/btn"
            title="Right-click to undo"
          >
            <PlusCircle size={14} />
            Add-on ({stats.addons})
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
              Right-click to undo
            </span>
          </button>
        </div>
      </div>

    </div>
  );
}
