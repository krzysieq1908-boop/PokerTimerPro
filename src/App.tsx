/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { usePokerTimer } from './hooks/usePokerTimer';
import { DEFAULT_LEVELS } from './constants';
import { TimerDisplay } from './components/TimerDisplay';
import { Controls } from './components/Controls';
import { BlindList } from './components/BlindList';
import { SettingsModal } from './components/SettingsModal';
import { StatsDisplay } from './components/StatsDisplay';
import { Settings, Menu, Maximize2, Minimize2 } from 'lucide-react';
import { TournamentConfig } from './types';

const DEFAULT_STATS: TournamentConfig = {
  buyIn: 100,
  startingStack: 10000,
  rebuyCost: 100,
  rebuyStack: 10000,
  addonCost: 50,
  addonStack: 15000,
  totalEntries: 10,
  playersRemaining: 10,
  rebuys: 0,
  addons: 0,
  payouts: "1:50%\n2:30%\n3:20%"
};

export default function App() {
  const {
    currentLevel,
    nextLevel,
    currentLevelIndex,
    timeLeft,
    isRunning,
    levels,
    toggleTimer,
    resetTimer,
    skipLevel,
    prevLevel,
    adjustTime,
    setTime,
    setAllLevels,
    isLevelChangeAnimating
  } = usePokerTimer(DEFAULT_LEVELS);

  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tournamentStats, setTournamentStats] = useState<TournamentConfig>(DEFAULT_STATS);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const toggleFullScreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error("Error attempting to enable full-screen mode:", err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  const handleStatsUpdate = (updates: Partial<TournamentConfig>) => {
    setTournamentStats(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-indigo-500/30">
      {/* Level Change Flash Overlay */}
      {isLevelChangeAnimating && (
        <div className="fixed inset-0 z-[200] bg-indigo-500/30 animate-pulse pointer-events-none mix-blend-screen" />
      )}

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50 transition-opacity duration-300 ${isFullScreen && !showSidebar ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-xl tracking-tight">PokerTimer<span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Pro</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullScreen}
            className="hidden md:block p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
            title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
          >
            {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
          >
            <Menu />
          </button>
        </div>
      </header>

      <main className={`flex-1 flex flex-col lg:flex-row overflow-hidden transition-all duration-300 ${isFullScreen ? 'h-[100dvh] pt-0' : 'pt-16 lg:h-[calc(100dvh-64px)] h-[calc(100dvh-64px)]'}`}>
        {/* Main Timer Area */}
        <div className={`flex-1 flex flex-col relative min-h-0 transition-all duration-500 ${isFullScreen ? 'p-0 overflow-hidden' : 'p-4 sm:p-6 overflow-y-auto custom-scrollbar'}`}>
          <div className={`w-full mx-auto flex flex-col items-center h-full transition-all duration-500 ${isFullScreen ? 'justify-between py-4 max-w-[95vw]' : 'py-4 sm:py-8 max-w-6xl'}`}>
            
            {/* Timer - Flexible height in full screen */}
            <div className={`flex items-center justify-center w-full transition-all duration-500 ${isFullScreen ? 'flex-1 min-h-0' : ''}`}>
              <TimerDisplay 
                timeLeft={timeLeft} 
                currentLevel={currentLevel} 
                nextLevel={nextLevel} 
                isFullScreen={isFullScreen}
                onTimeChange={setTime}
              />
            </div>
            
            {/* Controls & Stats */}
            <div className={`w-full flex flex-col items-center transition-all duration-500 ${isFullScreen ? 'gap-4 shrink-0 px-8 pb-4' : 'gap-8 mt-6 sm:mt-8'}`}>
              <Controls 
                isRunning={isRunning}
                onToggle={toggleTimer}
                onReset={resetTimer}
                onNext={skipLevel}
                onPrev={prevLevel}
                onAdjustTime={adjustTime}
              />

              <div className={`w-full transition-all duration-500 ${isFullScreen ? 'scale-90 origin-bottom' : ''}`}>
                <StatsDisplay 
                  stats={tournamentStats} 
                  onUpdate={handleStatsUpdate} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar / Blind Structure */}
        <div className={`
          fixed inset-y-0 right-0 w-80 bg-[#111] border-l border-white/5 p-6 transform transition-transform duration-300 ease-in-out z-40
          lg:relative lg:transform-none lg:w-96 lg:bg-transparent lg:border-l lg:border-white/5
          ${showSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full flex flex-col pt-16 lg:pt-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">Tournament Structure</h2>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <Settings size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <BlindList levels={levels} currentLevelIndex={currentLevelIndex} />
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-zinc-600">
              <p>Total Duration: {levels.reduce((acc, lvl) => acc + lvl.duration, 0)}m</p>
              <p className="mt-1">Est. End Time: {new Date(Date.now() + levels.reduce((acc, lvl) => acc + lvl.duration, 0) * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        levels={levels}
        onSave={setAllLevels}
        tournamentStats={tournamentStats}
        onSaveStats={setTournamentStats}
      />
    </div>
  );
}

