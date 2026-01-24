import React from 'react';
import { Star, TrendingUp, X, Trophy } from 'lucide-react';
import { ExpenseSummary, Achievement } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StatsModalProps {
  onClose: () => void;
  expenses: ExpenseSummary[];
  achievements: Achievement[];
}

const COLORS = ['#fca5a5', '#93c5fd', '#86efac', '#fde047', '#d8b4fe', '#fdba74'];

const StatsModal: React.FC<StatsModalProps> = ({ onClose, expenses, achievements }) => {
  const totalSpent = expenses.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border-4 border-stone-800 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-stone-100 rounded-full">
            <X className="w-6 h-6" />
        </button>

        <div className="text-center space-y-2">
            <h2 className="text-3xl font-marker text-stone-800">Monthly Wrap-Up!</h2>
            <p className="text-stone-500 text-lg">Here is how you did...</p>
        </div>

        {/* Mario Party Style Awards */}
        <div className="bg-indigo-50 p-4 rounded-xl border-2 border-indigo-200">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-indigo-800">
                <Star className="fill-yellow-400 text-stone-800" /> Star Achievements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.length === 0 ? (
                    <p className="text-stone-400 italic">No stars yet. Keep planning!</p>
                ) : (
                    achievements.map(ach => (
                        <div key={ach.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] animate-bounce-short">
                            <div className="text-2xl">{ach.icon}</div>
                            <div>
                                <div className="font-bold text-stone-800">{ach.title}</div>
                                <div className="text-xs text-stone-500">{ach.description}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Expenses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 relative">
                <h3 className="text-center font-bold mb-2">Spending by Category</h3>
                {totalSpent === 0 ? (
                     <div className="flex items-center justify-center h-full text-stone-400">No expenses recorded</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={expenses}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="total"
                            >
                                {expenses.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#1c1917" strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: '2px solid #000', fontFamily: 'Patrick Hand' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
            
            <div className="flex flex-col justify-center gap-4">
                <div className="bg-green-100 p-4 rounded-xl border-2 border-green-300 text-center">
                    <div className="text-sm text-green-800 font-bold uppercase tracking-wider">Total Spent</div>
                    <div className="text-4xl font-marker text-green-900">${totalSpent.toFixed(2)}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200 text-sm">
                    <p>Tip: "You spent heavily on Shopping this month. Maybe cook more?"</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StatsModal;