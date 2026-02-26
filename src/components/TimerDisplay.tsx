import { useRef, useState, useEffect } from 'react';
import { BlindLevel } from '../types';

interface TimerDisplayProps {
  timeLeft: number;
  currentLevel: BlindLevel;
  nextLevel?: BlindLevel;
  isFullScreen?: boolean;
  onTimeChange?: (time: number) => void;
}

export function TimerDisplay({ timeLeft, currentLevel, nextLevel, isFullScreen = false, onTimeChange }: TimerDisplayProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formatTime = (val: number) => val.toString().padStart(2, '0');

  // Calculate progress percentage based on remaining time
  const totalDuration = currentLevel.duration * 60;
  // Ensure we don't divide by zero
  const safeTotalDuration = totalDuration || 1; 
  const progressPct = Math.min(1, Math.max(0, timeLeft / safeTotalDuration));
  
  // Adjusted radius and viewbox for a cleaner look
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  
  // Reverse direction:
  // We want the bar to shrink counter-clockwise as time decreases.
  // Or shrink clockwise?
  // "Progress should go in other way" usually means counter-clockwise drain.
  // Standard was: clockwise drain (strokeDashoffset increases).
  // To drain counter-clockwise, we keep the stroke fixed and rotate?
  // Or we just change the strokeDashoffset logic.
  
  // Let's try standard "timer" look:
  // Full circle. As time ticks, the "filled" part shrinks counter-clockwise.
  // This means the "gap" grows clockwise from the top.
  
  // To achieve counter-clockwise fill:
  // We can flip the SVG horizontally (scaleX(-1)) or change rotation.
  // Let's keep it simple.
  // If we want the bar to start at top and go CCW to the current time:
  // transform="rotate(-90 160 160) scale(1, -1)" might work but is messy with text.
  
  // Better:
  // strokeDasharray={circumference}
  // strokeDashoffset = circumference * (1 - progressPct) -> This makes it shrink from end.
  // If we want it to shrink from start (CCW), we can just rotate the circle differently?
  // No, stroke-dashoffset always eats from the "end" of the path.
  // If we want to eat from the "start", we can change the rotation to be -90 + (360 * (1-pct))?
  
  // Let's interpret "progress should go in other way" as:
  // Previously: Clockwise fill.
  // Now: Counter-Clockwise fill.
  
  // To do CCW fill:
  // We can set the circle transform to scale(-1, 1) to flip X axis.
  // Then 12 o'clock is still top. 3 o'clock becomes 9 o'clock.
  // And the path draws CCW.
  
  const strokeDashoffset = circumference * (1 - progressPct);
  
  const isWarning = timeLeft <= 60 && timeLeft > 0;

  // Interaction Logic
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleInteraction = (clientX: number, clientY: number) => {
    if (!svgRef.current || !onTimeChange) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate angle relative to center
    const x = clientX - centerX;
    const y = clientY - centerY;
    
    // Atan2 returns angle from -PI to PI
    // We want 0 at top (-PI/2)
    // And increasing CCW?
    // Let's just get the standard angle and map it to our visual.
    
    // Standard angle: 0 is Right (3 o'clock), increases CW (y is down in DOM)
    let angle = Math.atan2(y, x);
    
    // Shift so 0 is Top (-PI/2)
    angle += Math.PI / 2;
    
    // Normalize to 0 - 2PI
    if (angle < 0) angle += 2 * Math.PI;
    
    // Now angle is 0 at top, increasing CW to 2PI.
    // But our visual is CCW.
    // So 0 is top.
    // 90deg (PI/2) is Left (9 o'clock).
    // 180deg (PI) is Bottom.
    // 270deg (3PI/2) is Right.
    
    // If we click at 9 o'clock (Left), that should be 75% time left?
    // Or 25% time left?
    // If bar fills CCW:
    // Top -> Left -> Bottom -> Right -> Top
    // So Left is 25% filled (25% time left).
    // Right is 75% filled (75% time left).
    
    // So we need to invert the angle for CCW calculation.
    // CW Angle: 0 (Top) -> PI/2 (Right) -> PI (Bottom) -> 3PI/2 (Left)
    // We want: 0 (Top) -> PI/2 (Left) -> PI (Bottom) -> 3PI/2 (Right)
    
    // Invert X coordinate effectively?
    // Or just: pct = 1 - (angle / 2PI)?
    // If angle is 0 (Top), pct = 1. (Full) -> Correct.
    // If angle is PI/2 (Right), pct = 0.75. -> Correct.
    // If angle is PI (Bottom), pct = 0.5. -> Correct.
    // If angle is 3PI/2 (Left), pct = 0.25. -> Correct.
    
    // Wait, if I click Left (9 o'clock), visually the bar is filled from Top to Left.
    // That is 25% of the circle.
    // So time should be 25%?
    // If I click Right (3 o'clock), visually bar is filled Top -> Left -> Bottom -> Right.
    // That is 75% of the circle.
    // So time should be 75%?
    
    // Let's re-verify the visual "CCW fill".
    // Top is start.
    // Fills towards Left.
    // So Left (9 o'clock) is 25% filled.
    // Bottom (6 o'clock) is 50% filled.
    // Right (3 o'clock) is 75% filled.
    
    // Standard atan2 with y, x gives:
    // Right: 0
    // Down: PI/2
    // Left: PI
    // Up: -PI/2
    
    // We want Up to be 0.
    // Left to be 0.25 * 2PI.
    // Down to be 0.5 * 2PI.
    // Right to be 0.75 * 2PI.
    
    // Let's compute angle from Top, increasing CCW.
    // Vector from center to mouse: (x, y)
    // Top vector: (0, -1)
    // Angle between them?
    // Or just use atan2(-x, -y) + PI?
    // Let's stick to simple math.
    // angle = atan2(y, x)
    // We want 0 at -PI/2.
    // We want increasing CCW.
    // atan2 increases CW (because Y is down).
    // So we want -angle.
    // -angle at Top (-PI/2) -> PI/2.
    // We want 0. So -angle - PI/2?
    // Let's try:
    // Top (0, -1): atan2 = -PI/2.  Target = 0.
    // Left (-1, 0): atan2 = PI.    Target = PI/2.
    // Bottom (0, 1): atan2 = PI/2. Target = PI.
    // Right (1, 0): atan2 = 0.     Target = 3PI/2.
    
    // Formula: -atan2(y, x) - PI/2
    // Top: -(-PI/2) - PI/2 = 0. Correct.
    // Left: -(PI) - PI/2 = -3PI/2. Normalize (+2PI) -> PI/2. Correct.
    // Bottom: -(PI/2) - PI/2 = -PI. Normalize (+2PI) -> PI. Correct.
    // Right: -(0) - PI/2 = -PI/2. Normalize (+2PI) -> 3PI/2. Correct.
    
    let ccwAngle = -Math.atan2(y, x) - Math.PI / 2;
    if (ccwAngle < 0) ccwAngle += 2 * Math.PI;
    
    const newPct = ccwAngle / (2 * Math.PI);
    const newTime = Math.round(newPct * safeTotalDuration);
    
    onTimeChange(newTime);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onTimeChange) return;
    setIsDragging(true);
    handleInteraction(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onTimeChange) return;
    setIsDragging(true);
    handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleInteraction(e.clientX, e.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault(); // Prevent scrolling while dragging
        handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, safeTotalDuration, onTimeChange]);

  // Handle position calculation
  // Angle for handle: starts at -PI/2 (top). 
  // We want it at the end of the progress bar.
  // Progress bar length is determined by progressPct.
  // Angle = -PI/2 + (progressPct * 2 * PI)
  const handleAngle = -Math.PI / 2 + (progressPct * 2 * Math.PI);
  const handleX = 160 + radius * Math.cos(handleAngle);
  const handleY = 160 + radius * Math.sin(handleAngle);

  return (
    <div className={`relative flex flex-col items-center justify-center w-full mx-auto transition-all duration-500 ${isFullScreen ? 'h-full min-h-0' : 'max-w-5xl'}`}>
      <div className={`relative aspect-square flex items-center justify-center transition-all duration-500 ${isFullScreen ? 'h-full max-h-full w-auto max-w-full' : 'w-full max-w-[650px] max-h-[650px]'}`}>
        
        {/* Glow Filters */}
        <svg className="absolute w-0 h-0">
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>

        {/* Radial Progress Background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            ref={svgRef}
            className={`w-full h-full transform drop-shadow-2xl ${onTimeChange ? 'cursor-pointer' : ''}`}
            viewBox="0 0 320 320"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{ touchAction: 'none' }}
          >
            {/* Track */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-white/5"
            />
            
            {/* Progress */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke={isWarning ? '#ef4444' : 'url(#progressGradient)'}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 160 160) scale(1, -1) translate(0, -320)"
              filter="url(#glow)"
              className={`transition-all duration-100 ease-linear ${isDragging ? 'opacity-90' : 'opacity-100'}`}
            />
          </svg>
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-[70%] aspect-square rounded-full bg-[#0a0a0a] border border-white/5 shadow-2xl pointer-events-none">
          
          {/* Level Label */}
          <div className={`text-zinc-500 font-mono uppercase tracking-[0.3em] mb-2 sm:mb-4 transition-all duration-500 ${isFullScreen ? 'text-[2vh] sm:text-[2.5vh]' : 'text-sm sm:text-base md:text-lg'}`}>
            {currentLevel.label}
          </div>
          
          {/* Timer */}
          <div className={`font-mono font-bold tracking-tighter text-white tabular-nums leading-none mb-4 sm:mb-8 drop-shadow-lg transition-all duration-500 ${isFullScreen ? 'text-[12vh] sm:text-[16vh]' : 'text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]'}`}>
            {formatTime(minutes)}:{formatTime(seconds)}
          </div>

          {/* Blinds & Ante Info */}
          {currentLevel.isBreak ? (
            <div className={`font-serif italic text-indigo-400 animate-pulse transition-all duration-500 ${isFullScreen ? 'text-[6vh] sm:text-[8vh]' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl'}`}>
              Break Time
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 sm:gap-5 w-full px-4">
              {/* Blinds */}
              <div className={`flex items-baseline justify-center gap-1 sm:gap-2 font-bold text-zinc-100 whitespace-nowrap transition-all duration-500 ${isFullScreen ? 'text-[5vh] sm:text-[7vh]' : 'text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'}`}>
                <span>{currentLevel.smallBlind.toLocaleString()}</span>
                <span className={`text-zinc-700 font-light ${isFullScreen ? 'text-[4vh] sm:text-[6vh]' : 'text-xl sm:text-3xl md:text-4xl lg:text-5xl'}`}>/</span>
                <span>{currentLevel.bigBlind.toLocaleString()}</span>
              </div>
              
              {/* Ante */}
              {currentLevel.ante ? (
                <div className={`flex items-center gap-2 sm:gap-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 transition-all duration-500 ${isFullScreen ? 'px-6 py-2' : 'px-4 sm:px-6 py-1 sm:py-2'}`}>
                  <span className={`text-indigo-400 font-bold tracking-wider uppercase transition-all duration-500 ${isFullScreen ? 'text-[1.5vh]' : 'text-[10px] sm:text-sm md:text-base'}`}>Ante</span>
                  <span className={`text-indigo-300 font-bold tabular-nums transition-all duration-500 ${isFullScreen ? 'text-[3vh]' : 'text-base sm:text-xl md:text-2xl lg:text-3xl'}`}>{currentLevel.ante.toLocaleString()}</span>
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
        <div className={`flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 transition-all duration-500 ${isFullScreen ? 'absolute top-4 right-4 scale-75 origin-top-right sm:scale-90' : 'mt-8 sm:mt-12 scale-110'}`}>
           <div className="text-zinc-600 text-xs sm:text-sm uppercase tracking-[0.2em] mb-3">Up Next</div>
           <div className="flex items-center gap-4 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
             {nextLevel.isBreak ? (
               <span className="text-indigo-400 font-medium tracking-wide text-lg">Break ({nextLevel.duration}m)</span>
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
