export interface BlindLevel {
  id: string;
  smallBlind: number;
  bigBlind: number;
  ante?: number;
  duration: number; // in minutes
  isBreak: boolean;
  label?: string; // e.g., "Level 1" or "Break"
}

export interface TimerState {
  currentLevelIndex: number;
  timeLeft: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
}
