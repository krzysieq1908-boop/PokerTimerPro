import { X, Plus, Trash2, Save, RotateCcw, Upload, Download, Loader2, CornerRightDown, GripVertical, Settings as SettingsIcon, Trophy } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { BlindLevel, TournamentConfig } from '../types';
import { DEFAULT_LEVELS } from '../constants';
import { parseStructureFromFile } from '../services/gemini';
import { ModernNumberInput } from './ModernNumberInput';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  levels: BlindLevel[];
  onSave: (levels: BlindLevel[]) => void;
  tournamentStats: TournamentConfig;
  onSaveStats: (stats: TournamentConfig) => void;
}

const SortableRow: React.FC<{ 
  level: BlindLevel; 
  index: number; 
  handleChange: (index: number, field: keyof BlindLevel, value: any) => void;
  insertLevel: (index: number) => void;
  removeLevel: (index: number) => void;
}> = ({ 
  level, 
  index, 
  handleChange, 
  insertLevel, 
  removeLevel 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: level.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? 'relative' as const : undefined,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={`border-b border-white/5 transition-colors group ${isDragging ? 'bg-indigo-500/10 shadow-lg' : 'hover:bg-white/5'}`}
    >
      <td className="py-3 pl-2">
        <div className="flex items-center gap-2 h-full min-h-[42px]">
          <button 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 p-2 rounded-lg hover:bg-white/5 touch-none transition-colors"
          >
            <GripVertical size={18} />
          </button>
          <span className="font-mono text-zinc-500 font-medium w-6 text-center">{index + 1}</span>
        </div>
      </td>
      <td className="py-3 pr-2">
        <select 
          value={level.isBreak ? 'break' : 'level'}
          onChange={(e) => handleChange(index, 'isBreak', e.target.value === 'break')}
          className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2.5 text-zinc-300 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none appearance-none cursor-pointer hover:bg-white/5 transition-colors"
        >
          <option value="level">Level</option>
          <option value="break">Break</option>
        </select>
      </td>
      <td className="py-3 pr-2">
        {!level.isBreak && (
          <ModernNumberInput 
            value={level.smallBlind}
            onChange={(val) => handleChange(index, 'smallBlind', val)}
            className="w-full min-w-[80px]"
            min={0}
          />
        )}
      </td>
      <td className="py-3 pr-2">
        {!level.isBreak && (
          <ModernNumberInput 
            value={level.bigBlind}
            onChange={(val) => handleChange(index, 'bigBlind', val)}
            className="w-full min-w-[80px]"
            min={0}
          />
        )}
      </td>
      <td className="py-3 pr-2">
        {!level.isBreak && (
          <ModernNumberInput 
            value={level.ante || 0}
            onChange={(val) => handleChange(index, 'ante', val)}
            className="w-full min-w-[60px]"
            min={0}
          />
        )}
      </td>
      <td className="py-3 pr-2">
        <ModernNumberInput 
          value={level.duration}
          onChange={(val) => handleChange(index, 'duration', val)}
          className="w-full min-w-[60px]"
          min={1}
        />
      </td>
      <td className="py-3 text-right pr-2">
        <div className="flex justify-end gap-1">
          <button 
            onClick={() => insertLevel(index)}
            className="p-1.5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="Insert Level Below"
          >
            <CornerRightDown size={16} />
          </button>
          <button 
            onClick={() => removeLevel(index)}
            className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function SettingsModal({ isOpen, onClose, levels: initialLevels, onSave, tournamentStats, onSaveStats }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'structure' | 'tournament'>('structure');
  const [editedLevels, setEditedLevels] = useState<BlindLevel[]>(JSON.parse(JSON.stringify(initialLevels)));
  const [editedStats, setEditedStats] = useState<TournamentConfig>({ ...tournamentStats });
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isOpen) return null;

  const renumberLevels = (levels: BlindLevel[]) => {
    let levelCount = 0;
    return levels.map(lvl => {
      if (lvl.isBreak) return lvl;
      
      levelCount++;
      if (lvl.label?.match(/^Level \d+$/) || lvl.label === 'New Level') {
        return { ...lvl, label: `Level ${levelCount}` };
      }
      return lvl;
    });
  };

  const handleChange = (index: number, field: keyof BlindLevel, value: any) => {
    const newLevels = [...editedLevels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    
    if (field === 'isBreak' && value === true) {
      newLevels[index].smallBlind = 0;
      newLevels[index].bigBlind = 0;
      newLevels[index].ante = 0;
      newLevels[index].label = 'Break';
    } else if (field === 'isBreak' && value === false) {
       const prevLevel = newLevels[index - 1];
       if (prevLevel && !prevLevel.isBreak) {
         newLevels[index].smallBlind = prevLevel.smallBlind;
         newLevels[index].bigBlind = prevLevel.bigBlind;
       } else {
         newLevels[index].smallBlind = 25;
         newLevels[index].bigBlind = 50;
       }
       newLevels[index].label = 'New Level';
    }

    if (field === 'isBreak') {
      setEditedLevels(renumberLevels(newLevels));
    } else {
      setEditedLevels(newLevels);
    }
  };

  const addLevel = () => {
    const lastLevel = editedLevels[editedLevels.length - 1];
    const newLevel: BlindLevel = {
      id: Math.random().toString(36).substr(2, 9),
      smallBlind: lastLevel && !lastLevel.isBreak ? lastLevel.smallBlind * 2 : 25,
      bigBlind: lastLevel && !lastLevel.isBreak ? lastLevel.bigBlind * 2 : 50,
      duration: lastLevel ? lastLevel.duration : 15,
      isBreak: false,
      label: 'New Level'
    };
    setEditedLevels(renumberLevels([...editedLevels, newLevel]));
  };

  const insertLevel = (index: number) => {
    const newLevels = [...editedLevels];
    const currentLevel = newLevels[index];
    
    const newLevel: BlindLevel = {
      id: Math.random().toString(36).substr(2, 9),
      smallBlind: currentLevel.smallBlind,
      bigBlind: currentLevel.bigBlind,
      ante: currentLevel.ante,
      duration: currentLevel.duration,
      isBreak: false,
      label: 'New Level'
    };

    newLevels.splice(index + 1, 0, newLevel);
    setEditedLevels(renumberLevels(newLevels));
  };

  const removeLevel = (index: number) => {
    const newLevels = editedLevels.filter((_, i) => i !== index);
    setEditedLevels(renumberLevels(newLevels));
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset to the default structure?')) {
      setEditedLevels(JSON.parse(JSON.stringify(DEFAULT_LEVELS)));
    }
  };

  const handleExport = () => {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      levels: editedLevels,
      stats: editedStats
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `poker-tournament-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = JSON.parse(event.target?.result as string);
          if (content.levels && Array.isArray(content.levels)) {
            setEditedLevels(content.levels);
            if (content.stats) {
              setEditedStats(content.stats);
            }
            alert('Tournament data imported successfully!');
          } else {
            throw new Error('Invalid format');
          }
        } catch (err) {
          alert('Error parsing JSON file. Make sure it is a valid export.');
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const parsedLevels = await parseStructureFromFile(file);
      if (parsedLevels && parsedLevels.length > 0) {
        setEditedLevels(parsedLevels);
      } else {
        alert('Could not extract a valid structure from this file.');
      }
    } catch (error) {
      console.error(error);
      alert('Error importing structure. Please try again.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setEditedLevels((items: BlindLevel[]) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        return renumberLevels(newItems);
      });
    }
  };

  const handleSave = () => {
    onSave(editedLevels);
    onSaveStats(editedStats);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('structure')}
              className={`text-lg font-bold transition-colors ${activeTab === 'structure' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Structure
            </button>
            <button 
              onClick={() => setActiveTab('tournament')}
              className={`text-lg font-bold transition-colors ${activeTab === 'tournament' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Tournament Info
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExport}
              className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
              title="Export All Settings"
            >
              <Download size={20} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative custom-scrollbar">
          
          {activeTab === 'structure' && (
            <>
              {isImporting && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-indigo-400">
                  <Loader2 size={48} className="animate-spin mb-4" />
                  <p className="font-medium">Analyzing file with AI...</p>
                </div>
              )}

              <div className="overflow-x-auto">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
                    <thead>
                      <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-white/10">
                        <th className="pb-3 pl-2 w-12">#</th>
                        <th className="pb-3 w-24">Type</th>
                        <th className="pb-3">Small</th>
                        <th className="pb-3">Big</th>
                        <th className="pb-3">Ante</th>
                        <th className="pb-3">Min</th>
                        <th className="pb-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <SortableContext 
                        items={editedLevels.map(l => l.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {editedLevels.map((level, index) => (
                          <SortableRow
                            key={level.id}
                            level={level}
                            index={index}
                            handleChange={handleChange}
                            insertLevel={insertLevel}
                            removeLevel={removeLevel}
                          />
                        ))}
                      </SortableContext>
                    </tbody>
                  </table>
                </DndContext>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <button 
                  onClick={addLevel}
                  className="flex items-center gap-2 text-indigo-400 hover:text-white text-sm font-medium px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500 transition-all active:scale-95"
                >
                  <Plus size={16} />
                  Add Level
                </button>

                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept="image/*,.txt,.xml,.json,.csv"
                  />
                  <button 
                    onClick={handleImportClick}
                    disabled={isImporting}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <Upload size={16} />
                    Import
                  </button>
                  
                  <button 
                    onClick={handleResetDefaults}
                    className="flex items-center gap-2 text-zinc-500 hover:text-red-400 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <RotateCcw size={16} />
                    Reset
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'tournament' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <SettingsIcon size={20} />
                  </div>
                  <h3 className="text-zinc-200 font-medium tracking-wide">Buy-in & Chips</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <ModernNumberInput 
                    label="Buy-in ($)"
                    value={editedStats.buyIn}
                    onChange={(val) => setEditedStats({...editedStats, buyIn: val})}
                  />
                  <ModernNumberInput 
                    label="Starting Chips"
                    value={editedStats.startingStack}
                    onChange={(val) => setEditedStats({...editedStats, startingStack: val})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ModernNumberInput 
                    label="Rebuy Cost ($)"
                    value={editedStats.rebuyCost}
                    onChange={(val) => setEditedStats({...editedStats, rebuyCost: val})}
                  />
                  <ModernNumberInput 
                    label="Rebuy Chips"
                    value={editedStats.rebuyStack}
                    onChange={(val) => setEditedStats({...editedStats, rebuyStack: val})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ModernNumberInput 
                    label="Add-on Cost ($)"
                    value={editedStats.addonCost}
                    onChange={(val) => setEditedStats({...editedStats, addonCost: val})}
                  />
                  <ModernNumberInput 
                    label="Add-on Chips"
                    value={editedStats.addonStack}
                    onChange={(val) => setEditedStats({...editedStats, addonStack: val})}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Trophy size={20} />
                  </div>
                  <h3 className="text-zinc-200 font-medium tracking-wide">Current Status</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <ModernNumberInput 
                    label="Total Entries"
                    value={editedStats.totalEntries}
                    onChange={(val) => setEditedStats({...editedStats, totalEntries: val})}
                  />
                  <ModernNumberInput 
                    label="Players Remaining"
                    value={editedStats.playersRemaining}
                    onChange={(val) => setEditedStats({...editedStats, playersRemaining: val})}
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1.5">Payout Structure (Text)</label>
                  <textarea 
                    value={editedStats.payouts}
                    onChange={(e) => setEditedStats({...editedStats, payouts: e.target.value})}
                    placeholder="e.g. 1:70%, 2:30%"
                    className="w-full h-32 bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-indigo-500/50 focus:bg-zinc-900 focus:ring-1 focus:ring-indigo-500/50 outline-none resize-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
