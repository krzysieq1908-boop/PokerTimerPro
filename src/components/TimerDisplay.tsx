import { BlindLevel } from '../types';

interface TimerDisplayProps {
  timeLeft: number;
  currentLevel: BlindLevel;
  nextLevel?: BlindLevel;
  isFullScreen?: boolean;
}

export function TimerDisplay({ timeLeft, currentLevel, nextLevel, isFullScreen = false }: TimerDisplayProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formatTime = (val: number) => val.toString().padStart(2, '0');

  // Calculate progress percentage
  const totalDuration = currentLevel.duration * 60;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
  
  // Adjusted radius and viewbox for a cleaner look
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const isWarning = timeLeft <= 60 && timeLeft > 0;

  return (
    <div className={`flex flex-col items-center justify-center w-full mx-auto transition-all duration-500 ${isFullScreen ? 'max-w-[85vh]' : 'max-w-5xl'}`}>
      <div className={`relative w-full aspect-square flex items-center justify-center transition-all duration-500 ${isFullScreen ? 'max-w-[85vh] max-h-[85vh]' : 'max-w-[650px] max-h-[650px]'}`}>
        {/* Radial Progress Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg 
            className="w-full h-full transform -rotate-90 drop-shadow-2xl"
            viewBox="0 0 320 320"
          >
            {/* Track */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-white/5"
            />
            {/* Progress */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke="currentColor"
              strokeWidth="16"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`
                transition-all duration-1000 ease-linear drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]
                ${isWarning ? 'text-red-500 animate-pulse' : 'text-indigo-500'}
              `}
            />
          </svg>
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-[75%] aspect-square rounded-full bg-[#0a0a0a]/50 backdrop-blur-sm border border-white/5 shadow-2xl">
          
          {/* Level Label */}
          <div className={`text-zinc-500 font-mono uppercase tracking-[0.3em] mb-2 sm:mb-4 transition-all duration-500 ${isFullScreen ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base md:text-lg'}`}>
            {currentLevel.label}
          </div>
          
          {/* Timer */}
          <div className={`font-mono font-bold tracking-tighter text-white tabular-nums leading-none mb-4 sm:mb-8 drop-shadow-lg transition-all duration-500 ${isFullScreen ? 'text-[12vw] sm:text-[15vh]' : 'text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]'}`}>
            {formatTime(minutes)}:{formatTime(seconds)}
          </div>

          {/* Blinds & Ante Info */}
          {currentLevel.isBreak ? (
            <div className={`font-serif italic text-emerald-400 animate-pulse transition-all duration-500 ${isFullScreen ? 'text-6xl sm:text-8xl' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl'}`}>
              Break Time
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 sm:gap-5 w-full px-4">
              {/* Blinds */}
              <div className={`flex items-baseline justify-center gap-1 sm:gap-2 font-bold text-zinc-100 whitespace-nowrap transition-all duration-500 ${isFullScreen ? 'text-5xl sm:text-7xl md:text-8xl' : 'text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'}`}>
                <span>{currentLevel.smallBlind.toLocaleString()}</span>
                <span className={`text-zinc-700 font-light ${isFullScreen ? 'text-4xl sm:text-6xl' : 'text-xl sm:text-3xl md:text-4xl lg:text-5xl'}`}>/</span>
                <span>{currentLevel.bigBlind.toLocaleString()}</span>
              </div>
              
              {/* Ante */}
              {currentLevel.ante ? (
                <div className={`flex items-center gap-2 sm:gap-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 transition-all duration-500 ${isFullScreen ? 'px-8 py-3' : 'px-4 sm:px-6 py-1 sm:py-2'}`}>
                  <span className={`text-indigo-400 font-bold tracking-wider uppercase transition-all duration-500 ${isFullScreen ? 'text-xl' : 'text-[10px] sm:text-sm md:text-base'}`}>Ante</span>
                  <span className={`text-indigo-300 font-bold tabular-nums transition-all duration-500 ${isFullScreen ? 'text-4xl' : 'text-base sm:text-xl md:text-2xl lg:text-3xl'}`}>{currentLevel.ante.toLocaleString()}</span>
                </div>
              ) : (
                 <div className="h-8 sm:h-14"></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Next Level Preview */}
      {nextLevel && (
        <div className={`flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 transition-all duration-500 ${isFullScreen ? 'mt-16 scale-125' : 'mt-8 sm:mt-12 scale-110'}`}>
           <div className="text-zinc-600 text-xs sm:text-sm uppercase tracking-[0.2em] mb-3">Up Next</div>
           <div className="flex items-center gap-4 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
             {nextLevel.isBreak ? (
               <span className="text-emerald-400 font-medium tracking-wide text-lg">Break ({nextLevel.duration}m)</span>
             ) : (
               <>
                 <div className="flex items-baseline gap-2 text-zinc-300 font-mono text-xl sm:text-2xl">
                    <span>{nextLevel.smallBlind.toLocaleString()}</span>
                    <span className="text-zinc-600">/</span>
                    <span>{nextLevel.bigBlind.toLocaleString()}</span>
                 </div>
                 {nextLevel.ante && (
                    <div className="pl-4 border-l border-white/10 text-zinc-500 text-base font-mono">
                      ({nextLevel.ante})
                    </div>
                 )}
               </>
             )}
           </div>
        </div>
      )}
    </div>
  );
}
