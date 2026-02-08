
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
  Columns,
  ChevronDown,
  Pin,
  PinOff,
  CheckSquare,
  Square,
  Sliders
} from 'lucide-react';
import { Task, EnergyType, Achievement, StickerItem } from './types';
import SketchPad from './components/SketchPad';
import EditTaskModal from './components/EditTaskModal';
import SettingsModal from './components/SettingsModal';

// --- Configuration & Constants ---
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ENERGY_BUDGET = 100;

// Energy Color Mapping - High Contrast for Readability
const getEnergyColorStyles = (type: EnergyType, intensity: number = 50) => {
    // Intensity 0-100 maps to Opacity 0.4 - 1.0 and Saturation adjustments
    const opacity = 0.4 + (intensity / 100) * 0.6;
    
    switch (type) {
        case EnergyType.CHORE: 
            return { 
                backgroundColor: `rgba(141, 110, 99, ${opacity})`, 
                borderColor: '#8d6e63', 
                color: '#3e2723' 
            };
        case EnergyType.FUN: 
            return { 
                backgroundColor: `rgba(253, 224, 71, ${opacity})`, 
                borderColor: '#eab308', 
                color: '#422006' 
            };
        case EnergyType.CREATE: 
            return { 
                backgroundColor: `rgba(56, 189, 248, ${opacity})`, 
                borderColor: '#0284c7', 
                color: '#082f49' 
            };
        case EnergyType.HEAL: 
            return { 
                backgroundColor: `rgba(74, 222, 128, ${opacity})`, 
                borderColor: '#16a34a', 
                color: '#052e16' 
            };
        default: 
            return { 
                backgroundColor: `rgba(214, 211, 209, ${opacity})`, 
                borderColor: '#a8a29e', 
                color: '#1c1917' 
            };
    }
};

const ENERGY_OPTIONS = [
  { type: EnergyType.CHORE, icon: '🤎', label: 'Chore', color: '#8d6e63' },
  { type: EnergyType.FUN, icon: '💛', label: 'Fun', color: '#fde047' },
  { type: EnergyType.CREATE, icon: '🩵', label: 'Create', color: '#039be5' },
  { type: EnergyType.HEAL, icon: '💚', label: 'Heal', color: '#43a047' },
];

// Helper to generate a week of diverse data
const generateWeeklyData = () => {
    const tasks: Task[] = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

    const profiles = [
        { name: "Lazy Sunday", types: [EnergyType.HEAL, EnergyType.FUN], ratio: [0.8, 0.2] },
        { name: "Manic Monday", types: [EnergyType.CHORE, EnergyType.CREATE], ratio: [0.7, 0.3] },
        { name: "Focus Tuesday", types: [EnergyType.CREATE, EnergyType.CHORE], ratio: [0.6, 0.4] },
        { name: "Wellness Wednesday", types: [EnergyType.HEAL, EnergyType.CREATE], ratio: [0.5, 0.5] },
        { name: "Thriving Thursday", types: [EnergyType.FUN, EnergyType.CHORE], ratio: [0.6, 0.4] },
        { name: "Fun Friday", types: [EnergyType.FUN, EnergyType.HEAL], ratio: [0.8, 0.2] },
        { name: "Social Saturday", types: [EnergyType.FUN, EnergyType.CREATE], ratio: [0.9, 0.1] },
    ];

    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const profile = profiles[i];

        // Generate 3-5 tasks per day
        const numTasks = 3 + Math.floor(Math.random() * 3);
        for(let j=0; j<numTasks; j++) {
            const type = Math.random() < profile.ratio[0] ? profile.types[0] : profile.types[1];
            tasks.push({
                id: `task-${i}-${j}`,
                title: `${profile.name} Task ${j+1}`,
                type: type,
                completed: Math.random() > 0.5,
                date: dateStr,
                startTime: 8 + (j * 2),
                duration: 1 + Math.floor(Math.random()),
                energyPoints: 50, // Default mid intensity
                substeps: []
            });
        }
    }
    return tasks;
};

