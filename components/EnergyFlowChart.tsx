
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Task, EnergyType } from '../types';
import { Sparkles } from 'lucide-react';

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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayProfile {
    dayIndex: number; // 0-6 Sun-Sat
    dateStr: string;
    totalDuration: number;
    types: { type: EnergyType; value: number }[];
}

const SpikyBallCreature: React.FC<EnergyFlowChartProps> = ({ tasks, date }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 1. Process Data: Create Profiles for the Current Week
  const weekProfiles = useMemo(() => {
    const profiles: DayProfile[] = [];
    const currentDay = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - currentDay); // Go to Sunday

    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        const daysTasks = tasks.filter(t => t.date === dateStr);
        const typeCounts = {
            [EnergyType.CHORE]: 0,
            [EnergyType.CREATE]: 0,
            [EnergyType.FUN]: 0,
            [EnergyType.HEAL]: 0,
        };
        let total = 0;

        daysTasks.forEach(t => {
             typeCounts[t.type] += t.duration || 1;
             total += t.duration || 1;
        });

        // Sort: Descending order (Most -> Least)
        const sortedTypes = Object.entries(typeCounts)
            .map(([type, value]) => ({ type: type as EnergyType, value }))
            .sort((a, b) => b.value - a.value);

        profiles.push({
            dayIndex: i,
            dateStr,
            totalDuration: total,
            types: sortedTypes
        });
    }
    return profiles;
  }, [tasks, date]);

  const selectedProfile = weekProfiles.find(p => p.dateStr === date.toISOString().split('T')[0]) || weekProfiles[0];


  // 2. Mouse Tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            setMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);


  // 3. Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
        time += 0.05;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // --- Render Mini Creatures (Week History) ---
        const spacing = canvas.width / 7;
        weekProfiles.forEach((profile, i) => {
             // Skip rendering the currently selected one as a mini ball? 
             // Requirement says: "End of week: Results in six small balls + one large"
             // So we render all of them small, but the selected one is ALSO rendered big above.
             // Or we render the selected one differently. Let's render all small at bottom.
             const cx = spacing * i + spacing / 2;
             const cy = canvas.height - 30;
             const isSelected = profile.dateStr === date.toISOString().split('T')[0];
             
             // Draw Small Creature
             drawCreature(ctx, cx, cy, isSelected ? 18 : 12, profile, false, mousePos, time + i, 0.4);
             
             // Day Label
             ctx.fillStyle = isSelected ? '#44403c' : '#a8a29e';
             ctx.font = isSelected ? 'bold 10px monospace' : '9px monospace';
             ctx.textAlign = 'center';
             ctx.fillText(DAYS[i], cx, canvas.height - 5);
        });

        // --- Render Main Creature (Selected Day) ---
        // Center of the top area
        drawCreature(ctx, canvas.width / 2, 90, 60, selectedProfile, true, mousePos, time, 1.0);

        animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [weekProfiles, mousePos, date]);


  // --- Helper: Draw Creature ---
  const drawCreature = (
      ctx: CanvasRenderingContext2D, 
      cx: number, 
      cy: number, 
      baseRadius: number, 
      profile: DayProfile, 
      hasEyes: boolean,
      mouse: {x: number, y: number},
      t: number,
      opacity: number
  ) => {
      if (profile.totalDuration === 0) {
          // Sleeping/Ghost Creature
          ctx.beginPath();
          ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(200, 200, 200, ${opacity})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          
          if (hasEyes) {
             // Sleeping eyes
             ctx.beginPath();
             ctx.moveTo(cx - 10, cy);
             ctx.lineTo(cx - 4, cy + 4);
             ctx.moveTo(cx + 4, cy + 4);
             ctx.lineTo(cx + 10, cy);
             ctx.stroke();
          }
          return;
      }

      // 1. Spiky Body
      const types = profile.types;
      // Most dominant at center (index 0), Least dominant at tips (index 3 or last non-zero)
      // We want the gradient to go Center -> Tips
      // Center Color: types[0].type
      // Tip Color: types[lastWithData].type
      
      const centerColor = COLORS[types[0].type];
      
      // Fix: findLast is not supported in all environments (ES2023+), use reverse().find() instead
      const tipType = [...types].reverse().find(t => t.value > 0) || types[0];
      const tipColor = COLORS[tipType.type];

      const grad = ctx.createRadialGradient(cx, cy, baseRadius * 0.2, cx, cy, baseRadius * 1.2);
      grad.addColorStop(0, centerColor);
      grad.addColorStop(1, tipColor);

      ctx.fillStyle = grad;
      ctx.beginPath();
      
      const numPoints = hasEyes ? 60 : 20; // More detail for big one
      const spikeAmp = hasEyes ? 8 : 3; // Bigger spikes for big one

      for (let i = 0; i <= numPoints; i++) {
          const angle = (Math.PI * 2 * i) / numPoints;
          // Noise logic for spikes
          // High frequency sine + Low frequency breathe + Random jitter
          const noise = Math.sin(angle * 10 + t) * Math.cos(angle * 5 - t) * spikeAmp;
          const breathe = Math.sin(t * 2) * (baseRadius * 0.05);
          
          const r = baseRadius + noise + breathe;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 2. Eyes (Only for Main Creature)
      if (hasEyes) {
          const eyeOffset = baseRadius * 0.3;
          const eyeRadius = baseRadius * 0.22;
          const pupilRadius = eyeRadius * 0.4;

          const leftEyeCx = cx - eyeOffset;
          const rightEyeCx = cx + eyeOffset;
          const eyeCy = cy - baseRadius * 0.1;

          // Draw Whites
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(leftEyeCx, eyeCy, eyeRadius, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(rightEyeCx, eyeCy, eyeRadius, 0, Math.PI * 2); ctx.fill();

          // Calculate Pupil Position (Track Mouse)
          const limit = eyeRadius - pupilRadius - 2;
          
          const angleL = Math.atan2(mouse.y - eyeCy, mouse.x - leftEyeCx);
          const distL = Math.min(limit, Math.hypot(mouse.x - leftEyeCx, mouse.y - eyeCy));
          const pxL = leftEyeCx + Math.cos(angleL) * distL;
          const pyL = eyeCy + Math.sin(angleL) * distL;

          const angleR = Math.atan2(mouse.y - eyeCy, mouse.x - rightEyeCx);
          const distR = Math.min(limit, Math.hypot(mouse.x - rightEyeCx, mouse.y - eyeCy));
          const pxR = rightEyeCx + Math.cos(angleR) * distR;
          const pyR = eyeCy + Math.sin(angleR) * distR;

          // Draw Pupils
          ctx.fillStyle = '#1c1917';
          ctx.beginPath(); ctx.arc(pxL, pyL, pupilRadius, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(pxR, pyR, pupilRadius, 0, Math.PI * 2); ctx.fill();
          
          // Shine
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(pxL + 2, pyL - 2, pupilRadius * 0.4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(pxR + 2, pyR - 2, pupilRadius * 0.4, 0, Math.PI * 2); ctx.fill();
      }
  };

  return (
    <div className="bg-white/60 p-4 rounded-xl border border-white/60 shadow-sm relative overflow-hidden group" ref={containerRef}>
      <div className="flex justify-between items-center mb-1 z-10 relative">
        <h3 className="font-bold text-xs text-stone-600 letterpress uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={14} className="text-yellow-600" /> Energy Creature
        </h3>
      </div>

      <div className="w-full flex justify-center bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] rounded-lg shadow-inner bg-white/30">
        <canvas 
            ref={canvasRef} 
            width={280} 
            height={200}
            className="cursor-none"
        />
      </div>
      
      {/* Legend/Status */}
      <div className="flex justify-center items-center mt-2 px-1 gap-4">
           <div className="text-[9px] text-stone-500 font-bold flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full" style={{background: COLORS[EnergyType.CHORE]}}></div> Chore
           </div>
           <div className="text-[9px] text-stone-500 font-bold flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full" style={{background: COLORS[EnergyType.CREATE]}}></div> Create
           </div>
           <div className="text-[9px] text-stone-500 font-bold flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full" style={{background: COLORS[EnergyType.FUN]}}></div> Fun
           </div>
           <div className="text-[9px] text-stone-500 font-bold flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full" style={{background: COLORS[EnergyType.HEAL]}}></div> Heal
           </div>
      </div>
    </div>
  );
};

export default SpikyBallCreature;
