import React, { useState } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import { Task, TaskType } from '../types';

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onClose, onSave, onDelete }) => {
  const [editedTask, setEditedTask] = useState<Task>({ ...task });

  const handleChange = (field: keyof Task, value: any) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-['Special_Elite']">
      <div className="bg-white pencil-box p-6 w-full max-w-md relative flex flex-col gap-4">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-stone-100 rounded-full">
            <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold text-stone-800 border-b-2 border-stone-200 pb-2">Edit Details</h2>

        <div className="space-y-4">
            <div>
                <label className="block text-stone-500 text-sm font-bold mb-1">Title</label>
                <input 
                    type="text" 
                    value={editedTask.title} 
                    onChange={e => handleChange('title', e.target.value)}
                    className="w-full p-2 border-b-2 border-stone-300 focus:border-stone-800 outline-none bg-transparent text-lg"
                />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-stone-500 text-sm font-bold mb-1">Type</label>
                    <select 
                        value={editedTask.type} 
                        onChange={e => handleChange('type', e.target.value)}
                        className="w-full p-2 border-2 border-stone-200 rounded-sm bg-stone-50 outline-none"
                    >
                        {Object.values(TaskType).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
                {editedTask.type === TaskType.SHOPPING && (
                    <div className="w-24">
                        <label className="block text-stone-500 text-sm font-bold mb-1">Cost ($)</label>
                        <input 
                            type="number" 
                            value={editedTask.cost || 0} 
                            onChange={e => handleChange('cost', parseFloat(e.target.value))}
                            className="w-full p-2 border-b-2 border-stone-300 focus:border-stone-800 outline-none bg-transparent"
                        />
                    </div>
                )}
            </div>

             <div>
                <label className="block text-stone-500 text-sm font-bold mb-1">Duration (Hours)</label>
                <input 
                    type="number" 
                    min="0.5"
                    step="0.5"
                    value={editedTask.duration || 1} 
                    onChange={e => handleChange('duration', parseFloat(e.target.value))}
                    className="w-full p-2 border-b-2 border-stone-300 focus:border-stone-800 outline-none bg-transparent"
                />
            </div>

            <div>
                <label className="block text-stone-500 text-sm font-bold mb-1">Notes</label>
                <textarea 
                    value={editedTask.description || ''} 
                    onChange={e => handleChange('description', e.target.value)}
                    className="w-full p-2 border-2 border-stone-200 rounded-sm bg-stone-50 outline-none h-24 resize-none"
                    placeholder="Add details here..."
                />
            </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-stone-200">
            <button 
                onClick={() => { onDelete(task.id); onClose(); }}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-sm transition-colors"
            >
                <Trash2 size={18} /> Delete
            </button>
            <button 
                onClick={() => { onSave(editedTask); onClose(); }}
                className="flex items-center gap-2 bg-stone-800 text-white px-6 py-2 rounded-sm hover:bg-stone-700 pencil-border border-white"
            >
                <Save size={18} /> Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;