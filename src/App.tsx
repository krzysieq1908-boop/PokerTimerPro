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
import { Settings, Menu, Maximize2, Minimize2, Coffee } from 'lucide-react';
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
  const [isNativeFullScreen, setIsNativeFullScreen] = useState(false);
  const [isSimulatedFullScreen, setIsSimulatedFullScreen] = useState(false);

  const isFullScreen = isNativeFullScreen || isSimulatedFullScreen;

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsNativeFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const toggleFullScreen = async () => {
    if (isSimulatedFullScreen) {
      setIsSimulatedFullScreen(false);
      return;
    }

    if (!document.fullscreenElement) {
      try {
        // Try native fullscreen first
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.log("Native fullscreen not supported, falling back to simulated mode");
        // Fallback for iOS Safari and others
        setIsSimulatedFullScreen(true);
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
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
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
        <div className={`flex-1 flex flex-col relative min-h-0 transition-all duration-500 ${isFullScreen ? 'p-0 overflow-y-auto custom-scrollbar' : 'p-4 sm:p-6 overflow-y-auto custom-scrollbar'}`}>
          <div className={`w-full mx-auto flex h-full transition-all duration-500 ${isFullScreen ? 'flex-col landscape:flex-row items-center justify-between p-4 max-w-[95vw] landscape:gap-8' : 'flex-col items-center py-4 sm:py-8 max-w-6xl'}`}>
            
            {/* Timer - Flexible height in full screen */}
            <div className={`flex items-center justify-center transition-all duration-500 ${isFullScreen ? 'w-full flex-1 min-h-0 landscape:w-1/2 landscape:h-full' : 'w-full'}`}>
              <TimerDisplay 
                timeLeft={timeLeft} 
                currentLevel={currentLevel} 
                nextLevel={nextLevel} 
                isFullScreen={isFullScreen}
                onTimeChange={setTime}
              />
            </div>
            
            {/* Controls & Stats */}
            <div className={`flex flex-col items-center transition-all duration-500 ${isFullScreen ? 'w-full gap-4 shrink-0 pb-4 landscape:w-auto landscape:h-full landscape:justify-center landscape:pb-0' : 'w-full gap-8 mt-6 sm:mt-8'}`}>
              
              {/* Next Level Preview - Landscape Fullscreen Only */}
              {isFullScreen && nextLevel && (
                <div className="hidden landscape:flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 mb-4">
                  <div className="text-zinc-600 text-xs uppercase tracking-[0.2em] mb-2">Up Next</div>
                  <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                    {nextLevel.isBreak ? (
                      <span className="text-indigo-400 font-medium tracking-wide">Break ({nextLevel.duration}m)</span>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-2 text-zinc-300 font-mono text-xl">
                           <span>{nextLevel.smallBlind.toLocaleString()}</span>
                           <span className="text-zinc-600">/</span>
                           <span>{nextLevel.bigBlind.toLocaleString()}</span>
                        </div>
                        {nextLevel.ante && (
                           <div className="pl-3 border-l border-white/10 text-zinc-500 text-sm font-mono">
                             ({nextLevel.ante})
                           </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              <Controls 
                isRunning={isRunning}
                onToggle={toggleTimer}
                onReset={resetTimer}
                onNext={skipLevel}
                onPrev={prevLevel}
                onAdjustTime={adjustTime}
              />

              <div className={`w-full transition-all duration-500 ${isFullScreen ? 'hidden' : ''}`}>
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

            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-widest font-medium">
                <span>Support</span>
              </div>
              <a 
                href="https://buymeacoffee.com/pokertimerpro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group p-4 bg-white rounded-full shadow-lg hover:scale-110 transition-transform duration-300"
                title="Buy me a coffee"
              >
                <Coffee className="text-black" size={32} strokeWidth={2.5} />
              </a>
              <p className="text-[10px] text-zinc-600 text-center max-w-[200px]">
                Enjoying the app? Buy me a coffee! ☕
              </p>
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

