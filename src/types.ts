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

export interface TournamentConfig {
  buyIn: number;
  startingStack: number;
  rebuyCost: number;
  rebuyStack: number;
  addonCost: number;
  addonStack: number;
  totalEntries: number;
  playersRemaining: number;
  rebuys: number;
  addons: number;
  payouts: string;
}
