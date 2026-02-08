
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

// --- Gauge Helpers ---
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
};

const IntensityGauge = ({ value, onChange, color }: { value: number, onChange: (v: number) => void, color: string }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const radius = 100;
    const strokeWidth = 20;
    const center = 130; // Viewbox center X and Y (roughly)

    // Value -50 to 50 maps to Angle -90 to 90
    const angle = Math.max(-90, Math.min(90, (value / 50) * 90));
    
    // Thumb position
    const thumbPos = polarToCartesian(center, center, radius, angle);

    const handleInteract = (clientX: number, clientY: number) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2; // Approximate center of the arc's circle
        
        // Atan2(y, x) where 0 is Right, -PI/2 is Up
        // We want -90 to 90 (Left to Right via Up)
        const dx = clientX - cx;
        const dy = clientY - cy; // dy is negative when above center
        
        let theta = Math.atan2(dy, dx) * (180 / Math.PI); // -180 to 180
        
        // Convert to our standard: Up is 0, Right is 90, Left is -90
        // atan2: Right=0, Down=90, Left=180/-180, Up=-90
        // We want atan2(-90) -> 0
        // atan2(180) -> -90
        // atan2(0) -> 90
        
        let mapped = theta + 90;
        
        // Clamp to semi-circle top half
        if (mapped > 90 && mapped < 270) {
             // If mouse is in the bottom half, clamp to nearest side
             if (mapped < 180) mapped = 90;
             else mapped = -90;
        }
        
        // Adjust for wrapping if needed, but atan2 range handles -180 to 180.
        // atan2(-90) = -90. +90 = 0.
        // atan2(0) = 0. +90 = 90.
        // atan2(-180) = -180. +90 = -90.
        
        if (mapped < -90) mapped = -90;
        if (mapped > 90) mapped = 90;

        const newValue = Math.round((mapped / 90) * 50);
        onChange(newValue);
    };

    useEffect(() => {
        const onMove = (e: MouseEvent) => { if (isDragging) handleInteract(e.clientX, e.clientY); };
        const onUp = () => setIsDragging(false);
        if (isDragging) {
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        }
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [isDragging]);

    return (
        <div className="flex justify-center -mb-8 relative z-10">
            <svg 
                ref={svgRef}
                width="260" height="150"
                viewBox="0 0 260 150"
                className="cursor-pointer touch-none"
                onMouseDown={(e) => { setIsDragging(true); handleInteract(e.clientX, e.clientY); }}
            >
                <defs>
                    <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#d6d3d1" /> {/* stone-300 */}
                        <stop offset="50%" stopColor="#e7e5e4" /> {/* stone-200 */}
                        <stop offset="100%" stopColor="#d6d3d1" />
                    </linearGradient>
                </defs>
                
                {/* Background Track (Left to Right) */}
                <path 
                    d={describeArc(center, center, radius, -90, 90)} 
                    fill="none" 
                    stroke="url(#trackGradient)" 
                    strokeWidth={strokeWidth} 
                    strokeLinecap="round"
                    className="opacity-50"
                />
                
                {/* Active Track (Top to Angle) */}
                {/* We draw from 0 (Top) to Angle */}
                <path 
                    d={describeArc(center, center, radius, Math.min(0, angle), Math.max(0, angle))} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth={strokeWidth} 
                    strokeLinecap="round"
                    filter="url(#gauge-glow)"
                    className="transition-all duration-75 ease-out"
                />
                
                {/* Thumb */}
                <circle 
                    cx={thumbPos.x} 
                    cy={thumbPos.y} 
                    r={12} 
                    fill="white" 
                    stroke={color} 
                    strokeWidth={4} 
                    className="drop-shadow-md transition-all duration-75 ease-out"
                />

                {/* Text Labels */}
                <text x={center} y={center - 35} textAnchor="middle" className="text-3xl font-black fill-stone-700 font-mono select-none">
                    {value > 0 ? '+' : ''}{value}
                </text>
                <text x={center} y={center - 15} textAnchor="middle" className="text-[9px] font-bold fill-stone-400 uppercase tracking-widest select-none">
                    Intensity
                </text>
            </svg>
        </div>
    );
};

