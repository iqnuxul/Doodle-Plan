
import React, { useState } from 'react';
import { X, Trash2, Save, Plus, CheckSquare, Square } from 'lucide-react';
import { Task, EnergyType } from '../types';

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
}

const ENERGY_OPTIONS = [
  { type: EnergyType.CHORE, icon: '🤎', label: 'Chore' },
  { type: EnergyType.FUN, icon: '💛', label: 'Fun' },
  { type: EnergyType.CREATE, icon: '🩵', label: 'Create' },
  { type: EnergyType.HEAL, icon: '💚', label: 'Heal' },
];

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

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="soft-card p-8 w-full max-w-lg relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
            <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-2xl font-bold text-stone-700 letterpress-title">Edit Task</h2>

        <div className="space-y-6">
            {/* Title */}
            <div>
                <label className="block text-stone-400 text-xs font-bold uppercase tracking-wider mb-2">Title</label>
                <input 
                    type="text" 
                    value={editedTask.title} 
                    onChange={e => handleChange('title', e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-stone-400 outline-none text-lg font-bold text-stone-700 letterpress"
                />
            </div>

            {/* Type & Energy */}
            <div>
                <div className="flex justify-between mb-2">
                    <label className="block text-stone-400 text-xs font-bold uppercase tracking-wider">Energy Category</label>
                    <label className="block text-stone-400 text-xs font-bold uppercase tracking-wider w-24 text-center">Points</label>
                </div>
                <div className="flex gap-3">
                    <div className="flex-1 grid grid-cols-4 gap-2">
                         {ENERGY_OPTIONS.map((opt) => (
                            <button
                                key={opt.type}
                                type="button"
                                onClick={() => handleChange('type', opt.type)}
                                className={`
                                    flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all
                                    ${editedTask.type === opt.type 
                                        ? 'border-stone-800 bg-stone-100 opacity-100 shadow-sm' 
                                        : 'border-transparent bg-stone-50 opacity-60 hover:opacity-100 hover:bg-stone-100'}
                                `}
                            >
                                <span className="text-xl mb-1">{opt.icon}</span>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${editedTask.type === opt.type ? 'text-stone-800' : 'text-stone-400'}`}>
                                    {opt.label}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="w-24">
                        <input 
                            type="number" 
                            value={editedTask.energyPoints} 
                            onChange={e => handleChange('energyPoints', parseInt(e.target.value))}
                            className="w-full h-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-stone-400 outline-none text-center font-mono font-bold text-lg text-stone-700"
                        />
                    </div>
                </div>
            </div>

            {/* Sub-steps */}
            <div>
                <label className="block text-stone-400 text-xs font-bold uppercase tracking-wider mb-2">Checklist</label>
                <div className="space-y-2 mb-3 bg-stone-50 p-3 rounded-lg border border-stone-100">
                    {editedTask.substeps.map(step => (
                        <div key={step.id} className="flex items-center gap-3 group">
                            <button onClick={() => toggleSubStep(step.id)} className="text-stone-400 hover:text-stone-600 transition-colors">
                                {step.completed ? <CheckSquare size={18} /> : <Square size={18} />}
                            </button>
                            <span className={`flex-1 text-sm ${step.completed ? 'line-through text-stone-300' : 'text-stone-600'}`}>
                                {step.title}
                            </span>
                            <button onClick={() => deleteSubStep(step.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    {editedTask.substeps.length === 0 && <div className="text-xs text-stone-300 italic text-center py-2">No sub-steps yet</div>}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newSubStep}
                        onChange={e => setNewSubStep(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddSubStep()}
                        placeholder="Add step..."
                        className="flex-1 p-2 border-b border-stone-200 outline-none bg-transparent text-sm placeholder-stone-300"
                    />
                    <button onClick={handleAddSubStep} className="p-2 hover:bg-stone-100 rounded-full text-stone-500">
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Duration */}
             <div>
                <label className="block text-stone-400 text-xs font-bold uppercase tracking-wider mb-2">Duration (Hours)</label>
                <input 
                    type="number" 
                    min="0.25"
                    step="0.25"
                    value={editedTask.duration} 
                    onChange={e => handleChange('duration', parseFloat(e.target.value))}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-stone-400 outline-none"
                />
            </div>

            {/* Notes */}
            <div>
                <label className="block text-stone-400 text-xs font-bold uppercase tracking-wider mb-2">Notes</label>
                <textarea 
                    value={editedTask.description || ''} 
                    onChange={e => handleChange('description', e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:border-stone-400 outline-none h-24 resize-none text-sm"
                    placeholder="Details..."
                />
            </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-6 border-t border-stone-100">
            <button 
                onClick={() => { onDelete(task.id); onClose(); }}
                className="flex items-center gap-2 text-stone-400 hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-all text-sm font-bold uppercase tracking-wider"
            >
                <Trash2 size={16} /> Delete
            </button>
            <button 
                onClick={() => { onSave(editedTask); onClose(); }}
                className="flex items-center gap-2 bg-stone-800 text-white px-8 py-3 rounded-xl hover:bg-stone-700 shadow-lg hover:shadow-xl transition-all text-sm font-bold uppercase tracking-wider"
            >
                <Save size={16} /> Save
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;
