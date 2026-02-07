
import React, { useState, useRef, useEffect } from 'react';
import { X, Trash2, Save, Plus, CheckSquare, Square } from 'lucide-react';
import { Task, EnergyType } from '../types';

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
}

const ENERGY_OPTIONS = [
  { type: EnergyType.CHORE, icon: '🤎', label: 'Chore', color: '#8d6e63' },
  { type: EnergyType.FUN, icon: '💛', label: 'Fun', color: '#fde047' },
  { type: EnergyType.CREATE, icon: '🩵', label: 'Create', color: '#4fc3f7' },
  { type: EnergyType.HEAL, icon: '💚', label: 'Heal', color: '#86efac' },
];

const DURATION_OPTIONS = [
  { label: '10 m', value: 10/60 },
  { label: '20 m', value: 20/60 },
  { label: '30 m', value: 30/60 },
  { label: '45 m', value: 45/60 },
  { label: '1 h', value: 1 },
  { label: '1.5 h', value: 1.5 },
  { label: '2 h', value: 2 },
  { label: '2.5 h', value: 2.5 },
  { label: '3 h', value: 3 },
  { label: '3.5 h', value: 3.5 },
  { label: '4 h', value: 4 },
  { label: '5 h', value: 5 },
  { label: '6 h', value: 6 },
  { label: '8 h', value: 8 },
];

const getModalGlow = (type: EnergyType) => {
    switch(type) {
        case EnergyType.CHORE: return '0 20px 60px -15px rgba(141, 110, 99, 0.4)'; 
        case EnergyType.FUN: return '0 20px 60px -15px rgba(250, 204, 21, 0.4)'; 
        case EnergyType.CREATE: return '0 20px 60px -15px rgba(56, 189, 248, 0.4)'; 
        case EnergyType.HEAL: return '0 20px 60px -15px rgba(74, 222, 128, 0.4)'; 
        default: return '0 20px 60px -15px rgba(0,0,0,0.1)';
    }
};

const getBorderColor = (type: EnergyType) => {
     switch(type) {
        case EnergyType.CHORE: return '#d7ccc8';
        case EnergyType.FUN: return '#fef08a';
        case EnergyType.CREATE: return '#b3e5fc';
        case EnergyType.HEAL: return '#dcfce7';
        default: return 'rgba(255,255,255,0.6)';
    }
}

