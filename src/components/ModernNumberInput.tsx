import { ChevronUp, ChevronDown } from 'lucide-react';

interface ModernNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  className?: string;
  label?: string;
  placeholder?: string;
}

export function ModernNumberInput({ value, onChange, min = 0, className = '', label, placeholder }: ModernNumberInputProps) {
  const handleIncrement = () => onChange(value + 1);
  const handleDecrement = () => onChange(Math.max(min, value - 1));

  return (
    <div className={className}>
      {label && <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1.5">{label}</label>}
      <div className="relative group">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          placeholder={placeholder}
          className="w-full bg-zinc-900/50 border border-white/10 rounded-lg pl-3 pr-8 py-2.5 text-white font-mono text-sm focus:border-indigo-500/50 focus:bg-zinc-900 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
        />
        <div className="absolute right-1 top-1 bottom-1 flex flex-col w-5 gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleIncrement}
            className="flex-1 flex items-center justify-center bg-white/5 hover:bg-indigo-500 hover:text-white rounded-t-sm text-zinc-500 transition-colors"
            tabIndex={-1}
            type="button"
          >
            <ChevronUp size={10} />
          </button>
          <button
            onClick={handleDecrement}
            className="flex-1 flex items-center justify-center bg-white/5 hover:bg-indigo-500 hover:text-white rounded-b-sm text-zinc-500 transition-colors"
            tabIndex={-1}
            type="button"
          >
            <ChevronDown size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
