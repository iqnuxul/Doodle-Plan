
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  ListTodo, 
  Plus, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Move,
  Trash2,
  CheckCircle2,
  Circle,
  Menu,
  Star,
  X,
  Sticker,
  Battery,
  Settings,
  Printer,
  GripHorizontal,
  RotateCw,
  Maximize2,
  LayoutGrid,
  Columns
} from 'lucide-react';
import { Task, EnergyType, Achievement, StickerItem } from './types';
import SketchPad from './components/SketchPad';
import EditTaskModal from './components/EditTaskModal';
import SettingsModal from './components/SettingsModal';

// --- Configuration & Constants ---
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ENERGY_BUDGET = 100;

// Energy Color Mapping - High Contrast for Readability
const getEnergyColor = (type: EnergyType) => {
  switch (type) {
    case EnergyType.CHORE: return 'bg-[#e6dace] border-[#bcaaa4] text-[#3e2723]'; // Cocoa Paper with Dark Brown Text
    case EnergyType.FUN: return 'bg-[#fcf5c7] border-[#e6dca3] text-[#423d0f]'; // Pale Yellow with Dark Olive Text
    case EnergyType.CREATE: return 'bg-[#cfe8f7] border-[#b0d2e8] text-[#0c3b5e]'; // Soft Blue with Deep Blue Text
    case EnergyType.HEAL: return 'bg-[#d8eadd] border-[#b8d6c0] text-[#14331d]'; // Sage Green with Deep Green Text
    default: return 'bg-stone-50 border-stone-200 text-stone-900';
  }
};

const getEnergyIcon = (type: EnergyType) => {
    switch (type) {
        case EnergyType.CHORE: return '🤎';
        case EnergyType.FUN: return '💛';
        case EnergyType.CREATE: return '🩵';
        case EnergyType.HEAL: return '💚';
        default: return '⚪';
    }
};

// Initial Data
const INITIAL_TASKS: Task[] = [
  { 
      id: '1', title: 'Groceries', type: EnergyType.CHORE, completed: false, 
      energyPoints: -15, duration: 1, substeps: [] 
  },
  { 
      id: '2', title: 'Paint Studio', type: EnergyType.CREATE, completed: false, 
      energyPoints: -30, duration: 2, substeps: [] 
  },
  { 
      id: '3', title: 'Yoga', type: EnergyType.HEAL, completed: false, 
      energyPoints: 20, duration: 1, date: new Date().toISOString().split('T')[0], startTime: 7, substeps: [] 
  },
];