const WheelPicker = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Find closest option
    const selectedOption = DURATION_OPTIONS.reduce((prev, curr) => {
        return (Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev);
    });

    useEffect(() => {
        if (scrollRef.current) {
            const index = DURATION_OPTIONS.findIndex(o => o.value === selectedOption.value);
            if (index !== -1) {
                // 40px item height. Center is roughly 44px down.
                scrollRef.current.scrollTop = index * 40; 
            }
        }
    }, []);

    return (
        <div className="relative h-32 w-full bg-stone-50 rounded-xl overflow-hidden border border-stone-200/60 shadow-inner">
            {/* Highlight Bar */}
            <div className="absolute top-1/2 left-0 right-0 h-10 -mt-5 bg-white/60 border-y border-stone-200/50 pointer-events-none z-10 backdrop-blur-[1px]"></div>
            
            {/* Scroll Container */}
            <div 
                ref={scrollRef}
                className="h-full overflow-y-auto snap-y snap-mandatory scroll-smooth py-[44px] hide-scrollbar"
            >
                {DURATION_OPTIONS.map((opt) => (
                    <div 
                        key={opt.label}
                        onClick={() => onChange(opt.value)}
                        className={`
                            h-10 flex items-center justify-center snap-center cursor-pointer transition-all duration-300
                            ${selectedOption.value === opt.value ? 'scale-125 font-black text-stone-800' : 'text-stone-400 font-medium scale-90'}
                        `}
                    >
                        {opt.label}
                    </div>
                ))}
            </div>
            {/* Fade Overlays */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-stone-50 to-transparent pointer-events-none z-20"></div>
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-stone-50 to-transparent pointer-events-none z-20"></div>
        </div>
    );
};

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onClose, onSave, onDelete }) => {
  const [editedTask, setEditedTask] = useState<Task>({ 
    ...task, 
    substeps: task.substeps || [],
    energyPoints: task.energyPoints || 10
  });
  const [newSubStep, setNewSubStep] = useState('');

  const handleChange = (field: keyof Task, value: any) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSubStep = () => {
    if (!newSubStep.trim()) return;
    setEditedTask(prev => ({
        ...prev,
        substeps: [...prev.substeps, { id: Math.random().toString(36).substr(2, 9), title: newSubStep, completed: false }]
    }));
    setNewSubStep('');
  };

  const toggleSubStep = (id: string) => {
    setEditedTask(prev => ({
        ...prev,
        substeps: prev.substeps.map(s => s.id === id ? { ...s, completed: !s.completed } : s)
    }));
  };

  const deleteSubStep = (id: string) => {
      setEditedTask(prev => ({
          ...prev,
          substeps: prev.substeps.filter(s => s.id !== id)
      }));
  };

  const sliderColor = ENERGY_OPTIONS.find(o => o.type === editedTask.type)?.color || '#a8a29e';
  
  // Map range -50 to 50 to percentage 0-100 for gradient
  const sliderPercentage = ((editedTask.energyPoints + 50) / 100) * 100;

  return (
    <div className="fixed inset-0 bg-stone-100/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      {/* 
         Fixed Size Window Layout 
         - Main container has fixed/max height
         - Flex column layout
         - Content needing scroll is in flex-1 container
      */}
      <div 
        className="w-full max-w-lg h-[85vh] flex flex-col relative transition-all duration-500"
        style={{
            backgroundColor: '#fdfdfc',
            borderRadius: '24px',
            boxShadow: `${getModalGlow(editedTask.type)}, inset 0 0 60px rgba(255, 255, 255, 0.7)`,
            border: `1px solid ${getBorderColor(editedTask.type)}`,
            padding: '24px'
        }}
      >
        {/* Close Button - Top Right Absolute */}
        <button 
            onClick={onClose} 
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100/50 transition-colors z-50 cursor-pointer"
        >
            <X className="w-5 h-5" />
        </button>
        
        {/* HEADER SECTION (Fixed) */}
        <div className="shrink-0 space-y-4 mb-4">
            <h2 className="text-2xl font-black text-stone-700 letterpress-title">Edit Task</h2>
            
            {/* Title */}
            <div>
                <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Title</label>
                <input 
                    type="text" 
                    value={editedTask.title} 
                    onChange={e => handleChange('title', e.target.value)}
                    className="w-full p-2 bg-white/50 border-b-2 border-stone-200 focus:border-stone-400 outline-none text-xl font-bold text-stone-700 letterpress transition-all bg-transparent"
                />
            </div>

            {/* Type Selection */}
            <div className="grid grid-cols-4 gap-3">
                    {ENERGY_OPTIONS.map((opt) => (
                    <button
                        key={opt.type}
                        type="button"
                        onClick={() => {
                            setEditedTask(prev => ({ ...prev, type: opt.type }));
                        }}
                        className={`
                            flex flex-col items-center justify-center py-2 rounded-2xl border transition-all duration-300
                            ${editedTask.type === opt.type 
                                ? 'bg-white shadow-md scale-105 z-10' 
                                : 'border-transparent bg-stone-50/50 opacity-60 hover:opacity-100 hover:bg-white hover:shadow-sm'}
                        `}
                        style={{
                            borderColor: editedTask.type === opt.type ? opt.color : 'transparent'
                        }}
                    >
                        <span className="text-2xl mb-1 filter drop-shadow-sm">{opt.icon}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${editedTask.type === opt.type ? 'text-stone-800' : 'text-stone-400'}`}>
                            {opt.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Intensity Slider (-50 to 50) */}
            <div className="bg-stone-50/50 p-3 rounded-2xl border border-stone-100">
                <div className="flex justify-between items-end mb-3 px-1">
                    <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-widest">
                        Intensity
                    </label>
                    <span className="text-xl font-black font-mono" style={{ color: sliderColor }}>
                        {editedTask.energyPoints > 0 ? '+' : ''}{editedTask.energyPoints}
                    </span>
                </div>
                <div className="relative h-6 flex items-center px-1">
                    <input 
                        type="range" 
                        min="-50" 
                        max="50" 
                        value={editedTask.energyPoints}
                        onChange={(e) => handleChange('energyPoints', parseInt(e.target.value))}
                        className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, ${sliderColor} 0%, ${sliderColor} ${sliderPercentage}%, #e7e5e4 ${sliderPercentage}%, #e7e5e4 100%)`
                        }}
                    />
                    <style>{`
                        input[type=range]::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            height: 20px;
                            width: 20px;
                            border-radius: 50%;
                            background: #ffffff;
                            border: 4px solid ${sliderColor};
                            cursor: grab;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
                            margin-top: -9px;
                            transition: transform 0.1s;
                        }
                        input[type=range]::-webkit-slider-thumb:active {
                            transform: scale(1.1);
                        }
                        input[type=range]::-webkit-slider-runnable-track {
                            height: 2px;
                            border-radius: 2px;
                        }
                    `}</style>
                </div>
            </div>
        </div>

        {/* SCROLLABLE MIDDLE SECTION */}
        <div className="flex-1 min-h-0 flex gap-5 overflow-hidden">
             {/* Duration Wheel (Fixed Width) */}
            <div className="w-1/3 shrink-0 flex flex-col">
                <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-2 pl-1">Duration</label>
                <WheelPicker 
                    value={editedTask.duration} 
                    onChange={(v) => handleChange('duration', v)} 
                />
                 {/* Notes Area - Below Wheel */}
                 <div className="flex-1 mt-4 flex flex-col min-h-0">
                    <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1 pl-1">Notes</label>
                    <textarea 
                        value={editedTask.description || ''} 
                        onChange={e => handleChange('description', e.target.value)}
                        className="w-full flex-1 p-2 bg-white/50 border border-stone-200/60 rounded-xl focus:border-stone-400 focus:bg-white outline-none resize-none text-xs font-medium text-stone-600 shadow-sm"
                        placeholder="..."
                    />
                </div>
            </div>

            {/* Checklist (Takes remaining space and scrolls) */}
            <div className="flex-1 flex flex-col min-h-0 h-full">
                <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-2 pl-1">Checklist</label>
                <div className="flex-1 bg-white/40 rounded-xl border border-stone-200/60 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
                        {editedTask.substeps.map(step => (
                            <div key={step.id} className="flex items-center gap-2 group p-2 hover:bg-white/80 rounded-lg transition-colors cursor-pointer" onClick={() => toggleSubStep(step.id)}>
                                <div className={`text-stone-400 transition-colors ${step.completed ? 'text-green-500' : ''}`}>
                                    {step.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                                </div>
                                <span className={`flex-1 text-sm font-medium ${step.completed ? 'line-through text-stone-300' : 'text-stone-600'}`}>
                                    {step.title}
                                </span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteSubStep(step.id); }}
                                    className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        {editedTask.substeps.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-stone-300 gap-2">
                                <span className="text-xs italic">No steps yet</span>
                            </div>
                        )}
                    </div>
                    {/* Input footer for checklist */}
                    <div className="p-2 border-t border-stone-100 bg-white/30">
                         <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newSubStep}
                                onChange={e => setNewSubStep(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddSubStep()}
                                placeholder="Add item..."
                                className="flex-1 p-2 bg-transparent border-b border-transparent focus:border-stone-300 outline-none text-sm placeholder-stone-400/70 font-medium"
                            />
                            <button onClick={handleAddSubStep} className="p-2 bg-white rounded-lg text-stone-500 shadow-sm border border-stone-100 hover:bg-stone-50">
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* FOOTER SECTION (Fixed) */}
        <div className="shrink-0 flex justify-between items-center mt-4 pt-4 border-t border-stone-200/50">
            <button 
                onClick={() => { onDelete(task.id); onClose(); }}
                className="flex items-center gap-2 text-stone-400 hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest"
            >
                <Trash2 size={14} /> DELETE
            </button>
            <button 
                onClick={() => { onSave(editedTask); onClose(); }}
                className="flex items-center gap-2 bg-stone-800 text-white px-8 py-3 rounded-xl hover:bg-stone-700 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-xs font-bold uppercase tracking-widest"
            >
                <Save size={14} /> SAVE CHANGES
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;
