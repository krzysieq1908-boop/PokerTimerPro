import { BlindLevel } from './types';

export const DEFAULT_LEVELS: BlindLevel[] = [
  { id: '1', smallBlind: 25, bigBlind: 50, duration: 15, isBreak: false, label: 'Level 1' },
  { id: '2', smallBlind: 50, bigBlind: 100, duration: 15, isBreak: false, label: 'Level 2' },
  { id: '3', smallBlind: 75, bigBlind: 150, duration: 15, isBreak: false, label: 'Level 3' },
  { id: '4', smallBlind: 100, bigBlind: 200, duration: 15, isBreak: false, label: 'Level 4' },
  { id: '5', smallBlind: 0, bigBlind: 0, duration: 5, isBreak: true, label: 'Break' },
  { id: '6', smallBlind: 150, bigBlind: 300, duration: 15, isBreak: false, label: 'Level 5' },
  { id: '7', smallBlind: 200, bigBlind: 400, duration: 15, isBreak: false, label: 'Level 6' },
  { id: '8', smallBlind: 300, bigBlind: 600, duration: 15, isBreak: false, label: 'Level 7' },
  { id: '9', smallBlind: 400, bigBlind: 800, duration: 15, isBreak: false, label: 'Level 8' },
  { id: '10', smallBlind: 0, bigBlind: 0, duration: 10, isBreak: true, label: 'Color Up Break' },
  { id: '11', smallBlind: 500, bigBlind: 1000, ante: 100, duration: 15, isBreak: false, label: 'Level 9' },
  { id: '12', smallBlind: 600, bigBlind: 1200, ante: 100, duration: 15, isBreak: false, label: 'Level 10' },
  { id: '13', smallBlind: 800, bigBlind: 1600, ante: 200, duration: 15, isBreak: false, label: 'Level 11' },
  { id: '14', smallBlind: 1000, bigBlind: 2000, ante: 200, duration: 15, isBreak: false, label: 'Level 12' },
];
