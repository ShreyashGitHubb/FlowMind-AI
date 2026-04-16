'use client';

import React, { useState } from 'react';
import { useStadiumSimulation } from '@/lib/simulator';
import StadiumMap from '@/components/StadiumMap';
import AutopilotPanel from '@/components/AutopilotPanel';
import { Activity, BarChart3, Users, Zap, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const simulationState = useStadiumSimulation(800);
  const [predictiveMode, setPredictiveMode] = useState(false);
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);

  return (
    <main className="flex flex-col h-screen bg-[#050505] text-foreground p-6 gap-6 overflow-hidden">
      {/* Header Stat Bar */}
      <header className="flex items-center justify-between glass p-4 rounded-2xl border-white/5 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary neon-glow">
               <Zap size={20} />
             </div>
             <div>
               <h1 className="text-lg font-black tracking-tighter uppercase leading-none">FlowMind AI</h1>
               <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Predictive Crowd Autopilot</p>
             </div>
          </div>
          
          <div className="h-8 w-px bg-white/10 mx-2" />
          
          <div className="flex gap-8">
            <StatItem icon={<Users size={16}/>} label="Live Attendance" value={simulationState.agents.length.toString()} />
            <StatItem icon={<Activity size={16}/>} label="Current Intensity" value={`${Math.min(100, simulationState.agents.length / 10).toFixed(0)}%`} />
            <StatItem icon={<BarChart3 size={16}/>} label="Active Bottlenecks" value={simulationState.zones.filter(z => z.currentCount > z.capacity * 0.8).length.toString()} />
            <StatItem icon={<Calendar size={16}/>} label="Event Phase" value={simulationState.phase.replace('-', ' ')} highlight />
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Prediction Toggle */}
           <div className="flex items-center gap-2 p-1 bg-white/5 rounded-full border border-white/5">
              <button 
                onClick={() => setPredictiveMode(false)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${!predictiveMode ? 'bg-primary text-primary-foreground neon-glow' : 'opacity-40 hover:opacity-100'}`}
              >
                Live View
              </button>
              <button 
                onClick={() => setPredictiveMode(true)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${predictiveMode ? 'bg-secondary text-secondary-foreground shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'opacity-40 hover:opacity-100'}`}
              >
                Predicted (T+5)
              </button>
           </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left: Map */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-4">
           <StadiumMap 
             agents={simulationState.agents} 
             zones={simulationState.zones} 
             predictiveMode={predictiveMode} 
           />
           
           {/* Event Log / Timeline */}
           <div className="glass h-24 rounded-2xl border-white/5 p-4 flex items-center gap-6 overflow-x-auto no-scrollbar">
              <TimelineEvent time="14:00" label="Entry Surge Detected" status="active" color="primary" />
              <TimelineEvent time="14:30" label="Gate B Efficiency Drop" status="resolved" />
              <TimelineEvent time="15:15" label="Halftime Rush Pred." status="incoming" color="secondary" />
           </div>
        </section>

        {/* Right: Autopilot Panel */}
        <aside className="col-span-12 lg:col-span-4 min-h-0">
          <AutopilotPanel 
            simulationState={simulationState} 
            isAutopilotActive={isAutopilotActive}
            onToggleAutopilot={() => setIsAutopilotActive(!isAutopilotActive)}
          />
        </aside>
      </div>

      {/* Footer Branding */}
      <footer className="flex items-center justify-between px-2 opacity-30">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Stadium Command v1.5_PRO</span>
        <div className="flex gap-4 text-[10px] font-bold">
           <span>SYSTEM_STABLE</span>
           <span>GEMINI_LINK_OK</span>
        </div>
      </footer>
    </main>
  );
}

function StatItem({ icon, label, value, highlight = false }: { icon: React.ReactNode, label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="opacity-40">{icon}</div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">{label}</p>
        <p className={`text-sm font-black uppercase ${highlight ? 'text-primary' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
}

function TimelineEvent({ time, label, status, color = 'white' }: { time: string, label: string, status: string, color?: string }) {
  return (
    <div className="flex-shrink-0 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium opacity-40 font-mono">{time}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${color === 'primary' ? 'bg-primary' : color === 'secondary' ? 'bg-secondary' : 'bg-white/40'}`} />
      </div>
      <p className="text-xs font-black uppercase whitespace-nowrap">{label}</p>
      <span className="text-[9px] font-bold uppercase opacity-30">{status}</span>
    </div>
  );
}
