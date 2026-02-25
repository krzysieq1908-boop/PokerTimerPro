import { useState, useEffect, useRef, useCallback } from 'react';
import { BlindLevel } from '../types';

export function usePokerTimer(initialLevels: BlindLevel[]) {
  const [levels, setLevels] = useState<BlindLevel[]>(initialLevels);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(initialLevels[0].duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  
  // Use a ref for the interval so we can clear it easily
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentLevel = levels[currentLevelIndex];
  const nextLevel = levels[currentLevelIndex + 1];

  const playSound = useCallback((type: 'warning' | 'end' = 'end') => {
    // Simple synth using AudioContext
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;

    if (type === 'warning') {
      // 3 short beeps indicating 1 minute left
      for (let i = 0; i < 3; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now + i * 0.3); // A5
        gain.gain.setValueAtTime(0.1, now + i * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.3 + 0.1);
        
        osc.start(now + i * 0.3);
        osc.stop(now + i * 0.3 + 0.1);
      }
    } else {
      // "Ba dum tss" style / Level complete fanfare
      // Kick (Ba)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.setValueAtTime(150, now);
      osc1.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Tom/Snare (Dum)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.setValueAtTime(200, now + 0.2);
      osc2.frequency.exponentialRampToValueAtTime(0.01, now + 0.4);
      gain2.gain.setValueAtTime(0.4, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.4);

      // Cymbal (Tss) - approximated with high frequency noise/oscillators
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.connect(gain3);
      gain3.connect(audioCtx.destination);
      osc3.type = 'square'; // Richer harmonics
      osc3.frequency.setValueAtTime(2000, now + 0.4);
      // Randomize frequency slightly to simulate noise? No, just use high freq square/sawtooth
      gain3.gain.setValueAtTime(0.1, now + 0.4);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      osc3.start(now + 0.4);
      osc3.stop(now + 1.0);
    }
  }, []);

  const [isLevelChangeAnimating, setIsLevelChangeAnimating] = useState(false);

  const advanceLevel = useCallback(() => {
    if (currentLevelIndex < levels.length - 1) {
      const nextIndex = currentLevelIndex + 1;
      setCurrentLevelIndex(nextIndex);
      setTimeLeft(levels[nextIndex].duration * 60);
      playSound('end');
      
      // Trigger visual flash
      setIsLevelChangeAnimating(true);
      setTimeout(() => setIsLevelChangeAnimating(false), 3000);
    } else {
      setIsRunning(false); // End of tournament
      playSound('end');
      
      // Trigger visual flash
      setIsLevelChangeAnimating(true);
      setTimeout(() => setIsLevelChangeAnimating(false), 3000);
    }
  }, [currentLevelIndex, levels, playSound]);

  // Check for 1 minute warning
  useEffect(() => {
    if (isRunning && timeLeft === 60) {
      playSound('warning');
    }
  }, [timeLeft, isRunning, playSound]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            advanceLevel();
            return levels[currentLevelIndex + 1]?.duration * 60 || 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      advanceLevel();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, advanceLevel, currentLevelIndex, levels]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setCurrentLevelIndex(0);
    setTimeLeft(levels[0].duration * 60);
  };

  const skipLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      const nextIndex = currentLevelIndex + 1;
      setCurrentLevelIndex(nextIndex);
      setTimeLeft(levels[nextIndex].duration * 60);
      setIsRunning(false);
    }
  };

  const prevLevel = () => {
    if (currentLevelIndex > 0) {
      const prevIndex = currentLevelIndex - 1;
      setCurrentLevelIndex(prevIndex);
      setTimeLeft(levels[prevIndex].duration * 60);
      setIsRunning(false);
    }
  };

  const adjustTime = (seconds: number) => {
    setTimeLeft((prev) => Math.max(0, prev + seconds));
  };

  const updateLevel = (index: number, newLevel: BlindLevel) => {
    setLevels((prev) => {
      const newLevels = [...prev];
      newLevels[index] = newLevel;
      return newLevels;
    });
    // If we updated the current level, update the timer if needed (optional, maybe just let it run)
    // But if duration changed, we might want to adjust? 
    // For now, let's just update the data.
  };

  const setAllLevels = (newLevels: BlindLevel[]) => {
    setLevels(newLevels);
    // Reset timer to start of new structure
    setCurrentLevelIndex(0);
    setTimeLeft(newLevels[0].duration * 60);
    setIsRunning(false);
  };

  return {
    currentLevel,
    nextLevel,
    currentLevelIndex,
    timeLeft,
    isRunning,
    levels,
    setLevels,
    toggleTimer,
    resetTimer,
    skipLevel,
    prevLevel,
    adjustTime,
    updateLevel,
    setAllLevels,
    isLevelChangeAnimating
  };
}
