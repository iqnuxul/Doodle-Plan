
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Task, EnergyType } from '../types';
import { Battery, Info } from 'lucide-react';

interface EnergyFlowChartProps {
  tasks: Task[];
  date: Date;
  startHour: number;
  endHour: number;
}

const COLORS = {
  [EnergyType.CHORE]: '#8d6e63', // Brown
  [EnergyType.CREATE]: '#4fc3f7', // Blue
  [EnergyType.FUN]: '#fff176',    // Yellow
  [EnergyType.HEAL]: '#81c784',   // Green
};

const STROKE_COLORS = {
  [EnergyType.CHORE]: '#5d4037',
  [EnergyType.CREATE]: '#0288d1',
  [EnergyType.FUN]: '#fbc02d',
  [EnergyType.HEAL]: '#388e3c',
};

const EnergyFlowChart: React.FC<EnergyFlowChartProps> = ({ tasks, date, startHour, endHour }) => {
  const chartData = useMemo(() => {
    const dataPoints = [];
    const dateStr = date.toISOString().split('T')[0];
    const daysTasks = tasks.filter(t => t.date === dateStr);

    for (let h = startHour; h <= endHour; h++) {
      let chore = 0;
      let create = 0;
      let fun = 0;
      let heal = 0;

      daysTasks.forEach(t => {
        if (t.startTime === undefined) return;
        const start = t.startTime;
        const end = start + t.duration;
        const overlap = Math.max(0, Math.min(end, h + 1) - Math.max(start, h));
        
        if (overlap > 0) {
          const intensity = Math.abs(t.energyPoints) / t.duration;
          const val = intensity * overlap;
          if (t.type === EnergyType.CHORE) chore += val;
          else if (t.type === EnergyType.CREATE) create += val;
          else if (t.type === EnergyType.FUN) fun += val;
          else if (t.type === EnergyType.HEAL) heal += val;
        }
      });

      dataPoints.push({
        hour: h,
        label: `${h}`,
        [EnergyType.CHORE]: chore,
        [EnergyType.CREATE]: create,
        [EnergyType.FUN]: fun,
        [EnergyType.HEAL]: heal,
      });
    }
    return dataPoints;
  }, [tasks, date, startHour, endHour]);

  const stats = useMemo(() => {
    const totalChore = chartData.reduce((acc, curr) => acc + curr[EnergyType.CHORE], 0);
    const totalCreate = chartData.reduce((acc, curr) => acc + curr[EnergyType.CREATE], 0);
    const totalFun = chartData.reduce((acc, curr) => acc + curr[EnergyType.FUN], 0);
    const totalHeal = chartData.reduce((acc, curr) => acc + curr[EnergyType.HEAL], 0);

    const depleting = totalChore + totalCreate;
    const restoring = totalFun + totalHeal;
    const total = depleting + restoring;
    
    let message = "Day is empty";
    let statusColor = "text-stone-400";
    
    if (total > 0) {
        const ratio = restoring / (depleting || 1);
        if (ratio > 1.2) { message = "Restorative Flow 🌿"; statusColor = "text-green-600"; }
        else if (ratio >= 0.8) { message = "Perfectly Balanced ✨"; statusColor = "text-yellow-600"; }
        else { message = "Heavy Load 🏋️"; statusColor = "text-stone-600"; }
    }

    return { message, statusColor };
  }, [chartData]);

  return (
    <div className="bg-white/60 p-4 rounded-xl border border-white/60 shadow-sm relative overflow-hidden group">
      <div className="flex justify-between items-center mb-2 z-10 relative">
        <h3 className="font-bold text-xs text-stone-600 letterpress uppercase tracking-wider flex items-center gap-1">
            <Battery size={14} className={stats.statusColor} /> Energy Flow
        </h3>
        <span className={`text-[10px] font-black uppercase tracking-widest ${stats.statusColor} bg-white/50 px-2 py-0.5 rounded-full border border-stone-100 shadow-sm`}>
            {stats.message}
        </span>
      </div>

      <div className="h-32 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradChore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[EnergyType.CHORE]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS[EnergyType.CHORE]} stopOpacity={0.4}/>
              </linearGradient>
              <linearGradient id="gradCreate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[EnergyType.CREATE]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS[EnergyType.CREATE]} stopOpacity={0.4}/>
              </linearGradient>
              <linearGradient id="gradFun" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[EnergyType.FUN]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS[EnergyType.FUN]} stopOpacity={0.4}/>
              </linearGradient>
              <linearGradient id="gradHeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[EnergyType.HEAL]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS[EnergyType.HEAL]} stopOpacity={0.4}/>
              </linearGradient>
            </defs>
            
            <XAxis 
                dataKey="hour" 
                hide={true} 
            />
            <YAxis hide={true} />
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '8px', 
                    border: '1px solid #e7e5e4',
                    fontFamily: 'Cutive Mono',
                    fontSize: '10px',
                    boxShadow: '4px 4px 0px rgba(0,0,0,0.05)'
                }}
                itemStyle={{ padding: 0 }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#44403c' }}
            />
            
            {/* Stacked Areas - Order matters: Bottom to Top */}
            <Area 
                type="natural" 
                dataKey={EnergyType.CHORE} 
                stackId="1" 
                stroke={STROKE_COLORS[EnergyType.CHORE]} 
                fill="url(#gradChore)" 
                strokeWidth={2}
                animationDuration={1000}
            />
            <Area 
                type="natural" 
                dataKey={EnergyType.CREATE} 
                stackId="1" 
                stroke={STROKE_COLORS[EnergyType.CREATE]} 
                fill="url(#gradCreate)" 
                strokeWidth={2}
                animationDuration={1000}
            />
            <Area 
                type="natural" 
                dataKey={EnergyType.FUN} 
                stackId="1" 
                stroke={STROKE_COLORS[EnergyType.FUN]} 
                fill="url(#gradFun)" 
                strokeWidth={2}
                animationDuration={1000}
            />
            <Area 
                type="natural" 
                dataKey={EnergyType.HEAL} 
                stackId="1" 
                stroke={STROKE_COLORS[EnergyType.HEAL]} 
                fill="url(#gradHeal)" 
                strokeWidth={2}
                animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Background texture for the chart area */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] mix-blend-multiply"></div>
      </div>
      
      {/* Legend/Status */}
      <div className="flex justify-between items-center mt-2 px-1">
          <div className="flex gap-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#8d6e63]"></div><span className="text-[9px] text-stone-500 font-bold">Chore</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#4fc3f7]"></div><span className="text-[9px] text-stone-500 font-bold">Create</span></div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#fff176]"></div><span className="text-[9px] text-stone-500 font-bold">Fun</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#81c784]"></div><span className="text-[9px] text-stone-500 font-bold">Heal</span></div>
          </div>
      </div>
    </div>
  );
};

export default EnergyFlowChart;
