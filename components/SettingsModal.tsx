
import React from 'react';
import { X, Save, Clock, Battery } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  wakingStart: number;
  wakingEnd: number;
  onSave: (start: number, end: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, wakingStart, wakingEnd, onSave }) => {
  const [start, setStart] = React.useState(wakingStart);
  const [end, setEnd] = React.useState(wakingEnd);

  const handleSave = () => {
      if (start >= end) {
          alert("Start time must be before end time!");
          return;
      }
      onSave(start, end);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="soft-card p-8 w-full max-w-sm relative flex flex-col gap-6">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
            <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-2xl font-bold text-stone-700 letterpress-title">Settings</h2>

        <div className="space-y-6">
            <div>
                <h3 className="flex items-center gap-2 font-bold text-stone-600 mb-4 text-sm uppercase tracking-wider letterpress">
                    <Clock size={16} /> Waking Hours
                </h3>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">Wake Up (24h)</label>
                        <input 
                            type="number" min="0" max="23"
                            value={start}
                            onChange={(e) => setStart(parseInt(e.target.value))}
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg text-center font-mono font-bold text-lg focus:border-stone-400 outline-none"
                        />
                    </div>
                    <span className="mt-6 text-stone-300">—</span>
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">Sleep (24h)</label>
                        <input 
                            type="number" min="0" max="24"
                            value={end}
                            onChange={(e) => setEnd(parseInt(e.target.value))}
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg text-center font-mono font-bold text-lg focus:border-stone-400 outline-none"
                        />
                    </div>
                </div>
            </div>
            
            <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 text-xs text-stone-600 leading-relaxed">
                <Battery className="inline mr-1 text-yellow-500" size={14} /> 
                Daily Energy Budget is fixed at <strong className="text-stone-800">100 pts</strong>. Plan wisely!
            </div>
        </div>

        <button 
            onClick={handleSave}
            className="w-full py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 text-sm uppercase tracking-wider"
        >
            <Save size={16} /> Save
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
