import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ListTodo, 
  Plus, 
  ShoppingBag, 
  ChefHat, 
  Briefcase, 
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
  Sticker
} from 'lucide-react';
import { Task, TaskType, ExpenseSummary, Achievement } from './types';
import SketchPad from './components/SketchPad';
import StatsModal from './components/StatsModal';
import EditTaskModal from './components/EditTaskModal';
import { GoogleGenAI } from "@google/genai";

// --- Mock Data & Helpers ---

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Buy Milk', type: TaskType.SHOPPING, cost: 4.50, completed: false, description: 'Need for pancakes' },
  { id: '2', title: 'Finish Report', type: TaskType.WORK, completed: false, duration: 2 },
  { id: '3', title: 'Mom Birthday', type: TaskType.EVENT, completed: false, date: new Date().toISOString().split('T')[0] },
];

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getIconForType = (type: TaskType) => {
  switch (type) {
    case TaskType.MEAL: return <ChefHat size={16} className="text-orange-600/80" />;
    case TaskType.SHOPPING: return <ShoppingBag size={16} className="text-green-600/80" />;
    case TaskType.WORK: return <Briefcase size={16} className="text-blue-600/80" />;
    case TaskType.EVENT: return <Sparkles size={16} className="text-purple-600/80" />;
    default: return <Circle size={16} className="text-stone-600/80" />;
  }
};

// Updated colors to be softer/pastel
const getColorForType = (type: TaskType) => {
   switch (type) {
    case TaskType.MEAL: return 'bg-orange-50 border-orange-200 text-stone-700';
    case TaskType.SHOPPING: return 'bg-green-50 border-green-200 text-stone-700';
    case TaskType.WORK: return 'bg-blue-50 border-blue-200 text-stone-700';
    case TaskType.EVENT: return 'bg-purple-50 border-purple-200 text-stone-700';
    default: return 'bg-stone-50 border-stone-200 text-stone-700';
  }
};