export default function App() {
  // --- State ---
  const [view, setView] = useState<'month' | 'week'>('week');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date()); 
  
  // Settings State
  const [wakingStart, setWakingStart] = useState(6);
  const [wakingEnd, setWakingEnd] = useState(22);

  // Modal State
  const [showSketchPad, setShowSketchPad] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [stickerLibrary, setStickerLibrary] = useState<string[]>([]);
  
  // Drag & Resize State
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState<{ date?: string, hour?: number, type: 'cell' | 'backlog' } | null>(null);
  
  const [resizingTask, setResizingTask] = useState<{task: Task, startY: number, startDuration: number} | null>(null);
  
  // Sticker Transformation State
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // --- Derived Data ---
  const hours = useMemo(() => Array.from({ length: wakingEnd - wakingStart }, (_, i) => i + wakingStart), [wakingStart, wakingEnd]);
  
  const backlog = useMemo(() => tasks.filter(t => !t.date), [tasks]);
  
  const currentWeekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day; 
    return new Date(d.setDate(diff));
  }, [currentDate]);

  const currentMonthStart = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), [currentDate]);

  const dailyEnergy = useMemo(() => {
    const targetDateStr = now.toISOString().split('T')[0];
    const daysTasks = tasks.filter(t => t.date === targetDateStr);
    const used = daysTasks.reduce((acc, t) => acc + (t.energyPoints || 0), 0);
    return { used, remaining: ENERGY_BUDGET + used }; 
  }, [tasks, now]);

  // --- Effects ---
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Global Mouse Handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (draggedTask) {
            setDragPosition({ x: e.clientX, y: e.clientY });
            const elements = document.elementsFromPoint(e.clientX, e.clientY);
            if (elements.some(el => el.id === 'backlog-area')) {
                setDropTarget({ type: 'backlog' });
            } else {
                const target = elements.find(el => el.getAttribute('data-drop-target') === 'true');
                if (target) {
                    const date = target.getAttribute('data-date') || undefined;
                    const hourStr = target.getAttribute('data-hour');
                    const hour = hourStr ? parseFloat(hourStr) : undefined;
                    setDropTarget({ date, hour, type: 'cell' });
                } else {
                    setDropTarget(null);
                }
            }
        }

        if (resizingTask) {
            const deltaY = e.clientY - resizingTask.startY;
            // 2.5rem per hour = 40px per hour
            const hourDelta = deltaY / 40; 
            const newDuration = Math.max(0.25, Math.round((resizingTask.startDuration + hourDelta) * 4) / 4);
            setTasks(prev => prev.map(t => t.id === resizingTask.task.id ? { ...t, duration: newDuration } : t));
        }

        if (isDraggingSticker && activeStickerId) {
            setStickers(prev => prev.map(s => 
                s.id === activeStickerId 
                ? { ...s, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }
                : s
            ));
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
        if (draggedTask && dropTarget) {
            const isCopy = e.altKey;
            let taskToProcess = draggedTask;
            if (isCopy) {
                 taskToProcess = { ...draggedTask, id: Math.random().toString(36).substr(2, 9), title: `${draggedTask.title} (Copy)` };
                 setTasks(prev => [...prev, taskToProcess]);
            }

            if (dropTarget.type === 'backlog') {
                setTasks(prev => prev.map(t => t.id === taskToProcess.id ? { ...t, date: undefined, startTime: undefined } : t));
            } else if (dropTarget.type === 'cell' && dropTarget.date) {
                const newHour = dropTarget.hour !== undefined ? dropTarget.hour : wakingStart;
                setTasks(prev => prev.map(t => t.id === taskToProcess.id ? { ...t, date: dropTarget.date, startTime: newHour } : t));
            }
        }

        setDraggedTask(null);
        setDropTarget(null);
        setResizingTask(null);
        setIsDraggingSticker(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedTask, dropTarget, resizingTask, isDraggingSticker, activeStickerId, dragOffset, wakingStart]);

  // --- Handlers ---
  const addTask = (title: string, type: EnergyType) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      type,
      completed: false,
      energyPoints: type === EnergyType.CHORE || type === EnergyType.CREATE ? -10 : 10,
      duration: 1,
      substeps: []
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleResizeStart = (e: React.MouseEvent, task: Task) => {
      e.stopPropagation();
      e.preventDefault();
      setResizingTask({ task, startY: e.clientY, startDuration: task.duration });
  };

  const addStickerToBoard = (url: string) => {
      const newSticker: StickerItem = {
          id: Math.random().toString(36).substr(2, 9),
          imageUrl: url,
          x: window.innerWidth / 2 - 50,
          y: window.innerHeight / 2 - 50,
          width: 100,
          height: 100,
          rotation: 0
      };
      setStickers(prev => [...prev, newSticker]);
  };

  const updateSticker = (id: string, updates: Partial<StickerItem>) => {
      setStickers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // --- Renderers ---
  const renderStickerLayer = () => (
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden print-layout">
          {stickers.map(sticker => (
              <div
                key={sticker.id}
                className={`absolute group pointer-events-auto ${activeStickerId === sticker.id ? 'z-[60]' : 'z-50'}`}
                style={{
                    left: sticker.x,
                    top: sticker.y,
                    width: sticker.width,
                    height: sticker.height,
                    transform: `rotate(${sticker.rotation}deg)`
                }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    setActiveStickerId(sticker.id);
                    setIsDraggingSticker(true);
                    setDragOffset({ x: e.clientX - sticker.x, y: e.clientY - sticker.y });
                }}
              >
                  <img src={sticker.imageUrl} className="w-full h-full object-contain drop-shadow-md" />
                  
                  {activeStickerId === sticker.id && (
                      <>
                        <div className="absolute -top-6 -right-6 flex gap-1 no-print">
                             <button 
                                className="bg-white rounded-full p-1 border border-stone-300 hover:bg-red-100"
                                onClick={(e) => { e.stopPropagation(); setStickers(prev => prev.filter(s => s.id !== sticker.id)); }}
                             >
                                 <X size={12}/>
                             </button>
                        </div>
                        <div 
                            className="absolute -bottom-3 -right-3 bg-white rounded-full p-1 border border-stone-300 cursor-se-resize no-print"
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                const startX = e.clientX;
                                const startW = sticker.width;
                                const onMove = (mv: MouseEvent) => {
                                    updateSticker(sticker.id, { width: startW + (mv.clientX - startX), height: startW + (mv.clientX - startX) });
                                };
                                const onUp = () => {
                                    window.removeEventListener('mousemove', onMove);
                                    window.removeEventListener('mouseup', onUp);
                                };
                                window.addEventListener('mousemove', onMove);
                                window.addEventListener('mouseup', onUp);
                            }}
                        >
                            <Maximize2 size={12} />
                        </div>
                         <div 
                            className="absolute -top-3 -left-3 bg-white rounded-full p-1 border border-stone-300 cursor-pointer no-print"
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                const startY = e.clientY;
                                const startRot = sticker.rotation;
                                const onMove = (mv: MouseEvent) => {
                                    updateSticker(sticker.id, { rotation: startRot + (mv.clientY - startY) });
                                };
                                const onUp = () => {
                                    window.removeEventListener('mousemove', onMove);
                                    window.removeEventListener('mouseup', onUp);
                                };
                                window.addEventListener('mousemove', onMove);
                                window.addEventListener('mouseup', onUp);
                            }}
                        >
                            <RotateCw size={12} />
                        </div>
                      </>
                  )}
              </div>
          ))}
      </div>
  );

  const renderMonthView = () => {
    const startDay = new Date(currentMonthStart).getDay();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const blanks = Array.from({ length: startDay });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="grid grid-cols-7 gap-2 p-6 h-full overflow-y-auto">
            {DAYS.map(d => <div key={d} className="text-center font-extrabold text-stone-600 letterpress text-xs uppercase tracking-widest">{d}</div>)}
            
            {blanks.map((_, i) => <div key={`blank-${i}`} className="min-h-[6rem]"></div>)}
            
            {days.map(day => {
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTasks = tasks.filter(t => t.date === dateStr);
                const isTarget = dropTarget?.type === 'cell' && dropTarget.date === dateStr;
                const isToday = day === now.getDate() && currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();

                return (
                    <div 
                        key={day} 
                        data-drop-target="true"
                        data-date={dateStr}
                        className={`min-h-[6rem] p-2 relative border border-stone-300/40 rounded-lg transition-all ${isTarget ? 'bg-blue-50/50 scale-[1.02]' : 'hover:bg-stone-100/30'} ${isToday ? 'bg-red-50/20' : ''}`}
                    >
                         <span className={`absolute top-1 right-2 text-sm font-black pointer-events-none letterpress ${isToday ? 'text-red-600' : 'text-stone-500'}`}>{day}</span>
                         
                         <div className="mt-6 flex flex-col gap-1">
                            {dayTasks.map(task => (
                                <div 
                                    key={task.id}
                                    onMouseDown={(e) => { e.stopPropagation(); setDraggedTask(task); setDragPosition({x: e.clientX, y: e.clientY}); }} 
                                    onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                                    className={`text-[10px] p-1 px-2 rounded-sm cursor-grab truncate border-l-2 flex justify-between items-center group ${getEnergyColor(task.type)} shadow-sm font-bold`}
                                >
                                    <span className={`text-strong ${task.completed ? 'line-through opacity-60' : ''}`}>{task.title}</span>
                                    {task.startTime !== undefined && (
                                        <span className="text-[9px] font-mono ml-1 opacity-80">{task.startTime}:00</span>
                                    )}
                                </div>
                            ))}
                         </div>
                    </div>
                );
            })}
        </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        return d;
    });

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = hours[0] * 60;
    const isTimeInView = nowMinutes >= startMinutes && nowMinutes <= (hours[hours.length-1] + 1) * 60;
    
    // Height constants
    const HOUR_HEIGHT_REM = 2.5; // h-10 is 2.5rem
    const timeTopRem = (nowMinutes - startMinutes) * (HOUR_HEIGHT_REM / 60);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="grid border-b border-stone-300/50 pb-2 mb-2" style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}>
                <div className="p-2"></div>
                {weekDates.map(d => {
                    const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    return (
                        <div key={d.toISOString()} className={`p-2 text-center ${isToday ? 'bg-red-50/20 rounded-t-lg' : ''}`}>
                            <div className={`text-[10px] font-extrabold uppercase tracking-widest letterpress ${isToday ? 'text-red-600' : 'text-stone-600'}`}>{DAYS[d.getDay()]}</div>
                            <div className={`text-xl font-black letterpress ${isToday ? 'text-red-600' : 'text-stone-700'}`}>{d.getDate()}</div>
                        </div>
                    );
                })}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto relative custom-scrollbar pr-2">
                <div className="grid relative min-h-full" style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}>
                    {/* Time Column */}
                    <div className="col-span-1 border-r border-stone-200/50 z-10">
                        {hours.map(h => (
                            <div key={h} className="h-10 text-[10px] text-stone-600 p-1 text-right pr-2 font-extrabold letterpress flex items-start justify-end leading-none pt-2">
                                {h}:00
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    {weekDates.map(d => {
                        const dateStr = d.toISOString().split('T')[0];
                        const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        
                        return (
                            <div 
                                key={dateStr} 
                                className={`col-span-1 border-r border-stone-200/40 last:border-0 relative ${isToday ? 'bg-red-50/10' : ''}`}
                            >
                                {hours.map(h => {
                                    const isTarget = dropTarget?.type === 'cell' && dropTarget.date === dateStr && dropTarget.hour === h;
                                    return (
                                        <div 
                                            key={h} 
                                            data-drop-target="true"
                                            data-date={dateStr}
                                            data-hour={h}
                                            onClick={() => {
                                                const newTask = {
                                                    id: Math.random().toString(36).substr(2, 9),
                                                    title: 'New Task',
                                                    type: EnergyType.CHORE,
                                                    completed: false,
                                                    date: dateStr,
                                                    startTime: h,
                                                    duration: 1,
                                                    energyPoints: -10,
                                                    substeps: []
                                                };
                                                setTasks(prev => [...prev, newTask]);
                                                setEditingTask(newTask);
                                            }}
                                            className={`h-10 border-b border-stone-200/30 transition-colors cursor-pointer ${isTarget ? 'bg-blue-50/30' : 'hover:bg-stone-50/20'}`}
                                        >
                                            {isTarget && (
                                                <div className="w-full h-full border border-dashed border-blue-300 rounded opacity-50 pointer-events-none"></div>
                                            )}
                                        </div>
                                    );
                                })}

                                {isToday && isTimeInView && (
                                    <div 
                                        className="absolute w-full border-t border-red-400 z-30 pointer-events-none flex items-center opacity-40"
                                        style={{ top: `${timeTopRem}rem` }}
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 -ml-0.5 shadow-sm"></div>
                                    </div>
                                )}
                                
                                {tasks.filter(t => t.date === dateStr && t.startTime !== undefined).map(task => {
                                    if (draggedTask?.id === task.id) return null;
                                    
                                    const startOffset = task.startTime! - hours[0];
                                    if (startOffset < 0 && (startOffset + task.duration) <= 0) return null;
                                    
                                    const effectiveStart = Math.max(0, startOffset);
                                    
                                    // Math for exact positioning: effectiveStart * height_per_hour
                                    const top = effectiveStart * HOUR_HEIGHT_REM; 
                                    const height = (task.duration - (effectiveStart - startOffset)) * HOUR_HEIGHT_REM;

                                    if (height <= 0) return null;

                                    return (
                                        <div 
                                            key={task.id}
                                            onMouseDown={(e) => { e.stopPropagation(); setDraggedTask(task); setDragPosition({x: e.clientX, y: e.clientY}); }}
                                            onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                                            className={`absolute left-1 right-1 p-2 rounded-md shadow-sm border text-xs cursor-grab overflow-hidden flex flex-col ${getEnergyColor(task.type)} ${task.completed ? 'opacity-60 grayscale' : ''}`}
                                            style={{ top: `${top}rem`, height: `${height}rem`, zIndex: 20 }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={`font-extrabold leading-tight text-strong ${task.completed ? 'line-through decoration-1' : ''}`}>{task.title}</span>
                                                <button onClick={(e) => { e.stopPropagation(); setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t)); }}>
                                                    {task.completed ? <CheckCircle2 size={12}/> : <Circle size={12} />}
                                                </button>
                                            </div>
                                            {height > 2 && (
                                                <div className="mt-1 opacity-70">
                                                    {task.substeps.length > 0 && (
                                                        <div className="text-[9px] font-bold">{task.substeps.filter(s=>s.completed).length}/{task.substeps.length}</div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <div 
                                                className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize flex justify-center items-end opacity-0 hover:opacity-100 transition-opacity"
                                                onMouseDown={(e) => handleResizeStart(e, task)}
                                            >
                                                <div className="w-6 h-0.5 bg-black/20 rounded-full mb-0.5"></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden text-stone-700 select-none" onClick={() => setActiveStickerId(null)}>
      {renderStickerLayer()}
      
      {/* Ghost for Dragging */}
      {draggedTask && (
        <div 
            className="fixed pointer-events-none z-[70] p-3 bg-white/90 rounded-lg shadow-2xl w-48 border border-stone-200"
            style={{ left: dragPosition.x, top: dragPosition.y }}
        >
            <span className="font-bold letterpress">{draggedTask.title}</span>
        </div>
      )}

      {/* LEFT PANEL - PERMANENT */}
      <div 
        id="backlog-area"
        className="w-80 h-full flex flex-col p-6 z-40 relative no-print shrink-0"
      >
        <div className="mb-6">
            <h1 className="text-2xl font-black letterpress-title mb-1">DoodlePlan</h1>
            <p className="text-xs text-stone-600 font-bold tracking-widest uppercase letterpress">Daily Organizer</p>
        </div>

        {/* Energy Budget */}
        <div className="mb-6">
             <div className="bg-white/40 p-4 rounded-xl border border-white/60 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold flex items-center gap-2 text-sm letterpress text-stone-800"><Battery size={14} /> Energy</span>
                    <span className="text-xs font-bold letterpress opacity-80">{dailyEnergy.used > 0 ? '+' : ''}{dailyEnergy.used} / {ENERGY_BUDGET}</span>
                </div>
                <div className="w-full bg-stone-300 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${dailyEnergy.remaining < 20 ? 'bg-red-400' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, Math.max(0, (100 + dailyEnergy.used)))}%` }}
                    ></div>
                </div>
             </div>
        </div>

        {/* Todo Backlog */}
        <div className="flex-1 flex flex-col min-h-0 mb-6">
             <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-stone-700 letterpress flex items-center gap-2">
                    <ListTodo size={16}/> Todo Box
                </h3>
             </div>
             
             {/* Quick Add */}
             <div className="mb-3 relative group">
                <input 
                    id="newTaskTitle" 
                    type="text" 
                    placeholder="New Task..." 
                    onKeyDown={(e) => {
                         if(e.key === 'Enter') {
                             const input = e.target as HTMLInputElement;
                             if(input.value) { addTask(input.value, EnergyType.CHORE); input.value = ''; }
                         }
                    }}
                    className="w-full p-2 pl-3 pr-8 rounded-lg bg-white/60 border border-transparent focus:border-stone-300 focus:bg-white outline-none text-sm transition-all shadow-sm placeholder-stone-500 font-bold text-stone-700" 
                />
                <button 
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                    onClick={() => {
                         const input = document.getElementById('newTaskTitle') as HTMLInputElement;
                         if(input.value) { addTask(input.value, EnergyType.CHORE); input.value = ''; }
                    }}
                >
                    <Plus size={16} />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {backlog.map(task => {
                    if (draggedTask?.id === task.id) return null;
                    return (
                        <div 
                            key={task.id}
                            onMouseDown={(e) => { e.stopPropagation(); setDraggedTask(task); setDragPosition({x: e.clientX, y: e.clientY}); }}
                            onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                            className={`p-3 rounded-lg cursor-grab hover:shadow-md transition-all border border-stone-100 ${getEnergyColor(task.type)} bg-opacity-80`}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`text-sm font-bold text-strong ${task.completed ? 'line-through decoration-stone-600 opacity-50' : ''}`}>{task.title}</span>
                                <span className="text-[10px] font-black opacity-70">{task.energyPoints}</span>
                            </div>
                        </div>
                    );
                })}
                {backlog.length === 0 && (
                    <div className="text-center py-8 text-stone-400 text-xs italic">
                        Empty box. Relax!
                    </div>
                )}
             </div>
        </div>

        {/* Sticker & Tools */}
        <div className="space-y-4">
             <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-xs text-stone-600 letterpress uppercase tracking-wider">Stickers</h3>
                    <button onClick={() => setShowSketchPad(true)} className="text-[10px] bg-white px-2 py-1 rounded-full border border-stone-200 hover:border-stone-400 transition-colors shadow-sm">+</button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {stickerLibrary.slice(0, 8).map((url, idx) => (
                        <div key={idx} className="aspect-square bg-white rounded-md p-1 cursor-pointer hover:shadow-md border border-stone-100 transition-all" onClick={() => addStickerToBoard(url)}>
                            <img src={url} className="w-full h-full object-contain opacity-80 hover:opacity-100" />
                        </div>
                    ))}
                    {stickerLibrary.length === 0 && <div className="col-span-4 text-[10px] text-stone-400 text-center py-2 border border-dashed border-stone-300 rounded-lg">Draw something!</div>}
                </div>
             </div>

             <div className="flex gap-2 pt-2 border-t border-stone-300/40">
                <button onClick={() => setShowSettings(true)} className="flex-1 py-2 bg-white rounded-lg hover:shadow-md border border-stone-200 transition-all flex justify-center items-center gap-2 text-xs font-bold text-stone-600">
                    <Settings size={14} /> Settings
                </button>
                <button onClick={() => window.print()} className="flex-1 py-2 bg-white rounded-lg hover:shadow-md border border-stone-200 transition-all flex justify-center items-center gap-2 text-xs font-bold text-stone-600">
                    <Printer size={14} /> Print
                </button>
            </div>
        </div>
      </div>

      {/* MAIN CALENDAR CARD - RIGHT SIDE */}
      <div className="flex-1 p-6 pl-0 h-full flex flex-col overflow-hidden">
        <div className="soft-card w-full h-full flex flex-col p-6 relative">
            
            {/* Calendar Controls */}
            <div className="flex justify-between items-center mb-6 z-20 relative">
                <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                        <button onClick={() => {
                            const d = new Date(currentDate);
                            if (view === 'month') d.setMonth(d.getMonth() - 1);
                            else d.setDate(d.getDate() - 7);
                            setCurrentDate(d);
                        }} className="hover:bg-stone-100 rounded-full p-2 transition-colors text-stone-600">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => {
                            const d = new Date(currentDate);
                            if (view === 'month') d.setMonth(d.getMonth() + 1);
                            else d.setDate(d.getDate() + 7);
                            setCurrentDate(d);
                        }} className="hover:bg-stone-100 rounded-full p-2 transition-colors text-stone-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <h2 className="text-2xl font-black letterpress-title text-stone-800">
                        {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                </div>

                <div className="bg-stone-200/50 p-1 rounded-xl flex gap-1">
                    <button 
                        onClick={() => { setView('month'); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${view === 'month' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                        Month
                    </button>
                    <button 
                        onClick={() => { setView('week'); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${view === 'week' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                        Week
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-hidden relative z-10">
                {view === 'month' ? renderMonthView() : renderWeekView()}
            </div>

        </div>
      </div>

      {/* Modals */}
      {showSketchPad && (
        <SketchPad 
            onClose={() => setShowSketchPad(false)} 
            onSave={(url) => { setStickerLibrary(prev => [...prev, url]); }}
        />
      )}
      
      {showSettings && (
          <SettingsModal 
            onClose={() => setShowSettings(false)}
            wakingStart={wakingStart}
            wakingEnd={wakingEnd}
            onSave={(s, e) => { setWakingStart(s); setWakingEnd(e); }}
          />
      )}
      
      {editingTask && (
        <EditTaskModal 
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={(updated) => {
                setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
            }}
            onDelete={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
        />
      )}
    </div>
  );
}