// --- Apple-style Wheel Picker ---
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
                scrollRef.current.scrollTop = index * 32; // 32px item height
            }
        }
    }, []);

    return (
        <div className="relative h-32 w-full bg-stone-50/50 rounded-xl overflow-hidden border border-stone-200 shadow-inner">
            {/* Selection Highlight (Apple Style) */}
            <div className="absolute top-1/2 left-0 right-0 h-8 -mt-4 bg-stone-200/50 border-y border-stone-300/60 pointer-events-none z-10 backdrop-blur-[1px]"></div>
            
            {/* Scroll Container */}
            <div 
                ref={scrollRef}
                className="h-full overflow-y-auto snap-y snap-mandatory scroll-smooth py-[48px] hide-scrollbar relative z-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {DURATION_OPTIONS.map((opt) => (
                    <div 
                        key={opt.label}
                        onClick={() => onChange(opt.value)}
                        className={`
                            h-8 flex items-center justify-center snap-center cursor-pointer transition-all duration-200 select-none
                            ${selectedOption.value === opt.value 
                                ? 'text-stone-800 font-black text-lg scale-110' 
                                : 'text-stone-400 font-medium text-sm scale-90 opacity-60'}
                        `}
                    >
                        {opt.label}
                    </div>
                ))}
            </div>
            
            {/* Gradient Masks */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-stone-50 to-transparent pointer-events-none z-20"></div>
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-stone-50 to-transparent pointer-events-none z-20"></div>
        </div>
    );
};

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onClose, onSave, onDelete }) => {
  const [editedTask, setEditedTask] = useState<Task>({ 
    ...task, 
    substeps: task.substeps || [],
    energyPoints: task.energyPoints || 0
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

  const currentColor = ENERGY_OPTIONS.find(o => o.type === editedTask.type)?.color || '#a8a29e';

  return (
    <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4">
      {/* 
         Narrower Window Layout (max-w-md approx 450px) 
      */}
      <div 
        className="w-full max-w-[420px] h-[80vh] flex flex-col relative transition-all duration-500"
        style={{
            backgroundColor: '#fdfdfc',
            borderRadius: '24px',
            boxShadow: `${getModalGlow(editedTask.type)}, 0 10px 40px rgba(0,0,0,0.1)`,
            border: `1px solid ${getBorderColor(editedTask.type)}`,
            padding: '20px'
        }}
      >
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100/50 transition-colors z-50 cursor-pointer"
        >
            <X className="w-5 h-5" />
        </button>
        
        {/* HEADER */}
        <div className="shrink-0 space-y-4 mb-2 mt-1">
            {/* Title */}
            <div>
                <label className="block text-stone-400 text-[9px] font-bold uppercase tracking-widest mb-1">Title</label>
                <input 
                    type="text" 
                    value={editedTask.title} 
                    onChange={e => handleChange('title', e.target.value)}
                    onFocus={() => { if(editedTask.title === 'New Task') handleChange('title', ''); }}
                    className="w-full p-1 bg-transparent border-b-2 border-stone-200 focus:border-stone-400 outline-none text-xl font-black text-stone-700 letterpress transition-all placeholder-stone-300"
                    placeholder="Task Name"
                />
            </div>

            {/* Type Selection */}
            <div className="grid grid-cols-4 gap-2">
                    {ENERGY_OPTIONS.map((opt) => (
                    <button
                        key={opt.type}
                        type="button"
                        onClick={() => {
                            setEditedTask(prev => ({ ...prev, type: opt.type }));
                        }}
                        className={`
                            flex flex-col items-center justify-center py-2 rounded-xl border transition-all duration-300
                            ${editedTask.type === opt.type 
                                ? 'bg-white shadow-sm scale-105 z-10 ring-1 ring-offset-1' 
                                : 'border-transparent bg-stone-50/50 opacity-60 hover:opacity-100 hover:bg-white'}
                        `}
                        style={{
                            borderColor: editedTask.type === opt.type ? opt.color : 'transparent',
                            '--tw-ring-color': opt.color
                        } as React.CSSProperties}
                    >
                        <span className="text-xl mb-1 filter drop-shadow-sm">{opt.icon}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${editedTask.type === opt.type ? 'text-stone-800' : 'text-stone-400'}`}>
                            {opt.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Intensity Gauge */}
            <div className="bg-stone-50/30 rounded-2xl pt-2 pb-0 relative overflow-hidden">
                <IntensityGauge 
                    value={editedTask.energyPoints} 
                    onChange={(v) => handleChange('energyPoints', v)}
                    color={currentColor}
                />
            </div>
        </div>

        {/* MIDDLE SECTION - Split Columns */}
        <div className="flex-1 min-h-0 flex gap-4 overflow-hidden pt-2">
             {/* Duration Column (Narrower) */}
            <div className="w-[35%] shrink-0 flex flex-col gap-2">
                <div className="bg-white/40 rounded-xl p-2 border border-stone-100 flex flex-col h-full shadow-sm">
                    <label className="block text-stone-400 text-[9px] font-bold uppercase tracking-widest mb-1 text-center">Duration</label>
                    <WheelPicker 
                        value={editedTask.duration} 
                        onChange={(v) => handleChange('duration', v)} 
                    />
                     {/* Notes */}
                     <div className="flex-1 mt-2 flex flex-col min-h-0">
                        <label className="block text-stone-400 text-[9px] font-bold uppercase tracking-widest mb-1 pl-1">Notes</label>
                        <textarea 
                            value={editedTask.description || ''} 
                            onChange={e => handleChange('description', e.target.value)}
                            className="w-full flex-1 p-2 bg-stone-50/50 border border-stone-200/50 rounded-lg focus:border-stone-400 focus:bg-white outline-none resize-none text-[10px] font-medium text-stone-600"
                            placeholder="..."
                        />
                    </div>
                </div>
            </div>

            {/* Checklist Column (Wider) */}
            <div className="flex-1 flex flex-col min-h-0 h-full">
                <div className="bg-white/40 rounded-xl border border-stone-100 flex flex-col overflow-hidden shadow-sm h-full">
                    <div className="p-2 border-b border-stone-100/50 bg-stone-50/30">
                        <label className="block text-stone-400 text-[9px] font-bold uppercase tracking-widest">Checklist</label>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
                        {editedTask.substeps.map(step => (
                            <div key={step.id} className="flex items-center gap-2 group p-2 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-stone-100" onClick={() => toggleSubStep(step.id)}>
                                <div className={`text-stone-400 transition-colors ${step.completed ? 'text-green-500' : ''}`}>
                                    {step.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                                </div>
                                <span className={`flex-1 text-xs font-medium ${step.completed ? 'line-through text-stone-300' : 'text-stone-600'}`}>
                                    {step.title}
                                </span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteSubStep(step.id); }}
                                    className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        {editedTask.substeps.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-stone-300 gap-2 opacity-50">
                                <span className="text-[10px] italic">No steps yet</span>
                            </div>
                        )}
                    </div>
                    {/* Input footer */}
                    <div className="p-2 border-t border-stone-100 bg-white/50">
                         <div className="flex gap-1">
                            <input 
                                type="text" 
                                value={newSubStep}
                                onChange={e => setNewSubStep(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddSubStep()}
                                placeholder="Add item..."
                                className="flex-1 p-1.5 bg-transparent border-b border-stone-200 focus:border-stone-400 outline-none text-xs placeholder-stone-400/70 font-medium"
                            />
                            <button onClick={handleAddSubStep} className="p-1.5 bg-white rounded-md text-stone-500 shadow-sm border border-stone-100 hover:bg-stone-50">
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* FOOTER */}
        <div className="shrink-0 flex justify-between items-center mt-4 pt-3 border-t border-stone-200/50">
            <button 
                onClick={() => { onDelete(task.id); onClose(); }}
                className="flex items-center gap-1 text-stone-400 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-all text-[9px] font-bold uppercase tracking-widest"
            >
                <Trash2 size={12} /> Delete
            </button>
            <button 
                onClick={() => { onSave(editedTask); onClose(); }}
                className="flex items-center gap-2 bg-stone-800 text-white px-6 py-2.5 rounded-xl hover:bg-stone-700 shadow-md hover:shadow-lg transition-all text-[10px] font-bold uppercase tracking-widest transform hover:scale-[1.02]"
            >
                <Save size={12} /> Save
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;