export default function App() {
  const [view, setView] = useState<'month' | 'week'>('week');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date()); // For live time indicator
  
  // UI State
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showSketchPad, setShowSketchPad] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [stickerLibrary, setStickerLibrary] = useState<string[]>([]);
  
  // Drag and Drop State
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState<{ date?: string, hour?: number, type: 'cell' | 'backlog' } | null>(null);

  // Gamification State
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Derived Data
  const backlog = useMemo(() => tasks.filter(t => !t.date), [tasks]);
  
  const currentWeekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day; 
    return new Date(d.setDate(diff));
  }, [currentDate]);

  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  // --- Effects ---

  // Update "Now" every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Achievement Check
  useEffect(() => {
    const completedCount = tasks.filter(t => t.completed).length;
    const shoppingSpent = tasks.filter(t => t.type === TaskType.SHOPPING && t.completed).reduce((sum, t) => sum + (t.cost || 0), 0);

    const newAchievements: Achievement[] = [];
    
    if (completedCount >= 5 && !achievements.find(a => a.id === 'task-master')) {
       newAchievements.push({
           id: 'task-master',
           title: 'Task Master',
           description: 'Completed 5 tasks!',
           icon: '🏆',
           unlockedAt: Date.now()
       });
    }

    if (shoppingSpent > 50 && !achievements.find(a => a.id === 'big-spender')) {
        newAchievements.push({
            id: 'big-spender',
            title: 'Big Spender',
            description: 'Invested over $50 in supplies.',
            icon: '💸',
            unlockedAt: Date.now()
        });
    }

    if (newAchievements.length > 0) {
        setAchievements(prev => [...prev, ...newAchievements]);
        setTimeout(() => alert(`🌟 New Star Unlocked: ${newAchievements[0].title}!`), 100);
    }
  }, [tasks, achievements]);

  // Global Drag Listeners
  useEffect(() => {
    if (draggedTask) {
        const handleMouseMove = (e: MouseEvent) => {
            setDragPosition({ x: e.clientX, y: e.clientY });
            
            const elements = document.elementsFromPoint(e.clientX, e.clientY);
            
            if (elements.some(el => el.id === 'backlog-area')) {
                setDropTarget({ type: 'backlog' });
                return;
            }

            const target = elements.find(el => el.getAttribute('data-drop-target') === 'true');
            
            if (target) {
                const date = target.getAttribute('data-date') || undefined;
                const hourStr = target.getAttribute('data-hour');
                const hour = hourStr ? parseInt(hourStr) : undefined;
                setDropTarget({ date, hour, type: 'cell' });
            } else {
                setDropTarget(null);
            }
        };

        const handleMouseUp = () => {
            if (dropTarget) {
                let taskToUpdate = draggedTask;
                let isNew = false;

                // If it's a new sticker being dragged
                if (draggedTask.id === 'new-sticker-drag') {
                    taskToUpdate = {
                        ...draggedTask,
                        id: Math.random().toString(36).substr(2, 9) // Generate real ID
                    };
                    isNew = true;
                }

                if (dropTarget.type === 'backlog') {
                    const updatedTask = { ...taskToUpdate, date: undefined, startTime: undefined };
                    if (isNew) setTasks(prev => [...prev, updatedTask]);
                    else setTasks(prev => prev.map(t => t.id === taskToUpdate.id ? updatedTask : t));
                } else if (dropTarget.type === 'cell' && dropTarget.date) {
                    const updatedTask = { ...taskToUpdate, date: dropTarget.date, startTime: dropTarget.hour };
                    if (isNew) setTasks(prev => [...prev, updatedTask]);
                    else setTasks(prev => prev.map(t => t.id === taskToUpdate.id ? updatedTask : t));
                }
            }
            setDraggedTask(null);
            setDropTarget(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }
  }, [draggedTask, dropTarget]);

  // --- Handlers ---

  const addTask = (title: string, type: TaskType, cost: number = 0) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      type,
      completed: false,
      cost,
      duration: 1
    };

    if (type === TaskType.MEAL) {
      const confirmShop = window.confirm(`For "${title}", do you need to add ingredients to your shopping list?`);
      if (confirmShop) {
        const ingredients = prompt("What ingredients? (comma separated)");
        if (ingredients) {
            const items = ingredients.split(',').map(i => i.trim());
            const shoppingTasks = items.map(item => ({
                id: Math.random().toString(36).substr(2, 9),
                title: `Buy ${item}`,
                type: TaskType.SHOPPING,
                completed: false,
                cost: 0, 
                description: `For ${title}`
            }));
            setTasks(prev => [...prev, newTask, ...shoppingTasks]);
            return;
        }
      }
    }
    setTasks(prev => [...prev, newTask]);
  };

  const handleDragStart = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    e.preventDefault(); 
    setDraggedTask(task);
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const handleSaveStickerToLibrary = (imageUrl: string) => {
    setStickerLibrary(prev => [...prev, imageUrl]);
    // Also optionally add to current board if desired, or just library
  };

  const handleUpdateTask = (updatedTask: Task) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const expenses = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach(t => {
        if (t.cost) {
            map[t.type] = (map[t.type] || 0) + t.cost;
        }
    });
    return Object.keys(map).map(k => ({ category: k as TaskType, total: map[k] }));
  }, [tasks]);

  // --- Renderers ---

  const renderGhost = () => {
    if (!draggedTask) return null;
    return (
        <div 
            className="fixed pointer-events-none z-50 p-3 bg-white/90 pencil-border shadow-2xl transform -translate-x-1/2 -translate-y-1/2 rotate-3 w-48 flex items-center gap-2"
            style={{ left: dragPosition.x, top: dragPosition.y }}
        >
            {draggedTask.isSticker ? (
                 <img src={draggedTask.imageUrl} className="w-8 h-8 object-contain" />
            ) : (
                <>
                    {getIconForType(draggedTask.type)}
                    <span className="font-bold truncate">{draggedTask.title}</span>
                </>
            )}
        </div>
    );
  };

  const renderBacklog = () => (
    <div 
        id="backlog-area"
        className={`fixed left-0 top-0 h-full bg-[#fdfbf7] border-r-2 border-stone-600 shadow-lg transition-all duration-300 z-20 flex flex-col ${isSidebarOpen ? 'w-80' : 'w-12 overflow-hidden'} ${dropTarget?.type === 'backlog' ? 'bg-blue-50/50 ring-inset ring-4 ring-blue-100' : ''}`}
    >
      <div className="p-4 flex justify-between items-center bg-stone-100/50 border-b-2 border-stone-300">
        {isSidebarOpen && <h2 className="text-xl font-bold tracking-tight">Backlog & Tools</h2>}
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-stone-200 rounded">
            <Menu />
        </button>
      </div>

      {isSidebarOpen && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Quick Add */}
            <div className="bg-white p-3 pencil-box">
                <h3 className="font-bold mb-2 text-stone-600">New Plan</h3>
                <div className="flex gap-2 mb-2">
                    <input id="newTaskTitle" type="text" placeholder="What to do?" className="w-full p-1 border-b-2 border-stone-300 focus:outline-none focus:border-stone-500 bg-transparent" />
                </div>
                <div className="flex gap-2">
                    <select id="newTaskType" className="p-1 border border-stone-300 rounded-sm text-sm bg-transparent outline-none">
                        <option value={TaskType.WORK}>Work</option>
                        <option value={TaskType.MEAL}>Meal</option>
                        <option value={TaskType.SHOPPING}>Buy</option>
                        <option value={TaskType.CHORE}>Chore</option>
                    </select>
                    <button 
                        onClick={() => {
                            const input = document.getElementById('newTaskTitle') as HTMLInputElement;
                            const select = document.getElementById('newTaskType') as HTMLSelectElement;
                            if(input.value) {
                                addTask(input.value, select.value as TaskType, select.value === TaskType.SHOPPING ? 10 : 0);
                                input.value = '';
                            }
                        }}
                        className="bg-blue-100 px-3 rounded-sm border border-stone-600 hover:bg-blue-200 font-bold text-sm"
                    >
                        Add
                    </button>
                </div>
            </div>

             {/* Sticker Library */}
             <div className="bg-yellow-50/50 p-3 pencil-box">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-stone-600 flex items-center gap-2"><Sticker size={18}/> My Stickers</h3>
                    <button onClick={() => setShowSketchPad(true)} className="text-xs bg-yellow-200 px-2 py-1 rounded hover:bg-yellow-300 border border-stone-600 font-bold">+ New</button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {stickerLibrary.length === 0 && <div className="col-span-4 text-xs text-stone-400 italic text-center py-2">No stickers yet</div>}
                    {stickerLibrary.map((url, idx) => (
                        <div 
                            key={idx} 
                            className="aspect-square bg-white border border-stone-200 rounded p-1 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                            onMouseDown={(e) => handleDragStart(e, { 
                                id: 'new-sticker-drag', 
                                title: 'Sticker', 
                                type: TaskType.EVENT, 
                                completed: false, 
                                isSticker: true, 
                                imageUrl: url 
                            })}
                        >
                            <img src={url} alt="sticker" className="w-full h-full object-contain pointer-events-none" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Backlog List */}
            <div>
                <h3 className="font-bold mb-2 flex items-center gap-2 text-stone-600"><ListTodo size={18}/> Unscheduled</h3>
                <div className="space-y-2">
                    {backlog.map(task => {
                        // Hide original if dragging
                        if (draggedTask?.id === task.id) return null;
                        
                        return (
                            <div 
                                key={task.id}
                                onMouseDown={(e) => handleDragStart(e, task)}
                                onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                                className="p-3 bg-white pencil-box cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform"
                            >
                                <div className="flex justify-between items-start">
                                    <span className={task.completed ? 'line-through text-stone-400' : 'text-stone-700'}>{task.title}</span>
                                    {getIconForType(task.type)}
                                </div>
                                {task.type === TaskType.SHOPPING && (
                                    <div className="text-xs text-stone-500 mt-1 flex justify-between">
                                        <span>${task.cost}</span>
                                        {task.description && <span>For: {task.description.replace('For ', '')}</span>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {backlog.length === 0 && <div className="text-stone-400 text-sm text-center italic">Nothing in the backlog!</div>}
                </div>
            </div>

            {/* Tools */}
            <div className="pt-4 border-t-2 border-stone-300 space-y-3">
                <button 
                    onClick={() => setShowStats(true)}
                    className="w-full py-3 bg-green-50 pencil-box font-bold text-lg hover:bg-green-100 flex items-center justify-center gap-2 text-stone-700"
                >
                    <Star size={20} /> My Stats
                </button>
            </div>
        </div>
      )}
    </div>
  );

  const renderMonthView = () => {
    const startDay = new Date(currentMonthStart).getDay();
    const blanks = Array.from({ length: startDay });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    // Check if today is in the current month view
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

    return (
        <div className="grid grid-cols-7 gap-2 p-4 h-full overflow-y-auto">
            {DAYS.map(d => <div key={d} className="text-center font-bold text-stone-500">{d}</div>)}
            
            {blanks.map((_, i) => <div key={`blank-${i}`} className="h-32 bg-stone-100/50 rounded-lg border border-stone-200 opacity-50"></div>)}
            
            {days.map(day => {
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const daysTasks = tasks.filter(t => t.date === dateStr);
                const importantTasks = daysTasks.filter(t => t.type === TaskType.EVENT || t.isSticker || t.title.includes("Birthday") || t.title.includes("Deadline"));
                const isTarget = dropTarget?.type === 'cell' && dropTarget.date === dateStr;
                const isToday = isCurrentMonth && day === today.getDate();

                return (
                    <div 
                        key={day} 
                        data-drop-target="true"
                        data-date={dateStr}
                        className={`min-h-[8rem] bg-white pencil-box p-1 relative transition-all ${isTarget ? 'bg-blue-50 scale-[1.02] ring-2 ring-blue-200' : 'hover:shadow-md'} ${isToday ? 'border-red-400 ring-2 ring-red-100 bg-red-50/20' : ''}`}
                    >
                        <span className={`absolute top-1 right-2 font-bold pointer-events-none ${isToday ? 'text-red-500' : 'text-stone-400'}`}>{day}</span>
                        {isToday && <span className="absolute top-1 left-2 text-[10px] text-red-400 font-bold uppercase">Today</span>}
                        <div className="mt-6 flex flex-col gap-1">
                            {importantTasks.map(task => {
                                if (draggedTask?.id === task.id) return null; // Hide if dragging
                                return task.isSticker ? (
                                    <img 
                                        key={task.id} 
                                        onMouseDown={(e) => handleDragStart(e, task)} 
                                        onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                                        src={task.imageUrl} 
                                        alt="sticker" 
                                        className="w-12 h-12 object-contain mx-auto transform -rotate-6 hover:rotate-0 transition-transform cursor-grab" 
                                    />
                                ) : (
                                    <div 
                                        key={task.id} 
                                        onMouseDown={(e) => handleDragStart(e, task)} 
                                        onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                                        className="text-xs bg-purple-50 p-1 pencil-border text-stone-700 truncate cursor-grab hover:bg-purple-100"
                                    >
                                        {task.title}
                                    </div>
                                );
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
    const startMinutes = HOURS[0] * 60;
    const endMinutes = (HOURS[HOURS.length - 1] + 1) * 60;
    const isTimeInView = nowMinutes >= startMinutes && nowMinutes <= endMinutes;
    // 5rem (h-20) per hour = 5rem / 60min = 0.0833rem per minute
    const timeTopRem = (nowMinutes - startMinutes) * (5 / 60);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-8 border-b-2 border-stone-400 bg-stone-100/50">
                <div className="p-2 border-r border-stone-300"></div>
                {weekDates.map(d => {
                    const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    return (
                        <div key={d.toISOString()} className={`p-2 text-center border-r border-stone-300 last:border-0 ${isToday ? 'bg-red-50/30' : ''}`}>
                            <div className={`text-xs font-bold ${isToday ? 'text-red-500' : 'text-stone-500'}`}>{DAYS[d.getDay()]}</div>
                            <div className={`text-xl font-bold ${isToday ? 'text-red-600' : ''}`}>{d.getDate()}</div>
                        </div>
                    );
                })}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto relative">
                <div className="grid grid-cols-8 relative">
                    {/* Time Column */}
                    <div className="col-span-1 border-r-2 border-stone-400 bg-white z-10">
                        {HOURS.map(h => (
                            <div key={h} className="h-20 border-b border-stone-200 text-xs text-stone-400 p-1 text-right pr-2">
                                {h}:00
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    {weekDates.map(d => {
                        const dateStr = d.toISOString().split('T')[0];
                        const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        
                        return (
                            <div key={dateStr} className={`col-span-1 border-r border-stone-300 last:border-0 relative ${isToday ? 'bg-red-50/10' : ''}`}>
                                {/* Current Time Line */}
                                {isToday && isTimeInView && (
                                    <div 
                                        className="absolute w-full border-t-2 border-red-500 z-30 pointer-events-none flex items-center"
                                        style={{ top: `${timeTopRem}rem` }}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
                                    </div>
                                )}

                                {HOURS.map(h => {
                                    const isTarget = dropTarget?.type === 'cell' && dropTarget.date === dateStr && dropTarget.hour === h;
                                    return (
                                        <div 
                                            key={h} 
                                            data-drop-target="true"
                                            data-date={dateStr}
                                            data-hour={h}
                                            className={`h-20 border-b border-stone-200 transition-colors ${isTarget ? 'bg-blue-50' : 'hover:bg-stone-50/50'}`}
                                        >
                                            {isTarget && (
                                                <div className="w-full h-full border-2 border-dashed border-blue-300 rounded opacity-50 pointer-events-none"></div>
                                            )}
                                        </div>
                                    );
                                })}
                                
                                {/* Render Placed Tasks */}
                                {tasks.filter(t => t.date === dateStr && t.startTime !== undefined).map(task => {
                                    if (draggedTask?.id === task.id) return null; // Hide original if dragging

                                    const top = (task.startTime! - HOURS[0]) * 5; // 5rem per hour (h-20 = 5rem)
                                    if (top < 0) return null; 
                                    
                                    return (
                                        <div 
                                            key={task.id}
                                            onMouseDown={(e) => handleDragStart(e, task)}
                                            onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                                            className={`absolute left-1 right-1 p-1 pencil-border shadow-sm text-xs cursor-grab active:cursor-grabbing overflow-hidden ${getColorForType(task.type)} ${task.completed ? 'opacity-50 grayscale' : ''}`}
                                            style={{ top: `${top}rem`, height: `${(task.duration || 1) * 5}rem` }}
                                        >
                                            <div className="flex justify-between">
                                                <span className="font-bold">{task.title}</span>
                                                <button onClick={(e) => { e.stopPropagation(); handleToggleComplete(task.id); }}>
                                                    {task.completed ? <CheckCircle2 size={12}/> : <Circle size={12} />}
                                                </button>
                                            </div>
                                            {task.type === TaskType.SHOPPING && <div>${task.cost}</div>}
                                            {task.isSticker && <img src={task.imageUrl} className="w-full h-full object-contain opacity-50 absolute top-0 left-0 -z-10" />}
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
    <div className="h-screen w-screen flex overflow-hidden text-stone-700 select-none">
      {renderBacklog()}
      {renderGhost()}

      <div className={`flex-1 flex flex-col h-full relative transition-all duration-300 ${isSidebarOpen ? 'ml-80' : 'ml-12'}`}>
        {/* Top Bar */}
        <div className="p-4 border-b-2 border-stone-400 flex justify-between items-center bg-[#fdfbf7] z-10 shadow-sm">
            <div className="flex items-center gap-4">
                <button onClick={() => {
                    const d = new Date(currentDate);
                    if(view === 'month') d.setMonth(d.getMonth() - 1);
                    else d.setDate(d.getDate() - 7);
                    setCurrentDate(d);
                }} className="hover:bg-stone-200 rounded-full p-1">
                    <ChevronLeft />
                </button>
                <h1 className="text-3xl font-bold tracking-tight">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h1>
                <button onClick={() => {
                    const d = new Date(currentDate);
                    if(view === 'month') d.setMonth(d.getMonth() + 1);
                    else d.setDate(d.getDate() + 7);
                    setCurrentDate(d);
                }} className="hover:bg-stone-200 rounded-full p-1">
                    <ChevronRight />
                </button>
            </div>

            <div className="flex gap-2">
                 <button 
                    onClick={() => { setView('month'); setCurrentDate(new Date()); }}
                    className={`px-4 py-2 rounded-sm pencil-border font-bold transition-transform ${view === 'month' ? 'bg-orange-100 translate-y-1' : 'bg-white hover:-translate-y-0.5'}`}
                 >
                    Month
                 </button>
                 <button 
                    onClick={() => { setView('week'); setCurrentDate(new Date()); }}
                    className={`px-4 py-2 rounded-sm pencil-border font-bold transition-transform ${view === 'week' ? 'bg-blue-100 translate-y-1' : 'bg-white hover:-translate-y-0.5'}`}
                 >
                    Week
                 </button>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden bg-[#fdfbf7]">
            {view === 'month' ? renderMonthView() : renderWeekView()}
        </div>
      </div>

      {showSketchPad && (
        <SketchPad 
            onClose={() => setShowSketchPad(false)} 
            onSave={handleSaveStickerToLibrary}
        />
      )}

      {showStats && (
        <StatsModal 
            onClose={() => setShowStats(false)}
            expenses={expenses}
            achievements={achievements}
        />
      )}
      
      {editingTask && (
        <EditTaskModal 
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={handleUpdateTask}
            onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}