// --- Sticky Ball Component ---
const StickyBall = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (!ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const angle = Math.atan2(dy, dx);
            const dist = Math.min(3, Math.hypot(dx, dy) / 8); 

            setPupilPos({
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist
            });
        };
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, []);

    return (
        <div ref={ref} className="w-8 h-8 bg-stone-800 rounded-full flex items-center justify-center gap-[2px] shadow-sm relative overflow-hidden transition-transform hover:scale-110 cursor-pointer">
             <div className="w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center overflow-hidden">
                 <div className="w-1.5 h-1.5 bg-black rounded-full" style={{ transform: `translate(${pupilPos.x}px, ${pupilPos.y}px)` }}></div>
             </div>
             <div className="w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center overflow-hidden">
                 <div className="w-1.5 h-1.5 bg-black rounded-full" style={{ transform: `translate(${pupilPos.x}px, ${pupilPos.y}px)` }}></div>
             </div>
        </div>
    );
};

export default function App() {
  // --- State ---
  const [view, setView] = useState<'month' | 'week'>('week');
  const [tasks, setTasks] = useState<Task[]>(() => generateWeeklyData());
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date()); 
  
  // Settings State
  const [wakingStart, setWakingStart] = useState(6);
  const [wakingEnd, setWakingEnd] = useState(22);

  // UI State
  const [showSketchPad, setShowSketchPad] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stickerLibrary, setStickerLibrary] = useState<string[]>([]);
  
  // Interaction State
  const [creationMenu, setCreationMenu] = useState<{ x: number, y: number, date: string, hour: number } | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [checklistState, setChecklistState] = useState<{ taskId: string, x: number, y: number, pinned: boolean } | null>(null);
  const [checklistDragOffset, setChecklistDragOffset] = useState<{x: number, y: number} | null>(null);
  
  // Drag & Resize State
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState<{ date?: string, hour?: number, type: 'cell' | 'backlog' } | null>(null);
  const [dragStart, setDragStart] = useState<{ task: Task, x: number, y: number } | null>(null);
  
  const [resizingTask, setResizingTask] = useState<{task: Task, startY: number, startDuration: number} | null>(null);
  const [resizingTaskTop, setResizingTaskTop] = useState<{task: Task, startY: number, startTime: number, startDuration: number} | null>(null);
  
  // New Copy Drag State
  const [dragCopyState, setDragCopyState] = useState<{
      originalTask: Task;
      direction: 'left' | 'right';
      previews: Task[];
  } | null>(null);

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

  // --- Helpers ---
  const getDatesInRange = (startDate: string, endDate: string) => {
      const dates = [];
      const [y1, m1, d1] = startDate.split('-').map(Number);
      const [y2, m2, d2] = endDate.split('-').map(Number);
      
      let curr = new Date(y1, m1 - 1, d1, 12, 0, 0);
      const end = new Date(y2, m2 - 1, d2, 12, 0, 0);
      
      const step = end > curr ? 1 : -1;
      curr.setDate(curr.getDate() + step);

      let limit = 0;
      while ((step > 0 ? curr <= end : curr >= end) && limit < 100) {
          const y = curr.getFullYear();
          const m = String(curr.getMonth() + 1).padStart(2, '0');
          const d = String(curr.getDate()).padStart(2, '0');
          dates.push(`${y}-${m}-${d}`);
          curr.setDate(curr.getDate() + step);
          limit++;
      }
      return dates;
  };

  // --- Effects ---
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Global Mouse Handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        // 0. Check Drag Threshold
        if (dragStart && !draggedTask) {
             const dx = e.clientX - dragStart.x;
             const dy = e.clientY - dragStart.y;
             if (Math.sqrt(dx*dx + dy*dy) > 5) { // 5px movement threshold
                 setDraggedTask(dragStart.task);
                 setDragPosition({ x: e.clientX, y: e.clientY });
             }
        }

        // 1. Task Dragging (Move)
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

        // 2. Task Resizing (Bottom)
        if (resizingTask) {
            const deltaY = e.clientY - resizingTask.startY;
            const hourDelta = deltaY / 40; // 40px per hour
            const newDuration = Math.max(0.25, Math.round((resizingTask.startDuration + hourDelta) * 4) / 4);
            setTasks(prev => prev.map(t => t.id === resizingTask.task.id ? { ...t, duration: newDuration } : t));
        }

        // 3. Task Resizing (Top)
        if (resizingTaskTop) {
            const deltaY = e.clientY - resizingTaskTop.startY;
            const hourDelta = deltaY / 40; // 40px per hour
            let newStart = resizingTaskTop.startTime + hourDelta;
            newStart = Math.round(newStart * 4) / 4; 
            const end = resizingTaskTop.startTime + resizingTaskTop.startDuration;
            const newDuration = end - newStart;
            if (newDuration >= 0.25 && newStart >= 0) {
                 setTasks(prev => prev.map(t => t.id === resizingTaskTop.task.id ? { ...t, startTime: newStart, duration: newDuration } : t));
            }
        }

        // 4. Copy Dragging
        if (dragCopyState) {
            const elements = document.elementsFromPoint(e.clientX, e.clientY);
            const target = elements.find(el => el.hasAttribute('data-date'));
            if (target) {
                const targetDate = target.getAttribute('data-date');
                if (targetDate && targetDate !== dragCopyState.originalTask.date) {
                    const originDate = dragCopyState.originalTask.date!;
                    let shouldGenerate = false;
                    if (dragCopyState.direction === 'right' && targetDate > originDate) shouldGenerate = true;
                    if (dragCopyState.direction === 'left' && targetDate < originDate) shouldGenerate = true;

                    if (shouldGenerate) {
                        const datesToFill = getDatesInRange(originDate, targetDate);
                        const newPreviews = datesToFill.map(d => ({
                            ...dragCopyState.originalTask,
                            id: `preview-${d}`,
                            date: d,
                            title: dragCopyState.originalTask.title,
                            isPreview: true
                        }));
                        setDragCopyState(prev => prev ? { ...prev, previews: newPreviews } : null);
                    } else {
                        setDragCopyState(prev => prev ? { ...prev, previews: [] } : null);
                    }
                }
            }
        }

        // 5. Sticker Dragging
        if (isDraggingSticker && activeStickerId) {
            setStickers(prev => prev.map(s => 
                s.id === activeStickerId 
                ? { ...s, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }
                : s
            ));
        }

        // 6. Checklist Dragging
        if (checklistState && checklistDragOffset) {
            setChecklistState(prev => prev ? {
                ...prev,
                x: e.clientX - checklistDragOffset.x,
                y: e.clientY - checklistDragOffset.y
            } : null);
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
        setDragStart(null); 
        setChecklistDragOffset(null);

        // Handle Task Drag Drop
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

        // Handle Copy Drag Commit
        if (dragCopyState) {
            if (dragCopyState.previews.length > 0) {
                const newTasks = dragCopyState.previews.map(p => ({
                    ...p,
                    id: Math.random().toString(36).substr(2, 9),
                    isPreview: undefined
                }));
                setTasks(prev => [...prev, ...newTasks]);
            }
            setDragCopyState(null);
        }

        setDraggedTask(null);
        setDropTarget(null);
        setResizingTask(null);
        setResizingTaskTop(null);
        setIsDraggingSticker(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedTask, dropTarget, resizingTask, resizingTaskTop, dragCopyState, isDraggingSticker, activeStickerId, dragOffset, wakingStart, dragStart, checklistState, checklistDragOffset]);

  // --- Handlers ---
  const handleBackgroundClick = (e: React.MouseEvent) => {
      setCreationMenu(null);
      
      // Only deselect if clicking on actual background, not on other interactables
      const target = e.target as HTMLElement;
      if (!target.closest('.task-card') && !target.closest('#floating-checklist') && !target.closest('.control-popup')) {
          setSelectedTaskId(null);
          if (checklistState && !checklistState.pinned) {
              setChecklistState(null);
          }
      }
      setActiveStickerId(null);
  };

  const addTask = (title: string, type: EnergyType, date?: string, hour?: number) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      type,
      completed: false,
      date,
      startTime: hour,
      energyPoints: 50,
      duration: 1,
      substeps: []
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const handleResizeStart = (e: React.MouseEvent, task: Task) => {
      e.stopPropagation();
      e.preventDefault();
      setResizingTask({ task, startY: e.clientY, startDuration: task.duration });
  };

  const handleResizeTopStart = (e: React.MouseEvent, task: Task) => {
      e.stopPropagation();
      e.preventDefault();
      setResizingTaskTop({ task, startY: e.clientY, startTime: task.startTime!, startDuration: task.duration });
  };

  const handleCopyDragStart = (e: React.MouseEvent, task: Task, direction: 'left' | 'right') => {
      e.stopPropagation();
      e.preventDefault();
      setDragCopyState({
          originalTask: task,
          direction,
          previews: []
      });
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

  const updateTaskTitle = (id: string, newTitle: string) => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
  };

  // --- Renderers ---
  const renderFloatingChecklist = () => {
      if (!checklistState) return null;
      const task = tasks.find(t => t.id === checklistState.taskId);
      if (!task) return null;

      // Ensure checklist is visible if selected
      const isVisible = checklistState.pinned || selectedTaskId === task.id;
      if (!isVisible) return null;

      return (
          <div 
            id="floating-checklist"
            className="fixed z-[80] w-64 bg-white/95 rounded-xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-pop-in"
            style={{ 
                left: checklistState.x, 
                top: checklistState.y,
                height: 'auto',
                maxHeight: '400px'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
              <div 
                className="h-8 bg-stone-100 border-b border-stone-200 flex items-center justify-between px-2 cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    if (rect) {
                        setChecklistDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }
                }}
              >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 truncate max-w-[150px]">{task.title}</span>
                  <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setChecklistState(prev => prev ? {...prev, pinned: !prev.pinned} : null)}
                        className={`p-1 rounded-md transition-colors ${checklistState.pinned ? 'bg-blue-100 text-blue-600' : 'hover:bg-stone-200 text-stone-400'}`}
                      >
                          {checklistState.pinned ? <Pin size={12} fill="currentColor"/> : <PinOff size={12}/>}
                      </button>
                      <button 
                        onClick={() => setChecklistState(null)}
                        className="p-1 hover:bg-red-100 hover:text-red-500 rounded-md text-stone-400 transition-colors"
                      >
                          <X size={12} />
                      </button>
                  </div>
              </div>
              <div className="p-3 bg-stone-50/50 flex flex-col gap-2">
                 <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                    {task.substeps.map(step => (
                        <div key={step.id} className="flex items-center gap-2 group">
                             <button 
                                onClick={() => {
                                    setTasks(prev => prev.map(t => t.id === task.id ? {
                                        ...t,
                                        substeps: t.substeps.map(s => s.id === step.id ? {...s, completed: !s.completed} : s)
                                    } : t));
                                }}
                                className={`text-stone-400 hover:text-green-500 transition-colors ${step.completed ? 'text-green-500' : ''}`}
                             >
                                 {step.completed ? <CheckSquare size={14}/> : <Square size={14}/>}
                             </button>
                             <input 
                                value={step.title}
                                onChange={(e) => {
                                    setTasks(prev => prev.map(t => t.id === task.id ? {
                                        ...t,
                                        substeps: t.substeps.map(s => s.id === step.id ? {...s, title: e.target.value} : s)
                                    } : t));
                                }}
                                className={`bg-transparent text-xs outline-none flex-1 border-b border-transparent focus:border-stone-300 ${step.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}
                             />
                             <button 
                                onClick={() => {
                                     setTasks(prev => prev.map(t => t.id === task.id ? {
                                        ...t,
                                        substeps: t.substeps.filter(s => s.id !== step.id)
                                    } : t));
                                }}
                                className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400"
                             >
                                 <X size={12} />
                             </button>
                        </div>
                    ))}
                    {task.substeps.length === 0 && <div className="text-[10px] text-stone-400 italic text-center py-2">No items yet</div>}
                 </div>
                 <div className="flex gap-1 pt-2 border-t border-stone-200">
                     <input 
                        placeholder="Add item..."
                        className="flex-1 text-xs bg-white border border-stone-200 rounded px-2 py-1 outline-none focus:border-stone-400"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                if (val.trim()) {
                                    setTasks(prev => prev.map(t => t.id === task.id ? {
                                        ...t,
                                        substeps: [...t.substeps, { id: Math.random().toString(36).substr(2,9), title: val, completed: false }]
                                    } : t));
                                    (e.target as HTMLInputElement).value = '';
                                }
                            }
                        }}
                     />
                 </div>
              </div>
          </div>
      );
  };

  const renderTypeSelector = () => {
      if (!creationMenu) return null;

      return (
          <div 
            className="fixed z-[100] flex gap-3 pointer-events-auto"
            style={{ 
                left: Math.min(window.innerWidth - 250, creationMenu.x), 
                top: creationMenu.y - 60 
            }}
          >
              {ENERGY_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.type}
                    className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg border border-stone-200 hover:scale-110 transition-transform animate-pop-in"
                    style={{ animationDelay: `${i * 50}ms`, borderColor: opt.color }}
                    onClick={(e) => {
                        e.stopPropagation();
                        addTask('New Task', opt.type, creationMenu.date, creationMenu.hour);
                        setCreationMenu(null);
                    }}
                  >
                      <span className="text-xl">{opt.icon}</span>
                  </button>
              ))}
          </div>
      );
  };

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
    // ... (Month view logic mostly same, but make sure it handles click/selection)
    // For brevity, skipping logic changes here as user focused on Week/Task interaction, 
    // but assuming standard grid. Month view is less interactive for detailed task editing in this requested flow.
    // Keeping existing rendering but updating task styling logic.
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
                const isToday = day === now.getDate() && currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();

                return (
                    <div 
                        key={day} 
                        className={`min-h-[6rem] p-2 relative border border-stone-300/40 rounded-lg transition-all ${isToday ? 'bg-red-50/20' : ''}`}
                    >
                         <span className={`absolute top-1 right-2 text-sm font-black pointer-events-none letterpress ${isToday ? 'text-red-600' : 'text-stone-500'}`}>{day}</span>
                         <div className="mt-6 flex flex-col gap-1">
                            {dayTasks.map(task => {
                                const styles = getEnergyColorStyles(task.type, task.energyPoints);
                                return (
                                    <div 
                                        key={task.id}
                                        className="text-[10px] p-1 px-2 rounded-sm truncate border-l-2 font-bold cursor-pointer hover:opacity-80 transition-opacity"
                                        style={styles}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingTask(task);
                                        }}
                                    >
                                        <span className={`text-strong ${task.completed ? 'line-through opacity-60' : ''}`}>{task.title}</span>
                                    </div>
                                )
                            })}
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

    const allRenderTasks = [...tasks];
    if (dragCopyState && dragCopyState.previews.length > 0) {
        dragCopyState.previews.forEach(p => allRenderTasks.push(p));
    }

    return (
        <div className="flex flex-col h-full overflow-hidden relative">
            {/* Blur Overlay for Focus Mode */}
            {selectedTaskId && (
                <div className="absolute inset-0 z-30 bg-white/40 backdrop-blur-sm transition-all duration-300"></div>
            )}

            {/* Header */}
            <div className="grid border-b border-stone-300/50 pb-2 mb-2 relative" style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}>
                <div className="p-2 flex items-center justify-center">
                    <StickyBall />
                </div>
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
                                data-date={dateStr}
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
                                            onClick={(e) => {
                                                // Prevent bubbling if we clicked a task, but handle creation if empty
                                                setCreationMenu({ 
                                                    x: e.clientX, 
                                                    y: e.clientY, 
                                                    date: dateStr, 
                                                    hour: h 
                                                });
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
                                        className="absolute w-full border-t border-red-400 z-30 pointer-events-none opacity-40"
                                        style={{ top: `${timeTopRem}rem` }}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-red-400 -mt-1 -ml-1 shadow-sm"></div>
                                    </div>
                                )}
                                
                                {allRenderTasks.filter(t => t.date === dateStr && t.startTime !== undefined).map(task => {
                                    if (draggedTask?.id === task.id) return null;
                                    
                                    const startOffset = task.startTime! - hours[0];
                                    if (startOffset < 0 && (startOffset + task.duration) <= 0) return null;
                                    
                                    const effectiveStart = Math.max(0, startOffset);
                                    const top = effectiveStart * HOUR_HEIGHT_REM; 
                                    const height = (task.duration - (effectiveStart - startOffset)) * HOUR_HEIGHT_REM;

                                    if (height <= 0) return null;

                                    const isPreview = (task as any).isPreview;
                                    const isSelected = selectedTaskId === task.id;
                                    const styles = getEnergyColorStyles(task.type, task.energyPoints);

                                    return (
                                        <div 
                                            key={task.id}
                                            onMouseDown={(e) => { 
                                                if (isPreview) return;
                                                // Allow dragging only if not interacting with controls
                                                if (!(e.target as HTMLElement).closest('.control-element')) {
                                                    setDragStart({ task, x: e.clientX, y: e.clientY });
                                                }
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isPreview) return;
                                                setSelectedTaskId(task.id);
                                                // Auto open checklist near the task
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setChecklistState({
                                                    taskId: task.id,
                                                    x: rect.right + 10,
                                                    y: rect.top,
                                                    pinned: false
                                                });
                                            }}
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                if (isPreview) return;
                                                setEditingTask(task);
                                            }}
                                            className={`
                                                absolute left-1 right-1 pl-3 pr-1 py-1 rounded-md shadow-sm border text-xs overflow-visible flex flex-col group task-card
                                                transition-all duration-300 ease-out
                                                ${isPreview ? 'opacity-50 border-dashed border-stone-400 pointer-events-none' : 'cursor-pointer'}
                                                ${isSelected ? 'z-[60] scale-105 shadow-xl ring-2 ring-stone-300' : 'z-20 hover:scale-[1.02]'}
                                                ${task.completed ? 'opacity-50' : ''}
                                            `}
                                            style={{ 
                                                top: `${top}rem`, 
                                                height: `${height}rem`, 
                                                backgroundColor: task.completed ? 'transparent' : styles.backgroundColor,
                                                borderColor: styles.borderColor,
                                                color: styles.color,
                                                borderWidth: task.completed ? '2px' : '1px'
                                            }}
                                        >
                                            {/* --- FOCUS CONTROLS --- */}
                                            {isSelected && !isPreview && (
                                                <>
                                                    {/* Type Selector (Top) */}
                                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-2 control-popup control-element">
                                                        {ENERGY_OPTIONS.map(opt => (
                                                            <button
                                                                key={opt.type}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, type: opt.type } : t));
                                                                }}
                                                                className={`w-8 h-8 rounded-full bg-white shadow-md border-2 flex items-center justify-center transition-transform hover:scale-110 ${task.type === opt.type ? 'scale-110' : 'opacity-80'}`}
                                                                style={{ borderColor: opt.color }}
                                                            >
                                                                <span className="text-sm">{opt.icon}</span>
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Intensity Slider (Left) */}
                                                    <div className="absolute -left-8 top-0 bottom-0 w-6 flex items-center justify-center control-popup control-element">
                                                        <div className="h-32 w-2 bg-stone-200 rounded-full relative">
                                                            <div 
                                                                className="absolute bottom-0 left-0 right-0 bg-stone-500 rounded-full w-full"
                                                                style={{ height: `${task.energyPoints}%` }}
                                                            ></div>
                                                            <input 
                                                                type="range" min="0" max="100"
                                                                value={task.energyPoints}
                                                                onChange={(e) => {
                                                                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, energyPoints: parseInt(e.target.value) } : t));
                                                                }}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                                                                style={{ writingMode: 'vertical-lr', direction: 'rtl' }} // rudimentary vertical interaction
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* Top Resize Handle (Invisible Area) */}
                                            {!isPreview && (
                                                <div 
                                                    className="absolute top-0 left-0 w-full h-3 cursor-ns-resize z-30"
                                                    onMouseDown={(e) => handleResizeTopStart(e, task)}
                                                ></div>
                                            )}

                                            {/* Copy Handles */}
                                            {!isPreview && (
                                                <>
                                                    <div className="absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize z-30" onMouseDown={(e) => handleCopyDragStart(e, task, 'left')}></div>
                                                    <div className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize z-30" onMouseDown={(e) => handleCopyDragStart(e, task, 'right')}></div>
                                                </>
                                            )}

                                            {/* Content */}
                                            <div className="flex justify-between items-start h-full relative pointer-events-none">
                                                <input 
                                                    value={task.title}
                                                    onChange={(e) => updateTaskTitle(task.id, e.target.value)}
                                                    onMouseDown={(e) => e.stopPropagation()} 
                                                    className={`
                                                        w-full bg-transparent outline-none font-extrabold leading-tight text-[10px] pointer-events-auto
                                                        ${task.completed ? 'line-through decoration-1 opacity-70' : 'text-strong'}
                                                    `}
                                                    style={{ color: styles.color }}
                                                />

                                                <button 
                                                    className="pointer-events-auto shrink-0 ml-1 control-element"
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => { 
                                                        if (isPreview) return;
                                                        e.stopPropagation(); 
                                                        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t)); 
                                                    }}
                                                >
                                                    {task.completed ? <CheckCircle2 size={12}/> : <Circle size={12} />}
                                                </button>
                                            </div>
                                            
                                            {/* Bottom Resize Handle (Invisible Area) */}
                                            {!isPreview && (
                                                <div 
                                                    className="absolute bottom-0 left-0 w-full h-3 cursor-ns-resize z-20"
                                                    onMouseDown={(e) => handleResizeStart(e, task)}
                                                ></div>
                                            )}
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
    <div className="h-screen w-screen flex overflow-hidden text-stone-700 select-none" onClick={handleBackgroundClick}>
      {renderStickerLayer()}
      {renderTypeSelector()}
      {renderFloatingChecklist()}
      
      {/* Ghost for Dragging */}
      {draggedTask && (
        <div 
            className="fixed pointer-events-none z-[70] p-3 bg-white/90 rounded-lg shadow-2xl w-48 border border-stone-200"
            style={{ left: dragPosition.x, top: dragPosition.y }}
        >
            <span className="font-bold letterpress">{draggedTask.title}</span>
        </div>
      )}

      {/* LEFT PANEL */}
      <div 
        id="backlog-area"
        className="w-80 h-full flex flex-col p-6 z-40 relative no-print shrink-0 bg-stone-50/50 backdrop-blur-sm"
      >
        <div className="mb-6">
            <h1 className="text-2xl font-black letterpress-title mb-1">DoodlePlan</h1>
            <p className="text-xs text-stone-600 font-bold tracking-widest uppercase letterpress">Daily Organizer</p>
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
                    const styles = getEnergyColorStyles(task.type, task.energyPoints);
                    if (draggedTask?.id === task.id) return null;
                    return (
                        <div 
                            key={task.id}
                            onMouseDown={(e) => { e.stopPropagation(); setDragStart({ task, x: e.clientX, y: e.clientY }); }}
                            onClick={(e) => { e.stopPropagation(); setSelectedTaskId(task.id); }}
                            onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                            className={`p-3 rounded-lg cursor-grab hover:shadow-md transition-all border border-stone-100 bg-opacity-80`}
                            style={styles}
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
      <style>{`
          @keyframes popIn {
              from { opacity: 0; transform: scale(0.5) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .animate-pop-in {
              animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
      `}</style>
    </div>
  );
}
