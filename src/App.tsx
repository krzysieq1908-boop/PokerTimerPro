/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { usePokerTimer } from './hooks/usePokerTimer';
import { DEFAULT_LEVELS } from './constants';
import { TimerDisplay } from './components/TimerDisplay';
import { Controls } from './components/Controls';
import { BlindList } from './components/BlindList';
import { SettingsModal } from './components/SettingsModal';
import { Settings, Menu } from 'lucide-react';

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
    setAllLevels,
    isLevelChangeAnimating
  } = usePokerTimer(DEFAULT_LEVELS);

  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-indigo-500/30">
      {/* Level Change Flash Overlay */}
      {isLevelChangeAnimating && (
        <div className="fixed inset-0 z-[200] bg-indigo-500/30 animate-pulse pointer-events-none mix-blend-screen" />
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg">P</div>
          <h1 className="font-bold text-xl tracking-tight hidden sm:block">PokerTimer<span className="text-indigo-500">Pro</span></h1>
        </div>
        <button 
          onClick={() => setShowSidebar(!showSidebar)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
        >
          <Menu />
        </button>
      </header>

      <main className="h-screen flex flex-col lg:flex-row pt-16">
        {/* Main Timer Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div className="w-full max-w-4xl mx-auto">
            <TimerDisplay 
              timeLeft={timeLeft} 
              currentLevel={currentLevel} 
              nextLevel={nextLevel} 
            />
            
            <div className="mt-12">
              <Controls 
                isRunning={isRunning}
                onToggle={toggleTimer}
                onReset={resetTimer}
                onNext={skipLevel}
                onPrev={prevLevel}
                onAdjustTime={adjustTime}
              />
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
      />
    </div>
  );
}

