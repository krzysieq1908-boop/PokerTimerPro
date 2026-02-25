import { X, Plus, Trash2, Save, RotateCcw, Upload, Download, Loader2, CornerRightDown, GripVertical, Settings as SettingsIcon, Trophy } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { BlindLevel, TournamentConfig } from '../types';
import { DEFAULT_LEVELS } from '../constants';
import { parseStructureFromFile } from '../services/gemini';
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
      <td className="py-3 pl-2 font-mono text-zinc-500 flex items-center gap-2">
        <button 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 p-1 rounded hover:bg-white/5 touch-none"
        >
          <GripVertical size={14} />
        </button>
        {index + 1}
      </td>
      <td className="py-3">
        <select 
          value={level.isBreak ? 'break' : 'level'}
          onChange={(e) => handleChange(index, 'isBreak', e.target.value === 'break')}
          className="bg-transparent border border-white/10 rounded px-2 py-1 text-zinc-300 focus:border-indigo-500 outline-none"
        >
          <option value="level">Level</option>
          <option value="break">Break</option>
        </select>
      </td>
      <td className="py-3">
        {!level.isBreak && (
          <input 
            type="number" 
            value={level.smallBlind}
            onChange={(e) => handleChange(index, 'smallBlind', parseInt(e.target.value) || 0)}
            className="w-20 bg-transparent border border-white/10 rounded px-2 py-1 text-zinc-300 focus:border-indigo-500 outline-none"
          />
        )}
      </td>
      <td className="py-3">
        {!level.isBreak && (
          <input 
            type="number" 
            value={level.bigBlind}
            onChange={(e) => handleChange(index, 'bigBlind', parseInt(e.target.value) || 0)}
            className="w-20 bg-transparent border border-white/10 rounded px-2 py-1 text-zinc-300 focus:border-indigo-500 outline-none"
          />
        )}
      </td>
      <td className="py-3">
        {!level.isBreak && (
          <input 
            type="number" 
            value={level.ante || 0}
            onChange={(e) => handleChange(index, 'ante', parseInt(e.target.value) || 0)}
            className="w-16 bg-transparent border border-white/10 rounded px-2 py-1 text-zinc-300 focus:border-indigo-500 outline-none"
          />
        )}
      </td>
      <td className="py-3">
        <input 
          type="number" 
          value={level.duration}
          onChange={(e) => handleChange(index, 'duration', parseInt(e.target.value) || 1)}
          className="w-16 bg-transparent border border-white/10 rounded px-2 py-1 text-zinc-300 focus:border-indigo-500 outline-none"
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
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-white/10">
                        <th className="pb-3 pl-2">#</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Small</th>
                        <th className="pb-3">Big</th>
                        <th className="pb-3">Ante</th>
                        <th className="pb-3">Min</th>
                        <th className="pb-3"></th>
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
                  className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium px-2 py-1 rounded hover:bg-indigo-500/10 transition-colors"
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
                    className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium px-2 py-1 rounded hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    <Upload size={16} />
                    Import (JSON or AI)
                  </button>
                  
                  <button 
                    onClick={handleResetDefaults}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm font-medium px-2 py-1 rounded hover:bg-white/5 transition-colors"
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
              <div className="space-y-4">
                <h3 className="text-zinc-400 text-xs uppercase tracking-wider font-medium">Buy-in & Chips</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Buy-in ($)</label>
                    <input 
                      type="number" 
                      value={editedStats.buyIn}
                      onChange={(e) => setEditedStats({...editedStats, buyIn: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Starting Chips</label>
                    <input 
                      type="number" 
                      value={editedStats.startingStack}
                      onChange={(e) => setEditedStats({...editedStats, startingStack: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Rebuy Cost ($)</label>
                    <input 
                      type="number" 
                      value={editedStats.rebuyCost}
                      onChange={(e) => setEditedStats({...editedStats, rebuyCost: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Rebuy Chips</label>
                    <input 
                      type="number" 
                      value={editedStats.rebuyStack}
                      onChange={(e) => setEditedStats({...editedStats, rebuyStack: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Add-on Cost ($)</label>
                    <input 
                      type="number" 
                      value={editedStats.addonCost}
                      onChange={(e) => setEditedStats({...editedStats, addonCost: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Add-on Chips</label>
                    <input 
                      type="number" 
                      value={editedStats.addonStack}
                      onChange={(e) => setEditedStats({...editedStats, addonStack: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-zinc-400 text-xs uppercase tracking-wider font-medium">Current Status</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Total Entries</label>
                    <input 
                      type="number" 
                      value={editedStats.totalEntries}
                      onChange={(e) => setEditedStats({...editedStats, totalEntries: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Players Remaining</label>
                    <input 
                      type="number" 
                      value={editedStats.playersRemaining}
                      onChange={(e) => setEditedStats({...editedStats, playersRemaining: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Payout Structure (Text)</label>
                  <textarea 
                    value={editedStats.payouts}
                    onChange={(e) => setEditedStats({...editedStats, payouts: e.target.value})}
                    placeholder="e.g. 1st: 50%, 2nd: 30%, 3rd: 20%"
                    className="w-full h-32 bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-2 transition-colors"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
